/* ============================================================
   SILVERWARE — module: contracts
   Renewals, wage demands, agents, expiries, release clauses,
   free agents. Squad sub-view "Contracts" + hub cards at 70.

   All state lives in SW.state('contracts'). The only globals are
   tap handlers (onclick strings need them), namespaced ctr*.
   ============================================================ */
(function(){

/* ---------- state ---------- */
function st(){
  const s=SW.state('contracts');
  if(!s.deals)s.deals={};        // pid -> {w,y,cl,s}  terms we agreed (survives reload)
  if(!s.clauses)s.clauses={};    // pid -> release clause in £
  if(!s.pre)s.pre={};            // pid -> clubId he has pre-agreed to join free
  if(!s.pool)s.pool=[];          // unattached players
  if(!s.known)s.known=[];        // my squad ids last seen (to spot arrivals)
  if(!s.pushed)s.pushed={};      // pid -> true, he will not be pushed twice
  if(!s.nextFA)s.nextFA=900001;  // id range for generated free agents
  if(!s.feeSeason)s.feeSeason=0; // agent money paid this season
  if(!s.warned)s.warned={};      // pid -> told you he is inside six months
  return s;
}

/* ---------- time ---------- */
/* A deal expires at the end of the season in which years hits 0.
   38 weeks to a season, so months left = (years*38 - week)/38*12. */
function mLeft(p){
  if(!p)return 0;
  const wk=(p.years||0)*38-Math.min(G.week||0,38);
  return Math.max(0,Math.round(wk/38*12));
}
function urg(m){
  if(m<=0)return{c:'var(--loss)',l:'EXPIRED',s:4};
  if(m<=3)return{c:'var(--loss)',l:m+' MTH LEFT',s:3};
  if(m<=6)return{c:'var(--inj)',l:m+' MTHS LEFT',s:2};
  if(m<=12)return{c:'var(--acc)',l:m+' MTHS LEFT',s:1};
  return{c:'var(--t3)',l:Math.round(m/12)+' YRS LEFT',s:0};
}

/* ---------- agents ----------
   Stable personality straight off the player id. No RNG, so a
   redraw of the same screen never changes who he is dealing with. */
function hash(n){let x=(n*2654435761)>>>0;x^=x>>>13;x=(x*1274126177)>>>0;return x>>>0}
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
  const h=hash(p.id);
  const a=AGENTS[AGMIX[h%10]];
  return {...a,name:AGNAME[(h>>>5)%AGNAME.length]};
}

/* ---------- what he wants ----------
   Deterministic — rendering must never burn RNG. */
function demand(p,club){
  const c=club||me();
  const ag=agentOf(p);
  const base=wageFor(p);
  const played=c&&c.P>0?p.apps/c.P:0.5;
  const key=c?squadOf(c).sort((a,b)=>CA(b)-CA(a)).slice(0,11).some(x=>x.id===p.id):false;
  let m=1.06;
  m+=(p.amb-55)/100*0.30;
  m+=clamp(p.form||0,-3,3)*0.02;
  m+=played>0.60?0.12:played<0.25?-0.10:0;
  if(key)m+=0.08;
  if(p.age>=32)m-=0.15;else if(p.age<=21)m-=0.05;
  m*=ag.greed;
  if(st().pushed[p.id])m*=1.07;                       // you already annoyed him
  const wage=Math.max(1000,Math.round(base*clamp(m,0.75,2.10)/1000)*1000);
  const years=p.age>=34?1:p.age>=31?2:p.age<=23?4:3;
  const wantsCl=(hash(p.id*7+3)%100)/100<ag.clause;
  const cl=wantsCl?Math.max(1e6,Math.round(value(p)*(1.35+(hash(p.id*11+5)%45)/100)/5e5)*5e5):0;
  return {wage,years,clause:cl,agent:ag,fee:Math.round(wage*52*ag.fee)};
}

/* ---------- money guard ---------- */
function afford(n){return me().bal>=n}

/* ---------- wage structure ---------- */
function wageShock(p){
  const c=me();
  const others=squadOf(c).filter(x=>x.id!==p.id);
  if(!others.length)return;
  const top=others.reduce((s,x)=>Math.max(s,x.wage),0);
  if(!top||p.wage<=top*1.35)return;
  const over=p.wage/top;
  const hit=-clamp(Math.round((over-1.35)*45),4,20);
  const mor=SW.get('morale');
  const grumps=others.sort((a,b)=>b.wage-a.wage).slice(0,6);
  if(mor&&typeof mor.adjust==='function')
    grumps.forEach(x=>{try{mor.adjust(x.id,hit,'new signing on far more than him')}catch(e){}});
  else grumps.forEach(x=>{x.morale=clamp((x.morale||50)+hit,0,100)});
  note('The dressing room has done the maths',
    p.name+' is on '+money(p.wage)+'/wk. Nobody else is close, and they all know it now.',{from:vV('staff')});
}

/* ---------- charge an agent ---------- */
function charge(fee,who,why){
  const c=me();
  if(fee<=0)return true;
  if(c.bal<fee){
    const took=Math.max(0,c.bal);
    c.bal-=took;
    note("The agent got paid, you didn't",
      who+"'s man took "+money(took)+" — everything left in the account. "+why,{from:vV('staff')});
    return false;
  }
  c.bal-=fee;
  st().feeSeason+=fee;
  return true;
}

/* ============================================================
   RENEWALS
   ============================================================ */
function apply(p,terms){
  const c=me();
  const t=terms||demand(p,c);
  const fee=t.fee!==undefined?t.fee:Math.round(t.wage*52*agentOf(p).fee);
  if(!afford(fee)){
    sheet(`<h3>No</h3><div class="sh-sub">His agent wants ${money(fee)} to sign it and you have ${money(c.bal)}.
      You cannot pay for the pen, never mind the player.</div>
     <button class="btn ghost" onclick="closeSheet();render()">Close</button>`);
    return false;
  }
  charge(fee,p.name,'');
  p.wage=t.wage;p.years=t.years;
  const s=st();
  if(t.clause)s.clauses[p.id]=t.clause;else delete s.clauses[p.id];
  delete s.pre[p.id];delete s.pushed[p.id];
  s.deals[p.id]={w:p.wage,y:p.years,cl:t.clause||0,s:G.season};
  if(!s.known.includes(p.id))s.known.push(p.id);
  return true;
}

window.ctrRenew=function(pid){
  const c=me(),p=c.squad.find(x=>x.id===pid);
  if(!p)return;
  const t=demand(p,c),ag=t.agent,m=mLeft(p);
  const s=st(),pushed=!!s.pushed[pid];
  const fair=t.wage<=wageFor(p)*1.30;
  const cur=p.wage;
  const push=Math.max(1000,Math.round(t.wage*0.86/1000)*1000);
  const pushFee=Math.round(push*52*ag.fee);
  const ratioAfter=Math.min(160,Math.round((wageBill(c)-cur+t.wage)*52/revenue(c)*100));
  sheet(`${speakerBar(vH(ag.name,'agent','eng',52),vP(p),'for',ag.d)}
   <h3>${esc(p.name)}</h3>
   <div class="sh-sub">His agent is ${esc(ag.name)} — ${esc(ag.d)}. ${m<=0?'The deal is up.'
     :m<=6?'Six months or less. He can talk to anyone he likes.':'He has '+m+' months to run.'}</div>
   <div class="card" style="background:var(--s1);margin-bottom:14px">
    <div class="kv"><span class="k2">On now</span><span class="v2">${money(cur)}/wk · ${p.years} yr${p.years===1?'':'s'}</span></div>
    <div class="kv"><span class="k2">He wants</span><span class="v2" style="color:${fair?'var(--t1)':'var(--inj)'}">${money(t.wage)}/wk · ${t.years} yrs</span></div>
    ${t.clause?`<div class="kv"><span class="k2">Release clause</span>
      <span class="v2" style="color:var(--trf)">${money(t.clause)}</span></div>`:''}
    <div class="kv"><span class="k2">Agent's cut</span><span class="v2">${money(t.fee)}</span></div>
    <div class="kv"><span class="k2">Wage bill after</span>
      <span class="v2" style="color:${ratioAfter>85?'var(--loss)':'var(--t1)'}">${ratioAfter}% of revenue</span></div>
    <div class="kv"><span class="k2">In the bank</span><span class="v2">${money(c.bal)}</span></div></div>
   ${t.clause?`<div class="card" style="border-color:var(--trf);margin-bottom:12px">
     <div style="font-size:13px;color:var(--t2)">Agree the clause and any club that puts ${money(t.clause)} on the table
     takes him. You do not get a say. That is what a clause is.</div></div>`:''}
   <div class="opt ${fair&&afford(t.fee)?'rec':''}" onclick="ctrAccept(${pid})">
     <div><div style="font-weight:600">Give him what he wants</div>
      <div class="dim" style="font-size:12px">${money(t.wage)}/wk over ${t.years} years${t.clause?', clause included':''}</div></div>
     ${fair&&afford(t.fee)?'<span class="st">Do it</span>':''}</div>
   ${pushed?'':`<div class="opt ${!fair&&afford(pushFee)?'rec':''}" onclick="ctrPush(${pid})">
     <div><div style="font-weight:600">Push back</div>
      <div class="dim" style="font-size:12px">${money(push)}/wk, no more. He may walk out of the room.</div></div>
     ${!fair&&afford(pushFee)?'<span class="st">Worth it</span>':''}</div>`}
   <div class="opt" onclick="ctrWalk(${pid})">
     <div><div style="font-weight:600">Leave it</div>
      <div class="dim" style="font-size:12px">${pushed?'You have already pushed once. He is not moving.'
        :'Nothing changes. He gets six months closer to the door.'}</div></div></div>`);
};

window.ctrAccept=function(pid){
  const p=me().squad.find(x=>x.id===pid);if(!p)return;
  const t=demand(p,me());
  if(!apply(p,t))return;
  save();
  sheet(`<div class="slab" style="margin-bottom:14px"><div class="k">Signed on</div>
    <div class="v" style="font-size:26px;line-height:29px">${esc(p.name)}</div>
    <div class="d">${money(p.wage)}/wk to ${G.season+p.years}${t.clause?' · clause '+money(t.clause):''}</div></div>
   <div class="card" style="background:var(--s1);margin-bottom:14px"><div style="font-size:13px;color:var(--t2)">
    ${esc(t.agent.name)} took ${money(t.fee)} for the phone calls. That is the game.</div></div>
   <button class="btn" onclick="closeSheet();render()">Done</button>`);
  chron(p.name+' signed a new deal to '+(G.season+p.years));
};

window.ctrPush=function(pid){
  const c=me(),p=c.squad.find(x=>x.id===pid);if(!p)return;
  const t=demand(p,c),ag=t.agent;
  const push=Math.max(1000,Math.round(t.wage*0.86/1000)*1000);
  const chance=clamp(0.64-ag.stub*0.48-(p.amb-50)/300,0.10,0.75);
  const s=st();
  if(rnd()<chance){
    const dropCl=t.clause&&rnd()<0.5;
    const terms={wage:push,years:t.years,clause:dropCl?0:t.clause,
      fee:Math.round(push*52*ag.fee),agent:ag};
    if(!apply(p,terms))return;
    save();
    sheet(`${speakerBar(vH(ag.name,'agent','eng',52),vP(p),'for',ag.d)}
     <h3>He blinked</h3>
     <div class="sh-sub">${esc(ag.name)} looked at the door, looked at the offer, and signed.
       ${money(push)}/wk over ${t.years} years${dropCl?'. No clause.':t.clause?'. The clause stays at '+money(t.clause)+'.':''}</div>
     <button class="btn" onclick="closeSheet();render()">Done</button>`);
    chron(p.name+' signed a new deal to '+(G.season+p.years));
    return;
  }
  s.pushed[pid]=true;
  const hit=-clamp(Math.round(8+(p.amb-40)/6),6,22);
  const mor=SW.get('morale');
  if(mor&&typeof mor.adjust==='function'){try{mor.adjust(p.id,hit,'his renewal was low-balled')}catch(e){}}
  else p.morale=clamp((p.morale||50)+hit,0,100);
  save();
  sheet(`${speakerBar(vH(ag.name,'agent','eng',52),vP(p),'for',ag.d)}
   <h3>He walked out</h3>
   <div class="sh-sub">${esc(ag.name)} put his coat on before you finished the sentence.
     ${esc(p.name)} is not happy and the number has gone up, not down.</div>
   <div class="card" style="background:var(--s1);margin-bottom:14px"><div style="font-size:13px;color:var(--t2)">
    He will listen once more, at his price. Push again and there is nothing left to push.</div></div>
   <button class="btn" onclick="ctrRenew(${pid})">Look at it again</button>
   <button class="btn ghost" style="margin-top:8px" onclick="closeSheet();render()">Leave him to it</button>`);
  note(p.name+' turned the offer down','His agent says the club is not serious. He is six months closer to leaving.',{from:vH(ag.name,'agent','eng',52),about:vP(p),rel:'for'});
};

window.ctrWalk=function(){closeSheet();render()};

/* ============================================================
   FREE AGENTS
   ============================================================ */
function newFA(base,age){
  const p=makePlayer(pick(['GK','CB','FB','DM','CM','AM','W','ST']),
    clamp(Math.round(base+gauss(0,7)),24,84),'eng',age);
  const s=st();
  p.id=s.nextFA++;
  p.youth=false;p.listed=false;p.years=0;p.apps=0;p.goals=0;p.assists=0;p.ratings=[];
  p.form=0;p.cond=ri(72,94);p.morale=ri(25,55);p.out=0;p.free=true;p.idle=0;
  p.wage=wageFor(p);
  return p;
}
function seedPool(){
  const s=st();
  const n=ri(9,13);
  for(let i=0;i<n;i++){
    const good=rnd()<0.22;
    s.pool.push(newFA(good?ri(58,70):ri(40,56),ri(good?26:29,35)));
  }
}
function faWage(p){return Math.max(1000,Math.round(wageFor(p)*1.22/1000)*1000)}
function faFee(p){return Math.round(faWage(p)*52*agentOf(p).fee*1.30)}

window.ctrFree=function(pid){
  const s=st(),p=s.pool.find(x=>x.id===pid);if(!p)return;
  const c=me(),ag=agentOf(p),w=faWage(p),fee=faFee(p);
  const ratioAfter=Math.min(160,Math.round((wageBill(c)+w)*52/revenue(c)*100));
  const blocked=costRatio(c)>85;
  sheet(`<div class="row" style="margin-bottom:14px;align-items:flex-start;gap:13px">${avatar(vP(p),76)}
    <div style="min-width:0"><h3 style="margin:0">${esc(p.name)}</h3>
     <div class="dim" style="font-size:13px">${p.pos} · ${p.age} · ${p.nat.toUpperCase()} · unattached</div></div>
    <span class="spacer"></span>
    <div style="font-weight:700;font-size:30px;color:${ramp(CA(p))}">${Math.round(CA(p))}</div></div>
   <div class="sh-sub">No fee. He knows that, and so does his agent, so the wage is the price.</div>
   <div class="card" style="background:var(--s1);margin-bottom:14px">
    <div class="kv"><span class="k2">Wage</span><span class="v2">${money(w)}/wk</span></div>
    <div class="kv"><span class="k2">Length</span><span class="v2">${p.age>=32?1:p.age>=29?2:3} yrs</span></div>
    <div class="kv"><span class="k2">Agent (${esc(ag.name)})</span><span class="v2">${money(fee)}</span></div>
    <div class="kv"><span class="k2">Wage bill after</span>
      <span class="v2" style="color:${ratioAfter>85?'var(--loss)':'var(--t1)'}">${ratioAfter}%</span></div>
    <div class="kv"><span class="k2">In the bank</span><span class="v2">${money(c.bal)}</span></div></div>
   ${blocked?`<div class="card" style="border-color:var(--loss);margin-bottom:12px">
     <div style="font-size:13px;color:var(--t2)">Your wage bill is ${costRatio(c)}% of revenue.
     Over 85% you cannot register anyone. Get under it first.</div></div>`:''}
   ${blocked?'':`<div class="opt ${afford(fee)?'rec':''}" onclick="ctrSignFree(${pid})">
     <div><div style="font-weight:600">Sign him</div>
      <div class="dim" style="font-size:12px">${money(w)}/wk${afford(fee)?'':' — you cannot cover the agent'}</div></div>
     ${afford(fee)?'<span class="st">Free</span>':''}</div>`}
   <div class="opt" onclick="closeSheet();render()">
     <div><div style="font-weight:600">Leave him</div>
      <div class="dim" style="font-size:12px">He is free for a reason. Somebody else can find out why.</div></div></div>`);
};

window.ctrSignFree=function(pid){
  const s=st(),c=me(),i=s.pool.findIndex(x=>x.id===pid);
  if(i<0)return;
  const p=s.pool[i];
  if(costRatio(c)>85){
    sheet(`<h3>Blocked</h3><div class="sh-sub">Wage bill is ${costRatio(c)}% of revenue. Nothing gets registered over 85%.</div>
     <button class="btn ghost" onclick="closeSheet();render()">Close</button>`);
    return;
  }
  const w=faWage(p),fee=faFee(p);
  if(!afford(fee)){
    sheet(`<h3>No</h3><div class="sh-sub">His agent wants ${money(fee)} and you have ${money(c.bal)}. He is free, the agent is not.</div>
     <button class="btn ghost" onclick="closeSheet();render()">Close</button>`);
    return;
  }
  charge(fee,p.name,'');
  s.pool.splice(i,1);
  p.wage=w;p.years=p.age>=32?1:p.age>=29?2:3;p.free=false;p.morale=58;p.cond=Math.max(p.cond,80);
  c.squad.push(p);
  s.known.push(p.id);
  s.deals[p.id]={w:p.wage,y:p.years,cl:0,s:G.season};
  autoXI(c);
  wageShock(p);
  note('Signed '+p.name+' on a free',money(w)+'/wk over '+p.years+' years. '+money(fee)+' to the agent.',{from:vC(me()),about:vP(p),rel:'sign'});
  chron('Signed '+p.name+' on a free transfer');
  save();
  sheet(`<div class="slab" style="margin-bottom:14px"><div class="k">Free transfer</div>
    <div class="v" style="font-size:26px;line-height:29px">${esc(p.name)}</div>
    <div class="d">${p.pos} · ${p.age} · ability ${Math.round(CA(p))}</div></div>
   <button class="btn" onclick="closeSheet();render()">Continue</button>`);
};

/* ============================================================
   RELEASE CLAUSES — a rival pays it, you have no say
   ============================================================ */
function clauseWatch(){
  const s=st(),c=me();
  if(!windowOpen())return;
  const ids=Object.keys(s.clauses);
  if(!ids.length)return;
  for(const key of ids){
    const pid=+key;
    const p=c.squad.find(x=>x.id===pid);
    if(!p){delete s.clauses[key];continue}
    const cl=s.clauses[key];
    if(rnd()>0.14)continue;
    const buyers=G.clubs.filter(b=>b.id!==G.me&&b.bal>=cl&&b.rep>=c.rep-4
      &&squadOf(b).filter(x=>x.pos===p.pos).length<4);
    if(!buyers.length)continue;
    const b=pick(buyers);
    const wage=Math.round(p.wage*1.20/1000)*1000;
    delete s.clauses[key];delete s.deals[key];delete s.pre[key];
    s.known=s.known.filter(x=>x!==pid);
    doTransfer(p,c,b,cl,wage);
    note(p.name+' is gone',
      b.name+' paid the release clause. '+money(cl)+', and you had no say in it. You agreed that clause.',{from:vV('staff'),about:vP(p),rel:'on'});
    chron(p.name+' left for '+b.name+' — release clause triggered');
    return;  // one a week, not a fire sale
  }
}

/* ============================================================
   BOSMAN — inside six months he can talk to anyone
   ============================================================ */
function bosmanWatch(){
  const s=st(),c=me();
  squadOf(c).forEach(p=>{
    if(s.pre[p.id]!==undefined)return;
    if(p.years>1||mLeft(p)>6)return;
    if(!s.warned[p.id]){
      s.warned[p.id]=true;
      note(p.name+' can talk to anyone now',
        'Six months left. Any club in Europe can sit down with him and you cannot stop it.',{from:vV('staff'),about:vP(p),rel:'on'});
    }
    if(mLeft(p)>3)return;
    if(rnd()>0.03+p.amb/3500)return;
    const suit=G.clubs.filter(b=>b.id!==G.me&&b.rep>=c.rep-2);
    if(!suit.length)return;
    const b=pick(suit);
    s.pre[p.id]=b.id;
    note(p.name+' has agreed terms elsewhere',
      b.name+' have him on a pre-contract. He plays out the season and then he is theirs for nothing.',{from:vV('staff'),about:vP(p),rel:'on'});
  });
}

/* ============================================================
   SEASON END
   ============================================================ */
function myExpiries(){
  const s=st(),c=me();
  const out=c.squad.filter(p=>!p.youth&&p.years<=1);
  out.forEach(p=>{
    c.squad=c.squad.filter(x=>x.id!==p.id);
    s.known=s.known.filter(x=>x!==p.id);
    delete s.clauses[p.id];delete s.deals[p.id];delete s.pushed[p.id];
    const to=s.pre[p.id];
    delete s.pre[p.id];
    if(to!==undefined&&G.clubs[to]){
      const b=G.clubs[to];
      p.wage=Math.round(wageFor(p)*1.15);p.years=ri(2,4);p.listed=false;p.morale=60;
      b.squad.push(p);
      note(p.name+' has gone',b.name+' get him for nothing. You had all season to sort it.',{from:vC(b),about:vP(p),rel:'took'});
      chron(p.name+' left on a free to '+b.name);
    } else {
      releaseToPool(p);
      note(p.name+"'s deal is up",'Nobody offered him anything, including you. He is out of the building.',{from:vV('staff'),about:vP(p),rel:'on'});
    }
  });
  if(out.length)autoXI(c);
}
function releaseToPool(p){
  const s=st();
  p.free=true;p.years=0;p.listed=false;p.youth=false;p.idle=0;
  p.apps=0;p.goals=0;p.assists=0;p.ratings=[];p.form=0;p.out=0;
  p.wage=wageFor(p);
  s.pool.push(p);
}
/* AI clubs renew quietly, or the whole world dissolves in three seasons */
function aiRenewals(){
  const s=st();
  G.clubs.forEach(c=>{
    if(c.id===G.me)return;
    const up=c.squad.filter(p=>!p.youth&&p.years<=1);
    let released=0;
    up.forEach(p=>{
      const surplus=squadOf(c).length>21;
      const dross=CA(p)<c.rep*0.55+30;
      if(surplus&&released<2&&(p.age>=33||dross)&&rnd()<0.45){
        c.squad=c.squad.filter(x=>x.id!==p.id);
        released++;
        if(s.pool.length<44)releaseToPool(p);
        return;
      }
      p.years=p.age>=33?2:ri(2,5);
      p.wage=Math.max(1000,Math.round(wageFor(p)*(1+(hash(p.id)%9)/100)/1000)*1000);
    });
    // youth on expiry just get rolled over
    c.squad.filter(p=>p.youth&&p.years<=1).forEach(p=>{p.years=ri(2,4)});
  });
}
function agePool(){
  const s=st();
  s.pool.forEach(p=>{p.age++;p.idle=(p.idle||0)+1;p.wage=wageFor(p);p.cond=95});
  s.pool=s.pool.filter(p=>p.age<37&&p.idle<3);
  const want=ri(3,6);
  for(let i=0;i<want&&s.pool.length<40;i++)s.pool.push(newFA(rnd()<0.2?ri(58,68):ri(40,56),ri(27,34)));
  s.pool.sort((a,b)=>CA(b)-CA(a));
  if(s.pool.length>40)s.pool.length=40;
}

/* ============================================================
   ARRIVALS — the core transfer path pays no agent, so we do
   ============================================================ */
function arrivals(){
  const s=st(),c=me();
  const ids=squadOf(c).map(p=>p.id);
  const fresh=ids.filter(id=>!s.known.includes(id));
  s.known=ids.slice();
  if(!fresh.length)return;
  fresh.forEach(id=>{
    const p=c.squad.find(x=>x.id===id);
    if(!p)return;
    if(!s.deals[id])s.deals[id]={w:p.wage,y:p.years,cl:0,s:G.season};
    const ag=agentOf(p);
    const fee=Math.round(p.wage*52*ag.fee);
    if(fee<=0)return;
    const ok=charge(fee,p.name,'');
    if(ok)note("Agent's fee — "+p.name,
      money(fee)+' to '+ag.name+'. It never shows up in the transfer figure.',{from:vH(agentOf(p).name,'agent','eng',52),about:vP(p),rel:'for'});
    wageShock(p);
  });
}

/* ============================================================
   THE SUB-VIEW
   ============================================================ */
function renderView(){
  const c=me(),s=st();
  const list=squadOf(c).slice().sort((a,b)=>{
    const d=mLeft(a)-mLeft(b);
    return d!==0?d:CA(b)-CA(a);
  });
  const ratio=costRatio(c),bill=wageBill(c);
  const soon=list.filter(p=>mLeft(p)<=6).length;
  const pool=s.pool.slice().sort((a,b)=>CA(b)-CA(a));

  const row=p=>{
    const m=mLeft(p),u=urg(m),cl=s.clauses[p.id],pre=s.pre[p.id];
    return `<div class="plr" onclick="showPlayer(${p.id})">
     ${pface(p,36)}
     <div class="pos">${p.pos}</div>
     <div class="nmw"><div class="nm2">${esc(p.name)}
       ${cl?`<span class="pill" style="background:#0E2340;color:var(--trf)">clause ${money(cl)}</span>`:''}
       ${pre!==undefined?`<span class="pill" style="background:#3A1C12;color:var(--inj)">agreed elsewhere</span>`:''}</div>
      <div class="meta"><span>${p.age}</span><span>${money(p.wage)}/wk</span>
       <span style="color:${u.c};font-weight:700">${u.l}</span></div></div>
     <button class="btn ${u.s>=2?'':'ghost'} xs" style="min-height:44px;margin-left:6px"
       onclick="event.stopPropagation();ctrRenew(${p.id})">Renew</button></div>`;
  };

  const faRow=p=>`<div class="plr" onclick="ctrFree(${p.id})">
     ${pface(p,36)}
     <div class="pos">${p.pos}</div>
     <div class="nmw"><div class="nm2">${esc(p.name)}</div>
      <div class="meta"><span class="flag">${p.nat}</span><span>${p.age}</span>
       <span style="color:var(--win)">FREE</span><span>${money(faWage(p))}/wk</span></div></div>
     <div class="ca" style="color:${ramp(CA(p))}">${Math.round(CA(p))}</div>
     <button class="btn ghost xs" style="min-height:44px;margin-left:6px"
       onclick="event.stopPropagation();ctrFree(${p.id})">Look</button></div>`;

  return `<div class="card" style="margin-bottom:10px">
    <div class="row"><span class="muted">Weekly wage bill</span><span class="spacer"></span>
      <span class="disp" style="font-weight:800;font-size:20px">${money(bill)}</span></div>
    <div class="row" style="margin-top:8px"><span class="muted">Wages vs revenue</span><span class="spacer"></span>
      <span style="font-weight:700;font-size:20px;color:${ratio>85?'var(--loss)':ratio>72?'var(--acc)':'var(--win)'}">${ratio}%</span></div>
    <div style="height:8px;background:var(--s3);border-radius:4px;margin:11px 0 8px;overflow:hidden;position:relative">
      <div style="height:100%;width:${Math.min(100,ratio/1.6)}%;background:${ratio>85?'var(--loss)':'var(--acc)'}"></div>
      <div style="position:absolute;left:${85/1.6}%;top:-3px;bottom:-3px;width:2px;background:var(--t1)"></div></div>
    <div style="font-size:12px;color:var(--t3)">Cap is 85%. Past it nothing gets registered.
      ${soon?soon+' player'+(soon===1?' is':'s are')+' inside six months — they can talk to anyone.':'Nobody is inside six months.'}
      ${s.feeSeason?' Agents have taken '+money(s.feeSeason)+' this season.':''}</div></div>
   <div class="sechead">By expiry<span class="n">${list.length}</span></div>
   <div class="card" style="padding:6px 14px 12px">
    ${list.length?list.map(row).join(''):'<div class="dim" style="padding:14px 0">No senior squad.</div>'}</div>
   <div class="sechead">Free agents<span class="n">${pool.length}</span></div>
   <div class="card" style="margin-bottom:10px"><div style="font-size:13px;color:var(--t2)">
    Out of contract, no fee, available now — window open or shut. They want more per week for it,
    and their agents want paying.</div></div>
   <div class="card" style="padding:6px 14px 12px">
    ${pool.length?pool.slice(0,18).map(faRow).join(''):'<div class="dim" style="padding:14px 0">Nobody worth a phone call.</div>'}</div>`;
}

window.ctrGo=function(){G.squadView='contracts';go('squad')};

/* ============================================================
   REGISTER
   ============================================================ */
SW.register({
  id:'contracts',

  init(){
    const s=st();
    s.deals={};s.clauses={};s.pre={};s.pool=[];s.pushed={};s.nextFA=900001;s.feeSeason=0;s.warned={};
    s.known=squadOf(me()).map(p=>p.id);
    seedPool();
    // a few of your own already have clauses in their deals — inherited, not agreed by you
    squadOf(me()).forEach(p=>{
      const ag=agentOf(p);
      if((hash(p.id*13+1)%100)/100<ag.clause*0.45)
        s.clauses[p.id]=Math.max(1e6,Math.round(value(p)*1.55/5e5)*5e5);
      s.deals[p.id]={w:p.wage,y:p.years,cl:s.clauses[p.id]||0,s:G.season};
    });
  },

  onLoad(){
    const s=st();
    if(!Array.isArray(s.pool))s.pool=[];
    /* The core used to rebuild the world from seed on load, so this mirror was
       the only record of agreed terms. The core now persists wages and contract
       length itself and is authoritative — re-stamping here overwrote correct
       values with stale ones. Only fill genuine gaps. */
    G.clubs.forEach(c=>c.squad.forEach(p=>{
      const d=s.deals[p.id];
      if(d){ if(!p.wage)p.wage=d.w; if(!p.years)p.years=d.y; }
    }));
    s.known=squadOf(me()).map(p=>p.id);
    autoXI(me());
  },

  onWeek(){
    try{
      arrivals();
      clauseWatch();
      if(G.week>=19)bosmanWatch();
    }catch(e){console.error('[contracts.onWeek]',e)}
  },

  onSeasonEndBefore(){
    try{ myExpiries(); aiRenewals(); }
    catch(e){console.error('[contracts.onSeasonEndBefore]',e)}
  },

  onSeasonEndAfter(){
    try{
      const s=st();
      s.feeSeason=0;s.pushed={};s.warned={};
      agePool();
      // keep our record in step with the core's ageing/renewals
      s.deals={};
      squadOf(me()).forEach(p=>{s.deals[p.id]={w:p.wage,y:p.years,cl:s.clauses[p.id]||0,s:G.season}});
      s.known=squadOf(me()).map(p=>p.id);
      Object.keys(s.clauses).forEach(k=>{if(!me().squad.some(p=>p.id===+k))delete s.clauses[k]});
      const risk=squadOf(me()).filter(p=>p.years<=1);
      if(risk.length)note(risk.length+' deal'+(risk.length===1?'':'s')+' up in June',
        risk.slice(0,3).map(p=>p.name).join(', ')+(risk.length>3?' and '+(risk.length-3)+' more':'')+
        '. Sort them or lose them for nothing.',{from:vV('staff')});
    }catch(e){console.error('[contracts.onSeasonEndAfter]',e)}
  },

  hubCards(){
    const c=me();if(!c||!c.xi)return[];
    const risk=c.xi.map(x=>x&&x.p).filter(p=>p&&p.years<=1&&mLeft(p)<=3);
    if(!risk.length)return[];
    risk.sort((a,b)=>CA(b)-CA(a));
    const p=risk[0],pre=st().pre[p.id]!==undefined;
    const gone=risk.filter(x=>st().pre[x.id]!==undefined).length;
    return [{ic:'✎',bg:'var(--accw)',col:'var(--acc)',
      a:risk.length===1?p.name+' walks in June':risk.length+' of your XI are out of contract',
      b:risk.length===1?(pre?'He has already agreed a move elsewhere. Too late.'
          :'Weeks left, no new deal, no fee coming.')
        :(gone?gone+' have already agreed moves. Save the rest.'
          :'Sort them now or lose the lot for nothing.'),
      fn:'ctrGo()',priority:70}];
  },

  squadViews(){ return [{key:'contracts',label:'Contracts',render:renderView}] },

  playerBlocks(p,cl){
    if(!p||cl.id!==G.me||p.youth)return[];
    const s=st(),m=mLeft(p),u=urg(m),clz=s.clauses[p.id],ag=agentOf(p);
    return [`<div class="card" style="margin-top:10px;background:var(--s1)">
      <div class="kv" style="border-top:0"><span class="k2">Contract</span>
        <span class="v2" style="color:${u.c}">${u.l}</span></div>
      <div class="kv"><span class="k2">Agent</span><span class="v2">${esc(ag.name)}</span></div>
      ${clz?`<div class="kv"><span class="k2">Release clause</span>
        <span class="v2" style="color:var(--trf)">${money(clz)}</span></div>`:''}
      ${s.pre[p.id]!==undefined?`<div class="kv"><span class="k2">Status</span>
        <span class="v2" style="color:var(--inj)">Pre-agreed a move</span></div>`:''}
      <button class="btn sm" style="margin-top:10px" onclick="ctrRenew(${p.id})">Talk to his agent</button></div>`];
  },

  /* ---------- published interface ---------- */
  expiring(club,months){
    const c=club||me();
    if(!c||!c.squad)return[];
    const lim=months===undefined?6:months;
    return squadOf(c).filter(p=>mLeft(p)<=lim).sort((a,b)=>mLeft(a)-mLeft(b));
  },
  renew(playerId,terms){
    const c=me();
    const p=c.squad.find(x=>x.id===playerId);
    if(!p)return false;
    const t=terms?Object.assign({},demand(p,c),terms):demand(p,c);
    if(terms&&terms.wage!==undefined&&terms.fee===undefined)
      t.fee=Math.round(t.wage*52*agentOf(p).fee);
    if(!afford(t.fee))return false;
    const ok=apply(p,t);
    if(ok)save();
    return !!ok;
  },
  /* handy for other modules, not part of the contract */
  clauseOf(playerId){return st().clauses[playerId]||0},
  freeAgents(){return st().pool.slice()}
});

})();
