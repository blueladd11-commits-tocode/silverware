/* ============================================================
   SILVERWARE — module: market
   The summer, and the other direction.

   Two jobs, one file.

   THE SUMMER. Pre-season is five friendlies — 5 Jul to 2 Aug — and the
   core fires no onWeek hook through any of it. So the window used to be
   a still photograph: one list, one price, nothing moving, nothing at
   stake. Every friendly is now a market day. Rival clubs do business and
   you watch them do it. Clubs put men in the shop window and the price
   on the screen moves because of it. Agents ring. A man you have been
   looking at for three weeks signs for somebody else. And on 2 Aug the
   phone does not stop.

   THE DEAL. A transfer is two negotiations, not one. The club takes the
   fee; the player takes the wage. You now argue both, and every argument
   you start comes back and tells you how it went on your very next tap —
   what you asked for, and what happened. Nothing resolves in silence.

   THE RULE THAT PROTECTS LONG SAVES. Every number any club is willing to
   pay comes out of value() via askingPrice(). Nothing in here reads a fee
   that was paid — not ours, not anybody's. A counter-offer is derived from
   the asking price, never from the bid it answers. No ratchet.
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
  outFees:0,
  cool:{},        // pid -> week we last generated an approach
  seeded:0,       // season the summer approaches were seeded for
  day:-1,         // last market day we ran
  feed:[],        // what is happening out there, newest first
  pend:[],        // negotiations waiting on an answer
  queue:[],       // answers waiting to be put in front of the manager
  appr:[],        // live agent approaches
  ask:{},         // pid -> asking price at the start of today, for movement
  tick:0,         // pulses since boot — "next action" is measured in these
  stats:{}        // rival deals seen, terms done, terms refused, roles set
};
function S(){
  const s=SW.state('market');
  for(const k in DEF){
    if(s[k]!==undefined)continue;
    const d=DEF[k];
    s[k]=Array.isArray(d)?[]:(d&&typeof d==='object')?{}:d;
  }
  if(!s.stats)s.stats={};
  const st=s.stats;
  ['rival','gone','terms','refused','walked','follow','roles','bought'].forEach(k=>{if(!st[k])st[k]=0});
  return s;
}
const alive=()=>typeof G!=='undefined'&&G.clubs&&G.me!=null&&me();
const inMatch=()=>typeof MT!=='undefined'&&MT;
const last=p=>String(p&&p.name||'').split(' ').pop();

/* ============================================================
   THE CALENDAR
   Summer runs across the five friendlies; each one is a market day.
   January is weeks 19–21. The last day of either is the scramble.
   ============================================================ */
const SHUTS='8 Aug';                       // the day after the last friendly
function preLeft(){return Math.max(0,G.pre|0)}
function summer(){return G.window==='summer'}
function dayKey(){
  if(!alive())return -1;
  return G.season*1000+(summer()?(typeof PRE_N==='number'?PRE_N-preLeft():0):100+G.week);
}
function dayLabel(){
  if(summer())return preLeft()>0?(typeof preDate==='function'?preDate():'July'):SHUTS;
  return typeof weekDate==='function'?weekDate(G.week):'This week';
}
function isDeadline(){
  if(G.week>=19&&G.week<=21)return G.week===21;
  return summer()&&preLeft()<=1;
}
function daysLine(){
  if(!summer())return G.week===21?'Shuts when you continue':'Three weeks, then it shuts';
  const n=preLeft();
  if(n<=0)return 'Shuts when you continue';
  if(n===1)return 'Deadline day is next';
  return n+' more days of it';
}

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
  if(CACHE.intr&&CACHE.wk===G.week&&CACHE.se===G.season&&CACHE.sig===sig&&CACHE.pre===preLeft())return CACHE;
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
  CACHE={wk:G.week,se:G.season,sig,pre:preLeft(),pos,intr};
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
   AGENTS
   An agent is a fact about a player, never a roll: the same man every
   time you ring, with the same appetite. Deliberately the same derivation
   the contracts module uses, so the name on this sheet is the name on his
   contract screen. If contracts ever publishes agentOf(), delete this.
   ============================================================ */
function ahash(n){let x=(n*2654435761)>>>0;x^=x>>>13;x=(x*1274126177)>>>0;return x>>>0}
const AGENTS=[
 {k:'straight',d:'straight, no games',      fee:0.035,greed:1.00,clause:0.10,stub:0.30},
 {k:'shrewd',  d:'a shrewd operator',       fee:0.065,greed:1.10,clause:0.30,stub:0.55},
 {k:'shark',   d:'a shark, and he knows it',fee:0.120,greed:1.30,clause:0.55,stub:0.82},
 {k:'family',  d:'his brother, doing him a favour',fee:0.015,greed:0.90,clause:0.05,stub:0.20}
];
const AGMIX=[0,1,0,2,1,3,0,1,2,1];
const AGNAME=['Vance','Kerrigan','Duplass','Orsini','Beckwith','Ravel','Halloran','Stavros',
  'Mbeki','Lindqvist','Farrow','Cutler','Reznik','Okonjo','Barbaro','Whitlam'];
function agentOf(p){
  const h=ahash(p.id);
  const a=AGENTS[AGMIX[h%10]];
  return {k:a.k,d:a.d,fee:a.fee,greed:a.greed,clause:a.clause,stub:a.stub,
    name:AGNAME[(h>>>5)%AGNAME.length]};
}
function agentVoice(p){const a=agentOf(p);return vH(a.name,'agent',p.nat,44)}

/* ============================================================
   THE FEED — what is happening out there
   ============================================================ */
const FK={
  in  :{i:'⇄',c:'var(--trf)'},
  gone:{i:'✕',c:'var(--loss)'},
  price:{i:'£',c:'var(--acc)'},
  agent:{i:'☎',c:'var(--t2)'},
  bid :{i:'⇄',c:'var(--trf)'},
  mine:{i:'★',c:'var(--win)'}
};
function feedAdd(k,t){
  const s=S();
  if(s.feed.length&&s.feed[0].t===t)return;
  s.feed.unshift({d:dayLabel(),k,t,se:G.season});
  if(s.feed.length>44)s.feed.length=44;
}

/* ============================================================
   THE MARKET DAY
   Everything below moves the world exactly once per day. runDay() is
   only ever reached through pulse(), which fires once per day key.
   ============================================================ */
function runDay(){
  const s=S(),c=alive();if(!c)return;
  const dl=isDeadline();
  s.day=dayKey();
  markPrices();                 // snapshot first, so today's movement is visible
  bust();
  rivalDay(dl);
  shopWindow(dl);
  targetGone(dl);
  agentDay(dl);
  genOffers(dl?5:3,dl);
  bust();
  if(dl&&summer()&&preLeft()<=1&&s.dlTold!==G.season){
    s.dlTold=G.season;
    note('Deadline. Nobody is sleeping',
      'Last week of the window. Everybody who has been thinking about it starts ringing, '+
      'and everything you have not done yet is about to be somebody else\'s problem.',{from:vV('league')});
  }
}
/* Where every price on our screens stood before today's business. */
function markPrices(){
  const s=S(),c=alive();if(!c)return;
  const m={};
  (G.shortlist||[]).forEach(id=>{
    const h=findAny(id);
    if(h&&h.c.id!==G.me)m[id]=askingPrice(h.p,h.c,c);
  });
  s.ask=m;
}
function findAny(id){
  for(const c of G.clubs){const f=c.squad&&c.squad.find(x=>x.id===Number(id));if(f)return {p:f,c}}
  return null;
}
/* 1. The rest of the world does its business. aiMarket is the core's own
      AI-to-AI market and prices itself off askingPrice; every deal it does
      arrives back here through onTransfer, which is what makes it visible. */
function rivalDay(dl){
  if(typeof aiMarket!=='function')return;
  try{aiMarket(dl?ri(5,8):ri(3,6))}catch(e){}
}
/* 2. Clubs put men in the shop window. This is the honest way a price moves:
      a listed player asks 20% less because askingPrice says he does. We only
      ever touch other clubs' players here — never one of ours. */
