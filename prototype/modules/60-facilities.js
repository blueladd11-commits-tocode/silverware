/* ============================================================
   SILVERWARE — module: facilities
   Stadium, training ground, academy, medical. Levels 1–5.

   The long game. Everything here costs real money out of the transfer
   budget and takes whole seasons to finish. That is the point: a stand
   or a striker, not both.

   The core already reads us. index.html has facLevel(c,kind,dflt) which
   calls SW.get('facilities').level(kind) — it is wired into develop(),
   rollInjuries() and the season-end youth intake. So we never apply those
   effects ourselves; we would be double-counting. We own two things:
   the levels, and c.capacity.
   ============================================================ */
(function(){
'use strict';

const K    = ['stadium','training','academy','medical'];
const NAME = {stadium:'Stadium',training:'Training ground',academy:'Academy',medical:'Medical'};
const IC   = {stadium:'▤',training:'◎',academy:'★',medical:'✚'};
const COL  = {stadium:'var(--acc)',training:'var(--win)',academy:'var(--loan)',medical:'var(--inj)'};
const BG   = {stadium:'var(--accw)',training:'#12291D',academy:'#241B3A',medical:'#3A1C12'};

/* Cost as a fraction of the club's annual revenue, by target level.
   Hard ceiling to respect: the core resets bal to bal*0.45 + revenue*0.20
   every summer, so a club saving every penny converges on 0.36 * revenue
   and can never hold more. Nothing here may cost more than that or it
   would be unbuildable forever. Top price is 0.26. */
const COST = {stadium :[0,0,.13,.17,.21,.26],
              training:[0,0,.09,.12,.15,.19],
              academy :[0,0,.08,.10,.13,.16],
              medical :[0,0,.07,.09,.11,.14]};

/* Seasons to build, by target level. */
const TIME = {stadium :[0,0,2,2,3,3],
              training:[0,0,1,2,2,3],
              academy :[0,0,2,2,3,3],
              medical :[0,0,1,1,2,2]};

const DESC = {
 stadium:[0,
  'What you inherited. It is the size it is.',
  'One end knocked down and rebuilt properly.',
  'Two tiers on three sides. Away fans notice it.',
  'Corners filled in, boxes down one side. Sponsors want their name on it.',
  'Rebuilt top to bottom. Neutral finals get played here.'],
 training:[0,
  'Two pitches and a portakabin. Lads improve in spite of it, not because of it.',
  'Ordinary. The same as everyone else has.',
  'Indoor barn, gym, and an analyst who knows his job.',
  'Sports science on every session. Nobody wastes a year here.',
  'The best in the country. Players sign for you because of it.'],
 academy:[0,
  'One scout and a minibus. Whoever walks through the door.',
  'Ordinary. A couple of lads every summer.',
  'A regional network. More of them, and better ones.',
  'Residential, with a school attached. You take kids off clubs above you.',
  'A production line. Somebody debuts every single year.'],
 medical:[0,
  'One physio, one ice bath, and a lot of guessing.',
  'Ordinary. The same as everyone else has.',
  'A sports medicine department. Knocks get caught before they tear.',
  'Surgeons on call and load monitored on every player.',
  'Elite. Long injuries happen to other clubs.']
};

/* What the core actually does with the level. Kept beside the core lines
   they mirror so the copy never drifts from the maths.
     develop()      tq    = 0.82 + lvl*0.09
     rollInjuries() hazard= 1.18 - lvl*0.06 ; heal = 1.16 - lvl*0.055
     intake         +1 player at 4+, quality +(lvl-2)*2.5, elite +(lvl-2)*0.012 */
const TQ   = l => 0.82 + l*0.09;
const HAZ  = l => 1.18 - l*0.06;
const HEAL = l => 1.16 - l*0.055;

const MAXCAP = 90000;                 // no club outgrows its own city
const tierMul = c => c.tier===0?1:c.tier===1?0.34:0.15;

/* ---------- state ---------- */
/* s.lv[clubId]  = [stadium,training,academy,medical]  each 1..5
   s.cap0[clubId]= the capacity the world generator gave the ground
   s.proj        = the player's builds in progress
   c.capacity is NOT in the core save file, so it is rebuilt from these
   two on every load. Do not remove that. */
function raw(){ return SW.state('facilities') }
function st(){
  const s = raw();
  if(!s.lv || !s.lv.length) seed(s);
  if(!s.proj) s.proj = [];
  return s;
}
function natural(c){ return clamp(1 + Math.round((c.rep-32)/16), 1, 5) }
function seed(s){
  s.lv=[]; s.cap0=[]; s.proj=[];
  if(!G.clubs || !G.clubs.length) return;
  G.clubs.forEach(c=>{
    s.cap0[c.id] = c.capacity;
    const n = natural(c), L = [1,0,0,0];
    for(let i=1;i<4;i++){
      const bits=(c.seed>>>(2+i*4))&3;             // stable per club, no RNG burned
      L[i] = clamp(n + (bits===0?-1:bits===3?1:0), 1, 4);
    }
    s.lv[c.id]=L;                                   // every ground starts at 1 — capacity says the rest
  });
  G.clubs.forEach(c=>applyCap(c,s));
}
function lvOf(c,s){ s=s||st(); return s.lv[c.id] || (s.lv[c.id]=[1,2,2,2]) }

/* ---------- stadium maths ---------- */
function step(base){ return clamp(Math.round((base*0.16+2500)/500)*500, 2500, 9000) }
function capAt(c,lvl,s){
  const b = (s||st()).cap0[c.id] || c.capacity;
  return Math.min(MAXCAP, b + step(b)*(lvl-1));
}
function applyCap(c,s){ c.capacity = capAt(c, lvOf(c,s)[0], s) }

/* ---------- money ---------- */
function costOf(c,kind,target){
  return Math.max(300000, Math.round(revenue(c)*COST[kind][target]/1e5)*1e5);
}

/* ---------- plain English ---------- */
function effect(c,kind,lvl){
  if(kind==='stadium'){
    const cap = capAt(c,lvl);
    return 'Holds '+cap.toLocaleString()+'. Worth about '+
      money(Math.round(cap*900*tierMul(c)))+' a year in gate and matchday money.';
  }
  if(kind==='training'){
    const g = Math.round((TQ(lvl)/TQ(1)-1)*100);
    return g<=0 ? 'Players develop at the slowest rate in the game. You are wasting young lads here.'
                : 'Players develop about '+g+'% faster than they would on a bare pitch.';
  }
  if(kind==='academy'){
    const p = 0.045 + c.rep/2600 + (lvl-2)*0.012;
    return (lvl>=4?'Three to five':'Two to four')+' lads a summer, and roughly one in '+
      Math.max(2,Math.round(1/p))+' turns up with a real ceiling.';
  }
  const inj = Math.round((1-HAZ(lvl)/HAZ(1))*100), lay = Math.round((1-HEAL(lvl)/HEAL(1))*100);
  return inj<=0 ? 'Nothing. Men get hurt and stay hurt.'
                : 'Injuries about '+inj+'% less often, and layoffs about '+lay+'% shorter.';
}
function gainLine(c,kind,lvl){          // what the NEXT level buys you, one line
  if(kind==='stadium'){
    const add = capAt(c,lvl) - capAt(c,lvl-1);
    return '+'+add.toLocaleString()+' seats, and every one of them pays.';
  }
  if(kind==='training') return 'Development up another '+Math.round((TQ(lvl)/TQ(lvl-1)-1)*100)+'%.';
  if(kind==='academy')  return lvl>=4 ? 'An extra lad every summer, and better ones.' : 'Better intake every summer.';
  return 'Fewer injuries, and the ones you get are shorter.';
}

/* ---------- builds ---------- */
function projOn(kind){ return st().proj.find(p=>p.k===kind) || null }
function blockedReason(c,kind){
  const s=st(), L=lvOf(c,s), i=K.indexOf(kind), lvl=L[i];
  if(projOn(kind))                 return 'Already being built';
  if(lvl>=5)                       return 'Nothing left to build';
  if(kind==='stadium' && capAt(c,lvl+1)<=capAt(c,lvl))
                                   return 'The council will not allow another seat';
  if(s.proj.length>=2)             return 'Two builds at once is the limit';
  const cost = costOf(c,kind,lvl+1);
  if(cost>c.bal)                   return money(cost-c.bal)+' short';
  return null;
}
function commit(c,kind){
  const s=st(), i=K.indexOf(kind), to=lvOf(c,s)[i]+1, cost=costOf(c,kind,to);
  if(cost>c.bal) return false;                       // never, ever negative
  c.bal -= cost;
  s.proj.push({k:kind, to, tot:TIME[kind][to], left:TIME[kind][to], cost});
  return true;
}
function finish(c,p){
  const s=st(), L=lvOf(c,s), i=K.indexOf(p.k);
  L[i] = p.to;
  const h = SW.get('history');
  if(p.k==='stadium'){
    const before=c.capacity; applyCap(c,s);
    note('The new stand is open',
      c.stadium+' holds '+c.capacity.toLocaleString()+' now, '+(c.capacity-before).toLocaleString()+
      ' more than it did. It was full on Saturday.',{from:vV('board'),about:vC(me()),rel:'built'});
    chron('Expanded '+c.stadium+' to '+c.capacity.toLocaleString());
    if(h&&h.record) try{ h.record('milestone', c.stadium+' expanded to '+c.capacity.toLocaleString()) }catch(e){}
    return;
  }
  const line = {training:['The new training ground is open',
                  'Grass, glass and a gym that works. '+DESC.training[p.to]],
                academy:['The academy has been rebuilt',
                  DESC.academy[p.to]+' Ask again in five years whether it was worth it.'],
                medical:['The medical department is finished',
                  DESC.medical[p.to]+' Your physio has stopped apologising.']}[p.k];
  note(line[0], line[1],{from:vV('board')});
  chron(NAME[p.k]+' upgraded to level '+p.to);
  if(h&&h.record) try{ h.record('milestone', NAME[p.k]+' rebuilt — level '+p.to) }catch(e){}
}

/* ---------- the AI, cheaply: one roll per club per season ---------- */
function aiSeason(){
  const s=st();
  G.clubs.forEach(c=>{
    if(c.id===G.me) return;
    const L=lvOf(c,s), n=natural(c);
    let bi=-1, bd=0;
    for(let i=0;i<4;i++){ const d=n-L[i]; if(d>bd){ bd=d; bi=i } }
    if(bi<0) return;
    const kind=K[bi], cost=costOf(c,kind,L[bi]+1);
    if(cost > c.bal*0.45) return;                    // they cannot magic money either
    if(rnd() >= 0.14+0.04*bd) return;
    c.bal = Math.max(0, c.bal-cost);
    L[bi]++;
    if(bi===0) applyCap(c,s);
  });
}

/* ---------- the view ---------- */
function pips(l){
  let o='';
  for(let i=1;i<=5;i++) o+='<i style="width:7px;height:7px;border-radius:2px;display:block;background:'+
    (i<=l?'var(--acc)':'var(--s3)')+'"></i>';
  return '<span class="form" style="gap:3px">'+o+'</span>';
}
function card(c,kind){
  const s=st(), L=lvOf(c,s), i=K.indexOf(kind), lvl=L[i], p=projOn(kind);
  const head = `<div class="row" style="align-items:flex-start">
     <div class="ic" style="width:36px;height:36px;border-radius:10px;display:grid;place-items:center;
       font-size:15px;flex:0 0 auto;background:${BG[kind]};color:${COL[kind]}">${IC[kind]}</div>
     <div style="flex:1;min-width:0">
       <div style="font-size:15px;font-weight:700">${NAME[kind]}</div>
       <div class="dim" style="font-size:11px;letter-spacing:.05em;text-transform:uppercase;font-weight:700;margin-top:2px">
         Level ${lvl} of 5</div></div>
     <div style="margin-top:6px">${pips(lvl)}</div></div>
   <div style="font-size:13px;color:var(--t2);margin-top:11px">${esc(DESC[kind][lvl])}</div>
   <div style="font-size:13px;font-weight:600;color:${COL[kind]};margin-top:6px">${esc(effect(c,kind,lvl))}</div>`;

  if(p){
    const done = clamp(((p.tot-p.left)+G.week/38)/p.tot, 0.02, 0.98);
    const when = p.left<=1 ? 'Open for the start of next season.' : 'Ready in '+p.left+' seasons.';
    return `<div class="card">${head}
     <div style="height:8px;background:var(--s3);border-radius:4px;margin:13px 0 8px;overflow:hidden">
       <div style="height:100%;width:${Math.round(done*100)}%;background:${COL[kind]}"></div></div>
     <div class="row" style="font-size:12px">
       <span style="color:var(--t2);font-weight:600">Building level ${p.to}. ${when}</span>
       <span class="spacer"></span><span class="dim">${money(p.cost)} spent</span></div></div>`;
  }
  if(lvl>=5) return `<div class="card">${head}
    <div class="dim" style="font-size:12px;margin-top:12px">Finished. There is nothing left to build here.</div></div>`;

  const to=lvl+1, cost=costOf(c,kind,to), yrs=TIME[kind][to], why=blockedReason(c,kind);
  return `<div class="card">${head}
   <div style="border-top:1px solid var(--hair);margin-top:12px;padding-top:11px">
     <div class="kv" style="border-top:0"><span class="k2">Level ${to}</span>
       <span class="v2" style="font-weight:600;font-size:12px;text-align:right;max-width:62%">${esc(gainLine(c,kind,to))}</span></div>
     <div class="kv"><span class="k2">Cost, up front</span>
       <span class="v2" style="color:${cost>c.bal?'var(--loss)':'var(--t1)'}">${money(cost)}</span></div>
     <div class="kv"><span class="k2">Build time</span><span class="v2">${yrs} season${yrs>1?'s':''}</span></div>
     <button class="btn sm" style="margin-top:11px" ${why?'disabled':''}
       onclick="SW.get('facilities').ask('${kind}')">${why ? esc(why) : 'Upgrade — '+money(cost)}</button>
   </div></div>`;
}
function view(){
  const c=me(), s=st(), L=lvOf(c,s), sum=L.reduce((a,b)=>a+b,0);
  return `<div class="slab"><div class="k">The long game</div>
    <div class="v" style="font-size:26px;line-height:29px">${sum} of 20</div>
    <div class="d">${sum<=7?'You inherited a wreck. Start somewhere.'
      :sum<=12?'Getting there. Slowly, which is the only way it goes.'
      :sum<=17?'A proper football club is taking shape.'
      :'Every brick of this is yours.'}</div></div>
   <div class="sechead">Budget<span class="n">${money(c.bal)}</span></div>
   <div class="card" style="margin-bottom:10px"><div style="font-size:13px;color:var(--t2)">
     Every penny here comes out of the same pot as transfers, and none of it plays on Saturday.
     Buildings take seasons. Strikers take a week. That is the trade.</div></div>
   ${K.map(k=>card(c,k)).join('')}
   <div style="font-size:12px;color:var(--t3);margin:14px 2px 0">
     Nobody applauds a drainage system. It still wins you a league in six years.</div>`;
}

/* ---------- confirm sheet ---------- */
function ask(kind){
  const c=me(), s=st(), i=K.indexOf(kind), lvl=lvOf(c,s)[i];
  const why=blockedReason(c,kind);
  const cost=lvl<5?costOf(c,kind,lvl+1):0;
  if(why){
    sheet(`<h3>No.</h3><div class="sh-sub">${esc(why)}.</div>
      <div class="card" style="background:var(--s1);font-size:13px;color:var(--t2)">
        ${cost>c.bal ? 'You have '+money(c.bal)+'. It costs '+money(cost)+'. Sell somebody or wait for the summer.'
                     : 'Come back when that is not true.'}</div>
      <button class="btn ghost" style="margin-top:14px" onclick="closeSheet()">Fine</button>`);
    return;
  }
  const to=lvl+1, yrs=TIME[kind][to], left=c.bal-cost;
  const sane = left >= c.bal*0.30 && costRatio(c) < 82;
  sheet(`<h3>${kind==='stadium'?'Sign off the building work?':'Sign off the rebuild?'}</h3>
   <div class="sh-sub">${money(cost)} out of the budget today. ${yrs} season${yrs>1?'s':''} of hoardings and
     hard hats. You will not feel it until ${G.season+yrs}.</div>
   <div class="opt ${sane?'rec':''}" onclick="SW.get('facilities').go('${kind}')">
     <div><div style="font-weight:600">Sign it off</div>
       <div class="dim" style="font-size:12px">Leaves you ${money(left)} for players</div></div>
     ${sane?'<span class="st">Advised</span>':''}</div>
   <div class="opt ${sane?'':'rec'}" onclick="closeSheet()">
     <div><div style="font-weight:600">Not now</div>
       <div class="dim" style="font-size:12px">${sane?'Keep the money for the window'
         :'The assistant would rather you spent this on a player'}</div></div>
     ${sane?'':'<span class="st">Advised</span>'}</div>`);
}

/* ---------- registration ---------- */
SW.register({
  id:'facilities',

  init(){ seed(raw()) },

  onLoad(){
    const s=raw();
    if(!s.lv || !s.lv.length){ seed(s); return }
    if(!s.proj) s.proj=[];
    /* the core save has no c.capacity — the world was just regenerated,
       so what is on the club right now is the original ground. Re-add
       everything we ever built on top of it. */
    G.clubs.forEach(c=>{ s.cap0[c.id]=c.capacity });
    G.clubs.forEach(c=>applyCap(c,s));
  },

  onSeasonEndAfter(){
    const s=st(), c=me(), done=[];
    s.proj.forEach(p=>{ p.left--; if(p.left<=0) done.push(p) });
    s.proj = s.proj.filter(p=>p.left>0);
    done.forEach(p=>finish(c,p));
    aiSeason();
  },

  hubCards(){
    const c=me(); if(!c) return [];
    const s=st();
    if(s.proj.length>=2 || costRatio(c)>=80) return [];
    let best=null;
    K.forEach(k=>{
      if(blockedReason(c,k)) return;
      const i=K.indexOf(k), lvl=lvOf(c,s)[i], cost=costOf(c,k,lvl+1);
      if(c.bal < cost*1.8) return;                  // affordable, and not skint after it
      if(!best || lvl<best.lvl || (lvl===best.lvl && cost<best.cost)) best={k,lvl,cost};
    });
    if(!best) return [];
    const k=best.k, yrs=TIME[k][best.lvl+1];
    const head = best.lvl<=2
      ? {stadium:'You are turning people away at the gate',
         training:'The training ground is a portakabin',
         academy:'The academy is one scout and a minibus',
         medical:'Your medical room is an ice bath'}[k]
      : NAME[k]+' can go further';
    return [{ ic:IC[k], bg:BG[k], col:COL[k], a:head,
      b:money(best.cost)+' and '+yrs+' season'+(yrs>1?'s':'')+'. You can afford it.',
      fn:"G.clubView='facilities';go('club')", priority:20 }];
  },

  clubViews(){ return [{key:'facilities', label:'Facilities', render:view}] },

  /* ---- published interface ---- */
  level(kind, club){
    const i=K.indexOf(kind); if(i<0) return 1;
    const c = club===undefined ? (G.clubs&&G.clubs.length?me():null)
            : (typeof club==='number' ? G.clubs[club] : club);
    if(!c) return 1;
    return lvOf(c)[i];
  },
  building(){
    return st().proj.map(p=>({kind:p.k, level:p.to, seasons:p.left, total:p.tot, cost:p.cost}));
  },

  /* ---- ui callbacks (no globals; other code reaches us through SW) ---- */
  ask,
  go(kind){
    const c=me();
    if(blockedReason(c,kind)){ closeSheet(); render(); return }
    if(commit(c,kind)){
      const p=projOn(kind);
      note('Work starts on the '+NAME[kind].toLowerCase(),
        money(p.cost)+' gone out of the budget. '+p.tot+' season'+(p.tot>1?'s':'')+
        ' of mess before anybody sees a thing.',{from:vV('board')});
    }
    closeSheet(); save(); render();
  }
});
})();
