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
  identity:[], log:[], proactive:0, reactive:0, pending:null, nextEv:4, hypo:0
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
    `Nobody said anything. They did not have to.`);
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
function promise(pid,what,weeks){
  const s=S();
  s.promises.unshift({pid,what,due:G.week+(weeks||6),season:G.season,state:'open'});
  if(s.promises.length>30)s.promises.length=30;
}
function settle(pid,kept,what){
  const s=S();
  const i=s.promises.findIndex(x=>x.pid===pid&&x.state==='open');
  if(i<0)return;
  s.promises[i].state=kept?'kept':'broken';
  const c=me(),p=c.squad.find(x=>x.id===pid);
  if(!p)return;
  moveTrust(pid,kept?9:-18,kept?'you did what you said you would':'you said one thing and did another');
  if(!kept)bumpBreachOne(pid);
}
function bumpBreachOne(pid){
  const s=S();s.breaches[pid]=(s.breaches[pid]||0)+1;
}
/* A promise nobody ever resolves is its own category — and it is the one that
   quietly rots a dressing room. */
function sweepPromises(){
  const s=S(),c=me();
  s.promises.filter(x=>x.state==='open'&&G.week>x.due).forEach(x=>{
    x.state='forgotten';
    const p=c.squad.find(y=>y.id===x.pid);
    moveTrust(x.pid,-11,'you never came back to him about '+x.what);
    if(p&&stature(p)>=1&&rnd()<0.5)
      note('He is still waiting',`You told ${esc(p.name)} ${esc(x.what)}. That was a while ago now.`);
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
function evProtect(){
  const p=pickTarget(rnd()<0.6?'star':null);if(!p)return null;
  const src=pick(['press','board','fans']);
  const line={
    press:`The back pages have gone after ${p.name}. One of them called him "the most expensive mistake at the club".`,
    board:`The chairman raised ${p.name} in a meeting. He wants him gone in January and he wants you to say so publicly.`,
    fans:`${p.name} was booed by his own supporters when his number went up.`
  }[src];
  return {
    id:'protect', pid:p.id, key:'protect',
    title:'They have come for '+p.name.split(' ').pop(),
    body:line,
    opts:[
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
         note('You took it for him','You said it was on you. He will not forget that, and neither will the rest of them.');
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
         note('You left him out there','You did not have to say much. You said nothing, and that was the answer.');
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
         note('You agreed with them','Twenty-four other players read that quote this morning.');
       }}
    ]};
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
    id:'standard', pid:p.id, key:'std_'+st,
    title:'"'+def.t+'"',
    body:body+(isStar?' He is also the best player you have, and you play on Saturday.':''),
    opts:[
      {t:'Apply it. No exceptions.',
       d:isStar?'He sits out. You are weaker for it, and everybody knows why.':'He sits out.',
       fn:()=>{
         filePrecedent('std_'+st,true,p);
         hypocrisyCheck('std_'+st,true,p);
         const c=me();
         squadOf(c).forEach(x=>moveTrust(x.id,x.id===p.id?-6:(isStar?11:5),'held the standard, even with '+sn));
         if(isStar){p.cond=Math.min(100,p.cond+6);p.out=Math.max(p.out,0)}
         const mo=SW.get('morale');if(mo&&mo.adjust)try{mo.adjust(p.id,-16,'dropped for falling below the standard')}catch(e){}
         note('The standard held','It cost you. That is what made it worth something.');
       }},
      {t:'Let it go this once',
       d:'Have a quiet word. Move on. Nobody needs to know.',
       fn:()=>{
         filePrecedent('std_'+st,false,p);
         hypocrisyCheck('std_'+st,false,p);
         const c=me();
         squadOf(c).forEach(x=>moveTrust(x.id,x.id===p.id?4:-7,'let it slide for '+sn));
         bumpBreach();
         note('You let it go','They all knew about it before you did. Now they know what it is worth.');
       }}
    ]};
}

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
    id:'checkin', pid:p.id, key:'checkin',
    title:'You have not spoken to '+p.name.split(' ').pop()+' since August',
    body:`He has not started a game and he has not been told why. ${care.w}`,
    opts:[
      {t:'Tell him the truth',
       d:'Where he stands, and what would change it.',
       fn:()=>{
         S().seen[p.id]=G.week;S().proactive++;
         const w=caresOf(p)==='truth'?1.9:1;
         moveTrust(p.id,14*w,'told him the truth to his face');
         promise(p.id,'he would get a look in',8);
         const mo=SW.get('morale');if(mo&&mo.adjust)try{mo.adjust(p.id,12,'the manager was straight with him')}catch(e){}
         note('You were straight with him','He did not like it. He respected it.');
       }},
      {t:'Tell him what he wants to hear',
       d:'Keep it sweet. Deal with it later.',
       fn:()=>{
         S().seen[p.id]=G.week;S().reactive++;
         promise(p.id,'he would be starting soon',5);
         moveTrust(p.id,6,'told him what he wanted to hear');
         note('You bought yourself some time','You have three weeks before that comes back.');
       }},
      {t:'Leave it',
       d:'You have a game on Saturday.',
       fn:()=>{
         S().reactive++;
         moveTrust(p.id,-9,'could not find ten minutes for him');
         note('You left it','It is on the list. It has been on the list since August.');
       }}
    ]};
}

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
  const open=s.promises.filter(p=>p.state==='open');
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

   ${ident.length?`<div class="sechead">What this team has become</div>
     <div class="card">${ident.map(l=>`<div style="display:flex;gap:9px;padding:7px 0;font-size:14px;
       line-height:19px;border-top:1px solid var(--hair)">
       <span style="color:var(--acc)">—</span><span>${esc(l)}</span></div>`).join('')}</div>`
    :`<div class="card" style="margin-top:10px"><div style="font-size:13px;color:var(--t2)">
       Nothing to say yet. This fills in as they work out who you are.</div></div>`}

   <div class="sechead">Your word<span class="n">${open.length} open</span></div>
   <div class="card">
   ${s.promises.length?s.promises.slice(0,7).map(pr=>{
     const p=c.squad.find(x=>x.id===pr.pid);
     const col={open:'var(--acc)',kept:'var(--win)',broken:'var(--loss)',forgotten:'var(--t3)'}[pr.state];
     const lbl={open:'OPEN',kept:'KEPT',broken:'BROKEN',forgotten:'FORGOTTEN'}[pr.state];
     return `<div class="kv"><span class="k2">${p?esc(p.name.split(' ').pop()):'—'} — ${esc(pr.what)}</span>
       <span class="v2" style="color:${col};font-size:11px;letter-spacing:.05em">${lbl}</span></div>`}).join('')
    :'<div class="dim" style="font-size:13px">You have not promised anybody anything yet.</div>'}</div>

   <div class="sechead">Where you stand with them</div>
   <div class="card" style="padding:6px 14px 12px">
   ${sq.slice(0,10).map(p=>{
     const t=trustOf(p.id),care=CARES[caresOf(p)];
     return `<div class="plr" onclick="showPlayer(${p.id})">
       ${pface(p,44)}
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
  note('The standards are set','You said them out loud. That is the easy part.');
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
  note(p.name+' is your captain','He speaks for them now, and for you.');
  closeSheet();save();render();
};
window.cultAnswer=function(i){
  const s=S(),ev=s.pending;if(!ev)return;
  const o=ev.opts[i];if(!o)return;
  s.pending=null;
  try{o.fn()}catch(e){console.error('[culture.answer]',e)}
  closeSheet();save();render();
};
function showEvent(){
  const s=S(),ev=s.pending;if(!ev)return;
  sheet(`<h3>${esc(ev.title)}</h3>
   <div class="sh-sub">${esc(ev.body)}</div>
   ${ev.opts.map((o,i)=>`<div class="opt${i===0?' rec':''}" onclick="cultAnswer(${i})">
     <div><div style="font-weight:600">${esc(o.t)}</div>
       <div class="dim" style="font-size:12px">${esc(o.d)}</div></div></div>`).join('')}`);
}
window.cultOpen=showEvent;

/* ---------- registration ---------- */
SW.register({
  id:'culture',
  init(){const s=SW.state('culture');for(const k in DEF)delete s[k];S();},
  onWeek(){ sweepPromises(); nextEvent(); },
  onMatchEnd(){
    const s=S(),r=lastResult();
    if(!r)return;
    /* Keeping your word is only worth something when it cost you. */
    const c=me();
    c.xi.forEach(({p})=>{
      const i=s.promises.findIndex(x=>x.pid===p.id&&x.state==='open'&&/start|look in/.test(x.what));
      if(i>=0)settle(p.id,true,'started him');
    });
    if(r.lost&&rnd()<0.25)squadOf(c).forEach(p=>moveTrust(p.id,-1,''));
  },
  onSeasonEndAfter(){ const s=S(); s.nextEv=2; },
  hubCards(){
    const s=S(),out=[];
    if(!s.set)out.push({ic:'◆',bg:'var(--accw)',col:'var(--acc)',priority:85,
      a:'Set your standards',b:'Three non-negotiables, before a ball is kicked',
      fn:"G.tab='squad';G.squadView='culture';render()"});
    if(s.pending)out.push({ic:'❝',bg:'#2A1C40',col:'var(--loan)',priority:64,
      a:s.pending.title,b:'They are waiting to see what you do',fn:'cultOpen()'});
    return out;
  },
  squadViews(){ return [{key:'culture',label:'Culture',render:cultureView}] },
  playerBlocks(p,club){
    if(!club||club.id!==G.me)return [];
    const s=S();if(!s.set)return [];
    const t=trustOf(p.id),care=CARES[caresOf(p)],f=fuseOf(p);
    const br=s.breaches[p.id]||0;
    return [`<div class="card" style="margin-top:10px;background:var(--s1)">
      <div class="row"><span class="dim" style="font-size:10px;letter-spacing:.06em;
        text-transform:uppercase">What he makes of you</span><span class="spacer"></span>${trustDots(t)}</div>
      <div style="font-size:13px;color:var(--t2);margin-top:7px">${esc(care.w)}</div>
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
  trust(id){return trustOf(id)},
  culture(){return cultureScore()},
  captain(){return S().captain},
  promise(pid,what,weeks){promise(pid,what,weeks)},
  identity(){return identity()}
});
})();
