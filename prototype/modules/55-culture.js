/* ============================================================
   SILVERWARE module: culture
   Designed from a UEFA C coach's account of the job.

   The premise: culture is not a squad statistic. It is the accumulated
   record of what the manager actually did when it cost him something —
   and once that record exists, it constrains him.

   Three things drive the whole model, all of them straight from the brief:
     1. Trust is per-person. Twenty-five personalities, twenty-five different
        boundaries. One man walks after a single act of hypocrisy; another
        needs to see the pattern three or four times before he decides the
        man at the top is not worth it.
     2. The manager owns the culture; the captain transmits it. The coach
        does not play. On the field the captain sets the example.
     3. The commonest way to lose a dressing room is double standards —
        and the second is failing to protect your players from the press,
        the board and the chairman.
   ============================================================ */
(function(){

const DEF={
  set:false, standards:[], captain:null,
  trust:{}, breaches:{}, seen:{}, promises:[], precedent:{},
  identity:[], log:[], proactive:0, reactive:0, pending:null, nextEv:4, hypo:0,
  /* ---- part two: where they stand, and what the room made of it ---- */
  roles:{},          // the draft you are editing on the roles screen
  told:{},           // pid -> {role,week,season,over,wronged}  what you actually said
  standing:{},       // pid -> -100..100  what his TEAMMATES make of him
  grief:[],          // the last few times the room passed judgement
  griefSeen:{},      // pid -> absolute week, so the same man is not re-tried monthly
  st:{}, gm:0,       // starts and games, tracked here so roles never has to ask morale
  roleSeason:-1, roleOpen:0, lastArb:-99, tally:null
};
function S(){const s=SW.state('culture');
  for(const k in DEF)if(s[k]===undefined)
    s[k]=(typeof DEF[k]==='object'&&DEF[k]!==null)?JSON.parse(JSON.stringify(DEF[k])):DEF[k];
  return s;}

/* ---------- the three non-negotiables you may set ---------- */
const STANDARDS=[
  {k:'team',   t:'Nobody is bigger than the team',  d:'Reputation buys you nothing here.'},
  {k:'time',   t:'Timekeeping is sacred',           d:'Late is late, whoever you are.'},
  {k:'youth',  t:'The kids get their chance',       d:'If they are good enough, they are old enough.'},
  {k:'front',  t:'We do not hide when we are losing',d:'You want the ball at 2-0 down.'},
  {k:'truth',  t:'You will always hear it from me first',d:'No player finds out from the press.'},
  {k:'work',   t:'We outwork everyone',             d:'Talent is the entry fee, not the standard.'}
];

/* ---------- what a given player actually cares about ----------
   Derived deterministically from the personality bytes that already exist, so
   this never needs storing and never drifts. Two men can be handed the exact
   same treatment and one is fine with it while the other never forgets. */
const CARES={
  played:  {t:'being picked',        w:'He judges you on the teamsheet, nothing else.'},
  truth:   {t:'straight answers',    w:'He would rather hear bad news early than good news late.'},
  backed:  {t:'being defended',      w:'He wants to know you will take the bullet for him in public.'},
  respect: {t:'being respected',     w:'He has been here a long time and expects to be treated like it.'},
  grown:   {t:'being developed',     w:'He wants to be better in June than he was in August.'}
};
function caresOf(p){
  const h=(p.id*2654435761)>>>0;
  if(p.age>=30&&p.prof>=55)return 'respect';
  if(p.age<=21)return (h%3===0)?'grown':'played';
  if(p.amb>=72)return 'played';
  if(p.prof>=70)return 'truth';
  return ['played','truth','backed','grown'][h%4];
}
/* Fuse: how many breaches before he is gone. Some men, one is enough. */
function fuseOf(p){
  if(p.trait==='Model professional')return 4;
  if(p.trait==='Loyal servant')return 5;
  if(p.trait==='Mercenary')return 1;
  if(p.trait==='Hot-headed')return 1;
  if(p.prof>=78)return 4;
  if(p.prof>=55)return 3;
  return (p.amb>=70)?1:2;
}
function stature(p){
  const c=me();if(!c)return 0;
  const best=squadOf(c).map(x=>CA(x)).sort((a,b)=>b-a);
  const rank=best.indexOf(CA(p));
  return rank<0?0:(rank<5?2:rank<12?1:0);      // 2 = star, 1 = squad, 0 = fringe
}

/* ---------- trust ---------- */
function trustOf(id){const s=S();return s.trust[id]===undefined?15:s.trust[id]}
function moveTrust(id,d,why){
  const s=S(),before=trustOf(id);
  s.trust[id]=clamp(Math.round(before+d),-100,100);
  if(why&&Math.abs(d)>=3){
    s.log.unshift({w:G.week,s:G.season,id,d:Math.round(d),why});
    if(s.log.length>40)s.log.length=40;
  }
}
function squadTrust(){
  const c=me();if(!c)return 0;
  const sq=squadOf(c);if(!sq.length)return 0;
  let t=0,w=0;
  sq.forEach(p=>{const wt=1+stature(p);t+=trustOf(p.id)*wt;w+=wt});
  return Math.round(t/(w||1));
}
/* The captain carries it onto the pitch. A captain who does not believe in you
   transmits nothing, however good the room is. */
function transmission(){
  const s=S(),c=me();
  if(!c)return 0.55;
  const cap=c.squad.find(p=>p.id===s.captain);
  if(!cap)return 0.5;
  const belief=(trustOf(cap.id)+100)/200;                       // 0..1
  const standing=clamp((CA(cap)-55)/40,0,1)*0.5+clamp(cap.age-22,0,10)/10*0.3
    +(cap.prof/100)*0.2;
  return clamp(0.35+belief*0.45+standing*0.25,0,1.05);
}
function cultureScore(){
  return clamp(Math.round((squadTrust()*0.62+18)*transmission()),-100,100);
}

/* ---------- precedent: the hypocrisy engine ----------
   Every judgement is filed under the situation, with the stature of the man it
   was applied to. Judge the same situation differently depending on who it is
   and the room sees it — because in a real dressing room, they always do. */
function filePrecedent(key,upheld,p){
  const s=S();
  (s.precedent[key]=s.precedent[key]||[]).push(
    {up:upheld?1:0,st:stature(p),w:G.week,s:G.season,n:p.name});
  if(s.precedent[key].length>8)s.precedent[key].shift();
}
function hypocrisyCheck(key,upheld,p){
  const s=S(),hist=s.precedent[key]||[];
  const mine=stature(p);
  const clash=hist.find(h=>h.up!==(upheld?1:0)&&h.st!==mine);
  if(!clash)return null;
  s.hypo++;
  const softer=upheld?clash.n:p.name;      // who got the easy ride
  const harder=upheld?p.name:clash.n;
  const c=me();
  squadOf(c).forEach(x=>{
    const f=fuseOf(x);
    const bite=(f<=1?-16:f<=2?-11:f<=3?-8:-5)*(x.id===p.id?0.4:1);
    moveTrust(x.id,bite,'saw one rule for '+softer.split(' ').pop()+' and another for '+harder.split(' ').pop());
  });
  bumpBreach();
  note('They noticed',
    `You have handled the same thing two different ways. ${esc(harder)} carried it, ${esc(softer)} did not. `+
    `Nobody said anything. They did not have to.`,{from:vV('staff')});
  return {softer,harder};
}
function bumpBreach(){
  const s=S(),c=me();
  squadOf(c).forEach(p=>{
    s.breaches[p.id]=(s.breaches[p.id]||0)+1;
    if(s.breaches[p.id]>=fuseOf(p)&&trustOf(p.id)<-20){
      const mo=SW.get('morale');
      if(mo&&mo.adjust)try{mo.adjust(p.id,-30,'has stopped believing the manager')}catch(e){}
    }
  });
}

/* ---------- promises ---------- */
function promise(pid,what,weeks,tag){
  const s=S();
  s.promises.unshift({pid,what,due:G.week+(weeks||6),season:G.season,state:'open',tag:tag||null});
  if(s.promises.length>40)s.promises.length=40;
}
/* tag lets one kind of promise be settled without disturbing another. A squad
   role is a promise like any other — it just gets judged on a season, not a
   fortnight, and it is judged by the teamsheet rather than by a conversation. */
function settle(pid,kept,why,tag){
  const s=S();
  const i=s.promises.findIndex(x=>x.pid===pid&&x.state==='open'&&(tag?x.tag===tag:!x.tag));
  if(i<0)return;
  s.promises[i].state=kept?'kept':'broken';
  const c=me(),p=c&&c.squad.find(x=>x.id===pid);
  if(!p)return;
  moveTrust(pid,kept?9:-18,why||(kept?'you did what you said you would':'you said one thing and did another'));
  if(!kept)bumpBreachOne(pid);
}
function bumpBreachOne(pid){
  const s=S();s.breaches[pid]=(s.breaches[pid]||0)+1;
}
/* A promise nobody ever resolves is its own category — and it is the one that
   quietly rots a dressing room. */
function sweepPromises(){
  const s=S(),c=me();
  s.promises.filter(x=>x.state==='open'&&!x.tag&&G.week>x.due).forEach(x=>{
    x.state='forgotten';
    const p=c.squad.find(y=>y.id===x.pid);
    moveTrust(x.pid,-11,'you never came back to him about '+x.what);
    if(p&&stature(p)>=1&&rnd()<0.5)
      note('He is still waiting',`You told ${esc(p.name)} ${esc(x.what)}. That was a while ago now.`,{from:vP(p),rel:'promised'});
  });
}
window.cultPromise=promise;

/* ============================================================
   THE MOMENTS
   Four verbs, because that is all the job reduces to on a phone:
   back him or don't · keep your word or don't · apply the standard or
   don't · show up before it is a problem, or after.
   ============================================================ */
function pickTarget(pref){
  const c=me();if(!c)return null;
  let pool=squadOf(c).filter(p=>p.out<=0);
  if(!pool.length)return null;
  if(pref==='star')pool=pool.filter(p=>stature(p)===2).concat(pool).slice(0,8);
  if(pref==='fringe'){
    const f=pool.filter(p=>!c.xi.some(x=>x.p.id===p.id));
    if(f.length)pool=f;
  }
  return pick(pool);
}
function lastResult(){
  const r=G.lastResult;if(!r)return null;
  const mine=r.hi===G.me?0:1;
  return {gf:r.R.g[mine],ga:r.R.g[1-mine],won:r.R.g[mine]>r.R.g[1-mine],
    lost:r.R.g[mine]<r.R.g[1-mine]};
}

/* --- the protection moment: press, board or chairman come for one of yours --- */
/* Options are rebuilt from (player, args) rather than closed over, because
   G.mod is JSON-serialised on save — a closure does not survive a reload, and
   an event you answered after loading used to do nothing at all, silently. */
const EVOPTS={};
function optsFor(ev){
  const c=me();if(!c||!ev)return null;
  const p=c.squad.find(x=>x.id===ev.pid);
  const b=EVOPTS[ev.id];
  if(!p||!b)return null;
  try{return b(p,ev.a||{})}catch(e){console.error('[culture.optsFor]',e);return null}
}

EVOPTS.protect=function(p,a){
  const src=a.src;
  return [
      {t:'Stand in front of him',
       d:'Take it publicly. The heat comes to you instead.',
       fn:()=>{
         filePrecedent('protect',true,p);
         hypocrisyCheck('protect',true,p);
         const c=me();
         squadOf(c).forEach(x=>{
           const w=caresOf(x)==='backed'?1.6:1;
           moveTrust(x.id,(x.id===p.id?16:5)*w,'you stood in front of '+p.name.split(' ').pop());
         });
         const b=SW.get('board');if(b&&b.adjust&&src==='board')try{b.adjust(-6,'publicly contradicted the chairman over '+p.name)}catch(e){}
         const mo=SW.get('morale');if(mo&&mo.adjust)try{mo.adjust(p.id,22,'the manager defended him in public')}catch(e){}
         note('You took it for him','You said it was on you. He will not forget that, and neither will the rest of them.',{from:vV('staff'),about:vP(p)});
       }},
      {t:'Say nothing',
       d:'Stay out of it. It is not your fight to pick.',
       fn:()=>{
         filePrecedent('protect',false,p);
         hypocrisyCheck('protect',false,p);
         const c=me();
         squadOf(c).forEach(x=>{
           const w=caresOf(x)==='backed'?1.8:0.8;
           moveTrust(x.id,(x.id===p.id?-14:-4)*w,'left '+p.name.split(' ').pop()+' out there on his own');
         });
         bumpBreachOne(p.id);
         note('You left him out there','You did not have to say much. You said nothing, and that was the answer.',{from:vV('staff'),about:vP(p)});
       }},
      {t:'Agree with them',
       d:'Side with the criticism. Buys you room, costs you the room.',
       fn:()=>{
         filePrecedent('protect',false,p);
         const c=me();
         squadOf(c).forEach(x=>moveTrust(x.id,x.id===p.id?-30:-9,'threw '+p.name.split(' ').pop()+' under the bus'));
         bumpBreach();
         const b=SW.get('board');if(b&&b.adjust)try{b.adjust(5,'backed the board over a player')}catch(e){}
         const mo=SW.get('morale');if(mo&&mo.adjust)try{mo.adjust(p.id,-40,'the manager sided against him publicly')}catch(e){}
         note('You agreed with them','Twenty-four other players read that quote this morning.',{from:vV('press'),about:vP(p)});
       }}
  ];
};
function evProtect(){
  const p=pickTarget(rnd()<0.6?'star':null);if(!p)return null;
  const src=pick(['press','board','fans']);
  const line={
    press:`The back pages have gone after ${p.name}. One of them called him "the most expensive mistake at the club".`,
    board:`The chairman raised ${p.name} in a meeting. He wants him gone in January and he wants you to say so publicly.`,
    fans:`${p.name} was booed by his own supporters when his number went up.`
  }[src];
  return {id:'protect', pid:p.id, key:'protect', a:{src},
    title:'They have come for '+p.name.split(' ').pop(),
    body:line, opts:EVOPTS.protect(p,{src})};
}

/* --- the standard being tested, which is the only way a standard becomes real --- */
function evStandard(){
  const s=S();if(!s.standards.length)return null;
  const st=pick(s.standards), def=STANDARDS.find(x=>x.k===st);if(!def)return null;
  const p=pickTarget(rnd()<0.55?'star':null);if(!p)return null;
  const sn=p.name.split(' ').pop();
  const body={
    time:`${p.name} turned up late for the bus. Everybody saw it.`,
    team:`${p.name} has been telling people he is above the reserves in training.`,
    youth:`Your assistant wants the experienced option on Saturday. The seventeen-year-old has been the better trainer all month.`,
    front:`${p.name} hid at 2-0 down on Saturday. He did not want it.`,
    truth:`${p.name} found out from a journalist that he was being left out.`,
    work:`${p.name} was the first one off the training pitch again.`
  }[st]||`${p.name} has fallen short of it.`;
  const isStar=stature(p)===2;
  return {
    id:'standard', pid:p.id, key:'std_'+st, a:{st},
    title:'"'+def.t+'"',
    body:body+(isStar?' He is also the best player you have, and you play on Saturday.':''),
    opts:EVOPTS.standard(p,{st})};
}
EVOPTS.standard=function(p,a){
  const st=a.st, sn=p.name.split(' ').pop(), isStar=stature(p)===2;
  return [
      {t:'Apply it. No exceptions.',
       d:isStar?'He sits out. You are weaker for it, and everybody knows why.':'He sits out.',
       fn:()=>{
         filePrecedent('std_'+st,true,p);
         hypocrisyCheck('std_'+st,true,p);
         const c=me();
         squadOf(c).forEach(x=>moveTrust(x.id,x.id===p.id?-6:(isStar?11:5),'held the standard, even with '+sn));
         if(isStar){p.cond=Math.min(100,p.cond+6);p.out=Math.max(p.out,0)}
         const mo=SW.get('morale');if(mo&&mo.adjust)try{mo.adjust(p.id,-16,'dropped for falling below the standard')}catch(e){}
         note('The standard held','It cost you. That is what made it worth something.',{from:vV('staff'),about:vP(p)});
       }},
      {t:'Let it go this once',
       d:'Have a quiet word. Move on. Nobody needs to know.',
       fn:()=>{
         filePrecedent('std_'+st,false,p);
         hypocrisyCheck('std_'+st,false,p);
         const c=me();
         squadOf(c).forEach(x=>moveTrust(x.id,x.id===p.id?4:-7,'let it slide for '+sn));
         bumpBreach();
         note('You let it go','They all knew about it before you did. Now they know what it is worth.',{from:vV('staff'),about:vP(p)});
       }}
  ];
};

/* --- the proactive/reactive axis: seeing a man before he becomes a problem --- */
function evCheckIn(){
  const c=me();if(!c)return null;
  const s=S();
  const forgotten=squadOf(c).filter(p=>{
    const last=s.seen[p.id]||-99;
    return (G.week-last)>14 && !c.xi.some(x=>x.p.id===p.id) && p.out<=0;
  });
  if(!forgotten.length)return null;
  const p=forgotten.sort((a,b)=>CA(b)-CA(a))[0];
  const care=CARES[caresOf(p)];
  return {
    id:'checkin', pid:p.id, key:'checkin', a:{},
    title:'You have not spoken to '+p.name.split(' ').pop()+' since August',
    body:`He has not started a game and he has not been told why. ${care.w}`,
    opts:EVOPTS.checkin(p,{})};
}
EVOPTS.checkin=function(p){
  return [
      {t:'Tell him the truth',
       d:'Where he stands, and what would change it.',
       fn:()=>{
         S().seen[p.id]=G.week;S().proactive++;
         const w=caresOf(p)==='truth'?1.9:1;
         moveTrust(p.id,14*w,'told him the truth to his face');
         promise(p.id,'he would get a look in',8);
         const mo=SW.get('morale');if(mo&&mo.adjust)try{mo.adjust(p.id,12,'the manager was straight with him')}catch(e){}
         note('You were straight with him','He did not like it. He respected it.',{from:vP(p)});
       }},
      {t:'Tell him what he wants to hear',
       d:'Keep it sweet. Deal with it later.',
       fn:()=>{
         S().seen[p.id]=G.week;S().reactive++;
         promise(p.id,'he would be starting soon',5);
         moveTrust(p.id,6,'told him what he wanted to hear');
         note('You bought yourself some time','You have three weeks before that comes back.',{from:vP(p)});
       }},
      {t:'Leave it',
       d:'You have a game on Saturday.',
       fn:()=>{
         S().reactive++;
         moveTrust(p.id,-9,'could not find ten minutes for him');
         note('You left it','It is on the list. It has been on the list since August.',{from:vV('assist'),about:vP(p)});
       }}
  ];
};

function nextEvent(){
  const s=S();
  if(!s.set||s.pending)return;
  if(G.week<s.nextEv)return;
  const roll=[evStandard,evProtect,evCheckIn];
  for(let i=0;i<3;i++){
    const ev=pick(roll)();
    if(ev){s.pending=ev;s.nextEv=G.week+ri(4,7);return}
  }
  s.nextEv=G.week+3;
}

/* ============================================================
   THE IDENTITY THAT WRITES ITSELF
   No sliders. These sentences are derived from what the manager actually did.
   ============================================================ */
function identity(){
  const s=S(),out=[];
  const prec=k=>{const h=s.precedent[k]||[];return {n:h.length,up:h.filter(x=>x.up).length}};
  const pr=prec('protect');
  if(pr.n>=2){
    if(pr.up/pr.n>=0.75)out.push('A team whose manager stands in front of them.');
    else if(pr.up/pr.n<=0.3)out.push('A team that fights its own battles in public.');
  }
  s.standards.forEach(k=>{
    const h=prec('std_'+k);if(h.n<2)return;
    const def=STANDARDS.find(x=>x.k===k);if(!def)return;
    if(h.up/h.n>=0.75)out.push(def.t+' — and it has cost them.');
    else if(h.up/h.n<=0.34)out.push('"'+def.t+'" was said in August and has not been true since.');
  });
  const kept=s.promises.filter(p=>p.state==='kept').length;
  const broke=s.promises.filter(p=>p.state==='broken').length;
  const forgot=s.promises.filter(p=>p.state==='forgotten').length;
  if(kept+broke+forgot>=4){
    if(kept>(broke+forgot)*2)out.push('When the manager says something here, it happens.');
    else if(forgot>kept)out.push('Things get said here and then quietly forgotten.');
    else if(broke>=kept)out.push('Nobody takes the manager at his word any more.');
  }
  if(s.hypo>=2)out.push('There is one rule for some of them and another for the rest.');
  if(s.proactive>=3&&s.proactive>s.reactive*1.5)out.push('Players get spoken to before it becomes a problem.');
  if(s.reactive>=4&&s.reactive>s.proactive*2)out.push('Nothing gets dealt with here until it is already broken.');
  const cap=me()&&me().squad.find(p=>p.id===s.captain);
  if(cap&&trustOf(cap.id)>45)out.push('The captain carries it for him on the pitch.');
  else if(cap&&trustOf(cap.id)<-10)out.push('The captain does not believe him, and it shows.');
  return out;
}
function verdict(){
  const v=cultureScore();
  if(v>=62)return {t:'They would run through a wall for you.',c:'var(--win)'};
  if(v>=34)return {t:'A good dressing room. They believe you.',c:'var(--win)'};
  if(v>=12)return {t:'Settled enough. Nothing is broken.',c:'var(--acc)'};
  if(v>=-14)return {t:'Cool. They are waiting to see who you are.',c:'var(--acc)'};
  if(v>=-40)return {t:'You have lost some of them.',c:'var(--inj)'};
  return {t:'This room is gone.',c:'var(--loss)'};
}

/* ---------- UI ---------- */
function meter(v){
  const pct=Math.round((v+100)/2);
  return `<div style="height:9px;border-radius:5px;background:var(--s3);overflow:hidden;position:relative">
    <div style="height:100%;width:${pct}%;border-radius:5px;background:linear-gradient(90deg,var(--loss),var(--acc) 52%,var(--win))"></div>
    <div style="position:absolute;left:50%;top:-3px;bottom:-3px;width:2px;background:var(--t3);opacity:.5"></div></div>`;
}
function trustDots(v){
  const n=clamp(Math.round((v+100)/40),0,5);
  const col=v>=40?'var(--win)':v>=0?'var(--acc)':v>=-40?'var(--inj)':'var(--loss)';
  let o='';for(let i=0;i<5;i++)o+=`<i style="width:6px;height:6px;border-radius:50%;display:block;
    background:${i<n?col:'var(--s3)'}"></i>`;
  return `<span class="form" style="gap:3px">${o}</span>`;
}
function cultureView(){
  const s=S(),c=me();
  if(!s.set)return setupView();
  const v=cultureScore(),vd=verdict(),ident=identity();
  const cap=c.squad.find(p=>p.id===s.captain);
  const sq=squadOf(c).slice().sort((a,b)=>trustOf(a.id)-trustOf(b.id));
  const open=s.promises.filter(p=>p.state==='open'&&c.squad.some(x=>x.id===p.pid));
  return `<div class="card">
    <div class="row"><span class="dim" style="font-size:10px;letter-spacing:.06em;text-transform:uppercase">The room</span>
      <span class="spacer"></span><span style="font-weight:700;color:${vd.c};font-size:13px">${esc(vd.t)}</span></div>
    <div style="margin-top:10px">${meter(v)}</div>
    <div class="row" style="margin-top:11px;gap:14px">
      <div><div class="dim" style="font-size:10px;text-transform:uppercase;letter-spacing:.05em">Captain</div>
        <div style="font-weight:700;font-size:13px;margin-top:3px">${cap?esc(cap.name.split(' ').pop()):'—'}</div></div>
      <div><div class="dim" style="font-size:10px;text-transform:uppercase;letter-spacing:.05em">Carries onto the pitch</div>
        <div style="font-weight:700;font-size:13px;margin-top:3px">${Math.round(transmission()*100)}%</div></div>
      <span class="spacer"></span>
      <button class="btn ghost xs" onclick="cultCaptain()">Armband</button></div></div>

   ${rolesBlock()}
   ${griefBlock()}

   ${ident.length?`<div class="sechead">What this team has become</div>
     <div class="card">${ident.map(l=>`<div style="display:flex;gap:9px;padding:7px 0;font-size:14px;
       line-height:19px;border-top:1px solid var(--hair)">
       <span style="color:var(--acc)">—</span><span>${esc(l)}</span></div>`).join('')}</div>`
    :`<div class="card" style="margin-top:10px"><div style="font-size:13px;color:var(--t2)">
       Nothing to say yet. This fills in as they work out who you are.</div></div>`}

   <div class="sechead">Your word<span class="n">${open.length} open</span></div>
   <div class="card">
   ${(function(){const mine=s.promises.filter(pr=>c.squad.some(x=>x.id===pr.pid));
     return mine.length?mine.slice(0,7).map(pr=>{
     const p=c.squad.find(x=>x.id===pr.pid);
     const col={open:'var(--acc)',kept:'var(--win)',broken:'var(--loss)',forgotten:'var(--t3)'}[pr.state];
     const lbl={open:'OPEN',kept:'KEPT',broken:'BROKEN',forgotten:'FORGOTTEN'}[pr.state];
     return `<div class="kv"><span class="k2">${esc(surn(p))} — ${esc(pr.what)}</span>
       <span class="v2" style="color:${col};font-size:11px;letter-spacing:.05em">${lbl}</span></div>`}).join('')
    :'<div class="dim" style="font-size:13px">You have not promised anybody anything yet.</div>'})()}</div>

   <div class="sechead">Where you stand with them</div>
   <div class="card" style="padding:6px 14px 12px">
   ${sq.slice(0,10).map(p=>{
     const t=trustOf(p.id),care=CARES[caresOf(p)];
     return `<div class="plr" onclick="showPlayer(${p.id})">
       ${avatar(vP(p),60)}
       <div class="nmw"><div class="nm2">${esc(p.name)}</div>
        <div class="meta"><span>${p.pos}</span><span>${p.age}</span>
          <span style="color:var(--t3)">cares about ${esc(care.t)}</span></div></div>
       ${trustDots(t)}</div>`}).join('')}</div>

   <div class="sechead">Non-negotiables</div>
   <div class="card">${s.standards.map(k=>{
     const d=STANDARDS.find(x=>x.k===k);const h=s.precedent['std_'+k]||[];
     const held=h.filter(x=>x.up).length;
     return `<div class="kv"><span class="k2">${esc(d?d.t:k)}</span>
       <span class="v2" style="font-size:12px;color:${h.length&&held/h.length>=0.7?'var(--win)':h.length?'var(--loss)':'var(--t3)'}">
       ${h.length?held+' of '+h.length+' held':'untested'}</span></div>`}).join('')}</div>`;
}
function setupView(){
  return `<div class="card" style="border-color:var(--acc)">
    <div style="font-size:15px;font-weight:700;margin-bottom:6px">Before you pick a team, decide what this one is.</div>
    <div style="font-size:13px;color:var(--t2);line-height:19px">
      Choose three. They become public — the squad will know them by Friday. After that the
      season will test them, usually at the worst possible moment, usually on your best player.
      A standard you break in front of them is worse than one you never set.</div></div>
   <div class="sechead">Pick three</div>
   ${STANDARDS.map(s2=>{
     const on=S().standards.includes(s2.k);
     return `<div class="opt ${on?'rec':''}" onclick="cultToggle('${s2.k}')">
       <div><div style="font-weight:600">${esc(s2.t)}</div>
         <div class="dim" style="font-size:12px">${esc(s2.d)}</div></div>
       ${on?'<span class="st">Chosen</span>':''}</div>`}).join('')}
   <button class="btn" style="margin-top:8px" ${S().standards.length===3?'':'disabled'}
     onclick="cultConfirm()">${S().standards.length===3?'These are the standards':'Choose '+(3-S().standards.length)+' more'}</button>`;
}
window.cultToggle=function(k){
  const s=S(),i=s.standards.indexOf(k);
  if(i>=0)s.standards.splice(i,1);
  else if(s.standards.length<3)s.standards.push(k);
  render();
};
window.cultConfirm=function(){
  const s=S(),c=me();
  s.set=true;
  if(!s.captain){
    const cands=squadOf(c).sort((a,b)=>(b.prof*1.4+b.age*2+CA(b))-(a.prof*1.4+a.age*2+CA(a)));
    s.captain=cands[0]?cands[0].id:null;
  }
  squadOf(c).forEach(p=>{s.seen[p.id]=G.week});
  note('The standards are set','You said them out loud. That is the easy part.',{from:vV('staff')});
  save();render();
};
window.cultCaptain=function(){
  const c=me(),s=S();
  const cands=squadOf(c).sort((a,b)=>(trustOf(b.id)+b.prof+b.age*2)-(trustOf(a.id)+a.prof+a.age*2)).slice(0,6);
  sheet(`<h3>The armband</h3>
   <div class="sh-sub">You own the culture. He transmits it. Pick the man they actually listen to,
     not the best player.</div>
   ${cands.map(p=>`<div class="opt ${s.captain===p.id?'rec':''}" onclick="cultSetCap(${p.id})">
     ${pface(p,44)}
     <div style="min-width:0"><div style="font-weight:600">${esc(p.name)}</div>
       <div class="dim" style="font-size:12px">${p.pos} · ${p.age} · ${CARES[caresOf(p)].t}</div></div>
     <span class="spacer"></span>${trustDots(trustOf(p.id))}</div>`).join('')}
   <button class="btn ghost" onclick="closeSheet()">Close</button>`);
};
window.cultSetCap=function(id){
  const s=S(),c=me(),p=c.squad.find(x=>x.id===id);
  const old=s.captain;
  s.captain=id;
  if(old&&old!==id){
    const o=c.squad.find(x=>x.id===old);
    if(o){moveTrust(old,-18,'took the armband off him');bumpBreachOne(old)}
  }
  moveTrust(id,12,'gave him the armband');
  note(p.name+' is your captain','He speaks for them now, and for you.',{from:vP(p)});
  closeSheet();save();render();
};
window.cultAnswer=function(i){
  const s=S(),ev=s.pending;if(!ev)return;
  let o=ev.opts&&ev.opts[i];
  if(!o||typeof o.fn!=='function'){const re=optsFor(ev);if(re&&re[i])o=re[i]}
  if(!o||typeof o.fn!=='function'){s.pending=null;closeSheet();render();return}
  s.pending=null;
  try{o.fn()}catch(e){console.error('[culture.answer]',e)}
  closeSheet();save();render();
};
/* Culture moments have always carried a pid. It was never rendered. */
function evVoices(ev){
  const c=me(); if(!c)return {sp:vV('assist'),sub:null};
  const p=c.squad.find(x=>x.id===ev.pid)||null;
  const src=(ev.a&&ev.a.src)||null;
  const sp = src==='press'?vV('press') : src==='board'?vV('board') : src==='fans'?vV('fans')
           : ev.id==='checkin'?vV('assist') : vV('staff');
  return {sp, sub:p?vP(p):null,
    rel: src==='fans'?'booed':src?'came for':(ev.id==='checkin'?'forgot':'about')};
}
function showEvent(){
  const s=S(),ev=s.pending;if(!ev)return;
  const V=evVoices(ev);
  sheet(`${speakerBar(V.sp,V.sub,V.rel,ev.key==='protect'?'They want an answer':'')}
   <h3>${esc(ev.title)}</h3>
   <div class="sh-sub">${esc(ev.body)}</div>
   ${ev.opts.map((o,i)=>`<div class="opt${i===0?' rec':''}" onclick="cultAnswer(${i})">
     <div><div style="font-weight:600">${esc(o.t)}</div>
       <div class="dim" style="font-size:12px">${esc(o.d)}</div></div></div>`).join('')}`);
}
window.cultOpen=showEvent;

/* ============================================================
   PART TWO — WHERE THEY STAND, AND WHO THE ROOM SIDES WITH

   Two mechanics, and they are the same idea seen from both ends.

   1. Expectations are set in July, not argued about in November. You tell
      every man what he is — key player, squad rotation, backup, surplus —
      and that goes in the promises ledger with everything else you say,
      because that is what it is. Tell a fringe man he is key and you have
      written a cheque the teamsheet cannot cash. Tell a good man he is
      surplus and he is right to agitate, and the room knows he is right.

   2. A dressing room reacts to the GRIEVANCE, not to the complaint. Before
      the room takes a side it asks three questions: is he actually good
      enough to be playing, given who is in front of him? was he told where
      he stood? have you kept your word to him? Then:
        · he has a point            -> the room sides with him, harmony falls,
                                       and if the culture is strong the senior
                                       men bring it to your door instead of
                                       letting it rot behind your back.
        · he has no point, strong room -> they close ranks around the standard.
                                       Harmony holds or improves, the seniors
                                       deal with him privately, he loses
                                       standing with his own teammates, and
                                       your authority goes UP. You spent nothing.
        · he has no point, weak room -> it spreads, because there is no
                                       standard in there for anyone to defend.
   ============================================================ */

const ROLES={
  key :{t:'Key player',     s:'Key',      d:'He plays when he is fit.',                     share:0.55,ord:3,col:'var(--win)'},
  rot :{t:'Squad rotation', s:'Rotation', d:'In and out. Twenty-odd starts.',               share:0.25,ord:2,col:'var(--acc)'},
  back:{t:'Backup',         s:'Backup',   d:'Cover. Cup ties and the last twenty minutes.', share:0.08,ord:1,col:'var(--t2)'},
  surp:{t:'Surplus',        s:'Surplus',  d:'Not part of it. Find yourself a club.',        share:0.02,ord:0,col:'var(--loss)'}
};
const RKEYS=['key','rot','back','surp'];
const MFULL={Aug:'August',Sep:'September',Oct:'October',Nov:'November',Dec:'December',
  Jan:'January',Feb:'February',Mar:'March',Apr:'April',May:'May'};
function surn(p){
  const l=String(p.name).split(' ').pop(),c=me();
  if(c&&c.squad.filter(x=>String(x.name).split(' ').pop()===l).length>1)return p.name;
  return l;
}
function monthAt(w){return MFULL[MONTHS[clamp(w|0,0,37)]]||'pre-season'}
const rankAt=(rk,id)=>rk[id]===undefined?99:rk[id];
function rankMap(){
  const c=me(),m={};if(!c)return m;
  squadOf(c).slice().sort((a,b)=>CA(b)-CA(a)).forEach((p,i)=>m[p.id]=i);
  return m;
}
function xiCA(c){
  if(!c||!c.xi||!c.xi.length)return 55;
  return c.xi.reduce((a,x)=>a+CA(x.p,x.slot),0)/c.xi.length;
}
function shareOf(pid){const s=S();return s.gm?(s.st[pid]||0)/s.gm:0}
function roleOf(pid){const t=S().told[pid];return t?t.role:null}
const absWeek=()=>G.season*38+G.week;

/* The assistant's read. Every screen arrives already answered. */
function suggestRoles(){
  const c=me(),out={};if(!c)return out;
  const sq=squadOf(c),rk=rankMap(),avg=xiCA(c);
  sq.forEach(p=>{
    const r=rankAt(rk,p.id);
    if(p.listed)out[p.id]='surp';
    else if(r<5)out[p.id]='key';
    else if(r<12)out[p.id]='rot';
    else if(sq.length>21&&r>=20&&CA(p)<avg-11)out[p.id]='surp';
    else out[p.id]='back';
  });
  return out;
}
/* What he thinks he is. Ambitious men place themselves higher than the ability
   table does, and nobody in the history of the game has ever thought he was
   surplus. That gap is the whole reason this conversation is difficult. */
function selfRole(p,rank){
  const r=Math.max(0,rank-Math.round((p.amb-55)/13));
  return r<5?'key':r<12?'rot':'back';
}
function draft(){
  const s=S();
  if(s.roleSeason!==G.season||!Object.keys(s.roles).length){
    const sug=suggestRoles(),c=me();
    if(c)squadOf(c).forEach(p=>{if(!s.roles[p.id])s.roles[p.id]=sug[p.id]||'back'});
  }
  return s.roles;
}

/* ---------- saying it out loud ---------- */
function tellThem(){
  const s=S(),c=me();if(!c)return;
  const d=draft(),rk=rankMap(),mo=SW.get('morale');
  const sq=squadOf(c);
  const n={key:0,rot:0,back:0,surp:0};
  sq.forEach(p=>{n[d[p.id]||'back']++});
  /* tell nine men they are key and the word is worth nothing by October */
  const glut=n.key>6?clamp((n.key-6)*0.13,0,0.55):0;
  let wronged=0;

  sq.forEach(p=>{
    const r=d[p.id]||'back', prev=s.told[p.id];
    /* changing your mind mid-season closes the old promise first */
    if(prev&&prev.role!==r&&prev.season===G.season){
      const down=ROLES[r].ord<ROLES[prev.role].ord;
      const short=shareOf(p.id)<ROLES[prev.role].share*0.75;
      settle(p.id,!(down&&short),
        (down&&short)?('told him he was a '+ROLES[prev.role].t.toLowerCase()+', then took it off him'):null,'role');
    }
    if(prev&&prev.role===r&&prev.season===G.season)return;   // nothing new said

    const rank=rankAt(rk,p.id);
    const self=selfRole(p,rank);
    const gap=ROLES[r].ord-ROLES[self].ord;
    const soft=clamp(1.30-(p.prof-45)*0.008,0.60,1.30);      // pros take news better
    const drive=clamp(0.75+(p.amb-55)*0.009,0.60,1.35);
    const over=(r==='key'&&rank>=10)||(r==='rot'&&rank>=17);
    const hurt=(r==='surp'&&rank<10);
    let m=0,t=0,why='';

    if(hurt){
      m=-(30+rnd()*12); t=-10; why='told him he was finished here when he plainly is not';
      p.listed=true; wronged++;
      sq.forEach(x=>{if(x.id!==p.id)
        moveTrust(x.id,-4*(caresOf(x)==='backed'?1.7:1),'told '+surn(p)+' he was finished, and he is not')});
    } else if(gap>0){
      m=(10+gap*8)*drive; t=5+(over?3:0);
      why='told him he was more than he thought he was';
    } else if(gap===0){
      m=5+(caresOf(p)==='truth'?4:0);
      t=(caresOf(p)==='truth'?9:5);
      why='told him straight where he stood, in '+monthAt(G.week);
    } else if(gap===-1){
      m=-(10+rnd()*5)*soft*drive; t=(p.prof>=70?0:-3);
      why='told him less than he wanted to hear';
    } else {
      m=-(22+rnd()*8)*soft*drive; t=-6;
      why='told him he was a long way down the list';
    }
    if(r==='key'&&glut){t-=Math.round(glut*9);m*=(1-glut*0.5)}

    s.told[p.id]={role:r,week:G.week,season:G.season,over:over?1:0,wronged:hurt?1:0};
    s.seen[p.id]=G.week;
    if(r!=='surp')promise(p.id,'he was a '+ROLES[r].t.toLowerCase()+' here',37-G.week,'role');
    moveTrust(p.id,t,why);
    if(mo&&mo.adjust)try{mo.adjust(p.id,m,'Told in '+monthAt(G.week)+' he was '+
      (r==='key'?'a key player':r==='rot'?'in and out':r==='back'?'a backup':'surplus'))}catch(e){}
  });

  s.roleSeason=G.season; s.proactive++;
  if(glut)note('You have told half of them they are key',
    n.key+' men walked out of your office believing they start every week. Eleven of them can. '+
    'The other '+(n.key-11>0?n.key-11:'few')+' will work that out by October and so will everyone else.',{from:vV('staff')});
  if(wronged)note('That will be in the papers by Friday',
    'You have told a player who is plainly good enough that he is not part of it. '+
    'He is entitled to be angry and the room knows he is entitled to be angry.',{from:vV('press')});
  note('They know where they stand',
    n.key+' key, '+n.rot+' rotation, '+n.back+' backup'+(n.surp?', '+n.surp+' told to find a club':'')+
    '. You said it in '+monthAt(G.week)+'. What matters now is whether the teamsheet agrees with you.',{from:vV('staff')});
}

/* ---------- the teamsheet catches up with what you said ---------- */
function finishRole(x,p,ok){
  const s=S();
  x.state=ok?'kept':'broken';
  if(!s.tally||s.tally.s!==G.season)s.tally={s:G.season,kept:0,broke:0,names:[]};
  if(ok)s.tally.kept++;
  else{s.tally.broke++;
    const t0=s.told[p.id];
    const nm=surn(p);
    if((!t0||t0.role!=='back')&&s.tally.names.length<4&&s.tally.names.indexOf(nm)<0)s.tally.names.push(nm)}
  const t=s.told[p.id],lbl=t?ROLES[t.role].t.toLowerCase():'in the plans';
  moveTrust(p.id,ok?10:-19,ok?('made him the '+lbl+' he said he would be')
    :('told him he was a '+lbl+' and then never picked him'));
  if(!ok){
    bumpBreachOne(p.id);
    const mo=SW.get('morale');
    if(mo&&mo.adjust)try{mo.adjust(p.id,-15,'Told he was a '+lbl+'. The teamsheet said otherwise.')}catch(e){}
  }
}
function roleDue(force){
  const s=S(),c=me();if(!c)return {kept:0,broke:0,names:[]};
  const out={kept:0,broke:0,names:[]};
  s.promises.filter(x=>x.tag==='role'&&x.state==='open'&&(force||G.week>=x.due)).forEach(x=>{
    const p=c.squad.find(y=>y.id===x.pid);
    if(!p){x.state='forgotten';return}
    const t=s.told[p.id];
    const need=ROLES[(t&&t.role)||'back'].share*0.70;
    const ok=s.gm>=6?shareOf(p.id)>=need:true;
    finishRole(x,p,ok);
    if(ok)out.kept++;else{out.broke++;if(!t||t.role!=='back')out.names.push(surn(p))}
  });
  return out;
}

/* ---------- the standing correction ----------------------------------
   This is the mechanic the coach actually asked for. A man who was told in
   July that he is a backup, and is being used as a backup, has nothing to
   be aggrieved about and his mood should say so. A man who was told he was
   key and is watching should be angrier than the raw minutes justify. It is
   applied through morale.adjust so morale keeps owning morale — small,
   every week, and self-limiting, because morale pulls back to its own
   target and the two settle against each other.
   -------------------------------------------------------------------- */
function standingCorrection(){
  const s=S(),c=me(),mo=SW.get('morale');
  if(!c||!mo||!mo.adjust||s.gm<4)return;
  squadOf(c).forEach(p=>{
    const t=s.told[p.id],share=shareOf(p.id);
    if(!t){
      /* nobody ever told him anything, so he has decided for himself */
      if(share<0.3)try{mo.adjust(p.id,-1.0,null)}catch(e){}
      return;
    }
    const want=ROLES[t.role].share;
    let d;
    if(t.role==='surp')      d=share>0.10?1.4:-0.5;
    else if(share>=want-0.05)d=1.7;
    else                     d=clamp((share-want)*9,-2.4,0);
    if(t.over&&d<0)d*=1.35;                       // you knew you could not keep it
    try{mo.adjust(p.id,d,null)}catch(e){}
  });
}

/* ============================================================
   THE ARBITRATION
   ============================================================ */
function justification(p){
  const s=S(),c=me();if(!c)return {j:0.3,why:[]};
  const rk=rankMap(),rank=rankAt(rk,p.id);
  const share=shareOf(p.id),starts=s.st[p.id]||0;
  let j=0.30;const why=[];

  /* 1. is he good enough to be playing, given who is in front of him? */
  const ahead=(c.xi||[]).filter(x=>x.slot===p.pos);
  const bar=ahead.length?Math.min.apply(null,ahead.map(x=>CA(x.p,x.slot))):xiCA(c);
  const edge=CA(p)-bar;
  if(edge>=4){j+=0.30;why.push('he is better than the man in front of him and everybody can see it')}
  else if(edge>=-3){j+=0.10;why.push('there is nothing between him and the man playing')}
  else{j-=0.26;why.push('he is nowhere near the men ahead of him')}

  /* 2. was he told? */
  const t=s.told[p.id];
  if(!t){j+=0.22;why.push('nobody ever told him where he stood')}
  else if(t.wronged){j+=0.34;why.push('you told him he was finished and he was not')}
  else{
    const want=ROLES[t.role].share,gap=share-want;
    if(t.role==='surp')                {j-=0.10;why.push('he was told in '+monthAt(t.week)+' to find a club')}
    else if(gap>=-0.06)                {j-=0.36;why.push('he was told in '+monthAt(t.week)+' he was a '+ROLES[t.role].t.toLowerCase()+', and that is exactly what he has been')}
    else if(gap<=-0.26)                {j+=0.30;why.push('you told him he was a '+ROLES[t.role].t.toLowerCase()+' and he has started '+starts+' of '+s.gm)}
    else                               {j-=0.08;why.push('he is a little short of what he was told, not much')}
  }

  /* 3. have you kept your word to him? */
  const pr=s.promises.filter(x=>x.pid===p.id);
  const bad=pr.filter(x=>x.state==='broken'||x.state==='forgotten').length;
  const good=pr.filter(x=>x.state==='kept').length;
  if(bad){j+=Math.min(bad*0.16,0.32);why.push('you have gone back on your word to him '+bad+' time'+(bad>1?'s':''))}
  if(good)j-=Math.min(good*0.08,0.16);

  return {j:clamp(j,0,1),why,rank,edge,starts};
}
/* How much policing this room can actually do. Culture, the senior pros who
   are playing, whether the standards have ever been held, and whether you
   have been caught having two of them. */
function policing(){
  const s=S(),c=me(),mo=SW.get('morale');
  if(!c)return 0;
  let lead=0;
  if(mo&&mo.isLeader)try{lead=squadOf(c).filter(p=>mo.isLeader(p.id)).length}catch(e){}
  let held=0,tested=0;
  s.standards.forEach(k=>{const h=s.precedent['std_'+k]||[];tested+=h.length;held+=h.filter(x=>x.up).length});
  const disc=tested?held/tested:0.45;
  const base=clamp((cultureScore()+15)/80,0,1)*0.50
    +(lead>=2?0.28:lead?0.18:0.02)
    +disc*0.22;
  return clamp(base*clamp(1-s.hypo*0.11,0.35,1),0,1);
}
function standWord(v){
  return v>=25?'They rate him in there'
    :v>=-10?'Nothing said about him either way'
    :v>=-35?'They have him down as a moaner'
    :'They have stopped listening to him';
}
function logGrief(head,txt,col){
  const s=S();
  s.grief.unshift({w:G.week,s:G.season,head,txt,col});
  if(s.grief.length>8)s.grief.length=8;
}

/* the one that reaches your desk */
EVOPTS.grievance=function(p,a){
  const up=a.up||'rot';
  return [
    {t:'Admit you got it wrong',
     d:'Move him up to '+ROLES[up].t.toLowerCase()+'. Now you have to pick him.',
     fn:()=>{
       const s=S(),c=me(),mo=SW.get('morale');
       settle(p.id,false,'he was right, and you had told him otherwise','role');
       s.roles[p.id]=up;
       s.told[p.id]={role:up,week:G.week,season:G.season,over:0,wronged:0};
       promise(p.id,'he would be a '+ROLES[up].t.toLowerCase()+' from here',10,'role');
       moveTrust(p.id,14,'admitted he had been wrong about him');
       squadOf(c).forEach(x=>{if(x.id!==p.id)moveTrust(x.id,5,'listened when the senior men came to him')});
       if(mo&&mo.adjust)try{mo.adjust(p.id,26,'The manager admitted he had got it wrong');
         squadOf(c).forEach(x=>{if(x.id!==p.id)mo.adjust(x.id,4,'the manager listened')})}catch(e){}
       s.proactive++;
       logGrief('You moved '+surn(p)+' up',
         'The senior men came to you about him and you did not argue. Now the teamsheet has to say the same thing.','var(--win)');
       note('You said you had got it wrong',
         'No player has ever thought less of a manager for that. Plenty have thought less of the ones who could not.',{from:vV('staff'),about:vP(p)});
     }},
    {t:'Hold the line',
     d:'Tell them your reasons and stand on them.',
     fn:()=>{
       const s=S(),c=me();
       const ok=rnd()<clamp(transmission()*0.55+0.12,0.1,0.85);
       squadOf(c).forEach(x=>moveTrust(x.id,ok?2:-6,
         ok?'stood on his reasons and they held':'would not hear it when they came to him'));
       if(!ok)bumpBreach();
       s.reactive++;
       logGrief(ok?'You held the line on '+surn(p):'They did not buy it',
         ok?'You gave them your reasons. The captain carried them back in and that was that.'
           :'You gave them your reasons and they did not land. Now they think you will not be told.',
         ok?'var(--acc)':'var(--loss)');
       note(ok?'They took your reasons':'They did not take it',
         ok?'The captain took it back in there for you. It held.'
           :'You had an answer for everything. They went back in with none of it.',{from:vV('staff'),about:vP(p)});
     }},
    {t:'Tell them it is not their business',
     d:'You pick the team. Nobody else.',
     fn:()=>{
       const s=S(),c=me();
       squadOf(c).forEach(x=>moveTrust(x.id,-9*(caresOf(x)==='respect'?1.4:1),
         'shut the senior men down when they came to him'));
       bumpBreach(); s.reactive++;
       logGrief('You shut them down',
         'They will not come to you again. That is not the same as the problem going away.','var(--loss)');
       note('They will not come to you again',
         'You were right that you pick the team. You were wrong that it was the point.',{from:vV('staff'),about:vP(p)});
     }}
  ];
};

function arbitrate(){
  const s=S(),c=me(),mo=SW.get('morale');
  if(!c||!mo||!mo.unhappy||s.pending)return;
  if(G.week<6||s.gm<4)return;
  if(absWeek()-s.lastArb<6)return;

  let list=[];try{list=mo.unhappy()||[]}catch(e){return}
  const cand=list.filter(p=>{
    if(p.youth)return false;
    const seen=s.griefSeen[p.id];
    if(seen!==undefined&&absWeek()-seen<12)return false;
    /* a man the room has already refused to back does not get a second hearing.
       They have stopped listening to him, which is the whole point of standing —
       his misery is now his own problem and nobody else's. */
    if((s.standing[p.id]||0)<=-20)return false;
    /* only playing-time grievances. Wages and contracts belong to their own men. */
    let why='';try{why=mo.reasonFor(p.id)||''}catch(e){}
    return /start|bench|watching|minutes/i.test(why);
  });
  if(!cand.length)return;

  const p=cand[0];
  s.griefSeen[p.id]=absWeek(); s.lastArb=absWeek();
  const {j,why}=justification(p);
  const pol=policing();
  const sq=squadOf(c);
  const cap=c.squad.find(x=>x.id===s.captain);
  const capName=cap&&cap.id!==p.id?surn(cap):'The senior lads';
  const head=why[0]||'he is unhappy';
  const stand=v=>{s.standing[p.id]=clamp(Math.round((s.standing[p.id]||0)+v),-100,100)};

  /* ---- he has a point ---- */
  if(j>=0.55){
    const strong=pol>=0.50;
    sq.forEach(x=>{
      if(x.id===p.id)return;
      const w=caresOf(x)==='backed'?1.5:caresOf(x)==='truth'?1.3:1;
      moveTrust(x.id,-(strong?4:7)*w,'they think '+surn(p)+' has been hard done by');
      try{mo.adjust(x.id,-(strong?3:5)*w,'the room thinks '+surn(p)+' has a point')}catch(e){}
    });
    stand(10);
    if(strong){
      const up=(justification(p).edge>=4)?'key':'rot';
      s.pending={id:'grievance',pid:p.id,key:'grievance',a:{up},
        title:'The senior men have come to you about '+surn(p),
        body:capName+' has been in with two of the older ones about '+surn(p)+'. '+
          'They are not asking you to pick him. They are asking you to look at it again, because '+head+'.',
        opts:EVOPTS.grievance(p,{up})};
      logGrief('The room backed '+surn(p),'They think he has a case — '+head+'. They brought it to your door rather than let it sit.','var(--inj)');
    } else {
      logGrief('The room backed '+surn(p),
        'They think he has a case — '+head+'. Nobody brought it to you. They just stopped giving you the benefit of the doubt.','var(--loss)');
      note('You found out from the papers',
        surn(p)+' has a point and the whole room knows it. Nobody came to your door about it, because there is nobody in there who would.',{from:vV('press'),about:vP(p)});
    }
    return;
  }

  /* ---- he has no point ---- */
  if(pol>=0.55){
    const hard=(p.trait==='Mercenary'||p.trait==='Hot-headed');
    sq.forEach(x=>{
      if(x.id===p.id)return;
      moveTrust(x.id,3+rnd()*2,'the standard held in there without you having to say a word');
      try{mo.adjust(x.id,2+rnd()*2,'the room closed ranks')}catch(e){}
    });
    try{mo.adjust(p.id,hard?3:(9+rnd()*6),hard?'was told, and did not take it'
      :'the senior players had a word with him')}catch(e){}
    stand(hard?-32:-24);
    logGrief('The room did not back '+surn(p),
      'He had plenty to say about his minutes and nobody in there wanted to hear it. '+
      (hard?'He has not taken it, but he is on his own with it.':'It was dealt with before it reached you.'),'var(--win)');
    note('They sorted it themselves',
      surn(p)+' had a lot to say about not playing. '+capName+' told him what the rest of them were already thinking '+
      'and that was the end of it. You did not spend a thing, and that is what the standards are for.',{from:vV('staff'),about:vP(p)});
    chron('The squad closed ranks over '+surn(p));
    return;
  }
  if(pol<=0.32){
    const weak=sq.filter(x=>x.id!==p.id&&trustOf(x.id)<12);
    weak.forEach(x=>{
      try{mo.adjust(x.id,-(2+rnd()*3),'nobody told '+surn(p)+' he was out of order')}catch(e){}
      moveTrust(x.id,-2,'');
    });
    stand(-6);
    const spread=s.grief.filter(g=>g.s===G.season&&g.head==='It spread').length;
    logGrief('It spread',surn(p)+' had no case and it made no difference. There is nothing in that room to tell him so.','var(--loss)');
    /* say it once, say it twice, then stop writing the same letter every month —
       by the third time it is not news, it is just what this club is like now. */
    if(spread<2)note('Nobody told him he was out of order',
      'Because there is nobody in there who would. '+weak.length+' of them have started saying the same thing, '+
      'and most of them have even less of a case than he has.',{from:vV('staff'),about:vP(p)});
    else if(spread===2)note('This is just what it is like in there now',
      'Another one with nothing to complain about, complaining. Nobody corrects anybody. '+
      'You are the only person at this club who tells anyone anything.',{from:vV('staff'),about:vP(p)});
    return;
  }
  stand(-10);
  logGrief('One or two said something',
    'A couple of the older ones had a word with '+surn(p)+'. It did not really take.','var(--acc)');
  note('It half got dealt with',
    'A couple of them had a word with '+surn(p)+'. There is not enough in that room yet for it to stick, '+
    'so it is still your problem — just a smaller one.',{from:vV('staff'),about:vP(p)});
}

/* ============================================================
   THE ROLES SCREEN — a sheet, because the Squad tab cannot carry
   another chip and this is a July job, not a weekly one.
   ============================================================ */
function roleChip(r,small){
  const d=ROLES[r]||ROLES.back;
  return `<span class="pill" style="background:var(--s3);color:${d.col};font-size:${small?10:11}px">${d.s}</span>`;
}
function rolesSheet(){
  const s=S(),c=me();if(!c)return;
  const d=draft(),rk=rankMap();
  const sq=squadOf(c).slice().sort((a,b)=>rankAt(rk,a.id)-rankAt(rk,b.id));
  const n={key:0,rot:0,back:0,surp:0};sq.forEach(p=>n[d[p.id]||'back']++);
  const warn=[];
  if(n.key>6)warn.push('You have told '+n.key+' men they are key. Eleven start, and the same eleven. That word is already worth less.');
  const overreach=sq.filter(p=>d[p.id]==='key'&&rankAt(rk,p.id)>=10);
  if(overreach.length)warn.push(surn(overreach[0])+' is your '+ord(rankAt(rk,overreach[0].id)+1)+
    ' best player. Calling him key is a promise the teamsheet will break for you.');
  const wronged=sq.filter(p=>d[p.id]==='surp'&&rankAt(rk,p.id)<10);
  if(wronged.length)warn.push(surn(wronged[0])+' is in your best ten and you are telling him to find a club. '+
    'He will agitate, and he will be right to.');

  const row=p=>{
    const r=d[p.id]||'back',open=s.roleOpen===p.id;
    return `<div class="plr" style="align-items:center" onclick="cultRoleOpen(${p.id})">
      ${pface(p,40)}
      <div class="pos">${p.pos}</div>
      <div class="nmw"><div class="nm2">${esc(p.name)}</div>
        <div class="meta"><span>${p.age}</span><span>${ord(rankAt(rk,p.id)+1)} best</span>
        <span style="color:var(--t3)">${esc(CARES[caresOf(p)].t)}</span></div></div>
      ${roleChip(r)}</div>
     ${open?`<div class="chips" style="display:flex;flex-wrap:wrap;gap:6px;padding:2px 0 12px">
      ${RKEYS.map(k=>`<button class="btn ${k===r?'':'ghost'} xs" style="min-height:44px;flex:1 1 44%"
        onclick="cultRoleSet(${p.id},'${k}')">${ROLES[k].t}</button>`).join('')}
      <div class="dim" style="font-size:12px;flex:1 1 100%">${esc(ROLES[r].d)}</div></div>`:''}`;
  };

  sheet(`<h3>Where they stand</h3>
   <div class="sh-sub">Tell every man what he is now, in ${esc(monthAt(G.week))}, and he has no argument in November.
     Get it wrong and you have said something you cannot take back.</div>
   <div class="card" style="background:var(--s1);margin-bottom:10px">
     <div class="row" style="gap:10px;flex-wrap:wrap">
       ${RKEYS.map(k=>`<div><div class="dim" style="font-size:10px;text-transform:uppercase;letter-spacing:.05em">${ROLES[k].s}</div>
         <div style="font-weight:800;font-size:17px;color:${ROLES[k].col}">${n[k]}</div></div>`).join('')}
       <span class="spacer"></span>
       <button class="btn ghost xs" onclick="cultRoleAuto()">Assistant's call</button></div>
     ${warn.map(w=>`<div style="font-size:12px;color:var(--inj);line-height:17px;margin-top:8px">${esc(w)}</div>`).join('')}</div>
   <div class="card" style="padding:6px 14px 12px;max-height:46vh;overflow:auto">${sq.map(row).join('')}</div>
   <button class="btn" style="margin-top:10px" onclick="cultRoleDone()">This is where they stand</button>
   <button class="btn ghost" style="margin-top:8px" onclick="closeSheet();render()">Not yet</button>`);
}
window.cultRoles=function(){S().roleOpen=0;rolesSheet()};
window.cultRoleOpen=function(pid){const s=S();s.roleOpen=(s.roleOpen===pid?0:pid);rolesSheet()};
window.cultRoleSet=function(pid,r){const s=S();s.roles[pid]=r;s.roleOpen=0;rolesSheet()};
window.cultRoleAuto=function(){const s=S();s.roles=suggestRoles();s.roleOpen=0;rolesSheet()};
window.cultRoleDone=function(){tellThem();closeSheet();save();render()};

/* ---------- the blocks that go in the Culture view ---------- */
function rolesBlock(){
  const s=S(),c=me();if(!c)return '';
  const sq=squadOf(c),told=sq.filter(p=>s.told[p.id]);
  if(!told.length)return `<div class="sechead">Where they stand</div>
   <div class="card" style="border-color:var(--loss)">
    <div style="font-weight:700;font-size:15px">Nobody has been told where they stand.</div>
    <div style="font-size:13px;color:var(--t2);line-height:19px;margin-top:5px">
      So every one of them has decided for himself, and every one of them has decided he should be playing.
      When they start complaining in November the room will assume they have a point, because nobody
      ever told them otherwise.</div>
    <button class="btn" style="margin-top:11px" onclick="cultRoles()">Tell them where they stand</button></div>`;

  const n={key:0,rot:0,back:0,surp:0};told.forEach(p=>n[s.told[p.id].role]++);
  const gaps=told.filter(p=>s.told[p.id].role!=='surp').map(p=>{
    const t=s.told[p.id];
    return {p,t,gap:shareOf(p.id)-ROLES[t.role].share};
  }).sort((a,b)=>a.gap-b.gap);
  const bad=gaps.filter(x=>x.gap<=-0.18).slice(0,3);
  const good=gaps.filter(x=>x.gap>=-0.05).slice(-1);
  const line=x=>`<div class="kv"><span class="k2">${esc(surn(x.p))} — told ${ROLES[x.t.role].s.toLowerCase()} in ${esc(monthAt(x.t.week))}</span>
    <span class="v2" style="font-size:12px;color:${x.gap<=-0.18?'var(--loss)':'var(--win)'}">${s.st[x.p.id]||0} of ${s.gm}</span></div>`;
  return `<div class="sechead">Where they stand<span class="n">said in ${esc(monthAt(told[0]?s.told[told[0].id].week:0))}</span></div>
   <div class="card">
    <div class="row" style="gap:12px;flex-wrap:wrap">
      ${RKEYS.map(k=>`<div><div class="dim" style="font-size:10px;text-transform:uppercase;letter-spacing:.05em">${ROLES[k].s}</div>
        <div style="font-weight:800;font-size:17px;color:${ROLES[k].col}">${n[k]}</div></div>`).join('')}
      <span class="spacer"></span>
      <button class="btn ghost xs" onclick="cultRoles()">Say it again</button></div>
    ${bad.length||good.length?`<div style="border-top:1px solid var(--hair);margin-top:10px;padding-top:6px">
      ${bad.map(line).join('')}${good.map(line).join('')}</div>`:''}
    ${bad.length?`<div style="font-size:12px;color:var(--t3);line-height:17px;margin-top:6px">
      Every one of those is a promise with your name on it. They get judged in May.</div>`:''}</div>`;
}
function griefBlock(){
  const s=S();if(!s.grief.length)return '';
  return `<div class="sechead">What the room did</div>
   <div class="card">${s.grief.slice(0,4).map(g=>`<div style="padding:8px 0;border-top:1px solid var(--hair)">
     <div style="font-size:13px;font-weight:700;color:${g.col}">${esc(g.head)}</div>
     <div style="font-size:12px;color:var(--t2);line-height:17px;margin-top:3px">${esc(g.txt)}</div></div>`).join('')}</div>`;
}

/* ---------- registration ---------- */
SW.register({
  id:'culture',
  init(){const s=SW.state('culture');for(const k in DEF)delete s[k];S();},
  onWeek(){ sweepPromises(); roleDue(false); standingCorrection(); arbitrate(); nextEvent(); },
  onMatchEnd(m){
    const s=S(),r=lastResult();
    if(!r)return;
    const c=me();
    /* starts are tracked here rather than asked of morale, so the roles model
       still works with morale absent — and so the two never disagree about
       what a "start" is. */
    if(!m||m.hi===G.me||m.ai===G.me){
      s.gm++;
      (c.xi||[]).forEach(({p})=>{s.st[p.id]=(s.st[p.id]||0)+1});
    }
    /* Keeping your word is only worth something when it cost you. */
    c.xi.forEach(({p})=>{
      const i=s.promises.findIndex(x=>x.pid===p.id&&x.state==='open'&&!x.tag&&/start|look in/.test(x.what));
      if(i>=0)settle(p.id,true,null);
    });
    if(r.lost&&rnd()<0.25)squadOf(c).forEach(p=>moveTrust(p.id,-1,''));
  },
  /* May: every role you handed out in July gets read back to you. */
  onSeasonEndBefore(){
    const s=S();if(!s.set)return;
    roleDue(true);
    const r=(s.tally&&s.tally.s===G.season)?s.tally:null;
    if(r&&r.kept+r.broke>=4)note('What your word was worth this season',
      r.kept+' of the '+(r.kept+r.broke)+' men you gave a role to got what you told them they would. '+
      (r.broke?('The other '+r.broke+' did not'+(r.names.length?', and '+r.names.slice(0,2).join(' and ')+' will not forget it':'')+'.')
             :'Nobody in that room can say you told them one thing and did another.',{from:vV('staff')}));
  },
  onSeasonEndAfter(){
    const s=S(); s.nextEv=2;
    s.st={}; s.gm=0; s.told={}; s.roles={}; s.roleSeason=-1; s.roleOpen=0;
    /* the room remembers who moans, but it fades over a summer */
    Object.keys(s.standing).forEach(k=>{s.standing[k]=Math.round(s.standing[k]*0.55);
      if(!s.standing[k])delete s.standing[k]});
    s.griefSeen={};
  },
  hubCards(){
    const s=S(),out=[];
    if(!s.set)out.push({ic:'◆',bg:'var(--accw)',col:'var(--acc)',priority:85,
      a:'Set your standards',b:'Three non-negotiables, before a ball is kicked',
      fn:"G.tab='squad';G.squadView='culture';render()"});
    if(s.pending)out.push({ic:s.pending.id==='grievance'?'⚑':'❝',
      bg:s.pending.id==='grievance'?'#3A1C12':'#2A1C40',
      col:s.pending.id==='grievance'?'var(--inj)':'var(--loan)',
      priority:s.pending.id==='grievance'?66:64,
      a:s.pending.title,
      b:s.pending.id==='grievance'?'The senior men think you have got one wrong':'They are waiting to see what you do',
      fn:'cultOpen()'});
    /* July, and again in January. Not a weekly nag. */
    if(s.set&&s.roleSeason!==G.season&&(G.week<=3||(G.week>=19&&G.week<=21)))
      out.push({ic:'≡',bg:'var(--accw)',col:'var(--acc)',priority:76,
        a:G.week<=3?'Tell them where they stand':'Tell them again where they stand',
        b:'Key, rotation, backup, surplus — before they decide for themselves',
        fn:'cultRoles()'});
    return out;
  },
  squadViews(){ return [{key:'culture',label:'Culture',render:cultureView}] },
  playerBlocks(p,club){
    if(!club||club.id!==G.me)return [];
    const s=S();if(!s.set)return [];
    const t=trustOf(p.id),care=CARES[caresOf(p)],f=fuseOf(p);
    const br=s.breaches[p.id]||0;
    const told=s.told[p.id], st=s.standing[p.id]||0;
    let roleLine='';
    if(told){
      const need=ROLES[told.role].share, got=shareOf(p.id);
      const short=told.role!=='surp'&&s.gm>=5&&got<need*0.70;
      roleLine=`<div style="font-size:13px;margin-top:7px;color:${short?'var(--loss)':'var(--t2)'}">
        Told in ${esc(monthAt(told.week))} he was ${esc(told.role==='key'?'a key player':told.role==='rot'?'in and out'
          :told.role==='back'?'a backup':'surplus to requirements')}. ${s.gm?('He has started '+(s.st[p.id]||0)+' of '+s.gm+'.'):''}
        ${short?' You have not kept that.':''}</div>`;
    } else if(s.set){
      roleLine=`<div style="font-size:13px;margin-top:7px;color:var(--inj)">He has never been told where he stands.</div>`;
    }
    const stLine=Math.abs(st)>=10?`<div style="font-size:12px;color:${st>=0?'var(--t3)':'var(--inj)'};margin-top:6px">
      ${esc(standWord(st))}.</div>`:'';
    return [`<div class="card" style="margin-top:10px;background:var(--s1)">
      <div class="row"><span class="dim" style="font-size:10px;letter-spacing:.06em;
        text-transform:uppercase">What he makes of you</span><span class="spacer"></span>${trustDots(t)}</div>
      <div style="font-size:13px;color:var(--t2);margin-top:7px">${esc(care.w)}</div>
      ${roleLine}${stLine}
      ${br>0?`<div style="font-size:12px;color:${br>=f?'var(--loss)':'var(--inj)'};margin-top:6px">
        ${br>=f?'He has stopped giving you the benefit of the doubt.'
              :'He has let '+br+' thing'+(br>1?'s':'')+' go so far.'}</div>`:''}</div>`];
  },
  /* Culture never makes a team better. It stops them folding, and only in the
     moments a coach would actually name. */
  matchMoment(St,side,minute,def,lead){
    if(!MT||!MT.S||MT.S!==St)return null;
    const s=S();if(!s.set)return null;
    const mine=side===MT.mine;
    let v,tr;
    if(mine){
      v=cultureScore()/100; tr=transmission();
    } else {
      /* The opposition has a dressing room too. Without this the human is the
         only club in the world that can come from behind, which breaks the
         promise that the engine never favours anyone. Derived from what an AI
         club actually is — settled clubs with senior pros hold together. */
      const o=G.clubs[MT.f&&(side===0?MT.f.home:MT.f.away)];
      if(!o)return null;
      const form=(o.form||[]).reduce((a,r)=>a+(r==='W'?1:r==='L'?-1:0),0);
      const seniors=squadOf(o).filter(p=>p.age>=28&&p.prof>=60).length;
      v=clamp((o.rep-58)/70+form*0.05+(seniors-3)*0.03,-0.6,0.6);
      tr=0.8;
    }
    if(Math.abs(v)<0.08)return null;
    const c=mine?me():G.clubs[side===0?MT.f.home:MT.f.away];
    const missing=squadOf(c).filter(p=>p.out>0&&(mine?stature(p)===2:CA(p)>60)).length;
    let m=0;
    if(def>0&&minute>=60)      m+=v*0.16;            // chasing it late
    else if(lead>0&&minute>=70)m+=v*0.11;            // seeing it out
    if(missing>=2)             m+=v*0.09;            // coping without your best
    if(MT.f&&MT.f.comp&&MT.f.comp.key!=='league') m+=v*0.07;   // the big occasion
    if(!m)return null;
    return 1+clamp(m*tr,-0.20,0.20);
  },
  /* published interface */
  role(pid){const t=S().told[pid];return t?t.role:null},
  roleLabel(pid){const t=S().told[pid];return t?ROLES[t.role].t:null},
  setRoles(){cultRoles()},
  standing(pid){return S().standing[pid]||0},
  /* 0..1 — how much of a case an unhappy player actually has, and why */
  grievance(pid){const c=me(),p=c&&c.squad.find(x=>x.id===Number(pid));
    return p?justification(p):null},
  policing(){return policing()},
  trust(id){return trustOf(id)},
  culture(){return cultureScore()},
  captain(){return S().captain},
  promise(pid,what,weeks){promise(pid,what,weeks)},
  identity(){return identity()}
});
})();