function shopWindow(dl){
  const c=alive();if(!c)return;
  const n=dl?ri(2,4):ri(1,3);
  for(let i=0;i<n;i++){
    const b=pick(G.clubs);
    if(!b||b.id===G.me)continue;
    const sq=squadOf(b);
    if(sq.length<19)continue;
    const byPos={};sq.forEach(p=>byPos[p.pos]=(byPos[p.pos]||0)+1);
    const cands=sq.filter(p=>!p.listed&&byPos[p.pos]>2&&(p.age>=29||p.years<=1||CA(p)<b.rep-8));
    if(!cands.length)continue;
    const p=pick(cands);
    const why=p.years<=1?'a year left and no new deal on the table'
      :p.age>=31?'they want the wage off the bill'
      :'the manager has told him he can go';
    if(typeof listPlayer==='function')listPlayer(p,'club',why);
    else {p.listed=true;p.listedBy='club';p.listedWhy=why}
    feedAdd('price',b.name+' have made '+p.name+' available — '+why+'.');
  }
  /* and somebody comes back off the market when nobody rings */
  if(rnd()<0.45){
    const cl=pick(G.clubs);
    if(cl&&cl.id!==G.me){
      const off=squadOf(cl).filter(p=>p.listed&&(p.listedBy==='club'));
      if(off.length){
        const p=pick(off);
        if(typeof unlistPlayer==='function')unlistPlayer(p);else{p.listed=false;p.listedBy=null}
        feedAdd('price',cl.name+' have taken '+p.name+' back off the market.');
      }
    }
  }
}
/* 3. Dither and he goes. The single most important thing in a window is that
      it does not wait for you. */
function targetGone(dl){
  const c=alive();if(!c)return;
  const s=S();
  const targets=(G.shortlist||[]).map(findAny).filter(h=>h&&h.c.id!==G.me);
  if(!targets.length)return;
  const h=pick(targets);
  const p=h.p,seller=h.c;
  let ch=0.09+clamp((CA(p)-58)/140,0,0.10);
  if(p.listed)ch+=0.05;
  if(dl)ch+=0.12;
  if(rnd()>ch)return;
  const ask=askingPrice(p,seller,c);
  const buyers=G.clubs.filter(b=>b.id!==G.me&&b.id!==seller.id&&b.bal>ask*1.6
    &&costRatio(b)<82&&canCarry(b,p)&&b.rep>=seller.rep-14);
  if(!buyers.length)return;
  const b=wpick(buyers,x=>Math.max(1,x.rep-seller.rep+22));
  doTransfer(p,seller,b,ask,Math.round(p.wage*1.12));   // fee is the asking price, nothing else
  s.stats.gone++;
  note(p.name+' has gone to '+b.name,
    'You had him on your list. '+b.name+' paid '+money(ask)+' and did not ring you first. '+
    'Somebody was always going to.',{from:vC(b),about:vP(p),rel:'signed'});
}
/* 4. Somebody's agent rings. An approach is a door held open for two days:
      the club will take the asking price, or the player will take the going
      wage. It never changes what he is worth. */
function agentDay(dl){
  const c=alive();if(!c)return;
  const s=S();
  s.appr=s.appr.filter(a=>a.until>=dayKey());
  if(s.appr.length>=2)return;
  if(rnd()>(dl?0.75:0.5))return;
  let h=null;
  const shortl=(G.shortlist||[]).map(findAny).filter(x=>x&&x.c.id!==G.me);
  if(shortl.length&&rnd()<0.6)h=pick(shortl);
  else{
    const weak=weakSpot();
    const pool=[];
    for(const cl of G.clubs){
      if(cl.id===G.me)continue;
      for(const p of squadOf(cl)){
        if(weak&&p.pos!==weak)continue;
        const ask=askingPrice(p,cl,c);
        if(ask>c.bal*0.85||ask<50000)continue;
        if(CA(p)<xiFloor()-2)continue;
        pool.push({p,c:cl});
      }
    }
    if(pool.length)h=pool[Math.floor(rnd()*pool.length)];
  }
  if(!h)return;
  if(s.appr.some(a=>a.pid===h.p.id))return;
  const ag=agentOf(h.p),kind=rnd()<0.5?'fee':'terms';
  s.appr.push({pid:h.p.id,cid:h.c.id,kind,until:dayKey()+2,nm:h.p.name,cl:h.c.name});
  const ask=askingPrice(h.p,h.c,c);
  note(ag.name+' rang about '+h.p.name,
    kind==='fee'
      ?('"'+h.c.name+' will take '+money(ask)+'. Not a penny under, and not for long. '+
        'Ring me before Friday or I take him somewhere else."')
      :('"My client likes the sound of you. He will sign for what he is worth, '+
        'which is more than you are about to offer him. Do not insult us."'),
    {from:agentVoice(h.p),about:vP(h.p),rel:'represents'});
  feedAdd('agent',ag.name+' has been touting '+h.p.name+' around. '+h.c.name+' want '+money(ask)+'.');
}
function xiFloor(){
  const c=me();
  if(!c||!c.xi||!c.xi.length)return 50;
  return c.xi.reduce((a,x)=>a+CA(x.p,x.slot),0)/c.xi.length;
}
function weakSpot(){
  const c=me();
  if(!c||!c.xi||!c.xi.length)return null;
  const w=c.xi.slice().sort((a,b)=>CA(a.p,a.slot)-CA(b.p,b.slot))[0];
  return w?w.slot:null;
}
function approachFor(pid){
  const s=S();
  return s.appr.find(a=>a.pid===Number(pid)&&a.until>=dayKey())||null;
}

/* ============================================================
   THE PULSE
   The core gives us no hook during pre-season — a friendly does not
   advance the week. So the market breathes on the manager's own taps:
   every render asks whether a new day has started, and every render is
   where an answer he is owed gets put in front of him.
   ============================================================ */
let PULSING=false;
function pulse(){
  if(PULSING)return;
  const c=alive();if(!c||inMatch())return;
  PULSING=true;
  try{
    const s=S();
    s.tick=(s.tick||0)+1;
    if(windowOpen()){
      if(s.day!==dayKey())runDay();
    }else if(s.pend.length){
      s.pend.forEach(x=>{if(x.state==='wait')queueUp(x,{k:'shut'})});
      s.pend=[];
    }
    resolvePendings();
  }catch(e){console.error('[market.pulse]',e)}
  PULSING=false;
  deliverSoon();
}

/* ---------- pending negotiations ----------
   Everything you start goes in here with the tick it was started on, and
   is answered on the next one. That is the whole promise: you asked for
   something, and on your next tap the game tells you how it went. */
function pendAdd(o){
  const s=S();
  o.born=s.tick;o.state='wait';
  s.pend.push(o);
  if(s.pend.length>8)s.pend.shift();
  return o;
}
function queueUp(o,res){
  const s=S();
  s.queue.push({o,res});
  if(s.queue.length>6)s.queue.shift();
}
function resolvePendings(){
  const s=S(),c=alive();if(!c)return;
  for(const o of s.pend){
    if(o.state!=='wait'||o.born>=s.tick)continue;
    o.state='done';
    if(o.k==='bid')queueUp(o,answerBid(o));
    else if(o.k==='terms')queueUp(o,answerTerms(o));
    else if(o.k==='counter')queueUp(o,answerCounter(o));
  }
  s.pend=s.pend.filter(o=>o.state==='wait');
}
function deliverSoon(){
  const s=S();
  if(!s.queue.length)return;
  setTimeout(function(){
    try{
      if(!alive()||inMatch())return;
      if(document.querySelector('.sheetwrap'))return;   // somebody else is talking
      const st=S(),it=st.queue.shift();
      if(!it)return;
      st.stats.follow++;
      showFollow(it.o,it.res);
      save();
    }catch(e){console.error('[market.deliver]',e)}
  },0);
}

/* ============================================================
   BUYING — two negotiations, not one
   Stage one is the club and the fee. Stage two is the man and his wage,
   and until now there was no stage two at all: the core rolled
   playerWillJoin() behind your back and told you he had said no.
   ============================================================ */

/* What a club says to a bid. The 40% rule: the asking price on its own is a
   coin-flip, slightly against you. Everything here is derived from
   askingPrice(); the counter never looks at what you offered. */
function clubAnswer(p,seller,amount){
  const c=me(),ask=askingPrice(p,seller,c);
  const r=amount/Math.max(1,ask);
  if(r>=1.15)return {k:'yes',ask};
  if(r<0.85)return {k:'no',ask};
  return {k:'wait',ask,r};
}
function bidOdds(o){
  const p=findAny(o.pid),c=alive();
  if(!p||!c)return 0;
  let ch=clamp(0.40+(o.r-1)*2.6,0.05,0.92);
  if(isDeadline())ch+=0.12;
  const ap=approachFor(o.pid);
  if(ap&&ap.kind==='fee'&&o.r>=0.999)ch=0.97;
  return clamp(ch,0.03,0.97);
}
function answerBid(o){
  const c=alive(),h=findAny(o.pid);
  if(!c||!h||h.c.id!==o.cid)return {k:'lost'};
  const ask=askingPrice(h.p,h.c,c);              // recomputed: the world moved
  if(rnd()<bidOdds(o))return {k:'yes',fee:o.amt};
  /* Their number is the asking price plus a bit of pride. It is not, and must
     never be, a function of what you just bid. */
  const want=Math.max(50000,Math.round(ask*1.08/50000)*50000);
  if(want<=c.bal&&rnd()<0.72)return {k:'counter',want};
  return {k:'no'};
}
/* The override. sheetBid() in the core still draws the three fee options; this
   is what happens when one of them is tapped. */
