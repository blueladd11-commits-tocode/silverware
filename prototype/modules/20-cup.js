/* ============================================================
   20-cup.js — THE DOMESTIC KNOCKOUT CUP
   One leg. One shot. Sixty English clubs, six rounds, six weeks.
   Owns weeks 7, 15, 23, 30, 33, 36 and nothing else.
   ============================================================ */
(function(){
'use strict';

/* ---------- calendar & shape ----------------------------------------------
   Six rounds is the hard constraint (six permitted weeks). Six single-leg
   rounds can only take 64 slots down to one winner, so with sixty clubs the
   bracket is forced: 60 -> 32 -> 16 -> 8 -> 4 -> 2 -> 1. That leaves exactly
   four byes, and they go to the four biggest clubs in the country. Every
   other top-flight side is drawn AWAY at a lower-league ground in round one —
   which is where giant-killings actually come from.                        */
const WEEKS  =[7,15,23,30,33,36];
const RNAME  =['First round','Second round','Last 16','Quarter-final','Semi-final','FINAL'];
const RSHORT =['1st','2nd','L16','QF','SF','FINAL'];
const TARGET =[32,16,8,4,2,1];          // clubs left AFTER each round
const PRIZE  =[120000,350000,900000,2200000,4500000,7000000];   // paid on reaching the round
const WINPOT =10000000;                 // for lifting it

const CUPA=['Sovereign','Challenge','Meridian','Regent','Chancellor','Vanguard',
            'Kingsway','Endeavour','Bastion','Foundry','Ironside','Standard'];
const CUPB=['Cup','Trophy','Shield'];

/* ---------- tiny helpers --------------------------------------------------- */
const st   =()=>SW.state('cup');
const live =S=>!!(S&&!S.off&&S.rounds&&S.rounds.length);
const C    =id=>G.clubs[id];
const tierN=c=>'T'+(c.tier+1);
const tierL=c=>(typeof NATIONS!=='undefined'&&NATIONS.eng&&NATIONS.eng.tiers[c.tier])||('Tier '+(c.tier+1));
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));const t=a[i];a[i]=a[j];a[j]=t}return a}
function mkTie(h,a,neutral){return {h,a,gh:0,ga:0,done:false,win:null,et:false,pens:null,up:false,neutral:!!neutral}}
function pois(l){const L=Math.exp(-l);let k=0,p=1;do{k++;p*=rnd()}while(p>L);return Math.min(k-1,4)}

/* CORE GAP — see the final report. viewHub() runs
      EUROS.find(e=>e.key===f.comp.key).col
   for ANY fixture whose comp.key is not 'league', so a cup fixture at the top
   of the week throws before the hub can draw. Until the core guards that line
   we hand EUROS.find a stand-in for keys it does not own. Narrow: the only
   other unguarded caller looks up c.euro, which is always a European key. */
(function shim(){
  try{
    if(typeof EUROS==='undefined'||EUROS.__cupSafe)return;
    const nat=Array.prototype.find;
    const stand={key:'cup',name:'Cup',short:'CUP',col:'var(--acc)'};
    Object.defineProperty(EUROS,'find',{value:function(fn,t){
      const r=nat.call(this,fn,t); return r===undefined?stand:r;},writable:true,configurable:true});
    Object.defineProperty(EUROS,'__cupSafe',{value:true});
  }catch(e){}
})();

/* ============================================================
   SEEDING & THE DRAW
   ============================================================ */
function seedSeason(S){
  S.season=G.season; S.rounds=[]; S.winner=null; S.view=0; S.drawWeek=G.week; S.outWeek=null;
  const eng=G.clubs.filter(c=>c.nat==='eng').map(c=>c.id);
  if(eng.length<8){S.off=true;return}
  drawRound(S,0,eng);
}

