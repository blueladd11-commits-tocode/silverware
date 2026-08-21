/* ============================================================
   SILVERWARE module: plans
   Three game plans that belong to the MANAGER, not the assistant.

   The coaching point this exists for, straight from the owner (UEFA C):
   the assistant must never quietly veto the manager's identity. Real staff
   work the other way round — the manager's plans are the default, and any
   reactive deviation has to be ARGUED: a named reason, an honest account
   of what abandoning your football costs, and the manager free to say no.

   Two things the owner corrected after playing more seasons:

   1. A PLAN CARRIES ITS TEAM SHEET. A plan without eleven names is not a
      plan, it is a formation. So every plan stores its XI — player id plus
      slot plus the surname, so a sold man can still be named. On apply the
      sheet is REPAIRED, never trusted: anyone sold, injured or otherwise
      unavailable is replaced by the best available for that slot, and the
      manager is told in words a coach would use. A sale rewrites the plan
      for good; an injury is a loan of the shirt, so the first-choice man
      gets it back the week he is fit. A stale id can never throw.

   2. THE ASSISTANT KNOWS WHAT IS ALREADY ON THE BOARD. He does not tell you
      to play 4-4-2 while you are playing 4-4-2. If your plan already suits
      the opponent he says so in one line and gets out of the way — no hub
      card, no "advice". He only speaks properly when he wants a CHANGE, and
      then the why is compulsory: the named threat, and what the change costs.
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

function surn(p){return String(p&&p.name||'').split(' ').pop()||'?'}
function words(p){return TW[p.tempo+2]+' · '+LW[p.line+2]+' · '+MW[p.ment+2]}
function planMatches(p,c){
  return !!(p&&c&&p.formation===c.formation&&p.tempo===c.tempo&&p.line===c.line&&p.ment===c.ment);
}
function fkey(f){return G.season+':'+G.week+':'+f.home+':'+f.away}
function shapeOf(f){return SHAPE[f]||SHAPE['4-4-2']}
function inUseKey(c){const s=S(); if(!c||!s.plans)return null;
  for(const k of KEYS)if(planMatches(s.plans[k],c))return k; return null}

/* culture publishes these now — still guarded, any module may be absent */
function standardsOf(){
  try{ const cu=SW.get('culture');
    if(cu&&typeof cu.standards==='function')return cu.standards()||[] }catch(e){}
  return [];
}
function identityLines(){
  try{ const cu=SW.get('culture'); if(cu&&typeof cu.identity==='function')return cu.identity()||[] }catch(e){}
  return [];
}

/* ============================================================
   TEAM SHEETS
   A plan's sheet is [[slot, playerId, surname], …] in SHAPE order.
   The surname is stored so a man who has been sold can still be named
   in the sentence that explains why he is not in the side any more.
   ============================================================ */
function bestFor(c,slot,used,prefer){
  let best=null,bs=-1;
  c.squad.forEach(p=>{ if(used.has(p.id)||p.out>0||p.youth)return;
    let v=CA(p,slot); if(prefer&&prefer.has(p.id))v+=5;
    if(v>bs){bs=v;best=p} });
  if(!best)c.squad.forEach(p=>{ if(used.has(p.id)||p.out>0)return;      // a kid beats a hole
    const v=CA(p,slot)*0.9; if(v>bs){bs=v;best=p} });
  if(!best)c.squad.forEach(p=>{ if(used.has(p.id))return;               // last resort: crisis
    const v=CA(p,slot)*0.5; if(v>bs){bs=v;best=p} });
  return best;
}
function bestSheet(c,formation,prefer){
  const used=new Set(),out=[];
  shapeOf(formation).forEach(slot=>{
    const p=bestFor(c,slot,used,prefer);
    if(p){used.add(p.id);out.push([slot,p.id,surn(p)])}
  });
  return out;
}
function captureSheet(c){
  if(!c||!Array.isArray(c.xi))return [];
  return c.xi.filter(x=>x&&x.p).map(x=>[x.slot,x.p.id,surn(x.p)]);
}
function sheetIds(plan){
  const out=new Set();
  (Array.isArray(plan&&plan.xi)?plan.xi:[]).forEach(e=>{if(e&&e[1]!=null)out.add(e[1])});
  return out;
}
/* where a shirt actually is on the grass — the core's own pitch layout, so
   "left-back" means the man on the left, not the second FB in an array */
