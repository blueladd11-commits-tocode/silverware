/* ============================================================
   50-morale.js — player morale and the dressing room
   Owns: p.morale, squad harmony, the conversation, the Dressing room view.

   Four other modules call adjust(). The interface is built first and
   defends itself: it works before init, before any render, and when the
   player id belongs to a club that no longer exists.

   Design line: losing the dressing room is a different way to fail than
   losing matches. Morale barely touches the pitch. It costs you the squad.
   ============================================================ */
(function(){
'use strict';

/* ---------- state ------------------------------------------------------
   S.v   {pid:morale}          authoritative store — core save() does NOT
                               persist player objects, so p.morale would be
                               lost on load. We own it and re-apply on load.
   S.t   {pid:track}           per-player tracking (starts, promises, memory)
   S.log {pid:[{w,d,r}]}       last few reasons, newest first
   S.q   [pid]                 knocking on your door
   S.ld  [pid]                 senior pros who hold the room together
   S.gm  games played this season by your club
------------------------------------------------------------------------ */
function S(){
  const s=SW.state('morale');
  if(!s.v)s.v={}; if(!s.t)s.t={}; if(!s.log)s.log={};
  if(!s.q)s.q=[]; if(!s.ld)s.ld=[]; if(typeof s.gm!=='number')s.gm=0;
  if(typeof s.sn!=='number')s.sn=(typeof G!=='undefined'&&G.season)||0;
  return s;
}
function trk(id){
  const s=S();
  if(!s.t[id])s.t[id]={st:0,sb:0,oop:0,ls:-1,ask:-99,tr:0,deep:0,req:0,prom:null,mem:{}};
  return s.t[id];
}
const MYCLUB=()=>(typeof G!=='undefined'&&G.clubs&&G.clubs.length)?G.clubs[G.me]:null;
function findPlayer(id){
  if(typeof G==='undefined'||!G.clubs)return null;
  const c=MYCLUB();
  if(c){const f=c.squad.find(x=>x.id===id);if(f)return f}
  for(const cl of G.clubs){const f=cl.squad.find(x=>x.id===id);if(f)return f}
  return null;
}
const MONTHNAME={Aug:'August',Sep:'September',Oct:'October',Nov:'November',Dec:'December',
  Jan:'January',Feb:'February',Mar:'March',Apr:'April',May:'May'};
const monthOf=w=>MONTHNAME[MONTHS[clamp(w,0,37)]]||'the start of the season';
const surname=p=>String(p.name).split(' ').pop();

/* ---------- the store -------------------------------------------------- */
function get(p){
  const s=S();
  if(s.v[p.id]===undefined)s.v[p.id]=typeof p.morale==='number'?p.morale:20;
  return s.v[p.id];
}
/* internal setter — takes the object, so the weekly loop never re-scans */
function bump(p,delta,reason){
  if(!p)return 0;
  const s=S();
  const d=clamp(Number(delta)||0,-100,100);
  const now=clamp(get(p)+d,-100,100);
  s.v[p.id]=now; p.morale=now;
  if(reason&&Math.abs(d)>=1){
    if(!s.log[p.id])s.log[p.id]=[];
    s.log[p.id].unshift({w:(typeof G!=='undefined'?G.week:0),d:Math.round(d),r:String(reason)});
    s.log[p.id].length=Math.min(s.log[p.id].length,5);
  }
  return now;
}

/* ---------- pecking order and expectation ------------------------------
   A man's expectation is his ability rank in the squad, stretched or
   shrunk by how ambitious he is. High ability + no minutes is the worst
   combination in football and the model has to say so loudly.
------------------------------------------------------------------------ */
function pecking(c){
  const sq=squadOf(c).slice().sort((a,b)=>CA(b)-CA(a));
  const m={}; sq.forEach((p,i)=>m[p.id]=i);
  return {rank:m,n:sq.length};
}
function expectedShare(p,rank){
  const slack=(p.amb-55)/9;                 // ambitious men think they are higher up
  const line=11+slack;                      // where he thinks the XI ends
  const byRank=clamp(1-(rank+0.5)/Math.max(4,line),0,1);
  /* even the twelfth man expects SOME football. Nobody signs up to watch. */
  const floor=clamp(0.10+p.amb*0.0022,0.10,0.32);
  return Math.max(byRank,floor);
}
function xiAvg(c){
  if(!c.xi||!c.xi.length)return 55;
  return c.xi.reduce((s,x)=>s+CA(x.p,x.slot),0)/c.xi.length;
}

/* ---------- wage fairness ----------------------------------------------
   wageFor(p) is the calibrated fair wage for his ability. Anyone paid far
   above it is the wage structure breaker, and the men around him know.
------------------------------------------------------------------------ */
function wageBreaker(c){
  const sq=squadOf(c); if(sq.length<8)return null;
  let worst=null,wr=1.35;
  sq.forEach(p=>{
    const fair=Math.max(1000,wageFor(p));
    const r=p.wage/fair;
    if(r>wr){wr=r;worst=p}
  });
  return worst?{p:worst,ratio:wr}:null;
}

/* ---------- leaders ----------------------------------------------------
   A senior professional who actually plays steadies the men around him.
   Cheap: recomputed once a week, two names maximum.
------------------------------------------------------------------------ */
function computeLeaders(c){
  const s=S(),games=s.gm;
  const inXI=id=>(c.xi||[]).some(x=>x.p.id===id);
  const plays=p=>games>=6?trk(p.id).st/games>=0.45:inXI(p.id);
  const cands=squadOf(c).filter(p=>p.age>=27&&p.prof>=70&&plays(p));
  cands.sort((a,b)=>(b.prof*2+b.age*3+CA(b))-(a.prof*2+a.age*3+CA(a)));
  return cands.slice(0,2).map(p=>p.id);
}
const isLeader=id=>S().ld.indexOf(id)>=0;

/* ---------- drivers ----------------------------------------------------
   Every line here is computed from live data at the moment it is read, so
   it is always true. Weight decides which one gets shown.
------------------------------------------------------------------------ */
function drivers(c,p){
  const s=S(),t=trk(p.id),games=s.gm,out=[];
  const pk=pecking(c),rank=pk.rank[p.id]===undefined?pk.n:pk.rank[p.id];
  const exp=expectedShare(p,rank);
  const share=games?t.st/games:0;
  const avgXI=xiAvg(c);
  const quality=CA(p)-avgXI;

  /* minutes — the big one */
  if(games>=4&&exp>=0.13){
    if(t.st===0){
      out.push({w:100,neg:1,txt:'Has not started a game all season'});
    } else if(share<0.22&&G.week-t.ls>=4){
      out.push({w:92,neg:1,txt:'Hasn’t started since '+monthOf(t.ls)});
    } else if(share<0.22){
      out.push({w:90,neg:1,txt:t.st===1?('One start in '+games+' games. One.')
        :(t.st+' starts in '+games+' games and he counts every one')});
    } else if(share<exp-0.28){
      out.push({w:74,neg:1,txt:'Started '+t.st+' of '+games+' and thinks that is an insult'});
    }
    if(quality>2&&share<0.4&&t.st<games*0.4){
      out.push({w:96,neg:1,txt:'One of the best players here and he is watching from the bench'});
    }
  }
  /* wage fairness */
  const wb=wageBreaker(c);
  if(wb&&wb.p.id!==p.id&&p.wage<wb.p.wage*0.75&&CA(p)>=CA(wb.p)-3){
    out.push({w:86,neg:1,txt:'Thinks he’s worth more than '+surname(wb.p)});
  }
  /* contract */
  if(p.years<=1&&p.amb>55&&!p.youth){
    out.push({w:70,neg:1,txt:'Twelve months left and nobody has spoken to him'});
  }
  /* listed / rumours */
  if(p.listed&&t.req){
    out.push({w:98,neg:1,txt:'Has asked to leave. It is in writing.'});
  } else if(p.listed){
    out.push({w:88,neg:1,txt:'You put him on the list. He found out like everyone else.'});
  } else if(quality>6&&c.rep<58&&p.amb>72&&games>=6){
    out.push({w:58,neg:1,txt:'Bigger clubs are being mentioned to him and he is listening'});
  }
  /* out of position */
  if(t.oop>=3){
    out.push({w:66,neg:1,txt:'Keeps being asked to fill in away from '+p.pos+'. He is not a utility man.'});
  }
  /* hooked */
  if(t.sb>=3){
    out.push({w:62,neg:1,txt:'Taken off '+t.sb+' times. He takes it personally.'});
  }
  /* results */
  const f=(c.form||[]).slice(-5);
  const losses=f.filter(x=>x==='L').length, wins=f.filter(x=>x==='W').length;
  if(losses>=3)out.push({w:56,neg:1,txt:'Sick of getting beaten — '+losses+' defeats in the last '+f.length});
  /* broken promise still hanging */
  if(t.prom)out.push({w:64,neg:1,txt:'You told him in '+monthOf(t.prom.w)+' he was in your plans'});

  /* --- the good side --- */
  if(share>=0.7&&games>=4){
    const rt=p.ratings.length?p.ratings.slice(-5).reduce((a,b)=>a+b,0)/Math.min(5,p.ratings.length):6.5;
    if(rt>=7.0)out.push({w:50,neg:0,txt:'Playing every week and playing well'});
    else out.push({w:40,neg:0,txt:'Never out of the side. That is all he wanted.'});
  }
  if(isLeader(p.id))out.push({w:46,neg:0,txt:'Sets the tone in there. The young ones copy him.'});
  if(wins>=3)out.push({w:38,neg:0,txt:'Winning covers most things and they are winning'});
  if(p.age<=21&&t.st>=3)out.push({w:44,neg:0,txt:'Getting his chance at '+p.age+' and taking it'});

  /* always something true to say */
  if(!out.length){
    out.push({w:5,neg:0,txt:games?('Started '+t.st+' of '+games+'. Says nothing either way.')
      :'Nothing to judge yet. The season has not started.'});
  }
  out.sort((a,b)=>b.w-a.w);
  return out;
}

/* ---------- mood words — never a number -------------------------------- */
function moodWord(m){
  return m>=45?'Flying':m>=20?'Happy':m>=5?'Content':m>=-10?'Fine'
    :m>=-30?'Unsettled':m>=-55?'Unhappy':'Wants out';
}
function moodCol(m){
  return m>=20?'var(--win)':m>=-10?'var(--t2)':m>=-30?'var(--acc)':m>=-55?'var(--inj)':'var(--loss)';
}
function moodStrip(m){
  const lit=clamp(Math.round((m+100)/200*6),0,6),col=moodCol(m);
  let o='<span style="display:inline-flex;gap:2px;vertical-align:-1px">';
  for(let i=0;i<6;i++)o+=`<i style="width:7px;height:7px;border-radius:2px;display:block;font-style:normal;
    background:${i<lit?col:'var(--s3)'}"></i>`;
  return o+'</span>';
}

/* ---------- harmony ---------------------------------------------------- */
function harmonyParts(){
  const c=MYCLUB(); if(!c)return {h:0,mood:0,wage:0,form:0,breaker:null};
  const sq=squadOf(c); if(!sq.length)return {h:0,mood:0,wage:0,form:0,breaker:null};
  let num=0,den=0;
  sq.forEach(p=>{
    const inXI=c.xi&&c.xi.some(x=>x.p.id===p.id);
    const w=inXI?2:1;
    num+=get(p)*w; den+=w;
  });
  const mood=den?num/den:0;
  const wb=wageBreaker(c);
  const wage=wb?-clamp((wb.ratio-1.35)*34,0,20):0;
  const f=(c.form||[]).slice(-5);
  const form=clamp(f.reduce((s,x)=>s+(x==='W'?2.6:x==='D'?0.4:-2.4),0),-12,12);
  return {h:clamp(Math.round(mood*0.82+wage+form),-100,100),mood,wage,form,breaker:wb};
}
function harmonyWord(h){
  return h>=55?'They would run through a wall for you'
    :h>=30?'Good room. Nobody is sulking.'
    :h>=10?'Settled. Quiet, but settled.'
    :h>=-10?'A bit flat. Two or three want a word.'
    :h>=-35?'Fraying. You have lost part of this room.'
    :'You have lost the dressing room.';
}

/* ---------- where a man's mood belongs ---------------------------------
   Morale is not a running total of good and bad news. It settles at the
   level his circumstances deserve, and events push it off that level for
   a few weeks. That is what makes a bad patch temporary and a season on
   the bench permanent — and it is why a conversation buys time, not peace.
------------------------------------------------------------------------ */
function situationTarget(c,p,ctx){
  const t=trk(p.id),games=ctx.games;
  let T=12+(p.prof-55)*0.11;                        // pros sit a little steadier

  /* minutes — far and away the biggest term */
  if(games>=4){
    const rank=ctx.rank[p.id]===undefined?ctx.n:ctx.rank[p.id];
    const exp=expectedShare(p,rank);
    const share=t.st/games;
    const gap=share-exp;
    if(gap<0){
      const q=clamp(1+(CA(p)-ctx.avg)/16,0.5,2.2);  // quality he thinks he has
      const drive=0.62+0.006*p.amb;                 // and how much he wants it
      T+=gap*70*q*drive;
    } else {
      T+=Math.min(gap,0.35)*22;
    }
    /* not rotation. Frozen out. */
    if(games>=8&&share<0.08)T-=24*(0.5+0.009*p.amb);
  }
  /* contract nobody has mentioned */
  if(p.years<=1&&p.amb>55&&!p.youth)T-=8+(p.amb-55)*0.24;
  /* on the list */
  if(p.listed)T-=t.req?10:22;
  /* somebody in there is on silly money */
  if(ctx.wb&&ctx.wb.p.id!==p.id&&p.wage<ctx.wb.p.wage*0.75&&CA(p)>=CA(ctx.wb.p)-3)
    T-=10+clamp((ctx.wb.ratio-1.35)*22,0,10);
  /* asked to be somebody he is not */
  if(t.oop>=3)T-=5+Math.min(t.oop,8);
  /* hooked, repeatedly */
  if(t.sb>=3)T-=3+Math.min(t.sb,8)*1.4;
  /* results */
  T+=ctx.form;
  /* the senior pros hold the level up — or drag it down with them */
  if(ctx.ld.length&&!isLeader(p.id))T+=clamp(ctx.leaderMood*0.14,-9,7);
  return clamp(T,-95,72);
}

/* ---------- weekly tick ------------------------------------------------ */
function weekly(w){
  const c=MYCLUB(); if(!c)return;
  const s=S();
  if(s.sn!==G.season){resetSeason();s.sn=G.season}

  s.ld=computeLeaders(c);
  const leaderMood=s.ld.length?s.ld.reduce((a,id)=>{
    const p=c.squad.find(x=>x.id===id);return a+(p?get(p):0)},0)/s.ld.length:0;

  const pk=pecking(c);
  const f=(c.form||[]).slice(-5);
  const ctx={games:s.gm,rank:pk.rank,n:pk.n,avg:xiAvg(c),wb:wageBreaker(c),ld:s.ld,leaderMood,
    form:clamp(f.reduce((a,x)=>a+(x==='W'?2.2:x==='D'?0.3:-2.0),0),-9,9)};

  squadOf(c).forEach(p=>{
    const t=trk(p.id),m=get(p);
    const T=situationTarget(c,p,ctx);
    /* resentment builds slowly; it lifts faster once he is playing again */
    const rate=T>m?0.20:0.13;
    const d=(T-m)*rate;
    if(Math.abs(d)>=0.3)bump(p,d,null);
    t.deep=get(p)<=-55?t.deep+1:0;
  });

  promises(c);
  requests(c);
  leaderLoss(c);
  buildQueue(c);
}

/* a promise made in the office is checked six weeks later */
function promises(c){
  const s=S();
  c.squad.forEach(p=>{
    const t=s.t[p.id]; if(!t||!t.prom)return;
    if(G.week-t.prom.w<6)return;
    const gained=t.st-t.prom.at;
    if(gained>=2){
      bump(p,13,'You said he was in your plans. He was.');
      t.tr=clamp(t.tr+1,-3,3);
    } else {
      bump(p,-26,'You promised him minutes in '+monthOf(t.prom.w)+'. He has had none.');
      t.tr=clamp(t.tr-2,-3,3);
      note(p.name+' has stopped believing you',
        'You told him he was in your plans in '+monthOf(t.prom.w)+'. He has started '+gained+
        ' game'+(gained===1?'':'s')+' since. He is not coming to see you again in a good mood.',{from:vP(p)});
      t.ask=-99;
    }
    t.prom=null;
  });
}

/* long-term misery becomes a formal transfer request */
function requests(c){
  const s=S();
  squadOf(c).forEach(p=>{
    const t=trk(p.id);
    if(t.req||p.youth)return;
    if(t.deep>=3&&get(p)<=-58){
      t.req=G.week; p.listed=true;
      const why=drivers(c,p).find(x=>x.neg);
      note(p.name+' has asked to leave',
        (why?why.txt+'. ':'')+'He wants away. He is on the list until you change his mind or someone takes him.',{from:vP(p)});
      chron(p.name+' asked to leave');
      bump(p,-4,'Handed in a transfer request');
    }
  });
}

/* selling the man who ran the room costs more than his ability */
function leaderLoss(c){
  const s=S();
  if(!s.was)s.was=[];
  const now=new Set(c.squad.map(p=>p.id));
  s.was.forEach(rec=>{
    if(now.has(rec.id))return;
    squadOf(c).forEach(p=>bump(p,-(6+rnd()*7),'Lost '+rec.n+', and they knew who held that room together'));
    note('The room feels different','You sold '+rec.n+'. He was the one who sorted things out in there '+
      'before they reached you. Somebody else has to do it now, and nobody has volunteered.',{from:vV('staff')});
  });
  s.was=s.ld.map(id=>{const p=c.squad.find(x=>x.id===id);return p?{id,n:p.name}:null}).filter(Boolean);
}

/* who is knocking — hard cap of two a week, per the research */
function buildQueue(c){
  const s=S();
  s.q=s.q.filter(id=>{
    const p=c.squad.find(x=>x.id===id);
    return p&&get(p)<=-22;
  });
  if(s.q.length>=2)return;
  const cands=squadOf(c).filter(p=>{
    const t=trk(p.id);
    return get(p)<=-30&&G.week-t.ask>=6&&s.q.indexOf(p.id)<0;
  }).sort((a,b)=>(get(a)-CA(a)*0.4)-(get(b)-CA(b)*0.4));
  while(s.q.length<2&&cands.length)s.q.push(cands.shift().id);
}

/* ---------- match day -------------------------------------------------- */
function matchEnd(m){
  const c=MYCLUB(); if(!c)return;
  if(m.hi!==G.me&&m.ai!==G.me)return;
  const s=S();
  s.gm++;
  const side=m.hi===G.me?0:1;
  const gf=m.R.g[side],ga=m.R.g[1-side];
  const won=gf>ga,drew=gf===ga,margin=ga-gf;

  const started=new Set();
  (c.xi||[]).forEach(({slot,p})=>{
    started.add(p.id);
    const t=trk(p.id);
    t.st++; t.ls=G.week;
    if(slot!==p.pos&&CA(p,slot)<CA(p)*0.94)t.oop++;
    /* his own afternoon */
    const rt=p.ratings.length?p.ratings[p.ratings.length-1]:6.5;
    let d=won?2.2:drew?0.2:-1.8;
    if(rt>=7.5)d+=2.4; else if(rt<=5.4)d-=1.6;
    if(margin>=3)d-=2.6;
    /* only the heavy ones are worth remembering by name */
    bump(p,d,margin>=3?('Beaten '+gf+'–'+ga):null);
  });
  squadOf(c).forEach(p=>{
    if(started.has(p.id))return;
    const t=trk(p.id);
    /* he did not play, so this was not his afternoon. The club's form still
       moves him, but through the target, not as a personal reward. */
    if(t.ls>=0&&G.week-t.ls>=8)bump(p,-0.8,null);
  });
}

/* ---------- season boundaries ------------------------------------------ */
function resetSeason(){
  const s=S(),c=MYCLUB();
  const played=s.gm;
  s.gm=0; s.q=[];
  const keep=new Set(c?c.squad.map(p=>p.id):[]);
  Object.keys(s.t).forEach(k=>{
    const id=+k;
    if(!keep.has(id)){delete s.t[k];delete s.log[k];delete s.v[k];return}
    const t=s.t[k];
    /* pre-season wipes most grudges — but not if you froze him out all year */
    const frozenOut=played>=10&&t.st<=played*0.2;
    t.st=0;t.sb=0;t.oop=0;t.ls=-1;t.deep=0;t.prom=null;t.ask=-99;
    const p=c&&c.squad.find(x=>x.id===id);
    if(p){
      const m=get(p);
      s.v[id]=clamp(Math.round(m*(m<0&&frozenOut?0.74:0.42)+8),-100,100);
      p.morale=s.v[id];
    }
  });
  /* anything left in the value store that is not ours any more */
  Object.keys(s.v).forEach(k=>{if(!keep.has(+k)){delete s.v[k];delete s.log[k]}});
}

/* ---------- the conversation ------------------------------------------- */
const OPENER={
  minutes:['I’m not asking for favours. I’m asking why I’m sat there every week.',
           'You brought me here to play. I’ve played about twenty minutes of football.'],
  wage:['Half that room knows what {X} is on. I’m not doing this for what I’m on.',
        'I’m not greedy. I just don’t like being the mug in the corner.'],
  contract:['A year left and nobody’s said a word to me. What am I supposed to think?',
            'My agent’s taking calls. I’d rather he wasn’t. Sort my deal out.'],
  listed:['I found out I was for sale the same way the fans did. That’s the bit that hurts.',
          'You want me gone, fine. Say it to me first.'],
  oop:['I’m a {P}. I’ve spent two months somewhere else. I’m not a utility man.',
       'Every week it’s a different job. I don’t know what I am here any more.'],
  subbed:['Three games running you’ve taken me off. Am I not fit enough, or not good enough?',
          'I can’t play scared of the board going up. That’s what it’s become.'],
  results:['We’re getting beaten every week and nobody in there says anything. Somebody has to.',
           'It’s dead in that room, gaffer. Dead.'],
  broken:['You told me I was in your plans. I counted the games since. So has my wife.',
          'You looked me in the eye in {M} and said I’d play. I haven’t.'],
  flat:['I don’t want a row. I want to know where I stand. That’s it.',
        'I’ve had enough of guessing. Just tell me straight.']
};
function openerFor(c,p){
  const t=trk(p.id),d=drivers(c,p),top=d.find(x=>x.neg);
  const wb=wageBreaker(c);
  let key='flat';
  if(t.prom)key='broken';
  else if(top){
    const s=top.txt;
    if(/started|bench|insult/i.test(s))key='minutes';
    else if(/worth more/i.test(s))key='wage';
    else if(/months left/i.test(s))key='contract';
    else if(/list|leave/i.test(s))key='listed';
    else if(/fill in/i.test(s))key='oop';
    else if(/Taken off/i.test(s))key='subbed';
    else if(/beaten/i.test(s))key='results';
  }
  const pool=OPENER[key]||OPENER.flat;
  let line=pool[p.amb>60?0:pool.length-1];
  line=line.replace('{X}',wb?surname(wb.p):'the new lad')
           .replace('{P}',p.pos)
           .replace('{M}',t.prom?monthOf(t.prom.w):'pre-season');
  return {line,key,top:top?top.txt:null};
}
const MODES={
  calm:{lbl:'Tell him he’s in my plans',sub:'A promise. He will check whether you keep it.'},
  true:{lbl:'Level with him',sub:'Say why he is not playing. It might land, it might not.'},
  prove:{lbl:'Tell him to earn it',sub:'No comfort. Train better or sit there.'}
};
function odds(p,mode,tr){
  const tt=p.trait;let q;
  if(mode==='calm'){
    q=0.54+(p.prof-55)*0.004-(p.amb-55)*0.005;
    if(tt==='Model professional')q+=0.14; if(tt==='Loyal servant')q+=0.13;
    if(tt==='Mercenary')q-=0.18; if(tt==='Hot-headed')q-=0.06;
  } else if(mode==='true'){
    q=0.46+(p.prof-55)*0.008-Math.max(0,p.amb-70)*0.006;
    if(tt==='Model professional')q+=0.20; if(tt==='Dressing-room leader')q+=0.16;
    if(tt==='Hot-headed')q-=0.24; if(tt==='Mercenary')q-=0.10;
  } else {
    q=0.40+(p.big-55)*0.007+(p.amb-55)*0.004-Math.max(0,70-p.prof)*0.004;
    if(tt==='Big-game player')q+=0.16; if(tt==='Fan favourite')q+=0.05;
    if(tt==='Bottler')q-=0.21; if(tt==='Hot-headed')q-=0.09;
  }
  q+=clamp(tr*0.06,-0.18,0.18);
  return clamp(q,0.08,0.94);
}
/* the assistant recommends. He is confident once you have spoken to the
   man before, and guessing before that — like a real assistant. */
function advise(p,t){
  const known=Object.keys(t.mem||{}).length;
  if(known){
    let best='true',bq=-1;
    ['calm','true','prove'].forEach(m=>{const q=odds(p,m,t.tr);if(q>bq){bq=q;best=m}});
    const memo=t.mem[best];
    return {mode:best,why:memo?(memo.ok?'It worked with him last time. Same again.'
      :'Last time this went badly. But it is still the best of a bad set.')
      :'From what we have seen of him, that is the one.'};
  }
  if(p.age>=30)return {mode:'true',why:'He is old enough to be told the truth. Do not dress it up.'};
  if(p.age<=21)return {mode:'calm',why:'He is a kid. He needs to hear he has a future here.'};
  if(p.apps===0)return {mode:'prove',why:'He has not earned a promise yet. Make him work for it.'};
  return {mode:'true',why:'I do not know him well enough to guess. Straight is usually safest.'};
}

function talk(id){
  const c=MYCLUB(); if(!c)return;
  const p=c.squad.find(x=>x.id===id); if(!p)return;
  const t=trk(id),o=openerFor(c,p),a=advise(p,t);
  const mem=[];
  ['calm','true','prove'].forEach(m=>{
    const k=t.mem&&t.mem[m];
    if(k)mem.push(`<div class="kv"><span class="k2">${esc(MODES[m].lbl)}</span>
      <span class="v2" style="color:${k.ok?'var(--win)':'var(--loss)'}">${k.ok?'✓ landed':'✗ backfired'} · ${esc(monthOf(k.w))}</span></div>`);
  });
  sheet(`<div class="row" style="margin-bottom:12px;align-items:flex-start">
     ${avatar(vP(p),76)}
     <div style="min-width:0"><h3 style="margin:0">${esc(p.name)}</h3>
      <div class="dim" style="font-size:13px">${p.pos} · ${p.age} · ${esc(moodWord(get(p)))}</div></div>
     <span class="spacer"></span>${moodStrip(get(p))}</div>
   <div class="card" style="background:var(--s1);border-color:var(--strong);margin-bottom:14px">
     <div style="font-size:15px;line-height:21px">“${esc(o.line)}”</div>
     ${o.top?`<div class="dim" style="font-size:12px;margin-top:8px">${esc(o.top)}</div>`:''}</div>
   ${mem.length?`<div class="sechead">What you have tried with him</div>
     <div class="card" style="background:var(--s1);padding:4px 14px 8px;margin-bottom:12px">${mem.join('')}</div>`:''}
   ${['calm','true','prove'].map(m=>`<div class="opt ${a.mode===m?'rec':''}"
     onclick="SW.get('morale').answer(${id},'${m}')">
     <div><div style="font-weight:600">${esc(MODES[m].lbl)}</div>
      <div class="dim" style="font-size:12px">${esc(MODES[m].sub)}</div></div>
     ${a.mode===m?'<span class="st">Assistant</span>':''}</div>`).join('')}
   <div class="card" style="margin-top:4px;background:var(--s1)">
     <div style="font-size:13px;color:var(--t2)"><b style="color:var(--acc)">◆ Assistant Coach</b> — ${esc(a.why)}</div></div>
   <button class="btn ghost" style="margin-top:10px" onclick="closeSheet();render()">Leave it for now</button>`);
}

function answer(id,mode){
  const c=MYCLUB(); if(!c)return;
  const p=c.squad.find(x=>x.id===id); if(!p)return;
  const t=trk(id);
  if(!MODES[mode])mode='true';
  const ok=rnd()<odds(p,mode,t.tr);
  let d,head,body;
  if(mode==='calm'){
    if(ok){d=16+rnd()*8;head='He believed you';
      body='He nodded and went back in. You have bought yourself six weeks and no longer.';
      t.prom={w:G.week,at:t.st};}
    else{d=-(6+rnd()*7);head='He has heard it before';
      body='“Everyone’s in the plans, gaffer.” He was out the door before you finished.';}
  } else if(mode==='true'){
    if(ok){d=12+rnd()*9;head='He took it';
      body='He did not like it. He respected it. That is the most you get in this job.';}
    else{d=-(14+rnd()*9);head='That did not go well';
      body='You told him the truth and he heard "you are finished here". He may be right.';}
  } else {
    if(ok){d=10+rnd()*8;head='He fancied it';
      body='He wanted a fight and you gave him one. He was first in on Monday.';
      p.form=clamp(p.form+0.25,-2,2);}
    else{d=-(12+rnd()*9);head='He has downed tools';
      body='He decided there was no way back. There is a difference between a challenge and a dismissal, and he did not hear a challenge.';}
  }
  bump(p,d,MODES[mode].lbl);
  if(!t.mem)t.mem={};
  t.mem[mode]={w:G.week,ok:ok?1:0};
  t.tr=clamp(t.tr+(ok?1:-1),-3,3);
  t.ask=G.week;
  const s=S(); s.q=s.q.filter(x=>x!==id);

  /* talked round a transfer request */
  let extra='';
  if(t.req&&get(p)>-25){t.req=0;p.listed=false;
    extra='<div class="pill acc" style="margin-top:12px;padding:9px 12px">He has withdrawn the request. Off the list.</div>';
    note(p.name+' is staying','He has taken his transfer request back. Do not waste it.',{from:vP(p)});}

  sheet(`${speakerBar(vP(p),null,'',p.pos+' \u00b7 '+p.age+' \u00b7 '+moodWord(get(p)))}
   <h3>${esc(head)}</h3>
   <div class="sh-sub">${esc(body)}</div>
   <div class="card" style="background:var(--s1)">
     <div class="kv"><span class="k2">${esc(p.name)}</span>
       <span class="v2" style="color:${moodCol(get(p))}">${esc(moodWord(get(p)))} ${moodStrip(get(p))}</span></div>
     <div class="kv"><span class="k2">Dressing room</span>
       <span class="v2">${esc(moodWord(harmonyParts().h))}</span></div></div>
   ${extra}
   ${S().q.length?`<button class="btn" style="margin-top:14px"
      onclick="SW.get('morale').talk(${S().q[0]})">Next man is waiting</button>`:''}
   <button class="btn ghost" style="margin-top:8px" onclick="closeSheet();save();render()">That’s it</button>`);
  save();
}

/* ---------- the Dressing room view ------------------------------------- */
function renderRoom(){
  const c=MYCLUB(); if(!c)return '<div class="card">No squad.</div>';
  const s=S(),hp=harmonyParts(),h=hp.h;
  const sq=squadOf(c).slice().sort((a,b)=>get(a)-get(b));

  const bits=[];
  if(hp.form>=4)bits.push('results are carrying it');
  if(hp.form<=-4)bits.push('the run of results is doing the damage');
  if(hp.wage<=-6&&hp.breaker)bits.push(esc(surname(hp.breaker.p))+'’s wages are a running sore');
  const angry=sq.filter(p=>get(p)<=-30).length;
  if(angry)bits.push(angry+' '+(angry===1?'man is':'men are')+' openly unhappy');
  if(!bits.length)bits.push('nothing is being said behind your back');

  const q=s.q.map(id=>c.squad.find(p=>p.id===id)).filter(Boolean);
  const leaders=s.ld.map(id=>c.squad.find(p=>p.id===id)).filter(Boolean);

  const row=p=>{
    const m=get(p),d=drivers(c,p)[0];
    return `<div class="plr" onclick="showPlayer(${p.id})">
     ${pface(p,36)}
     <div class="pos">${p.pos}</div>
     <div class="nmw"><div class="nm2">${esc(p.name)}
       ${trk(p.id).req?'<span class="pill" style="background:#3A1C12;color:var(--loss)">Wants out</span>':''}
       ${isLeader(p.id)?'<span class="pill" style="background:var(--accw);color:var(--acc)">Senior</span>':''}</div>
      <div class="meta"><span style="color:${moodCol(m)};font-weight:700">${esc(moodWord(m))}</span>
       <span>${p.age}</span><span>${trk(p.id).st} start${trk(p.id).st===1?'':'s'}</span></div>
      <div style="font-size:11px;color:var(--t3);line-height:15px;margin-top:2px">${esc(d.txt)}</div></div>
     ${moodStrip(m)}</div>`;
  };

  return `<div class="card" style="border-color:${h<=-35?'var(--loss)':h>=30?'var(--win)':'var(--hair)'}">
    <div class="dim" style="font-size:10px;letter-spacing:.06em;text-transform:uppercase">The dressing room</div>
    <div class="disp" style="font-size:20px;font-weight:800;line-height:25px;margin-top:4px;color:${moodCol(h)}">
      ${esc(harmonyWord(h))}</div>
    <div style="margin-top:9px">${moodStrip(h)}</div>
    <div style="font-size:13px;color:var(--t2);margin-top:9px">Right now ${esc(bits.join(', '))}.</div></div>

   ${q.length?`<div class="sechead">Waiting to see you<span class="n">${q.length}</span></div>
    ${q.map(p=>`<div class="act" onclick="SW.get('morale').talk(${p.id})">
      <div class="ic" style="background:#3A1C12;color:var(--inj)">◍</div>
      <div class="tx"><div class="a">${esc(p.name)} wants a word</div>
        <div class="b">${esc((drivers(c,p).find(x=>x.neg)||drivers(c,p)[0]).txt)}</div></div>
      <div class="ch">›</div></div>`).join('')}`:''}

   <div class="sechead">The room<span class="n">${sq.length}</span></div>
   <div class="card" style="padding:6px 14px 12px">${sq.map(row).join('')}</div>

   ${leaders.length?`<div class="sechead">Who runs this room</div>
    <div class="card"><div style="font-size:13px;color:var(--t2)">
     ${leaders.map(p=>esc(p.name)).join(' and ')} — ${leaders.length>1?'they sort things out in there':
      'he sorts things out in there'} before they reach you. Sell ${leaders.length>1?'them':'him'}
     and you will feel it in places the ability numbers do not show.</div></div>`:
    `<div class="sechead">Who runs this room</div>
     <div class="card"><div style="font-size:13px;color:var(--t2)">Nobody. There is no senior pro playing
      often enough to hold the standards, so every problem in there comes straight to your door.</div></div>`}

   <div style="font-size:12px;color:var(--t3);margin:12px 2px 0">Morale barely changes what happens on a Saturday.
   It changes who is still here in June.</div>`;
}

/* ---------- player sheet block ----------------------------------------- */
function playerBlock(p,cl){
  if(!cl||cl.id!==G.me)return null;
  const c=MYCLUB(),m=get(p),d=drivers(c,p),t=trk(p.id);
  const log=(S().log[p.id]||[]).filter(x=>x.r).slice(0,3);
  return `<div class="card" style="margin-top:10px;background:var(--s1)">
    <div class="row" style="margin-bottom:8px">
      <span class="dim" style="font-size:10px;letter-spacing:.06em;text-transform:uppercase">Mood</span>
      <span class="spacer"></span>
      <span style="font-weight:700;color:${moodCol(m)}">${esc(moodWord(m))}</span>${moodStrip(m)}</div>
    <div style="font-size:13px;color:var(--t2)">${esc(d[0].txt)}.</div>
    ${d[1]?`<div style="font-size:13px;color:var(--t3);margin-top:4px">${esc(d[1].txt)}.</div>`:''}
    ${isLeader(p.id)?'<div style="font-size:13px;color:var(--acc);margin-top:6px">The others listen to him.</div>':''}
    ${log.length?`<div style="border-top:1px solid var(--hair);margin-top:10px;padding-top:8px">
      ${log.map(x=>`<div class="kv"><span class="k2" style="font-size:12px">${esc(x.r)}</span>
        <span class="v2" style="font-size:12px;color:${x.d>0?'var(--win)':'var(--loss)'}">${x.d>0?'+':''}${x.d}</span></div>`).join('')}</div>`:''}
    ${m<=-22?`<button class="btn sm" style="margin-top:11px"
      onclick="SW.get('morale').talk(${p.id})">Get him in the office</button>`:''}</div>`;
}

/* ======================================================================
   REGISTER
   ====================================================================== */
SW.register({
  id:'morale',

  /* ---- published interface — four modules depend on these exactly ---- */
  adjust(playerId,delta,reason){
    const s=S(),id=Number(playerId);
    if(!isFinite(id))return 0;
    const d=clamp(Number(delta)||0,-100,100);
    const p=findPlayer(id);
    if(p)return bump(p,d,reason);
    /* player not in the world yet (or already gone) — keep the value anyway
       so nothing is lost if he turns up later */
    if(s.v[id]===undefined)s.v[id]=20;
    s.v[id]=clamp(s.v[id]+d,-100,100);
    if(reason){if(!s.log[id])s.log[id]=[];
      s.log[id].unshift({w:(typeof G!=='undefined'?G.week:0),d:Math.round(d),r:String(reason)});
      s.log[id].length=Math.min(s.log[id].length,5)}
    return s.v[id];
  },
  harmony(){ return harmonyParts().h },
  unhappy(){
    const c=MYCLUB(); if(!c)return [];
    return squadOf(c).filter(p=>get(p)<=-30||trk(p.id).req).sort((a,b)=>get(a)-get(b));
  },
  reasonFor(playerId){
    const c=MYCLUB(); if(!c)return null;
    const p=c.squad.find(x=>x.id===Number(playerId));
    if(!p)return null;
    const d=drivers(c,p)[0];
    return d?d.txt:null;
  },

  /* ---- extras other modules may find useful (documented, not required) ---- */
  mood(playerId){const p=findPlayer(Number(playerId));return p?moodWord(get(p)):null},
  isLeader(playerId){return isLeader(Number(playerId))},
  /* the one on-pitch effect. Core does not call this yet — see the report. */
  composure(p){return p?clamp(1+0.0025*get(p),0.75,1.25):1},
  wantsAway(playerId){return !!trk(Number(playerId)).req},

  /* ---- ui entry points, called from onclick strings ---- */
  talk, answer,

  /* ---- lifecycle ---- */
  init(){
    const s=S();
    s.v={};s.t={};s.log={};s.q=[];s.ld=[];s.was=[];s.gm=0;s.sn=G.season;
    G.clubs.forEach(c=>c.squad.forEach(p=>{s.v[p.id]=clamp(p.morale|0,-100,100)}));
    /* keep only our own men in the store — 4,000 entries is not a save file */
    const c=MYCLUB();
    if(c){const keep=new Set(c.squad.map(p=>p.id));
      Object.keys(s.v).forEach(k=>{if(!keep.has(+k))delete s.v[k]})}
  },
  onLoad(){
    /* core save() does not persist player objects — the world is rebuilt from
       the seed, so morale must be pushed back onto the players by hand. */
    const s=S();
    if(!s.v)s.v={};
    G.clubs.forEach(c=>c.squad.forEach(p=>{
      if(s.v[p.id]!==undefined)p.morale=clamp(s.v[p.id],-100,100);
    }));
    if(typeof s.gm!=='number')s.gm=0;
    if(!Array.isArray(s.q))s.q=[];
    if(!Array.isArray(s.ld))s.ld=[];
  },
  onWeek(w){ weekly(w) },
  onMatchEnd(m){ matchEnd(m) },
  onSeasonEndAfter(){ resetSeason(); S().sn=G.season },

  /* ---- hub: priority 60, and never more than one card ---- */
  hubCards(){
    const c=MYCLUB(); if(!c)return [];
    const s=S();
    const avg=xiAvg(c);
    /* a transfer request from a first-team man beats a knock on the door */
    const req=squadOf(c).find(p=>trk(p.id).req&&CA(p)>=avg-4);
    if(req)return [{ic:'⇱',bg:'#3A1C12',col:'var(--loss)',
      a:req.name+' has asked to leave',
      b:'Talk him round or sell him. Doing nothing is the worst of the three.',
      fn:`SW.get('morale').talk(${req.id})`,priority:60}];
    const q=s.q.map(id=>c.squad.find(p=>p.id===id)).filter(Boolean)
      .filter(p=>CA(p)>=avg-5||(c.xi||[]).some(x=>x.p.id===p.id));
    if(!q.length)return [];
    const p=q[0];
    return [{ic:'◍',bg:'#3A1C12',col:'var(--inj)',
      a:q.length>1?(p.name+' wants a word, and so does '+surname(q[1])):(p.name+' wants a word'),
      b:(drivers(c,p).find(x=>x.neg)||drivers(c,p)[0]).txt,
      fn:`SW.get('morale').talk(${p.id})`,priority:60}];
  },

  squadViews(){ return [{key:'room',label:'Dressing room',render:renderRoom}] },
  playerBlocks(p,cl){ const b=playerBlock(p,cl); return b?[b]:[] }
});
})();