function drawRound(S,idx,pool){
  pool=pool.slice();
  let nt=pool.length-TARGET[idx];
  if(nt<0)nt=0;
  if(nt*2>pool.length)nt=Math.floor(pool.length/2);
  const ties=[],byes=[];
  const neutral=(idx===5);

  if(idx===0){
    /* Round one: the four biggest clubs sit it out. Every other top-flight
       club is pulled out second — so they travel to a lower-league ground. */
    const elite=pool.filter(i=>C(i).tier===0).sort((a,b)=>C(b).rep-C(a).rep);
    const nb=Math.max(0,pool.length-nt*2);
    byes.push(...elite.slice(0,nb));
    const bset={}; byes.forEach(i=>bset[i]=1);
    const bigs =shuffle(elite.filter(i=>!bset[i]));
    const small=shuffle(pool.filter(i=>!bset[i]&&C(i).tier!==0));
    while(bigs.length&&small.length&&ties.length<nt)ties.push(mkTie(small.pop(),bigs.pop(),false));
    const rest=shuffle(small.concat(bigs));
    while(ties.length<nt&&rest.length>=2)ties.push(mkTie(rest.pop(),rest.pop(),false));
    byes.push(...rest);
    shuffle(ties);
  } else {
    const p=shuffle(pool);
    while(ties.length<nt&&p.length>=2)ties.push(mkTie(p.pop(),p.pop(),neutral));
    byes.push(...p);
  }

  S.rounds[idx]={i:idx,week:WEEKS[idx],name:RNAME[idx],ties,byes,done:false,drawnWeek:G.week};
  S.view=idx; S.drawWeek=G.week;
  payRound(S,idx);
  tellDraw(S,idx);
}

/* prize money the moment a club is in the hat for a round */
function payRound(S,idx){
  const rd=S.rounds[idx],fee=PRIZE[idx];
  const ids=[];
  rd.ties.forEach(t=>{ids.push(t.h,t.a)});
  (rd.byes||[]).forEach(i=>ids.push(i));
  ids.forEach(i=>{C(i).bal+=fee});
}

/* the gate — the reason a small club prays for a big name out of the hat */
function gate(tie){
  if(tie.neutral){
    const pot=Math.round((C(tie.h).rep+C(tie.a).rep)*26000);
    C(tie.h).bal+=pot; C(tie.a).bal+=pot; return;
  }
  const h=C(tie.h),a=C(tie.a);
  h.bal+=Math.round(h.capacity*14+a.rep*22000);
}

/* ============================================================
   EXTRA TIME & PENALTIES
   The match is already played. We do not re-run it — we add a short
   additional period on top of the state the engine left behind.
   ============================================================ */
function power(R,side){
  const c=R.club[side];let t=0,n=0;
  c.xi.forEach(function(x){
    const cd=(R.cond&&R.cond[side]&&R.cond[side][x.p.id])||x.p.cond||80;
    t+=CA(x.p,x.slot)*(0.74+0.26*clamp(cd,20,100)/100); n++;
  });
  return n?t/n:50;
}
function scorerFor(club){
  if(typeof pickShooter==='function'){try{return pickShooter(club,false)}catch(e){}}
  return club.xi.length?club.xi[club.xi.length-1].p:null;
}
function extraTime(R,tie,keep){
  const p0=power(R,0),p1=power(R,1),d=clamp(p0-p1,-28,28);
  const hm=tie.neutral?0:0.10;
  const l0=clamp(0.40*Math.exp(0.040*d+hm),0.07,1.5);
  const l1=clamp(0.40*Math.exp(-0.040*d-hm),0.07,1.5);
  const goals=[];
  for(let s=0;s<2;s++){const n=pois(s===0?l0:l1);for(let k=0;k<n;k++)goals.push({s,m:ri(95,120)})}
  goals.sort((x,y)=>x.m-y.m);
  tie.et=true;
  if(keep){tie.feed=tie.feed||[];tie.feed.push({m:90,tx:'Level after ninety. Thirty more minutes of it.'})}
  goals.forEach(function(g){
    const club=R.club[g.s],p=scorerFor(club);
    if(!p)return;
    R.g[g.s]++; R.xg[g.s]+=0.22;
    R.ev.push({m:g.m,s:g.s,t:'goal',who:p.name,wid:p.id,ast:null,astId:null,setp:false,xg:0.22,imp:3,et:true});
    if(keep)tie.feed.push({m:g.m,tx:p.name+' scores in extra time — '+club.abbr+' in front.'});
  });
  try{R.ev.sort((x,y)=>x.m-y.m)}catch(e){}
  if(keep&&!goals.length)tie.feed.push({m:120,tx:'Nothing in it after a hundred and twenty. Penalties.'});
}