function slotPhrase(formation,i,slot){
  let x=50;
  try{ if(typeof layout==='function'){const L=layout(formation); if(L&&L[i])x=L[i].x} }catch(e){}
  const l=x<=42,r=x>=58;
  switch(slot){
    case 'GK': return 'in goal';
    case 'FB': return l?'at left-back':r?'at right-back':'at full-back';
    case 'CB': return 'at centre-half';
    case 'DM': return 'in front of the back four';
    case 'CM': return l?'on the left of midfield':r?'on the right of midfield':'in central midfield';
    case 'AM': return 'in the hole';
    case 'W':  return l?'on the left wing':r?'on the right wing':'wide';
    case 'ST': return 'up top';
  }
  return 'in the side';
}
/* Never trust a stored id. Build the XI the plan asks for, replace anyone who
   cannot play, and hand back a plain account of every change. */
function resolveSheet(c,plan){
  const shape=shapeOf(plan.formation);
  const stored=Array.isArray(plan.xi)?plan.xi:[];
  const byId={}; c.squad.forEach(p=>byId[p.id]=p);
  const used=new Set(),xi=[],holes=[],rep=[];
  shape.forEach((slot,i)=>{
    const e=stored[i], pid=(e&&e[1]!=null)?e[1]:null, p=(pid!=null)?byId[pid]:null;
    let bad=null;
    if(pid==null)bad='none';
    else if(!p)bad='gone';
    else if(p.out>0)bad='out';
    else if(used.has(p.id))bad='dupe';
    if(bad){ xi.push({slot,p:null}); holes.push({i,slot,bad,e,p}) }
    else { used.add(p.id); xi.push({slot,p}) }
  });
  holes.forEach(h=>{
    const inP=bestFor(c,h.slot,used,null);
    if(!inP)return;
    used.add(inP.id); xi[h.i].p=inP;
    if(h.bad==='none')return;                       // nothing was stored: not a repair
    rep.push({i:h.i,slot:h.slot,why:h.bad,
      outName:(h.e&&h.e[2])||(h.p?surn(h.p):'that shirt'),
      inName:surn(inP),inId:inP.id,
      perm:(h.bad==='gone'||h.bad==='dupe')});      // sold is for good; injured is a loan
  });
  return {xi:xi.every(x=>x&&x.p)?xi:null, rep:rep};
}
function repairLine(r,k,formation){
  const where=slotPhrase(formation,r.i,r.slot);
  if(r.why==='gone')
    return 'Plan '+k+' had '+r.outName+' '+where+'. He is gone, so '+r.inName+' takes the shirt for good.';
  if(r.why==='out')
    return 'Plan '+k+' had '+r.outName+' '+where+'. He is out, so '+r.inName+' comes in until he is fit.';
  return 'Plan '+k+' had '+r.outName+' down twice. '+r.inName+' takes the second shirt '+where+'.';
}
/* Put a plan's sheet on the pitch. Returns the repair lines (possibly none).
   The plan heals itself: permanent losses are written back, an injury is not,
   because the first-choice man is coming back and the plan should remember him. */
function applySheet(c,plan,k){
  let r=null;
  try{ r=resolveSheet(c,plan) }catch(e){ console.error('[plans.sheet]',e) }
  if(!r||!r.xi){ try{autoXI(c)}catch(e){} if(c.xi&&c.xi.length===11)plan.xi=captureSheet(c); return [] }
  c.xi=r.xi;
  const keep=Array.isArray(plan.xi)?plan.xi:[];
  plan.xi=c.xi.map((x,i)=>{
    const hit=r.rep.find(z=>z.i===i);
    if(hit&&!hit.perm&&keep[i])return keep[i];      // he is only injured — hold his shirt
    return [x.slot,x.p.id,surn(x.p)];
  });
  const lines=r.rep.map(z=>repairLine(z,k,plan.formation));
  plan.fixed=lines.slice(0,3);
  plan.fixedAt=G.season+':'+G.week;
  return lines;
}
function tellRepair(k,plan,lines,how){
  if(!lines||!lines.length)return;
  const body=lines.join(' ')+' '+(how||'The rest of the sheet is exactly as you left it.');
  note('Plan '+k+' patched',body,{from:vV('assist')});
}
/* has the manager left the plan's sheet alone since he applied it? */
function sheetUntouched(c,plan){
  const st=Array.isArray(plan.xi)?plan.xi:[];
  if(!c.xi||c.xi.length!==st.length||!st.length)return false;
  return c.xi.every((x,i)=>st[i]&&x.p&&x.p.id===st[i][1]);
}