window.makeBid=function(id,amount){
  const c=alive();if(!c)return;
  const h=findAny(id);if(!h||h.c.id===G.me)return;
  const p=h.p,seller=h.c;
  if(amount>c.bal){closeSheet();render();return}
  if(!windowOpen()){
    sheet(`<h3>The window is shut</h3><div class="sh-sub">Nobody can register anybody. Wait for January.</div>
     <button class="btn ghost" onclick="closeSheet();render()">Close</button>`);
    return;
  }
  const a=clubAnswer(p,seller,amount);
  if(a.k==='no'){
    sheet(`${speakerBar(vC(seller),vP(p),'for',seller.name+' have answered')}
     <h3 style="margin-top:12px">Nowhere near it</h3>
     <div class="sh-sub">${esc(seller.name)} want ${money(a.ask)} for ${esc(p.name)} and you offered
       ${money(amount)}. They did not take it to anybody.</div>
     ${a.ask<=c.bal?`<div class="opt rec" onclick="makeBid(${p.id},${a.ask})">
       <div><div style="font-weight:600">Pay what they are asking</div>
         <div class="dim" style="font-size:12px">${money(a.ask)} · ${money(c.bal-a.ask)} left after</div></div>
       <span class="st">Advised</span></div>`:''}
     <button class="btn ghost" style="margin-top:6px" onclick="closeSheet();render()">Leave it</button>`);
    return;
  }
  if(a.k==='yes'){feeAgreed(p,seller,amount);return}
  /* They will think about it, and you will find out on your next tap. */
  pendAdd({k:'bid',pid:p.id,cid:seller.id,nm:p.name,cl:seller.name,amt:amount,ask:a.ask,r:a.r});
  note('Bid lodged for '+p.name,money(amount)+' to '+seller.name+'. They said they would come back to you.',
    {from:vC(seller),about:vP(p),rel:'for'});
  feedAdd('bid','You bid '+money(amount)+' for '+p.name+'. '+seller.name+' are thinking.');
  save();closeSheet();render();
};

/* ---------- stage two: the man ----------
   Deterministic, because a screen that re-rolls his demand every time it
   redraws is a screen nobody can negotiate against. */