function takers(c){
  return c.xi.map(x=>x.p).filter(p=>p.pos!=='GK')
    .sort((p,q)=>(q.a[6]*1.20+q.a[3])-(p.a[6]*1.20+p.a[3]));
}
function shootout(R,tie,keep){
  const cl=[R.club[0],R.club[1]];
  const list=[takers(cl[0]),takers(cl[1])];
  const gk=[cl[0].xi[0]?cl[0].xi[0].p:null, cl[1].xi[0]?cl[1].xi[0].p:null];
  const sc=[0,0],taken=[0,0],shots=[];
  const kick=function(s,pressure){
    const l=list[s]; if(!l.length)return;
    const p=l[taken[s]%l.length]; taken[s]++;
    const g=gk[1-s]?CA(gk[1-s],'GK'):60;
    let pr=0.745+0.0042*(p.a[6]-60)+0.0032*(p.a[3]-60)-0.0034*(g-60)-(pressure?0.03:0);
    pr=clamp(pr,0.40,0.95);
    const ok=rnd()<pr;
    if(ok)sc[s]++;
    if(keep)shots.push({s,n:p.name,ok});
  };
  const decided=function(){
    const r0=Math.max(0,5-taken[0]),r1=Math.max(0,5-taken[1]);
    return sc[0]>sc[1]+r1||sc[1]>sc[0]+r0;
  };
  for(let r=0;r<5;r++){
    for(let s=0;s<2;s++){ if(decided())break; kick(s,false); }
    if(decided())break;
  }
  let guard=0;
  while(sc[0]===sc[1]&&guard++<15){ kick(0,true); kick(1,true); }
  if(sc[0]===sc[1])sc[rnd()<0.5?0:1]++;      // never leave a tie unresolved
  if(keep)tie.shots=shots;
  return sc;
}

/* ============================================================
   PLAYING A TIE
   ============================================================ */
function claimTie(S,rd,tie,R){
  const keep=(tie.h===G.me||tie.a===G.me);
  if(keep)tie.feed=[];
  if(R.g[0]===R.g[1])extraTime(R,tie,keep);
  if(R.g[0]===R.g[1])tie.pens=shootout(R,tie,keep);
  tie.gh=R.g[0]; tie.ga=R.g[1]; tie.done=true;
  tie.win = R.g[0]>R.g[1]?tie.h : R.g[1]>R.g[0]?tie.a
          : (tie.pens&&tie.pens[0]>tie.pens[1]?tie.h:tie.a);
  const lose=tie.win===tie.h?tie.a:tie.h;
  if(C(tie.win).tier>C(lose).tier)tie.up=true;
  gate(tie);
  if(keep)tellResult(S,rd,tie);
}
function simTie(S,rd,tie){
  const h=C(tie.h),a=C(tie.a);
  autoXI(h);autoXI(a);
  const R=simulate(h,a,!!tie.neutral);
  claimTie(S,rd,tie,R);
  try{creditStats(R,tie.h,tie.a)}catch(e){}
  try{rollInjuries(h);rollInjuries(a)}catch(e){}
}
function resolveRound(S,idx){
  const rd=S.rounds[idx];
  if(!rd||rd.done)return;
  rd.ties.forEach(function(t){if(!t.done)simTie(S,rd,t)});
  rd.done=true;
  const surv=rd.ties.map(t=>t.win).concat(rd.byes||[]).filter(i=>i!==undefined&&i!==null);
  if(idx>=5||surv.length<=1){ S.winner=surv.length?surv[0]:null; crown(S); return; }
  drawRound(S,idx+1,surv);
}

function crown(S){
  if(S.winner===null||S.winner===undefined)return;
  const w=C(S.winner);
  w.bal+=WINPOT; w.titles++;
  const f=S.rounds[5]&&S.rounds[5].ties[0];
  const runner=f?(f.win===f.h?C(f.a):C(f.h)):null;
  try{chron(w.name+' won '+S.name)}catch(e){}
  const H=SW.get('history');
  if(H&&typeof H.record==='function'){
    try{H.record('trophy',w.name+' won '+S.name+(runner?', beating '+runner.name:'')+' — '+G.season)}catch(e){}
  }
  if(S.winner===G.me){
    note('YOU WON '+S.name.toUpperCase(),
      'Beat '+(runner?runner.name:'them')+' in the final. A cup in the cabinet and '+money(WINPOT)+
      ' in the bank. Nobody remembers fifth — they remember this.');
    try{chron('YOU won '+S.name)}catch(e){}
  } else if(runner&&runner.id===G.me){
    note('Beaten in the '+S.name+' final','Ninety minutes from it and you came second. '+
      money(PRIZE[5])+' and a medal nobody wants.');
  }
}