/* ---------- seeding: three plans, all of them yours, all with an XI ---------- */
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
  /* Plan A inherits the side he is picking today; B and C get the best XI for
     their shape, weighted towards the men he already trusts. */
  A.xi=(c.xi&&c.xi.length===11&&c.formation===A.formation)?captureSheet(c):bestSheet(c,A.formation,null);
  const trust=new Set(A.xi.map(e=>e[1]));
  B.xi=bestSheet(c,B.formation,trust);
  C.xi=bestSheet(c,C.formation,trust);
  s.plans={A:A,B:B,C:C}; s.set=true;
}
function ensure(){const s=S(); if(!s.set||!s.plans.A)seedPlans();
  /* an old save, or a plan whose shape was changed before sheets existed */
  const c=me();
  if(c&&s.plans)KEYS.forEach(k=>{const p=s.plans[k];
    if(p&&(!Array.isArray(p.xi)||p.xi.length!==shapeOf(p.formation).length))
      p.xi=bestSheet(c,p.formation,sheetIds(p));});
  return s}

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
/* the price of moving off Plan A onto one of the manager's own plans —
   smaller than the price of the assistant's bus, but never nothing */
function switchCost(from,to){
  if(to.ment<from.ment&&to.line<from.line)
    return 'It costs us the front foot for ninety minutes, and the crowd will hear it inside ten.';
  if(to.ment<from.ment)
    return 'It costs us a striker in the box, so we will have to take our one chance.';
  if(to.formation!==from.formation)
    return 'It costs us the shape they have trained all week, and one of them plays out of position.';
  return 'It costs us a little of what we are, for one night.';
}
/* one clause about THIS opponent, in the manager's current shape */
function readOfThem(x,p){
  if(x.bestOut)return 'their best player is not even in the squad';
  if(x.gap<=-12)return 'we are the better side and both dugouts know it';
  if(x.gap>=14)return 'they are the better side, so nothing tonight is free';
  if(x.quick&&x.quick.a[0]>=82&&p.line<=0)return surn(x.quick)+' is quick, and you are already dropped off him';
  if(x.quick&&x.quick.a[0]<74&&p.line>=1)return 'nobody in their front line can run at that line';
  if((x.o.form||[]).slice(-5).filter(r=>r==='W').length>=4)return 'they are in form, so we will need the first goal';
  if(x.home)return 'it is our place and they have to come and solve us';
  return 'there is nothing in this lot that our shape does not cover';
}

/* ============================================================
   THE ASSISTANT'S READ
   Two modes, and the difference matters more than the words:
     quiet — the board is already right. One line of confirmation, no card,
             never phrased as a suggestion, never a thing to act on.
     speak — he wants a CHANGE. The named threat and what it costs, always.
   He is never allowed to recommend the setup that is already on the board.
   ============================================================ */