function terms(p,seller){
  const c=me(),ag=agentOf(p);
  const base=typeof wageFor==='function'?wageFor(p,c):p.wage;
  const floor=Math.max(base,Math.round(p.wage*0.96));
  let m=1.05;
  m+=(p.amb-55)/100*0.28;
  m+=clamp((seller.rep-c.rep)/40,-0.10,0.45);      // coming down costs you
  m-=clamp((c.rep-seller.rep)/70,0,0.12);          // a step up shaves it
  if(p.age<=22)m-=0.05;else if(p.age>=32)m-=0.08;
  m*=ag.greed;
  const wage=Math.max(1000,Math.round(floor*clamp(m,0.92,1.70)/1000)*1000);
  const years=p.age>=33?1:p.age>=30?2:p.age<=22?4:3;
  const wantsCl=(ahash(p.id*7+3)%100)/100<ag.clause;
  const clause=wantsCl?Math.max(1e6,Math.round(value(p)*(1.45+(ahash(p.id*11+5)%40)/100)/5e5)*5e5):0;
  return {wage,years,clause,ag,base,floor,fee:Math.round(wage*52*ag.fee)};
}
/* One blunt line, or nothing. A man who will not come says why. */
function refusal(p,seller){
  const c=me();
  const gap=seller.rep-c.rep;
  const lg=typeof myLeague==='function'&&myLeague()?myLeague().name:'this division';
  if(seller.tier<c.tier&&p.amb>50&&CA(p)>=xiFloor()-2)
    return 'He is not dropping to '+lg+' for that.';
  if(gap>19&&p.amb>58)
    return 'He has bigger clubs than you asking, and his man has told him so.';
  const ahead=squadOf(c).filter(x=>x.pos===p.pos&&CA(x)>=CA(p)).length;
  if(ahead>=3&&p.amb>48)
    return 'He wants to play. You have three ahead of him in that position already.';
  if(p.age<=23&&p.pa-CA(p)>=14&&gap>10)
    return 'He is twenty-'+(p.age-20)+' with everything in front of him. He is not spending it here.';
  return null;
}
function feeAgreed(p,seller,fee){
  const c=alive();if(!c)return;
  S().stats.bought=S().stats.bought||0;
  const no=refusal(p,seller);
  if(no){
    S().stats.refused++;
    sheet(`${speakerBar(agentVoice(p),vP(p),'for','His people have answered')}
     <h3 style="margin-top:12px">He said no</h3>
     <div class="sh-sub">${esc(seller.name)} took ${money(fee)}. ${esc(p.name)} did not take you.</div>
     <div class="card" style="margin:10px 0 12px;border-color:var(--loss);background:var(--s1)">
       <div style="font-size:15px;font-weight:700;line-height:20px">${esc(no)}</div></div>
     <div style="font-size:13px;color:var(--t3);margin:0 2px 12px">No money on earth was fixing that one.
       The fee is not spent — nothing has left the account.</div>
     <button class="btn ghost" onclick="closeSheet();render()">Close</button>`);
    save();return;
  }
  termsSheet(p,seller,fee,null);
}
function ratioAfter(extraWage){
  const c=me();
  return Math.min(160,Math.round((wageBill(c)+extraWage)*52/revenue(c)*100));
}
function termsSheet(p,seller,fee,forced){
  const c=alive();if(!c)return;
  const t=forced||terms(p,seller);
  const ap=approachFor(p.id);
  if(ap&&ap.kind==='terms'&&!forced)t.wage=Math.max(1000,Math.round(t.wage*0.90/1000)*1000);
  const r0=costRatio(c),r1=ratioAfter(t.wage),ce=ceilOf();
  const push=Math.max(1000,Math.round(t.wage*0.88/1000)*1000);
  const blocked=r1>85;
  const tight=r1>ce&&!blocked;
  const adv=blocked?'walk':tight?'push':'meet';
  const wb=wageBill(c);
  const topWage=squadOf(c).reduce((s2,x)=>Math.max(s2,x.wage),0);
  sheet(`${speakerBar(agentVoice(p),vP(p),'for',esc(seller.name)+' have accepted '+money(fee))}
   <div class="phero" style="margin:10px 0 12px">
    ${typeof pcard==='function'?pcard(p,{w:120,club:seller,tap:'void 0'}):''}
    <div class="pht" style="min-width:0">
      <div class="hk" style="color:var(--acc);font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase">Personal terms</div>
      <h3 style="margin:2px 0 0;font-size:20px;line-height:23px">${esc(p.name)}</h3>
      <div class="dim" style="font-size:12px;margin-top:3px">${p.pos} · ${p.age} · on ${money(p.wage)}/wk now</div>
      <div class="disp" style="font-size:27px;font-weight:800;color:var(--acc);line-height:29px;margin-top:8px">${money(t.wage)}<span style="font-size:14px;color:var(--t3)">/wk</span></div>
      <div class="dim" style="font-size:11px;margin-top:4px">${t.years} year${t.years===1?'':'s'}${t.clause?' · release clause '+money(t.clause):''}</div>
    </div></div>
   <div class="card" style="background:var(--s1);margin-bottom:10px">
     <div style="font-size:13px;color:var(--t2)">${esc(t.ag.name)} is ${esc(t.ag.d)}. He wants
       ${money(t.fee)} for himself on top${t.clause?', and a clause at '+money(t.clause)+' written into it':''}.</div></div>
   <div class="card" style="background:var(--s1);margin-bottom:10px">
    <div class="kv"><span class="k2">Transfer budget</span>
      <span class="v2">${money(c.bal)} → <b style="color:${fee+t.fee>c.bal?'var(--loss)':'var(--t1)'}">${money(c.bal-fee-t.fee)}</b></span></div>
    <div class="kv"><span class="k2">Weekly wage bill</span>
      <span class="v2">${money(wb)} → <b>${money(wb+t.wage)}</b></span></div>
    <div class="kv"><span class="k2">Squad cost ratio</span>
      <span class="v2">${r0}% → <b style="color:${r1>85?'var(--loss)':r1>ce?'var(--acc)':'var(--win)'}">${r1}%</b>
      <span class="dim" style="font-size:11px">of ${ce}% agreed</span></span></div>
    ${t.wage>topWage*1.35&&topWage?`<div class="kv"><span class="k2">Top earner here</span>
      <span class="v2" style="color:var(--acc)">${money(topWage)}/wk — he would be past all of them</span></div>`:''}
   </div>
   <div class="card" style="background:var(--s1);margin-bottom:12px;border-color:var(--acc)">
     <div class="row" style="align-items:flex-start;gap:8px"><span style="color:var(--acc)">◆</span>
     <div style="font-size:13px"><b>Assistant Coach</b> — ${esc(
       blocked?'That contract puts you through 85% and the league will not register him. Do not sign it.'
       :tight?('It goes through the '+ce+'% you gave the board. Push him down or find the room first.')
       :('That is about right for what he is. Sign it before somebody else does.'))}</div></div></div>
   ${blocked?'':`<div class="opt ${adv==='meet'?'rec':''}" onclick="xferMeet(${p.id},${seller.id},${fee},${t.wage},${t.years},${t.clause},${t.fee})">
     <div><div style="font-weight:600">Give him his number</div>
       <div class="dim" style="font-size:12px">${money(t.wage)}/wk over ${t.years} year${t.years===1?'':'s'} — he signs today</div></div>
     ${adv==='meet'?'<span class="st">Advised</span>':''}</div>`}
   ${forced?'':`<div class="opt ${adv==='push'?'rec':''}" onclick="xferPush(${p.id},${seller.id},${fee},${push},${t.wage},${t.years},${t.clause})">
     <div><div style="font-weight:600">Go back at ${money(push)}</div>
       <div class="dim" style="font-size:12px">He might take it. He might walk. You get the answer when you continue</div></div>
     ${adv==='push'?'<span class="st">Advised</span>':''}</div>`}
   <div class="opt ${adv==='walk'?'rec':''}" onclick="xferWalkTerms(${p.id},${seller.id})">
     <div><div style="font-weight:600">Walk away</div>
       <div class="dim" style="font-size:12px">The fee is agreed and you do not use it. Nothing leaves the account</div></div>
     ${adv==='walk'?'<span class="st">Advised</span>':''}</div>`);
}
window.xferMeet=function(pid,cid,fee,wage,years,clause,agFee){
  const c=alive(),h=findAny(pid);
  if(!c||!h||h.c.id!==cid){closeSheet();render();return}
  signHim(h.p,h.c,fee,wage,years,clause,agFee);
};
window.xferPush=function(pid,cid,fee,offer,dem,years,clause){
  const c=alive(),h=findAny(pid);
  if(!c||!h||h.c.id!==cid){closeSheet();render();return}
  const p=h.p;
  pendAdd({k:'terms',pid,cid,nm:p.name,cl:h.c.name,fee,offer,dem,years,clause});
  note('You pushed back on '+last(p),
    money(offer)+'/wk against the '+money(dem)+' his man asked for. He said he would talk to the player.',
    {from:agentVoice(p),about:vP(p),rel:'for'});
  save();closeSheet();render();
};
window.xferWalkTerms=function(pid,cid){
  const h=findAny(pid);
  if(h)note('You walked away from '+last(h.p),
    'The fee was agreed. His wages were not, and you were not paying them.',
    {from:vC(me()),about:vP(h.p),rel:'passed on'});
  S().stats.walked++;
  save();closeSheet();render();
};
function pushOdds(o){
  const h=findAny(o.pid);if(!h)return 0;
  const ag=agentOf(h.p);
  const r=o.offer/Math.max(1,o.dem);
  let ch=clamp(0.30+(r-0.88)*3.2,0.05,0.85);
  ch*=(1.30-ag.stub*0.55);
  if(me().rep>h.c.rep)ch+=0.10;
  if(isDeadline())ch+=0.10;
  return clamp(ch,0.05,0.88);
}
function answerTerms(o){
  const h=findAny(o.pid);
  if(!h||h.c.id!==o.cid)return {k:'lost'};
  if(rnd()<pushOdds(o))return {k:'yes'};
  if(rnd()<0.55){
    const mid=Math.max(1000,Math.round((o.offer+o.dem)/2/1000)*1000);
    return {k:'split',mid};
  }
  return {k:'no'};
}
/* ---------- the signature ---------- */
function signHim(p,seller,fee,wage,years,clause,agFee){
  const c=alive();if(!c)return;
  const cost=fee+(agFee||0);
  if(cost>c.bal){
    sheet(`<h3>The money is not there</h3>
     <div class="sh-sub">${money(cost)} with his agent's cut and you have ${money(c.bal)}. Sell somebody first.</div>
     <button class="btn ghost" onclick="closeSheet();render()">Close</button>`);
    return;
  }
  if(ratioAfter(wage)>85){
    sheet(`<h3>You cannot register him</h3>
     <div class="sh-sub">That deal puts your wage bill at ${ratioAfter(wage)}% of revenue. The league's cap is 85%
       and it is not negotiable. Get somebody off the bill and come back.</div>
     <button class="btn ghost" onclick="closeSheet();render()">Close</button>`);
    return;
  }
  const from=seller.name,nm=p.name;
  doTransfer(p,seller,c,fee,wage);
  p.years=years||p.years;
  if(typeof unlistPlayer==='function')unlistPlayer(p);
  /* Register the deal where contracts keeps them, so his clause and his agent's
     cut are real and appear on his contract screen rather than only on ours. */
  let done=false;
  const ct=SW.get('contracts');
  if(ct&&ct.renew){
    try{done=!!ct.renew(p.id,{wage,years,clause:clause||0,fee:agFee||0})}catch(e){}
  }
  if(!done&&agFee){c.bal=Math.max(0,c.bal-agFee)}
  const s=S();
  s.outFees+=fee;s.stats.bought++;
  note('Signed '+nm,money(fee)+' from '+from+'. '+money(wage)+'/wk over '+(years||p.years)+' years'+
    (clause?', with a release clause at '+money(clause):'')+'.',
    {from:vC(c),about:vP(p),rel:'sign'});
  chron('Signed '+nm+' from '+from+' for '+money(fee));
  feedAdd('mine','You signed '+nm+' from '+from+' for '+money(fee)+'.');
  bust();save();
  sheet(`<div class="slab" style="margin-bottom:14px"><div class="k">Done deal</div>
    <div class="v" style="font-size:26px;line-height:29px">${esc(nm)}</div>
    <div class="d">${money(fee)} from ${esc(from)} · ${money(wage)}/wk</div></div>
   <div class="reveal" style="display:flex;justify-content:center;margin-bottom:14px">
     ${pcard(p,{w:172,club:c,tap:'void 0'})}</div>
   <div class="card" style="background:var(--s1)">
    <div class="kv"><span class="k2">Transfer budget</span><span class="v2">${money(c.bal)}</span></div>
    <div class="kv"><span class="k2">Squad cost ratio</span><span class="v2" style="color:${
      costRatio(c)>ceilOf()?'var(--acc)':'var(--win)'}">${costRatio(c)}%</span></div></div>
   <button class="btn" style="margin-top:12px" onclick="xferRole(${p.id})">Tell him what he is here for</button>`);
}

/* ============================================================
   WHAT HE IS HERE FOR
   The culture module owns squad roles and judges every promise in May.
   We do not reimplement any of that — we say the sentence out loud on the
   day he signs and write it into their ledger as a promise like any other.
   ============================================================ */
