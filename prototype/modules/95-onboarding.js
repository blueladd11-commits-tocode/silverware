/* ============================================================
   onboarding — the first five minutes.

   A tutorial that is not a tutorial. No modal walls, no arrows, no
   greyed screens. The player makes four real decisions with real
   consequences; the Assistant Coach explains why in one line at the
   moment it matters. Everything is always available — what arrives
   gradually is the explanation, never the feature.

   Invisible to a returning player. One tap kills it forever.
   ============================================================ */
(function(){
'use strict';

/* ---------- persistence ------------------------------------------------
   Two layers. SW.state('onboarding') is per-career (the guided week,
   which lines have been seen). A tiny separate localStorage blob is
   per-device and outlives every save — that is what makes "skip" and
   "already done it once" permanent across future careers.            */
const PREF='silverware.onboarding.v1';
const SAVEKEY=(typeof KEY!=='undefined')?KEY:'silverware.save.v2';

function prefs(){ try{ return JSON.parse(localStorage.getItem(PREF))||{} }catch(e){ return {} } }
function setPref(k,v){ try{ const p=prefs(); p[k]=v; localStorage.setItem(PREF,JSON.stringify(p)) }catch(e){} }
function optedOut(){ return !!prefs().off }

function st(){ return SW.state('onboarding') }
function live(){ const S=st(); return !!S.on && !S.dead }
function guided(){ const S=st(); return live() && !S.done }
function persist(){ try{ save() }catch(e){} }

/* the module object, reached from every onclick as
   SW.get('onboarding').x() — no globals, ever */
const OB={};
const call=(fn)=>`SW.get('onboarding').${fn}`;

/* ---------- tiny stylesheet, injected once ---------------------------- */
function css(){
  if(document.getElementById('ob-css'))return;
  const s=document.createElement('style'); s.id='ob-css';
  s.textContent=`
#ob-take{position:fixed;inset:0;background:var(--bg);z-index:65;display:flex;flex-direction:column;
  max-width:480px;margin:0 auto}
#ob-take .ob-body{flex:1;overflow-y:auto;padding:0 16px 8px;-webkit-overflow-scrolling:touch}
#ob-take .ob-foot{padding:10px 16px calc(14px + env(safe-area-inset-bottom));
  background:linear-gradient(to top,var(--bg) 68%,transparent)}
.ob-kick{font-family:var(--disp);font-weight:800;font-size:10px;letter-spacing:.14em;
  text-transform:uppercase;color:var(--acc)}
.ob-h{font-family:var(--disp);font-weight:800;font-size:29px;line-height:32px;letter-spacing:-.01em;margin-top:6px}
.ob-p{font-size:15px;line-height:21px;color:var(--t2);margin-top:10px}
.ob-link{display:block;width:100%;min-height:44px;background:none;border:0;color:var(--t3);
  font-family:var(--ui);font-size:13px;font-weight:600;cursor:pointer;margin-top:8px;text-decoration:underline}
.ob-pick{display:flex;gap:12px;align-items:flex-start;padding:14px;border-radius:16px;background:var(--s1);
  border:1px solid var(--hair);cursor:pointer;margin-bottom:9px;min-height:56px}
.ob-pick[aria-selected=true]{border-color:var(--acc);background:var(--accw)}
.ob-tip{display:flex;gap:10px;align-items:flex-start;background:var(--s1);border:1px solid var(--acc);
  border-radius:14px;padding:11px 6px 11px 13px;margin:2px 0 12px;font-size:13px;line-height:18px;color:var(--t2)}
.ob-tip b{color:var(--acc);font-weight:700}
.ob-x{width:44px;min-height:44px;margin:-11px -6px -11px 0;background:none;border:0;color:var(--t3);
  font-size:15px;cursor:pointer;flex:0 0 auto}
.ob-say{display:flex;gap:9px;align-items:flex-start;font-size:13px;line-height:18px;color:var(--t2);
  background:var(--s1);border:1px solid var(--hair);border-radius:14px;padding:12px 13px;margin-bottom:14px}
.ob-say b{color:var(--t1);font-weight:600}`;
  document.head.appendChild(s);
}

/* ---------- full-screen takeover (ours, never core's .take) ----------- */
function takeover(html){
  css(); drop();
  const d=document.createElement('div'); d.id='ob-take'; d.innerHTML=html;
  document.body.appendChild(d);
}
function drop(){ const d=document.getElementById('ob-take'); if(d)d.remove() }
function saying(t){ return `<div class="ob-say"><span style="color:var(--acc);margin-top:1px">◆</span>
  <div><b>Assistant Coach</b> — ${esc(t)}</div></div>` }

/* ======================================================================
   1. FIRST RUN — the opening, then the club
   ====================================================================== */
function opening(){
  takeover(`<div class="ob-body" style="padding-top:44px">
    <div class="ob-kick">Silverware</div>
    <div class="ob-h">You are the manager.</div>
    <div class="ob-p">Not the owner. Not the striker. You pick the club, you pick the team,
      you tell them how to play — then you sit and watch what you built.</div>
    <div class="ob-p">A season takes about twenty minutes. This first one, your assistant
      will tell you what he would do. You can ignore him.</div>
    <div class="ob-p" style="color:var(--acc);font-family:var(--disp);font-weight:700;
      letter-spacing:.1em;text-transform:uppercase;font-size:12px;margin-top:18px">Nobody remembers fifth</div>
   </div>
   <div class="ob-foot">
    <button class="btn" onclick="${call('pickClub()')}">Pick a club</button>
    <button class="ob-link" onclick="${call('skip()')}">I have played one of these before — skip all this</button>
   </div>`);
}

function budgetWord(b){
  return b>=6e7?'Money to burn':b>=2.5e7?'A proper budget':b>=8e6?'Enough to fix one position'
    :b>=2e6?'Not much to play with':'Almost nothing';
}
function recos(){
  try{
    const eng=G.leagues.filter(l=>l.nat==='eng');
    if(!eng.length)return [];
    const rank=l=>l.clubs.map(i=>G.clubs[i]).sort((a,b)=>b.rep-a.rep);
    const top=rank(eng[0]);
    const low=rank(eng[Math.min(2,eng.length-1)]);
    const out=[];
    const steady=top[Math.min(7,top.length-1)];
    const big=top[0];
    const hard=low[Math.max(0,low.length-5)];
    if(steady)out.push({c:steady,tag:'Start here if it is your first save',
      line:'Good players, sane expectations, room to be wrong twice.'});
    if(big&&big.id!==steady.id)out.push({c:big,tag:'The big job',
      line:'Everything you need and nowhere to hide. Second is failure.'});
    if(hard&&hard.id!==steady.id&&hard.id!==big.id)out.push({c:hard,tag:'A proper challenge',
      line:'No money, thin squad. Anything you win here you actually won.'});
    return out;
  }catch(e){ return [] }
}
let SEL=0;

function pickClub(){
  const r=recos();
  if(!r.length){ drop(); return }            // world not built — hand back to the club list
  SEL=0; paintPicker(r);
}
function paintPicker(r){
  takeover(`<div class="ob-body" style="padding-top:34px">
    <div class="ob-kick">Choose your club</div>
    <div class="ob-h">Where do you want the job?</div>
    <div class="ob-p" style="margin-bottom:16px">Three we would point you at. Every other club in the
      pyramid is available too — nothing here is locked.</div>
    ${r.map((x,i)=>{const o=objectiveFor(x.c),l=leagueOf(x.c.id);
      return `<div class="ob-pick" aria-selected="${SEL===i}" onclick="${call('sel('+i+')')}">
      ${crestSVG(x.c,38)}
      <div style="min-width:0;flex:1">
        <div style="font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;
          color:${SEL===i?'var(--acc)':'var(--t3)'}">${esc(x.tag)}</div>
        <div style="font-family:var(--disp);font-weight:800;font-size:17px;margin-top:2px">${esc(x.c.name)}</div>
        <div style="font-size:12px;color:var(--t3);margin-top:2px">${esc(l?l.name:'')}</div>
        <div style="font-size:13px;color:var(--t2);margin-top:6px">${esc(x.line)}</div>
        <div class="row" style="gap:6px;margin-top:8px;flex-wrap:wrap">
          <span class="pill">${esc(budgetWord(x.c.bal))}</span>
          <span class="pill ${SEL===i?'acc':''}">${esc(o.text)}</span></div>
      </div></div>`}).join('')}
   </div>
   <div class="ob-foot">
    <button class="btn" onclick="${call('take()')}">Take the job</button>
    <button class="ob-link" onclick="${call('browse()')}">Browse every club instead</button>
   </div>`);
}
OB.sel=function(i){ SEL=i; paintPicker(recos()); };
OB.browse=function(){ drop(); };          // the core club list is already rendered underneath
OB.pickClub=pickClub;
OB.take=function(){
  const r=recos(); const x=r[SEL]||r[0]; if(!x){ drop(); return }
  newGame(x.c.id);                        // fires init() — seeds our state fresh
  G.tab='home'; render();
  welcome();
};

/* ---------- the arrival: the only prose block in the whole thing ------ */
function welcome(){
  const S=st(); if(!guided()||S.welcomed)return;
  S.welcomed=1; persist();
  const c=me();
  takeover(`<div class="ob-body" style="padding-top:40px">
    <div class="row" style="gap:12px;margin-bottom:14px">${crestSVG(c,52)}
      <div><div class="ob-kick">${esc(leagueOf(c.id)?leagueOf(c.id).name:'')}</div>
        <div style="font-family:var(--disp);font-weight:800;font-size:22px;line-height:25px">${esc(c.name)}</div></div></div>
    <div class="ob-h" style="font-size:25px;line-height:29px">"The job is yours."</div>
    <div class="ob-p">The chairman shook your hand for four seconds and went back to his phone.
      There is a squad in the dressing room and a game at the weekend.</div>
    <div class="ob-p">What they want from you: <b style="color:var(--t1)">${esc(G.objective.text)}</b>.
      Miss it and this conversation happens again, with a different manager.</div>
    <div class="ob-p">Four things need you before kick off. They are on your home screen, one at a time.</div>
   </div>
   <div class="ob-foot"><button class="btn" onclick="${call('go()')}">Get to work</button></div>`);
}
OB.go=function(){ drop(); render(); };

/* ======================================================================
   2. THE GUIDED WEEK — four real decisions, in order
   ====================================================================== */
function star(){
  try{
    const l=squadOf(me()).slice().sort((a,b)=>CA(b)-CA(a));
    return l.find(p=>p.pos!=='GK')||l[0]||null;   // an outfielder reads better as "your best player"
  }catch(e){ return null }
}
function plan(){ try{ return assistantPlan() }catch(e){ return null } }

const STEPS=[
 { k:'objective',
   ok(){ return !!(G.objective&&G.objective.accepted) },
   able(){ return !!G.objective },
   card(){ return {ic:'▣',bg:'var(--accw)',col:'var(--acc)',
     a:'The board want an answer',b:G.objective.text+' — agree it, or push back',
     fn:call('doObjective()')} } },

 { k:'star',
   ok(){ return !!st().fStar },
   able(){ return !!star() },
   card(){ const p=star(); return {ic:'★',bg:'#2A1C40',col:'var(--loan)',
     a:'Meet your best player',b:p.name+' — '+p.pos+', '+p.age,
     fn:call('doStar()')} } },

 { k:'plan',
   ok(){ const a=plan(); return !!st().fPlan||!!(a&&a.same) },
   able(){ return !!plan() },
   card(){ const a=plan(); return {ic:'◆',bg:'#0E2340',col:'var(--trf)',
     a:'Your assistant has a plan',b:'For '+a.opp.name+' — take it or do it your way',
     fn:call('doPlan()')} } },

 { k:'match',
   ok(){ return (st().played|0)>0 },
   able(){ return G.week<38 },
   card(){ const f=nextFixture(); return {ic:'▶',bg:'var(--accw)',col:'var(--acc)',
     a:'Kick off',b:f?(f.home===G.me?'At home to ':'Away at ')+G.clubs[f.home===G.me?f.away:f.home].name
       :'Play the match',
     fn:'startMatch()'} } }
];

/* derive the current step. Pure, except that it retires the sequence
   when there is nothing left to do. Skips any step whose ingredients
   are missing rather than blocking on them. */
function sync(){
  const S=st(); if(!guided())return null;
  let i=S.step|0, guard=0;
  while(i<STEPS.length&&guard++<12){
    const s=STEPS[i];
    let done=false,able=true;
    try{ done=s.ok(); able=s.able() }catch(e){ done=true }
    if(done||!able){ i++; continue }
    break;
  }
  if(i!==(S.step|0)){ S.step=i; persist() }
  if(i>=STEPS.length){ finish(); return null }
  return STEPS[i];
}

function finish(){
  const S=st(); if(S.done)return;
  S.done=1; setPref('off',true); persist();
  try{ note('That is the game',
    'Objective agreed, team seen, plan set, match played. Everything else is you disagreeing with your assistant.',
    {from:vV('assist')}) }catch(e){}
}

/* --- step 1: the objective ------------------------------------------- */
OB.doObjective=function(){
  if(!G.objective)return;
  sheet(`<h3>The board's expectation</h3>
   <div class="sh-sub">Everything you are judged on flows from this.</div>
   ${saying('Take what they offered. Argue it down and you get an easier target with less money to hit it — and they write it down.')}
   <div class="opt rec" onclick="acceptObj(0)"><div><div style="font-weight:600">${esc(G.objective.text)}</div>
     <div class="dim" style="font-size:12px">What they asked for. Budget stays as it is.</div></div>
     <span class="st">Accept</span></div>
   <div class="opt" onclick="acceptObj(1)"><div><div style="font-weight:600">Talk them down</div>
     <div class="dim" style="font-size:12px">Easier target, 30% smaller budget, and they remember</div></div></div>`,{from:vV('assist')});
};

/* --- step 2: your best player ---------------------------------------- */
OB.doStar=function(){
  const p=star(); if(!p)return;
  const S=st(); S.fStar=1; S.starId=p.id; persist();
  showPlayer(p.id);
};

/* --- step 3: the assistant's plan ------------------------------------ */
OB.doPlan=function(){
  const a=plan(); if(!a)return;
  sheet(`<h3>${esc(a.opp.name)}</h3>
   <div class="sh-sub">${a.home?'At home':'Away from home'} this weekend.</div>
   ${saying(a.why)}
   <div class="opt rec" onclick="${call('takePlan()')}">
     <div><div style="font-weight:600">Set us up his way — ${a.plan.formation}</div>
     <div class="dim" style="font-size:12px">One tap. You can change any of it later, any time.</div></div>
     <span class="st">Do it</span></div>
   <div class="opt" onclick="${call('ownPlan()')}"><div><div style="font-weight:600">I will do it myself</div>
     <div class="dim" style="font-size:12px">Formation, tempo, line, mentality — all of it is yours</div></div></div>`);
};
OB.takePlan=function(){ const S=st(); S.fPlan=1; persist(); closeSheet(); applyPlan(); };
OB.ownPlan=function(){ const S=st(); S.fPlan=1; persist(); closeSheet(); G.squadView='tactics'; go('squad'); };

/* --- after the first match: the wrap ---------------------------------- */
function wrap(){
  const S=st(); if(!S.pendWrap)return;
  S.pendWrap=0; persist();
  const r=G.lastResult;
  let line='You have played your first match.';
  try{
    const s=r.hi===G.me?0:1,o=1-s,g=r.R.g;
    line=g[s]>g[o]?'Won it at the first go. Do not get used to it.'
      :g[s]===g[o]?'A point. Not nothing, not enough.'
      :'Lost. There are thirty-seven more of those weekends.';
  }catch(e){}
  sheet(`<h3>${esc(line)}</h3>
   <div class="sh-sub">That was the whole game, start to finish.</div>
   ${saying('Board target, best player, a plan, a match. Everything from here is the same four things on repeat — and you disagreeing with me more often.')}
   <div class="card" style="background:var(--s1)">
    <div class="kv"><span class="k2">Squad, tactics, training</span><span class="v2">Squad tab</span></div>
    <div class="kv"><span class="k2">Buy and sell</span><span class="v2">Market tab</span></div>
    <div class="kv"><span class="k2">Money and the board</span><span class="v2">Club tab</span></div>
    <div class="kv"><span class="k2">Tables, everyone else</span><span class="v2">World tab</span></div></div>
   <div style="font-size:12px;color:var(--t3);margin:12px 2px 0">None of it was ever locked. I will mention things
   as they start to matter, once each, and then shut up.</div>
   <button class="btn" style="margin-top:14px" onclick="closeSheet();render()">Get on with it</button>`);
}

/* ======================================================================
   3. PROGRESSIVE GUIDANCE — explanations arrive, features never do.
      Every one of these is already usable from minute one.
   ====================================================================== */
const BEATS=[
 {k:'market',at:5,need:null,t:'The window will open',
  l:'Every player at every club is in the Market tab. Shortlist anyone you fancy now — you can only sign when a window is open.',
  fn:"go('market')",go:'Show me'},
 {k:'scouts',at:7,need:'scouting',t:'We are guessing',
  l:'What we think of a player we have not watched is a guess. Put a scout on someone and the guess narrows.',
  fn:"go('market')",go:'Send a scout'},
 {k:'training',at:10,need:null,t:'They train all week',
  l:'Training is what the squad works on between matches. Pick a focus once and forget about it.',
  fn:"G.squadView='training';go('squad')",go:'Pick a focus'},
 {k:'contracts',at:13,need:'contracts',t:'Deals run out',
  l:'A contract inside its last year is a player you are about to lose for nothing. Sort them early and it costs less.',
  fn:"go('squad')",go:'Look at the deals'},
 {k:'morale',at:16,need:'morale',t:'They talk to each other',
  l:'A dressing room that has turned costs you points before a ball is kicked. It is worth a look when results go.',
  fn:"go('squad')",go:'Read the room'},
 {k:'academy',at:19,need:null,t:'There are kids downstairs',
  l:'Academy players never appear in your first team until you promote them. Some of them are already good enough.',
  fn:"G.squadView='academy';go('squad')",go:'See them'},
 {k:'facilities',at:23,need:'facilities',t:'Spend it on the building',
  l:'Money in the training ground pays you back in every season after this one. Money on a striker pays you back in May.',
  fn:"go('club')",go:'Have a look'},
 {k:'history',at:28,need:'history',t:'Somebody is writing this down',
  l:'Everything you win, and everything you lose, goes in the club chronicle. It outlives you.',
  fn:"go('club')",go:'Read it'}
];

function beat(){
  const S=st(); if(!live())return null;
  if(!S.tips)S.tips={};
  if(S.offer){ const b=BEATS.find(x=>x.k===S.offer); if(b)return b; S.offer=null }
  for(const b of BEATS){
    if(S.tips[b.k])continue;
    if((S.played|0)<b.at)continue;
    if(b.need&&!SW.get(b.need)){ S.tips[b.k]=1; continue }   // module absent — skip silently
    S.offer=b.k; persist();
    try{ note(b.t,b.l,{from:vV('assist')}) }catch(e){}
    return b;
  }
  return null;
}
OB.openBeat=function(k){
  const b=BEATS.find(x=>x.k===k); if(!b)return;
  const S=st(); S.tips[b.k]=1; S.offer=null; persist();
  sheet(`<h3>${esc(b.t)}</h3>
   ${saying(b.l)}
   <div style="font-size:12px;color:var(--t3);margin:0 2px 14px">This has been there since your first day.
   Nothing in this game unlocks.</div>
   <button class="btn" onclick="closeSheet();${b.fn}">${esc(b.go)}</button>
   <button class="btn ghost" style="margin-top:8px" onclick="closeSheet();render()">Not now</button>`);
};

/* ======================================================================
   4. FIRST-TIME LINES — one sentence at the top of a tab, once, ever.
      Injected after each render rather than hooked, because the core
      renders these tabs itself. Dismiss is a real 44px target.
   ====================================================================== */
const TIPS={
 squad:{tab:'squad',t:'This is everyone you have. The first eleven is who starts on Saturday — tap any of them to see him properly.'},
 market:{tab:'market',t:'Every player at every club, including yours. Star anyone to keep an eye on him; offers only go out when a window is open.'},
 world:{tab:'world',t:'The whole pyramid as it stands. Your row is the highlighted one — that is the only number the board reads.'},
 club:{tab:'club',t:'Your club from the boardroom: what they expect, what you earn, what you owe. The 85% wage cap is the line you cannot cross.'}
};
function decorate(){
  const S=st(); if(!live())return;
  const a=document.getElementById('app'); if(!a)return;
  dedupe(a); tipline(a,S);
}
/* While the guided week is on step one, the core's own "Board: …" card and
   ours are the same decision twice. Two cards asking one question is the
   exact confusion this module exists to prevent, so the duplicate goes.
   Ours survives — it is the one carrying the assistant's line. */
function dedupe(a){
  if(!guided()||G.tab!=='home')return;
  const s=STEPS[st().step|0]; if(!s||s.k!=='objective')return;
  let gone=0;
  Array.prototype.forEach.call(a.querySelectorAll('.act'),el=>{
    const h=el.querySelector('.a');
    if(h&&/^board:/i.test(h.textContent.trim())){ el.remove(); gone++ }
  });
  if(gone){ const n=a.querySelector('.sechead .n');
    if(n){ const v=parseInt(n.textContent,10);
      if(v-gone>0)n.textContent=String(v-gone); else n.remove() } }
}
function tipline(a,S){
  if(a.querySelector('.ob-tip'))return;
  const k=G.tab, T=TIPS[k];
  if(!T)return;
  if(!S.seen)S.seen={};
  if(S.seen[k])return;
  const sc=a.querySelector('.scroll'); if(!sc)return;
  css();
  const d=document.createElement('div');
  d.className='ob-tip';
  d.innerHTML=`<span style="color:var(--acc);margin-top:1px">◆</span>
    <div style="flex:1"><b>Assistant Coach</b> — ${esc(T.t)}</div>
    <button class="ob-x" aria-label="Got it" onclick="${call("hide('"+k+"')")}">✕</button>`;
  sc.insertBefore(d,sc.firstChild);
}
OB.hide=function(k){
  const S=st(); if(!S.seen)S.seen={};
  S.seen[k]=1; persist();
  const d=document.querySelector('.ob-tip'); if(d)d.remove();
};

/* watch the app container so a line can be dropped in after any render,
   without redefining render() and without losing the player's place */
let WATCHING=false;
function watch(){
  if(WATCHING)return; WATCHING=true;
  const a=document.getElementById('app'); if(!a)return;
  try{
    new MutationObserver(()=>{
      try{
        sync();
        if(guided()&&!st().welcomed&&G.me!==undefined&&G.clubs.length&&!document.getElementById('ob-take')){
          if(G.tab==='home')welcome();
        }
        if(st().pendWrap&&!document.querySelector('.sheetwrap'))wrap();
        decorate();
      }catch(e){}
    }).observe(a,{childList:true});
  }catch(e){ WATCHING=false }
}

/* ======================================================================
   REGISTRATION
   ====================================================================== */
SW.register(Object.assign(OB,{
  id:'onboarding',

  /* fires before the core's club list is drawn */
  boot(){
    css(); watch();
    if(optedOut())return;                                   // skipped once, gone forever
    try{ if(localStorage.getItem(SAVEKEY))return }catch(e){} // a save exists — returning player
    opening();
  },

  init(){
    const S=SW.state('onboarding');
    const off=optedOut();
    Object.assign(S,{on:off?0:1,dead:off?1:0,done:off?1:0,step:0,played:0,
      seen:{},tips:{},offer:null,welcomed:0,pendWrap:0,fStar:0,fPlan:0,starId:0});
  },
  onLoad(){
    const S=SW.state('onboarding');
    if(S.on===undefined){ S.on=0; S.done=1 }                // save from before this module existed
    if(!S.seen)S.seen={}; if(!S.tips)S.tips={};
    drop(); watch();
  },

  /* one card at a time, always at the top until the four are done */
  hubCards(){
    const out=[];
    const s=sync();
    if(s){ try{ out.push(Object.assign(s.card(),{priority:90})) }catch(e){} }
    const b=beat();
    if(b)out.push({ic:'◆',bg:'var(--s2)',col:'var(--acc)',a:b.t,b:b.l.split('.')[0]+'.',
      fn:call("openBeat('"+b.k+"')"),priority:10});
    return out;
  },

  /* the star-player moment: one line, inside the sheet, as he reads it */
  playerBlocks(p){
    const S=st(); if(!live())return [];
    if(S.step===1&&p.id===S.starId&&!S.done)
      return [`<div class="ob-say" style="margin:12px 0 0">
        <span style="color:var(--acc);margin-top:1px">◆</span>
        <div><b>Assistant Coach</b> — Best footballer at this club by a distance. The big number is what he is
        now; the bars are what he is made of. That is all you ever need off this screen.</div></div>`];
    if(!S.seen.player){ S.seen.player=1; persist();
      return [`<div class="ob-say" style="margin:12px 0 0">
        <span style="color:var(--acc);margin-top:1px">◆</span>
        <div><b>Assistant Coach</b> — Judge a player on the big number and his condition. Everything under it
        is for arguments in the car park.</div></div>`]; }
    return [];
  },

  onMatchEnd(){
    const S=st(); if(!live())return;
    S.played=(S.played|0)+1;
    if(S.played===1&&!S.done)S.pendWrap=1;
    persist();
  },

  onWeek(){ sync() },

  /* claim the post-match screen exactly once, after the very first match.
     If a louder module (board, media) claimed it first, the same wrap is
     shown on the next hub render instead — nothing is lost either way. */
  afterReport(){
    const S=st();
    if(!live()||!S.pendWrap)return null;
    render(); wrap();
    return true;
  },

  /* ---------- published interface ---------- */
  active(){ return guided() },                 // is a guided first career in progress
  step(){ const s=sync(); return s?s.k:null }, // 'objective'|'star'|'plan'|'match'|null
  isNewcomer(){ return live() },               // first-ever career, guidance still on
  seen(k){ const S=st(); return !!(S.seen&&S.seen[k]) },
  skip(){                                      // one tap, permanent, every future save
    const S=st(); S.on=0; S.dead=1; S.done=1; S.pendWrap=0;
    setPref('off',true); persist(); drop();
    const d=document.querySelector('.ob-tip'); if(d)d.remove();
    try{ if(G.clubs.length&&G.objective)render() }catch(e){}
  },
  reset(){ try{ localStorage.removeItem(PREF) }catch(e){} }   // for testing
}));

})();
