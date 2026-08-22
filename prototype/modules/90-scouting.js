/* ============================================================
   SILVERWARE — module 9: SCOUTING
   The scout network, the reports, and the whole mechanism by which
   the player learns anything about a footballer he does not own.

   The rule this module exists to protect: potential and personality
   are hidden. You find out in November. That is the story.

   Published for other modules:
     knowledge(id)        -> 0..1
     reveal(id, what)     -> 'potential' | 'trait'
     reportFor(id)        -> written text or null
     label(id[, p])       -> "74" | "≈74" | "70–85" | "??"   (O(1), list-safe)
   ============================================================ */
(function(){
'use strict';

/* ---------- constants ---------- */
var MAXS   = 5;                       // five scouts, no more
var KCAP   = 0.97;                    // only owning him gets you to 1
var REG    = Object.keys(NATIONS);    // eng esp ger ita fra
var ATT    = ['Pace','Technical','Vision','Finishing','Defending','Physical','Composure'];
var ATTG   = ['Reflexes','Handling','Distribution','Command','Positioning','Physical','Composure'];
var STAR   = ['','★☆☆☆☆','★★☆☆☆','★★★☆☆','★★★★☆','★★★★★'];

/* ---------- state ---------- */
function st(){
  var s = SW.state('scouting');
  if(!s.sc){
    s.sc=[]; s.k={}; s.rep={}; s.nm={}; s.unread=[]; s.cand=[];
    s.nid=1; s.gem=null; s.spend=0; s.seeded=false;
  }
  return s;
}

/* ---------- deterministic noise — NEVER touches RND ----------
   label() runs inside list renders. Consuming rnd() there would
   desync every save. This hash gives each (scout,player) pair a
   stable opinion instead.                                        */
function h2(a,b){
  var x = (Math.imul(a|0,374761393) + Math.imul(b|0,668265263))|0;
  x = Math.imul(x ^ (x>>>13), 1274126177)|0;
  return ((x ^ (x>>>16))>>>0) / 4294967296;
}

/* ---------- player index (id -> player), rebuilt at most once per epoch ---------- */
var IDX=null, REBUILT=false;
function idx(){
  if(IDX) return IDX;
  IDX = new Map();
  var cs=G.clubs;
  for(var i=0;i<cs.length;i++){
    var sq=cs[i].squad;
    for(var j=0;j<sq.length;j++) IDX.set(sq[j].id, sq[j]);
  }
  return IDX;
}
function pOf(id){
  var p = idx().get(id);
  if(!p && !REBUILT){ REBUILT=true; IDX=null; p = idx().get(id); }
  return p || null;
}
function clubOf(id){
  var cs=G.clubs;
  for(var i=0;i<cs.length;i++) if(cs[i].squad.some(function(x){return x.id===id})) return cs[i];
  return null;
}

/* ---------- "is he already mine" set — O(1) per row ---------- */
var MS=null, MSarr=null, MSlen=0;
function mineSet(){
  var c = me(); if(!c) return null;
  if(MS && MSarr===c.squad && MSlen===c.squad.length) return MS;
  MS = new Set(); var sq=c.squad;
  for(var i=0;i<sq.length;i++) if(!sq[i].youth) MS.add(sq[i].id);   // kids are NOT known
  MSarr=c.squad; MSlen=sq.length;
  return MS;
}
function invalidate(){ MS=null; IDX=null; REBUILT=false; LAB=Object.create(null); RKEY=''; }

/* ---------- label memo ---------- */
var LAB=Object.create(null);

/* ============================================================
   KNOWLEDGE
   ============================================================ */
function knowledge(id){
  var ms = mineSet();
  if(ms && ms.has(id)) return 1;
  var v = st().k[id];
  return v===undefined ? 0.02 : v;
}
function learn(id,gain){
  var s=st(), v=s.k[id];
  if(v===undefined) v=0.02;
  s.k[id] = Math.min(KCAP, v + gain*(1 - v*0.45));
  LAB=Object.create(null);
  return s.k[id];
}

/* ---------- the estimate: what a given scout THINKS he is ----------
   Bias is per scout and stable per player, so an optimist
   consistently talks the same lad up. That is the feature.        */
function estOf(sc,p,k){
  var skill = 0.35 + 0.13*sc.q;                       // .48 .. 1.00
  var spread = 13*(1 - skill*0.78)*(1.10 - k*0.45);
  var t = h2(sc.id*31+7, p.id);
  var err = sc.bias*7.5*(1-skill*0.5) + (t-0.5)*2*spread;
  return CA(p) + err;
}
function ceilOf(sc,p,k){
  var t = h2(sc.id*97+11, p.id);
  var skill = 0.35 + 0.13*sc.q;
  var spread = 16*(1 - skill*0.70)*(1.15 - k*0.5);
  return p.pa + sc.bias*9*(1-skill*0.45) + (t-0.5)*2*spread;
}
/* no scout on him at all: the trade's vague common opinion */
function looseEst(p,k){
  return CA(p) + (h2(7,p.id)-0.5)*2*(16*(1-k));
}

/* ============================================================
   LABEL — called for dozens of rows. Keep it boring and cheap.
   ============================================================ */
function label(id,p){
  var m = LAB[id];
  if(m!==undefined) return m;
  var k = knowledge(id);
  var out;
  if(k>=0.92){
    p = p || pOf(id);
    out = p ? String(Math.round(CA(p))) : '??';
  }else if(k<0.15){
    p = p || pOf(id);
    if(!p){ out='??'; }
    else {
      var e0 = looseEst(p,k);
      var w0 = Math.ceil(16*(1-k))+1;          // covers the worst-case bias: truth stays inside
      out = Math.max(1,Math.round(e0-w0)) + '\u2013' + Math.min(99,Math.round(e0+w0));
    }
  }else{
    var s=st(), r=s.rep[id], e;
    if(r) e = r.est;
    else { p = p || pOf(id); e = p ? looseEst(p,k) : 0; }
    if(!e){ out='??'; }
    else if(k>=0.60){ out = '≈' + Math.round(e); }
    else {
      var w = Math.round(2 + 9*(1-k));
      out = Math.max(1,Math.round(e-w)) + '–' + Math.round(e+w);
    }
  }
  LAB[id]=out;
  return out;
}

/* ---------- the ceiling, always in words or a band, never raw pa ---------- */
function ceilLabel(id,p){
  var k = knowledge(id);
  p = p || pOf(id); if(!p) return 'Nobody has watched him.';
  var s=st(), r=s.rep[id];
  var c = r ? r.ceil : p.pa + (h2(13,p.id)-0.5)*2*18*(1-k);
  var e = r ? r.est : (k>=0.9 ? CA(p) : looseEst(p,k));
  var gap = c - e;
  if(k>=0.82){
    var w = Math.round(2 + 5*(1-k));
    return 'Ceiling around ' + Math.round(c-w) + '–' + Math.round(c+w) +
      (gap<3 ? '. He is about there already.' : '.');
  }
  if(k<0.2) return 'No idea. Nobody has watched him properly.';
  if(p.age>=31) return 'Whatever is left, it is behind him.';
  if(gap>=14) return 'There is a lot more in him.';
  if(gap>=7)  return 'Not the finished article.';
  if(gap>=3)  return 'A bit more to come, not much.';
  return 'What you see is what you get.';
}

/* ============================================================
   REVEAL — this module and only this module
   ============================================================ */
function reveal(id,what){
  var p = pOf(id); if(!p) return false;
  var s = st();
  if(what==='trait'){
    if(!p.trait) return false;
    p.traitKnown = true;
    if(!s.traits) s.traits={};
    s.traits[id] = p.trait;          // so it survives save(); load()
    return true;
  }
  if(what==='potential'){
    learn(id, Math.max(0, 0.75 - knowledge(id)));
    return true;
  }
  return false;
}
function reportFor(id){ var r = st().rep[id]; return r ? r.text : null; }
function estimateOf(id){
  var k=knowledge(id), p=pOf(id);
  if(!p)return null;
  if(k>=0.92)return Math.round(CA(p));
  var r=st().rep[id];
  return Math.round(r ? r.est : looseEst(p,k));
}

/* ============================================================
   SCOUTS
   ============================================================ */
function wageOf(q){ return 900 + q*q*420; }        // £1.3k .. £11.4k a week
function makeScout(){
  var s=st();
  var nat = pick(REG);
  var q = pick([1,2,2,3,3,3,4,4,5]);
  return { id:s.nid++, name:personName(nat), nat:nat, q:q, wage:wageOf(q),
           bias: clamp(gauss(0,0.55),-1.1,1.1), asg:null, done:0 };
}
function refreshCand(){
  var s=st(); s.cand=[];
  for(var i=0;i<3;i++) s.cand.push(makeScout());
}
function biasHint(sc){
  if(sc.done<4) return '';
  if(sc.bias>=0.38) return 'Talks them up';
  if(sc.bias<=-0.38) return 'Hard to please';
  return 'Reads them straight';
}
function weeksFor(sc,kind){
  if(kind==='player') return Math.max(2, 6-sc.q);
  if(kind==='youth')  return Math.max(2, 5-sc.q);
  if(kind==='brief')  return Math.max(3, 7-sc.q);
  return Math.max(3, 8-sc.q);
}

/* ---------- wages come off the transfer budget, and never past zero ---------- */
function payWages(){
  var s=st(), c=me(); if(!c || !s.sc.length) return;
  var bill=0; for(var i=0;i<s.sc.length;i++) bill += s.sc[i].wage;
  if(bill<=0) return;
  if(c.bal >= bill){ c.bal -= bill; s.spend += bill; return; }
  /* can't cover it — the most expensive man walks. Balance never goes red. */
  s.sc.sort(function(a,b){return b.wage-a.wage});
  var gone = s.sc.shift();
  if(gone) note('You could not pay ' + gone.name,
    'The budget will not cover the network. He has gone to work for somebody who pays. ' +
    (s.sc.length ? s.sc.length + ' scout' + (s.sc.length>1?'s':'') + ' left.' : 'You have nobody out there now.'), {from:vH(gone.name,'scout',gone.nat,52)});
  bill = 0; for(var j=0;j<s.sc.length;j++) bill += s.sc[j].wage;
  if(c.bal>=bill){ c.bal-=bill; s.spend+=bill; }
}

/* ============================================================
   WRITING THE REPORT — a person who watched three games,
   not a stat dump.
   ============================================================ */
var OPEN=[
  'Three games in {w} weeks. Here is where I am.',
  'Watched him three times, twice away. Short version below.',
  'I have seen enough of him now. This is honest.',
  'Four trips, two of them wasted. He was worth the other two.',
  'Sat through ninety minutes of him three times. Notes as follows.'
];
var GOOD={
  Pace:'He is quick. Not track quick — football quick, first ten yards, and it is the first thing you notice.',
  Technical:'The touch is the best thing about him. Nothing bounces off him.',
  Vision:'He sees the pass a beat before everyone else on the pitch does.',
  Finishing:'Give him a yard and it is in the net. He does not need two chances.',
  Defending:'He defends like he means it. Front foot, no fuss, no diving in.',
  Physical:'Big unit. Wins what he goes for and he is still standing at ninety.',
  Composure:'Nothing gets to him. Same face at 0–0 as at 2–1 down.',
  Reflexes:'His hands are quick. Twice he has saved things he had no business reaching.',
  Handling:'Catches everything. In that weather, in that league, that matters.',
  Distribution:'He starts attacks. Throws it out flat and it sticks.',
  Command:'He owns his box. You can hear him from the away end.',
  Positioning:'He is always stood where the ball ends up. That is not luck.'
};
var BAD={
  Pace:'He is not quick. Get him turned and he is in real trouble.',
  Technical:'First touch lets him down when the pitch gets tight.',
  Vision:'He does not see anything beyond the obvious ball.',
  Finishing:'In front of goal he thinks about it far too long.',
  Defending:'He does not want to defend. Do not build a plan that asks him to.',
  Physical:'He gets bullied. Two months in a gym might sort it. Might not.',
  Composure:'He panics. Big crowd, big game, he shrinks.',
  Reflexes:'Slow off his line, slow to the low ones.',
  Handling:'He spills things. Once a game, and once a game is too often.',
  Distribution:'His kicking is a giveaway waiting to happen.',
  Command:'He stays on his line and lets people head it.',
  Positioning:'He guesses. Sometimes he guesses right.'
};
var VERDICT_UP=[
  'I would take him tomorrow.','Sign him. You will not get him cheaper than this.',
  'If you want him you move now, because two others were at the same game as me.'
];
var VERDICT_OK=[
  'He would not embarrass you. He would not change much either.',
  'Squad player. Useful in February, not the answer.',
  'Fine. Only fine. Your call whether fine is what you are shopping for.'
];
var VERDICT_NO=[
  'Not for us. I would look elsewhere.','I would not spend a penny on him.',
  'You can do better with that money and you know it.'
];

function writeReport(sc,p,cl,k,gem){
  var lab = (p.pos==='GK') ? ATTG : ATT;
  var hi=0, lo=0;
  for(var i=1;i<7;i++){ if(p.a[i]>p.a[hi]) hi=i; if(p.a[i]<p.a[lo]) lo=i; }
  var est = estOf(sc,p,k), ceil = ceilOf(sc,p,k);
  var xi = me() && me().xi.length ? me().xi.reduce(function(a,x){return a+CA(x.p,x.slot)},0)/me().xi.length : 60;

  var out = [];
  out.push(OPEN[Math.floor(h2(sc.id,p.id)*OPEN.length)].replace('{w}', 2+Math.floor(h2(p.id,sc.id)*4)));
  out.push(GOOD[lab[hi]] || 'He has one real strength and he leans on it.');
  if(k>=0.35) out.push(BAD[lab[lo]] || 'There is a hole in his game and everybody has found it.');

  /* the ceiling read — words, never the raw number */
  var gap = ceil - est;
  if(p.age>=31) out.push('He is ' + p.age + '. Whatever is left in him, it is not growth.');
  else if(gap>=14) out.push('And he is nowhere near done. Coach him properly and he ends up somewhere a lot better than ' + cl.name + '.');
  else if(gap>=7) out.push('He is not finished yet. Two years and he is a different player.');
  else if(gap>=3) out.push('There is a bit more in him. Not a lot.');
  else out.push('What you are watching is what you are buying. He is done growing.');

  /* personality — earned, never numeric */
  if(k>=0.62){
    if(p.prof>=76) out.push('Trains like a professional. First in, last out — his own staff told me that unprompted.');
    else if(p.prof<38) out.push('People at his club rolled their eyes when I said his name. Draw your own conclusion.');
    if(p.cons<44) out.push('One week he is the best player on the grass, the next you would not know he was on it.');
    if(p.inj>=66) out.push('Ask about the hamstring before you sign anything. He has had two.');
  }
  if(k>=0.75){
    if(p.big>=76) out.push('Big nights bring it out of him. I watched him in a derby and he ran it.');
    else if(p.big<34) out.push('I watched him hide in a derby. Make of that what you will.');
    if(p.amb>=80) out.push('He wants more than that club. He will move for the right badge.');
  }
  if(k>=0.8 && p.trait && !p.traitKnown) out.push('One more thing, and I would stake my job on it: ' + traitLine(p.trait));

  if(gem) out.push('And nobody is watching him. That is the part that keeps me up.');
  var pool = est >= xi+3 ? VERDICT_UP : est >= xi-5 ? VERDICT_OK : VERDICT_NO;
  out.push(pool[Math.floor(h2(sc.id*3,p.id*5)*pool.length)]);

  return { text: out.join(' '), est: est, ceil: ceil, sc: sc.id, scn: sc.name,
           w: G.week, nm: p.name, cl: cl.name, gem: !!gem };
}
function traitLine(t){
  var m = {
    'Big-game player':'he is a big-game player, and you do not teach that.',
    'Bottler':'he is a bottler. When it matters he will not be there.',
    'Injury prone':'his body will let you down, repeatedly.',
    'Model professional':'he is a model professional. Everyone else will be better for having him about.',
    'Mercenary':'he is a mercenary. He goes wherever the money is and he will do it to you too.',
    'Loyal servant':'he is loyal. Treat him right and he stays for ten years.',
    'Late bloomer':'he is a late bloomer. Do not judge him at 22.',
    'Dressing-room leader':'he runs a dressing room. Give him the armband eventually.',
    'Hot-headed':'he is hot-headed. You will lose him to red cards.',
    'Fan favourite':'the crowd will love him within a month.'
  };
  return m[t] || ('the word on him is: ' + t.toLowerCase() + '.');
}

/* ============================================================
   ASSIGNMENTS
   ============================================================ */
function assign(scoutId,kind,arg){
  var s=st(), sc=s.sc.find(function(x){return x.id===scoutId}); if(!sc) return;
  sc.asg = { kind:kind, nat: kind==='region' ? arg : sc.nat, pid: kind==='player' ? arg : 0,
             left: weeksFor(sc,kind), tot: weeksFor(sc,kind) };
}

function tick(){
  var s=st(); if(!s.sc.length) return;
  for(var i=0;i<s.sc.length;i++){
    var sc=s.sc[i]; if(!sc.asg) continue;
    if(sc.asg.kind==='brief'){
      var bb=briefById(sc.asg.bid);
      if(!bb){ sc.asg=null; defaultJob(sc); continue; }
      briefWeek(sc,bb);                      // he is out watching every week he is on it
    }
    sc.asg.left--;
    if(sc.asg.left<=0){
      var a=sc.asg; sc.asg=null; sc.done++;
      complete(sc,a);
      /* competent default: back on the brief if there is one, else his own patch.
         Disagreeing with that — re-tasking him — is the player's job. */
      if(!sc.asg){ if(a.kind==='brief' && briefById(a.bid)) toBrief(sc.id,a.bid); else defaultJob(sc); }
    }
  }
}

function complete(sc,a){
  if(a.kind==='player') return doPlayer(sc,a.pid);
  if(a.kind==='youth')  return doYouth(sc);
  if(a.kind==='brief')  return doBrief(sc,a.bid);
  return doRegion(sc,a.nat);
}

function doPlayer(sc,pid){
  var p = pOf(pid); if(!p) return;
  var cl = clubOf(pid); if(!cl) return;
  var k = learn(pid, 0.34 + sc.q*0.12);      // one man, watched properly
  file(sc,p,cl,k,false);
}

function doRegion(sc,nat){
  var s=st(), c=me(); if(!c) return;
  var pool=[];
  for(var i=0;i<G.clubs.length;i++){
    var cl=G.clubs[i]; if(cl.nat!==nat || cl.id===G.me) continue;
    var sq=squadOf(cl);
    for(var j=0;j<sq.length;j++){
      var p=sq[j];
      if(knowledge(p.id)>=0.72) continue;
      if(value(p) > c.bal*1.9) continue;
      /* a sweep files on somebody you could sign. Anything else is a postcard. */
      if(!reachOf({p:p, s:cl}).ok) continue;
      pool.push({p:p,cl:cl});
    }
  }
  if(!pool.length){
    note(sc.name + ' came back with nothing',
      'Three weeks in ' + NATIONS[nat].name + '. Plenty of footballers. Not one of them we could pay for and ' +
      'not one of them who would come. It happens.', {from:vH(sc.name,'scout',sc.nat,52)});
    return;
  }
  /* broad sweep: the whole trip teaches you a little about everyone */
  var sweep = Math.min(pool.length, 6+sc.q*2);
  for(var w=0;w<sweep;w++){
    var idxp = Math.floor(rnd()*pool.length);
    learn(pool[idxp].p.id, 0.04 + sc.q*0.012);
  }
  /* the hidden gem — undervalued, unwatched, somewhere nobody looks */
  var gemHit = null;
  var cool = (s.lastGem===undefined) || (G.week - s.lastGem) >= 11 || G.week < s.lastGem;
  if(cool && rnd() < 0.035 + sc.q*0.018){
    var gems = pool.filter(function(x){
      return x.p.age<=23 && (x.p.pa - CA(x.p))>=13 && (x.cl.tier>0 || x.cl.nat!==c.nat)
        && value(x.p) <= Math.max(c.bal*0.9, 1.2e6);
    });
    if(gems.length) gemHit = gems[Math.floor(rnd()*gems.length)];
  }
  var target = gemHit || bestOf(sc,pool);
  var k = learn(target.p.id, 0.16 + sc.q*0.08);   // a sweep finds him, it does not settle him
  file(sc, target.p, target.cl, k, !!gemHit);
}

/* what the scout himself rates highest — biased, so he may pick the wrong man */
function bestOf(sc,pool){
  var best=pool[0], bv=-1e9;
  for(var i=0;i<pool.length;i++){
    var p=pool[i].p;
    var v = estOf(sc,p,knowledge(p.id)) + Math.max(0,(28-p.age))*0.8 - Math.max(0,(p.age-29))*4.0;
    if(v>bv){ bv=v; best=pool[i]; }
  }
  return best;
}

function doYouth(sc){
  var c=me(); if(!c) return;
  var kids = c.squad.filter(function(p){return p.youth});
  if(!kids.length){
    note(sc.name + ' has nothing to look at', 'The academy is empty. Intake comes at the end of the season.',
      {from:vH(sc.name,'scout',sc.nat,52)});
    return;
  }
  for(var i=0;i<kids.length;i++) learn(kids[i].id, 0.22 + sc.q*0.09);
  var pickKid = kids[0], bv=-1e9;
  for(var j=0;j<kids.length;j++){
    var v = ceilOf(sc,kids[j],knowledge(kids[j].id));
    if(v>bv){ bv=v; pickKid=kids[j]; }
  }
  var k = learn(pickKid.id, 0.16 + sc.q*0.08);
  file(sc, pickKid, c, k, false);
}

/* ---------- file it: report + inbox + unread queue ---------- */
function file(sc,p,cl,k,gem){
  var s=st();
  var r = writeReport(sc,p,cl,k,gem);
  r.scnat = sc.nat;                    // so his face survives him leaving
  s.rep[p.id] = r;
  s.nm[p.id] = p.name;
  if(s.unread.indexOf(p.id)<0) s.unread.push(p.id);
  if(k>=0.8 && p.trait) reveal(p.id,'trait');
  LAB=Object.create(null);

  if(gem){
    s.gem = p.id; s.lastGem = G.week;
    if(G.shortlist.indexOf(p.id)<0) G.shortlist.push(p.id);
    note(sc.name + ' has found somebody',
      p.name + ', ' + p.pos + ', ' + p.age + ', at ' + cl.name + '. ' +
      '"Nobody is watching him and I do not understand why." Roughly ' + money(value(p)) + '. He is on your shortlist.', {from:vH(sc.name,'scout',sc.nat,52), about:vP(p), rel:'found'});
    chron(sc.name + ' found ' + p.name + ' at ' + cl.name);
  }else{
    note('Report in: ' + p.name,
      sc.name + ' has filed on ' + p.pos + ', ' + p.age + ', ' + cl.name + '. ' + label(p.id,p) + ' by his reckoning.', {from:vH(sc.name,'scout',sc.nat,52), about:vP(p), rel:'on'});
  }
}

/* ============================================================
   PURSUABLE — the precondition, not another filter

   A 93 at a giant club is a fact. It is not a prospect. Before a
   name is put in front of the manager it has to survive three
   questions, in this order:

     1. can we pay the fee                  (ask <= budget)
     2. can we carry the wage               (cost ratio, with room left)
     3. will he actually come               (willingness, not price)

   Every brief is defaulted to that. The manager who wants to look
   at the unreachable ones can ask — it is a chip, and it is off.
   ============================================================ */
var GREED_MAX = 1.30;    // the worst agent in the game. The scout budgets for him.
var HEADROOM  = 3;       // cost-ratio points a signing must still leave behind it

/* the wage ceiling the board agreed, if the market module is here to say */
function wageCap(){
  var m = SW.get('market');
  if(m && typeof m.wageCeiling==='function'){
    try{ var v = m.wageCeiling(); if(v>0) return v; }catch(e){}
  }
  return 85;
}
/* What he would want. Deliberately the pessimistic read: assume his agent is
   the greediest in the game, so a man the scout calls affordable never turns
   out not to be at the table. Mirrors the market module's own terms(). */
function wageEst(p, seller){
  var c = me(); if(!c || !seller) return Infinity;
  var base  = (typeof wageFor==='function') ? wageFor(p,c) : p.wage;
  var floor = Math.max(base, Math.round(p.wage*0.96));
  var m = 1.05;
  m += (p.amb-55)/100*0.28;
  m += clamp((seller.rep-c.rep)/40,-0.10,0.45);     // coming down costs you
  m -= clamp((c.rep-seller.rep)/70,0,0.12);         // a step up shaves it
  if(p.age<=22) m-=0.05; else if(p.age>=32) m-=0.08;
  m *= GREED_MAX;
  return Math.max(1000, Math.round(floor*clamp(m,0.92,1.70)/1000)*1000);
}
function ratioWith(w){
  var c=me(); if(!c || typeof wageBill!=='function' || typeof revenue!=='function') return 0;
  return Math.min(160, Math.round((wageBill(c)+w)*52/revenue(c)*100));
}

/* ---------- will he come ----------
   Price is not the same question as willingness. A man who will not drop a
   level is not a prospect at any price, and the scout knows that before the
   agent ever picks the phone up. */
function willJoin(p, seller){
  var c = me(); if(!c || !seller) return {ok:true};
  var m = SW.get('market');
  if(m && typeof m.willJoin==='function'){
    try{ var r = m.willJoin(p.id); if(r && typeof r.ok==='boolean') return r; }catch(e){}
  }
  if(typeof playerWillJoin==='function'){
    try{
      var w = playerWillJoin(p,seller,c);
      if(w && w.ok===false) return {ok:false, why: w.msg || 'He will not come.'};
    }catch(e){}
  }
  /* the reasons the negotiating table gives, read a month early */
  var gap = seller.rep - c.rep;
  var lg  = (typeof myLeague==='function' && myLeague()) ? myLeague().name : 'this division';
  var floorCA = (c.xi && c.xi.length)
    ? c.xi.reduce(function(a,x){return a+CA(x.p,x.slot)},0)/c.xi.length : 50;
  if(seller.tier < c.tier && p.amb>50 && CA(p)>=floorCA-2)
    return {ok:false, why:'He is not dropping to ' + lg + '.'};
  if(gap>19 && p.amb>58)
    return {ok:false, why:'He has bigger clubs than you asking, and his man has told him so.'};
  var ahead = squadOf(c).filter(function(x){ return x.pos===p.pos && CA(x)>=CA(p); }).length;
  if(ahead>=3 && p.amb>48)
    return {ok:false, why:'He wants to play. You have three ahead of him in that position.'};
  if(p.age<=23 && (p.pa-CA(p))>=14 && gap>10)
    return {ok:false, why:'He is ' + p.age + ' with everything in front of him. He is not spending it here.'};
  return {ok:true};
}

/* ---------- the verdict, memoised for the epoch ---------- */
var RCH=Object.create(null), RKEY='';
function reachOf(x){
  var c=me(); if(!c || !x || !x.p || !x.s) return {ok:true};
  var key = G.season + '|' + G.week + '|' + c.bal + '|' + c.squad.length;
  if(RKEY!==key){ RKEY=key; RCH=Object.create(null); }
  var hit = RCH[x.p.id];
  if(hit!==undefined) return hit;
  var out = reachCalc(x);
  RCH[x.p.id] = out;
  return out;
}
function reachCalc(x){
  var c=me(), p=x.p, s=x.s;
  var ask = (x.ask!==undefined) ? x.ask
          : (typeof askingPrice==='function' ? askingPrice(p,s,c) : value(p));
  if(ask > c.bal)
    return {ok:false, k:'fee', ask:ask, why: money(ask-c.bal) + ' more than you have.'};
  var w = wageEst(p,s), r1 = ratioWith(w), cap = wageCap();
  if(r1 > cap - HEADROOM)
    return {ok:false, k:'wage', ask:ask, wage:w,
            why:'His wages take you to ' + r1 + '% of revenue. The cap is ' + Math.round(cap) + '.'};
  var will = willJoin(p,s);
  if(!will.ok)
    return {ok:false, k:'will', ask:ask, wage:w, why: will.why || will.msg || 'He will not come.'};
  return {ok:true, ask:ask, wage:w, ratio:r1};
}
/* the one line a manager needs on any outsider */
function reachLine(p, cl){
  var c=me(); if(!c || !cl || cl.id===G.me) return '';
  var r = reachOf({p:p, s:cl});
  if(r.ok) return 'Gettable. ' + money(r.ask) + ' and about ' + money(r.wage) + '/wk.';
  return 'Out of reach. ' + r.why;
}

/* ============================================================
   RECRUITMENT BRIEFS
   "I need a left-footed centre-half under 25 for under half the
   budget." You say it once; the network works it every week.
   A brief uses the SAME vocabulary as the market filters — the
   chips you filter with are the chips you brief with — and it is
   run through the core's own mktFilter so the two never disagree.
   ============================================================ */
var MAXB  = 3;
var POSN  = {GK:'goalkeeper',CB:'centre-half',FB:'full-back',DM:'holding midfielder',CM:'midfielder',
             AM:'number ten',W:'winger',ST:'striker'};
var POSL  = ['GK','CB','FB','DM','CM','AM','W','ST'];
var BOPT  = {
  ageBand:[['ALL','Any age'],['U21','Under 21'],['U24','Under 24'],['U27','Under 27'],['27+','27 and over']],
  price:[['Budget','Within budget'],['Half','Half budget'],['Quarter','Quarter budget'],['Free','Free agents'],['ALL','Any price']],
  reach:[['CAN','Only men we can sign'],['ALL','Show me anyone']],
  minCA:[[0,'Any level'],[60,'60+'],[70,'70+'],[78,'78+'],[85,'85+']],
  foot:[['ALL','Any foot'],['R','Right'],['L','Left'],['B','Both']],
  height:[['ALL','Any height'],['Tall','Tall (186+)'],['Average','Average'],['Short','Short (175-)']],
  strong:[[-1,'Anything']].concat(ATT.map(function(n,i){return [i,n]}))
};
function briefDef(pos){
  /* reach:'CAN' is the default and it is the point of the whole thing —
     a brief comes back with men you can sign, or it comes back empty. */
  return { pos:pos||'ST', ageBand:'U27', price:'Budget', minCA:0, foot:'ALL', height:'ALL',
           nat:'ALL', strong:-1, reach:'CAN' };
}
function briefs(){ var s=st(); if(!s.briefs) s.briefs=[]; return s.briefs; }
function briefById(id){ return briefs().find(function(b){return b.id===id}) || null; }
function briefLine(b){
  var bits=[];
  var ab = BOPT.ageBand.find(function(o){return o[0]===b.ageBand}); if(b.ageBand!=='ALL' && ab) bits.push(ab[1].toLowerCase());
  if(b.foot==='L') bits.push('left-footed'); else if(b.foot==='B') bits.push('two-footed'); else if(b.foot==='R') bits.push('right-footed');
  if(b.height==='Tall') bits.push('tall'); else if(b.height==='Short') bits.push('short');
  bits.push(POSN[b.pos]||b.pos);
  if(b.minCA) bits.push(b.minCA+'+');
  if(b.nat && b.nat!=='ALL' && NATIONS[b.nat]) bits.push('from '+NATIONS[b.nat].name);
  var pr = BOPT.price.find(function(o){return o[0]===b.price}); if(b.price!=='ALL' && pr) bits.push(pr[1].toLowerCase());
  if(b.strong>=0) bits.push('strong '+ATT[b.strong].toLowerCase());
  bits.push(b.reach==='ALL' ? 'anyone, gettable or not' : 'only men we can sign');
  return bits.join(' · ');
}
function briefTitle(b){ return 'The ' + (POSN[b.pos]||b.pos) + ' brief'; }

/* the weakest slot in the formation we actually play */
function weakestPos(){
  var c=me(); if(!c) return 'ST';
  var shape = (typeof SHAPE!=='undefined' && SHAPE[c.formation]) ? SHAPE[c.formation] : null;
  if(!shape) return 'ST';
  if(!c.xi || !c.xi.length){ try{ autoXI(c); }catch(e){} }
  var worst=null, wv=1e9;
  for(var i=0;i<shape.length;i++){
    var x = c.xi && c.xi[i];
    var v = x && x.p ? CA(x.p, shape[i]) : 0;
    if(v<wv){ wv=v; worst=shape[i]; }
  }
  return worst || 'ST';
}
/* nobody has said what they want: the assistant says it for them */
function ensureDefault(){
  var s=st(), bs=briefs();
  if(bs.length) return null;
  var b = briefDef(weakestPos()); b.id = s.nid++; b.auto=true; b.w=G.week; b.s=G.season;
  bs.push(b);
  return b;
}

/* run a brief through the core's filter engine without touching the player's own filters */
function briefMatch(b, pool){
  if(typeof mktFilter==='function' && typeof MKT_DEF!=='undefined'){
    var keep = G.mkt;
    G.mkt = Object.assign({}, MKT_DEF, {pos:b.pos, ageBand:b.ageBand, price:b.price, minCA:b.minCA,
                                        height:b.height, foot:b.foot, nat:b.nat});
    try { return mktFilter(pool); } finally { G.mkt = keep; }
  }
  /* core without a market: the same rules, by hand */
  var A = {ALL:[0,99],'U21':[0,20],'U24':[0,23],'U27':[0,26],'27+':[27,99]}[b.ageBand] || [0,99];
  var H = {ALL:[0,999],'Tall':[186,999],'Average':[176,185],'Short':[0,175]}[b.height] || [0,999];
  var bal = me() ? me().bal : 0;
  var cap = b.price==='Free'?0.0001 : b.price==='Budget'?bal : b.price==='Half'?bal*0.5 : b.price==='Quarter'?bal*0.25 : Infinity;
  return pool.filter(function(x){
    var p=x.p;
    if(b.pos!=='ALL' && p.pos!==b.pos) return false;
    if(p.age<A[0]||p.age>A[1]) return false;
    if((p.height||180)<H[0]||(p.height||180)>H[1]) return false;
    if(b.foot!=='ALL' && (p.foot||'R')!==b.foot) return false;
    if(b.nat!=='ALL' && p.nat!==b.nat) return false;
    if(b.minCA && CA(p)<b.minCA) return false;
    return x.ask<=cap;
  });
}
function basePool(){
  if(typeof scoutPool==='function'){ try{ return scoutPool(); }catch(e){} }
  var out=[], c=me(); if(!c) return out;
  for(var i=0;i<G.clubs.length;i++){
    var cl=G.clubs[i]; if(cl.id===G.me) continue;
    var sq=squadOf(cl);
    for(var j=0;j<sq.length;j++) out.push({p:sq[j], s:cl, ask: typeof askingPrice==='function' ? askingPrice(sq[j],cl,c) : value(sq[j])});
  }
  return out;
}
/* everyone whose SHAPE fits the brief — before anybody asks what he costs */
function briefPool(b, sc){
  var all = briefMatch(b, basePool()).filter(function(x){ return x.s && x.s.id!==G.me; });
  if(b.strong>=0){
    var hard = all.filter(function(x){ return x.p.a[b.strong] >= CA(x.p)+4; });
    if(hard.length>=3) all = hard;
  }
  return all;
}
/* his own patch first, the world if his patch is dry. Applied AFTER the reach
   split, never before it: a man he can actually sign in Spain beats three he
   cannot sign on his doorstep. */
function patch(list, sc){
  if(!sc || !sc.nat) return list;
  var local = list.filter(function(x){ return x.s.nat===sc.nat; });
  return local.length>=3 ? local : list;
}
/* the shape, split by whether we could actually do it */
function briefSplit(b, sc){
  var raw = briefPool(b,sc), ok=[], far=[];
  for(var i=0;i<raw.length;i++){
    if(reachOf(raw[i]).ok) ok.push(raw[i]); else far.push(raw[i]);
  }
  ok = patch(ok, sc);
  return { raw:raw, ok:ok, far:far, all: ok.concat(patch(far, sc)) };
}
/* what the scout will actually put in front of you */
function briefCands(b, sc){
  var sp = briefSplit(b,sc);
  return (b && b.reach==='ALL') ? sp.all : sp.ok;
}
function briefScore(b, sc, x){
  var p=x.p, k=knowledge(p.id);
  var v = estOf(sc,p,k);
  if(b.strong>=0) v += (p.a[b.strong]-CA(p))*0.35;
  v += Math.max(0,(27-p.age))*0.5 - Math.max(0,(p.age-30))*3;
  /* he can rate an unreachable man as highly as he likes. He does not get to
     put him at the top of a list the manager is meant to act on. */
  if(!reachOf(x).ok) v -= 45;
  return v;
}

/* a week on the brief: he is out watching, and a little sticks each time */
function briefWeek(sc, b){
  var c = briefCands(b, sc); if(!c.length) return;
  var n = Math.min(c.length, 2+Math.floor(sc.q/2));
  for(var i=0;i<n;i++){ var x=c[Math.floor(rnd()*c.length)]; learn(x.p.id, 0.03+sc.q*0.008); }
}
/* ---------- the honest empty report ----------
   Never a list of men the manager cannot sign. If there is nothing, he says
   there is nothing, and he says which wall we hit. */
/* the headline names the wall we hit, because that is the only part of an
   empty report a manager can do anything about */
var DRY_FEE  = 'Nothing at that level we can get near. Widen it or find more money.';
var DRY_WAGE = 'We could buy them. We could not pay them. Not on what the board have left us.';
var DRY_WILL = 'They exist and we could afford them. They would not come. That is the honest answer.';
var DRY_MIX  = [
  'Empty. Not because they do not exist — because we cannot have them.',
  'I have been everywhere. There is nobody at that price who would come.'
];
function dryCounts(sp){
  var n={fee:0,wage:0,will:0};
  for(var i=0;i<sp.raw.length;i++){
    var r = reachOf(sp.raw[i]); if(r.ok) continue;
    if(r.k==='fee') n.fee++; else if(r.k==='wage') n.wage++; else n.will++;
  }
  return n;
}
function dryReport(sc, b, sp){
  var n = sp.raw.length;
  if(!n){
    return { n:0, fee:0, wage:0, will:0,
      head:'Nobody in the game answers that brief. Not one.',
      body:'It is not the money. Nothing of that shape exists — drop the ability floor or open the age band.' };
  }
  var cnt = dryCounts(sp), bits=[];
  if(cnt.fee)  bits.push(cnt.fee  + (cnt.fee===1 ?' costs':' cost')   + ' more than you have');
  if(cnt.wage) bits.push(cnt.wage + (cnt.wage===1?' would put':' would put') + ' you over the wage cap');
  if(cnt.will) bits.push(cnt.will + (cnt.will===1?' would not come':' would not come'));
  var tail = bits.length ? bits.join(', ') : 'none of them are gettable';
  var top = Math.max(cnt.fee, cnt.wage, cnt.will), half = n*0.55;
  var head = (cnt.fee===top && cnt.fee>=half)  ? DRY_FEE
           : (cnt.wage===top && cnt.wage>=half) ? DRY_WAGE
           : (cnt.will===top && cnt.will>=half) ? DRY_WILL
           : DRY_MIX[Math.floor(h2(sc.id*17, b.id*5+n)*DRY_MIX.length)];
  return { n:n, fee:cnt.fee, wage:cnt.wage, will:cnt.will, head:head,
    body: n + ' of them fit what you asked for on paper. ' +
          tail.charAt(0).toUpperCase() + tail.slice(1) + '.' };
}
function fileDry(sc, b, sp){
  var s=st();
  var d = dryReport(sc,b,sp);
  var rep = { id:s.nid++, bid:b.id, sc:sc.id, scn:sc.name, scnat:sc.nat, w:G.week, s:G.season,
              picks:[], dry:d, open:d.head };
  if(!s.brep) s.brep=[];
  s.brep = s.brep.filter(function(r){ return r.bid!==b.id; });
  s.brep.push(rep);
  b.unread = true; b.dry = G.week;
  note(sc.name + ' has nothing for the ' + (POSN[b.pos]||b.pos) + ' brief',
    d.head + ' ' + d.body, {from:vH(sc.name,'scout',sc.nat,52)});
}

/* the deliverable: three men, in his words, every one of them on brief
   AND every one of them a man you could actually sign */
function doBrief(sc, bid){
  var s=st(), b=briefById(bid); if(!b) return;
  var sp = briefSplit(b, sc);
  var c = (b.reach==='ALL') ? sp.all : sp.ok;
  if(!c.length){ fileDry(sc,b,sp); return; }
  var sweep = Math.min(c.length, 4+sc.q);
  for(var w=0;w<sweep;w++){ var x=c[Math.floor(rnd()*c.length)]; learn(x.p.id, 0.05+sc.q*0.012); }
  /* men we already know inside out are not news; look past them when there is anyone else */
  var fresh = c.filter(function(x){ return knowledge(x.p.id) < 0.85; });
  if(fresh.length>=3) c = fresh;
  c.sort(function(p1,p2){ return briefScore(b,sc,p2)-briefScore(b,sc,p1); });
  var top = c.slice(0,3), picks=[];
  var prev = briefReport(bid);
  if(prev && prev.picks.length===top.length && top.every(function(x){ return prev.picks.some(function(pk){return pk.pid===x.p.id}); })){
    /* same three men as last time: he keeps watching them, he does not keep writing */
    for(var j=0;j<top.length;j++) learn(top[j].p.id, 0.12 + sc.q*0.04);
    b.still = G.week;
    return;
  }
  for(var i=0;i<top.length;i++){
    var p=top[i].p, cl=top[i].s;
    var k = learn(p.id, 0.30 + sc.q*0.08 - i*0.04);
    var r = writeReport(sc,p,cl,k,false); r.scnat=sc.nat; r.brief=bid;
    s.rep[p.id]=r; s.nm[p.id]=p.name;
    if(k>=0.8 && p.trait) reveal(p.id,'trait');
    var rr = reachOf(top[i]);
    picks.push({ pid:p.id, nm:p.name, cl:cl.name, line:briefPickLine(sc,p,cl,i,k,rr),
                 ask:rr.ask, wg:rr.wage||0, far:!rr.ok, why:rr.ok?'':rr.why });
  }
  LAB=Object.create(null);
  var nFar = picks.filter(function(pk){return pk.far}).length;
  var rep = { id:s.nid++, bid:bid, sc:sc.id, scn:sc.name, scnat:sc.nat, w:G.week, s:G.season,
              picks:picks, blocked:sp.far.length,
              open: nFar===picks.length
                ? 'You told me to show you anyone, so here they are. I would not ring one of them.'
                : nFar
                ? briefOpen(sc,b,picks.length-nFar) + ' The rest you cannot have, and I have said why.'
                : briefOpen(sc,b,picks.length) };
  if(!s.brep) s.brep=[];
  s.brep = s.brep.filter(function(r){ return r.bid!==bid; });   // one live report per brief
  s.brep.push(rep);
  b.unread = true; b.dry = undefined;
  var first = picks[0];
  note(sc.name + ' has ' + (picks.length===1?'one man':picks.length+' men') + ' for the ' + (POSN[b.pos]||b.pos) + ' brief',
    rep.open + ' ' + first.line, {from:vH(sc.name,'scout',sc.nat,52), about:vP(top[0].p), rel:'on'});
}
function briefOpen(sc,b,n){
  var pool = [
    'You asked for a {p}. I have {n}.',
    'The {p} brief. {N} names, and I would put my name to all of them.',
    'Went looking for a {p}. {N} worth your time, the rest were not.',
    'Here is your {p}. {N} of them, in the order I would ring them.'
  ];
  var t = pool[Math.floor(h2(sc.id*11, b.id*7+n)*pool.length)];
  var nw = n===1?'one':n===2?'two':'three';
  return t.replace('{p}', POSN[b.pos]||b.pos).replace('{n}', nw).replace('{N}', nw.charAt(0).toUpperCase()+nw.slice(1));
}
function briefPickLine(sc,p,cl,rank,k,rr){
  var lab = (p.pos==='GK') ? ATTG : ATT;
  var hi=0; for(var i=1;i<7;i++) if(p.a[i]>p.a[hi]) hi=i;
  var g = GOOD[lab[hi]] || 'He has one real strength and he leans on it.';
  var far = rr && !rr.ok;
  var lead = far ? 'You asked to see them anyway: '
           : rank===0 ? 'First choice: ' : rank===1 ? 'If he says no, ' : 'Third man, ';
  var tail = far ? ' I would not waste the phone call — ' + rr.why
           : rank===0 ? '' : (k>=0.5 ? ' Nothing wrong with him either.' : ' I have seen less of him.');
  return lead + p.name + ' at ' + cl.name + ', ' + p.age + '. ' + g + tail;
}
function briefReport(bid){ var s=st(); return (s.brep||[]).find(function(r){return r.bid===bid}) || null; }

/* all scouts on a brief, and how to put one there */
function onBrief(bid){ return st().sc.filter(function(x){return x.asg && x.asg.kind==='brief' && x.asg.bid===bid}); }
function toBrief(scoutId, bid){
  var s=st(), sc=s.sc.find(function(x){return x.id===scoutId}); if(!sc || !briefById(bid)) return;
  sc.asg = { kind:'brief', bid:bid, nat:sc.nat, pid:0, left:weeksFor(sc,'brief'), tot:weeksFor(sc,'brief') };
}
/* a scout with nothing to do goes to the brief that has nobody on it; else his own patch */
function defaultJob(sc){
  var bs=briefs();
  if(bs.length){
    var bare = bs.slice().sort(function(a,b){ return onBrief(a.id).length - onBrief(b.id).length; })[0];
    toBrief(sc.id, bare.id); return;
  }
  assign(sc.id,'region',sc.nat);
}
function removeBrief(bid){
  var s=st();
  s.briefs = briefs().filter(function(b){return b.id!==bid});
  if(s.brep) s.brep = s.brep.filter(function(r){return r.bid!==bid});
  if(s.draft && s.draft.id===bid) s.draft=null;
  s.sc.forEach(function(sc){ if(sc.asg && sc.asg.kind==='brief' && sc.asg.bid===bid){ sc.asg=null; defaultJob(sc); } });
}

/* a report whose men have moved on, or a brief nobody can still read, is binned */
function pruneBriefs(){
  var s=st();
  s.briefs = briefs().filter(function(b){ return b && POSN[b.pos]; });
  if(s.brep){
    s.brep = s.brep.filter(function(r){
      if(!briefById(r.bid)) return false;
      if(r.dry) return true;                       // an honest empty report is still a report
      r.picks = r.picks.filter(function(pk){ var p=pOf(pk.pid); return p && p.name===pk.nm; });
      return r.picks.length>0;
    });
  }
  s.sc.forEach(function(sc){ if(sc.asg && sc.asg.kind==='brief' && !briefById(sc.asg.bid)){ sc.asg=null; defaultJob(sc); } });
}

/* ============================================================
   UI
   ============================================================ */
var UI = {
  open: function(){ G.tab='market'; G.marketView='scouts'; closeSheet(); render(); },

  read: function(pid){
    var s=st(), r=s.rep[pid]; if(!r) return;
    var i=s.unread.indexOf(pid); if(i>=0) s.unread.splice(i,1);
    var p=pOf(pid);
    save();
    var scv = vH(r.scn,'scout',r.scnat||'eng',52);
    var pv  = p ? vP(p) : {k:'p',id:pid,n:r.nm,nat:'eng',age:24,mo:0,r:'',a:'#2A3038',b:'#1A1F26'};
    sheet(
      speakerBar(scv, pv, 'filed on', r.cl + ' \u00b7 ' + agoTxt(r.w)) +
      '<h3>' + esc(r.nm) + '</h3>' +
      '<div class="sh-sub">' + esc(r.scn) + ' · ' + esc(r.cl) + ' · filed ' + agoTxt(r.w) + '</div>' +
      (r.gem ? '<div class="slab" style="margin-bottom:12px"><div class="k">He found one</div>' +
        '<div class="v" style="font-size:24px;line-height:27px">' + esc(r.nm) + '</div>' +
        '<div class="d">Nobody else is watching. That will not last.</div></div>' : '') +
      '<div class="card" style="background:var(--s1);font-size:14px;line-height:21px;color:var(--t1)">' +
        esc(r.text) + '</div>' +
      '<div class="card" style="margin-top:10px;background:var(--s1)">' +
        kv('His read on him', label(pid,p)) +
        kv('Ceiling', ceilLabel(pid,p)) +
        kv('How well we know him', Math.round(knowledge(pid)*100) + '%') +
      '</div>' +
      (p ? '<button class="btn" style="margin-top:14px" onclick="closeSheet();showPlayer(' + pid + ')">Open his profile</button>' : '') +
      '<button class="btn ghost" style="margin-top:8px" onclick="closeSheet();render()">Done</button>'
    );
  },

  /* ----- recruitment briefs ----- */
  brief: function(bid){                     // open the builder — new or existing
    var s=st(), b = bid ? briefById(bid) : null;
    if(!b && briefs().length>=MAXB){
      sheet('<h3>Three briefs is the limit</h3><div class="sh-sub">Any more and the network is not looking for anything. Bin one first.</div>' +
        '<button class="btn ghost" onclick="closeSheet();render()">Right</button>');
      return;
    }
    s.draft = b ? Object.assign({}, b) : Object.assign(briefDef(weakestPos()), {id:0});
    UI.briefSheet();
  },
  briefSet: function(k,v){ var s=st(); if(!s.draft) return; s.draft[k]=v; UI.briefSheet(); },
  briefSheet: function(){
    var s=st(), d=s.draft; if(!d) return;
    var isNew = !d.id;
    var chip = function(k,v,l){
      var on = d[k]===v;
      return '<button onclick="SW.get(\'scouting\').ui.briefSet(\'' + k + '\',' + (typeof v==='number'?v:"'"+v+"'") + ')"' +
        ' style="min-height:44px;padding:0 13px;border-radius:11px;cursor:pointer;font-family:var(--ui);font-weight:700;font-size:13px;' +
        'border:1px solid ' + (on?'var(--acc)':'var(--hair)') + ';background:' + (on?'var(--acc)':'var(--s1)') + ';color:' + (on?'var(--tinv)':'var(--t2)') + '">' + esc(l) + '</button>';
    };
    var row = function(label,k,opts){
      return '<div style="margin-bottom:14px"><div style="font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--t3);margin-bottom:7px">' + label + '</div>' +
        '<div class="row" style="gap:6px;flex-wrap:wrap">' + opts.map(function(o){return chip(k,o[0],o[1])}).join('') + '</div></div>';
    };
    var nats = [['ALL','Anywhere']].concat(REG.map(function(n){return [n,NATIONS[n].name]}));
    var weak = weakestPos();
    var cap  = Math.round(wageCap());
    sheet(
      '<h3>' + (isNew ? 'What are we looking for?' : 'Change the brief') + '</h3>' +
      '<div class="sh-sub">' + (d.auto || isNew ? 'Your weakest slot is ' + esc(POSN[weak]||weak) + ', so that is pre-set. ' : '') +
        'Same chips as the market. Tap what matters, then send them.</div>' +
      row('Position','pos',POSL.map(function(p){return [p,p]})) +
      row('Age','ageBand',BOPT.ageBand) +
      row('Price','price',BOPT.price) +
      row('Who to bring back','reach',BOPT.reach) +
      '<div style="font-size:12px;line-height:18px;color:' + (d.reach==='ALL'?'var(--inj)':'var(--t3)') + ';margin:-8px 0 14px">' +
        (d.reach==='ALL'
          ? 'You will get names you cannot sign. He will tell you which ones and why, and he will not put them first.'
          : 'Fee inside ' + money(me()?me().bal:0) + ', wages that still leave you under ' + cap + '% of revenue, and a man who would actually come.') +
      '</div>' +
      row('Minimum ability','minCA',BOPT.minCA) +
      row('Strong at','strong',BOPT.strong) +
      row('Preferred foot','foot',BOPT.foot) +
      row('Height','height',BOPT.height) +
      row('From','nat',nats) +
      '<div class="card" style="background:var(--s1);font-size:13px;color:var(--t2);margin-bottom:10px">' + esc(briefLine(d)) + '</div>' +
      '<button class="btn" onclick="SW.get(\'scouting\').ui.briefSave()">' + (isNew ? 'Send the scouts' : 'Update the brief') + '</button>' +
      '<button class="btn ghost" style="margin-top:8px" onclick="closeSheet();render()">Leave it</button>'
    );
  },
  briefSave: function(){
    var s=st(), d=s.draft; if(!d) return;
    var b = d.id ? briefById(d.id) : null;
    if(b){ Object.assign(b, d); b.auto=false; }
    else {
      if(briefs().length>=MAXB) return;
      d.id = s.nid++; d.auto=false; d.w=G.week; d.s=G.season;
      briefs().push(d); b=d;
      /* somebody goes straight on it: an idle man first, then a regional sweep */
      var free = s.sc.filter(function(x){return !x.asg})[0] ||
                 s.sc.filter(function(x){return x.asg && x.asg.kind==='region'}).sort(function(a,b2){return b2.q-a.q})[0];
      if(!free){
        var crowded = briefs().filter(function(x){return x.id!==b.id && onBrief(x.id).length>1})
          .sort(function(x,y){return onBrief(y.id).length-onBrief(x.id).length})[0];
        if(crowded) free = onBrief(crowded.id).sort(function(a,b2){return b2.q-a.q})[0];
      }
      if(free) toBrief(free.id, b.id);
    }
    s.draft=null;
    save(); closeSheet(); render();
  },
  /* the fanatic's override, offered only where it is useful: he came back empty,
     so he shows you the ones he ruled out and says why he ruled them out. */
  briefAnyway: function(bid){
    var s=st(), b=briefById(bid); if(!b) return;
    b.reach='ALL'; b.auto=false;
    var sc = onBrief(bid)[0] || s.sc[0];
    if(sc){ if(s.brep) s.brep=s.brep.filter(function(r){return r.bid!==bid}); doBrief(sc,bid); }
    save(); closeSheet(); render();
  },
  briefDrop: function(bid){
    var b=briefById(bid); if(!b) return;
    sheet('<h3>Bin ' + esc(briefTitle(b).toLowerCase()) + '?</h3>' +
      '<div class="sh-sub">Anyone on it goes back to his own patch. The report goes too.</div>' +
      '<div class="opt" onclick="SW.get(\'scouting\').ui.briefDropYes(' + bid + ')"><div><div style="font-weight:600">Bin it</div>' +
      '<div class="dim" style="font-size:12px">We are not looking for that any more</div></div></div>' +
      '<button class="btn ghost" style="margin-top:6px" onclick="closeSheet();render()">Keep it</button>');
  },
  briefDropYes: function(bid){ removeBrief(bid); save(); closeSheet(); render(); },
  briefStaff: function(bid){                 // who works it
    var s=st(), b=briefById(bid); if(!b) return;
    if(!s.sc.length){
      sheet('<h3>Nobody to send</h3><div class="sh-sub">You have no scouts. Hire one and he goes straight on it.</div>' +
        '<button class="btn ghost" onclick="closeSheet();render()">Right</button>');
      return;
    }
    var rows = s.sc.map(function(sc){
      var on = sc.asg && sc.asg.kind==='brief' && sc.asg.bid===bid;
      var a=sc.asg;
      var where = !a ? 'Idle' : a.kind==='brief' ? (on ? 'On this brief' : 'On another brief')
                 : a.kind==='youth' ? 'Our academy' : a.kind==='player' ? 'One player' : 'Sweeping ' + NATIONS[a.nat].name;
      return '<div class="opt' + (on?' rec':'') + '" onclick="SW.get(\'scouting\').ui.briefToggle(' + bid + ',' + sc.id + ')">' +
        '<div><div style="font-weight:600">' + esc(sc.name) + ' <span class="dim" style="font-weight:400">' + STAR[sc.q] + '</span></div>' +
        '<div class="dim" style="font-size:12px">' + esc(where) + ' · ' + weeksFor(sc,'brief') + ' weeks to a report</div></div>' +
        (on?'<span class="st">On it</span>':'') + '</div>';
    }).join('');
    sheet('<h3>Who works ' + esc(briefTitle(b).toLowerCase()) + '?</h3>' +
      '<div class="sh-sub">Tap a man to put him on it, tap again to take him off.</div>' + rows +
      '<button class="btn ghost" style="margin-top:6px" onclick="closeSheet();render()">Done</button>');
  },
  briefToggle: function(bid, scoutId){
    var s=st(), sc=s.sc.find(function(x){return x.id===scoutId}); if(!sc) return;
    if(sc.asg && sc.asg.kind==='brief' && sc.asg.bid===bid){ sc.asg=null; assign(sc.id,'region',sc.nat); }
    else toBrief(scoutId, bid);
    save(); UI.briefStaff(bid);
  },
  briefRead: function(bid){
    var b=briefById(bid); if(b){ b.unread=false; save(); }
    G.tab='market'; G.marketView='scouts'; closeSheet(); render();
  },
  briefShort: function(pid){ if(typeof toggleShort==='function') toggleShort(pid); },
  briefBid: function(pid){
    if(typeof sheetBid!=='function') return;
    if(typeof windowOpen==='function' && !windowOpen()){
      sheet('<h3>The window is shut</h3><div class="sh-sub">Shortlist him and come back when it opens.</div>' +
        '<button class="btn" onclick="SW.get(\'scouting\').ui.briefShort(' + pid + ');closeSheet();render()">Shortlist him</button>' +
        '<button class="btn ghost" style="margin-top:8px" onclick="closeSheet();render()">Leave it</button>');
      return;
    }
    sheetBid(pid);
  },

  assign: function(scoutId){
    var s=st(), sc=s.sc.find(function(x){return x.id===scoutId}); if(!sc) return;
    var shortl = G.shortlist.map(function(id){return pOf(id)}).filter(Boolean).slice(0,4);
    var opts = REG.map(function(n){
      return '<div class="opt' + (n===sc.nat?' rec':'') + '" onclick="SW.get(\'scouting\').ui.set(' + scoutId + ',\'region\',\'' + n + '\')">' +
        '<div><div style="font-weight:600">' + esc(NATIONS[n].name) + '</div>' +
        '<div class="dim" style="font-size:12px">Sweep the ' + esc(NATIONS[n].adj.toLowerCase()) + ' game · ' +
        weeksFor(sc,'region') + ' weeks</div></div>' +
        (n===sc.nat?'<span class="st">His patch</span>':'') + '</div>';
    }).join('');
    var youth = '<div class="opt" onclick="SW.get(\'scouting\').ui.set(' + scoutId + ',\'youth\',0)">' +
      '<div><div style="font-weight:600">Our own academy</div>' +
      '<div class="dim" style="font-size:12px">Find out what the kids actually are · ' + weeksFor(sc,'youth') + ' weeks</div></div></div>';
    var named = shortl.map(function(p){
      return '<div class="opt" onclick="SW.get(\'scouting\').ui.set(' + scoutId + ',\'player\',' + p.id + ')">' +
        '<div><div style="font-weight:600">' + esc(p.name) + '</div>' +
        '<div class="dim" style="font-size:12px">Shortlisted · ' + p.pos + ' · ' + weeksFor(sc,'player') + ' weeks, and he comes back sure</div></div></div>';
    }).join('');
    var brs = briefs().map(function(b){
      var on = sc.asg && sc.asg.kind==='brief' && sc.asg.bid===b.id;
      return '<div class="opt' + (on?' rec':'') + '" onclick="SW.get(\'scouting\').ui.set(' + scoutId + ',\'brief\',' + b.id + ')">' +
        '<div><div style="font-weight:600">' + esc(briefTitle(b)) + '</div>' +
        '<div class="dim" style="font-size:12px">' + esc(briefLine(b)) + ' · ' + weeksFor(sc,'brief') + ' weeks</div></div>' +
        (on?'<span class="st">On it</span>':'') + '</div>';
    }).join('');
    sheet(
      speakerBar(vH(sc.name,'scout',sc.nat,52),null,'',STAR[sc.q] + ' \u00b7 ' + money(sc.wage) + '/wk') +
      '<h3>Where do you want ' + esc(sc.name) + '?</h3>' +
      '<div class="sh-sub">' + STAR[sc.q] + ' · ' + money(sc.wage) + '/wk. He will be gone ' +
        weeksFor(sc,'region') + ' weeks on a sweep, ' + weeksFor(sc,'player') + ' on one man.</div>' +
      (brs ? '<div class="sechead" style="margin:0 0 8px">A brief</div>' + brs : '') +
      (named ? '<div class="sechead" style="margin:14px 0 8px">One player</div>' + named : '') +
      '<div class="sechead" style="margin:14px 0 8px">A region</div>' + opts +
      '<div class="sechead" style="margin:14px 0 8px">Home</div>' + youth +
      '<button class="btn ghost" style="margin-top:6px" onclick="closeSheet();render()">Leave him where he is</button>'
    );
  },

  set: function(scoutId,kind,arg){
    if(kind==='brief') toBrief(scoutId,arg); else assign(scoutId,kind,arg);
    save(); closeSheet(); render();
  },

  /* ----- "have him watched": one man, picked by the manager, from anywhere -----
     Every screen where you meet a footballer offers this. It is the answer to
     "I found him myself, now go and look at him properly." */
  watch: function(pid){
    var s=st(), p=pOf(pid); if(!p) return;
    var cl = clubOf(pid);
    if(!s.sc.length){
      sheet('<h3>You have nobody to send</h3>' +
        '<div class="sh-sub">Somebody has to go and watch him. Hire a scout and he can start with ' + esc(p.name) + '.</div>' +
        '<button class="btn" onclick="SW.get(\'scouting\').ui.open()">Go and hire one</button>' +
        '<button class="btn ghost" style="margin-top:8px" onclick="closeSheet();render()">Leave it</button>');
      return;
    }
    var already = s.sc.find(function(x){return x.asg && x.asg.kind==='player' && x.asg.pid===pid});
    if(already){
      sheet(speakerBar(vH(already.name,'scout',already.nat,52), vP(p), 'watching', STAR[already.q]) +
        '<h3>' + esc(already.name) + ' is already on him</h3>' +
        '<div class="sh-sub">' + (already.asg.left<=1 ? 'He files this week.' : already.asg.left + ' more weeks and he files on ' + esc(p.name) + '.') + '</div>' +
        '<button class="btn ghost" onclick="closeSheet();render()">Good</button>');
      return;
    }
    /* an idle man is free; anybody else costs you the job he is halfway through */
    var idle = s.sc.filter(function(x){return !x.asg}).sort(function(a,b){return b.q-a.q});
    var rec  = idle[0] || s.sc.slice().sort(function(a,b){
      var w=function(x){ return !x.asg?0 : x.asg.kind==='region'?1 : x.asg.kind==='youth'?2 : 3; };
      return (w(a)-w(b)) || (b.q-a.q);
    })[0];
    var rows = s.sc.map(function(sc){
      var a=sc.asg;
      var where = !a ? 'Idle' : a.kind==='brief' ? (function(){var bb=briefById(a.bid);return bb?briefTitle(bb):'A brief'})()
                 : a.kind==='youth' ? 'Our academy'
                 : a.kind==='player' ? (function(){var q=pOf(a.pid);return 'Watching ' + (q?q.name:'somebody')})()
                 : 'Sweeping ' + NATIONS[a.nat].name;
      var cost = a ? ' · pulling him off costs you that' : '';
      return '<div class="opt' + (sc.id===(rec&&rec.id)?' rec':'') + '" onclick="SW.get(\'scouting\').ui.watchPick(' + pid + ',' + sc.id + ')">' +
        '<div><div style="font-weight:600">' + esc(sc.name) + ' <span class="dim" style="font-weight:400">' + STAR[sc.q] + '</span></div>' +
        '<div class="dim" style="font-size:12px">' + esc(where) + cost + ' · files in ' + weeksFor(sc,'player') + ' weeks</div></div>' +
        (sc.id===(rec&&rec.id)?'<span class="st">Advised</span>':'') + '</div>';
    }).join('');
    sheet(
      speakerBar(vV('assist'), vP(p), 'watch', (cl?cl.name:'') + (cl?' · ':'') + p.pos + ' · ' + p.age) +
      '<h3>Have ' + esc(p.name) + ' watched</h3>' +
      '<div class="sh-sub">One man goes and sits through him three times, then writes it down. ' +
        'We know him ' + Math.round(knowledge(pid)*100) + '% at the minute.' +
        (cl && cl.id!==G.me ? ' ' + esc(reachLine(p,cl)) : '') + '</div>' + rows +
      '<button class="btn ghost" style="margin-top:6px" onclick="closeSheet();render()">Leave it</button>'
    );
  },
  watchPick: function(pid, scoutId){
    var s=st(), sc=s.sc.find(function(x){return x.id===scoutId}); if(!sc) return;
    var p=pOf(pid); if(!p) return;
    assign(scoutId,'player',pid);
    if(G.shortlist.indexOf(pid)<0 && clubOf(pid) && clubOf(pid).id!==G.me) G.shortlist.push(pid);
    save(); closeSheet(); render();
    sheet(speakerBar(vH(sc.name,'scout',sc.nat,52), vP(p), 'on', STAR[sc.q]) +
      '<h3>' + esc(sc.name) + ' is on him</h3>' +
      '<div class="sh-sub">' + weeksFor(sc,'player') + ' weeks and he files on ' + esc(p.name) + '. ' +
      'He is on your shortlist until then. Waiting is what knowledge costs.</div>' +
      '<button class="btn ghost" onclick="closeSheet();render()">Fine</button>');
  },

  hire: function(cid){
    var s=st(), c=me();
    var cand = s.cand.find(function(x){return x.id===cid}); if(!cand||!c) return;
    if(s.sc.length>=MAXS){
      sheet('<h3>Five is the limit</h3><div class="sh-sub">You are running as many as anyone runs. ' +
        'Let one go first.</div><button class="btn ghost" onclick="closeSheet();render()">Right</button>');
      return;
    }
    var bill=cand.wage; for(var i=0;i<s.sc.length;i++) bill+=s.sc[i].wage;
    if(c.bal < bill*20){
      sheet('<h3>You cannot carry him</h3><div class="sh-sub">' + money(cand.wage) + ' a week on top of what you already pay. ' +
        'The budget will not stand it.</div><button class="btn ghost" onclick="closeSheet();render()">Understood</button>');
      return;
    }
    s.cand = s.cand.filter(function(x){return x.id!==cid});
    cand.asg = null;
    s.sc.push(cand);
    defaultJob(cand);
    s.cand.push(makeScout());
    save(); closeSheet(); render();
    var ja = cand.asg, jb = ja && ja.kind==='brief' ? briefById(ja.bid) : null;
    sheet('<h3>' + esc(cand.name) + ' is yours</h3>' +
      '<div class="sh-sub">' + STAR[cand.q] + ' · ' + money(cand.wage) + '/wk. ' +
      (jb ? 'He has gone straight onto ' + esc(briefTitle(jb).toLowerCase()) + '. First report in ' + weeksFor(cand,'brief') + ' weeks.'
          : 'He has gone straight to ' + esc(NATIONS[cand.nat].name) + '. First report in ' + weeksFor(cand,'region') + ' weeks.') + '</div>' +
      '<button class="btn ghost" onclick="closeSheet();render()">Good</button>');
  },

  drop: function(scoutId){
    var s=st(), sc=s.sc.find(function(x){return x.id===scoutId}); if(!sc) return;
    sheet('<h3>Let ' + esc(sc.name) + ' go?</h3>' +
      '<div class="sh-sub">' + money(sc.wage) + '/wk back in the budget. Anything he is halfway through is lost.</div>' +
      '<div class="opt" onclick="SW.get(\'scouting\').ui.dropYes(' + scoutId + ')"><div>' +
        '<div style="font-weight:600">Let him go</div><div class="dim" style="font-size:12px">Now, today</div></div></div>' +
      '<button class="btn ghost" style="margin-top:6px" onclick="closeSheet();render()">Keep him</button>');
  },
  dropYes: function(scoutId){
    var s=st();
    s.sc = s.sc.filter(function(x){return x.id!==scoutId});
    save(); closeSheet(); render();
  }
};

/* ============================================================
   THE MARKET ROW
   The manager meets footballers in two places: the player sheet and the
   market list. "Have him watched" has to be in both, or it is in neither.
   The core has no hook for an action on a market card, so this wraps the
   card renderer additively — the core still draws the card, we only hang a
   button under it, and if anything at all goes wrong we hand back exactly
   what the core produced. See the report: marketRowActions() is the hook
   this should be once the core grows one.
   ============================================================ */
function watchBtn(pid, wide){
  var s=st();
  var on  = s.sc.some(function(x){return x.asg && x.asg.kind==='player' && x.asg.pid===pid});
  var rep = !!s.rep[pid];
  var lab = on ? 'Being watched' : rep ? 'Read the report' : 'Have him watched';
  var fn  = rep && !on ? "SW.get('scouting').ui.read(" + pid + ")"
                       : "SW.get('scouting').ui.watch(" + pid + ")";
  return '<button class="btn ghost xs" style="min-height:44px' + (wide?';width:100%':'') +
    (on?';color:var(--trf);border-color:var(--trf)':rep?';color:var(--acc)':'') +
    '" onclick="event.stopPropagation();' + fn + '">' + lab + '</button>';
}
function hookMktCard(){
  try{
    if(typeof window.mktCard!=='function' || window.mktCard.__swWatch) return;
    var orig = window.mktCard;
    var wrapped = function(p,s,ask,w){
      var html;
      try{ html = orig(p,s,ask,w); }catch(e){ return ''; }
      try{
        if(!p || !s || s.id===G.me || !st().sc) return html;
        return '<div class="pccell" style="width:' + (w||132) + 'px">' + html + watchBtn(p.id,true) + '</div>';
      }catch(e){ return html; }
    };
    wrapped.__swWatch = true;
    window.mktCard = wrapped;
  }catch(e){}
}

function kv(k,v){ return '<div class="kv"><span class="k2">' + k + '</span><span class="v2">' + esc(String(v)) + '</span></div>'; }
function agoTxt(w){
  var d = G.week - w;
  return d<=0 ? 'this week' : d===1 ? 'last week' : d + ' weeks ago';
}

/* ---------- the briefs: what we are looking for, who is looking, what came back ---------- */
function briefBlock(){
  var s=st(), c=me();
  ensureDefault();
  var bs=briefs();
  var cards = bs.map(function(b){
    var staff = onBrief(b.id);
    var rep = briefReport(b.id);
    var who = staff.length ? staff.map(function(x){return esc(x.name) + (x.asg.left<=1?' (this week)':' ('+x.asg.left+' wks)')}).join(', ')
                           : 'Nobody on it';
    var picks = '';
    if(rep && rep.dry){
      /* the honest empty report — in his voice, with the wall we hit named */
      picks = '<div style="font-size:13px;line-height:19px;margin:10px 0 2px">' +
        '<span style="font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:var(--acc);font-weight:700">' + esc(rep.scn) + ' · ' + agoTxt(rep.w) + '</span><br>' +
        '<span style="color:var(--inj);font-weight:600">' + esc(rep.dry.head) + '</span><br>' +
        '<span style="color:var(--t2)">' + esc(rep.dry.body) + '</span></div>' +
        '<div class="row" style="gap:6px;margin-top:8px">' +
          '<button class="btn ghost xs" style="min-height:36px" onclick="event.stopPropagation();SW.get(\'scouting\').ui.brief(' + b.id + ')">Widen it</button>' +
          (b.reach!=='ALL' && rep.dry.n ? '<button class="btn ghost xs" style="min-height:36px" onclick="event.stopPropagation();SW.get(\'scouting\').ui.briefAnyway(' + b.id + ')">Show me anyone</button>' : '') +
        '</div>';
    } else if(rep){
      picks = '<div style="font-size:13px;line-height:19px;color:var(--t1);margin:10px 0 6px">' +
        '<span style="font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:var(--acc);font-weight:700">' + esc(rep.scn) + ' · ' + agoTxt(rep.w) + '</span><br>' +
        esc(rep.open) + '</div>' +
        rep.picks.map(function(pk){
          var p = pOf(pk.pid); if(!p) return '';
          var cl = clubOf(pk.pid);
          var rr = cl ? reachOf({p:p,s:cl}) : {ok:true, ask:value(p), wage:0};
          var ask = rr.ask!==undefined ? rr.ask
                  : ((cl && c && typeof askingPrice==='function') ? askingPrice(p,cl,c) : value(p));
          var shorted = G.shortlist.indexOf(pk.pid)>=0;
          return '<div class="plr" style="align-items:flex-start;padding:9px 0" onclick="showPlayer(' + pk.pid + ')">' + pface(p,40) +
            '<div class="pos">' + p.pos + '</div>' +
            '<div class="nmw"><div class="nm2">' + esc(p.name) + (rr.ok?'':' <span class="pill" style="font-size:10px;color:var(--inj)">Out of reach</span>') + '</div>' +
            '<div class="meta"><span>' + p.age + '</span><span>' + esc(cl?cl.name:pk.cl) + '</span>' +
              '<span style="color:' + (rr.ok?'var(--trf)':'var(--t3)') + '">' + money(ask) + '</span>' +
              (rr.ok && rr.wage ? '<span style="color:var(--t3)">' + money(rr.wage) + '/wk</span>' : '') + '</div>' +
            '<div style="font-size:12px;line-height:17px;color:var(--t2);margin-top:4px;white-space:normal">' + esc(pk.line) + '</div>' +
            (rr.ok ? '' : '<div style="font-size:12px;line-height:17px;color:var(--inj);margin-top:3px;white-space:normal">' + esc(rr.why) + '</div>') +
            '<div class="row" style="gap:6px;margin-top:6px">' +
              '<button class="btn ' + (shorted?'':'ghost ') + 'xs" style="min-height:36px" onclick="event.stopPropagation();SW.get(\'scouting\').ui.briefShort(' + pk.pid + ')">' + (shorted?'Shortlisted':'Shortlist') + '</button>' +
              (rr.ok ? '<button class="btn xs" style="min-height:36px" onclick="event.stopPropagation();SW.get(\'scouting\').ui.briefBid(' + pk.pid + ')">Bid</button>' : '') +
            '</div></div>' +
            '<div class="ca" style="color:' + ramp(estimateOf(pk.pid)||60) + ';width:auto;font-size:13px">' + label(pk.pid,p) + '</div></div>';
        }).join('');
    } else if(b.dry!==undefined){
      picks = '<div style="font-size:13px;color:var(--inj);margin-top:8px">Nothing we can get near. Widen it.</div>';
    } else if(staff.length){
      picks = '<div style="font-size:13px;color:var(--t3);margin-top:8px">Out looking. Report in ' + Math.min.apply(null, staff.map(function(x){return x.asg.left})) + ' week' + (Math.min.apply(null, staff.map(function(x){return x.asg.left}))===1?'':'s') + '.</div>';
    } else {
      picks = '<div style="font-size:13px;color:var(--inj);margin-top:8px">Nobody is working it. Put a man on it.</div>';
    }
    return '<div class="card" style="margin-bottom:10px;border-color:' + (b.unread?'var(--acc)':'var(--hair)') + '" onclick="SW.get(\'scouting\').ui.briefRead(' + b.id + ')">' +
      '<div class="row" style="align-items:flex-start">' +
        '<div style="flex:1;min-width:0"><div style="font-weight:700;font-size:15px">' + esc(briefTitle(b)) +
          (b.auto ? ' <span class="pill" style="font-size:10px">Assistant\'s pick</span>' : '') + '</div>' +
          '<div class="dim" style="font-size:12px;margin-top:2px">' + esc(briefLine(b)) + '</div>' +
          '<div style="font-size:12px;margin-top:4px;color:' + (staff.length?'var(--t2)':'var(--inj)') + '">' + who + '</div></div>' +
        '<button class="btn ghost xs" style="min-height:36px;padding:0 10px;flex:0 0 auto" onclick="event.stopPropagation();SW.get(\'scouting\').ui.brief(' + b.id + ')">Edit</button>' +
      '</div>' + picks +
      '<div class="row" style="gap:6px;margin-top:10px">' +
        '<button class="btn ghost xs" style="min-height:36px" onclick="event.stopPropagation();SW.get(\'scouting\').ui.briefStaff(' + b.id + ')">Who works it</button>' +
        '<span class="spacer"></span>' +
        '<button class="btn ghost xs" style="min-height:36px;color:var(--t3)" onclick="event.stopPropagation();SW.get(\'scouting\').ui.briefDrop(' + b.id + ')">Bin</button>' +
      '</div></div>';
  }).join('');
  var add = bs.length<MAXB
    ? '<button class="btn ghost sm" style="margin-bottom:10px" onclick="SW.get(\'scouting\').ui.brief(0)">New brief' + (bs.length?' · ' + bs.length + '/' + MAXB:'') + '</button>'
    : '';
  return '<div class="sechead">What we are looking for' + (bs.some(function(b){return b.unread}) ? '<span class="n">new</span>' : '') + '</div>' + cards + add;
}

/* ---------- the Market sub-view ---------- */
function viewScouts(){
  var s=st(), c=me();
  invalidate();
  var bill=0; for(var i=0;i<s.sc.length;i++) bill+=s.sc[i].wage;

  var unread = s.unread.filter(function(id){return s.rep[id]});
  var repBlock = unread.length
    ? '<div class="sechead">Waiting on your desk<span class="n">' + unread.length + '</span></div>' +
      unread.slice(0,6).map(function(id){
        var r=s.rep[id];
        var rp = pOf(+id);
        return '<div class="act" onclick="SW.get(\'scouting\').ui.read(' + id + ')">' +
          lockup(vH(r.scn,'scout',r.scnat||'eng',52), rp?vP(rp):null, 52) +
          '<div class="tx"><div class="a">' + esc(r.nm) + '</div>' +
          '<div class="b">' + esc(r.scn) + ' · ' + esc(r.cl) + ' · ' + agoTxt(r.w) + '</div></div>' +
          '<div class="ch">›</div></div>';
      }).join('')
    : '';

  var read = Object.keys(s.rep).filter(function(id){return unread.indexOf(+id)<0}).slice(-5).reverse();
  var readBlock = read.length
    ? '<div class="sechead">Filed</div><div class="card" style="padding:6px 14px 12px">' +
      read.map(function(id){
        var r=s.rep[id];
        return '<div class="plr" onclick="SW.get(\'scouting\').ui.read(' + id + ')">' +
          '<div class="pos">' + label(+id) + '</div>' +
          '<div class="nmw"><div class="nm2">' + esc(r.nm) + '</div>' +
          '<div class="meta"><span>' + esc(r.cl) + '</span><span>' + esc(r.scn) + '</span></div></div>' +
          '<div class="ch" style="color:var(--t3)">›</div></div>';
      }).join('') + '</div>'
    : '';

  var scoutBlock = s.sc.length
    ? '<div class="card" style="padding:6px 14px 12px">' + s.sc.map(function(sc){
        var a=sc.asg;
        var where = a ? (a.kind==='youth' ? 'Our academy'
                       : a.kind==='brief' ? (function(){var b=briefById(a.bid);return b?esc(briefTitle(b)):'A brief'})()
                       : a.kind==='player' ? (function(){var p=pOf(a.pid);return p?esc(p.name):'One player'})()
                       : esc(NATIONS[a.nat].name))
                      : 'Idle — costing you money';
        var when = a ? (a.left<=1 ? 'Reports this week' : a.left + ' weeks out') : 'Give him a job';
        var hint = biasHint(sc);
        return '<div class="plr" style="align-items:flex-start;gap:11px" onclick="SW.get(\'scouting\').ui.assign(' + sc.id + ')">' +
          avatar(vH(sc.name,'scout',sc.nat,52),52) +
          '<div class="pos" style="width:38px;color:var(--acc);border-color:var(--hair)">' + STAR[sc.q].replace(/☆/g,'') + '</div>' +
          '<div class="nmw"><div class="nm2">' + esc(sc.name) + '</div>' +
          '<div class="meta"><span class="flag">' + NATIONS[sc.nat].code + '</span>' +
            '<span style="color:' + (a?'var(--t3)':'var(--inj)') + '">' + where + '</span></div>' +
          '<div class="meta" style="margin-top:2px"><span style="color:' + (a&&a.left<=1?'var(--win)':'var(--t3)') + '">' + when + '</span>' +
            (hint?'<span>· ' + hint + '</span>':'') + '</div></div>' +
          '<div style="text-align:right;flex:0 0 auto">' +
            '<div style="font-size:12px;font-weight:700;color:var(--t2)">' + money(sc.wage) + '</div>' +
            '<button class="btn ghost xs" style="margin-top:4px;min-height:34px;padding:0 10px"' +
            ' onclick="event.stopPropagation();SW.get(\'scouting\').ui.drop(' + sc.id + ')">Release</button></div></div>';
      }).join('') + '</div>'
    : '<div class="card"><div style="font-size:13px;color:var(--t2)">You have nobody out there. ' +
      'Every player on the Scout list is a rumour until someone watches him.</div></div>';

  var kids = c ? c.squad.filter(function(p){return p.youth}) : [];
  var youthBlock = kids.length
    ? '<div class="sechead">The academy</div><div class="card" style="padding:6px 14px 12px">' +
      kids.map(function(p){
        var k=knowledge(p.id);
        return '<div class="plr" onclick="showPlayer(' + p.id + ')">' + pface(p,34) +
          '<div class="pos">' + p.pos + '</div>' +
          '<div class="nmw"><div class="nm2">' + esc(p.name) + '</div>' +
          '<div class="meta"><span>' + p.age + '</span><span style="color:' + (k>=0.6?'var(--loan)':'var(--t3)') + '">' +
            esc(ceilLabel(p.id,p)) + '</span></div></div>' +
          '<div class="ca" style="color:var(--t2);width:auto;font-size:13px">' + label(p.id,p) + '</div></div>';
      }).join('') + '</div>'
    : '';

  var hireBlock = s.sc.length<MAXS
    ? '<div class="sechead">Available</div><div class="card" style="padding:6px 14px 12px">' +
      s.cand.map(function(x){
        return '<div class="plr">' +
          '<div class="pos" style="width:44px;color:var(--acc);border-color:var(--hair)">' + STAR[x.q].replace(/☆/g,'') + '</div>' +
          '<div class="nmw"><div class="nm2">' + esc(x.name) + '</div>' +
          '<div class="meta"><span class="flag">' + NATIONS[x.nat].code + '</span>' +
            '<span>Knows the ' + esc(NATIONS[x.nat].adj.toLowerCase()) + ' game</span><span>' + money(x.wage) + '/wk</span></div></div>' +
          '<button class="btn xs" onclick="SW.get(\'scouting\').ui.hire(' + x.id + ')">Hire</button></div>';
      }).join('') + '</div>'
    : '<div class="card"><div style="font-size:13px;color:var(--t3)">Five scouts. That is the lot.</div></div>';

  return briefBlock() + repBlock +
    '<div class="sechead">The network</div>' +
    '<div class="card" style="margin-bottom:10px"><div class="row">' +
      '<div><div class="dim" style="font-size:10px;letter-spacing:.06em;text-transform:uppercase">Scouts</div>' +
      '<div class="disp" style="font-size:24px;font-weight:800">' + s.sc.length + '<span style="font-size:14px;color:var(--t3)">/' + MAXS + '</span></div></div>' +
      '<div class="spacer"></div>' +
      '<div style="text-align:right"><div class="dim" style="font-size:10px;letter-spacing:.06em;text-transform:uppercase">Off the budget</div>' +
      '<div style="font-weight:700;font-size:14px;margin-top:3px;color:' + (bill?'var(--inj)':'var(--t3)') + '">' + money(bill) + '/wk</div></div>' +
    '</div></div>' +
    scoutBlock + youthBlock + hireBlock + readBlock;
}

/* ============================================================
   REGISTER
   ============================================================ */
SW.register({
  id:'scouting',

  /* --- published interface --- */
  knowledge: knowledge,
  reveal: reveal,
  estimate: estimateOf,
  briefs: function(){ return briefs().map(function(b){ return {id:b.id, pos:b.pos, line:briefLine(b), auto:!!b.auto}; }); },
  reportFor: reportFor,
  label: label,
  ceiling: ceilLabel,
  /* can we actually sign him: {ok, k:'fee'|'wage'|'will', ask, wage, why} */
  pursuable: function(pid){
    var p=pOf(Number(pid)); if(!p) return null;
    var cl=clubOf(Number(pid)); if(!cl || cl.id===G.me) return {ok:true};
    return reachOf({p:p, s:cl});
  },
  watch: function(pid){ UI.watch(Number(pid)); },
  ui: UI,

  init: function(){
    var s=st();
    invalidate(); hookMktCard();
    if(!s.seeded){
      s.seeded=true;
      var c=me();
      var chief = makeScout();
      chief.nat = c ? c.nat : 'eng';
      chief.q = 2; chief.wage = wageOf(2); chief.name = personName(chief.nat);
      s.sc.push(chief);
      refreshCand();
      var b0 = ensureDefault();
      if(b0) toBrief(chief.id, b0.id); else assign(chief.id,'region',chief.nat);
      note('You inherited a scout',
        chief.name + ' has been here longer than you have. ' +
        (b0 ? 'Your weakest slot is ' + (POSN[b0.pos]||b0.pos) + ', so I have sent him looking for one. Change the brief on the Scouts tab if you disagree. He files in ' + weeksFor(chief,'brief') + ' weeks.'
            : 'He is out in ' + NATIONS[chief.nat].name + ' and he will file in ' + weeksFor(chief,'region') + ' weeks.') +
        ' Everyone else on the market is a rumour.', {from:vV('assist')});
    }
  },

  onLoad: function(){
    var s=st();
    invalidate(); hookMktCard();
    /* rehydrate the reveals the core does not persist, and bin anything
       whose id no longer points at the same man */
    if(s.traits){
      Object.keys(s.traits).forEach(function(id){
        var p=pOf(+id);
        if(p && p.trait===s.traits[id]) p.traitKnown=true; else delete s.traits[id];
      });
    }
    Object.keys(s.rep).forEach(function(id){
      var p=pOf(+id);
      if(!p || p.name!==s.rep[id].nm){ delete s.rep[id]; delete s.k[id]; delete s.nm[id]; }
    });
    Object.keys(s.k).forEach(function(id){ if(!pOf(+id)) delete s.k[id]; });
    s.unread = s.unread.filter(function(id){return s.rep[id]});
    if(!s.cand || !s.cand.length) refreshCand();
    pruneBriefs();
    ensureDefault();
    s.draft=null;
    LAB=Object.create(null);
  },

  onWeek: function(){
    invalidate();
    var s=st(); if(!s.sc) return;
    payWages();
    tick();
  },

  onSeasonEndAfter: function(){
    var s=st();
    invalidate();
    /* the world moved on: prune knowledge of people who are gone,
       and refresh who is looking for work */
    Object.keys(s.k).forEach(function(id){ if(!pOf(+id)) { delete s.k[id]; delete s.rep[id]; delete s.nm[id]; } });
    s.unread = s.unread.filter(function(id){return s.rep[id]});
    s.gem = null;
    refreshCand();
    pruneBriefs();
    /* the assistant's own brief follows the weakest slot; yours stay as you wrote them */
    var ab = briefs().find(function(b){return b.auto});
    if(ab){ var wp=weakestPos(); if(wp!==ab.pos){ ab.pos=wp; if(s.brep) s.brep=s.brep.filter(function(r){return r.bid!==ab.id}); } }
    ensureDefault();
    /* a season's fresh intake is a fresh set of strangers */
    var c=me();
    if(c && s.sc.length){
      var kids = c.squad.filter(function(p){return p.youth});
      if(kids.length) note('New faces in the academy',
        kids.length + ' of them, and nobody knows what any of them are. Put a scout on the place.', {from:vV('academy')});
    }
  },

  hubCards: function(){
    invalidate();
    var s=st(), out=[];
    if(!s.sc) return out;
    var nb = briefs().filter(function(b){return b.unread && briefReport(b.id)});
    if(nb.length){
      var br = briefReport(nb[0].id), n = br.picks.length;
      if(br.dry){
        out.push({
          ic:'◎', bg:'#3A1C12', col:'var(--inj)',
          a: br.scn + ' came back empty on the ' + (POSN[nb[0].pos]||nb[0].pos) + ' brief',
          b: br.dry.head,
          fn: "SW.get('scouting').ui.briefRead(" + nb[0].id + ")", priority: 30
        });
      }else{
        out.push({
          ic:'◎', bg:'#0E2340', col:'var(--trf)',
          a: br.scn + ' has ' + (n===1?'a man':n===2?'two men':'three men') + ' for the ' + (POSN[nb[0].pos]||nb[0].pos) + ' brief',
          b: br.picks.map(function(pk){return pk.nm}).join(', '),
          fn: "SW.get('scouting').ui.briefRead(" + nb[0].id + ")", priority: 30
        });
      }
    }
    var unread = s.unread.filter(function(id){return s.rep[id]});
    if(unread.length){
      var gem = unread.find(function(id){return s.rep[id].gem});
      var top = s.rep[gem || unread[0]];
      out.push({
        ic: gem?'★':'◎', bg: gem?'var(--accw)':'#0E2340', col: gem?'var(--acc)':'var(--trf)',
        a: gem ? (top.scn + ' has found somebody') : (unread.length===1 ? 'Report in on ' + top.nm : unread.length + ' scout reports waiting'),
        b: gem ? (top.nm + ' — and nobody else is watching' ) : (top.scn + ' · ' + top.cl),
        fn: "SW.get('scouting').ui.open()", priority: 30
      });
    }
    var idle = s.sc.filter(function(x){return !x.asg});
    if(idle.length){
      out.push({ ic:'◇', bg:'var(--s2)', col:'var(--t2)',
        a: idle.length===1 ? idle[0].name + ' is sat at home' : idle.length + ' scouts with nothing to do',
        b: 'You are paying them either way',
        fn: "SW.get('scouting').ui.open()", priority: 12 });
    }
    return out;
  },

  boot: function(){ hookMktCard(); },

  marketViews: function(){
    invalidate(); hookMktCard();
    return [{ key:'scouts', label:'Scouts', render: viewScouts }];
  },

  playerBlocks: function(p, cl){
    invalidate();
    var s=st(); if(!s.sc) return [];
    var mine = cl && cl.id===G.me;
    var k = knowledge(p.id);
    var r = s.rep[p.id];
    var watched = s.sc.some(function(x){return x.asg && x.asg.kind==='player' && x.asg.pid===p.id});
    if(mine && !p.youth && !r) return [];

    var head = '<div class="sechead">Scouting</div>';
    var body = '<div class="card" style="background:var(--s1)">';
    body += '<div class="kv" style="border-top:0"><span class="k2">How well we know him</span>' +
      '<span class="v2" style="color:' + (k>=0.7?'var(--win)':k>=0.35?'var(--acc)':'var(--t3)') + '">' +
      (k>=0.98?'Inside out':Math.round(k*100)+'%') + '</span></div>';
    body += '<div class="kv"><span class="k2">Ability</span><span class="v2">' + label(p.id,p) + '</span></div>';
    body += '<div class="kv"><span class="k2">Ceiling</span><span class="v2" style="font-weight:600;font-size:13px;max-width:210px">' +
      esc(ceilLabel(p.id,p)) + '</span></div>';
    /* the question that decides whether any of the above matters */
    if(!mine && cl){
      var rr = reachOf({p:p, s:cl});
      body += '<div class="kv"><span class="k2">Can we get him</span>' +
        '<span class="v2" style="font-weight:600;font-size:13px;max-width:210px;color:' +
        (rr.ok?'var(--win)':'var(--loss)') + '">' +
        esc(rr.ok ? (money(rr.ask) + ' · ' + money(rr.wage) + '/wk') : 'No — ' + rr.why) + '</span></div>';
    }
    body += '</div>';

    if(r){
      body += '<div class="card" style="margin-top:10px;background:var(--s1);border-color:' + (r.gem?'var(--acc)':'var(--hair)') + '">' +
        '<div style="font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:var(--acc);font-weight:700">' +
        esc(r.scn) + ' · ' + agoTxt(r.w) + '</div>' +
        '<div style="font-size:13px;line-height:20px;color:var(--t2);margin-top:6px">' + esc(r.text) + '</div></div>';
    }else if(k<0.3){
      body += '<div class="card" style="margin-top:10px;background:var(--s1)">' +
        '<div style="font-size:13px;color:var(--t3)">Nobody of yours has watched him. Everything above is hearsay.</div></div>';
    }

    if(watched){
      body += '<div class="card" style="margin-top:10px;background:var(--s1);border-color:var(--trf)">' +
        '<div style="font-size:13px;color:var(--trf)">You have a man on him. Report on the way.</div></div>';
    }else if(!mine || p.youth){
      body += '<button class="btn ghost sm" style="margin-top:10px" onclick="SW.get(\'scouting\').ui.watch(' + p.id + ')">' +
        (p.youth ? 'Get a scout on the boy' : 'Have him watched') + '</button>';
    }
    return [head + body];
  }
});

})();