/* ============================================================
   TELLING THE PLAYER — the draw is a moment, so treat it like one
   ============================================================ */
function myTie(rd){ return rd?rd.ties.find(t=>t.h===G.me||t.a===G.me)||null:null }
function inRound(rd){ return !!(myTie(rd)||(rd.byes||[]).indexOf(G.me)>=0) }

function drawLine(me_,opp,home){
  const gap=opp.tier-me_.tier;
  if(gap<0) return home?'A '+tierL(opp)+' side coming to your place. One night to be somebody.'
                      :'A '+tierL(opp)+' side, at their ground. Nobody gives you a prayer. Good.';
  if(gap>0) return home?'A '+tierL(opp)+' side at home. Anything but a win and you will hear about it.'
                      :'A '+tierL(opp)+' side away. Small ground, big noise, and a banana skin with your name on it.';
  return home?'Level opposition at home. Win it and get on with it.'
            :'Level opposition, their ground. Take the crowd out of it early.';
}
function tellDraw(S,idx){
  const rd=S.rounds[idx];
  if(!inRound(rd))return;
  const t=myTie(rd);
  const fee=PRIZE[idx];
  if(!t){
    note('Exempt until the '+RNAME[Math.min(5,idx+1)],
      S.name+'. Too big to be dragged round the country in the '+RNAME[idx].toLowerCase()+
      '. '+money(fee)+' for turning up to the draw.');
    return;
  }
  const home=t.h===G.me,opp=C(home?t.a:t.h);
  const where=t.neutral?'On neutral ground.':(home?'At home.':'Away.');
  note('The draw: '+opp.name+(t.neutral?'':(home?' at home':' away')),
    S.name+' · '+RNAME[idx]+' · '+weekDate(rd.week)+'. '+where+' '+drawLine(me(),opp,home)+
    ' '+money(fee)+' banked for getting this far.');
}
function tellResult(S,rd,tie){
  if(rd.i===5)return;                        // the final gets its own moment in crown()
  const home=tie.h===G.me;
  const mine=home?tie.gh:tie.ga, theirs=home?tie.ga:tie.gh;
  const opp=C(home?tie.a:tie.h);
  const won=tie.win===G.me;
  let sc=mine+'–'+theirs;
  if(tie.pens)sc+=' (pens '+(home?tie.pens[0]+'–'+tie.pens[1]:tie.pens[1]+'–'+tie.pens[0])+')';
  else if(tie.et)sc+=' aet';
  if(won){
    const nxt=rd.i<5?RNAME[rd.i+1]:null;
    let body=sc+' against '+opp.name+'. ';
    if(tie.up)body+='A '+tierL(opp)+' side, out. They will be asked about that all week. ';
    body+=nxt?('Into the '+nxt+'. Wait for the draw.'):'';
    note(rd.i===5?'CUP WINNERS':'Through — '+(nxt||'the final'),body);
  } else {
    let body=sc+' against '+opp.name+'. ';
    if(opp.tier>me().tier)body+='A '+tierL(opp)+' side knocked you out. That one follows you around.';
    else body+='Out. Nothing to say that a win next week would not fix.';
    note('Out of '+S.name,body);
    S.outWeek=G.week;
  }
}

/* ============================================================
   VIEWS
   ============================================================ */
function crest(c,s){return crestSVG(c,s||15)}

