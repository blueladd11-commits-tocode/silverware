/* ============================================================
   SILVERWARE module: board
   Board confidence, the sack, and the next job.
   The stakes module. Managers are judged on the gap between
   expectation and result — never on results alone.
   ============================================================ */
(function(){

const CUPW=[7,15,23,30,33,36];          // cup rounds, per handbook §6
const GRACE=10;                          // never sacked inside the first 10 matches of a save
const CLUBGRACE=6;                       // and never inside 6 matches of a new job
const WARN_GAP=3;                        // matches between the formal warning and the sack

const DEF={conf:60,games:0,clubGames:0,stage:0,sacked:false,everSacked:0,jobs:0,
  log:[],warnAt:null,pending:null,lastRev:-1,holds:0,offers:[],
  cupDepth:0,cupName:'',euroBest:0,euroKey:'',wStreak:0,lStreak:0,
  rec:{P:0,W:0,D:0,L:0},since:0,snap:null,react:''};

function S(){
  const s=SW.state('board');
  for(const k in DEF) if(s[k]===undefined) s[k]=(typeof DEF[k]==='object'&&DEF[k]!==null)?JSON.parse(JSON.stringify(DEF[k])):DEF[k];
  return s;
}

/* ---------- the expectation model ----------
   What a reasonable board would have expected from this fixture, 0 = certain
   defeat, 1 = certain win. Calibrated against the match engine itself: 1,400
   sampled simulations fit to score = 0.5 + 0.0158 per point of squad strength,
   plus 0.051 for playing at home.

   Strength is the best eleven in the SQUAD, not the eleven you picked — the
   board judges the squad it bought you, so resting your stars lowers your
   results without lowering what they expected. This gap between expectation and
   outcome is the whole module: it is the only reason losing at home to the
   bottom club costs far more than losing away to the champions. */
const XI_SLOPE=0.0158, HOME_EDGE=0.051;
function strength(c){
  if(!c||!c.squad)return 60;
  const a=c.squad.filter(p=>!p.youth).map(p=>CA(p)).sort((x,y)=>y-x).slice(0,11);
  if(!a.length)return 60;
  return a.reduce((s,v)=>s+v,0)/a.length;
}
function expect(oppId,home,neutral){
  const a=me(),b=G.clubs[oppId];
  if(!a||!b)return 0.5;
  let e=0.5+(strength(a)-strength(b))*XI_SLOPE;
  if(!neutral)e+=home?HOME_EDGE:-HOME_EDGE;
  return clamp(e,0.10,0.90);
}
function compWeight(key){
  if(key==='league')return 1;
  if(key==='ucl'||key==='uel'||key==='uecl')return 0.7;
  return 0.8;
}
function band(v){
  if(v>=82)return{k:'Delighted',t:'They are delighted with you.',c:'var(--win)'};
  if(v>=66)return{k:'Happy',t:'They are happy. Nothing is being questioned.',c:'var(--win)'};
  if(v>=52)return{k:'Content',t:'They are content. Keep it that way.',c:'var(--acc)'};
  if(v>=38)return{k:'Watching',t:'They are watching. The tone in the room has changed.',c:'var(--acc)'};
  if(v>=26)return{k:'Unconvinced',t:'The mood has turned. You need results, and quickly.',c:'var(--inj)'};
  if(v>=13)return{k:'On the brink',t:'You are one bad run from the sack.',c:'var(--loss)'};
  return{k:'Finished',t:'They are in a room deciding your future.',c:'var(--loss)'};
}
function sgn(n){return (n>0?'+':n<0?'−':'')+Math.abs(n).toFixed(1)}
/* The core's ord() currently returns "1th"/"3th" — see the final report.
   Local correct version so board copy reads properly until the core is fixed. */
function ordn(n){n=Math.round(n);const t=n%100;
  if(t>=11&&t<=13)return n+'th';
  return n+({1:'st',2:'nd',3:'rd'}[n%10]||'th');}

/* ---------- adjust ---------- */
function adjust(d,reason){
  const s=S();
  d=Number(d)||0;
  if(!d)return Math.round(s.conf);
  const before=s.conf;
  s.conf=clamp(Math.round((s.conf+d)*10)/10,0,100);
  const real=Math.round((s.conf-before)*10)/10;
  if(reason&&real!==0){
    s.log.unshift({s:G.season,w:G.week,d:real,r:String(reason)});
    if(s.log.length>16)s.log.length=16;
  }
  return Math.round(s.conf);
}

/* ---------- escalation ---------- */
function canSack(s){
  if(s.sacked)return false;
  if(s.games<GRACE)return false;
  if(s.clubGames<CLUBGRACE)return false;
  if(s.warnAt===null)return false;                 // never without a formal warning
  if(s.games-s.warnAt<WARN_GAP)return false;       // and never the very next week
  return true;
}
/* Returns 'warn1' | 'warn2' | 'sack' | null. Called only from our own hooks. */
function evaluate(){
  const s=S();
  if(s.sacked)return null;
  if(s.conf>=56&&s.stage>0){s.stage=0;s.warnAt=null;}   // you fixed it; the file is closed
  if(s.conf<13){
    if(s.stage<2){s.conf=Math.max(s.conf,13.5);return escalate(2)}
    if(canSack(s))return 'sack';
    return null;
  }
  if(s.conf<28&&s.stage<2)return escalate(2);
  if(s.conf<45&&s.stage<1)return escalate(1);
  return null;
}
function escalate(stage){
  const s=S();
  s.stage=stage;
  if(stage===2){
    s.warnAt=s.games;
    s.log.unshift({s:G.season,w:G.week,d:0,r:'formal warning issued'});
    note('A formal warning',
      'The chairman put it in writing. "We are not going to sit through much more of this. Results, or we make a change."');
    return 'warn2';
  }
  note('A quiet word',
    'The chairman caught you in the corridor. "Nobody is panicking. But they are starting to say your name in that tone."');
  return 'warn1';
}

/* ---------- periodic board review ---------- */
function review(){
  const s=S(),c=me();
  if(!c)return;
  const parts=[];let tot=0;
  const pos=myPos(),target=(G.objective&&G.objective.pos)||10;
  const gap=pos-target;
  const d=clamp(-gap*0.55,-5,2.5);
  if(Math.abs(d)>=0.4){
    tot+=d;
    parts.push([d, ordn(pos)+' in the table — '+(gap>0?'short of the target':'ahead of the target')]);
  }
  const ratio=costRatio(c);
  if(ratio>95){tot-=5;parts.push([-5,'wage bill is '+ratio+'% of revenue'])}
  else if(ratio>85){tot-=3;parts.push([-3,'wage bill is over the 85% cap'])}
  else if(ratio<60){tot+=1;parts.push([1,'wages are under control'])}
  const mo=SW.get('morale');
  if(mo&&typeof mo.harmony==='function'){
    let h=null;try{h=mo.harmony()}catch(e){}
    if(typeof h==='number'){
      if(h<-40){tot-=3;parts.push([-3,'the dressing room has turned'])}
      else if(h<-15){tot-=1.5;parts.push([-1.5,'the dressing room is unsettled'])}
      else if(h>45){tot+=1.5;parts.push([1.5,'the dressing room is with you'])}
    }
  }
  if(s.cupDepth>=3){const b=s.cupDepth>=5?3:2;tot+=b;parts.push([b,'still alive in '+(s.cupName||'the cup')])}
  if(s.euroBest>=1){const b=s.euroBest>=3?3:2;tot+=b;parts.push([b,'still in Europe'])}
  if(!parts.length)return;
  parts.forEach(([v,r])=>adjust(v,r));
  if(tot<=-3){
    note('The board met',parts.filter(p=>p[0]<0).map(p=>p[1]).join('; ')+'. They did not enjoy it.');
  }
}

/* ---------- job offers ---------- */
function offerFrom(c){
  const o=objectiveFor(c);
  return {cid:c.id,rep:c.rep,obj:o.text,pos:o.pos,budget:c.bal,exp:G.week+3,league:leagueOf(c.id).name};
}
function makeOffers(kind,shift){
  const s=S(),my=me();
  const rep=my?my.rep:60;
  let lo,hi;
  if(kind==='sacked'){lo=rep-30;hi=rep+2}
  else{lo=rep+2;hi=rep+26}
  lo=clamp(lo+(shift||0),20,94);hi=clamp(hi+(shift||0),24,96);
  let pool=G.clubs.filter(c=>c.id!==G.me&&c.rep>=lo&&c.rep<=hi);
  if(pool.length<3)pool=G.clubs.filter(c=>c.id!==G.me&&c.rep>=lo-12&&c.rep<=hi+8);
  if(!pool.length)pool=G.clubs.filter(c=>c.id!==G.me);
  /* a vacancy is most plausible where somebody else is already failing */
  const scored=pool.map(c=>{
    let under=0;
    try{const t=leagueTable(leagueOf(c.id));under=(t.findIndex(x=>x.id===c.id)+1)-objectiveFor(c).pos}catch(e){}
    return {c,under};
  }).sort((a,b)=>b.under-a.under);
  const short=scored.slice(0,Math.max(5,Math.round(scored.length*0.4)));
  const out=[],used={};
  const want=kind==='sacked'?(rnd()<0.55?3:2):(rnd()<0.4?2:1);
  let guard=0;
  while(out.length<want&&guard++<60){
    const p=pick(short);
    if(!p||used[p.c.id])continue;
    used[p.c.id]=true;out.push(offerFrom(p.c));
  }
  if(!out.length&&pool.length)out.push(offerFrom(pick(pool)));
  s.offers=out;
  return out;
}
function recommended(list){
  let best=null,bs=-1e9;
  list.forEach(o=>{
    const harsh=o.pos<=1?14:o.pos<=3?7:o.pos<=9?2:0;
    const sc=o.rep+o.budget/1e7-harsh;
    if(sc>bs){bs=sc;best=o}
  });
  return best;
}
function recWhy(o,list){
  if(list.length===1)return 'The only one on the table. Take it.';
  if(o.pos<=3)return 'Biggest club of the '+list.length+'. The target is harsh, but the squad is there.';
  if(o.rep<50)return 'Small club, achievable target. A season here rebuilds your name.';
  return 'Best balance of squad, money and what they will accept.';
}

/* ---------- takeover shell ---------- */
function takeover(html){
  closeSheet();
  let el=document.getElementById('boardTake');
  if(!el){el=document.createElement('div');el.id='boardTake';document.body.appendChild(el)}
  el.setAttribute('style','position:fixed;inset:0;z-index:80;background:var(--bg);max-width:480px;margin:0 auto;'+
    'overflow-y:auto;-webkit-overflow-scrolling:touch;padding:26px 16px calc(30px + env(safe-area-inset-bottom))');
  el.innerHTML=html;
  try{window.scrollTo(0,0)}catch(e){}
}
function closeTakeover(){const el=document.getElementById('boardTake');if(el)el.remove()}

function recLine(){
  const s=S();
  return s.rec.P+' played · '+s.rec.W+'W '+s.rec.D+'D '+s.rec.L+'L';
}
const QUOTES=[
 'We gave you the squad. You gave us this.',
 'There is no version of this where you keep the job.',
 'We have been patient. Patience is not a strategy.',
 'The supporters stopped singing your name in November.'];

/* ---------- the sack ---------- */
function showSack(reasonLine,snap){
  const s=S(),c=me();
  /* The season-end sack is fired from a setTimeout, by which point the core has
     already rolled the season: tables are zeroed and G.objective is next year's.
     Render from the snapshot taken when the decision was actually made. */
  const sn=snap||{pos:myPos(),obj:(G.objective?G.objective.text:'—'),conf:s.conf};
  s.sacked=true;s.everSacked++;s.pending=null;
  const q=pick(QUOTES);
  chron('Sacked by '+c.name);
  const list=makeOffers('sacked',0);
  takeover(`
   <div class="slab" style="background:var(--loss)">
     <div class="k">${esc(c.name)}</div>
     <div class="v" style="font-size:30px;line-height:33px">The board have seen enough.<br>Clear your desk.</div>
     <div class="d">${esc(q)}</div></div>
   <div class="sechead">What they said</div>
   <div class="card"><div style="font-size:14px;color:var(--t2);line-height:20px">${esc(reasonLine)}</div></div>
   <div class="sechead">Your record there</div>
   <div class="card">
     <div class="kv"><span class="k2">Games</span><span class="v2">${recLine()}</span></div>
     <div class="kv"><span class="k2">Their target</span><span class="v2">${esc(sn.obj||'—')}</span></div>
     <div class="kv"><span class="k2">Where you left them</span><span class="v2">${ordn(sn.pos)}</span></div>
     <div class="kv"><span class="k2">Board confidence</span><span class="v2" style="color:var(--loss)">${Math.round(sn.conf)} / 100</span></div>
   </div>
   <div style="font-size:13px;color:var(--t3);margin:14px 2px 0;line-height:19px">
     ${list.length?'The phone has already rung. '+(list.length===1?'One club':list.length+' clubs')+' want to talk.'
       :'Nobody has called yet.'}</div>
   <button class="btn" style="margin-top:16px" onclick="boardShowOffers()">See who wants you</button>`);
  save();
}

/* ---------- the offers screen ---------- */
function offerCard(o,isRec){
  const c=G.clubs[o.cid];
  return `<div class="opt ${isRec?'rec':''}" onclick="boardTakeJob(${o.cid})" style="align-items:flex-start">
    ${crestSVG(c,34)}
    <div style="min-width:0;flex:1">
      <div style="font-weight:700;font-size:15px">${esc(c.name)}</div>
      <div class="dim" style="font-size:12px">${esc(o.league)} · reputation ${o.rep}</div>
      <div style="font-size:12px;color:var(--t2);margin-top:5px">Target: <b>${esc(o.obj)}</b></div>
      <div style="font-size:12px;color:var(--trf);margin-top:2px">Budget ${money(o.budget)}</div>
    </div>
    ${isRec?'<span class="st">Advised</span>':''}</div>`;
}
function showOffers(){
  const s=S(),list=s.offers||[];
  if(!list.length){
    takeover(`<div class="slab"><div class="k">Out of work</div>
      <div class="v" style="font-size:28px;line-height:31px">Nobody is calling.</div>
      <div class="d">You held out once too often.</div></div>
     <div class="card" style="margin-top:14px"><div style="font-size:14px;color:var(--t2)">
      Somebody will come back around. Take what is there when it comes.</div></div>
     <button class="btn" style="margin-top:16px" onclick="boardHoldOut()">Wait for the phone</button>`);
    return;
  }
  const rec=recommended(list);
  takeover(`
   <div class="slab"><div class="k">${s.sacked?'Out of work':'An approach'}</div>
     <div class="v" style="font-size:28px;line-height:31px">${list.length===1?'One job on the table.':list.length+' jobs on the table.'}</div>
     <div class="d">Pick one. You are only as good as the last club that wanted you.</div></div>
   <div class="sechead">Offers</div>
   ${list.map(o=>offerCard(o,rec&&o.cid===rec.cid)).join('')}
   ${rec?`<div class="card" style="margin-top:4px">
     <div style="font-size:13px;color:var(--t2)"><b style="color:var(--acc)">◆ Your agent</b> —
     ${esc(recWhy(rec,list))}</div></div>`:''}
   ${s.sacked?(s.holds<2?`<button class="btn ghost" style="margin-top:12px" onclick="boardHoldOut()">
      Hold out for something better</button>
     <div style="font-size:12px;color:var(--t3);margin:9px 2px 0;line-height:17px">
      Turn these down and they go to somebody else. What comes next might be bigger. It might be nothing.</div>`
    :`<div style="font-size:12px;color:var(--t3);margin:12px 2px 0;line-height:17px">
      You have held out twice. This is the list. Take one.</div>`)
    :`<button class="btn ghost" style="margin-top:12px" onclick="boardDecline()">Stay where you are</button>`}`);
}
function holdOut(){
  const s=S();
  s.holds++;
  const roll=rnd();
  let shift=-6;
  if(roll<0.30)shift=6;                       // somebody bigger came in
  else if(roll<0.55)shift=0;
  const list=makeOffers('sacked',shift);
  if(roll>=0.80&&list.length>1)list.splice(0,1);   // the best one went elsewhere
  if(roll>=0.93)s.offers=[];                       // nobody at all this time
  if(s.holds>=2&&!s.offers.length)makeOffers('sacked',-14);
  showOffers();
  save();
}
function takeJob(cid){
  const s=S(),c=G.clubs[cid];
  if(!c)return;
  const from=me()?me().name:'';
  G.me=cid;
  G.objective=objectiveFor(me());
  G.objective.accepted=false;
  G.tab='home';G.clubView='overview';G.squadView='lineup';G.marketView='scout';
  G.worldView='L'+myLeague().id;
  G.shortlist=[];G.fxIndex=0;G.lastResult=null;G.offers=[];
  autoXI(me());
  s.sacked=false;s.pending=null;s.offers=[];s.holds=0;s.stage=0;s.warnAt=null;
  s.conf=s.everSacked?55:64;
  s.log=[];s.rec={P:0,W:0,D:0,L:0};s.clubGames=0;s.since=G.season;
  s.cupDepth=0;s.cupName='';s.euroBest=0;s.euroKey='';s.lastRev=-1;s.jobs++;
  s.wStreak=0;s.lStreak=0;s.react='';
  s.log.unshift({s:G.season,w:G.week,d:0,r:'appointed at '+c.name});
  chron('Took the job at '+c.name);
  note('You have a job again',c.name+'. They want: '+G.objective.text+'. Agree it and get to work.');
  const h=SW.get('history');
  if(h&&typeof h.record==='function'){try{h.record('era','Took over at '+c.name+(from?' after '+from:''))}catch(e){}}
  closeTakeover();
  save();render();
}
function declineOffers(){
  const s=S();
  s.offers=[];
  note('You turned them down','You told them no. Word gets round that you are settled.');
  closeTakeover();save();render();
}

/* ---------- the formal warning takeover ---------- */
function showWarning(){
  const s=S();s.pending=null;
  takeover(`
   <div class="slab" style="background:var(--inj)">
     <div class="k">Formal warning</div>
     <div class="v" style="font-size:28px;line-height:31px">You are on borrowed time.</div>
     <div class="d">"Results, or we make a change. That is the whole conversation."</div></div>
   <div class="sechead">Where you are</div>
   <div class="card">
     <div class="kv"><span class="k2">Board confidence</span><span class="v2" style="color:var(--loss)">${Math.round(s.conf)} / 100</span></div>
     <div class="kv"><span class="k2">League</span><span class="v2">${ordn(myPos())} of 20</span></div>
     <div class="kv"><span class="k2">Their target</span><span class="v2">${esc(G.objective?G.objective.text:'—')}</span></div>
     <div class="kv"><span class="k2">Record</span><span class="v2">${recLine()}</span></div></div>
   <div class="sechead">Why</div>
   <div class="card">${logRows(5)||'<div class="dim">Nothing on file.</div>'}</div>
   <div style="font-size:13px;color:var(--t2);margin:14px 2px 0;line-height:19px">
     They will not move for at least three more games. Win two of them and this goes away.</div>
   <button class="btn" style="margin-top:16px" onclick="boardAckWarning()">Understood</button>`);
  save();
}

/* ---------- shared bits of UI ---------- */
function logRows(n){
  const s=S();
  return s.log.slice(0,n).map(e=>`<div class="kv">
    <span class="k2" style="font-size:13px">${esc(e.r)}</span>
    <span class="v2" style="color:${e.d>0?'var(--win)':e.d<0?'var(--loss)':'var(--t3)'}">${sgn(e.d)}</span></div>`).join('');
}
function meter(){
  const s=S(),v=Math.round(s.conf),b=band(v);
  return `<div class="card">
    <div class="row"><span class="muted">Board confidence</span><span class="spacer"></span>
      <span class="pill" style="background:transparent;border:1px solid ${b.c};color:${b.c}">${b.k}</span>
      <span style="font-weight:700;font-size:20px;color:${b.c};margin-left:8px">${v}</span></div>
    <div style="height:8px;background:var(--s3);border-radius:4px;margin:11px 0 8px;overflow:hidden;position:relative">
      <div style="height:100%;width:${v}%;background:${b.c}"></div>
      <div style="position:absolute;left:28%;top:-3px;bottom:-3px;width:2px;background:var(--t3)"></div>
      <div style="position:absolute;left:13%;top:-3px;bottom:-3px;width:2px;background:var(--t1)"></div></div>
    <div style="font-size:13px;color:var(--t1);font-weight:600">${esc(b.t)}</div>
    <div style="font-size:12px;color:var(--t3);margin-top:4px">Marks are the warning line and the sacking line.</div>
  </div>`;
}

/* ---------- the board panel sheet ---------- */
function panel(){
  const s=S(),c=me(),v=Math.round(s.conf),b=band(v);
  const target=(G.objective&&G.objective.pos)||10,pos=myPos();
  sheet(`<h3>The board</h3>
   <div class="sh-sub">${esc(b.t)}</div>
   ${meter()}
   <div class="sechead">What moved it</div>
   <div class="card" style="background:var(--s1)">${logRows(8)||'<div class="dim">Nothing yet. Play a game.</div>'}</div>
   <div class="sechead">What they want</div>
   <div class="card" style="background:var(--s1)">
     <div class="kv"><span class="k2">Objective</span><span class="v2">${esc(G.objective?G.objective.text:'—')}</span></div>
     <div class="kv"><span class="k2">Currently</span><span class="v2" style="color:${pos<=target?'var(--win)':'var(--loss)'}">${ordn(pos)}</span></div>
     <div class="kv"><span class="k2">Wages vs revenue</span><span class="v2" style="color:${costRatio(c)>85?'var(--loss)':'var(--t1)'}">${costRatio(c)}%</span></div>
     ${s.cupDepth?`<div class="kv"><span class="k2">${esc(s.cupName||'Cup')}</span><span class="v2">Round ${s.cupDepth}</span></div>`:''}
     ${s.euroBest?`<div class="kv"><span class="k2">Europe</span><span class="v2">${esc(euroStatusLine(c)||'In it')}</span></div>`:''}
     <div class="kv"><span class="k2">Your record</span><span class="v2">${recLine()}</span></div></div>
   <div style="font-size:12px;color:var(--t3);margin:12px 2px 0;line-height:17px">
     They judge the gap between what was expected and what you got. Losing at home to the bottom club costs far
     more than losing away to the champions.</div>
   <button class="btn ghost" style="margin-top:14px" onclick="closeSheet()">Close</button>`);
}

/* ---------- globals the UI taps ---------- */
window.boardPanel=panel;
window.boardShowOffers=function(){showOffers()};
window.boardHoldOut=function(){holdOut()};
window.boardTakeJob=function(id){takeJob(id)};
window.boardDecline=function(){declineOffers()};
window.boardAckWarning=function(){closeTakeover();save();render()};
window.boardOpenOffers=function(){const s=S();if(s.offers&&s.offers.length)showOffers();else panel()};

/* ============================================================
   REGISTRATION
   ============================================================ */
SW.register({
  id:'board',

  /* --- published interface --- */
  confidence(){return Math.round(S().conf)},
  adjust(d,reason){return adjust(d,reason)},
  isSacked(){return !!S().sacked},

  init(){
    const s=SW.state('board');
    for(const k in DEF)s[k]=(typeof DEF[k]==='object'&&DEF[k]!==null)?JSON.parse(JSON.stringify(DEF[k])):DEF[k];
    s.since=G.season;
  },

  onLoad(){
    const s=S();
    if(s.sacked){setTimeout(()=>{try{showOffers()}catch(e){}},0)}
  },

  onMatchEnd(m){
    const s=S();
    if(s.sacked)return;
    s.games++;s.clubGames++;
    const my=m.R.g[m.mine],th=m.R.g[1-m.mine];
    const opp=m.mine===0?m.ai:m.hi;
    s.rec.P++;
    if(my>th)s.rec.W++;else if(my===th)s.rec.D++;else s.rec.L++;

    const e=expect(opp,m.mine===0,!!(m.f&&m.f.neutral));
    const act=my>th?1:my===th?0.5:0;
    let d=(act-e)*10*compWeight(m.f&&m.f.comp?m.f.comp.key:'league');
    if(d<0)d*=1.12;                                  // boards punish harder than they praise
    d=Math.round(d*10)/10;
    const oc=G.clubs[opp];
    const where=m.f&&m.f.neutral?'on neutral ground':(m.mine===0?'at home':'away');
    let r;
    if(act===1)r='Beat '+oc.abbr+' '+where+(e<0.36?' — nobody expected that':e>0.70?' — as expected':'');
    else if(act===0.5)r='Drew with '+oc.abbr+' '+where+(e>0.66?' — two points dropped':'');
    else r='Lost to '+oc.abbr+' '+where+(e>0.66?' — a game you should not lose':e<0.36?' — no shame in it':'');
    adjust(d,r);
    s.react=(d>=2.5?'They will take that.':d>0?'Fine. Nothing more than expected.'
      :d>-2.5?'They expected that, roughly.':'That one hurt upstairs.')+' '+sgn(d);

    /* streaks — compounding, but only every second game so it does not
       double-count the per-match arithmetic above */
    if(act===0){s.wStreak=0;s.lStreak=(s.lStreak||0)+1}
    else if(act===1){s.lStreak=0;s.wStreak=(s.wStreak||0)+1}
    else{s.lStreak=0;s.wStreak=0}
    if(s.lStreak>=3&&s.lStreak%2===1){
      adjust(-3,s.lStreak+' defeats on the spin');
      s.react+=' · a '+ordn(s.lStreak)+' straight defeat';
    }
    if(s.wStreak>=4&&s.wStreak%3===1)adjust(2,s.wStreak+' wins on the spin');

    const ev=evaluate();
    if(ev==='sack')s.pending='sack';
    else if(ev==='warn2')s.pending='warn2';
  },

  /* claimed narrowly — only for a warning or the sack */
  afterReport(){
    const s=S();
    if(s.pending==='sack'){
      showSack('Confidence bottomed out and stayed there. You were warned in writing and the results did not turn.');
      return true;
    }
    if(s.pending==='warn2'){showWarning();return true}
    s.pending=null;
    return null;
  },

  onWeek(week){
    const s=S(),c=me();
    if(s.sacked||!c)return;

    /* cup progress — depth derived from the calendar, not from a label */
    const cu=SW.get('cup');
    if(cu&&typeof cu.status==='function'){
      let st=null;try{st=cu.status()}catch(e){}
      if(st){
        if(st.name)s.cupName=st.name;
        if(st.alive){
          const depth=CUPW.filter(w=>week>w).length;
          if(depth>s.cupDepth){
            s.cupDepth=depth;
            const b=depth>=6?8:depth>=5?4:depth>=4?3:depth>=3?2:0;
            if(b)adjust(b,'through to '+(depth>=6?'the final of ':'the last '+(depth>=5?'four':depth>=4?'eight':'sixteen')+' of ')+(s.cupName||'the cup'));
          }
        }
      }
    }
    /* European progress */
    if(c.euro&&G.euro&&G.euro[c.euro]){
      const E=G.euro[c.euro];
      s.euroKey=c.euro;
      const idx={group:0,qf:1,sf:2,f:3}[E.stage]||0;
      const alive=E.stage==='group'?true:((E.ko[E.stage]||[]).some(t=>t.a===c.id||t.b===c.id));
      let best=s.euroBest;
      if(alive&&idx>best)best=idx;
      if(E.winner===c.id)best=4;
      if(best>s.euroBest){
        s.euroBest=best;
        const b=best>=4?9:best>=3?4:best>=2?3:2;
        adjust(b,'Europe: '+(best>=4?'winners':best>=3?'into the final':best>=2?'into the semi-final':'into the quarter-final'));
      }
    }
    /* periodic review */
    if(week%6===0&&week>0&&week<38&&s.lastRev!==week){s.lastRev=week;review();evaluate()}

    /* offers expiring */
    if(s.offers&&s.offers.length&&!s.sacked){
      const live=s.offers.filter(o=>o.exp>=week);
      if(live.length!==s.offers.length&&!live.length)note('The approach cooled','They appointed somebody else. You stay put.');
      s.offers=live;
    }
    /* an unsolicited approach when you are doing well */
    if(!s.sacked&&!s.offers.length&&s.games>14&&s.conf>=70&&week>2&&week<34&&rnd()<0.05){
      const list=makeOffers('employed',0);
      if(list.length){
        list.forEach(o=>{o.exp=week+3});
        note('Somebody wants you',(list.length===1?G.clubs[list[0].cid].name+' have':'Two clubs have')+
          ' asked to speak to you. You have three weeks to decide.');
      }
    }
  },

  onSeasonEndBefore(){
    const s=S(),c=me();
    if(!c)return;
    s.snap={pos:myPos(),obj:G.objective?G.objective.text:'',target:G.objective?G.objective.pos:10,
      tier:c.tier,ratio:costRatio(c),cup:s.cupDepth,cupName:s.cupName,euro:s.euroBest,
      euroLine:c.euro?euroStatusLine(c):''};
  },

  onSeasonEndAfter(info){
    const s=S(),c=me();
    if(s.sacked||!c)return;
    const sn=s.snap||{pos:info.pos,target:info.pos,tier:c.tier,ratio:70,cup:0,euro:0,obj:''};
    const relegated=c.tier>sn.tier, promoted=c.tier<sn.tier;
    const reasons=[];
    let d;
    if(info.hit){d=14;reasons.push('objective met')}
    else{d=clamp(-(info.pos-sn.target)*2.2,-26,-4);reasons.push('finished '+ordn(info.pos)+', short of "'+sn.obj+'"')}
    adjust(d,info.hit?'season objective met':'season objective missed');
    if(sn.cup>=6){adjust(14,'won the '+(sn.cupName||'cup'));reasons.push('but you won the '+(sn.cupName||'cup'))}
    else if(sn.cup>=4){adjust(6,'a run to the last four');reasons.push('a cup run softened it')}
    if(sn.euro>=4){adjust(16,'European winners');reasons.push('and you won in Europe')}
    else if(sn.euro>=2){adjust(5,'a European semi-final');reasons.push('Europe went well')}
    if(sn.ratio>85)adjust(-4,'wage bill finished over the cap');
    if(relegated){adjust(-20,'relegated');reasons.push('relegated')}
    if(promoted){adjust(18,'promoted');reasons.push('promoted')}

    s.cupDepth=0;s.euroBest=0;s.lastRev=-1;s.snap=null;

    const v=Math.round(s.conf),b=band(v);
    const sackNow=(s.games>=GRACE&&s.clubGames>=CLUBGRACE)&&
      ((v<20&&(s.stage>=1||relegated))||(relegated&&v<32));
    if(sackNow){
      setTimeout(()=>{try{
        showSack((relegated?'You took them down. ':'')+reasons.join(', ')+'. That was the end of it.',
          {pos:info.pos,obj:sn.obj,conf:v});
      }catch(e){}},0);
      return;
    }
    if(info.hit)note('The board are pleased','You did what they asked. '+b.t+' Confidence '+v+'.');
    else note('The verdict','You did not. '+reasons.join(', ')+'. '+b.t+' Confidence '+v+'.');
    evaluate();
    if(s.stage>=2)setTimeout(()=>{try{showWarning()}catch(e){}},0);
  },

  hubCards(){
    const s=S(),out=[];
    /* You cannot be stranded without a club: if the takeover was lost to a
       reload or another module's screen, put it straight back. */
    if(s.sacked){
      if(!document.getElementById('boardTake'))setTimeout(()=>{try{showOffers()}catch(e){}},0);
      return out;
    }
    const v=Math.round(s.conf);
    if(s.offers&&s.offers.length){
      const soon=s.offers.some(o=>o.exp-G.week<=1);
      out.push({ic:'☎',bg:'#0E2340',col:'var(--trf)',
        a:s.offers.length===1?G.clubs[s.offers[0].cid].name+' want to talk':s.offers.length+' clubs want to talk',
        b:soon?'They need an answer this week':'Decide inside '+(s.offers[0].exp-G.week)+' weeks',
        fn:'boardOpenOffers()',priority:soon?100:35});
    }
    if(v<18&&s.stage>=2){
      out.push({ic:'⚠',bg:'#3A1C12',col:'var(--loss)',a:'You are one bad run from the sack',
        b:'Confidence '+v+' — they are deciding',fn:'boardPanel()',priority:100});
    } else if(v<30){
      out.push({ic:'⚠',bg:'#3A1C12',col:'var(--inj)',a:'The board have lost patience',
        b:'Confidence '+v+' — '+band(v).k.toLowerCase(),fn:'boardPanel()',priority:65});
    } else if(v<45&&s.stage>=1){
      out.push({ic:'▣',bg:'var(--accw)',col:'var(--acc)',a:'The board are watching',
        b:'Confidence '+v+' — a quiet word has been had',fn:'boardPanel()',priority:55});
    }
    return out;
  },

  clubBlocks(){
    const s=S();
    if(s.sacked)return [];
    return [`<div class="sechead">The board</div>
      <div onclick="boardPanel()" style="cursor:pointer">${meter()}</div>
      ${s.log.length?`<div class="card" style="margin-top:8px;padding:6px 14px 10px">${logRows(3)}
        <div style="font-size:12px;color:var(--t3);padding-top:9px">Tap the meter for the full file.</div></div>`:''}`];
  },

  reportBlocks(){
    const s=S();
    if(s.sacked||!s.react)return [];
    const v=Math.round(s.conf),b=band(v);
    return [`<div class="sechead">Upstairs</div>
     <div class="card" style="background:var(--s1)">
      <div style="font-size:13px;color:var(--t2)">${esc(s.react)}</div>
      <div class="kv" style="margin-top:8px"><span class="k2">Board confidence</span>
        <span class="v2" style="color:${b.c}">${v} · ${esc(b.k)}</span></div></div>`];
  }
});

})();
