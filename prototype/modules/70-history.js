/* ============================================================
   70-history.js — THE CLUB CHRONICLE
   Records, hall of fame, eras and the end-of-season review.

   This module writes the story of the save. It listens (onMatchEnd,
   onSeasonEndBefore/After) rather than asking, and accepts pushes from
   other modules through record().

   It never holds a reference to a live player. Everything in the hall of
   fame is a flat snapshot: name, portrait seed, position, numbers.
   ============================================================ */
(function(){
'use strict';

const ID='history';
const MAXCHRON=420, MAXHOF=60, MAXCAR=170, MAXRES=64;

/* ---------- tiny helpers ---------- */
const vpick=(a,n)=>a[Math.abs(Math.round(n))%a.length];
const yr=s=>s+'/'+String(s+1).slice(2);
const monthOf=w=>(typeof MONTHS!=='undefined'&&MONTHS[w%38])||'';
function moneyNum(t){
  const m=/£\s*([\d.]+)\s*(bn|m|k)?/i.exec(String(t||''));
  if(!m)return 0;
  const n=parseFloat(m[1])||0,u=(m[2]||'').toLowerCase();
  return Math.round(n*(u==='bn'?1e9:u==='m'?1e6:u==='k'?1e3:1));
}
function safe(fn,d){ try{ return fn() }catch(e){ return d } }

/* ---------- state ---------- */
function freshSeason(){
  const L=safe(()=>leagueOf(G.me),null);
  return {s:G.season, lg:L?L.name:'', tier:L?L.tier:0, res:[], tro:[], sign:[], rec:[], hof:[]};
}
function S(){
  const s=SW.state(ID);
  if(!s.v){
    s.v=1;
    s.from=G.season;            // season the manager took the job
    s.cl=0;                     // cursor into the core chronicle
    s.chron=[];                 // {s,k,t}  k: season|trophy|record|milestone|era
    s.seasons=[];               // finished seasons, ascending
    s.rec={};                   // the records the club keeps forever
    s.hof=[];                   // snapshots — never live players
    s.car={};                   // career tallies under this manager
    s.tot={g:0,w:0,d:0,l:0,gf:0,ga:0,tro:0,ttl:0,pro:0,rel:0,spend:0,sold:0};
    s.streak={c:0,a:0};
    s.cur=null; s.wrap=null; s.pend=0; s.seg='chron'; s.lastRec=null; s.eraSeen='';
  }
  if(!s.cur||s.cur.s!==G.season) s.cur=freshSeason();
  if(!s.tot)s.tot={g:0,w:0,d:0,l:0,gf:0,ga:0,tro:0,ttl:0,pro:0,rel:0,spend:0,sold:0};
  return s;
}

/* The season anything written right now belongs to. Between onSeasonEndBefore and
   onSeasonEndAfter the core has already rolled G.season forward, so everything we
   write about the season just gone has to be stamped by hand. */
function cs(s){ return s.attr||G.season }

/* ---------- writing into the chronicle ---------- */
function pushChron(s,k,t,season){
  if(!t)return;
  s.chron.unshift({s:(season==null?cs(s):season),k:k,t:String(t).slice(0,150)});
  if(s.chron.length>MAXCHRON)s.chron.length=MAXCHRON;
}
/* mirror one line into the core chronicle without re-reading it as core input */
function mirror(s,t,season){
  safe(()=>{
    chron(t);
    if(season!=null&&G.chronicle[0])G.chronicle[0].s=season;   // the core stamps the new season
    s.cl=G.chronicle.length;
  });
}

/* ---------- read the core's own chronicle for things we did not see ---------- */
function sync(s){
  if(!G.chronicle){s.cl=0;return}
  const n=G.chronicle.length, add=n-(s.cl||0);
  if(add>0){
    const fresh=G.chronicle.slice(0,Math.min(add,60)).reverse();  // oldest first
    fresh.forEach(e=>{ if(e&&e.t) readCore(s,String(e.t)) });
  }
  s.cl=n;
}
function readCore(s,t){
  let m=/^YOU won the (.+)$/.exec(t);
  if(m){ addTrophy(s,m[1]); return }
  m=/^(.+) won the (.+)$/.exec(t);
  if(m){ if(m[1]===me().name) addTrophy(s,m[2]); return }
  m=/^Signed (.+) from (.+) for (.+)$/.exec(t);
  if(m){ signing(s,m[1],moneyNum(m[3]),m[2]); return }
}

/* ---------- trophies ---------- */
function addTrophy(s,name){
  name=String(name||'').slice(0,60);
  if(!name)return;
  if(s.cur.tro.indexOf(name)>=0)return;
  s.cur.tro.push(name);
  s.tot.tro++;
  const L=safe(()=>leagueOf(G.me),null);
  if(L&&name===L.name)s.tot.ttl++;
  pushChron(s,'trophy','Won the '+name+'.');
  bestRun(s,name,3);
}

/* ---------- transfers ---------- */
function signing(s,name,fee,from){
  s.cur.sign.push({n:name,f:fee||0,c:from||''});
  if(s.cur.sign.length>24)s.cur.sign.shift();
  s.tot.spend+=fee||0;
  const r=s.rec.buy;
  if(fee>0&&(!r||fee>r.f)){
    const old=r;
    s.rec.buy={n:name,f:fee,c:from||'',s:cs(s)};
    if(old&&fee>old.f*1.05){
      breakNote(s,'Record signing',name+' is the most we have ever paid. '+money(fee)+
        ', past the '+money(old.f)+' we spent on '+old.n+'. He had better play.');
    }
  }
}
function sale(s,name,fee,to){
  s.tot.sold+=fee||0;
  const r=s.rec.sell;
  if(fee>0&&(!r||fee>r.f)){
    const old=r;
    s.rec.sell={n:name,f:fee,c:to||'',s:cs(s)};
    if(old)breakNote(s,'Record sale',money(fee)+' for '+name+'. More than anyone has ever paid us. Spend it well.');
  }
}

/* ---------- records ---------- */
function breakNote(s,title,body){
  safe(()=>note(title,body,{from:vV('staff')}));
  pushChron(s,'record',body);
  s.cur.rec.push(body);
  (s.lastRec=s.lastRec||[]).push({t:title,b:body});
}
function bestRun(s,text,weight){
  const r=s.rec.run;
  if(!r||weight>r.w){ s.rec.run={t:text,w:weight,s:cs(s)} }
}

/* ---------- career tallies (flat, no live references) ---------- */
function careerOf(s,p){
  const k=String(p.id);
  let e=s.car[k];
  if(e&&e.n!==p.name){                 // id reused by a different player — keep the old one aside
    s.car[k+'x'+(e.f||0)]=e; e=null;
  }
  if(!e){
    e=s.car[k]={n:p.name,sd:p.id*13+7,nt:p.nat,p:p.pos,ap:0,gl:0,as:0,f:cs(s),l:cs(s),tr:0,m:0};
  }
  e.l=cs(s);
  return e;
}
const APPMS=[50,100,150,200,250,300], GOALMS=[25,50,100,150];
function checkMilestones(s){
  const c=me(); if(!c)return;
  c.squad.forEach(p=>{
    if(!p.apps)return;
    const e=careerOf(s,p);
    const ap=e.ap+p.apps, gl=e.gl+p.goals;
    APPMS.forEach((t,i)=>{
      const bit=1<<i;
      if(ap>=t&&!(e.m&bit)){
        e.m|=bit;
        if(t>=100){
          safe(()=>note(p.name+' — '+t+' games',vpick([
            'A '+t+' for us. He has seen three squads come and go.',
            t+' appearances. Whatever else happens, that is his.',
            t+' games in this shirt. They know his name in the away end too.'],t+p.id),
            {from:vV('staff'),about:vP(p),rel:'on'}));
          pushChron(s,'milestone',p.name+' made his '+t+'th appearance.');
        }
      }
    });
    GOALMS.forEach((t,i)=>{
      const bit=1<<(i+8);
      if(gl>=t&&!(e.m&bit)){
        e.m|=bit;
        safe(()=>note(p.name+' — '+t+' goals',vpick([
          t+' goals for this club. Not many get there.',
          'That is '+t+'. He keeps finding a yard.',
          t+' goals. The kids in the stand do his celebration now.'],t+p.id),
          {from:vV('staff'),about:vP(p),rel:'on'}));
        pushChron(s,'milestone',p.name+' reached '+t+' goals for the club.');
      }
    });
  });
}

/* ---------- match ---------- */
function onMatch(s,m){
  const c=me(); if(!c||!m||!m.R)return;
  const mine=m.mine||0, us=m.R.g[mine], them=m.R.g[1-mine];
  const oppId=mine===0?m.ai:m.hi;
  const opp=G.clubs[oppId]?G.clubs[oppId].name:'them';
  const comp=(m.f&&m.f.comp&&m.f.comp.name)||'';
  const r=us>them?'W':us===them?'D':'L';
  s.cur.res.push({w:G.week,r:r,f:us,a:them,o:G.clubs[oppId]?G.clubs[oppId].abbr:'???',c:comp});
  if(s.cur.res.length>MAXRES)s.cur.res.shift();
  const T=s.tot;
  T.g++; T.gf+=us; T.ga+=them;
  if(r==='W')T.w++; else if(r==='D')T.d++; else T.l++;

  const line=us+'–'+them+' v '+opp;
  /* biggest win */
  if(us>them){
    const old=s.rec.win, mar=us-them;
    if(!old||mar>old.f-old.a||(mar===old.f-old.a&&us>old.f)){
      s.rec.win={f:us,a:them,o:opp,cp:comp,s:cs(s)};
      if(old&&mar>=3)breakNote(s,'Record win',vpick([
        'Biggest win under you. '+line+'. The old one was '+old.f+'–'+old.a+'.',
        line+'. Nothing this club has done under you comes close.',
        'Record: '+line+'. They stopped counting in the second half.'],us*7+G.week));
    }
  }
  /* worst defeat */
  if(them>us){
    const old=s.rec.loss, mar=them-us;
    if(!old||mar>old.a-old.f||(mar===old.a-old.f&&them>old.a)){
      s.rec.loss={f:us,a:them,o:opp,cp:comp,s:cs(s)};
      if(old&&mar>=3)breakNote(s,'Worst defeat',vpick([
        'Worst you have had here. '+line+'. Say something to them before Monday.',
        line+'. Nobody at this club has been beaten like that under you.',
        'Record defeat: '+line+'. It was over by the hour mark.'],them*5+G.week));
    }
  }
  /* unbeaten run */
  if(r!=='L'){
    s.streak.c++;
    const old=s.rec.unb?s.rec.unb.v:0;
    if(s.streak.c>old){
      const first=s.cur.res.slice(-s.streak.c)[0];
      s.rec.unb={v:s.streak.c,s:cs(s),m:first?monthOf(first.w):''};
      if(!s.streak.a&&old>=6&&s.streak.c>=8){
        s.streak.a=1;
        breakNote(s,'Club record',s.streak.c+' games unbeaten. That is the longest run this club has had under you.');
      }
    }
  } else { s.streak.c=0; s.streak.a=0 }
  checkMilestones(s);
}

/* ---------- Europe ---------- */
function europeRun(c){
  if(!c||!c.euro||!G.euro)return null;
  const E=G.euro[c.euro]; if(!E)return null;
  const nm=(typeof EUROS!=='undefined'&&(EUROS.find(x=>x.key===c.euro)||{}).name)||'Europe';
  if(E.winner===c.id)return {t:'Won the '+nm+'.',w:6,n:nm,stage:'won'};
  const inTie=(st)=>((E.ko&&E.ko[st])||[]).some(t=>t.a===c.id||t.b===c.id);
  if(inTie('f'))return {t:'Lost the '+nm+' final.',w:5,n:nm,stage:'final'};
  if(inTie('sf'))return {t:'Out in the '+nm+' semi-final.',w:4,n:nm,stage:'semi-final'};
  if(inTie('qf'))return {t:'Out in the '+nm+' quarter-final.',w:3,n:nm,stage:'quarter-final'};
  return {t:'Out of the '+nm+' at the group stage.',w:1,n:nm,stage:'group stage'};
}

/* ---------- the run that defined a season ---------- */
function runStory(res){
  if(!res||res.length<6)return '';
  let bl=0,bi=0,cur=0,st=0;
  res.forEach((x,i)=>{ if(x.r!=='L'){ if(!cur)st=i; cur++; if(cur>bl){bl=cur;bi=st} } else cur=0 });
  let wl=0,wi=0,cw=0,sw=0;
  res.forEach((x,i)=>{ if(x.r!=='W'){ if(!cw)sw=i; cw++; if(cw>wl){wl=cw;wi=sw} } else cw=0 });
  let ws=0,wsi=0,cs=0,ss=0;
  res.forEach((x,i)=>{ if(x.r==='W'){ if(!cs)ss=i; cs++; if(cs>ws){ws=cs;wsi=ss} } else cs=0 });
  if(ws>=5)return ws+' straight wins from '+monthOf(res[wsi].w)+'. That was the season, right there.';
  if(bl>=8)return bl+' unbeaten from '+monthOf(res[bi].w)+' — the run everything else hung off.';
  if(wl>=6)return wl+' games without a win through '+monthOf(res[wi].w)+'. It cost you more than it should have.';
  if(ws>=3)return ws+' on the spin in '+monthOf(res[wsi].w)+' was as good as it got.';
  if(wl>=4)return 'A flat '+wl+' games without a win around '+monthOf(res[wi].w)+' set the tone.';
  return 'No run to speak of, good or bad. That is its own kind of season.';
}

/* ---------- season wrap: capture everything while squads are intact ---------- */
function beginWrap(s){
  sync(s);
  const c=me(); if(!c)return;
  const L=safe(()=>leagueOf(G.me),null);
  const tab=L?safe(()=>leagueTable(L),[]):[];
  const pos=tab.findIndex(x=>x.id===G.me)+1;
  const w=s.cur;
  w.lg=L?L.name:w.lg; w.tier=L?L.tier:w.tier;
  w.pos=pos||20; w.pts=safe(()=>pts(c),0);
  w.W=c.W; w.D=c.D; w.L=c.L; w.GF=c.GF; w.GA=c.GA;
  w.obj=G.objective?G.objective.text:''; w.op=G.objective?G.objective.pos:20;
  const lead=tab[0]?safe(()=>pts(tab[0]),0):0;
  const second=tab[1]?safe(()=>pts(tab[1]),0):0;
  w.gap=pos===1?w.pts-second:lead-w.pts;
  const eu=europeRun(c); w.eu=eu?eu.t:''; if(eu)bestRun(s,eu.t,eu.w);
  const cup=safe(()=>{const m=SW.get('cup');return m&&m.status?m.status():null},null);
  if(cup&&cup.round)w.cup=String(cup.round);

  /* season stats from a squad that is about to be aged, sold and retired */
  const sq=c.squad.filter(p=>p.apps>0);
  const scorers=sq.slice().sort((a,b)=>b.goals-a.goals);
  const top=scorers[0];
  w.ts=top&&top.goals>0?{n:top.name,g:top.goals,a:top.apps}:null;
  const rated=sq.filter(p=>p.apps>=8).map(p=>({p:p,r:avg(p.ratings)})).sort((a,b)=>b.r-a.r);
  w.mvp=rated[0]?{n:rated[0].p.name,r:+rated[0].r.toFixed(2),ap:rated[0].p.apps}:null;

  /* best and worst piece of business */
  const buys=w.sign.map(g=>{
    const p=c.squad.find(x=>x.name===g.n);
    if(!p)return {n:g.n,f:g.f,sc:-999,ap:0,gl:0,r:0};
    const r=avg(p.ratings);
    return {n:g.n,f:g.f,ap:p.apps,gl:p.goals,r:+r.toFixed(2),
      sc:p.apps*0.7+p.goals*3+(r-6.5)*22-(g.f/1e6)*0.35};
  }).filter(b=>b.sc>-900);
  if(buys.length){
    const so=buys.slice().sort((a,b)=>b.sc-a.sc);
    w.best=so[0];
    const flops=buys.filter(b=>b.f>=8e5);
    w.worst=flops.length&&so[so.length-1].f>=8e5?so[so.length-1]:(flops.sort((a,b)=>a.sc-b.sc)[0]||null);
    if(w.worst&&w.best&&w.worst.n===w.best.n)w.worst=null;
  }

  /* most goals in a season record */
  if(top&&top.goals>0){
    const old=s.rec.sea;
    if(!old||top.goals>old.v){
      s.rec.sea={n:top.name,v:top.goals,s:cs(s)};
      if(old&&top.goals>old.v)breakNote(s,'Club record',top.name+' scored '+top.goals+
        ' this season. Nobody has scored more for this club under you — '+old.n+' had '+old.v+'.');
    }
  }
  /* highest finish */
  const fin=s.rec.fin;
  if(!fin||w.tier<fin.tier||(w.tier===fin.tier&&w.pos<fin.pos)){
    s.rec.fin={pos:w.pos,tier:w.tier,lg:w.lg,s:cs(s)};
  }
  s.wrap=w;
}
function avg(a){ return a&&a.length?a.reduce((x,y)=>x+y,0)/a.length:0 }

/* fold the season's numbers into career tallies, then look for legends */
function foldCareers(s,w){
  const c=me(); if(!c)return;
  const won=w.tro.length;
  c.squad.forEach(p=>{
    if(!p.apps)return;
    const e=careerOf(s,p);
    e.l=w.s; if(e.f>w.s)e.f=w.s;
    e.ap+=p.apps; e.gl+=p.goals; e.as+=p.assists||0;
    e.nt=p.nat; e.p=p.pos; e.ag=p.age; e.ca=Math.round(safe(()=>CA(p),50));
    if(won&&p.apps>=8)e.tr+=won;
  });
  /* keep the map small: only players who actually played for us */
  const keys=Object.keys(s.car);
  if(keys.length>MAXCAR){
    keys.map(k=>({k:k,ap:s.car[k].ap})).sort((a,b)=>a.ap-b.ap)
      .slice(0,keys.length-MAXCAR).forEach(x=>{ if(!s.hof.some(h=>h.k===x.k))delete s.car[x.k] });
  }
}

/* ---------- hall of fame ---------- */
function hofLine(h){
  const rate=h.ap?h.gl/h.ap:0;
  if(h.tr>=4)return 'He won things here. That is the whole of it.';
  if(h.p==='GK'&&h.ap>=120)return 'Behind everything good we did, and never once thanked for it.';
  if(h.p==='GK')return 'Quiet, awkward, unbeatable on his day.';
  if(rate>=0.65)return 'Give him a yard and it was in. Simple as that.';
  if(h.gl>=80)return 'The one the away end sang about. He scored in every ground we visited.';
  if(h.ap>=220)return 'Played more games for this club than anyone had a right to ask.';
  if(h.ap>=150&&h.gl<20)return 'Never scored, never hid. Ran the place from the back.';
  if(h.as>=45)return 'Did not score many. Made most of them.';
  if(h.tr>=2)return 'Turned up on the days that decided things.';
  if(h.gl>=40)return 'Scored when we were flat, which is the hard part.';
  return 'One of ours. Gave the club everything he had.';
}
function inductions(s,w,season){
  const c=me();
  const out=[];
  Object.keys(s.car).forEach(k=>{
    const e=s.car[k];
    if(s.hof.some(h=>h.k===k))return;
    const worthy = e.ap>=100 || e.gl>=50 || (e.ap>=60&&e.tr>=2) || (e.gl>=30&&e.tr>=1);
    if(!worthy)return;
    const kit=c?{a:c.primary,b:c.secondary}:{a:'#2A3038',b:'#1A1F26'};
    const h={k:k,n:e.n,sd:e.sd,nt:e.nt||'eng',p:e.p||'CM',ag:e.ag||28,
      f:e.f,t:e.l,ap:e.ap,gl:e.gl,as:e.as,tr:e.tr,ca:e.ca||60,
      kA:kit.a,kB:kit.b,g:0,ln:''};
    h.ln=hofLine(h);
    s.hof.push(h);
    out.push(h);
  });
  if(s.hof.length>MAXHOF){
    s.hof.sort((a,b)=>(b.ap+b.gl*2+b.tr*30)-(a.ap+a.gl*2+a.tr*30));
    s.hof.length=MAXHOF;
  }
  out.forEach(h=>{
    safe(()=>note(h.n+' is in the hall of fame',
      h.ap+' games, '+h.gl+' goals, '+(h.tr?h.tr+' trophies. ':'')+h.ln,{from:vV('staff')}));
    pushChron(s,'milestone',h.n+' took his place in the hall of fame.',season);
  });
  return out;
}
/* keep hall-of-famers up to date while they are still ours, and mark the leavers */
function refreshHof(s){
  const c=me(); if(!c)return;
  s.hof.forEach(h=>{
    const e=s.car[h.k];
    if(e){ h.ap=e.ap; h.gl=e.gl; h.as=e.as; h.tr=e.tr; h.t=e.l; }
    const here=c.squad.some(p=>String(p.id)===h.k&&p.name===h.n);
    h.g=here?0:1;
  });
}

/* ---------- the written line for a season ---------- */
function seasonLine(s,w){
  const seed=w.s*7+w.pos;
  const parts=[];
  const title=w.pos===1;
  if(w.promoted){
    if(w.first)parts.push('Promoted at the first attempt.');
    else if(title)parts.push('Up as champions.');
    else parts.push(vpick(['Promoted. '+ord(w.pos)+' was enough.','Promoted, and about time.'],seed));
  } else if(w.relegated){
    parts.push(vpick(['Relegated. '+ord(w.pos)+', and it had been coming since Christmas.',
      'Relegated. The maths ran out in April.',
      'Relegated. Nobody could say it was unlucky.'],seed));
  } else if(title&&w.tier===0){
    parts.push(w.gap>=8?'Champions. Nobody else got near.'
      :w.gap<=2?'Champions, on the last day, by nothing at all.':'Champions.');
  } else if(title){
    parts.push('Won the league.');
  } else if(w.hit&&w.pos<=Math.max(1,w.op-3)){
    parts.push(vpick([ord(w.pos)+'. Better than anyone asked for.',
      ord(w.pos)+', and the target was '+ord(w.op)+'.'],seed));
  } else if(w.hit){
    parts.push(vpick([ord(w.pos)+'. Objective met, no more than that.',
      ord(w.pos)+'. Job done.'],seed));
  } else if(w.pos>=w.op+6){
    parts.push(vpick([ord(w.pos)+'. Nowhere near it.',ord(w.pos)+'. A bad year, plainly.'],seed));
  } else {
    parts.push(vpick([ord(w.pos)+'. Short of the target and everyone knew it.',
      ord(w.pos)+'. Close, which is worse.'],seed));
  }
  const cups=w.tro.filter(t=>t!==w.lg);
  if(cups.length)parts.push('Won the '+cups.join(' and the ')+'.');
  else if(w.eu&&/final|semi/.test(w.eu))parts.push(w.eu);
  if(w.ts&&w.ts.g>=10)parts.push(w.ts.n.split(' ').pop()+' scored '+w.ts.g+'.');
  else if(w.mvp&&w.mvp.r>=7.2)parts.push(w.mvp.n.split(' ').pop()+' was the best of them.');
  return parts.join(' ').slice(0,180);
}
function boardVerdict(s,w){
  const b=safe(()=>{const m=SW.get('board');return m&&m.confidence?m.confidence():null},null);
  if(b!=null){
    if(b>=80)return 'The board would sign you for life this week. Ask them in November instead.';
    if(b>=60)return 'The board are content. That is as warm as they get.';
    if(b>=40)return 'The board have gone quiet. Quiet is not good.';
    if(b>=20)return 'The board wanted more and are no longer hiding it.';
    return 'The board have one foot in the car park. Start next season well.';
  }
  if(w.tro.length)return 'Silverware buys you two years. Spend them properly.';
  if(w.promoted)return 'They got what they wanted. Now they want more.';
  if(w.relegated)return 'They will back you for one year. One.';
  if(w.hit&&w.pos<w.op)return 'They asked for '+ord(w.op)+' and got '+ord(w.pos)+'. They will remember that in the summer.';
  if(w.hit)return 'They are happy enough. It lasts until August.';
  return 'They expected '+ord(w.op)+'. They are not saying it out loud yet.';
}

/* ---------- close a season ---------- */
function finishSeason(s,info){
  const w=s.wrap||s.cur;
  if(!w)return;
  const c=me();
  const L=safe(()=>leagueOf(G.me),null);
  const nowTier=L?L.tier:w.tier;
  w.pos=(info&&info.pos)||w.pos||20;
  w.hit=info?!!info.hit:(w.pos<=(w.op||20));
  w.promoted=nowTier<w.tier;
  w.relegated=nowTier>w.tier;
  w.first=!s.seasons.some(x=>x.tier===w.tier);
  if(w.promoted)s.tot.pro++;
  if(w.relegated)s.tot.rel++;
  if(w.promoted)bestRun(s,'Promoted from the '+w.lg,4);

  foldCareers(s,w);
  const newHof=inductions(s,w,w.s);
  refreshHof(s);

  /* most appearances record */
  let topAp=null;
  Object.keys(s.car).forEach(k=>{const e=s.car[k];if(!topAp||e.ap>topAp.ap)topAp={n:e.n,ap:e.ap}});
  if(topAp&&(!s.rec.app||topAp.ap>s.rec.app.v))s.rec.app={n:topAp.n,v:topAp.ap,s:w.s};

  const rev={
    s:w.s, lg:w.lg, tier:w.tier, pos:w.pos, op:w.op||20, obj:w.obj||'', hit:w.hit,
    pts:w.pts||0, W:w.W||0, D:w.D||0, L:w.L||0, GF:w.GF||0, GA:w.GA||0,
    tro:w.tro.slice(0,4), eu:w.eu||'', cup:w.cup||'',
    ts:w.ts||null, mvp:w.mvp||null, best:w.best||null, worst:w.worst||null,
    run:runStory(w.res), rec:w.rec.slice(0,5), hof:newHof.map(h=>h.n),
    promoted:w.promoted, relegated:w.relegated,
    line:'', board:''
  };
  rev.line=seasonLine(s,w);
  rev.board=boardVerdict(s,w);

  s.seasons.push(rev);
  if(s.seasons.length>40)s.seasons.shift();
  pushChron(s,'season',rev.line,rev.s);
  mirror(s,rev.line,rev.s);
  s.pend=rev.s;
  s.wrap=null;
  s.cur=freshSeason();
  s.lastRec=null;
  buildEras(s,rev.s);
}

/* ---------- eras ---------- */
function codeOf(x){
  if(x.promoted)return 'climb';
  if(x.relegated)return 'fall';
  if(x.tro.length||x.pos===1)return 'gold';
  if(x.eu)return 'euro';
  if(x.tier===0?x.pos<=8:x.pos<=6)return 'build';
  return 'grind';
}
const ERANAMES={
  climb:['The climb','Up through the divisions','The rise'],
  fall:['The fall','The lean years','The bad years'],
  gold:['The gold years','The trophy years','Everything at once'],
  euro:['The European years','Thursday and Sunday','The continental run'],
  build:['The building','The near years','Knocking on the door'],
  grind:['The grind','Treading water','The quiet years']
};
function buildEras(s,season){
  const ss=s.seasons;
  if(ss.length<3){s.eras=[];return}
  const codes=ss.map(codeOf);
  /* absorb one-off seasons into their neighbours so eras read as periods */
  for(let i=1;i<codes.length-1;i++){
    if(codes[i]!==codes[i-1]&&codes[i-1]===codes[i+1])codes[i]=codes[i-1];
  }
  const eras=[];
  let st=0;
  for(let i=1;i<=codes.length;i++){
    if(i===codes.length||codes[i]!==codes[st]){
      eras.push({c:codes[st],a:ss[st].s,b:ss[i-1].s,n:i-st});
      st=i;
    }
  }
  /* merge runs of a single season into whichever neighbour is longer */
  for(let i=eras.length-1;i>=0;i--){
    if(eras[i].n===1&&eras.length>1){
      const prev=eras[i-1],next=eras[i+1];
      const host=(!next||(prev&&prev.n>=next.n))?prev:next;
      if(host){ host.a=Math.min(host.a,eras[i].a); host.b=Math.max(host.b,eras[i].b); host.n+=1; eras.splice(i,1) }
    }
  }
  eras.forEach((e,i)=>{
    e.t=vpick(ERANAMES[e.c]||ERANAMES.grind,e.a+i)+', '+e.a+'–'+String(e.b+1).slice(2);
  });
  s.eras=eras;
  const last=eras[eras.length-1];
  if(last&&last.n>=2&&s.eraSeen!==last.t){
    s.eraSeen=last.t;
    if(eras.length>1)pushChron(s,'era',last.t,season);
  }
}

/* ============================================================
   VIEWS
   ============================================================ */
function face(h,size){
  return safe(()=>faceSVG(h.sd,{size:size,nat:h.nt,age:h.ag,kitA:h.kA||'#2A3038',kitB:h.kB||'#1A1F26',bg:'#1A1F26'}),
    '<div style="width:'+size+'px;height:'+size+'px;border-radius:50%;background:var(--s3);flex:0 0 auto"></div>');
}
function posPill(p,tier){
  const good=p===1?'var(--acc)':(tier===0?p<=6:p<=3)?'var(--win)':p>=18?'var(--loss)':'var(--t2)';
  return '<span class="pill" style="background:var(--s2);color:'+good+';font-weight:700">'+ord(p)+'</span>';
}
function bigStat(v,l){
  return '<div><div class="dim" style="font-size:10px;letter-spacing:.06em;text-transform:uppercase">'+esc(l)+'</div>'+
   '<div class="disp" style="font-size:26px;font-weight:800;line-height:29px">'+esc(String(v))+'</div></div>';
}

function viewHistory(){
  const s=S(); sync(s); refreshHof(s);
  const seg=s.seg||'chron';
  const body=seg==='rec'?renderRecords(s):seg==='hof'?renderHof(s):renderChron(s);
  return '<div class="segmented">'+
   [['chron','Chronicle'],['rec','Records'],['hof','Hall of Fame']].map(([k,l])=>
     '<button aria-selected="'+(seg===k)+'" onclick="HIST.seg(\''+k+'\')">'+l+'</button>').join('')+
   '</div>'+body;
}

function renderChron(s){
  const t=s.tot, n=s.seasons.length;
  let h='<div class="card"><div class="row" style="gap:18px;align-items:flex-start">'+
    bigStat(n,'Seasons')+bigStat(t.g,'Games')+bigStat(t.tro,'Trophies')+
    '<div class="spacer"></div>'+
    bigStat(t.g?Math.round(t.w/t.g*100)+'%':'—','Won')+
   '</div>'+
   '<div style="border-top:1px solid var(--hair);margin-top:12px;padding-top:11px;font-size:13px;color:var(--t2)">'+
     (n?esc(tenureLine(s)):'Nothing written yet. The first line gets written in May.')+'</div></div>';

  if(!n){
    h+='<div class="sechead">This season</div><div class="card"><div class="dim">'+
      'Nothing has happened yet that anyone will remember. Go and change that.</div></div>';
    return h+liveSeasonCard(s);
  }
  h+=liveSeasonCard(s);

  const eras=s.eras||[];
  const list=s.seasons.slice().reverse();
  let lastEra=null;
  list.forEach(rv=>{
    const era=eras.find(e=>rv.s>=e.a&&rv.s<=e.b);
    const tag=era?era.t:null;
    if(tag&&tag!==lastEra){
      lastEra=tag;
      h+='<div class="sechead" style="color:var(--acc);margin-top:22px">'+esc(tag)+'</div>';
    } else if(!tag&&lastEra!==null){ lastEra=null }
    h+=seasonCard(s,rv);
  });
  return h;
}
function tenureLine(s){
  const t=s.tot;
  if(t.tro>=5)return t.tro+' trophies in '+s.seasons.length+' seasons. They will name something after you eventually.';
  if(t.tro)return t.tro+' trophy'+(t.tro>1?'s':'')+' so far, and '+t.g+' games of getting there.';
  if(t.pro)return 'No silverware yet, but you have taken this club up '+t.pro+' time'+(t.pro>1?'s':'')+'.';
  if(t.rel)return 'A hard tenure so far. The record does not lie about that.';
  return t.g+' games in charge and nothing in the cabinet yet.';
}
function liveSeasonCard(s){
  const c=me(); if(!c)return '';
  const cur=s.cur; if(!cur.res.length)return '';
  const w=cur.res.filter(x=>x.r==='W').length, d=cur.res.filter(x=>x.r==='D').length,
        l=cur.res.filter(x=>x.r==='L').length;
  const pos=safe(()=>myPos(),0);
  return '<div class="sechead">This season</div>'+
   '<div class="card" style="border-color:var(--strong)">'+
    '<div class="row" style="align-items:baseline;gap:9px">'+
     '<div class="disp" style="font-weight:800;font-size:15px">'+yr(cur.s)+'</div>'+
     (pos?posPill(pos,cur.tier):'')+'<span class="spacer"></span>'+
     '<span style="font-size:11px;color:var(--t3)">'+esc(cur.lg||'')+'</span></div>'+
    '<div style="font-size:13px;color:var(--t2);margin-top:6px">'+
      w+'W '+d+'D '+l+'L so far'+(s.streak.c>=4?' · '+s.streak.c+' unbeaten':'')+'. '+
      esc(G.objective?'They asked for: '+G.objective.text+'.':'')+'</div>'+
    (cur.tro.length?'<div style="margin-top:8px">'+cur.tro.map(x=>
      '<span class="pill acc" style="margin-right:6px">'+esc(x)+'</span>').join('')+'</div>':'')+
    (cur.rec.length?'<div style="border-top:1px solid var(--hair);margin-top:10px;padding-top:9px">'+
      cur.rec.slice(-3).map(r=>'<div style="font-size:12px;color:var(--t3);padding:2px 0">'+
      '<span style="color:var(--acc)">◆</span> '+esc(r)+'</div>').join('')+'</div>':'')+
   '</div>';
}
function seasonCard(s,rv){
  const sub=s.chron.filter(x=>x.s===rv.s&&x.k!=='season').slice(0,4);
  return '<div class="card" style="cursor:pointer" onclick="HIST.season('+rv.s+')">'+
   '<div class="row" style="align-items:baseline;gap:9px">'+
    '<div class="disp" style="font-weight:800;font-size:15px">'+yr(rv.s)+'</div>'+
    posPill(rv.pos,rv.tier)+
    '<span class="spacer"></span>'+
    '<span style="font-size:11px;color:var(--t3)">'+esc(rv.lg)+'</span></div>'+
   '<div style="font-size:14px;line-height:20px;margin-top:7px">'+esc(rv.line)+'</div>'+
   (rv.tro.length?'<div style="margin-top:9px">'+rv.tro.map(t=>
     '<span class="pill acc" style="margin-right:6px">★ '+esc(t)+'</span>').join('')+'</div>':'')+
   (sub.length?'<div style="border-top:1px solid var(--hair);margin-top:10px;padding-top:9px">'+
     sub.map(x=>'<div style="font-size:12px;color:var(--t3);padding:2px 0;display:flex;gap:6px">'+
       '<span style="color:'+(x.k==='record'?'var(--acc)':x.k==='trophy'?'var(--acc)':'var(--t3)')+'">'+
       (x.k==='record'?'◆':x.k==='trophy'?'★':x.k==='era'?'§':'·')+'</span>'+
       '<span style="flex:1">'+esc(x.t)+'</span></div>').join('')+'</div>':'')+
   '<div style="font-size:11px;color:var(--t3);margin-top:9px">Read the season review ›</div>'+
  '</div>';
}

function recCard(big,label,detail,col){
  return '<div class="card" style="padding:12px 14px">'+
   '<div style="display:flex;align-items:baseline;gap:11px">'+
    '<div class="disp" style="font-weight:800;font-size:24px;line-height:26px;color:'+(col||'var(--acc)')+
      ';flex:0 0 auto;min-width:64px">'+esc(String(big))+'</div>'+
    '<div style="flex:1;min-width:0">'+
     '<div style="font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--t3)">'+
       esc(label)+'</div>'+
     '<div style="font-size:13px;color:var(--t2);line-height:18px">'+esc(detail)+'</div></div></div></div>';
}
function renderRecords(s){
  const r=s.rec||{};
  const none='<div class="card"><div class="dim">Not set yet. Go and set it.</div></div>';
  let h='<div class="sechead">On the pitch</div>';
  h+=r.win?recCard(r.win.f+'–'+r.win.a,'Biggest win','v '+r.win.o+' · '+yr(r.win.s)+(r.win.cp?' · '+r.win.cp:''),'var(--win)'):none;
  h+=r.loss?recCard(r.loss.f+'–'+r.loss.a,'Worst defeat','v '+r.loss.o+' · '+yr(r.loss.s)+(r.loss.cp?' · '+r.loss.cp:''),'var(--loss)'):none;
  h+=r.unb?recCard(r.unb.v,'Longest unbeaten run','Games without defeat'+(r.unb.m?', from '+r.unb.m:'')+' · '+yr(r.unb.s)):none;
  h+=r.fin?recCard(ord(r.fin.pos),'Highest finish',r.fin.lg+' · '+yr(r.fin.s)):none;
  h+=r.run?recCard('★','Best cup run',r.run.t+' · '+yr(r.run.s)):none;

  h+='<div class="sechead">Players</div>';
  h+=r.sea?recCard(r.sea.v,'Most goals in a season',r.sea.n+' · '+yr(r.sea.s)):none;
  h+=r.app?recCard(r.app.v,'Most appearances',r.app.n+' · under you'):none;

  h+='<div class="sechead">Money</div>';
  h+=r.buy?recCard(money(r.buy.f),'Record signing',r.buy.n+(r.buy.c?' from '+r.buy.c:'')+' · '+yr(r.buy.s),'var(--trf)'):none;
  h+=r.sell?recCard(money(r.sell.f),'Record sale',r.sell.n+(r.sell.c?' to '+r.sell.c:'')+' · '+yr(r.sell.s),'var(--trf)'):none;

  h+='<div class="card" style="margin-top:14px;font-size:12px;color:var(--t3)">'+
   'Records are kept from the day you walked in. What happened here before you is somebody else’s story.</div>';
  return h;
}

function renderHof(s){
  const list=s.hof.slice().sort((a,b)=>(b.tr*40+b.gl*2+b.ap)-(a.tr*40+a.gl*2+a.ap));
  let h='';
  if(!list.length){
    h+='<div class="card"><div style="font-size:14px;color:var(--t2);line-height:20px">'+
     'Empty. Nobody has done enough yet.</div>'+
     '<div style="font-size:12px;color:var(--t3);margin-top:8px">It takes 100 games, or 50 goals, '+
     'or a couple of trophies and 60 games. Roughly three seasons of first-team football.</div></div>';
  } else {
    h+='<div class="sechead">Inducted<span class="n">'+list.length+'</span></div>';
    list.forEach((x,i)=>{ h+=hofCard(s,x,i) });
  }
  /* who is close */
  const c=me();
  if(c){
    const near=[];
    c.squad.forEach(p=>{
      const k=String(p.id), e=s.car[k];
      if(!e||e.n!==p.name)return;
      if(s.hof.some(hh=>hh.k===k))return;
      const ap=e.ap+p.apps, gl=e.gl+p.goals;
      const pct=Math.max(ap/100,gl/50,(e.tr>=2?ap/60:0),(e.tr>=1?gl/30:0));
      if(pct>=0.45)near.push({p:p,ap:ap,gl:gl,pct:Math.min(0.99,pct)});
    });
    near.sort((a,b)=>b.pct-a.pct);
    if(near.length){
      h+='<div class="sechead">Knocking on the door</div><div class="card" style="padding:6px 14px 12px">'+
       near.slice(0,5).map(x=>'<div class="plr" onclick="showPlayer('+x.p.id+')">'+
         safe(()=>pface(x.p,34),'')+
         '<div class="nmw"><div class="nm2">'+esc(x.p.name)+'</div>'+
         '<div class="meta"><span>'+x.ap+' apps</span><span>'+x.gl+' goals</span></div></div>'+
         '<div class="ca" style="color:var(--acc);font-size:13px">'+Math.round(x.pct*100)+'%</div></div>').join('')+
       '</div>';
    }
  }
  return h;
}
function hofCard(s,x,i){
  const idx=s.hof.indexOf(x);
  return '<div class="card" style="cursor:pointer;padding:12px 14px" onclick="HIST.hof('+idx+')">'+
   '<div class="row" style="gap:12px;align-items:center">'+
    face(x,46)+
    '<div style="flex:1;min-width:0">'+
     '<div style="display:flex;align-items:center;gap:6px">'+
      '<span style="font-weight:700;font-size:15px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+
        esc(x.n)+'</span>'+
      (x.g?'':'<span class="pill" style="background:var(--accw);color:var(--acc)">Still here</span>')+'</div>'+
     '<div style="font-size:11px;color:var(--t3);margin-top:2px">'+esc(x.p)+' · '+x.f+'–'+x.t+' · '+
       x.ap+' apps · '+x.gl+' goals'+(x.tr?' · '+x.tr+' trophies':'')+'</div>'+
     '<div style="font-size:13px;color:var(--t2);margin-top:5px;line-height:18px">'+esc(x.ln)+'</div>'+
    '</div></div></div>';
}

/* ---------- sheets ---------- */
function openHof(i){
  const s=S(); const x=s.hof[i]; if(!x)return;
  safe(()=>sheet(
   '<div class="row" style="gap:14px;margin-bottom:14px">'+face(x,64)+
    '<div><h3 style="margin:0">'+esc(x.n)+'</h3>'+
    '<div class="dim" style="font-size:13px">'+esc(x.p)+' · '+x.f+'–'+x.t+
      (x.g?' · left the club':' · still here')+'</div></div></div>'+
   '<div class="slab" style="margin-bottom:14px"><div class="k">Hall of fame</div>'+
    '<div class="v" style="font-size:26px;line-height:29px">'+x.ap+' games</div>'+
    '<div class="d">'+esc(x.ln)+'</div></div>'+
   '<div class="card" style="background:var(--s1)">'+
    '<div class="kv"><span class="k2">Appearances</span><span class="v2">'+x.ap+'</span></div>'+
    '<div class="kv"><span class="k2">Goals</span><span class="v2">'+x.gl+'</span></div>'+
    '<div class="kv"><span class="k2">Assists</span><span class="v2">'+(x.as||0)+'</span></div>'+
    '<div class="kv"><span class="k2">Trophies won here</span><span class="v2">'+(x.tr||0)+'</span></div>'+
    '<div class="kv"><span class="k2">Ability at his best</span><span class="v2">'+(x.ca||'—')+'</span></div>'+
   '</div>'+
   '<div style="font-size:12px;color:var(--t3);margin:12px 2px 0">He stays here whatever happens to him next. '+
    'That is the point of a hall of fame.</div>'+
   '<button class="btn ghost" style="margin-top:14px" onclick="closeSheet()">Close</button>'));
}
function reviewHTML(s,rv,first){
  const col=rv.tro.length||rv.promoted?'var(--acc)':rv.hit?'var(--win)':'var(--loss)';
  const dark=col==='var(--acc)';
  let h='<div class="slab" style="background:'+col+';color:'+(dark?'var(--tinv)':'var(--tinv)')+';margin-bottom:14px">'+
   '<div class="k">'+yr(rv.s)+' · '+esc(rv.lg)+'</div>'+
   '<div class="v">'+ord(rv.pos)+'</div>'+
   '<div class="d">'+esc(rv.line)+'</div></div>';

  h+='<div class="card" style="background:var(--s1)">'+
   '<div class="kv"><span class="k2">Board asked for</span><span class="v2" style="font-size:13px">'+
     esc(rv.obj||('Top '+rv.op))+'</span></div>'+
   '<div class="kv"><span class="k2">You finished</span><span class="v2" style="color:'+
     (rv.hit?'var(--win)':'var(--loss)')+'">'+ord(rv.pos)+(rv.hit?' ✓':' ✗')+'</span></div>'+
   '<div class="kv"><span class="k2">Record</span><span class="v2">'+rv.W+'W '+rv.D+'D '+rv.L+'L</span></div>'+
   '<div class="kv"><span class="k2">Points</span><span class="v2">'+rv.pts+'</span></div>'+
   '<div class="kv"><span class="k2">Goals</span><span class="v2">'+rv.GF+'–'+rv.GA+'</span></div>'+
   (rv.eu?'<div class="kv"><span class="k2">Europe</span><span class="v2" style="font-size:13px">'+esc(rv.eu)+'</span></div>':'')+
   '</div>';

  h+='<div class="sechead">The run that decided it</div>'+
   '<div class="card"><div style="font-size:14px;line-height:20px">'+esc(rv.run||'—')+'</div></div>';

  if(rv.ts||rv.mvp){
    h+='<div class="sechead">Who did the work</div><div class="card" style="background:var(--s1)">'+
     (rv.ts?'<div class="kv"><span class="k2">Top scorer</span><span class="v2" style="font-size:13px">'+
       esc(rv.ts.n)+' — '+rv.ts.g+' in '+rv.ts.a+'</span></div>':'')+
     (rv.mvp?'<div class="kv"><span class="k2">Best of them</span><span class="v2" style="font-size:13px">'+
       esc(rv.mvp.n)+' — '+rv.mvp.r.toFixed(2)+' avg</span></div>':'')+
     '</div>';
  }
  if(rv.best||rv.worst){
    h+='<div class="sechead">The business</div><div class="card" style="background:var(--s1)">'+
     (rv.best?'<div class="kv"><span class="k2">Best signing</span><span class="v2" style="font-size:13px">'+
       esc(rv.best.n)+' — '+money(rv.best.f)+', '+rv.best.ap+' apps'+(rv.best.gl?', '+rv.best.gl+' goals':'')+
       '</span></div>':'')+
     (rv.worst?'<div class="kv"><span class="k2">Worst signing</span><span class="v2" style="font-size:13px;color:var(--loss)">'+
       esc(rv.worst.n)+' — '+money(rv.worst.f)+', '+rv.worst.ap+' apps</span></div>':'')+
     '</div>';
  }
  if(rv.tro.length){
    h+='<div class="sechead">Silverware</div><div class="card">'+
     rv.tro.map(t=>'<div style="font-size:15px;font-weight:700;padding:4px 0">★ '+esc(t)+'</div>').join('')+'</div>';
  }
  if(rv.rec.length){
    h+='<div class="sechead">Records broken</div><div class="card">'+
     rv.rec.map(r=>'<div style="font-size:13px;color:var(--t2);padding:4px 0;display:flex;gap:7px">'+
       '<span style="color:var(--acc)">◆</span><span style="flex:1">'+esc(r)+'</span></div>').join('')+'</div>';
  }
  if(rv.hof.length){
    h+='<div class="sechead">Into the hall of fame</div><div class="card">'+
     rv.hof.map(n=>'<div style="font-size:14px;font-weight:600;padding:4px 0">'+esc(n)+'</div>').join('')+'</div>';
  }
  h+='<div class="sechead">What the board made of it</div>'+
   '<div class="card"><div style="font-size:14px;line-height:20px">'+esc(rv.board)+'</div></div>';
  h+='<button class="btn" style="margin-top:16px" onclick="HIST.done()">'+
    (first?'Start pre-season':'Close')+'</button>';
  return h;
}
function openReview(season,first){
  const s=S();
  const rv=s.seasons.filter(x=>x.s===season)[0]||s.seasons[s.seasons.length-1];
  if(!rv)return;
  if(s.pend===rv.s)s.pend=0;
  safe(()=>sheet(reviewHTML(s,rv,!!first)));
}

/* ============================================================
   PUBLIC HANDLERS (functions only — all state lives in SW.state)
   ============================================================ */
window.HIST={
  seg(k){ const s=S(); s.seg=k; safe(()=>render()) },
  open(){ G.clubView='history'; G.tab='club'; safe(()=>closeSheet()); safe(()=>render()) },
  season(n){ openReview(n,false) },
  hof(i){ openHof(i) },
  review(){ const s=S(); openReview(s.pend||(s.seasons.length?s.seasons[s.seasons.length-1].s:0),false) },
  done(){ safe(()=>closeSheet()); G.tab='home'; safe(()=>save()); safe(()=>render()) }
};

/* ============================================================
   REGISTRATION
   ============================================================ */
SW.register({
  id:ID,

  init(){ const s=S(); s.from=G.season; s.cl=G.chronicle?G.chronicle.length:0; },
  onLoad(){ const s=S(); sync(s); refreshHof(s); },

  onWeek(){ const s=S(); sync(s); },

  onMatchEnd(m){
    const s=S(); s.lastRec=null; sync(s);
    onMatch(s,m);
  },

  onSeasonEndBefore(){ const s=S(); beginWrap(s); },

  onSeasonEndAfter(info){
    const s=S();
    finishSeason(s,info);
    /* the review is the moment of the season — take the sheet once the core is done with it */
    if(typeof document!=='undefined'&&document.body&&s.pend){
      const season=s.pend;
      setTimeout(function(){ safe(()=>openReview(season,true)) },40);
    }
  },

  /* the season just gone, if it has not been read */
  hubCards(){
    const s=S();
    if(!s.pend)return [];
    return [{ic:'❖',bg:'var(--accw)',col:'var(--acc)',
      a:yr(s.pend)+' — the season just gone',b:'Read the review',
      fn:'HIST.review()',priority:45}];
  },

  /* a taste of the chronicle on the club overview */
  clubBlocks(){
    const s=S(); sync(s);
    const lines=s.chron.filter(x=>x.k==='season'||x.k==='trophy').slice(0,3);
    if(!lines.length)return [];
    return ['<div class="sechead">The story so far</div>'+
     '<div class="card" style="cursor:pointer;margin-bottom:14px" onclick="HIST.open()">'+
      lines.map(x=>'<div class="kv"><span class="k2">'+yr(x.s)+'</span>'+
        '<span class="v2" style="font-weight:600;font-size:13px;text-align:right">'+esc(x.t)+'</span></div>').join('')+
      '<div style="font-size:11px;color:var(--t3);margin-top:9px">The full chronicle ›</div></div>'];
  },

  clubViews(){ return [{key:'history',label:'History',render:viewHistory}] },

  /* records broken in the match you just watched */
  reportBlocks(){
    const s=S();
    if(!s.lastRec||!s.lastRec.length)return [];
    return ['<div class="sechead" style="margin-top:14px">For the record books</div>'+
      s.lastRec.map(r=>'<div class="card" style="background:var(--s1);border-color:var(--acc)">'+
      '<div style="font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--acc)">'+
        esc(r.t)+'</div>'+
      '<div style="font-size:14px;line-height:19px;margin-top:4px">'+esc(r.b)+'</div></div>').join('')];
  },

  /* ---------- published interface ---------- */
  record(type,text){
    const s=S(); const t=String(text||'').trim().slice(0,150);
    if(!t)return false;
    if(type==='trophy'){ addTrophy(s,t.replace(/^won the /i,'').replace(/\.$/,'')); }
    else if(type==='record'){ breakNote(s,'Club record',t); }
    else if(type==='milestone'){ pushChron(s,'milestone',t); }
    else if(type==='era'){ pushChron(s,'era',t); s.eraSeen=t; }
    else pushChron(s,'milestone',t);
    return true;
  },
  stat(key){
    const s=S(); const t=s.tot;
    switch(key){
      case 'seasons': return s.seasons.length;
      case 'games': return t.g;
      case 'wins': return t.w;
      case 'draws': return t.d;
      case 'losses': return t.l;
      case 'goalsFor': return t.gf;
      case 'goalsAgainst': return t.ga;
      case 'trophies': return t.tro;
      case 'titles': return t.ttl;
      case 'promotions': return t.pro;
      case 'relegations': return t.rel;
      case 'spend': return t.spend;
      case 'sold': return t.sold;
      case 'unbeaten': return s.rec.unb?s.rec.unb.v:0;
      case 'bestFinish': return s.rec.fin?s.rec.fin.pos:0;
      case 'hallOfFame': return s.hof.length;
      case 'winPct': return t.g?Math.round(t.w/t.g*100):0;
      case 'firstSeason': return s.from;
      default: return undefined;
    }
  },
  /* extras — other modules may use them, nobody has to */
  signing(name,fee,from){ const s=S(); signing(s,String(name||''),fee|0,String(from||'')); return true },
  sale(name,fee,to){ const s=S(); sale(s,String(name||''),fee|0,String(to||'')); return true },
  hallOfFame(){ return S().hof.map(h=>({name:h.name||h.n,pos:h.p,apps:h.ap,goals:h.gl,trophies:h.tr})) },
  chronicle(){ return S().chron.slice(0,40).map(x=>({season:x.s,kind:x.k,text:x.t})) },
  eras(){ return (S().eras||[]).map(e=>({from:e.a,to:e.b,name:e.t})) }
});

})();