const RSAY={
  key :{t:'A key player',   d:'He plays when he is fit.',                 p:'he was a key player here',   m:9},
  rot :{t:'In and out',     d:'Twenty-odd starts. Some weeks he watches.',p:'he was in and out of the side here',m:2},
  back:{t:'One for the bench',d:'Cover. Cup ties and the last twenty minutes.',p:'he was a backup here',  m:-7}
};
function roleAdvice(p){
  const c=me();
  const order=squadOf(c).slice().sort((a,b)=>CA(b)-CA(a));
  const rank=order.findIndex(x=>x.id===p.id);
  return rank<5?'key':rank<12?'rot':'back';
}
window.xferRole=function(pid){
  const c=alive();if(!c)return;
  const p=c.squad.find(x=>x.id===Number(pid));
  if(!p){closeSheet();render();return}
  const adv=roleAdvice(p);
  const cu=SW.get('culture');
  sheet(`${speakerBar(vC(c),vP(p),'to','His first morning in')}
   <h3 style="margin-top:12px">Where he stands</h3>
   <div class="sh-sub">Say it now, on the day he signs, and he has no excuse in March.
     Say nothing and he will decide for himself what you meant.</div>
   ${['key','rot','back'].map(k=>`<div class="opt ${adv===k?'rec':''}" onclick="xferRoleSet(${p.id},'${k}')">
     <div><div style="font-weight:600">${RSAY[k].t}</div>
       <div class="dim" style="font-size:12px">${RSAY[k].d}</div></div>
     ${adv===k?'<span class="st">Advised</span>':''}</div>`).join('')}
   <div style="font-size:12px;color:var(--t3);margin:10px 2px 0">
     Whatever you tell him is a promise. It is written down${cu?' and it is read back to you in May':''}.</div>`);
};
window.xferRoleSet=function(pid,k){
  const c=alive();if(!c)return;
  const p=c.squad.find(x=>x.id===Number(pid));
  if(!p||!RSAY[k]){closeSheet();render();return}
  const R=RSAY[k],weeks=Math.max(6,37-G.week);
  const cu=SW.get('culture');
  if(cu&&cu.promise){try{cu.promise(p.id,R.p,weeks,'role')}catch(e){}}
  const mo=SW.get('morale');
  if(mo&&mo.adjust){try{mo.adjust(p.id,R.m,'told on his first day he was '+R.t.toLowerCase())}catch(e){}}
  S().stats.roles++;
  note('You told '+last(p)+' where he stands',
    R.t+'. '+R.d+' He has it from you, in writing, on day one — which means he will hold you to it.',
    {from:vC(c),about:vP(p),rel:'told'});
  const canSet=!!(cu&&cu.setRoles);
  sheet(`<div class="card" style="border-color:var(--acc);background:var(--accw);margin-bottom:12px">
     <div style="font-size:14px;font-weight:700">${esc(p.name)} — ${esc(R.t.toLowerCase())}</div>
     <div style="font-size:13px;color:var(--t2);margin-top:4px">${esc(R.d)} That is the promise. Keep it.</div></div>
   ${canSet?`<button class="btn ghost" style="margin-bottom:8px" onclick="closeSheet();try{SW.get('culture').setRoles()}catch(e){render()}">
     Do the same for the rest of them</button>`:''}
   <button class="btn" onclick="closeSheet();render()">Continue</button>`);
  save();
};

/* ============================================================
   FOLLOW-UPS — this is what you asked for, and this is how it went
   ============================================================ */
function askedLine(o){
  if(o.k==='bid')return 'You bid '+money(o.amt)+' for '+o.nm+'.';
  if(o.k==='terms')return 'You went back at '+money(o.offer)+'/wk for '+o.nm+', against the '+money(o.dem)+' he asked for.';
  if(o.k==='counter')return 'You told '+o.cl+' that '+o.nm+' costs '+money(o.dem)+'.';
  return 'You had something on the table.';
}
function showFollow(o,res){
  const c=alive();if(!c)return;
  const h=findAny(o.pid);
  const p=h?h.p:null;
  const club=G.clubs[o.cid];
  const from=o.k==='terms'&&p?agentVoice(p):(club?vC(club):vV('staff'));
  const head=`${speakerBar(from,p?vP(p):null,o.k==='terms'?'for':'on','They have come back to you')}
   <div class="card" style="background:var(--s1);margin:10px 0 10px">
     <div class="dim" style="font-size:10px;letter-spacing:.06em;text-transform:uppercase">What you asked for</div>
     <div style="font-size:14px;margin-top:4px">${esc(askedLine(o))}</div></div>`;
  const body=(t,col,opts)=>sheet(head+
    `<div class="card" style="background:var(--s1);margin-bottom:12px;border-color:${col}">
      <div class="dim" style="font-size:10px;letter-spacing:.06em;text-transform:uppercase">How it went</div>
      <div style="font-size:15px;font-weight:700;line-height:20px;margin-top:4px;color:${col}">${esc(t)}</div></div>`+opts);

  if(res.k==='lost'||res.k==='shut'){
    body(res.k==='shut'?'The window shut with that still on the table. It is off it.'
      :'He is not there any more. Somebody else got to him while you were waiting.','var(--loss)',
      `<button class="btn ghost" onclick="closeSheet();render()">Close</button>`);
    return;
  }
  if(o.k==='bid'){
    if(res.k==='yes'){
      body(esc(o.cl)+' will take '+money(o.amt)+'. Now go and talk to him.','var(--win)',
        `<div class="opt rec" onclick="xferFeeGo(${o.pid},${o.cid},${o.amt})">
          <div><div style="font-weight:600">Talk to his people</div>
            <div class="dim" style="font-size:12px">The club is done. The player is not</div></div>
          <span class="st">Advised</span></div>
         <button class="btn ghost" style="margin-top:6px" onclick="closeSheet();render()">Leave it</button>`);
      return;
    }
    if(res.k==='counter'){
      body(esc(o.cl)+' want '+money(res.want)+' and will not move again.','var(--acc)',
        `${res.want<=c.bal?`<div class="opt rec" onclick="makeBid(${o.pid},${res.want})">
          <div><div style="font-weight:600">Pay it</div>
            <div class="dim" style="font-size:12px">${money(res.want)} · ${money(c.bal-res.want)} left after</div></div>
          <span class="st">Advised</span></div>`
         :`<div class="card" style="margin-bottom:8px"><div style="font-size:13px;color:var(--loss)">
            ${money(res.want-c.bal)} more than you have.</div></div>`}
         <button class="btn ghost" style="margin-top:6px" onclick="closeSheet();render()">Walk away</button>`);
      return;
    }
    body(esc(o.cl)+' said no and took him off the table.','var(--loss)',
      `<button class="btn ghost" onclick="closeSheet();render()">Close</button>`);
    return;
  }
  if(o.k==='terms'){
    if(res.k==='yes'){
      body('He will sign for '+money(o.offer)+'/wk. You just saved '+money((o.dem-o.offer)*52)+' a year.','var(--win)',
        `<div class="opt rec" onclick="xferMeet(${o.pid},${o.cid},${o.fee},${o.offer},${o.years},${o.clause},${Math.round(o.offer*52*agentOf(p||{id:o.pid}).fee)})">
          <div><div style="font-weight:600">Get it signed</div>
            <div class="dim" style="font-size:12px">${money(o.offer)}/wk over ${o.years} year${o.years===1?'':'s'}</div></div>
          <span class="st">Advised</span></div>
         <button class="btn ghost" style="margin-top:6px" onclick="closeSheet();render()">Leave it</button>`);
      return;
    }
    if(res.k==='split'){
      body('His man will meet you at '+money(res.mid)+'/wk. That is the last number he says out loud.','var(--acc)',
        `<div class="opt rec" onclick="xferMeet(${o.pid},${o.cid},${o.fee},${res.mid},${o.years},${o.clause},${Math.round(res.mid*52*agentOf(p||{id:o.pid}).fee)})">
          <div><div style="font-weight:600">Take it</div>
            <div class="dim" style="font-size:12px">${money(res.mid)}/wk · bill goes to ${ratioAfter(res.mid)}% of revenue</div></div>
          <span class="st">Advised</span></div>
         <button class="btn ghost" style="margin-top:6px" onclick="xferWalkTerms(${o.pid},${o.cid})">Walk away</button>`);
      return;
    }
    S().stats.walked++;
    body('He walked. You knew what he was asking and you offered less.','var(--loss)',
      `<button class="btn ghost" onclick="closeSheet();render()">Close</button>`);
    return;
  }
  if(o.k==='counter'){
    if(res.k==='yes'){
      body(esc(o.cl)+' paid '+money(o.dem)+' without blinking.','var(--win)',
        `<div class="card" style="background:var(--s1);margin-bottom:10px">
          <div class="kv"><span class="k2">Transfer budget</span><span class="v2">${money(c.bal)}</span></div>
          <div class="kv"><span class="k2">Squad cost ratio</span><span class="v2">${costRatio(c)}%</span></div></div>
         <button class="btn" onclick="closeSheet();render()">Continue</button>`);
      return;
    }
    body(esc(o.cl)+' are not going there. He stays, and they will not ring again this window.','var(--loss)',
      `<button class="btn ghost" onclick="closeSheet();render()">Close</button>`);
    return;
  }
}
window.xferFeeGo=function(pid,cid,fee){
  const h=findAny(pid);
  if(!h||h.c.id!==cid){closeSheet();render();return}
  feeAgreed(h.p,h.c,fee);
};