function read(f){
  const s=ensure(); if(!s.plans.A)return null;
  const c=me(); if(!c)return null;
  const x=caseFor(f); if(!x)return null;
  const A=s.plans.A, dealt=s.dealt[fkey(f)], cur=inUseKey(c);

  const out=(plan,key,why,kind,quiet)=>({plan:plan,why:why,same:planMatches(plan,c),
    quiet:!!quiet,opp:x.o,home:x.home,kind:kind,key:key,x:x});
  const quiet=(plan,key,why,kind)=>out(plan,key,why,kind||'quiet',true);
  /* the guard the owner asked for: if the thing he was about to suggest is
     already up on the board, it is not a suggestion, it is agreement */
  const speak=(plan,key,why,kind)=>planMatches(plan,c)
    ?quiet(plan,key,'You are already set up for this — Plan '+key+', '+plan.formation+
       '. '+cap(readOfThem(x,plan))+'. Nothing else from me.','agree')
    :out(plan,key,why,kind,false);

  if(dealt==='his')
    return quiet(x.prop,null,'His way tonight, and you signed it off. Compact, off them, hit them on the break. Monday we go back to being us.','his');
  if(dealt==='stick')
    return quiet(A,'A','Settled. You heard him out and kept Plan A — '+A.name+'. Nothing more from me before kick-off.','stick');

  if(x.strong){
    if(planMatches(x.prop,c))
      return quiet(x.prop,null,'You have set up the way I was going to ask you to. '+
        x.reasons[0]+' There is nothing left for me to argue.','pre');
    return out(A,'A',x.reasons[0]+' I want us to sit off for this one — my case is on your desk, '+
      'and it costs us plenty. Plan A stands until you say otherwise.','case',false);
  }

  if(x.moderate){
    /* a manager's own careful plan beats an invented reactive one */
    let alt=null,ak=null;
    KEYS.forEach(k=>{const p=s.plans[k];
      if(k!=='A'&&p&&(p.line+p.ment)<=(A.line+A.ment)-2&&(!alt||(p.line+p.ment)<(alt.line+alt.ment))){alt=p;ak=k}});
    if(alt)
      return speak(alt,ak,'Plan '+ak+' tonight — '+alt.name+'. '+x.reasons[0]+' '+
        switchCost(A,alt)+' Still our football, the careful version of it.','plan'+ak);
    if(cur)
      return quiet(s.plans[cur],cur,'Plan '+cur+' and no change. '+x.reasons[0]+
        ' Bin your football for this lot and you end up binning it every week.','hold');
    return out(A,'A','You are not on any of your three. '+x.reasons[0]+
      ' Put Plan A back up — '+A.name+' — and make them beat it.','drift',false);
  }

  if(cur)
    return quiet(s.plans[cur],cur,'Nothing from me. Plan '+cur+' — '+s.plans[cur].name+
      ' — is on the board and it holds up here: '+readOfThem(x,s.plans[cur])+'.','calm');
  return out(A,'A','You are off your own plans — this is not A, B or C. Plan A is '+A.name+', '+
    A.formation+', and '+readOfThem(x,A)+'.','drift',false);
}
function cap(s){return s?s.charAt(0).toUpperCase()+s.slice(1):s}

