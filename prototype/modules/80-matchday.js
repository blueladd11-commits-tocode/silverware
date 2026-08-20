/* ============================================================
   matchday — in-match substitutions and tactical changes.
   The ninety minutes are the only place a manager actually manages.
   Owns: the SUBS and TACTICS buttons in the live footer, the two
   sheets behind them, the assistant's interrupts, in-play injuries,
   and the "your changes" section of the post-match report.
   ============================================================ */
(function(){
'use strict';

const MAXSUB=5;          // enforced by the engine too
const MAXINT=3;          // hard UX rule: never a fourth interrupt, never any in Instant
const st=()=>SW.state('matchday');

/* live scratch for the match in progress — never persisted, never global */
let L=null;

/* ---------- tiny helpers ---------- */
function M(){ return (typeof MT!=='undefined'&&MT&&MT.S)?MT:null }
function live(){
  const T=M(); if(!T)return null;
  if(!L||L.S!==T.S){
    if(L&&L.watch)clearInterval(L.watch);
    L={S:T.S,mine:T.mine,ints:0,fired:{},log:[],inj:null,injRec:null,pickOut:null,forced:false,
       watch:null,nextInj:11,hooked:[],iData:null};
  }
  return L;
}
function myc(){ const T=M(); return T?T.S.club[T.mine]:me() }
function lcond(p){ const T=M(); if(!T)return p.cond;
  const v=T.S.cond[T.mine][p.id]; return v===undefined?p.cond:v }
function gf(){ const T=M(); return T?T.g[T.mine]:0 }
function ga(){ const T=M(); return T?T.g[1-T.mine]:0 }
function subsLeft(){ const T=M(); return T?MAXSUB-T.S.subs[T.mine].length:0 }
const hash=id=>{ const h=Math.imul((id|0)^0x9E3779B9,2654435761)>>>0; return h/4294967296 };
const condWord=c=>c>=80?'Fresh':c>=66?'Working':c>=54?'Tiring':c>=44?'Struggling':'Legs gone';
const condCol=c=>c>=66?'var(--t3)':c>=50?'var(--acc)':'var(--inj)';

/* one small stylesheet, injected once */
function styles(){
  if(document.getElementById('md-css'))return;
  const s=document.createElement('style'); s.id='md-css';
  s.textContent=`
.md-r{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:13px;background:var(--s1);
 border:1px solid var(--hair);margin-bottom:7px;min-height:58px;cursor:pointer}
.md-r.rec{border-color:var(--acc)}
.md-r.dead{opacity:.4;cursor:default}
.md-r .sl{width:34px;flex:0 0 auto;text-align:center;font-family:var(--disp);font-weight:700;font-size:10px;
 letter-spacing:.04em;color:var(--t3);border:1px solid var(--hair);border-radius:6px;padding:4px 0}
.md-r .nw{flex:1;min-width:0}
.md-r .n{font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
 display:flex;align-items:center;gap:6px}
.md-r .m2{font-size:11px;color:var(--t3);display:flex;gap:7px;align-items:center;margin-top:4px;
 white-space:nowrap;overflow:hidden}
.md-num{font-family:var(--disp);font-weight:800;font-size:18px;font-variant-numeric:tabular-nums;
 width:30px;text-align:right;flex:0 0 auto}
.md-bar{width:42px;height:5px;border-radius:3px;background:var(--s3);overflow:hidden;flex:0 0 auto}
.md-bar i{display:block;height:100%}
.md-tag{font-size:9px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:2px 6px;
 border-radius:5px;background:var(--accw);color:var(--acc);flex:0 0 auto}
.md-tag.bad{background:#3A1C12;color:var(--inj)}
.md-seg{display:flex;gap:5px}
.md-seg button{flex:1;min-height:44px;border-radius:10px;cursor:pointer;font-weight:700;font-family:var(--ui);font-size:13px}
.md-foot{display:flex;gap:9px}
.md-foot .btn{flex:1;min-height:52px;font-size:13px;letter-spacing:.06em}`;
  document.head.appendChild(s);
}

/* ---------- what has happened to each of my players so far ---------- */
function evStats(){
  const T=M(),s=T.mine,R=T.S,min=T.min,out={},c=myc();
  const byName={};
  c.squad.forEach(p=>{ if(byName[p.name]===undefined)byName[p.name]=p.id });
  const g=i=>out[i]||(out[i]={sh:0,g:0,as:0,yel:0,red:false});
  R.ev.forEach(e=>{
    if(e.m>min||e.s!==s)return;                       // never leak un-played minutes
    if(e.t==='goal'){ if(e.wid!=null){g(e.wid).g++;g(e.wid).sh++} if(e.astId!=null)g(e.astId).as++ }
    else if(e.t==='saved'||e.t==='off'||e.t==='blocked'){ const i=byName[e.who]; if(i!=null)g(i).sh++ }
    else if(e.t==='yellow'){ const i=byName[e.who]; if(i!=null)g(i).yel++ }
    else if(e.t==='red'){ const i=byName[e.who]; if(i!=null)g(i).red=true }
  });
  return out;
}
/* an honest-enough live rating. Deterministic — it must never burn the match RNG. */
function ratingOf(p,slot,S2){
  const T=M(); if(!T)return 6.5;
  const e=(S2||{})[p.id]||{sh:0,g:0,as:0,yel:0,red:false};
  const min=Math.max(12,T.min), d=gf()-ga();
  const back=(slot==='GK'||slot==='CB'||slot==='FB'||slot==='DM');
  let r=6.55+0.16*d+0.78*e.g+0.34*e.as+0.09*e.sh+0.16*(p.form||0);
  if(back)r-=0.15*ga(); else if(min>62&&e.sh===0)r-=0.30;
  if(e.yel)r-=0.30;
  if(e.red)r-=1.60;
  const cd=lcond(p); if(cd<62)r-=(62-cd)*0.014;
  if(slot&&slot!==p.pos){ const base=CA(p)||1; r-=((base-CA(p,slot))/base)*3.2 }
  r+=hash(p.id)*0.44-0.22;
  return clamp(r,4.2,9.6);
}
/* how badly does this man need taking off */
function concern(p,slot,S2){
  const T=M(),e=(S2||{})[p.id]||{};
  if(e.red)return -999;
  const L2=live();
  if(L2&&L2.inj&&L2.inj.id===p.id)return 9999;
  let k=(100-lcond(p))*0.95+Math.max(0,6.9-ratingOf(p,slot,S2))*13;
  if(slot&&slot!==p.pos)k+=(CA(p)-CA(p,slot))*1.1;
  if(e.yel&&T.min>=58)k+=13;
  return k;
}
function effOf(p,slot){
  const base=CA(p,slot);
  const eff=base*(0.82+0.18*lcond(p)/100)*(1+0.045*(p.form||0));
  return {base:Math.round(base),eff:Math.round(eff),d:Math.round(eff-base)};
}
function benchList(){
  const T=M(),c=myc();
  const on=new Set(c.xi.map(x=>x.p.id));
  const off=new Set(T.S.subs[T.mine].map(s=>s.out.id));
  return squadOf(c).filter(p=>!on.has(p.id)&&!off.has(p.id)&&p.out<=0);
}
function bestFor(slot,bench,want){
  let best=null,bs=-1;
  bench.forEach(p=>{
    let v=CA(p,slot)*(0.82+0.18*p.cond/100)*(1+0.045*(p.form||0));
    if(want==='att')v*=1+(p.a[3]+p.a[2])/900;
    if(want==='def')v*=1+(p.a[4]+p.a[5])/900;
    if(v>bs){bs=v;best=p}
  });
  return best;
}

/* ---------- the assistant's substitution ---------- */
function recommend(S2){
  const T=M(),l=live(),c=myc();
  if(!T||subsLeft()<=0)return null;
  const bench=benchList(); if(!bench.length)return null;
  S2=S2||evStats();
  if(l.inj){
    const row=c.xi.find(x=>x.p.id===l.inj.id);
    if(row){ const inP=bestFor(row.slot,bench,'any');
      if(inP)return {out:row.p,slot:row.slot,in:inP,forced:true,worth:true,
        why:'He cannot go on. '+inP.name+' is the nearest thing we have to him.'} }
  }
  const chase=(ga()-gf())>0&&T.min>=62, prot=(gf()-ga())>0&&T.min>=76;
  let best=null;
  c.xi.forEach(({slot,p})=>{
    if(slot==='GK')return;
    if((S2[p.id]||{}).red)return;
    let k=concern(p,slot,S2);
    if(chase&&(slot==='ST'||slot==='W'||slot==='AM'))k+=14;
    if(prot&&(slot==='ST'||slot==='W'))k+=14;
    if(!best||k>best.k)best={slot,p,k};
  });
  if(!best)return null;
  const want=chase?'att':prot?'def':'any';
  const inP=bestFor(best.slot,bench,want); if(!inP)return null;
  const now=CA(best.p,best.slot)*(0.82+0.18*lcond(best.p)/100);
  const then=CA(inP,best.slot)*(0.82+0.18*inP.cond/100);
  const worth=(then>now+1.5)||best.k>50||chase||prot;
  let why;
  if(lcond(best.p)<54)why=best.p.name+' is running on fumes. '+inP.name+' has fresh legs.';
  else if(chase)why='We are chasing this. '+inP.name+' gives us something different up there.';
  else if(prot)why='See this out. '+inP.name+' for '+best.p.name+' and hold what we have.';
  else if(best.slot!==best.p.pos)why=best.p.name+' is filling in out of position. '+inP.name+' is a natural there.';
  else if(then>now+1.5)why=inP.name+' is simply better than what is out there right now.';
  else why='Nothing is broken. Leave it unless you fancy a gamble.';
  return {out:best.p,slot:best.slot,in:inP,worth,why};
}

/* ---------- the assistant's read of the game ---------- */
function gameRead(){
  const T=M(),R=T.S,s=T.mine,o=1-s,c=myc(),min=T.min;
  const poss=R.poss[s]/((R.poss[0]+R.poss[1])||1);
  let sh=0,osh=0;
  R.ev.forEach(e=>{ if(e.m>min)return;
    if(e.t!=='goal'&&e.t!=='saved'&&e.t!=='off'&&e.t!=='blocked')return;
    if(e.s===s)sh++; else osh++ });
  const mid=R.ph[s].MID-R.ph[o].MID;
  let tot=0,n=0; c.xi.forEach(({p})=>{tot+=lcond(p);n++});
  const cond=n?tot/n:90, d=gf()-ga();
  const keep={formation:c.formation,tempo:c.tempo,line:c.line,ment:c.ment};
  let txt,plan=null,label='';
  if(d<0&&min>=68){
    txt='We are behind and the clock is not our friend. Throw the kitchen sink at it.';
    plan={formation:c.formation==='4-5-1'||c.formation==='5-3-2'?'4-3-3':c.formation,
      tempo:clamp(c.tempo+1,-2,2),line:clamp(c.line+1,-2,2),ment:2}; label='Go for it';
  } else if(mid<-2.5&&poss<0.48){
    txt='We are being overrun in midfield. Nobody is getting a foot on the ball.';
    plan={formation:(c.formation==='4-4-2'||c.formation==='3-5-2')?'4-5-1':c.formation,
      tempo:clamp(c.tempo+1,-2,2),line:clamp(c.line-1,-2,2),ment:clamp(c.ment,-2,0)}; label='Get bodies in there';
  } else if(cond<58&&min>=55){
    txt='Legs have gone. We are a yard off everything and it will only get worse.';
    plan={formation:c.formation,tempo:clamp(c.tempo-1,-2,2),line:clamp(c.line-1,-2,2),ment:c.ment};
    label='Slow it down';
  } else if(osh>=sh+4){
    txt='They are walking through us. Another one is coming if we stand still.';
    plan={formation:c.formation,tempo:c.tempo,line:clamp(c.line-1,-2,2),ment:clamp(c.ment-1,-2,2)};
    label='Batten it down';
  } else if(poss>0.58&&sh<=2&&min>=35){
    txt='Plenty of the ball and nothing to show for it. We are going nowhere slowly.';
    plan={formation:c.formation,tempo:clamp(c.tempo+1,-2,2),line:c.line,ment:clamp(c.ment+1,-2,2)};
    label='Get it forward quicker';
  } else if(d>0&&min>=76){
    txt='This is there to be won. Do not invite them onto us.';
    plan={formation:c.formation,tempo:clamp(c.tempo-1,-2,2),line:clamp(c.line-1,-2,2),ment:clamp(c.ment-1,-2,2)};
    label='See it out';
  } else {
    txt='Nothing wrong with how we are set up. It is even out there.';
    plan=null;
  }
  const same=plan&&plan.formation===keep.formation&&plan.tempo===keep.tempo&&
             plan.line===keep.line&&plan.ment===keep.ment;
  return {txt,plan:same?null:plan,label,poss,sh,osh,cond,mid};
}

/* ---------- sheet plumbing that can never deadlock ---------- */
function stopWatch(){ const l=L; if(l&&l.watch){clearInterval(l.watch);l.watch=null} }
function pause(){
  const T=M(); if(!T)return;
  if(T.timer){clearTimeout(T.timer);T.timer=null}
  T.paused=true;
}
function resume(){
  stopWatch();
  const l=L; if(l){l.forced=false;l.pickOut=null}
  closeSheet();
  const T=M(); if(!T)return;
  if(T.done){renderMatch();return}
  matchResume();
}
/* if our sheet vanishes for any reason, the match must not sit there paused */
function watch(){
  stopWatch();
  const l=live(); if(!l)return;
  l.watch=setInterval(()=>{
    const T=M();
    if(!T||!T.paused){stopWatch();return}
    if(document.querySelector('.sheetwrap'))return;
    if(l.forced){ paint(subHTML(),true) } else { resume() }
  },600);
}
function paint(html,forced){
  styles();
  const w=document.querySelector('.sheetwrap'), s=w&&w.querySelector('.sheet');
  if(s){ s.innerHTML='<div class="grab"></div>'+html; s.scrollTop=0 }
  else sheet(html);
  const w2=document.querySelector('.sheetwrap');
  if(w2)w2.onclick=e=>{ if(e.target!==w2)return; if(forced)return; resume() };
  watch();
}

/* ---------- the substitution sheet ---------- */
function playerRow(p,slot,S2,opts){
  const e=(S2||{})[p.id]||{}, ef=effOf(p,slot), cd=Math.round(lcond(p));
  const rt=ratingOf(p,slot,S2);
  const tags=[];
  if(opts.rec)tags.push('<span class="md-tag">Assistant</span>');
  if(e.red)tags.push('<span class="md-tag bad">Sent off</span>');
  else if(e.yel)tags.push('<span class="md-tag bad">Booked</span>');
  if(opts.injured)tags.push('<span class="md-tag bad">Injured</span>');
  if(slot&&slot!==p.pos&&!opts.injured)tags.push('<span class="md-tag">Out of position</span>');
  if(e.g)tags.push('<span class="md-tag">'+e.g+(e.g>1?' goals':' goal')+'</span>');
  return `<div class="md-r${opts.rec?' rec':''}${opts.dead?' dead':''}"
    ${opts.dead?'':`onclick="${opts.fn}"`}>
   <div class="sl">${slot||p.pos}</div>
   <div class="nw">
    <div class="n">${esc(p.name)}${tags.join('')}</div>
    <div class="m2">
      <span class="md-bar"><i style="width:${clamp(cd,0,100)}%;background:${condCol(cd)}"></i></span>
      <span style="color:${condCol(cd)}">${cd}% ${condWord(cd)}</span>
      <span>·</span><span>${opts.bench?'not on yet':rt.toFixed(1)+' so far'}</span>
      ${ef.d<0?`<span style="color:var(--inj)">${ef.d} tired</span>`:(ef.d>0?`<span style="color:var(--win)">+${ef.d} sharp</span>`:'')}
    </div>
   </div>
   <div class="md-num" style="color:${ramp(ef.base)}">${ef.base}</div>
  </div>`;
}
function subHTML(){
  const T=M(); if(!T)return '';
  const l=live(),c=myc(),S2=evStats();
  const left=subsLeft(), bench=benchList(), rec=recommend(S2);
  const forced=!!l.inj;

  /* step two — who comes on */
  if(l.pickOut!=null){
    const row=c.xi.find(x=>x.p.id===l.pickOut);
    if(!row){l.pickOut=null;return subHTML()}
    const want=(ga()-gf())>0&&T.min>=62?'att':((gf()-ga())>0&&T.min>=76?'def':'any');
    const top=bestFor(row.slot,bench,want);
    const list=bench.slice().sort((a,b)=>
      (CA(b,row.slot)*(0.82+0.18*b.cond/100))-(CA(a,row.slot)*(0.82+0.18*a.cond/100)));
    return `<h3>On for ${esc(row.p.name)}</h3>
     <div class="sh-sub">${T.min}' · ${row.slot} · ${left} change${left===1?'':'s'} left.
      ${forced?'You must replace him.':'One tap and he is on.'}</div>
     ${list.length?list.map(p=>playerRow(p,row.slot,S2,{bench:true,rec:top&&p.id===top.id,
        fn:`MDAY.doSub(${row.p.id},${p.id})`})).join('')
      :'<div class="dim" style="padding:14px 0">Nobody left on that bench.</div>'}
     <button class="btn ghost" style="margin-top:6px" onclick="MDAY.back()">Pick someone else to come off</button>
     ${forced?'':'<button class="btn ghost" style="margin-top:8px" onclick="MDAY.leave()">Leave it — back to the match</button>'}`;
  }

  /* step one — who comes off */
  const rows=c.xi.map(({slot,p})=>({slot,p,k:concern(p,slot,S2)})).sort((a,b)=>b.k-a.k);
  const injured=l.inj?l.inj.id:null;
  const head=forced
    ? `<h3>${esc(l.inj.name)} is down</h3>
       <div class="sh-sub">${T.min}' · he is not getting up. You cannot leave him out there —
       ${left>0&&bench.length?'get someone on.':'and you have nobody to put on.'}</div>`
    : `<h3>Changes</h3>
       <div class="sh-sub">${T.min}' · ${MT.g[MT.mine]}–${MT.g[1-MT.mine]} · ${left} of ${MAXSUB} changes left.
       Worst first — condition, how they are playing, whether they are in their position.</div>`;
  const recBlock=(!forced&&left>0)?(rec?`
    <div class="card" style="background:var(--s1);margin-bottom:12px;padding:13px">
     <div style="font-size:13px;color:var(--t2)"><b style="color:var(--acc)">◆ Assistant Coach</b> — ${esc(rec.why)}</div>
     ${rec.worth?`<button class="btn sm" style="margin-top:11px" onclick="MDAY.accept()">
       ${esc(rec.in.name)} on for ${esc(rec.out.name)}</button>`
      :`<button class="btn sm ghost" style="margin-top:11px" onclick="MDAY.leave()">Leave it as it is</button>`}
    </div>`:`<div class="card" style="background:var(--s1);margin-bottom:12px;padding:13px">
     <div style="font-size:13px;color:var(--t2)"><b style="color:var(--acc)">◆ Assistant Coach</b> —
     ${left<=0?'You have used all five. This is the side that finishes.':'There is nobody fit on that bench.'}</div></div>`):'';

  return `${head}${recBlock}
   ${rows.map(({slot,p})=>{
     const dead=(S2[p.id]||{}).red||left<=0||!bench.length||(forced&&p.id!==injured);
     return playerRow(p,slot,S2,{rec:!forced&&rec&&rec.out.id===p.id,injured:injured===p.id,
       dead,fn:`MDAY.pickOut(${p.id})`})}).join('')}
   ${forced&&(left<=0||!bench.length)?`
     <button class="btn" style="margin-top:6px" onclick="MDAY.soldierOn()">Patch him up and play on</button>`:''}
   ${forced?'':`<button class="btn ghost" style="margin-top:6px" onclick="MDAY.leave()">Leave it — back to the match</button>`}`;
}

/* ---------- the tactics sheet ---------- */
function tacHTML(){
  const T=M(); if(!T)return '';
  const c=myc(),r=gameRead();
  const drain=Math.round((tactics(c).drain-1)*100);
  const sl=(lbl,key,lo,hi)=>{ const v=c[key];
    return `<div style="margin-bottom:16px"><div class="row" style="margin-bottom:7px">
      <span style="font-weight:600;font-size:14px">${lbl}</span><span class="spacer"></span>
      <span class="pill">${['Very '+lo,lo,'Balanced',hi,'Very '+hi][v+2]}</span></div>
      <div class="md-seg">${[-2,-1,0,1,2].map(n=>
       `<button onclick="MDAY.setT('${key}',${n})" style="border:1px solid ${v===n?'var(--acc)':'var(--hair)'};
        background:${v===n?'var(--acc)':'var(--s2)'};color:${v===n?'var(--tinv)':'var(--t3)'}"
        >${n===0?'—':n<0?'◄'.repeat(-n):'►'.repeat(n)}</button>`).join('')}</div></div>` };
  return `<h3>Tactics</h3>
   <div class="sh-sub">${T.min}' · ${MT.g[MT.mine]}–${MT.g[1-MT.mine]} · changes take effect from the next whistle.</div>
   <div class="card" style="background:var(--s1);margin-bottom:12px;padding:13px">
    <div style="font-size:13px;color:var(--t2)"><b style="color:var(--acc)">◆ Assistant Coach</b> — ${esc(r.txt)}</div>
    <div class="m2" style="font-size:11px;color:var(--t3);margin-top:8px;display:flex;gap:10px;flex-wrap:wrap">
     <span>Ball ${Math.round(r.poss*100)}%</span><span>Shots ${r.sh}–${r.osh}</span>
     <span style="color:${condCol(r.cond)}">Legs ${Math.round(r.cond)}%</span></div>
    ${r.plan?`<button class="btn sm" style="margin-top:11px" onclick="MDAY.applyRead()">
      ${esc(r.label)} — ${esc(r.plan.formation)}, ${['very patient','patient','balanced','direct','very direct'][r.plan.tempo+2]}</button>`
     :'<div class="pill acc" style="margin-top:10px;padding:8px 11px">✓ He would not change a thing</div>'}
   </div>
   <div class="sechead">Shape</div>
   <div class="row" style="flex-wrap:wrap;gap:7px;margin-bottom:12px">${Object.keys(SHAPE).map(f=>
    `<button onclick="MDAY.setForm('${f}')" style="padding:11px 14px;min-height:44px;border-radius:11px;cursor:pointer;
      border:1px solid ${c.formation===f?'var(--acc)':'var(--hair)'};background:${c.formation===f?'var(--acc)':'var(--s1)'};
      color:${c.formation===f?'var(--tinv)':'var(--t2)'};font-family:var(--disp);font-weight:700;font-size:14px">${f}</button>`).join('')}</div>
   <div class="sechead">Team style</div>
   <div class="card" style="padding:14px 14px 2px">
    ${sl('Tempo','tempo','Patient','Direct')}${sl('Defensive line','line','Deep','High press')}
    ${sl('Mentality','ment','Contain','Attack')}
    <div style="border-top:1px solid var(--hair);padding:11px 0 13px;font-size:12px;color:var(--t3)">
     This setup burns legs ${drain>=0?'+':''}${drain}% faster than a flat one.
     ${drain>=25?'Somebody will be walking by eighty.':''}</div>
   </div>
   <button class="btn" style="margin-top:12px" onclick="MDAY.leave()">Back to the match</button>`;
}

/* ---------- interrupts ---------- */
function interruptSheet(kind,data){
  const T=M(),l=live();
  const head={
    exhausted:['Your legs are gone','He has given you everything and there is nothing left.'],
    chasing:['You are running out of time','Twenty minutes. Sitting here loses it.'],
    booked:['He is one tackle from a red','Referee has him in the book and he is still flying in.'],
  }[kind]||['A word',''];
  return `<div style="min-height:34vh;display:flex;flex-direction:column">
    <h3>${head[0]}</h3>
    <div class="sh-sub">${T.min}' · ${MT.g[MT.mine]}–${MT.g[1-MT.mine]} · ${esc(head[1])}</div>
    <div class="card" style="background:var(--s1);margin-bottom:12px;padding:13px">
     <div style="font-size:13px;color:var(--t2)"><b style="color:var(--acc)">◆ Assistant Coach</b> — ${esc(data.why)}</div></div>
    <div class="opt rec" onclick="MDAY.iAct('${kind}')">
     <div><div style="font-weight:600">${esc(data.act)}</div>
      <div class="dim" style="font-size:12px">${esc(data.actSub)}</div></div><span class="st">Do it</span></div>
    <div class="opt" onclick="MDAY.leave()">
     <div><div style="font-weight:600">Leave it</div>
      <div class="dim" style="font-size:12px">Trust them. Back to the match.</div></div></div>
   </div>`;
}
function tryInterrupt(T,ev){
  const l=live(); if(!l)return null;
  if(l.ints>=MAXINT)return null;
  const min=T.min; if(min<10||min>88)return null;
  const c=myc(),S2=evStats(),bench=benchList(),left=subsLeft();

  /* 1. a man goes down — rolled once every ten minutes, so speed never changes the odds */
  if(!l.inj&&min>=l.nextInj){
    l.nextInj=min+10;
    const pool=c.xi.filter(x=>x.slot!=='GK'&&!(S2[x.p.id]||{}).red);
    let p=0.021; if(pool.length){
      const worst=pool.reduce((a,b)=>lcond(a.p)<lcond(b.p)?a:b);
      p*=1+Math.max(0,(70-lcond(worst.p))/70);
    }
    if(pool.length&&rnd()<p){
      let tot=0,list=[];
      pool.forEach(x=>{ const w=(0.5+x.p.inj/100)*(1+Math.max(0,(70-lcond(x.p))/50)); tot+=w; list.push([x,tot]) });
      const r=rnd()*tot; let hurt=list[list.length-1][0];
      for(const [x,acc] of list){ if(r<=acc){hurt=x;break} }
      const weeks=rnd()<0.55?ri(1,2):rnd()<0.85?ri(2,5):ri(5,11);
      l.inj={id:hurt.p.id,name:hurt.p.name,weeks,min};
      l.injRec={id:hurt.p.id,name:hurt.p.name,weeks,min};
      l.ints++;
      T.shown.unshift({e:{m:min,t:'inj'},txt:hurt.p.name+' is down and the physio is waving to the bench.',club:c});
      renderMatch();
      l.forced=true;
      paint(subHTML(),true);
      return true;
    }
  }
  /* 2. someone is out on his feet */
  if(!l.fired.exhausted&&left>0&&bench.length&&min>=55){
    const gone=c.xi.filter(x=>x.slot!=='GK'&&lcond(x.p)<53).sort((a,b)=>lcond(a.p)-lcond(b.p))[0];
    if(gone){
      const inP=bestFor(gone.slot,bench,'any');
      if(inP){
        l.fired.exhausted=true; l.ints++;
        l.iData={out:gone.p.id,in:inP.id};
        paint(interruptSheet('exhausted',{
          why:gone.p.name+' is at '+Math.round(lcond(gone.p))+'%. He is a passenger and they are running past him.',
          act:inP.name+' on for '+gone.p.name,
          actSub:'Fresh legs in the '+gone.slot+' slot'}),false);
        return true;
      }
    }
  }
  /* 3. chasing the game late */
  if(!l.fired.chasing&&min>=68&&min<=80&&ga()-gf()>=1){
    const r=gameRead();
    if(r.plan){
      l.fired.chasing=true; l.ints++;
      l.iData={plan:r.plan};
      paint(interruptSheet('chasing',{
        why:'One goal down with '+(90-min)+' to play. Nobody remembers a brave defeat.',
        act:'Go for it — '+r.plan.formation,
        actSub:'Push up, get it forward, take the risk'}),false);
      return true;
    }
  }
  /* 4. a booked man is a red card waiting to happen */
  if(!l.fired.booked&&left>0&&bench.length&&min>=62){
    const risky=c.xi.find(x=>{
      const e=S2[x.p.id]||{}; if(!e.yel||e.red)return false;
      return (x.slot==='CB'||x.slot==='DM'||x.slot==='FB'||lcond(x.p)<62)&&myc().line>=1;
    })||c.xi.find(x=>{ const e=S2[x.p.id]||{}; return e.yel&&!e.red&&lcond(x.p)<55 });
    if(risky){
      const inP=bestFor(risky.slot,bench,'any');
      if(inP){
        l.fired.booked=true; l.ints++;
        l.iData={out:risky.p.id,in:inP.id};
        paint(interruptSheet('booked',{
          why:risky.p.name+' is booked, tiring, and we are pushed right up. Take the decision out of the referee’s hands.',
          act:inP.name+' on for '+risky.p.name,
          actSub:'Ten men loses this'}),false);
        return true;
      }
    }
  }
  return null;
}

/* ---------- consequences ---------- */
function moraleHit(p,min){
  const big=(p.big==null?50:p.big);
  let d=min<=50?-11:min<=66?-7:-3;
  d*=(0.7+big/100);
  if(lcond(p)<58)d*=0.45;
  if(ratingOf(p,null,evStats())>=7.2)d*=1.5;
  d=Math.round(clamp(d,-24,-1));
  const m=SW.get('morale');
  if(m&&typeof m.adjust==='function')m.adjust(p.id,d,'hooked in the '+ord(min)+' minute');
  else if(p.morale!=null)p.morale=clamp(p.morale+d,-100,100);
  return d;
}
function logChange(o){ const l=live(); if(l)l.log.push(o) }

/* ---------- reshaping without rebuilding the side ---------- */
function reshape(c,f){
  if(!SHAPE[f])return;
  const cur=c.xi.slice(), used=new Set(), xi=[];
  SHAPE[f].forEach(slot=>{
    let best=null,bs=-1;
    cur.forEach(({p})=>{ if(used.has(p.id))return; const v=CA(p,slot); if(v>bs){bs=v;best=p} });
    if(best){used.add(best.id);xi.push({slot,p:best})}
  });
  cur.forEach(({slot,p})=>{ if(!used.has(p.id))xi.push({slot,p}) });
  c.formation=f; c.xi=xi;
}

/* ============================================================
   handlers — the only thing this module puts on window
   ============================================================ */
window.MDAY={
  subs(){ const T=M(); if(!T||T.done)return; pause(); const l=live(); l.pickOut=null; paint(subHTML(),!!l.inj) },
  tactics(){ const T=M(); if(!T||T.done)return; if(live().inj)return this.subs(); pause(); paint(tacHTML(),false) },
  pickOut(id){ const l=live(); if(!l)return; if(subsLeft()<=0||!benchList().length)return;
    l.pickOut=id; paint(subHTML(),l.forced) },
  back(){ const l=live(); if(!l)return; l.pickOut=null; paint(subHTML(),l.forced) },
  leave(){ resume() },
  accept(){ const S2=evStats(),r=recommend(S2); if(!r)return resume(); this.doSub(r.out.id,r.in.id) },
  doSub(outId,inId){
    const T=M(); if(!T)return; const l=live(),c=myc();
    const row=c.xi.find(x=>x.p.id===outId); if(!row)return;
    const inP=benchList().find(p=>p.id===inId); if(!inP)return;
    const outP=row.p, slot=row.slot, min=T.min;
    const forced=!!(l.inj&&l.inj.id===outId);
    if(!matchSub(T.S,T.mine,outId,inP)){ resume(); return }
    /* the engine logs its own feed line; we show ours straight away instead */
    for(let i=T.S.ev.length-1;i>=0;i--){ if(T.S.ev[i].t==='sub'){T.S.ev[i].imp=-1;break} }
    const d=forced?0:moraleHit(outP,min);
    if(!forced)l.hooked.push({id:outP.id,min});
    else { l.hooked.push({id:outP.id,min}); l.inj=null; l.forced=false }
    logChange({m:min,kind:'sub',outId:outP.id,inId:inP.id,out:outP.name,in:inP.name,
      slot,forced,morale:d,gf:gf(),ga:ga()});
    const s=st(); s.season=s.season||{subs:0,goals:0}; s.season.subs++;
    T.shown.unshift({e:{m:min,t:'sub'},club:c,
      txt:forced?outP.name+' cannot continue. '+inP.name+' comes on.'
                :inP.name+' on, '+outP.name+' off.'});
    const m2=SW.get('morale');
    if(m2&&typeof m2.adjust==='function')m2.adjust(inP.id,3,'brought on mid-match');
    resume();
  },
  soldierOn(){
    const T=M(); if(!T)return; const l=live(); if(!l||!l.inj)return;
    const c=myc(),row=c.xi.find(x=>x.p.id===l.inj.id);
    if(row){ T.S.cond[T.mine][row.p.id]=Math.min(lcond(row.p),34); matchRefresh(T.S);
      T.shown.unshift({e:{m:T.min,t:'inj'},club:c,
        txt:row.p.name+' is strapped up and hobbling. Nothing else we can do.'}) }
    logChange({m:T.min,kind:'hurt',outId:l.inj.id,out:l.inj.name,gf:gf(),ga:ga()});
    l.forced=false; l.inj=null; resume();
  },
  setT(k,v){ const T=M(); if(!T)return; const c=myc(); if(c[k]===v)return;
    c[k]=v; matchRefresh(T.S); noteTac(); paint(tacHTML(),false) },
  setForm(f){ const T=M(); if(!T)return; const c=myc(); if(c.formation===f)return;
    reshape(c,f); matchRefresh(T.S); noteTac(); paint(tacHTML(),false) },
  applyRead(){
    const T=M(); if(!T)return; const c=myc(),r=gameRead(); if(!r.plan)return resume();
    if(r.plan.formation!==c.formation)reshape(c,r.plan.formation);
    c.tempo=r.plan.tempo;c.line=r.plan.line;c.ment=r.plan.ment;
    matchRefresh(T.S); noteTac(r.label); resume();
  },
  iAct(kind){
    const T=M(); if(!T)return; const l=live(); if(!l)return;
    const d=l.iData||{};
    if(kind==='chasing'){
      const c=myc(),plan=d.plan||gameRead().plan;
      if(plan){ if(plan.formation!==c.formation)reshape(c,plan.formation);
        c.tempo=plan.tempo;c.line=plan.line;c.ment=plan.ment; matchRefresh(T.S); noteTac('Went for it') }
      resume(); return;
    }
    if(d.out!=null&&d.in!=null){ this.doSub(d.out,d.in); return }
    resume();
  },
  /* published for other modules / onboarding */
  open(){ this.subs() }
};
function noteTac(label){
  const T=M(); if(!T)return; const c=myc(),l=live(); if(!l)return;
  const txt=(label?label+' — ':'')+c.formation+', '+
    ['very patient','patient','balanced','direct','very direct'][c.tempo+2]+', '+
    ['deep','dropping off','normal line','pressing','very high'][c.line+2]+', '+
    ['contain','cautious','balanced','attacking','all-out attack'][c.ment+2];
  const last=l.log[l.log.length-1];
  if(last&&last.kind==='tac'&&last.m===T.min){ last.txt=txt; return }
  logChange({m:T.min,kind:'tac',txt,gf:gf(),ga:ga()});
}

/* ============================================================
   registration
   ============================================================ */
SW.register({
  id:'matchday',

  init(){ const s=st(); s.season={subs:0,goals:0}; s.last=null; s.career=s.career||{subs:0,goals:0} },
  onLoad(){ const s=st(); s.season=s.season||{subs:0,goals:0}; s.career=s.career||{subs:0,goals:0} },
  onSeasonEndAfter(){ const s=st(); s.season={subs:0,goals:0} },

  /* the footer buttons — hidden in Instant, hidden at full time */
  matchControls(T){
    if(!T||!T.S||T.done)return [];
    if(G.speed==='instant')return [];
    styles();
    const l=live(); if(!l)return [];
    const left=subsLeft(), c=myc();
    let tired=0; c.xi.forEach(({p})=>{ if(lcond(p)<55)tired++ });
    const warn=tired>0&&left>0;
    return [`<div class="md-foot">
      <button class="btn sm" onclick="MDAY.subs()" style="background:${warn?'var(--acc)':'var(--s2)'};
        color:${warn?'var(--tinv)':'var(--t1)'};border:1px solid ${warn?'var(--acc)':'var(--strong)'}">
        SUBS · ${left}${warn?' <span style="font-weight:800">!'+tired+'</span>':''}</button>
      <button class="btn sm ghost" onclick="MDAY.tactics()">TACTICS</button></div>`];
  },

  /* never in Instant, never a fourth time, never while we already hold the ball */
  matchInterrupt(T,ev){
    if(G.speed==='instant')return null;
    if(!T||!T.S||T.done||T.paused)return null;
    if(document.querySelector('.sheetwrap'))return null;
    const l=live(); if(!l)return null;
    try{ return tryInterrupt(T,ev) }catch(e){ console.error('[matchday.interrupt]',e); stopWatch(); return null }
  },

  onMatchEnd(m){
    stopWatch();
    const l=L; L=null;
    const c=G.clubs[m.mine===0?m.hi:m.ai];
    const s=st();
    const R=m.R, side=m.mine;
    /* who came off, and when — the core only credits the eleven who finished */
    const changes=(l&&l.log)?l.log.slice():[];
    const hooked=(l&&l.hooked)?l.hooked.slice():[];
    hooked.forEach(h=>{
      const p=c.squad.find(x=>x.id===h.id); if(!p)return;
      p.apps++;
      const gsc=R.ev.filter(e=>e.t==='goal'&&e.s===side&&e.wid===p.id).length;
      const rt=clamp(6.4+(R.g[side]-R.g[1-side])*0.16+gsc*0.75+gauss(0,0.5),4.5,9.9);
      p.ratings.push(+rt.toFixed(1));
      p.form=clamp(0.80*p.form+0.20*(rt-6.60),-2,2);
      /* he did not play the full ninety, so he is not as spent as the rest */
      p.cond=Math.max(30,p.cond-Math.round(ri(10,22)*clamp(h.min/94,0,1)));
    });
    /* a man brought on late should not finish as tired as one who played the lot */
    R.subs[side].forEach(sb=>{
      const p=c.squad.find(x=>x.id===sb.in.id); if(!p)return;
      p.cond=Math.min(100,p.cond+Math.round(ri(8,16)*clamp(1-sb.m/94,0,1)));
    });
    /* the man who went down during play */
    if(l&&l.injRec){
      const p=c.squad.find(x=>x.id===l.injRec.id);
      const weeks=l.injRec.weeks||ri(1,4);
      if(p&&p.out<weeks){ p.out=weeks;
        if(c.id===G.me)note(p.name+' limped off','Out for around '+weeks+' match'+(weeks>1?'es':'')+
          '. That is what a thin bench costs you.',{from:vV('medical'),about:vP(p),rel:'on'}) }
    }
    /* goals scored by men we brought on */
    let subGoals=0;
    R.subs[side].forEach(sb=>{
      subGoals+=R.ev.filter(e=>e.t==='goal'&&e.s===side&&e.wid===sb.in.id&&e.m>=sb.m).length });
    s.season=s.season||{subs:0,goals:0}; s.career=s.career||{subs:0,goals:0};
    s.season.goals+=subGoals; s.career.goals+=subGoals; s.career.subs+=R.subs[side].length;
    /* what the report will tell the story from */
    const tired=[];
    c.xi.forEach(({p})=>{ const v=R.cond[side][p.id]; if(v!==undefined&&v<58)tired.push({n:p.name,c:Math.round(v)}) });
    s.last={season:G.season,hi:m.hi,ai:m.ai,log:changes,subGoals,tired:tired.slice(0,4),
      used:R.subs[side].length};
  },

  reportBlocks(last){
    const s=st(); const rec=s.last;
    if(!rec||!last||rec.hi!==last.hi||rec.ai!==last.ai)return [];
    const R=last.R, side=last.hi===G.me?0:1;
    const goalsAfter=(m,who)=>R.ev.filter(e=>e.t==='goal'&&e.m>=m&&(who==null||e.wid===who)&&e.s===side).length;
    const againstAfter=m=>R.ev.filter(e=>e.t==='goal'&&e.m>=m&&e.s!==side).length;
    if(!rec.log.length){
      if(!rec.tired.length)return [];
      return [`<div class="sechead" style="margin-top:12px">Your changes</div>
       <div class="card" style="background:var(--s1)">
        <div style="font-size:13px;color:var(--t2)">You made none. ${esc(rec.tired.map(t=>t.n).join(', '))}
        finished on ${rec.tired.map(t=>t.c+'%').join(', ')}. Five changes sat unused on that bench.</div></div>`];
    }
    const rows=rec.log.map(e=>{
      if(e.kind==='tac')return `<div class="kv"><span class="k2">${e.m}' ${esc(e.txt)}</span>
        <span class="v2 mono" style="color:var(--t3)">${goalsAfter(e.m)}–${againstAfter(e.m)} after</span></div>`;
      if(e.kind==='hurt')return `<div class="kv"><span class="k2">${e.m}' ${esc(e.out)} played on injured</span>
        <span class="v2 mono" style="color:var(--inj)">Hurt</span></div>`;
      const his=goalsAfter(e.m,e.inId), after=goalsAfter(e.m), conc=againstAfter(e.m);
      const tail=his?(his>1?'Two goals for him.':'And he scored.')
        :after?(after>1?'We scored twice after it.':'We scored after it.')
        :conc?'They scored after it.':'Nothing changed after it.';
      return `<div class="kv"><span class="k2">${e.m}' ${esc(e.in)} for ${esc(e.out)}${e.forced?' (injured)':''}
        <span style="color:var(--t3)"> — ${esc(tail)}</span></span>
        <span class="v2 mono" style="color:${his?'var(--win)':'var(--t3)'}">${goalsAfter(e.m)}–${conc}</span></div>`;
    }).join('');
    const morale=rec.log.filter(e=>e.kind==='sub'&&!e.forced&&e.morale<=-8);
    return [`<div class="sechead" style="margin-top:12px">Your changes</div>
     <div class="card" style="background:var(--s1);padding:4px 14px 10px">${rows}</div>
     ${morale.length?`<div style="font-size:12px;color:var(--t3);margin:8px 2px 0">
       ${esc(morale.map(m=>m.out).join(' and '))} did not take being hooked well.</div>`:''}`];
  },

  hubCards(){
    /* only ever informational, and only when it would change the next team sheet */
    if(G.week>=38)return [];
    const c=me(),tired=squadOf(c).filter(p=>p.out<=0&&p.cond<62);
    const starters=tired.filter(p=>c.xi.some(x=>x.p.id===p.id));
    if(starters.length<3)return [];
    return [{ic:'◔',bg:'#2A2410',col:'var(--acc)',priority:40,
      a:starters.length+' of your eleven are running on empty',
      b:'Rotate now or make the changes at half-time and take the morale hit.',
      fn:"G.tab='squad';G.squadView='lineup';render()"}];
  },

  /* ---------- published interface ---------- */
  summary(){ const T=M(); if(!T)return null; const l=live();
    return {subsUsed:T.S.subs[T.mine].length,subsLeft:subsLeft(),interrupts:l?l.ints:0,
      injured:l&&l.inj?l.inj.id:null} },
  lastChanges(){ const s=st(); return (s.last&&s.last.log)?s.last.log.slice():[] },
  seasonSubs(){ const s=st(); return s.season||{subs:0,goals:0} },
  openSubs(){ if(M())window.MDAY.subs() }
});
})();