/* ============================================================
   THEY COME FOR YOURS
   ============================================================ */
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
/* Why they are ringing. Never blame the manager for a listing he did not make. */
function reasons(p,b){
  const out=[];
  if(p.listed){
    const mine=typeof listedByManager==='function'?listedByManager(p):((p.listedBy||'manager')==='manager');
    out.push(mine?'You have put him on the list'
      :p.listedBy==='player'?'He asked to be listed'
      :'He is on the list'+(p.listedWhy?' — '+p.listedWhy:''));
  }
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
      if(s.pend.some(o=>o.pid===p.id))return false;
      if((s.cool[p.id]||-99)>dayKey()-2)return false;
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
    s.cool[p.id]=dayKey();
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
      wk:G.week,day:dayKey(),exp:dayKey()+(dl?0:1),st:'open',dem:0,dl:!!dl,why:reasons(p,b)});
    feedAdd('bid',b.name+' have bid '+money(fee)+' for '+p.name+'.');
  }
}
function headroom(p,b,ask){
  return Math.min(value(p)*2.2,b.bal*0.9,ask*1.35);
}
function answerCounter(o){
  const c=alive();if(!c)return {k:'no'};
  const b=G.clubs[o.cid],p=c.squad.find(x=>x.id===o.pid);
  if(!b||!p)return {k:'lost'};
  const ask=askingPrice(p,c,b);
  const head=headroom(p,b,ask);
  let ch=o.dem<=head?clamp(0.88-0.62*(o.dem/head),0.12,0.80):0.04;
  if(o.dl)ch+=0.18;
  if(rnd()<ch){
    const off=S().offers.find(x=>x.id===o.oid);
    if(off)complete(off,o.dem);
    S().offers=S().offers.filter(x=>x.id!==o.oid);
    return {k:'yes'};
  }
  S().offers=S().offers.filter(x=>x.id!==o.oid);
  S().cool[o.pid]=dayKey();
  return {k:'no'};
}
/* Legacy: anything left in the old counter state resolves the old way. */
function resolveCounters(){
  const s=S(),c=alive();if(!c)return;
  for(const o of s.offers){
    if(o.st!=='counter')continue;
    const b=G.clubs[o.b],p=c.squad.find(x=>x.id===o.pid);
    if(!b||!p){o.st='done';continue}
    const head=headroom(p,b,o.ask);
    let ch=o.dem<=head?clamp(0.88-0.62*(o.dem/head),0.12,0.80):0.04;
    if(o.dl)ch+=0.18;
    if(rnd()<ch)complete(o,o.dem);
    else o.st='done';
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
          ratio:costRatio(c),listed:!!p.listed,
          mine:typeof listedByManager==='function'?listedByManager(p):false,wage:p.wage};
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
  feedAdd('mine','You sold '+p.name+' to '+b.name+' for '+money(fee)+'.');
  return {p,b,fee,pre};
}
function fallout(p,pre,fee,b){
  const c=me(),mo=SW.get('morale'),bd=SW.get('board');
  const over=fee/Math.max(1,pre.val);
  let room=pre.rank<5?-10:pre.rank<12?-4:2;
  if(pre.cap)room-=8;
  if(pre.tr>=45)room-=4;
  if(over>=1.35)room+=5;
  if(pre.mine)room+=4;                       // they knew he was for sale
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
   ============================================================ */
function initCeil(c){return clamp(Math.round(costRatio(c))+10,55,85)}
function ceilOf(){const s=S(),c=alive();if(!c)return 85;if(!s.ceil)s.ceil=initCeil(c);return s.ceil}
function wageAt(pct){const c=me();return revenue(c)*pct/100/52}
function roomLeft(){const c=me();return Math.max(0,wageAt(ceilOf())-wageBill(c))}
const UNIT=()=>{const s=S();return Math.max(1e6,Math.round(Math.max(s.potBase,4e6)*0.08/1e5)*1e5)};
function ptsFor(cash){return cash/revenue(me())*100}

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
   <div class="phero" style="margin-bottom:12px">
    ${typeof pcard==='function'?pcard(p,{w:124,club:c,tap:'void 0'}):''}
    <div class="pht" style="min-width:0"><h3 style="margin:0;font-size:20px;line-height:23px">${esc(p.name)}</h3>
      <div class="dim" style="font-size:12px;margin-top:3px">${p.pos} · ${p.age} · ${p.years} yr${p.years===1?'':'s'} left</div>
      <div class="disp" style="font-size:27px;font-weight:800;color:var(--trf);line-height:29px;margin-top:8px">${money(o.fee)}</div>
      <div class="afford"><i style="width:${clamp(Math.round(o.fee/Math.max(1,value(p))*100),3,100)}%;background:${
        o.fee>=value(p)?'var(--win)':'var(--trf)'}"></i></div>
      <div class="dim" style="font-size:11px;margin-top:4px">valued ${money(value(p))}</div></div></div>
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
       <div class="dim" style="font-size:12px">One go. You get their answer the moment you continue</div></div>
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
  o.dem=demandFor(o,p);o.st='asked';
  const b=G.clubs[o.b];
  pendAdd({k:'counter',oid:o.id,pid:p.id,cid:o.b,nm:p.name,cl:b.name,dem:o.dem,dl:!!o.dl});
  note('You named your price',money(o.dem)+' for '+p.name+'. '+b.name+' are thinking about it.',
    {from:vC(b),about:vP(p),rel:'want'});
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
  if(p)S().cool[p.id]=dayKey();          // they do not ring again tomorrow
  save();closeSheet();render();
};