/* ---------- the argued sheet: his case, its cost, your call ---------- */
window.swPlanCase=function(){
  const f=nextFixture(); if(!f)return;
  const s=ensure(),x=caseFor(f),c=me();
  if(!x||!x.strong||s.dealt[fkey(f)]||planMatches(x.prop,c)){closeSheet();render();return}
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
       <div class="dim" style="font-size:12px">${esc(A.formation)} · ${esc(words(A))}. Your XI, your football, against anyone.</div></div>
     <span class="st">Yours</span></div>
   <div class="opt" onclick="swPlanHis()">
     <div><div style="font-weight:600">Set up his way</div>
       <div class="dim" style="font-size:12px">${esc(x.prop.formation)} · sit off, stay compact, hit them on the break.
         He picks the eleven that fits it. One game only.</div></div></div>`);
};
window.swPlanStick=function(){
  const f=nextFixture(); if(!f){closeSheet();return}
  const s=ensure(),c=me(),A=s.plans.A;
  c.formation=A.formation;c.tempo=A.tempo;c.line=A.line;c.ment=A.ment;
  const fixed=applySheet(c,A,'A');
  s.dealt[fkey(f)]='stick';
  note('The plan stands','You heard him out and kept Plan A. Right or wrong, that is a manager who knows what he is about. The ninety minutes get the last word.',{from:vV('assist')});
  tellRepair('A',A,fixed);
  closeSheet();save();render();
};
window.swPlanHis=function(){
  const f=nextFixture(); if(!f){closeSheet();return}
  const s=ensure(),c=me(),x=caseFor(f); if(!x){closeSheet();return}
  c.formation=x.prop.formation;c.tempo=x.prop.tempo;c.line=x.prop.line;c.ment=x.prop.ment;
  /* his shape, but he picks it out of the men you already trust */
  const trust=sheetIds(s.plans.A);
  const tmp={formation:x.prop.formation,xi:bestSheet(c,x.prop.formation,trust)};
  applySheet(c,tmp,'A');
  s.dealt[fkey(f)]='his';
  note('You sat off for this one','His plan, his eleven, your name on the teamsheet. If it works nobody will ask. If it does not, they will ask why we stopped being us.',{from:vV('assist'),about:vC(x.o),rel:'on'});
  closeSheet();save();render();
};

/* ---------- applying, saving and editing plans ---------- */
window.swPlanUse=function(k){
  const s=ensure(),p=s.plans[k]; if(!p)return;
  const c=me(); if(!c)return;
  c.formation=p.formation;c.tempo=p.tempo;c.line=p.line;c.ment=p.ment;
  const fixed=applySheet(c,p,k);
  tellRepair(k,p,fixed);
  save();render();
};
window.swPlanSave=function(k){
  const s=ensure(),p=s.plans[k],c=me(); if(!p||!c)return;
  p.formation=c.formation;p.tempo=c.tempo;p.line=c.line;p.ment=c.ment;
  p.xi=captureSheet(c);
  p.fixed=null;p.fixedAt=null;
  note('Plan '+k+' is your eleven now','Shape, style and the eleven names — saved as Plan '+k+'. Call it up any week and that is the side that walks out.',{from:vV('assist')});
  save();render();
};
window.swPlanSet=function(k,key,v){
  const s=ensure(); const p=s.plans[k]; if(!p)return;
  const c=me();
  p[key]=v;
  if(key==='formation'&&c){
    /* new shape, same men wherever they still fit */
    p.xi=bestSheet(c,v,sheetIds(p)); p.fixed=null;
    if(planMatches(p,c))applySheet(c,p,k);
  }
  save(); swPlanEdit(k);
};
window.swPlanName=function(k,i){
  const s=ensure(); if(!s.plans[k]||!NAMES[i])return;
  s.plans[k].name=NAMES[i]; save(); swPlanEdit(k);
};
window.swPlanEdit=function(k){
  const s=ensure(),p=s.plans[k],c=me(); if(!p)return;
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
   <div class="sechead">The eleven</div>
   ${c?`<div class="card">${sheetHTML(c,p)}
     <div class="dim" style="font-size:12px;line-height:18px;margin-top:9px;border-top:1px solid var(--hair);padding-top:9px">
       ${planMatches(p,c)
         ?'This plan is on the pitch now. Change the side on the Lineup screen, then tap Save this XI on the plan.'
         :'Tap Use this plan, pick the side you want on the Lineup screen, then tap Save this XI.'}
       Anyone sold or injured is replaced when you call the plan up, and I will tell you who.</div></div>`:''}
   <button class="btn" style="margin-top:10px" onclick="closeSheet();render()">Done</button>`);
};

/* ---------- the sheet, drawn small enough to read at a glance ---------- */
function bandLabels(formation){
  const n=formation.split('-').length;
  return n>=4?['Back','Middle','Behind','Front']:['Back','Middle','Front'];
}
function sheetHTML(c,plan){
  const shape=shapeOf(plan.formation);
  const st=Array.isArray(plan.xi)?plan.xi:[];
  const byId={}; c.squad.forEach(p=>byId[p.id]=p);
  const bands=plan.formation.split('-').map(Number),labels=bandLabels(plan.formation);
  const rows=[['GK',[0]]];
  let i=1;
  bands.forEach((n,b)=>{const idx=[];for(let j=0;j<n;j++){idx.push(i);i++}rows.push([labels[b]||'',idx])});
  const chip=(j)=>{
    const e=st[j],slot=shape[j]||'',p=(e&&e[1]!=null)?byId[e[1]]:null;
    const gone=!p, outNow=!!(p&&p.out>0);
    const nm=p?surn(p):((e&&e[2])||'—');
    const col=gone?'var(--t3)':outNow?'var(--inj)':'var(--t1)';
    const mark=gone?' ✗':outNow?' ✚':'';
    const off=p&&slot&&p.pos!==slot;
    return `<span style="display:inline-flex;align-items:baseline;gap:4px;margin:0 9px 3px 0;font-size:12.5px;color:${col}">
      <b style="font-weight:600">${esc(nm)}${mark}</b>
      <i style="font-style:normal;font-size:10px;color:${off?'var(--inj)':'var(--t3)'}">${esc(slot)}</i></span>`;
  };
  return rows.map(([lbl,idx])=>
    `<div class="row" style="align-items:flex-start;gap:9px;padding:3px 0">
      <span style="flex:0 0 42px;font-size:9.5px;letter-spacing:.07em;text-transform:uppercase;color:var(--t3);padding-top:3px">${lbl}</span>
      <span style="flex:1;min-width:0">${idx.map(chip).join('')}</span></div>`).join('');
}
function sheetTrouble(c,plan){
  const st=Array.isArray(plan.xi)?plan.xi:[];
  const byId={}; c.squad.forEach(p=>byId[p.id]=p);
  let gone=0,out=0;
  st.forEach(e=>{const p=(e&&e[1]!=null)?byId[e[1]]:null;
    if(!p)gone++; else if(p.out>0)out++});
  return {gone,out};
}

