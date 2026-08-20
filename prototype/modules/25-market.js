/* ============================================================
   SILVERWARE — module: market
   The other direction.

   The core's aiMarket() explicitly skips the human squad, so in a
   finished season not one club ever came for one of your players.
   There was a `listed` flag and a List button and nothing on earth
   read either of them. This module is the missing half:

     · AI clubs scan your squad every window and bid for it
     · the transfer list changes who is watching, visibly
     · an offer arrives as one decision on one sheet, never a loop
     · selling a man the room rates costs you something
     · the last week of a window is a flurry, not a new screen
     · and the board's pot can finally be split between fees and wages

   THE RULE THAT PROTECTS LONG SAVES. Every number a club is willing
   to pay comes out of value() via askingPrice(). Nothing in here ever
   reads a fee that was paid, ours or anybody's. No ratchet.
   ============================================================ */
(function(){
'use strict';

/* ---------- state ---------- */
const DEF={
  offers:[],      // open / countered bids for our players
  oid:1,
  told:false,     // has the manager been told what listing does
  ceil:0,         // wage ceiling agreed with the board, % of revenue
  potBase:0,      // this season's opening transfer budget — bounds the split
  moves:0,        // budget splits used this season (3 allowed)
  cashOut:0,      // wage room sold back for cash this season
  breachWk:-9,
  ledger:[],      // outgoing deals, newest first
  inFees:0,
  cool:{},        // pid -> week we last generated an approach
  seeded:0        // season the summer approaches were seeded for
};
function S(){
  const s=SW.state('market');
  for(const k in DEF){
    if(s[k]!==undefined)continue;
    const d=DEF[k];
    s[k]=Array.isArray(d)?[]:(d&&typeof d==='object')?{}:d;
  }
  return s;
}
const alive=()=>typeof G!=='undefined'&&G.clubs&&G.me!=null&&me();

/* ============================================================
   WHO IS WATCHING
   One pass over the world per week, cached. 140 clubs x 25 of ours
   is nothing if the per-club position table is built once.
   ============================================================ */
let CACHE={wk:-1,se:-1,sig:-1,pos:null,intr:null};

function listSig(c){let n=0;for(const p of squadOf(c))if(p.listed)n+=p.id+1;return n}

function scan(){
  const c=alive();if(!c)return null;
  const sig=listSig(c);
  if(CACHE.intr&&CACHE.wk===G.week&&CACHE.se===G.season&&CACHE.sig===sig)return CACHE;
  const pos=new Map();
  for(const b of G.clubs){
    if(b.id===G.me)continue;
    const m={};
    for(const p of squadOf(b)){const v=CA(p);if(!(m[p.pos]>=v))m[p.pos]=v}
    pos.set(b.id,m);
  }
  let unhappy=null;
  const mo=SW.get('morale');
  if(mo&&mo.unhappy){try{unhappy=new Set(mo.unhappy().map(p=>p.id))}catch(e){}}
  const intr={};
  for(const p of squadOf(c))intr[p.id]=watchers(p,pos,unhappy);
  CACHE={wk:G.week,se:G.season,sig,pos,intr};
  return CACHE;
}
function bust(){CACHE.intr=null}

/* Mood is a property of the player, not of the pairing — compute it once. */
function moodBump(p,unhappy){
  let s=0;
  if(unhappy&&unhappy.has(p.id))s+=16;
  if(p.morale<=22)s+=8;
  return s;
}
/* How badly one club wants one of ours. Positive means they are looking. */
function pairScore(p,b,bp,mood){
  const c=me();
  const theirs=(bp&&bp[p.pos])||0;
  let s=clamp((CA(p)-(theirs||42))*3.4,-45,48);   // does he improve their side
  if(p.listed)s+=36;                              // the list is the loudest signal
  if(p.years<=1)s+=18;                            // running his deal down
  s+=clamp((b.rep-me().rep)*0.9,-24,26);          // bigger clubs come calling
  if(p.age<=23&&p.pa-CA(p)>=8)s+=10;              // they can see a project
  if(p.age>=33)s-=18;
  if(p.out>3)s-=10;
  return s+mood;
}
/* A club only counts as a watcher if it could actually do the deal. */
function canCarry(b,p){
  return (wageBill(b)+Math.round(p.wage*1.12))*52/revenue(b)*100<=84;
}
function watchers(p,pos,unhappy){
  const c=me(),mood=moodBump(p,unhappy),out=[];
  let best=0;
  for(const b of G.clubs){
    if(b.id===G.me||b.bal<1.5e6)continue;
    const s=pairScore(p,b,pos.get(b.id),mood);
    if(s<38)continue;
    const ask=askingPrice(p,c,b);
    if(ask>b.bal*0.62)continue;
    if(!canCarry(b,p))continue;
    out.push({id:b.id,s});
    if(s>best)best=s;
  }
  out.sort((x,y)=>y.s-x.s);
  return {n:out.length,best,top:out.slice(0,8).map(x=>x.id)};
}
const LEVELS=[
  {k:'—',t:'Nobody is asking',c:'var(--t3)'},
  {k:'·',t:'One or two watching',c:'var(--t2)'},
  {k:'▪',t:'Several clubs watching',c:'var(--trf)'},
  {k:'▲',t:'They are queueing up',c:'var(--acc)'}
];
function level(n){return n===0?0:n<=2?1:n<=7?2:3}
function interestOf(pid){
  const sc=scan();if(!sc||!sc.intr[pid])return {n:0,best:0,top:[]};
  return sc.intr[pid];
}

/* ============================================================
   THE WINDOW
   Summer is week 0 only; January is weeks 19–21. The last week of
   each is deadline week: more clubs, more money, decide now.
   ============================================================ */
function isDeadline(){return (G.window==='summer'&&G.week===0)||G.week===21}

function wpick(list,wf){
  let t=0;const w=list.map(x=>{const v=Math.max(0.01,wf(x));t+=v;return v});
  let r=rnd()*t;
  for(let i=0;i<list.length;i++){r-=w[i];if(r<=0)return list[i]}
  return list[list.length-1];
}
/* Nobody may strip us to the bone by accident. */
function sellable(p,c){
  if(p.youth)return false;
  if(squadOf(c).length<=16)return false;
  const samePos=squadOf(c).filter(x=>x.pos===p.pos).length;
  if(p.pos==='GK'&&samePos<=2)return false;
  return samePos>1;
}
function reasons(p,b){
  const out=[];
  if(p.listed)out.push('He is on the list');
  if(p.years<=1)out.push('A year left on his deal');
  const mo=SW.get('morale');
  if(mo&&mo.unhappy){try{if(mo.unhappy().some(x=>x.id===p.id))out.push('He has been agitating')}catch(e){}}
  const bp=(scan()||{}).pos;
  const theirs=bp&&bp.get(b.id)?bp.get(b.id)[p.pos]||0:0;
  if(CA(p)>theirs+4)out.push('He would walk straight into their side');
  if(b.rep>me().rep+8)out.push('They are a bigger club than us');
  return out.slice(0,3);
}
function genOffers(attempts,dl){
  const s=S(),c=alive();if(!c||!windowOpen())return;
  const sc=scan();if(!sc)return;
  const maxOpen=dl?3:2;
  const tried=new Set();
  for(let i=0;i<attempts;i++){
    if(s.offers.length>=maxOpen)break;
    const cands=squadOf(c).filter(p=>{
      const r=sc.intr[p.id];
      if(!r||!r.n)return false;
      if(tried.has(p.id))return false;
      if(s.offers.some(o=>o.pid===p.id))return false;
      if((s.cool[p.id]||-99)>G.week-3)return false;
      return sellable(p,c);
    });
    if(!cands.length)break;
    const p=wpick(cands,x=>Math.pow(Math.max(1,sc.intr[x.id].best-30),1.5));
    const r=sc.intr[p.id];
    let chance=clamp((r.best-40)/72,0.04,0.9);
    if(dl)chance=Math.min(0.95,chance*1.35);
    tried.add(p.id);
    if(rnd()>chance)continue;
    /* Only a real approach cools him. A club that thought about it and did not
       ring must not block everybody else for the rest of the window. */
    s.cool[p.id]=G.week;
    const b=G.clubs[pick(r.top)];
    if(!b)continue;
    /* THE CEILING. Derived from value() through askingPrice() and from
       nothing else. No club ever looks at what anybody paid. */
    const ask=askingPrice(p,c,b);
    let m=0.80+rnd()*0.18;
    if(dl)m+=0.10+rnd()*0.18;
    if(b.rep>c.rep+10)m+=0.05;
    let fee=Math.round(ask*m/50000)*50000;
    fee=Math.min(fee,Math.round(value(p)*2.2/50000)*50000,Math.round(b.bal*0.9/50000)*50000);
    fee=Math.max(50000,fee);
    s.offers.push({id:s.oid++,pid:p.id,nm:p.name,pos:p.pos,b:b.id,fee,ask,
      wk:G.week,exp:dl?G.week:G.week+1,st:'open',dem:0,dl:!!dl,why:reasons(p,b)});
  }
}

/* ============================================================
   RESOLUTION — one counter round, settled on the next Continue
   ============================================================ */
function headroom(p,b,ask){
  return Math.min(value(p)*2.2,b.bal*0.9,ask*1.35);
}
function resolveCounters(){
  const s=S(),c=alive();if(!c)return;
  for(const o of s.offers){
    if(o.st!=='counter')continue;
    const b=G.clubs[o.b],p=c.squad.find(x=>x.id===o.pid);
    if(!b||!p){o.st='done';continue}
    const head=headroom(p,b,o.ask);
    let ch=o.dem<=head?clamp(0.88-0.62*(o.dem/head),0.12,0.80):0.04;
    if(o.dl)ch+=0.18;
    if(rnd()<ch){
      const nm=p.name,bn=b.name;
      complete(o,o.dem);
      note(bn+' paid it','You asked '+money(o.dem)+' for '+nm+'. They did not blink.',{from:vC(b),about:vP(p),rel:'bought'});
    }else{
      note(b.name+' walked','You wanted '+money(o.dem)+' for '+p.name+'. They are not going there.',{from:vC(b),about:vP(p),rel:'for'});
      o.st='done';
    }
  }
  s.offers=s.offers.filter(o=>o.st!=='done');
}

/* ============================================================
   THE SALE, AND WHAT IT COSTS
   ============================================================ */
function snapshot(c,p){
  const order=squadOf(c).sort((a,b)=>CA(b)-CA(a));
  const cu=SW.get('culture');
  let tr=0,cap=false;
  if(cu){
    try{if(cu.trust)tr=cu.trust(p.id)}catch(e){}
    try{if(cu.captain)cap=cu.captain()===p.id}catch(e){}
  }
  return {rank:order.findIndex(x=>x.id===p.id),tr,cap,val:value(p),
          ratio:costRatio(c),listed:!!p.listed,wage:p.wage};
}
function complete(o,fee){
  const s=S(),c=alive();if(!c)return null;
  const b=G.clubs[o.b],p=c.squad.find(x=>x.id===o.pid);
  if(!b||!p){o.st='done';return null}
  const pre=snapshot(c,p);
  doTransfer(p,c,b,fee,Math.round(p.wage*1.12));
  s.inFees+=fee;
  s.ledger.unshift({s:G.season,w:G.week,nm:p.name,fee,club:b.name});
  if(s.ledger.length>40)s.ledger.length=40;
  o.st='done';
  fallout(p,pre,fee,b);
  chron('Sold '+p.name+' to '+b.name+' for '+money(fee));
  return {p,b,fee,pre};
}
function fallout(p,pre,fee,b){
  const c=me(),mo=SW.get('morale'),bd=SW.get('board');
  const over=fee/Math.max(1,pre.val);
  let room=pre.rank<5?-10:pre.rank<12?-4:2;
  if(pre.cap)room-=8;
  if(pre.tr>=45)room-=4;
  if(over>=1.35)room+=5;
  if(pre.listed)room+=4;
  room=clamp(Math.round(room),-24,8);
  if(mo&&mo.adjust&&room!==0){
    const why=room<0
      ?(pre.cap?'you sold the captain':'you sold '+p.name)
      :'you got real money for '+p.name;
    for(const x of squadOf(c)){try{mo.adjust(x.id,room,why)}catch(e){}}
  }
  if(bd&&bd.adjust){
    try{
      if(over>=1.4)bd.adjust(4,'sold '+p.name+' for well over his value');
      else if(pre.rank<3&&G.week>=19)bd.adjust(-6,'sold your best player in January');
      else if(over<0.85)bd.adjust(-3,'let '+p.name+' go cheap');
    }catch(e){}
  }
  const vb=vC(b), vpl=vP(p);
  if(pre.cap)note('You sold the captain',p.name+' has gone to '+b.name+'. Somebody else wears it now, and they all know why it is free.',{from:vb,about:vpl,rel:'took'});
  else if(pre.rank<5)note('Sold '+p.name,money(fee)+' from '+b.name+'. The room noticed.',{from:vb,about:vpl,rel:'took'});
  else note('Sold '+p.name,money(fee)+' from '+b.name+'. '+money(pre.wage)+'/wk off the bill.',{from:vb,about:vpl,rel:'took'});
}

/* ============================================================
   THE POT — one control, two jobs
   Transfer budget is c.bal. The wage side is the ceiling we agreed
   with the board, expressed as a % of revenue. Moving cash into wages
   lifts the ceiling; selling wage room back returns 80p in the pound,
   which is what stops it being a money printer. The league's own 85%
   cap is enforced by the core and is not ours to move.
   ============================================================ */
function initCeil(c){return clamp(Math.round(costRatio(c))+10,55,85)}
function ceilOf(){const s=S(),c=alive();if(!c)return 85;if(!s.ceil)s.ceil=initCeil(c);return s.ceil}
function wageAt(pct){const c=me();return revenue(c)*pct/100/52}
function roomLeft(){const c=me();return Math.max(0,wageAt(ceilOf())-wageBill(c))}
const UNIT=()=>{const s=S();return Math.max(1e6,Math.round(Math.max(s.potBase,4e6)*0.08/1e5)*1e5)};
function ptsFor(cash){return cash/revenue(me())*100}
function cashFor(pts){return pts/100*revenue(me())}

function shiftOpts(){
  const s=S(),c=alive();if(!c)return [];
  const out=[],u=UNIT(),cur=Math.ceil(costRatio(c)),ce=ceilOf();
  const outCap=Math.max(0,s.potBase*0.12-s.cashOut);
  for(const amt of [u,u*2]){
    if(amt<=c.bal&&ce+ptsFor(amt)<=85.001)
      out.push({dir:'wages',amt,ceil:Math.min(85,ce+ptsFor(amt)),bal:c.bal-amt});
  }
  for(const amt of [u,u*2]){
    const cash=Math.round(amt*0.8);
    if(cash>outCap+1)continue;
    const nc=ce-ptsFor(amt);
    if(nc<cur||nc<40)continue;
    out.push({dir:'budget',amt,cash,ceil:nc,bal:c.bal+cash});
  }
  return out;
}
function shiftAdvice(){
  const c=alive();if(!c)return 'hold';
  const r=costRatio(c),ce=ceilOf();
  if(ce-r<=2&&c.bal>UNIT()*1.5)return 'wages';
  if(ce-r>=14&&c.bal<UNIT())return 'budget';
  return 'hold';
}

/* ============================================================
   SCREENS
   ============================================================ */
function offerById(id){return S().offers.find(o=>o.id===id)}
function findMine(pid){const c=alive();return c?c.squad.find(x=>x.id===pid):null}

function readOf(o,p){
  const c=me(),over=o.fee/Math.max(1,value(p));
  const order=squadOf(c).sort((a,b)=>CA(b)-CA(a));
  const rank=order.findIndex(x=>x.id===p.id);
  const cu=SW.get('culture');
  let cap=false;try{if(cu&&cu.captain)cap=cu.captain()===p.id}catch(e){}
  if(cap)return {t:'He wears the armband. Sell him and you are picking a new one in every sense of it.',r:'reject'};
  if(rank<3&&over<1.2)return {t:'One of your best three, and they are not even paying over the odds. Tell them no.',r:'reject'};
  if(over>=1.45)return {t:money(o.fee)+' for a man we value at '+money(value(p))+'. Take it and shake hands quickly.',r:'accept'};
  if(rank>=12&&over>=0.95)return {t:'He is nowhere near the side. That is money for nothing.',r:'accept'};
  if(p.years<=1)return {t:'A year left. Sell him now or watch him walk for nothing in June.',r:'accept'};
  if(over<0.82)return {t:'Well short of what he is worth. Ask for the proper number.',r:'demand'};
  if(rank<8)return {t:'Fair money, but he plays. Push them and see how badly they want it.',r:'demand'};
  return {t:'Fair money for a squad man. Your call.',r:'accept'};
}
function demandFor(o,p){
  return Math.max(50000,Math.round(Math.max(o.fee*1.12,o.ask*1.05)/50000)*50000);
}
window.xferOpen=function(id){
  const o=offerById(id);if(!o||o.st!=='open')return;
  const c=alive(),p=findMine(o.pid),b=G.clubs[o.b];
  if(!c||!p||!b){S().offers=S().offers.filter(x=>x.id!==id);render();return}
  const rev=revenue(c),wb=wageBill(c);
  const r0=costRatio(c),r1=Math.min(160,Math.round((wb-p.wage)*52/rev*100));
  const adv=readOf(o,p),dem=demandFor(o,p);
  const mo=SW.get('morale');
  let wants=false;
  if(mo&&mo.unhappy){try{wants=mo.unhappy().some(x=>x.id===p.id)}catch(e){}}
  const cu=SW.get('culture');
  const promisable=(wants||p.listed)&&cu&&cu.promise;
  /* Two parties, one player: the club that wants him, and him. A 16px crest
     was doing the work of naming the buyer. It cannot. */
  sheet(`${speakerBar(vC(b),vP(p),'want',b.name+' have made an offer')}
   <div class="row" style="margin-bottom:12px;align-items:flex-start">
    <div style="min-width:0"><h3 style="margin:0">${esc(p.name)}</h3>
      <div class="dim" style="font-size:13px">${p.pos} · ${p.age} · ${p.years} yr${p.years===1?'':'s'} left</div></div>
    <span class="spacer"></span>
    <div style="text-align:right"><div class="disp" style="font-size:26px;font-weight:800;color:var(--trf);line-height:28px">${money(o.fee)}</div>
      <div class="dim" style="font-size:11px">valued ${money(value(p))}</div></div></div>
   ${o.dl?`<div class="card" style="margin-bottom:10px;border-color:var(--acc);background:var(--accw)">
     <div style="font-size:13px;font-weight:700;color:var(--acc)">Deadline. This is gone the moment you continue.</div></div>`:''}
   ${o.why.length?`<div class="card" style="background:var(--s1);margin-bottom:10px">
     ${o.why.map(w=>`<div style="font-size:13px;color:var(--t2)">· ${esc(w)}</div>`).join('')}</div>`:''}
   <div class="card" style="background:var(--s1);margin-bottom:10px">
    <div class="kv"><span class="k2">Transfer budget</span>
      <span class="v2">${money(c.bal)} → <b style="color:var(--win)">${money(c.bal+o.fee)}</b></span></div>
    <div class="kv"><span class="k2">Weekly wage bill</span>
      <span class="v2">${money(wb)} → <b style="color:var(--win)">${money(wb-p.wage)}</b></span></div>
    <div class="kv"><span class="k2">Squad cost ratio</span>
      <span class="v2">${r0}% → <b style="color:${r1>85?'var(--loss)':'var(--win)'}">${r1}%</b></span></div>
    <div class="kv"><span class="k2">Squad size after</span>
      <span class="v2">${squadOf(c).length-1}</span></div></div>
   <div class="card" style="background:var(--s1);margin-bottom:12px;border-color:var(--acc)">
     <div class="row" style="align-items:flex-start;gap:8px"><span style="color:var(--acc)">◆</span>
     <div style="font-size:13px"><b>Assistant Coach</b> — ${esc(adv.t)}</div></div></div>
   <div class="opt ${adv.r==='accept'?'rec':''}" onclick="xferAccept(${o.id})">
     <div><div style="font-weight:600">Take the money</div>
       <div class="dim" style="font-size:12px">${money(o.fee)} in, ${money(p.wage)}/wk off the bill</div></div>
     ${adv.r==='accept'?'<span class="st">Advised</span>':''}</div>
   <div class="opt ${adv.r==='demand'?'rec':''}" onclick="xferDemand(${o.id})">
     <div><div style="font-weight:600">Ask ${money(dem)}</div>
       <div class="dim" style="font-size:12px">One go. If they pay it, he goes — you get the answer when you continue</div></div>
     ${adv.r==='demand'?'<span class="st">Advised</span>':''}</div>
   <div class="opt ${adv.r==='reject'?'rec':''}" onclick="xferReject(${o.id},0)">
     <div><div style="font-weight:600">He is not for sale</div>
       <div class="dim" style="font-size:12px">They go away${o.dl?'':' — for now'}</div></div>
     ${adv.r==='reject'?'<span class="st">Advised</span>':''}</div>
   ${promisable?`<div class="opt" onclick="xferReject(${o.id},1)">
     <div><div style="font-weight:600">Turn it down — tell him his move comes next window</div>
       <div class="dim" style="font-size:12px">He will hold you to that</div></div></div>`:''}
   <button class="btn ghost" style="margin-top:6px" onclick="closeSheet();render()">Leave it for now</button>`);
};
window.xferAccept=function(id){
  const o=offerById(id);if(!o||o.st!=='open')return;
  const c=alive(),p=findMine(o.pid);
  if(!c||!p){closeSheet();render();return}
  if(!sellable(p,c)){
    sheet(`<h3>You cannot</h3><div class="sh-sub">Sell him and you have no cover there at all.
      Find a replacement first.</div>
     <button class="btn ghost" onclick="closeSheet();render()">Close</button>`);
    return;
  }
  const nm=p.name,bn=G.clubs[o.b].name,fee=o.fee;
  complete(o,fee);
  S().offers=S().offers.filter(x=>x.id!==id);
  bust();save();
  sheet(`<div class="slab" style="margin-bottom:14px"><div class="k">Sold</div>
    <div class="v" style="font-size:26px;line-height:29px">${esc(nm)}</div>
    <div class="d">${money(fee)} to ${esc(bn)}</div></div>
   <div class="card" style="background:var(--s1)">
    <div class="kv"><span class="k2">Transfer budget</span><span class="v2">${money(me().bal)}</span></div>
    <div class="kv"><span class="k2">Squad cost ratio</span><span class="v2">${costRatio(me())}%</span></div></div>
   <button class="btn" style="margin-top:12px" onclick="closeSheet();render()">Continue</button>`);
};
window.xferDemand=function(id){
  const o=offerById(id);if(!o||o.st!=='open')return;
  const p=findMine(o.pid);if(!p){closeSheet();render();return}
  o.dem=demandFor(o,p);o.st='counter';
  const b=G.clubs[o.b];
  note('You named your price',money(o.dem)+' for '+p.name+'. '+b.name+' are thinking about it.',{from:vC(b),about:vP(p),rel:'want'});
  S().cool[p.id]=G.week;
  save();closeSheet();render();
};
window.xferReject=function(id,promised){
  const o=offerById(id);if(!o)return;
  const p=findMine(o.pid),b=G.clubs[o.b];
  S().offers=S().offers.filter(x=>x.id!==id);
  if(p&&promised){
    const cu=SW.get('culture');
    if(cu&&cu.promise){try{cu.promise(p.id,'his move would come in the next window',22)}catch(e){}}
    note('You told him to wait',p.name+' stays. You also told him he goes next window. He will remember that.',{from:vP(p)});
  }else if(p&&b){
    note('Turned down',b.name+' offered '+money(o.fee)+' for '+p.name+'. You said no.',{from:vC(b),about:vP(p),rel:'wanted'});
  }
  if(p)S().cool[p.id]=G.week;          // they do not ring again next week
  save();closeSheet();render();
};

/* ---------- the Sell screen ---------- */
function sellView(){
  const c=alive();if(!c)return '<div class="card">No club.</div>';
  const s=S(),sc=scan();
  const list=squadOf(c).sort((a,b)=>{
    const d=(sc?sc.intr[b.id].n:0)-(sc?sc.intr[a.id].n:0);
    return d||CA(b)-CA(a);
  });
  const open=s.offers.filter(o=>o.st==='open');
  const pend=s.offers.filter(o=>o.st==='counter');
  return `<div class="card" style="margin-bottom:10px">
    <div style="font-size:13px;color:var(--t2)"><b style="color:var(--t1)">What listing does.</b>
    Every club in the world is told he is available. Far more of them come in, and they come in lower —
    you are advertising that you want him gone. His wages leave the bill the day he does.
    ${windowOpen()?'':'Nobody can bid until the window opens.'}</div></div>
   ${open.length?`<div class="sechead">On the table<span class="n">${open.length}</span></div>
    ${open.map(o=>{const b=G.clubs[o.b];return `<div class="act" onclick="xferOpen(${o.id})">
      <div class="ic" style="background:#0E2340;color:var(--trf)">⇄</div>
      <div class="tx"><div class="a">${esc(b?b.name:'A club')} — ${money(o.fee)}</div>
        <div class="b">${esc(o.nm)}${o.dl?' · gone when you continue':''}</div></div>
      <div class="ch">›</div></div>`}).join('')}`:''}
   ${pend.length?`<div class="sechead">Waiting on them</div>
    ${pend.map(o=>`<div class="card" style="margin-bottom:8px"><div style="font-size:13px;color:var(--t2)">
      You asked ${money(o.dem)} for ${esc(o.nm)}. They answer when you continue.</div></div>`).join('')}`:''}
   <div class="sechead">Your squad<span class="n">${list.length}</span></div>
   <div class="card" style="padding:6px 14px 12px">
   ${list.map(p=>{
     const r=sc?sc.intr[p.id]:{n:0};
     const L=LEVELS[level(r.n)];
     return `<div class="plr">
      <div onclick="showPlayer(${p.id})" style="display:flex;align-items:center;gap:10px;flex:1;min-width:0">
       ${pface(p,46)}
       <div class="pos">${p.pos}</div>
       <div class="nmw"><div class="nm2">${esc(p.name)}</div>
        <div class="meta"><span>${p.age}</span><span style="color:var(--trf)">${money(value(p))}</span>
          <span>${money(p.wage)}/wk</span></div>
        <div class="meta" style="margin-top:2px;color:${L.c}"><span>${L.k} ${esc(L.t)}</span></div></div></div>
      <button class="btn ${p.listed?'':'ghost'} xs" style="margin-left:6px"
        onclick="event.stopPropagation();xferList(${p.id})">${p.listed?'Listed':'List'}</button></div>`}).join('')}</div>
   ${s.ledger.length?`<div class="sechead">Sold</div><div class="card">
     ${s.ledger.slice(0,8).map(d=>`<div class="kv"><span class="k2">${esc(d.nm)} → ${esc(d.club)}</span>
       <span class="v2" style="color:var(--win)">${money(d.fee)}</span></div>`).join('')}
     <div class="kv" style="border-top:1px solid var(--hair);margin-top:6px;padding-top:8px">
       <span class="k2">Fees banked, all time</span><span class="v2">${money(s.inFees)}</span></div></div>`:''}`;
}
window.xferList=function(pid){
  const c=alive();if(!c)return;
  const p=c.squad.find(x=>x.id===pid);if(!p)return;
  const s=S();
  if(!p.listed&&!s.told){
    sheet(`<h3>Put ${esc(p.name)} on the list?</h3>
     <div class="sh-sub">It is not a quiet thing. Every club is told he is available, so far more of them
       ring — and every one of them knows you want him gone, so they ring with less. He hears about it too.</div>
     <div class="opt rec" onclick="xferListGo(${pid})"><div><div style="font-weight:600">List him</div>
       <div class="dim" style="font-size:12px">Interest goes up, the price comes down</div></div>
       <span class="st">Do it</span></div>
     <button class="btn ghost" style="margin-top:6px" onclick="closeSheet()">Leave him alone</button>`);
    return;
  }
  p.listed=!p.listed;bust();save();render();
};
window.xferListGo=function(pid){
  const c=alive();if(!c)return;
  const p=c.squad.find(x=>x.id===pid);if(!p)return;
  S().told=true;p.listed=true;bust();closeSheet();save();render();
};

/* ---------- the pot ---------- */
function potBlock(){
  const c=alive();if(!c)return '';
  const s=S(),ce=ceilOf(),r=costRatio(c),room=roomLeft();
  const left=Math.max(0,3-s.moves);
  return `<div class="sechead">The pot</div>
   <div class="card">
    <div class="row" style="gap:18px;align-items:flex-start">
      <div><div class="dim" style="font-size:10px;letter-spacing:.06em;text-transform:uppercase">Transfer budget</div>
        <div class="disp" style="font-size:24px;font-weight:800;color:var(--acc)">${money(c.bal)}</div></div>
      <div class="spacer"></div>
      <div style="text-align:right"><div class="dim" style="font-size:10px;letter-spacing:.06em;text-transform:uppercase">Wage room left</div>
        <div class="disp" style="font-size:24px;font-weight:800;color:${room>0?'var(--win)':'var(--loss)'}">${money(room)}</div>
        <div class="dim" style="font-size:11px">per week, under ${ce}%</div></div></div>
    <div style="height:8px;background:var(--s3);border-radius:4px;margin:12px 0 8px;overflow:hidden;position:relative">
      <div style="height:100%;width:${Math.min(100,r/1.6)}%;background:${r>ce?'var(--loss)':'var(--acc)'}"></div>
      <div style="position:absolute;left:${Math.min(99,ce/1.6)}%;top:-3px;bottom:-3px;width:2px;background:var(--acc)"></div>
      <div style="position:absolute;left:${85/1.6}%;top:-3px;bottom:-3px;width:2px;background:var(--t1)"></div></div>
    <div style="font-size:12px;color:var(--t3)">Wages are ${r}% of revenue. You agreed ${ce}% with the board.
      The league's cap is 85% and that one is not negotiable.</div>
    <button class="btn ghost sm" style="margin-top:11px" ${left?'':'disabled'} onclick="xferPot()">
      ${left?'Move money · '+left+' left this season':'No moves left this season'}</button></div>`;
}
window.xferPot=function(){
  const c=alive();if(!c)return;
  const s=S(),opts=shiftOpts(),ce=ceilOf(),adv=shiftAdvice();
  const row=o=>`<div class="opt ${adv===o.dir&&o===opts.find(x=>x.dir===adv)?'rec':''}"
     onclick="xferShift('${o.dir}',${o.amt})">
    <div><div style="font-weight:600">${o.dir==='wages'?'Move '+money(o.amt)+' to wages':'Take '+money(o.cash)+' into the budget'}</div>
      <div class="dim" style="font-size:12px">Budget ${money(c.bal)} → ${money(o.bal)} ·
        ceiling ${ce}% → ${Math.round(o.ceil)}% (${money(wageAt(o.ceil))}/wk)</div></div>
    ${adv===o.dir&&o===opts.find(x=>x.dir===adv)?'<span class="st">Advised</span>':''}</div>`;
  sheet(`<h3>The pot</h3>
   <div class="sh-sub">One pot, two jobs. A fee is paid once; a wage is paid every week until his deal runs out.
     Three moves a season — you have ${Math.max(0,3-s.moves)}.</div>
   <div class="opt ${adv==='hold'?'rec':''}" onclick="closeSheet();render()">
     <div><div style="font-weight:600">Leave it as it is</div>
       <div class="dim" style="font-size:12px">Budget ${money(c.bal)} · ceiling ${ce}% ·
         ${money(roomLeft())}/wk of room</div></div>
     ${adv==='hold'?'<span class="st">Advised</span>':''}</div>
   ${opts.map(row).join('')||'<div class="dim" style="padding:12px 0">Nothing left to move either way.</div>'}
   <div style="font-size:12px;color:var(--t3);margin:10px 2px 0">Wage room sold back returns 80p in the pound —
     the board keep the rest. You cannot promise a ceiling you are already through.</div>
   <button class="btn ghost" style="margin-top:10px" onclick="closeSheet()">Close</button>`);
};
window.xferShift=function(dir,amt){
  const c=alive();if(!c)return;
  const s=S();
  const o=shiftOpts().find(x=>x.dir===dir&&x.amt===amt);
  if(!o||s.moves>=3){closeSheet();render();return}
  if(dir==='wages'){
    if(amt>c.bal){closeSheet();render();return}
    c.bal-=amt;s.ceil=Math.min(85,o.ceil);
    note('Money moved to wages','Budget down to '+money(c.bal)+'. You can carry '+money(wageAt(s.ceil))+' a week now.',{from:vV('board')});
  }else{
    c.bal+=o.cash;s.ceil=Math.max(40,o.ceil);s.cashOut+=o.cash;
    note('Wage room sold','Budget up to '+money(c.bal)+'. Your ceiling is '+Math.round(s.ceil)+'% — do not go through it.',{from:vV('board')});
  }
  if(c.bal<0)c.bal=0;
  s.moves++;
  save();closeSheet();render();
};

/* ============================================================
   REGISTRATION
   ============================================================ */
SW.register({
  id:'market',

  init(){
    const s=SW.state('market');
    for(const k in s)delete s[k];
    const st=S(),c=alive();
    if(c){st.potBase=c.bal;st.ceil=initCeil(c)}
    bust();
    /* The first window a new manager sees must not be silent. */
    if(c&&windowOpen()){st.seeded=G.season;genOffers(4,true)}
  },
  onLoad(){S();bust()},

  onWeek(w){
    const s=S(),c=alive();if(!c)return;
    bust();
    resolveCounters();
    if(!windowOpen()){
      if(s.offers.length){
        s.offers=[];
        note('The window is shut','Whatever was on the table is off it.',{from:vV('league')});
      }
      return;
    }
    const gone=s.offers.filter(o=>o.st==='open'&&w>o.exp);
    if(gone.length){
      s.offers=s.offers.filter(o=>!(o.st==='open'&&w>o.exp));
      note('They moved on',gone.map(o=>o.nm).join(', ')+' — nobody waits for ever.',{from:vV('staff')});
    }
    const dl=isDeadline();
    if(dl){
      note('Deadline week','Last chance for everybody. The phone will not stop.',{from:vV('league')});
      aiMarket(6);                       // the rest of the world panics too
    }
    genOffers(dl?5:3,dl);            // the core saves for us straight after this hook
  },

  /* Enforce the ceiling where we actually can: the moment a signing puts
     us through the number we gave the board. */
  onTransfer(p,seller,buyer){
    if(!buyer||buyer.id!==G.me)return;
    bust();
    const s=S(),c=alive();if(!c)return;
    const r=costRatio(c);
    if(r>ceilOf()&&G.week-s.breachWk>3){
      s.breachWk=G.week;
      const bd=SW.get('board');
      if(bd&&bd.adjust){try{bd.adjust(-4,'took the wage bill through the ceiling you agreed')}catch(e){}}
      note('Through the ceiling','Wages are '+r+'% of revenue. You told them '+ceilOf()+'%. They have it written down.',{from:vV('board')});
    }
  },

  onSeasonEndAfter(){
    const s=S(),c=alive();if(!c)return;
    s.offers=[];s.cool={};s.moves=0;s.cashOut=0;
    s.potBase=c.bal;s.ceil=initCeil(c);
    bust();
    if(s.seeded!==G.season){s.seeded=G.season;genOffers(5,true)}
  },

  hubCards(){
    const s=S(),c=alive();if(!c)return [];
    const open=s.offers.filter(o=>o.st==='open').sort((a,b)=>b.fee-a.fee);
    if(!open.length)return [];
    const o=open[0],b=G.clubs[o.b];
    const more=open.length-1;
    return [{ic:'⇄',bg:'#0E2340',col:'var(--trf)',priority:o.dl?78:68,
      a:(b?b.name:'A club')+' want '+o.nm,
      b:money(o.fee)+' — '+(o.dl?'gone when you continue':'they want an answer')+(more?' · '+more+' more on the table':''),
      fn:'xferOpen('+o.id+')'}];
  },

  marketViews(){return [{key:'sell',label:'Sell',render:sellView}]},

  clubBlocks(){const h=potBlock();return h?[h]:[]},

  playerBlocks(p,club){
    if(!club||club.id!==G.me||p.youth)return [];
    const r=interestOf(p.id),L=LEVELS[level(r.n)];
    const o=S().offers.find(x=>x.pid===p.id);
    return [`<div class="card" style="margin-top:10px;background:var(--s1)">
      <div class="row"><span class="dim" style="font-size:10px;letter-spacing:.06em;
        text-transform:uppercase">Who is watching</span><span class="spacer"></span>
        <span style="font-weight:700;font-size:13px;color:${L.c}">${L.k} ${esc(L.t)}</span></div>
      ${o?`<div style="font-size:13px;color:var(--trf);margin-top:7px">
        ${o.st==='counter'?'You have asked '+money(o.dem)+'. They answer when you continue.'
          :esc((G.clubs[o.b]||{}).name||'A club')+' have bid '+money(o.fee)+'.'}</div>`:''}
      <div style="font-size:13px;color:var(--t2);margin-top:7px">
        ${p.listed?'He is on the transfer list. Everybody knows, including him.'
          :'Listing him tells every club he is available — more offers, smaller ones.'}</div>
      ${o&&o.st==='open'?`<button class="btn sm" style="margin-top:10px" onclick="closeSheet();xferOpen(${o.id})">See the offer</button>`
        :`<button class="btn ${p.listed?'':'ghost'} sm" style="margin-top:10px"
          onclick="xferList(${p.id})">${p.listed?'Take him off the list':'Put him on the list'}</button>`}</div>`];
  },

  /* ---- published interface ---- */
  interest(pid){const r=interestOf(Number(pid));return {clubs:r.n,level:level(r.n),label:LEVELS[level(r.n)].t}},
  offers(){return S().offers.map(o=>({id:o.id,player:o.pid,club:o.b,fee:o.fee,stage:o.st}))},
  wageCeiling(){return ceilOf()},
  wageRoom(){return alive()?roomLeft():0},
  listed(pid,on){const c=alive();if(!c)return false;
    const p=c.squad.find(x=>x.id===Number(pid));if(!p)return false;
    p.listed=on===undefined?!p.listed:!!on;bust();return p.listed}
});
})();