/* ---------- the Window screen: what is happening, and what it costs you ---------- */
function windowView(){
  pulse();
  const c=alive();if(!c)return '<div class="card">No club.</div>';
  const s=S(),dl=isDeadline(),open=windowOpen();
  const offers=s.offers.filter(o=>o.st==='open');
  const waiting=s.pend.filter(o=>o.state==='wait');
  const appr=s.appr.filter(a=>a.until>=dayKey());
  /* prices, honestly: today's asking price against where it stood this morning */
  const shortl=(G.shortlist||[]).map(findAny).filter(h=>h&&h.c.id!==G.me).map(h=>{
    const now=askingPrice(h.p,h.c,c);
    const was=s.ask[h.p.id];
    return {h,now,d:was?now-was:0};
  });
  const feed=s.feed.slice(0,18);
  const days={};const order=[];
  feed.forEach(f=>{if(!days[f.d]){days[f.d]=[];order.push(f.d)}days[f.d].push(f)});
  return `<div class="card" style="margin-bottom:10px;${dl?'border-color:var(--acc);background:var(--accw)':''}">
    <div class="row" style="align-items:flex-start;gap:14px">
      <div><div class="dim" style="font-size:10px;letter-spacing:.06em;text-transform:uppercase">${
        open?'The window':'Window shut'}</div>
        <div class="disp" style="font-size:24px;font-weight:800;color:${dl?'var(--acc)':'var(--t1)'}">${esc(dayLabel())}</div>
        <div style="font-size:12px;color:var(--t2);margin-top:2px">${esc(open?daysLine():'Reopens in January')}</div></div>
      <div class="spacer"></div>
      <div style="text-align:right"><div class="dim" style="font-size:10px;letter-spacing:.06em;text-transform:uppercase">To spend</div>
        <div class="disp" style="font-size:24px;font-weight:800;color:var(--acc)">${money(c.bal)}</div>
        <div class="dim" style="font-size:11px">${money(roomLeft())}/wk of wage room</div></div></div>
    ${dl?`<div style="font-size:13px;font-weight:700;color:var(--acc);margin-top:10px">
      Everything you have not done yet is about to be somebody else's.</div>`:''}</div>

   ${offers.length?`<div class="sechead">On the table<span class="n">${offers.length}</span></div>
    ${offers.map(o=>{const b=G.clubs[o.b];return `<div class="act" onclick="xferOpen(${o.id})">
      <div class="ic" style="background:#0E2340;color:var(--trf)">⇄</div>
      <div class="tx"><div class="a">${esc(b?b.name:'A club')} — ${money(o.fee)}</div>
        <div class="b">${esc(o.nm)}${o.dl?' · gone when you continue':''}</div></div>
      <div class="ch">›</div></div>`}).join('')}`:''}

   ${waiting.length?`<div class="sechead">Waiting on an answer</div>
    <div class="card">${waiting.map(o=>`<div style="font-size:13px;color:var(--t2);padding:4px 0">
      · ${esc(askedLine(o))} <span class="dim">You will hear the moment you continue.</span></div>`).join('')}</div>`:''}

   ${appr.length?`<div class="sechead">Agents<span class="n">${appr.length}</span></div>
    ${appr.map(a=>{const h=findAny(a.pid);if(!h)return '';
      const ask=askingPrice(h.p,h.c,c);
      return `<div class="act" onclick="showPlayer(${a.pid})">
       <div class="ic" style="background:#232A33;color:var(--t2)">☎</div>
       <div class="tx"><div class="a">${esc(h.p.name)} · ${esc(h.c.name)}</div>
         <div class="b">${esc(a.kind==='fee'?'They will take '+money(ask)+' and no haggling'
           :'His man says he will sign for the going rate')}</div></div>
       <div class="ch">›</div></div>`}).join('')}`:''}

   ${shortl.length?`<div class="sechead">Your list<span class="n">${shortl.length}</span></div>
    <div class="card">${shortl.slice(0,8).map(x=>`<div class="kv">
      <span class="k2">${esc(x.h.p.name)} · ${esc(x.h.c.abbr)}</span>
      <span class="v2">${money(x.now)} ${x.d?`<b style="color:${x.d>0?'var(--loss)':'var(--win)'}">${
        x.d>0?'▲ +':'▼ −'}${money(Math.abs(x.d)).replace('£','£')}</b>`:'<span class="dim">—</span>'}</span></div>`).join('')}
      <div style="font-size:12px;color:var(--t3);margin-top:8px">Movement since this morning. A price falls when a club
        makes him available and rises when the man in front of him leaves.</div></div>`
    :`<div class="card" style="margin-bottom:10px"><div style="font-size:13px;color:var(--t2)">
      Star a player in Scout and he shows up here with his price, every day, until somebody signs him.</div></div>`}

   <div class="sechead">Around the leagues</div>
   ${order.length?order.map(d=>`<div class="card" style="margin-bottom:8px">
     <div class="dim" style="font-size:10px;letter-spacing:.06em;text-transform:uppercase;margin-bottom:6px">${esc(d)}</div>
     ${days[d].map(f=>`<div class="row" style="align-items:flex-start;gap:8px;padding:3px 0">
       <span style="color:${(FK[f.k]||FK.in).c};width:14px;flex:0 0 14px">${(FK[f.k]||FK.in).i}</span>
       <span style="font-size:13px;color:var(--t2);line-height:18px">${esc(f.t)}</span></div>`).join('')}</div>`).join('')
    :'<div class="card"><div class="dim" style="padding:14px 0">Quiet so far. It will not stay quiet.</div></div>'}`;
}

/* ---------- the Sell screen ---------- */
function listLine(p){
  if(!p.listed)return 'Listing him tells every club he is available — more offers, smaller ones.';
  const mine=typeof listedByManager==='function'?listedByManager(p):((p.listedBy||'manager')==='manager');
  if(mine)return 'You put him on the list. Everybody knows, including him.';
  if(p.listedBy==='player')return 'He asked to be listed. That was not your doing.';
  if(p.listedBy==='role')return 'He went on the list when he was told he was surplus.'+
    (p.listedWhy?' ('+p.listedWhy+')':'');
  return 'He is on the list.'+(p.listedWhy?' '+p.listedWhy:'');
}
function sellView(){
  pulse();
  const c=alive();if(!c)return '<div class="card">No club.</div>';
  const s=S(),sc=scan();
  const list=squadOf(c).sort((a,b)=>{
    const d=(sc?sc.intr[b.id].n:0)-(sc?sc.intr[a.id].n:0);
    return d||CA(b)-CA(a);
  });
  const open=s.offers.filter(o=>o.st==='open');
  return `<div class="card" style="margin-bottom:10px">
    <div style="font-size:13px;color:var(--t2)"><b style="color:var(--t1)">What listing does.</b>
    Every club in the world is told he is available. Far more of them come in, and they come in lower —
    the list says out loud that he can be had. His wages leave the bill the day he does.
    ${windowOpen()?'':'Nobody can bid until the window opens.'}</div></div>
   ${open.length?`<div class="sechead">On the table<span class="n">${open.length}</span></div>
    ${open.map(o=>{const b=G.clubs[o.b];return `<div class="act" onclick="xferOpen(${o.id})">
      <div class="ic" style="background:#0E2340;color:var(--trf)">⇄</div>
      <div class="tx"><div class="a">${esc(b?b.name:'A club')} — ${money(o.fee)}</div>
        <div class="b">${esc(o.nm)}${o.dl?' · gone when you continue':''}</div></div>
      <div class="ch">›</div></div>`}).join('')}`:''}
   <div class="sechead">Your squad<span class="n">${list.length}</span></div>
   <div class="pcgrid">
   ${list.map(p=>{
     const r=sc?sc.intr[p.id]:{n:0};
     const L=LEVELS[level(r.n)];
     const w=pcw(2,11);
     const mine=typeof listedByManager==='function'?listedByManager(p):((p.listedBy||'manager')==='manager');
     return `<div class="pccell" style="width:${w}px">
      ${pcard(p,{w,club:c,fee:value(p)})}
      <div style="font-size:10px;font-weight:700;letter-spacing:.04em;color:${L.c};text-align:center;
        white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${L.k} ${esc(L.t)}</div>
      <button class="btn ${p.listed?'':'ghost'} xs" style="min-height:34px"
        onclick="event.stopPropagation();xferList(${p.id})">${p.listed?(mine?'Listed':'On the list'):'List'}</button></div>`}).join('')}</div>
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
  if(p.listed){
    const mine=typeof listedByManager==='function'?listedByManager(p):((p.listedBy||'manager')==='manager');
    if(!mine){
      /* He did not get here by your hand. Say so before you touch it. */
      sheet(`<h3>Take ${esc(p.name)} off the list?</h3>
       <div class="sh-sub">${esc(listLine(p))} Pull him back and the clubs watching him stop watching.</div>
       <div class="opt rec" onclick="xferUnlist(${pid})"><div><div style="font-weight:600">Take him off it</div>
         <div class="dim" style="font-size:12px">He is not for sale after all</div></div><span class="st">Advised</span></div>
       <button class="btn ghost" style="margin-top:6px" onclick="closeSheet()">Leave him on it</button>`);
      return;
    }
    if(typeof unlistPlayer==='function')unlistPlayer(p);else{p.listed=false;p.listedBy=null}
    bust();save();render();return;
  }
  if(!s.told){
    sheet(`<h3>Put ${esc(p.name)} on the list?</h3>
     <div class="sh-sub">It is not a quiet thing. Every club is told he is available, so far more of them
       ring — and every one of them knows you want him gone, so they ring with less. He hears about it too.</div>
     <div class="opt rec" onclick="xferListGo(${pid})"><div><div style="font-weight:600">List him</div>
       <div class="dim" style="font-size:12px">Interest goes up, the price comes down</div></div>
       <span class="st">Do it</span></div>
     <button class="btn ghost" style="margin-top:6px" onclick="closeSheet()">Leave him alone</button>`);
    return;
  }
  if(typeof listPlayer==='function')listPlayer(p,'manager');else{p.listed=true;p.listedBy='manager'}
  bust();save();render();
};
window.xferUnlist=function(pid){
  const c=alive();if(!c)return;
  const p=c.squad.find(x=>x.id===pid);if(!p)return;
  if(typeof unlistPlayer==='function')unlistPlayer(p);else{p.listed=false;p.listedBy=null}
  bust();closeSheet();save();render();
};
window.xferListGo=function(pid){
  const c=alive();if(!c)return;
  const p=c.squad.find(x=>x.id===pid);if(!p)return;
  S().told=true;
  if(typeof listPlayer==='function')listPlayer(p,'manager');else{p.listed=true;p.listedBy='manager'}
  bust();closeSheet();save();render();
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
    st.day=-1;st.seeded=G.season;      // the first render opens the window for real
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
      s.appr=[];
      return;
    }
    const gone=s.offers.filter(o=>o.st==='open'&&dayKey()>o.exp);
    if(gone.length){
      s.offers=s.offers.filter(o=>!(o.st==='open'&&dayKey()>o.exp));
      note('They moved on',gone.map(o=>o.nm).join(', ')+' — nobody waits for ever.',{from:vV('staff')});
    }
    if(isDeadline())note('Deadline week','Last chance for everybody. The phone will not stop.',{from:vV('league')});
    if(s.day!==dayKey())runDay();      // January days are weeks
  },

  /* Every completed transfer in the world comes through here. Two jobs: keep
     the ceiling honest when we are the buyer, and make the rest of the market
     something the manager can actually see happening. */
  onTransfer(p,seller,buyer,fee){
    /* The core clears p.listed on a transfer but not who listed him. Left alone,
       a man listed by somebody else stays blamed on the manager for ever. */
    if(p&&p.listedBy&&typeof unlistPlayer==='function'){try{unlistPlayer(p)}catch(e){}}
    if(!seller||!buyer)return;
    bust();
    const s=S(),c=alive();if(!c)return;
    if(buyer.id===G.me){
      const r=costRatio(c);
      if(r>ceilOf()&&G.week-s.breachWk>3){
        s.breachWk=G.week;
        const bd=SW.get('board');
        if(bd&&bd.adjust){try{bd.adjust(-4,'took the wage bill through the ceiling you agreed')}catch(e){}}
        note('Through the ceiling','Wages are '+r+'% of revenue. You told them '+ceilOf()+'%. They have it written down.',{from:vV('board')});
      }
      return;
    }
    if(seller.id===G.me)return;                 // our own sales are reported by fallout()
    const watched=(G.shortlist||[]).indexOf(p.id)>=0;
    const ml=typeof myLeague==='function'?myLeague():null;
    const near=ml&&(leagueOf(buyer.id)===ml||leagueOf(seller.id)===ml);
    if(!watched&&!near&&fee<3e6)return;         // only what a manager would actually hear
    s.stats.rival++;
    feedAdd('in',buyer.name+' have signed '+p.name+' from '+seller.name+' for '+money(fee)+'.');
    if(watched&&s.gone!==p.id){
      s.gone=p.id;
      note(buyer.name+' have taken '+p.name,
        'He was on your list. '+money(fee)+', done, and nobody rang you about it.',
        {from:vC(buyer),about:vP(p),rel:'signed'});
    }
  },

  onSeasonEndAfter(){
    const s=S(),c=alive();if(!c)return;
    s.offers=[];s.cool={};s.moves=0;s.cashOut=0;s.pend=[];s.queue=[];s.appr=[];s.ask={};
    s.potBase=c.bal;s.ceil=initCeil(c);
    s.day=-1;s.dlTold=0;
    /* The core reshuffles the world before a new season. Keep the loudest of it
       as the back page the manager reads on his first morning of pre-season. */
    s.feed=s.feed.filter(f=>f.se===G.season-1).slice(0,6).map(f=>({d:'Close season',k:f.k,t:f.t,se:G.season}));
    bust();
  },

  hubCards(){
    pulse();
    const s=S(),c=alive();if(!c)return [];
    const out=[];
    const open=s.offers.filter(o=>o.st==='open').sort((a,b)=>b.fee-a.fee);
    if(open.length){
      const o=open[0],b=G.clubs[o.b];
      const more=open.length-1;
      out.push({ic:'⇄',bg:'#0E2340',col:'var(--trf)',priority:o.dl?78:68,
        a:(b?b.name:'A club')+' want '+o.nm,
        b:money(o.fee)+' — '+(o.dl?'gone when you continue':'they want an answer')+(more?' · '+more+' more on the table':''),
        fn:'xferOpen('+o.id+')'});
    }
    if(windowOpen()){
      const dl=isDeadline(),f=s.feed[0];
      out.push({ic:dl?'⏳':'⇄',bg:dl?'#3A2E10':'#0E2340',col:dl?'var(--acc)':'var(--trf)',
        priority:dl?74:52,
        a:dl?'Deadline · '+dayLabel():'The window · '+dayLabel(),
        b:f?f.t:(money(c.bal)+' to spend · '+daysLine()),
        fn:"G.marketView='window';go('market')"});
    }
    return out;
  },

  marketViews(){return [{key:'window',label:'Window',render:windowView},
                        {key:'sell',label:'Sell',render:sellView}]},

  clubBlocks(){pulse();const h=potBlock();return h?[h]:[]},

  reportBlocks(){pulse();return []},

  playerBlocks(p,club){
    if(!club||p.youth)return [];
    /* Somebody else's player: what he would cost you in wages, and whether he
       would even come. Better he tells you now than after you have bid. */
    if(club.id!==G.me){
      if(!windowOpen())return [];
      const c=alive();if(!c)return [];
      const t=terms(p,club),no=refusal(p,club),r1=ratioAfter(t.wage);
      const ap=approachFor(p.id);
      return [`<div class="card" style="margin-top:10px;background:var(--s1)">
        <div class="row"><span class="dim" style="font-size:10px;letter-spacing:.06em;
          text-transform:uppercase">Personal terms</span><span class="spacer"></span>
          <span style="font-weight:700;font-size:13px;color:${no?'var(--loss)':'var(--acc)'}">${
            no?'He would not come':money(t.wage)+'/wk'}</span></div>
        <div style="font-size:13px;color:var(--t2);margin-top:7px">${esc(no
          ?no:(t.years+' years, '+(t.clause?'a release clause at '+money(t.clause)+', ':'')+
              'and '+t.ag.name+' — '+t.ag.d+' — takes '+money(t.fee)+' on top.'))}</div>
        ${no?'':`<div style="font-size:12px;color:${r1>85?'var(--loss)':'var(--t3)'};margin-top:6px">
          That contract takes your wage bill to ${r1}% of revenue${r1>85?' — over the cap. He cannot be registered.':'.'}</div>`}
        ${ap?`<div style="font-size:12px;color:var(--acc);margin-top:6px">${esc(t.ag.name)} has been on the phone.
          ${esc(ap.kind==='fee'?'The club will take the asking price this week.':'He will sign for the going rate this week.')}</div>`:''}
      </div>`];
    }
    if(p.youth)return [];
    const r=interestOf(p.id),L=LEVELS[level(r.n)];
    const o=S().offers.find(x=>x.pid===p.id);
    const w=S().pend.find(x=>x.pid===p.id&&x.state==='wait');
    const mine=typeof listedByManager==='function'?listedByManager(p):((p.listedBy||'manager')==='manager');
    return [`<div class="card" style="margin-top:10px;background:var(--s1)">
      <div class="row"><span class="dim" style="font-size:10px;letter-spacing:.06em;
        text-transform:uppercase">Who is watching</span><span class="spacer"></span>
        <span style="font-weight:700;font-size:13px;color:${L.c}">${L.k} ${esc(L.t)}</span></div>
      ${w?`<div style="font-size:13px;color:var(--trf);margin-top:7px">${esc(askedLine(w))} They answer when you continue.</div>`
        :o?`<div style="font-size:13px;color:var(--trf);margin-top:7px">
        ${esc((G.clubs[o.b]||{}).name||'A club')} have bid ${money(o.fee)}.</div>`:''}
      <div style="font-size:13px;color:var(--t2);margin-top:7px">${esc(listLine(p))}</div>
      ${o&&o.st==='open'?`<button class="btn sm" style="margin-top:10px" onclick="closeSheet();xferOpen(${o.id})">See the offer</button>`
        :`<button class="btn ${p.listed?'':'ghost'} sm" style="margin-top:10px"
          onclick="xferList(${p.id})">${p.listed?(mine?'Take him off the list':'Take him off it'):'Put him on the list'}</button>`}</div>`];
  },

  /* ---- published interface ---- */
  interest(pid){const r=interestOf(Number(pid));return {clubs:r.n,level:level(r.n),label:LEVELS[level(r.n)].t}},
  offers(){return S().offers.map(o=>({id:o.id,player:o.pid,club:o.b,fee:o.fee,stage:o.st}))},
  pending(){return S().pend.filter(o=>o.state==='wait').length},
  windowDay(){return {label:dayLabel(),deadline:isDeadline(),open:windowOpen()}},
  wageCeiling(){return ceilOf()},
  wageRoom(){return alive()?roomLeft():0},
  listed(pid,on){const c=alive();if(!c)return false;
    const p=c.squad.find(x=>x.id===Number(pid));if(!p)return false;
    const want=on===undefined?!p.listed:!!on;
    if(want){if(typeof listPlayer==='function')listPlayer(p,'manager');else{p.listed=true;p.listedBy='manager'}}
    else {if(typeof unlistPlayer==='function')unlistPlayer(p);else{p.listed=false;p.listedBy=null}}
    bust();return p.listed}
});
})();
