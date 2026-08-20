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
function invalidate(){ MS=null; IDX=null; REBUILT=false; LAB=Object.create(null); }

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
    out = '??';
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
    sc.asg.left--;
    if(sc.asg.left<=0){
      var a=sc.asg; sc.asg=null; sc.done++;
      complete(sc,a);
      /* competent default: he goes straight back out to his own patch.
         Disagreeing with that — re-tasking him — is the player's job. */
      if(!sc.asg) assign(sc.id,'region',sc.nat);
    }
  }
}

function complete(sc,a){
  if(a.kind==='player') return doPlayer(sc,a.pid);
  if(a.kind==='youth')  return doYouth(sc);
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
      pool.push({p:p,cl:cl});
    }
  }
  if(!pool.length){
    note(sc.name + ' came back with nothing',
      'Three weeks in ' + NATIONS[nat].name + ' and not one of them is worth your money. It happens.', {from:vH(sc.name,'scout',sc.nat,52)});
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
    sheet(
      speakerBar(vH(sc.name,'scout',sc.nat,52),null,'',STAR[sc.q] + ' \u00b7 ' + money(sc.wage) + '/wk') +
      '<h3>Where do you want ' + esc(sc.name) + '?</h3>' +
      '<div class="sh-sub">' + STAR[sc.q] + ' · ' + money(sc.wage) + '/wk. He will be gone ' +
        weeksFor(sc,'region') + ' weeks on a sweep, ' + weeksFor(sc,'player') + ' on one man.</div>' +
      (named ? '<div class="sechead" style="margin:0 0 8px">One player</div>' + named : '') +
      '<div class="sechead" style="margin:14px 0 8px">A region</div>' + opts +
      '<div class="sechead" style="margin:14px 0 8px">Home</div>' + youth +
      '<button class="btn ghost" style="margin-top:6px" onclick="closeSheet();render()">Leave him where he is</button>'
    );
  },

  set: function(scoutId,kind,arg){
    assign(scoutId,kind,arg);
    save(); closeSheet(); render();
  },

  watch: function(pid){
    var s=st();
    var free = s.sc.filter(function(x){return !x.asg}).sort(function(a,b){return b.q-a.q})[0];
    if(!free){
      sheet('<h3>Everyone is out</h3><div class="sh-sub">Every scout you have is already on a job. ' +
        'Pull one off it or hire another.</div>' +
        '<button class="btn" onclick="SW.get(\'scouting\').ui.open()">Go to the network</button>' +
        '<button class="btn ghost" style="margin-top:8px" onclick="closeSheet();render()">Leave it</button>');
      return;
    }
    assign(free.id,'player',pid);
    var p=pOf(pid);
    save(); closeSheet(); render();
    sheet('<h3>' + esc(free.name) + ' is on him</h3>' +
      '<div class="sh-sub">' + weeksFor(free,'player') + ' weeks and he files on ' + esc(p?p.name:'him') + '. ' +
      'Waiting is what knowledge costs.</div>' +
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
    assign(cand.id,'region',cand.nat);
    s.cand.push(makeScout());
    save(); closeSheet(); render();
    sheet('<h3>' + esc(cand.name) + ' is yours</h3>' +
      '<div class="sh-sub">' + STAR[cand.q] + ' · ' + money(cand.wage) + '/wk. ' +
      'He has gone straight to ' + esc(NATIONS[cand.nat].name) + '. First report in ' + weeksFor(cand,'region') + ' weeks.</div>' +
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

function kv(k,v){ return '<div class="kv"><span class="k2">' + k + '</span><span class="v2">' + esc(String(v)) + '</span></div>'; }
function agoTxt(w){
  var d = G.week - w;
  return d<=0 ? 'this week' : d===1 ? 'last week' : d + ' weeks ago';
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

  return repBlock +
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
  reportFor: reportFor,
  label: label,
  ceiling: ceilLabel,
  ui: UI,

  init: function(){
    var s=st();
    invalidate();
    if(!s.seeded){
      s.seeded=true;
      var c=me();
      var chief = makeScout();
      chief.nat = c ? c.nat : 'eng';
      chief.q = 2; chief.wage = wageOf(2); chief.name = personName(chief.nat);
      s.sc.push(chief);
      assign(chief.id,'region',chief.nat);
      refreshCand();
      note('You inherited a scout',
        chief.name + ' has been here longer than you have. He is out in ' + NATIONS[chief.nat].name +
        ' and he will file in ' + weeksFor(chief,'region') + ' weeks. Everyone else on the market is a rumour.', {from:vV('staff')});
    }
  },

  onLoad: function(){
    var s=st();
    invalidate();
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

  marketViews: function(){
    invalidate();
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
        (p.youth ? 'Get a scout on the boy' : 'Put a scout on him') + '</button>';
    }
    return [head + body];
  }
});

})();