function tieRow(S,t,rd){
  const h=C(t.h),a=C(t.a);
  const mine=(t.h===G.me||t.a===G.me);
  const wh=t.done&&t.win===t.h, wa=t.done&&t.win===t.a;
  const nm=(c,w)=>`<span style="display:inline-flex;align-items:center;gap:5px;min-width:0">${crest(c,15)}
    <span style="font-weight:${w?700:500};color:${w?'var(--t1)':(t.done?'var(--t3)':'var(--t2)')}">${esc(c.abbr)}</span>
    <span style="font-size:9px;color:var(--t3);letter-spacing:.04em">${tierN(c)}</span>${w?'<span style="color:var(--acc);font-size:10px">▸</span>':''}</span>`;
  let right='<span class="dim">—</span>';
  if(t.done){
    right=`<span class="mono" style="font-weight:700">${t.gh}–${t.ga}</span>`+
      (t.pens?`<span style="color:var(--acc);font-size:10px;margin-left:5px">P ${t.pens[0]}–${t.pens[1]}</span>`
       :t.et?`<span class="dim" style="font-size:10px;margin-left:5px">aet</span>`:'');
  }
  return `<div class="kv" style="align-items:center;${mine?'background:var(--accw);margin:0 -14px;padding:9px 14px;border-radius:8px':''}">
    <span class="k2" style="display:flex;align-items:center;gap:7px;min-width:0;flex:1;flex-wrap:nowrap">
      ${nm(h,wh)}<span class="dim" style="font-size:11px">v</span>${nm(a,wa)}
      ${t.up?'<span class="pill acc" style="font-size:9px;padding:1px 5px">UPSET</span>':''}</span>
    <span class="v2" style="white-space:nowrap">${right}</span></div>`;
}

function renderCup(){
  const S=st();
  if(!live(S))return `<div class="card"><div class="dim">No cup this season.</div></div>`;
  let v=(typeof S.view==='number')?S.view:S.rounds.length-1;
  v=clamp(v,0,S.rounds.length-1);
  const rd=S.rounds[v];
  const stat=statusOf(S);

  const chips=`<div class="chips" style="padding-top:0">${S.rounds.map((r,i)=>
    `<button aria-selected="${i===v}" onclick="cupView(${i})">${RSHORT[i]}</button>`).join('')}</div>`;

  const crown_=(S.winner!==null&&S.winner!==undefined)?
    `<div class="slab" style="margin-bottom:12px"><div class="k">${esc(S.name)} · ${G.season}</div>
      <div class="v" style="font-size:26px;line-height:29px">${esc(C(S.winner).name)}</div>
      <div class="d">${S.winner===G.me?'You lifted it. Nobody can take it off you.':'Winners. Somebody else’s year.'}</div></div>`:'';

  const mine=`<div class="card" style="margin-bottom:10px">
    <div class="kv"><span class="k2">${esc(me().name)}</span>
      <span class="v2" style="color:${stat.alive?'var(--win)':'var(--loss)'}">
      ${stat.round?esc(stat.alive?(stat.won?'WINNERS':RNAME[stat.round-1]):'OUT · '+RNAME[stat.round-1]):'Not entered'}</span></div>
    <div style="font-size:12px;color:var(--t3);padding-top:8px;border-top:1px solid var(--hair)">
      ${esc(stat.round?(stat.won?'Champions. That is the season, whatever the table says.'
        :stat.alive?'Still in it. '+money(PRIZE[stat.round-1])+' banked so far.'
        :'Knocked out. The league is all you have left.'):'Not in this competition.')}</div></div>`;

  const alive=aliveList(S);
  const left=`<div class="sechead">Still standing<span class="n">${alive.length}</span></div>
    <div class="card" style="display:flex;flex-wrap:wrap;gap:6px">
      ${alive.map(i=>`<span class="pill" style="${i===G.me?'background:var(--accw);color:var(--acc)':''}">
        ${esc(C(i).abbr)} <span style="opacity:.6;font-size:9px">${tierN(C(i))}</span></span>`).join('')||'<span class="dim">—</span>'}</div>`;

  const byes=(rd.byes&&rd.byes.length)?`<div class="card" style="margin-top:10px;font-size:12px;color:var(--t3)">
    Exempt until the ${esc(RNAME[Math.min(5,rd.i+1)])}: ${rd.byes.map(i=>esc(C(i).abbr)).join(', ')}</div>`:'';

  return `${chips}${crown_}${mine}
    <div class="sechead">${esc(rd.name)}<span class="n">${weekDate(rd.week)}</span></div>
    <div class="card" style="padding:4px 14px 8px">${rd.ties.map(t=>tieRow(S,t,rd)).join('')||'<div class="dim" style="padding:10px 0">Not drawn.</div>'}</div>
    ${rd.i===5?`<div class="card" style="margin-top:10px;font-size:12px;color:var(--t3)">One game, neutral ground, no second chance.</div>`:''}
    ${byes}${left}`;
}