/* ---------- the Plans screen (Squad tab segment) ---------- */
function plansView(){
  const s=ensure(),c=me(); if(!s.plans.A||!c)return '<div class="card"><div class="dim">No club yet.</div></div>';
  const f=nextFixture();
  let a=null; try{a=f?read(f):null}catch(e){console.error('[plans.view]',e)}
  const openCase=!!(a&&a.kind==='case');
  const head=a?(a.quiet
    /* quiet: one line, no plate, no button, nothing to act on */
    ?`<div class="row" style="gap:8px;align-items:flex-start;margin:2px 2px 12px">
       <span style="color:var(--t3);font-size:12px;margin-top:1px">◇</span>
       <div class="dim" style="font-size:12px;line-height:18px">${esc(a.why)}</div></div>`
    /* speaking: he wants a change, so the why and the cost are the card */
    :`<div class="card" style="margin-bottom:10px;border-color:var(--acc)">
       <div style="font-size:13px;color:var(--t2);line-height:19px">
         <b style="color:var(--acc)">◆ Assistant Coach</b> — ${esc(a.why)}</div>
       <div class="row" style="margin-top:11px;gap:8px">
         <button class="btn xs" style="flex:1" onclick="${openCase?'swPlanStick()':"swPlanUse('"+a.key+"')"}">${
           openCase?'Keep Plan A':'Go with Plan '+a.key+' ('+esc(a.plan.formation)+')'}</button>
         ${openCase?`<button class="btn ghost xs" onclick="swPlanCase()">Hear his case</button>`:''}
       </div></div>`):'';
  return `${head}
   <div class="sechead">Your game plans</div>
   ${KEYS.map(k=>{
     const p=s.plans[k],inUse=planMatches(p,c),t=sheetTrouble(c,p);
     return `<div class="card" style="margin-bottom:9px${inUse?';border-color:var(--acc)':''}">
      <div class="row"><span class="pill acc" style="font-family:var(--disp);font-weight:800">${k}</span>
        <span style="font-weight:700;font-size:14px">${esc(p.name)}</span>
        ${inUse?'<span class="pill acc">✓ In use</span>':''}
        <span class="spacer"></span><span class="pill">${esc(p.formation)}</span></div>
      <div class="dim" style="font-size:12px;margin-top:6px">${esc(words(p))}</div>
      <div style="margin-top:9px;border-top:1px solid var(--hair);padding-top:7px">${sheetHTML(c,p)}</div>
      ${(t.gone||t.out)?`<div style="font-size:11.5px;color:var(--inj);margin-top:6px">
        ${t.gone?t.gone+' gone (✗)':''}${t.gone&&t.out?' · ':''}${t.out?t.out+' unavailable (✚)':''} —
        ${inUse?'already covered':'covered when you call it up'}</div>`:''}
      ${(p.fixed&&p.fixed.length)?`<div style="font-size:11.5px;color:var(--t3);line-height:17px;margin-top:6px">
        ${p.fixed.map(l=>esc(l)).join(' ')}</div>`:''}
      <div class="row" style="margin-top:10px;gap:8px">
        ${inUse?`<button class="btn xs" style="flex:1" onclick="swPlanSave('${k}')">Save this XI</button>`
          :`<button class="btn xs" style="flex:1" onclick="swPlanUse('${k}')">Use this plan</button>`}
        <button class="btn ghost xs" onclick="swPlanEdit('${k}')">Adjust</button></div></div>`}).join('')}
   <div class="card" style="margin-top:2px"><div style="font-size:12px;color:var(--t3);line-height:18px">
     Three ways of playing and three teamsheets, all of them yours. Call one up and that eleven
     walks out — anyone sold or injured is replaced by the best man for the shirt and you get told who.
     The assistant only speaks when he wants something changed.</div></div>`;
}

