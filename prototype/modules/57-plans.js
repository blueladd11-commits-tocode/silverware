/* ============================================================
   SILVERWARE module: plans
   Three game plans that belong to the MANAGER, not the assistant.

   The coaching point this exists for, straight from the owner (UEFA C):
   the assistant must never quietly veto the manager's identity. Real staff
   work the other way round — the manager's plans are the default, and any
   reactive deviation has to be ARGUED: a named reason, an honest account
   of what abandoning your football costs, and the manager free to say no.

   So: Plan A / B / C live in Squad → Plans. The core's assistantAdvice
   hook is claimed here. Most weeks the assistant backs Plan A and says
   why it fits THIS opponent. When the opposition genuinely warrants it
   (big rep gap, their pace against your high line, your back line gutted)
   he puts a case on your desk — and the case names its reasons, names
   its cost, and arrives with "Stick to Plan A" as the pre-selected answer.
   ============================================================ */
(function(){

const DEF={ set:false, plans:{}, dealt:{}, };
function S(){const s=SW.state('plans');
  for(const k in DEF)if(s[k]===undefined)
    s[k]=(typeof DEF[k]==='object'&&DEF[k]!==null)?JSON.parse(JSON.stringify(DEF[k])):DEF[k];
  return s;}

const NAMES=['Our game','Front foot','Keep the ball','New shape','Go and get it',
  'Shut the gate','On the break','Big night'];
const TW=['Very patient','Patient','Balanced tempo','Direct','Very direct'];
const LW=['Very deep','Deep','Mid block','High press','Very high line'];
const MW=['Contain','Cautious','Balanced','Attacking','All-out'];
const KEYS=['A','B','C'];

function surn(p){return String(p.name).split(' ').pop()}
function words(p){return TW[p.tempo+2]+' · '+LW[p.line+2]+' · '+MW[p.ment+2]}
function planMatches(p,c){
  return !!(p&&c&&p.formation===c.formation&&p.tempo===c.tempo&&p.line===c.line&&p.ment===c.ment);
}
function fkey(f){return G.season+':'+G.week+':'+f.home+':'+f.away}

/* The manager's chosen standards, read defensively. Culture does not publish
   a standards() getter (noted as a gap) — read-only peek, never written to. */
function standardsOf(){
  try{ if(SW.get('culture'))return (SW.state('culture').standards||[]).slice() }catch(e){}
  return [];
}
function identityLines(){
  try{ const cu=SW.get('culture'); if(cu&&typeof cu.identity==='function')return cu.identity()||[] }catch(e){}
  return [];
}

/* ---------- seeding: three plans, all of them yours ---------- */
const ALT={'4-4-2':'4-3-3','4-2-3-1':'4-3-3','4-3-3':'4-2-3-1',
           '5-3-2':'3-5-2','4-5-1':'4-2-3-1','3-5-2':'4-4-2'};
function seedPlans(){
  const c=me(); if(!c)return;
  const s=S();
  const A={name:'Our game',formation:c.formation,tempo:c.tempo,line:c.line,ment:c.ment};
  const B={name:'New shape',formation:ALT[c.formation]||'4-3-3',
           tempo:c.tempo,line:c.line,ment:c.ment};
  /* The change-it-up takes its cue from who the manager says he is. A room
     told "we do not hide when we are losing" gets a chase plan, not a bus. */
  const std=standardsOf();
  let C;
  if(std.indexOf('front')>=0||std.indexOf('work')>=0||c.ment>=1)
    C={name:'Go and get it',formation:'4-4-2',
       tempo:clamp(c.tempo+1,-2,2),line:clamp(c.line+1,-2,2),ment:2};
  else
    C={name:'Shut the gate',formation:'4-5-1',
       tempo:c.tempo,line:clamp(c.line-1,-2,2),ment:clamp(c.ment-1,-2,2)};
  s.plans={A:A,B:B,C:C}; s.set=true;
}
function ensure(){const s=S(); if(!s.set||!s.plans.A)seedPlans(); return s}

/* ============================================================
   THE CASE — deterministic, no rnd(): this runs in render paths.
   ============================================================ */
function caseFor(f){
  const c=me(); if(!c||!f)return null;
  const s=ensure(),A=s.plans.A; if(!A)return null;
  const home=f.home===G.me, o=G.clubs[home?f.away:f.home]; if(!o)return null;
  const gap=o.rep-c.rep;
  const reasons=[]; let w=0;

  /* their quickest available forward vs your high line */
  let quick=null;
  squadOf(o).forEach(p=>{
    if(p.out>0)return;
    if(p.pos!=='ST'&&p.pos!=='W'&&p.pos!=='AM')return;
    if(!quick||p.a[0]>quick.a[0])quick=p;
  });
  /* is their best man even in the squad? */
  const otop=squadOf(o).slice().sort((a,b)=>CA(b)-CA(a))[0];
  const bestOut=!!(otop&&otop.out>0);

  if(gap>=22){w+=2.4;
    reasons.push('They are a level above us, man for man. On paper this is the worst game on the card.')}
  else if(gap>=14){w+=(home?1.0:1.5);
    reasons.push('They are the better side'+(home?'':' and it is their place')+
      '. You do not out-punch a bigger man'+(home?'':' in his own house')+'.')}
  if(quick&&quick.a[0]>=82&&A.line>=1){w+=1.4;
    reasons.push(surn(quick)+' against your high line — he will run in behind all day and twice on the counter.')}
  const dTop=squadOf(c).filter(p=>p.pos==='CB'||p.pos==='FB')
    .sort((a,b)=>CA(b)-CA(a)).slice(0,3).filter(p=>p.out>0);
  if(dTop.length&&A.line>=1){w+=1.0;
    reasons.push(surn(dTop[0])+' is out, and you are asking a patched-up back line to defend forty yards of grass.')}
  const wins=(o.form||[]).slice(-5).filter(r=>r==='W').length;
  if(wins>=4){w+=0.5;
    reasons.push('They have won four of their last five. Teams in that mood punish open games.')}
  if(bestOut)w-=0.9;

  const prop={name:'His way',formation:'4-5-1',
    tempo:clamp(A.tempo+1,-2,2),line:-1,ment:-1};
  return {o:o,home:home,gap:gap,w:w,reasons:reasons,prop:prop,quick:quick,bestOut:bestOut,
    strong:w>=2.3&&reasons.length>0, moderate:w>=1.2};
}
function costLine(){
  const std=standardsOf();
  if(std.indexOf('front')>=0)
    return 'You told them we do not hide when we are losing. Sit off from the first whistle and every man in that room will clock it.';
  if(std.indexOf('work')>=0)
    return 'You told them we outwork everyone. Nobody outworks anybody from the edge of his own box.';
  const id=identityLines();
  if(id.some(l=>/stands in front|before it becomes a problem/.test(l)))
    return 'This squad has been built on you going first. Set up scared and they will remember whose idea it was.';
  return 'Every week you set up to survive is a week they learn that is who we are. It adds up.';
}
function backLine(x,A){
  if(x.bestOut)return 'Their best player is not even in the squad. There is nothing here to sit off for.';
  if(x.gap<=-12)return 'We are the better side and both dugouts know it. Front foot, early, and it is done by sixty.';
  if(A.line>=1&&x.quick&&x.quick.a[0]<74)return 'Nobody in their front line can run, so your line is safe. Squeeze them.';
  if(x.home)return 'Our place, our plan. Make them solve us — they will not.';
  return 'Nothing about this lot changes who we are.';
}

/* the assistant's full read — plans, argument, the lot */
function advFor(f){
  const s=ensure(); if(!s.plans.A)return null;
  const c=me(),A=s.plans.A;
  const x=caseFor(f); if(!x)return null;
  const dealt=s.dealt[fkey(f)];

  if(dealt==='his'){
    return {plan:x.prop,why:'His way, this once. Compact, off them, hit them on the break. Monday we go back to being us.',
      same:planMatches(x.prop,c),opp:x.o,home:x.home,kind:'his',x:x};
  }
  if(dealt==='stick'){
    return {plan:A,why:'He made his case, you kept the plan. Plan A — no apologies, no surprises.',
      same:planMatches(A,c),opp:x.o,home:x.home,kind:'stick',x:x};
  }
  if(x.strong){
    return {plan:A,why:x.reasons[0]+' I would sit off for this one — my case is on your desk. Plan A stands unless you say otherwise.',
      same:planMatches(A,c),opp:x.o,home:x.home,kind:'case',x:x};
  }
  if(x.moderate){
    /* a manager's own careful plan beats an invented reactive one */
    let alt=null,ak=null;
    KEYS.forEach(k=>{const p=s.plans[k];
      if(k!=='A'&&p&&(p.line+p.ment)<=(A.line+A.ment)-2&&(!alt||(p.line+p.ment)<(alt.line+alt.ment))){alt=p;ak=k}});
    if(alt)return {plan:alt,why:'A Plan '+ak+' night. '+x.reasons[0]+' Still our football — the careful version of it.',
      same:planMatches(alt,c),opp:x.o,home:x.home,kind:'plan'+ak,x:x};
    return {plan:A,why:x.reasons[0]+' Plan A anyway. Bin the plan for this lot and you will end up binning it every week.',
      same:planMatches(A,c),opp:x.o,home:x.home,kind:'backA',x:x};
  }
  return {plan:A,why:'Plan A — '+A.name+'. '+backLine(x,A),
    same:planMatches(A,c),opp:x.o,home:x.home,kind:'backA',x:x};
}

/* ---------- the argued sheet: his case, its cost, your call ---------- */
window.swPlanCase=function(){
  const f=nextFixture(); if(!f)return;
  const s=ensure(),x=caseFor(f);
  if(!x||!x.strong||s.dealt[fkey(f)]){closeSheet();render();return}
  const A=s.plans.A;
  sheet(`${speakerBar(vV('assist'),vC(x.o),'on','He wants an answer')}
   <h3>His case for sitting off</h3>
   <div class="sh-sub">${esc(x.o.name)}, ${x.home?'at our place':'away'}. He is asking you to
     leave Plan A in the drawer for one night. Hear him out, then decide.</div>
   <div class="card" style="margin-bottom:10px">${x.reasons.map(r=>
     `<div style="display:flex;gap:9px;padding:7px 0;font-size:14px;line-height:19px;border-top:1px solid var(--hair)">
      <span style="color:var(--acc)">—</span><span>${esc(r)}</span></div>`).join('')}</div>
   <div class="card" style="margin-bottom:12px;border-color:var(--inj)">
     <div style="font-size:13px;color:var(--t2);line-height:19px">
     <b style="color:var(--inj)">What it costs</b> — ${esc(costLine())}</div></div>
   <div class="opt rec" onclick="swPlanStick()">
     <div><div style="font-weight:600">Stick to Plan A — ${esc(A.name)}</div>
       <div class="dim" style="font-size:12px">${esc(A.formation)} · ${esc(words(A))}. Who we are, against anyone.</div></div>
     <span class="st">Yours</span></div>
   <div class="opt" onclick="swPlanHis()">
     <div><div style="font-weight:600">Set up his way</div>
       <div class="dim" style="font-size:12px">${esc(x.prop.formation)} · sit off, stay compact, hit them on the break. One game only.</div></div></div>`);
};
window.swPlanStick=function(){
  const f=nextFixture(); if(!f){closeSheet();return}
  const s=ensure(),c=me(),A=s.plans.A;
  c.formation=A.formation;c.tempo=A.tempo;c.line=A.line;c.ment=A.ment;autoXI(c);
  s.dealt[fkey(f)]='stick';
  note('The plan stands','You heard him out and kept Plan A. Right or wrong, that is a manager who knows what he is about. The ninety minutes get the last word.',{from:vV('assist')});
  closeSheet();save();render();
};
window.swPlanHis=function(){
  const f=nextFixture(); if(!f){closeSheet();return}
  const s=ensure(),c=me(),x=caseFor(f); if(!x){closeSheet();return}
  c.formation=x.prop.formation;c.tempo=x.prop.tempo;c.line=x.prop.line;c.ment=x.prop.ment;autoXI(c);
  s.dealt[fkey(f)]='his';
  note('You sat off for this one','His plan, your name on the teamsheet. If it works nobody will ask. If it does not, they will ask why we stopped being us.',{from:vV('assist'),about:vC(x.o),rel:'on'});
  closeSheet();save();render();
};

/* ---------- applying and editing plans ---------- */
window.swPlanUse=function(k){
  const s=ensure(),p=s.plans[k]; if(!p)return;
  const c=me();
  c.formation=p.formation;c.tempo=p.tempo;c.line=p.line;c.ment=p.ment;
  autoXI(c);save();render();
};
window.swPlanSet=function(k,key,v){
  const s=ensure(); if(!s.plans[k])return;
  s.plans[k][key]=v; save(); swPlanEdit(k);
};
window.swPlanName=function(k,i){
  const s=ensure(); if(!s.plans[k]||!NAMES[i])return;
  s.plans[k].name=NAMES[i]; save(); swPlanEdit(k);
};
window.swPlanEdit=function(k){
  const s=ensure(),p=s.plans[k]; if(!p)return;
  const seg=(lbl,key,lo,hi)=>{const v=p[key];
    return `<div style="margin-bottom:16px"><div class="row" style="margin-bottom:7px">
      <span style="font-weight:600;font-size:14px">${lbl}</span><span class="spacer"></span>
      <span class="pill">${['Very '+lo,lo,'Balanced',hi,'Very '+hi][v+2]}</span></div>
      <div class="row" style="gap:5px">${[-2,-1,0,1,2].map(n=>
      `<button onclick="swPlanSet('${k}','${key}',${n})" style="flex:1;min-height:44px;border-radius:10px;cursor:pointer;
       border:1px solid ${v===n?'var(--acc)':'var(--hair)'};background:${v===n?'var(--acc)':'var(--s2)'};
       color:${v===n?'var(--tinv)':'var(--t3)'};font-weight:700;font-family:var(--ui)">${n===0?'—':n<0?'◄'.repeat(-n):'►'.repeat(n)}</button>`).join('')}</div></div>`};
  sheet(`<h3>Plan ${k}</h3>
   <div class="sh-sub">Adjust and go — it saves as you tap. This is your football; the assistant argues around it, never over it.</div>
   <div class="sechead">Name</div>
   <div class="row" style="flex-wrap:wrap;gap:7px">${NAMES.map((n,i)=>
     `<button onclick="swPlanName('${k}',${i})" style="padding:10px 13px;min-height:44px;border-radius:11px;cursor:pointer;
      border:1px solid ${p.name===n?'var(--acc)':'var(--hair)'};background:${p.name===n?'var(--acc)':'var(--s1)'};
      color:${p.name===n?'var(--tinv)':'var(--t2)'};font-weight:600;font-size:13px;font-family:var(--ui)">${n}</button>`).join('')}</div>
   <div class="sechead">Formation</div>
   <div class="row" style="flex-wrap:wrap;gap:7px">${Object.keys(SHAPE).map(f2=>
     `<button onclick="swPlanSet('${k}','formation','${f2}')" style="padding:11px 14px;min-height:44px;border-radius:11px;cursor:pointer;
      border:1px solid ${p.formation===f2?'var(--acc)':'var(--hair)'};background:${p.formation===f2?'var(--acc)':'var(--s1)'};
      color:${p.formation===f2?'var(--tinv)':'var(--t2)'};font-family:var(--disp);font-weight:700;font-size:14px">${f2}</button>`).join('')}</div>
   <div class="sechead">Style</div><div class="card">
   ${seg('Tempo','tempo','Patient','Direct')}${seg('Defensive line','line','Deep','High press')}${seg('Mentality','ment','Contain','Attack')}</div>
   <button class="btn" style="margin-top:10px" onclick="closeSheet();render()">Done</button>`);
};

/* ---------- the Plans screen (Squad tab segment) ---------- */
function plansView(){
  const s=ensure(),c=me(); if(!s.plans.A)return '<div class="card"><div class="dim">No club yet.</div></div>';
  const f=nextFixture(),a=f?advFor(f):null;
  const openCase=!!(a&&a.kind==='case');
  return `${a?`<div class="card" style="margin-bottom:10px">
     <div style="font-size:13px;color:var(--t2);line-height:19px">
       <b style="color:var(--acc)">◆ Assistant Coach</b> — ${esc(a.why)}</div>
     <div class="row" style="margin-top:11px;gap:8px">
       ${a.same?'<div class="pill acc" style="padding:8px 11px">✓ Set up this way</div>'
        :`<button class="btn xs" style="flex:1" onclick="applyPlan()">${openCase?'Stick to Plan A':'Set it up'} (${esc(a.plan.formation)})</button>`}
       ${openCase?`<button class="btn ghost xs" onclick="swPlanCase()">His case for sitting off</button>`:''}
     </div></div>`:''}
   <div class="sechead">Your game plans</div>
   ${KEYS.map(k=>{
     const p=s.plans[k],inUse=planMatches(p,c);
     return `<div class="card" style="margin-bottom:9px${inUse?';border-color:var(--acc)':''}">
      <div class="row"><span class="pill acc" style="font-family:var(--disp);font-weight:800">${k}</span>
        <span style="font-weight:700;font-size:14px">${esc(p.name)}</span>
        <span class="spacer"></span><span class="pill">${esc(p.formation)}</span></div>
      <div class="dim" style="font-size:12px;margin-top:6px">${esc(words(p))}</div>
      <div class="row" style="margin-top:10px;gap:8px">
        ${inUse?'<div class="pill acc" style="padding:8px 11px">✓ In use</div>'
          :`<button class="btn xs" style="flex:1" onclick="swPlanUse('${k}')">Use this plan</button>`}
        <button class="btn ghost xs" onclick="swPlanEdit('${k}')">Adjust</button></div></div>`}).join('')}
   <div class="card" style="margin-top:2px"><div style="font-size:12px;color:var(--t3);line-height:18px">
     Three ways of playing, all of them yours. The assistant backs them by default —
     when he wants you to deviate for an opponent, he has to make the case to your face.</div></div>`;
}

/* ============================================================
   registration
   ============================================================ */
SW.register({
  id:'plans',
  init(){const s=SW.state('plans');for(const k in DEF)delete s[k];S();},
  onLoad(){S()},
  onSeasonEndAfter(){const s=S(); s.dealt={};},

  /* the core's assistant defers to this entirely */
  assistantAdvice(f){
    try{ return advFor(f) }catch(e){ console.error('[plans.advice]',e); return null }
  },

  hubCards(){
    const f=nextFixture(); if(!f)return [];
    const s=ensure(); if(!s.plans.A)return [];
    let x=null; try{x=caseFor(f)}catch(e){}
    if(!x||!x.strong||s.dealt[fkey(f)])return [];
    return [{ic:'⚑',bg:'#0E2340',col:'var(--trf)',priority:62,
      a:'He wants to sit off v '+x.o.abbr,
      b:'His case, what it costs, your call',
      fn:'swPlanCase()'}];
  },

  squadViews(){ return [{key:'plans',label:'Plans',render:plansView}] },

  /* one-tap plan switch in the live match footer, through matchday's own levers */
  matchControls(T){
    if(!T||!T.S||T.done)return [];
    if(G.speed==='instant')return [];
    if(!window.MDAY||!SW.get('matchday'))return [];
    const s=S(); if(!s.set||!s.plans.A)return [];
    const c=(T.S.club&&T.S.club[T.mine])||me(); if(!c)return [];
    const alts=KEYS.filter(k=>s.plans[k]&&!planMatches(s.plans[k],c));
    if(!alts.length)return [];
    return [`<div class="md-foot" style="margin-top:8px">${alts.map(k=>
      `<button class="btn sm ghost" onclick="swPlanLive('${k}')">PLAN ${k} · ${esc(s.plans[k].formation)}</button>`).join('')}</div>`];
  },

  /* published interface */
  plan(k){const s=S();return (s.plans&&s.plans[k])?JSON.parse(JSON.stringify(s.plans[k])):null},
  inUse(){const s=S(),c=me();if(!c||!s.plans)return null;
    for(const k of KEYS)if(planMatches(s.plans[k],c))return k; return null},
  apply(k){swPlanUse(k)}
});

/* switching mid-match: pause via the matchday module's own controls, apply,
   resume — all in one tick so the tactics sheet never actually shows. */
window.swPlanLive=function(k){
  const s=S(),p=s.plans&&s.plans[k]; if(!p)return;
  if(typeof MT==='undefined'||!MT||!MT.S)return;
  const md=window.MDAY;
  if(!md||typeof md.tactics!=='function'||typeof md.setT!=='function')return;
  /* an interrupt or forced sub owns the screen — do not fight it */
  if(document.querySelector('.sheetwrap'))return;
  try{
    md.tactics();
    if(!document.querySelector('.sheetwrap'))return;   // it declined (done, injury, …)
    const c=MT.S.club[MT.mine];
    if(c.formation!==p.formation&&typeof md.setForm==='function')md.setForm(p.formation);
    ['tempo','line','ment'].forEach(x=>{ if(c[x]!==p[x])md.setT(x,p[x]) });
    md.leave();
  }catch(e){console.error('[plans.live]',e)}
};

})();