function aliveList(S){
  if(S.winner!==null&&S.winner!==undefined)return [S.winner];
  const rd=S.rounds[S.rounds.length-1];
  const out=[];
  rd.ties.forEach(t=>{ if(t.done){out.push(t.win)} else {out.push(t.h,t.a)} });
  (rd.byes||[]).forEach(i=>out.push(i));
  return out.sort((a,b)=>C(a).tier-C(b).tier||C(b).rep-C(a).rep);
}

function statusOf(S){
  if(!live(S))return {round:0,alive:false,name:S&&S.name||'',won:false};
  let r=-1;
  S.rounds.forEach(function(rd,i){ if(inRound(rd))r=i });
  if(r<0)return {round:0,alive:false,name:S.name,won:false};
  const rd=S.rounds[r],t=myTie(rd);
  const alive = !t ? true : (!t.done ? true : t.win===G.me);
  return {round:r+1,alive,name:S.name,roundName:RNAME[r],won:S.winner===G.me};
}

/* ---------- hub block: the draw, and the tie coming ---------- */
function hubBlock(){
  const S=st(); if(!live(S))return null;
  const stat=statusOf(S);
  if(!stat.round)return null;
  if(!stat.alive){
    if(S.outWeek===null||S.outWeek===undefined||G.week-S.outWeek>1)return null;
    return `<div class="card" style="margin-top:10px" onclick="cupOpen()">
      <div style="font-size:10px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--t3)">${esc(S.name)}</div>
      <div style="font-size:14px;font-weight:600;margin-top:5px">Out at the ${esc(RNAME[stat.round-1])}.</div>
      <div class="dim" style="font-size:12px;margin-top:2px">No replay, no second leg. That is the point of it.</div></div>`;
  }
  const rd=S.rounds[stat.round-1];
  if(rd.done)return null;
  const t=myTie(rd);
  if(!t)return null;
  if(G.week===rd.week)return null;              // the fixture card already has it
  const home=t.h===G.me,opp=C(home?t.a:t.h);
  const fresh=(S.drawWeek===G.week);
  return `<div class="card" style="margin-top:10px;border-color:var(--acc)" onclick="cupOpen()">
    <div style="font-size:10px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--acc)">
      ${fresh?'The draw is out · ':''}${esc(S.name)} · ${esc(rd.name)}</div>
    <div class="row" style="gap:10px;margin-top:9px;align-items:center">
      ${crest(opp,30)}
      <div style="min-width:0">
        <div style="font-weight:600;font-size:14px">${t.neutral?'':(home?'Home to ':'Away at ')}${esc(opp.name)}</div>
        <div class="dim" style="font-size:12px">${esc(weekDate(rd.week))} · ${esc(tierL(opp))}${t.neutral?' · neutral ground':''}</div>
      </div><span class="spacer"></span><span style="color:var(--t3);font-size:18px">›</span></div>
    <div style="border-top:1px solid var(--hair);margin-top:10px;padding-top:9px;font-size:13px;color:var(--t2)">
      ${esc(drawLine(me(),opp,home))}</div></div>`;
}