/* ============================================================
   registration
   ============================================================ */
SW.register({
  id:'plans',
  init(){const s=SW.state('plans');for(const k in DEF)delete s[k];S();},
  onLoad(){S()},
  onSeasonEndAfter(){const s=S(); s.dealt={};
    /* new season, new squad numbers: heal every sheet before he opens the tab */
    const c=me(); if(!c||!s.plans)return;
    KEYS.forEach(k=>{const p=s.plans[k]; if(!p)return;
      try{ const r=resolveSheet(c,p),old=Array.isArray(p.xi)?p.xi:[];
        if(r.xi)p.xi=r.xi.map((x,i)=>{const hit=r.rep.find(z=>z.i===i);
          return (hit&&!hit.perm&&old[i])?old[i]:[x.slot,x.p.id,surn(x.p)]});
        p.fixed=null;
      }catch(e){console.error('[plans.season]',e)} });
  },

  /* A plan that still names a man who has been sold is a lie on the screen.
     Heal it the moment he leaves — silently, because the sale already spoke. */
  onTransfer(p,seller,buyer){
    try{
      const c=me(); if(!c||!p||!seller||seller.id!==G.me)return;
      const s=S(); if(!s.set||!s.plans)return;
      KEYS.forEach(k=>{const pl=s.plans[k]; if(!pl||!Array.isArray(pl.xi))return;
        const i=pl.xi.findIndex(e=>e&&e[1]===p.id); if(i<0)return;
        const used=new Set(pl.xi.map(e=>e&&e[1]));used.delete(p.id);
        const inP=bestFor(c,pl.xi[i][0],used,null);
        if(inP)pl.xi[i]=[pl.xi[i][0],inP.id,surn(inP)];
      });
    }catch(e){console.error('[plans.transfer]',e)}
  },

  /* If the plan on the pitch is untouched and one of its eleven cannot play,
     repair it now and say so — not silently at kick-off. */
  onWeek(){
    try{
      const c=me(); if(!c)return;
      const s=S(); if(!s.set||!s.plans)return;
      const k=inUseKey(c); if(!k)return;
      const p=s.plans[k];
      if(!sheetUntouched(c,p))return;              // he has picked his own side — leave it
      const t=sheetTrouble(c,p); if(!t.gone&&!t.out)return;
      const fixed=applySheet(c,p,k);
      tellRepair(k,p,fixed,'Plan '+k+' is still the plan; that is the only change.');
    }catch(e){console.error('[plans.week]',e)}
  },

  /* the core's assistant defers to this entirely */
  assistantAdvice(f){
    try{ return read(f) }catch(e){ console.error('[plans.advice]',e); return null }
  },

  hubCards(){
    const f=nextFixture(); if(!f)return [];
    const s=ensure(); if(!s.plans.A)return [];
    let x=null; try{x=caseFor(f)}catch(e){}
    const c=me();
    /* a card is for a decision he has not made. If the plan already suits,
       or he has already set up that way, or he has answered — no card. */
    if(!x||!x.strong||s.dealt[fkey(f)]||!c||planMatches(x.prop,c))return [];
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
  plan(k){const s=me()?ensure():S();return (s.plans&&s.plans[k])?JSON.parse(JSON.stringify(s.plans[k])):null},
  inUse(){if(me())ensure();return inUseKey(me())},
  apply(k){swPlanUse(k)},
  /* the eleven a plan would actually put out right now, repaired, no side effects */
  sheetFor(k){const c=me(); if(!c)return null; const s=ensure(),p=s.plans&&s.plans[k]; if(!p)return null;
    try{const r=resolveSheet(c,p); return r.xi?r.xi.map(x=>({slot:x.slot,id:x.p.id,name:x.p.name})):null}
    catch(e){return null}}
});

/* switching mid-match: pause via the matchday module's own controls, apply,
   resume — all in one tick so the tactics sheet never actually shows.
   Shape and style only: you do not get eleven fresh men at 60 minutes, you
   get three substitutions, and those belong to matchday. */
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