/* ---------- post-match block: extra time and the shootout ---------- */
function reportBlock(last){
  const S=st(); if(!live(S)||!last||!last.f||!last.f.cup)return null;
  const rd=S.rounds[last.f.cup.ri]; if(!rd)return null;
  const t=rd.ties[last.f.cup.ti]; if(!t||!t.done)return null;
  if(!t.et&&!t.pens)return null;
  const home=t.h===G.me;
  const feed=(t.feed||[]).map(f=>`<div class="kv"><span class="k2 mono" style="min-width:34px">${f.m}'</span>
    <span class="v2" style="font-weight:500;text-align:left;flex:1">${esc(f.tx)}</span></div>`).join('');
  let pens='';
  if(t.pens){
    const rows=(t.shots||[]).map(s=>`<div class="kv" style="padding:6px 0">
      <span class="k2" style="display:flex;align-items:center;gap:6px">${crest(C(s.s===0?t.h:t.a),14)}${esc(s.n)}</span>
      <span class="v2" style="color:${s.ok?'var(--win)':'var(--loss)'}">${s.ok?'✓ scored':'✗ missed'}</span></div>`).join('');
    const meP=home?t.pens[0]:t.pens[1], thP=home?t.pens[1]:t.pens[0];
    pens=`<div class="sechead" style="margin-top:12px">Penalties<span class="n">${t.pens[0]}–${t.pens[1]}</span></div>
      <div class="card" style="background:var(--s1);padding:4px 14px 8px">${rows||'<div class="dim" style="padding:8px 0">—</div>'}</div>
      <div style="font-size:13px;color:var(--t2);margin:8px 2px 0">${esc(meP>thP
        ?'You held your nerve from twelve yards. That is all it is.'
        :'Beaten on penalties. Nobody trains for that and everybody says they do.')}</div>`;
  }
  return `<div class="sechead" style="margin-top:12px">${esc(t.et?'Extra time':'After ninety')}</div>
    <div class="card" style="background:var(--s1);padding:4px 14px 8px">${feed||'<div class="dim" style="padding:8px 0">—</div>'}</div>${pens}`;
}

/* ---------- taps ---------- */
window.cupOpen=function(){G.worldView='cup';G.tab='world';render()};
window.cupView=function(i){const S=st();if(S)S.view=i;render()};

/* ============================================================
   REGISTRATION
   ============================================================ */
SW.register({
  id:'cup',

  init(){
    const S=st();
    Object.keys(S).forEach(k=>delete S[k]);
    S.name='The '+pick(CUPA)+' '+pick(CUPB);
    S.off=!(me()&&me().nat==='eng');
    if(S.off)return;
    seedSeason(S);
  },

  onLoad(){
    const S=st();
    if(!S.name)S.name='The '+pick(CUPA)+' '+pick(CUPB);
    if(S.off)return;
    if(!S.rounds||!S.rounds.length){        // save made before this module existed
      if(me()&&me().nat==='eng'&&G.week<WEEKS[0])seedSeason(S); else S.off=true;
    }
  },

  onWeek(week){
    const S=st(); if(!live(S))return;
    const played=week-1;                    // the core increments before firing
    const idx=WEEKS.indexOf(played);
    if(idx<0||!S.rounds[idx])return;
    if(!S.rounds[idx].done)resolveRound(S,idx);
  },

  onSeasonEndAfter(){
    const S=st();
    const nm=S.name||('The '+pick(CUPA)+' '+pick(CUPB));
    Object.keys(S).forEach(k=>delete S[k]);
    S.name=nm;
    S.off=!(me()&&me().nat==='eng');
    if(S.off)return;
    seedSeason(S);
  },

  /* our fixture for this week — returned for the WHOLE week, played or not,
     because the core counts weekFixtures() to decide when the week is over. */
  extraFixtures(week){
    const S=st(); if(!live(S))return [];
    const idx=WEEKS.indexOf(week); if(idx<0)return [];
    const rd=S.rounds[idx]; if(!rd)return [];
    const ti=rd.ties.findIndex(t=>t.h===G.me||t.a===G.me);
    if(ti<0)return [];
    const t=rd.ties[ti];
    return [{home:t.h,away:t.a,neutral:!!t.neutral,
             comp:{name:S.name,key:'cup'},stage:rd.name,cup:{ri:idx,ti}}];
  },

  /* claim the result, settle the tie, then run the rest of the round */
  applyResult(m){
    if(!m||!m.f||!m.f.comp||m.f.comp.key!=='cup')return null;
    const S=st(); if(!live(S))return true;
    const ref=m.f.cup; if(!ref)return true;
    const rd=S.rounds[ref.ri]; if(!rd)return true;
    const tie=rd.ties[ref.ti]; if(!tie)return true;
    if(!tie.done)claimTie(S,rd,tie,m.R);
    if(!rd.done)resolveRound(S,ref.ri);
    return true;
  },

  worldTabs(){
    const S=st(); if(!live(S))return [];
    return [{key:'cup',label:'CUP',render:renderCup}];
  },

  hubBlocks(){ const b=hubBlock(); return b?[b]:[] },

  reportBlocks(last){ const b=reportBlock(last); return b?[b]:[] },

  /* ---- published interface ---- */
  status(){ const S=st(); if(!live(S))return null; return statusOf(S) }
});

})();
