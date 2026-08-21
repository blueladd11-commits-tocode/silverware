/* ============================================================
   media — press conferences, back-page headlines, pundit reaction
   Module 4 of 10. Owns: afterReport press sheet, hub "Back page" block.
   Reads morale/board/history/cup/market/culture through SW.get() only,
   always guarded. Nothing here repeats inside a season if the pool
   can help it: every question situation carries a 10-week cooldown,
   phrasings rotate per situation, pundit lines and headline pools
   keep a used-recently memory.
   ============================================================ */
(function(){

/* ---------- state ---------- */
const S=()=>SW.state('media');
function ensure(){
  const st=S();
  if(!st.v){
    st.v=2;
    st.pundit=null;          // {name, role, tic}
    st.view=0;               // -100..100 what the pundit makes of you
    st.line='';              // his current take
    st.head=null;            // {t, s, w, big}
    st.papers=[];            // recent back pages
    st.live=null;            // press conference in progress
    st.lastQ=[];             // question ids used last time
    st.sincePress=99;        // matches since the last press conference
    st.pressedLast=false;
    st.pressCount=0;
    st.clubs=[];             // every club id you have managed
    st.vs={};                // head-to-head under you, by club id
    st.lastMile=-99;
    st.pending=null;         // press conference queued by the last match
  }
  /* migrations — a save from the old build gets the new memory */
  if(!st.askedAt)st.askedAt={};       // question id -> absolute week last asked
  if(!st.qv)st.qv={};                 // question id -> phrasing rotation counter
  if(!st.seasonAsked)st.seasonAsked={}; // question ids used this season
  if(!st.pu)st.pu=[];                 // pundit lines used recently
  if(!st.hu)st.hu=[];                 // headlines used recently
  if(!st.pundit)newPundit();
  if(!st.line)st.line=punditLine('idle');
  if(!st.clubs)st.clubs=[];
  if(st.clubs.indexOf(G.me)<0)st.clubs.push(G.me);
  return st;
}
const NOW=()=>G.season*40+G.week;
const COOL=10;                        // a question situation sleeps this many weeks

/* ---------- the manager's name, as the press use it ---------- */
const surname=n=>String(n).split(' ').slice(-1)[0];
const UP=s=>String(s).toUpperCase();
function mgrSur(){
  const n=String(G.managerName||'').trim();
  if(!n||/^the manager$/i.test(n))return null;
  return surname(n);
}
function mgrUp(){const m=mgrSur();return m?UP(m):'THE BOSS'}
/* pundit lines carry a {M} token: the surname when we have one,
   "the manager" when we do not. Sentence-start gets capitalised. */
function fillM(s){
  const m=mgrSur();
  let out=String(s).replace(/\{M\}/g,m||'the manager');
  return out.charAt(0).toUpperCase()+out.slice(1);
}

/* ---------- who is talking ----------
   The pundit has a name, so he gets a face. The press pack does not, so it
   gets the institutional mark: three microphones on newsprint. */
function vPundit(){const st=S();return st.pundit?vH(st.pundit.name,'pundit','eng',49):vV('press')}
function vPress(){return vV('press')}

/* ---------- the pundit ---------- */
const ROLES=[
  {r:'former centre-half',  tic:'played it in the old money'},
  {r:'former striker',      tic:'never defended in his life'},
  {r:'never played a game', tic:'and never lets you forget it'},
  {r:'former keeper',       tic:'blames the back four for everything'},
  {r:'ex-manager, sacked twice', tic:'and it still stings'},
  {r:'former winger',       tic:'wants everyone one-on-one'}
];
function newPundit(){
  const st=S(), R=pick(ROLES);
  st.pundit={name:personName('eng'), role:R.r, tic:R.tic};
  st.view=0;
}

const P_HOT=[  // he loves you
  'I was wrong about {M}. I do not enjoy saying it, but I was wrong.',
  'Whatever {M} is selling in that dressing room, the rest of them should buy it.',
  '{M} has made a hard job look ordinary. That is the highest praise I have.',
  'If {M} leaves that club, six others will empty their pockets. Mark it down.',
  'Watch them without the ball. That is coaching. That is all {M}.',
  'Managers of the year get chosen in May. I chose in February.',
  'The best sides look bored winning. That lot look bored winning.'
];
const P_WARM=[
  'Say what you like — the team looks like it belongs to somebody now.',
  '{M} gets more out of that squad than the squad deserves.',
  'Quietly, without any fuss, {M} is building something there.',
  'They run further, they moan less, and they win the ugly ones. That is management.',
  'I am not calling it yet. But I have stopped laughing.',
  'You can see the plan now. Whether the players can is another matter.'
];
const P_NEUT=[
  'Jury is out. It usually is at that club.',
  'Ask me in ten games. I have been burned by fast starts before.',
  '{M} talks a good match. I would like to watch one.',
  'Nothing {M} has done yet tells me anything I did not already suspect.',
  'Mid-table is not a position, it is a habit. We will see which this is.',
  'Every manager is three results from a crisis and three from a statue.',
  'I have seen this film. I am waiting for the ending.'
];
const P_COOL=[
  'That was a team with no idea what it was meant to be doing.',
  'I have watched better organised car parks.',
  '{M} is running out of games and he knows it.',
  'The players have stopped listening or {M} has stopped saying anything. Pick one.',
  'You can coach a bad team. You cannot coach a soft one.',
  'Somebody on that bench needs to get angry, and soon.'
];
const P_COLD=[  // he wants you gone
  'I said it in August. {M} is out of his depth and the water is rising.',
  'They should have moved in the summer. Now they will pay twice for it.',
  '{M} has lost that dressing room. You can hear it from the press box.',
  'Somebody at that club has to be brave enough to end this.',
  'Every week the same team, the same shape, the same result. That is not stubbornness, it is surrender.',
  'The fans have gone quiet. Quiet is worse than angry. Quiet is the end.',
  'I take no pleasure in it. Well. A little.'
];
const P_SLAPPED=[
  'He can call me what he likes. I will still be here when he is not.',
  'Thin skin, that one. Always is when the results go.',
  'I have been called worse by better. It changes nothing I said.',
  'Funny how the ones who hate pundits keep quoting us.',
  '{M} should spend less time on my words and more on his back four.'
];
const P_BACKED=[
  'Fair play to him for fronting up. Not many do any more.',
  'He took it on the chin. That buys him a fortnight from me, no more.',
  'Honesty from a dugout. I had to check I heard it right.',
  'I criticise plenty. Credit where it is due: {M} did not hide.'
];
/* pundit lines never repeat inside the last ten spoken */
function pfresh(arr){
  const st=S(); st.pu=st.pu||[];
  const f=arr.filter(x=>st.pu.indexOf(x)<0);
  const raw=pick(f.length?f:arr);
  st.pu.unshift(raw); if(st.pu.length>10)st.pu.length=10;
  return fillM(raw);
}
function punditLine(mood){
  const st=S(), v=st.view;
  if(mood==='slapped')return pfresh(P_SLAPPED);
  if(mood==='backed')return pfresh(P_BACKED);
  if(v>=55)return pfresh(P_HOT);
  if(v>=20)return pfresh(P_WARM);
  if(v<=-55)return pfresh(P_COLD);
  if(v<=-20)return pfresh(P_COOL);
  return pfresh(P_NEUT);
}
function punditAdj(d){const st=S();st.view=clamp(Math.round(st.view+d),-100,100)}

/* ---------- rivalry: same city, else nearest reputation ---------- */
const CITY={
 'Gorton':'Manchester','Ancoats':'Manchester','Chorlton':'Manchester','Openshaw':'Manchester',
 'Didsbury':'Manchester','Salford':'Manchester','Eccles':'Manchester','Stretford':'Manchester',
 'Bermondsey':'London','Deptford':'London','Peckham':'London','Shoreditch':'London','Poplar':'London',
 'Balham':'London','Stepney':'London','Hackney Marsh':'London','Camberwell':'London','Clapham':'London',
 'Bow':'London','Barking':'London',
 'Toxteth':'Liverpool','Speke':'Liverpool','Garston':'Liverpool','Aigburth':'Liverpool',
 'Bootle':'Liverpool','Kirkdale':'Liverpool',
 'Digbeth':'Birmingham','Moseley':'Birmingham','Handsworth':'Birmingham','Selly Oak':'Birmingham',
 'Bordesley':'Birmingham','Aston Cross':'Birmingham',
 'Kirkstall':'Leeds','Armley':'Leeds','Headingley':'Leeds','Beeston':'Leeds','Hunslet':'Leeds','Wortley':'Leeds',
 'Attercliffe':'Sheffield','Crookes':'Sheffield','Darnall':'Sheffield',
 'Jesmond':'Tyneside','Byker':'Tyneside','Gosforth':'Tyneside','Heaton':'Tyneside',
 'Bedminster':'Bristol','Clifton':'Bristol',
 'Ashton':'Bolton','Radcliffe':'Bolton','Farnworth':'Bolton','Tyldesley':'Bolton',
 'Rishton':'East Lancashire','Padiham':'East Lancashire','Colne':'East Lancashire','Nelson':'East Lancashire',
 'Bacup':'East Lancashire','Whitworth':'East Lancashire',
 'Marsden':'Huddersfield','Slaithwaite':'Huddersfield',
 'Ossett':'Wakefield','Elland':'Wakefield',
 'Rothwell':'South Yorkshire','Wombwell':'South Yorkshire','Hemsworth':'South Yorkshire',
 'Fenton':'the Potteries','Bentilee':'the Potteries','Dresden':'the Potteries','Longton':'the Potteries',
 'Netherton':'the Black Country','Cradley':'the Black Country',
 'Valdemoro':'Madrid','Getafe Sur':'Madrid','Vallecas':'Madrid','Chamartín':'Madrid','Carabanchel':'Madrid',
 'Triana':'Sevilla','Nervión':'Sevilla','Utrera':'Sevilla','Écija':'Sevilla','Mairena':'Sevilla',
 'Bermeo':'Bilbao','Portugalete':'Bilbao','Sestao':'Bilbao',
 'Alzira':'Valencia','Manises':'Valencia','Paterna':'Valencia','Requena':'Valencia',
 'Barmbek':'Hamburg','Wilhelmsburg':'Hamburg','Altona Nord':'Hamburg',
 'Gelsen Süd':'the Ruhr','Wattenscheid':'the Ruhr','Hörde':'the Ruhr','Barop':'the Ruhr',
 'Zehlendorf':'Berlin','Köpenick':'Berlin','Marzahn':'Berlin','Neukölln':'Berlin',
 'Giesing':'Munich','Sendling':'Munich','Cannstatt':'Stuttgart','Zuffenhausen':'Stuttgart',
 'Bornheim':'Frankfurt','Sachsenhausen':'Frankfurt',
 'Rheydt':'the Rhineland','Uerdingen':'the Rhineland','Ohligs':'the Rhineland',
 'Testaccio':'Rome','Garbatella':'Rome','Ostiense':'Rome',
 'Lambrate':'Milan','Bovisa':'Milan','Quarto Oggiaro':'Milan',
 'Vomero':'Naples','Fuorigrotta':'Naples','Sampierdarena':'Genoa','Sestri':'Genoa',
 'Mirafiori':'Turin','Barriera':'Turin','Borgaro':'Turin','Mestrino':'Venice','Marghera':'Venice',
 'Bolognina':'Bologna','Corticella':'Bologna','Rifredi':'Florence','Scandicci':'Florence',
 'Vaulx':'Lyon','Villeurbanne':'Lyon','Vénissieux':'Lyon','Croix Rousse':'Lyon',
 'Bagnolet':'Paris','Montreuil':'Paris','Aubervilliers':'Paris','Pantin':'Paris','Colombes':'Paris',
 'Saint-Ouen':'Paris','Ivry':'Paris',
 'Estaque':'Marseille','Belsunce':'Marseille','Mazargues':'Marseille',
 'Wazemmes':'Lille','Fives':'Lille','Ronchin':'Lille',
 'Talence':'Bordeaux','Bègles':'Bordeaux','Cenon':'Bordeaux'
};
const CITYKEYS=Object.keys(CITY).sort((a,b)=>b.length-a.length);
function cityOf(club){
  if(!club)return null;
  for(let i=0;i<CITYKEYS.length;i++)if(club.name.indexOf(CITYKEYS[i])>=0)return CITY[CITYKEYS[i]];
  return null;
}
/* true derby = same city. Otherwise the club nearest us in reputation is "the one that matters". */
function derbyWith(opp){
  const c=me(); if(!opp||opp.id===c.id)return null;
  const a=cityOf(c),b=cityOf(opp);
  if(a&&b&&a===b)return a;
  return null;
}
function nearestRival(){
  const c=me(),l=leagueOf(c.id); if(!l)return null;
  let best=null,bd=1e9;
  l.clubs.forEach(id=>{ if(id===c.id)return;
    const o=G.clubs[id], city=derbyWith(o);
    const d=Math.abs(o.rep-c.rep)-(city?40:0);
    if(d<bd){bd=d;best=o} });
  return best;
}

/* ---------- small helpers ---------- */
function morale(){return SW.get('morale')}
function mAdj(id,d,why){const m=morale();if(m&&typeof m.adjust==='function'){try{m.adjust(id,d,why)}catch(e){}}}
function bAdj(d,why){const b=SW.get('board');if(b&&typeof b.adjust==='function'){try{b.adjust(d,why)}catch(e){}}}
function mile(txt){
  const st=S(),h=SW.get('history');
  if(!h||typeof h.record!=='function')return;
  if(G.season*40+G.week - st.lastMile < 4)return;   // never a stream of them
  st.lastMile=G.season*40+G.week;
  try{h.record('milestone',txt)}catch(e){}
}
function bumpRuns(res,gf,ga){
  const st=S();
  st.noWin=res==='W'?0:(st.noWin||0)+1;
  st.winRun=res==='W'?(st.winRun||0)+1:0;
  st.cleanRun=ga===0?(st.cleanRun||0)+1:0;
  st.blankRun=gf===0?(st.blankRun||0)+1:0;
  return st.noWin;
}

/* ---------- headlines ---------- */
function pickHead(T){
  const st=S(); st.hu=st.hu||[];
  const f=T.filter(t=>st.hu.indexOf(t)<0);
  const t=pick(f.length?f:T);
  st.hu.unshift(t); if(st.hu.length>14)st.hu.length=14;
  return t;
}
function setHead(t,big,end,keep){
  const st=S();
  st.head={t:t,s:G.season,w:G.week,big:!!big};
  if(!keep&&!big&&!end)return;                      // routine week: printed, not framed
  const p={t:t,s:G.season,w:G.week,end:!!end};
  // one match, one back page: a press splash replaces the result line, it does not sit beside it
  if(st.papers[0]&&st.papers[0].s===p.s&&st.papers[0].w===p.w&&!end)st.papers[0]=p;
  else st.papers.unshift(p);
  if(st.papers.length>14)st.papers.length=14;
  if(big)note('Back page','"'+t+'" — and the phone has not stopped ringing.',{from:vPress()});
}
function resultHeadline(c){
  const my=UP(c.myName), opp=UP(c.oppName), sc=c.scorer?UP(surname(c.scorer)):null;
  const M=mgrUp();
  const T=[];
  if(c.isCup&&c.cupFinal&&c.res==='W')T.push(my+' WIN THE CUP. SAY IT AGAIN. '+my+' WIN THE CUP.',
    M+' DELIVERS THE SILVER');
  if(c.isCup&&c.cupFinal&&c.res!=='W')T.push('SO CLOSE YOU COULD TOUCH IT','A FINAL LOST IS A YEAR LOST');
  if(c.isCup&&!c.cupFinal&&c.res==='L')T.push('OUT OF THE CUP, AND BARELY A WHIMPER',
    'CUP DREAM DIES AT '+(c.home?'HOME':opp),'THE CUP GOES ON WITHOUT THEM');
  if(c.isCup&&c.upsetWin)T.push('CUPSET! '+my+' DUMP '+opp+' OUT','THE CUP STILL DOES THIS. IT STILL DOES THIS.');
  if(c.isEuro&&c.res==='W')T.push('A EUROPEAN NIGHT TO KEEP','ABROAD AND UNAFRAID: '+my+' DELIVER',
    M+"'S MEN TRAVEL WELL");
  if(c.isEuro&&c.res==='L')T.push('BROUGHT DOWN TO EARTH, CONTINENTAL CLASS','A LESSON, AND IT COST A TICKET TO SEE IT');
  if(c.derby&&c.res==='W')T.push(c.city?UP(c.city)+' IS OURS':'BRAGGING RIGHTS, AND THEY KNOW IT',
    my+' TAKE THE DERBY — AND THE PARADE ROUTE',M+' OWNS THIS TOWN TONIGHT');
  if(c.derby&&c.res==='L')T.push('DERBY DAY, AND '+my+' TURNED UP IN SLIPPERS',
    'THEY WILL SING ABOUT THIS ONE FOR A YEAR');
  if(c.derby&&c.res==='D')T.push('NOTHING SETTLED. NOTHING FORGIVEN.');
  if(c.res==='W'&&c.margin>=4)T.push(my+' '+c.gf+', '+opp+' '+c.ga+': TAKEN APART',
    'RUTHLESS. '+opp+' HAD NOWHERE TO HIDE',M+"'S MEN SHOW NO MERCY");
  if(c.res==='L'&&c.margin>=4)T.push('HUMILIATED — AND NOT FOR THE FIRST TIME',
    c.gf+'-'+c.ga+'. SOMEBODY HAS TO ANSWER FOR THAT','MEN AGAINST BOYS, AND '+my+' WERE THE BOYS');
  if(c.res==='L'&&c.margin===3)T.push('PICKED OFF. '+my+' NEVER LAID A GLOVE ON THEM');
  if(c.res==='L'&&c.home&&c.margin>=2)T.push('BOOED OFF AT HOME. THAT IS WHERE IT STARTS');
  if(c.upsetWin&&!c.isCup)T.push('THE NIGHT '+my+' KNOCKED '+opp+' OVER',
    'NOBODY GAVE THEM A PRAYER. NOBODY ASKED THEM');
  if(c.upsetLoss)T.push('EMBARRASSED BY '+opp,'THAT IS A RESULT THAT FOLLOWS YOU AROUND');
  if(c.comeback&&c.res==='W')T.push('DEAD AND BURIED AT '+c.maxDef+' DOWN. THEN THIS.',
    'THE GREAT ESCAPE, '+(c.home?'HOME':'AWAY')+' EDITION');
  if(c.title&&c.res==='W')T.push(my+' MEAN IT. THEY ACTUALLY MEAN IT','THIS IS A TITLE RACE NOW');
  if(c.title&&c.res!=='W')T.push('THE WHEELS ARE NOT OFF. BUT YOU CAN HEAR THEM');
  if(c.returning)T.push('NO HANDSHAKES AT '+opp,'HE WENT BACK. THEY HAD NOT FORGIVEN HIM');
  if(c.winlessRun>=4&&c.res!=='W')T.push(c.winlessRun+' GAMES. NO WINS. NO EXCUSES.');
  if(c.winlessRun===0&&c.prevWinless>=4)T.push('AT LAST. '+my+' REMEMBER HOW',M+' BREATHES AGAIN');
  if(c.winRun>=5)T.push(c.winRun+' STRAIGHT. NOBODY IS LAUGHING NOW','MAKE IT '+c.winRun+'. WHO STOPS THEM?');
  if(c.lateGoal&&c.res==='W')T.push(sc?sc+' IN THE '+c.lateMin+'TH. SCENES.':'LAST-GASP '+my+' STEAL IT AT THE DEATH');
  if(c.lateLoss)T.push('ROBBED AT THE DEATH — AGAIN THE HARD WAY','NINETY MINUTES OF WORK, THIRTY SECONDS OF RUIN');
  if(!T.length){
    if(c.res==='W')T.push(sc?sc+' DOES IT AGAIN':my+' GET THE JOB DONE',
      'THREE POINTS, NO FUSS, NO THANKS',sc?'ONE MOMENT. '+sc+' FOUND IT':'GROUND OUT, AND THEY WILL TAKE IT',
      my+' WIN UGLY AND WIN ANYWAY','THAT WILL DO. IT WILL NOT WIN ANYTHING ON ITS OWN.',
      M+"'S MEN GO AGAIN",sc?sc+' SETTLES IT, '+M+' SMILES':'WINNING BECOMES A HABIT IF YOU LET IT');
    else if(c.res==='D')T.push('A POINT. NOBODY LEFT SINGING','SHARED SPOILS, SHARED SHRUGS',
      'HONOURS EVEN AND NOBODY THE WISER','A DRAW THAT SUITS NEITHER OF THEM',
      c.gf===0?'NOTHING IN IT. NOTHING FROM IT.':'TWO POINTS DROPPED. ASK ANY OF THEM.',
      'STALEMATE. THE KIND THAT AGES A MANAGER');
    else T.push('BEATEN. AND IT LOOKED LIKELY FROM EARLY',my+' COME UP SHORT AGAIN',
      'ANOTHER ONE GONE. THE QUESTIONS START NOW','NOT ENOUGH. NOWHERE NEAR ENOUGH.',
      c.home?'BEATEN AT HOME. THE WORST KIND.':'NOTHING BROUGHT BACK FROM '+opp,
      'QUESTIONS FOR '+M+', AND HE KNOWS THE FIRST ONE');
  }
  return pickHead(T);
}

/* ============================================================
   THE QUESTION BANK
   Every answer is one of three characters:
   back  — get behind your players
   blame — take it yourself
   dig   — swing at somebody (ref, opposition, pundit, your own board)
   The three must land differently or the press is theatre.
   q is an ARRAY of phrasings; the rotation counter in state picks one
   and moves on next time the situation comes up.
   ============================================================ */
function Q(){ return [

/* ---------- heavy defeat ---------- */
{id:'heavy_when', tag:'heavy', rec:'blame',
 q:[c=>c.gf+'-'+c.ga+'. When did you know it was gone?',
    c=>'Be honest. At what point today did you stop believing?',
    c=>c.ga+' conceded. Talk us through the moment it broke.'],
 a:[
  {k:'back', t:'"Nobody hid. I have seen worse from better players."',
   d:'They will hear that on the bus home', f:c=>{c.xi.forEach(id=>mAdj(id,10,'you shielded them after a hiding'));bAdj(-3,'refused to face the defeat');return 'SHIELDED: BOSS REFUSES TO BLAME HIS PLAYERS'}},
  {k:'blame', t:'"I picked it. I set it up. I got it wrong."',
   d:'The board wanted contrition. They got it', f:c=>{c.xi.forEach(id=>mAdj(id,6,'you carried it for them'));bAdj(2,'fronted up after a heavy defeat');punditAdj(6);S().line=punditLine('backed');return '"MY FAULT" — '+mgrUp()+' FALLS ON HIS SWORD'}},
  {k:'dig', t:'"Ask the officials. The second goal was three yards off."',
   d:'The governing body reads the papers too', f:c=>{refCharge();return 'REF ROW: BOSS FACES A CHARGE'}}
 ]},
{id:'heavy_worst', tag:'heavy', rec:'blame',
 q:[c=>'Is that the worst you have been since you walked in?',
    c=>'Where does that rank among the bad days? Because there is competition.',
    c=>'Your predecessor never lost by '+c.margin+' here. Does that sting?'],
 a:[
  {k:'back', t:'"It is the worst we have been. It is not what we are."',
   d:'Steady. Dull. Safe', f:c=>{c.xi.forEach(id=>mAdj(id,5,'you kept it calm in public'));return null}},
  {k:'blame', t:'"Yes. And I am the one who has to fix it."',
   d:'Honest. They will hold you to it', f:c=>{bAdj(-2,'admitted it was the low point');punditAdj(4);return '"THE WORST WE HAVE BEEN" — BOSS ADMITS IT'}},
  {k:'dig', t:'"Ask the people upstairs what they funded. Then ask me again."',
   d:'That will be read out in the boardroom', f:c=>{bAdj(-9,'blamed the board in public');punditAdj(3);return '"BACK ME OR SACK ME" — BOSS TURNS ON HIS BOARD'}}
 ]},
{id:'heavy_home', tag:'heavy', needs:'home', rec:'back',
 q:[c=>'They paid to watch that. What do you say to the ones who stayed to the end?',
    c=>'Your own end was emptying before the hour. Did you notice?'],
 a:[
  {k:'back', t:'"I would tell them to look at the fixture list, not one afternoon. This team will pay them back."',
   d:'A promise to the paying public', f:c=>{c.xi.forEach(id=>mAdj(id,6,'you promised the fans on their behalf'));bAdj(-2,'wrote a cheque the team must cash');return null}},
  {k:'blame', t:'"I would give them their money back if the club let me. That was mine, start to finish."',
   d:'They will print the word "refund"', f:c=>{bAdj(1,'took the anger so the club did not have to');punditAdj(5);return '"I WOULD REFUND THEM MYSELF" — '+mgrUp()}},
  {k:'dig', t:'"Some of those players should be paying to watch us. They were passengers."',
   d:'Eleven men just read their own team-sheet', f:c=>{c.xi.forEach(id=>mAdj(id,-11,'you called them passengers in public'));c.xi.forEach(shock);punditAdj(3);return '"PASSENGERS" — BOSS SAVAGES HIS OWN SIDE'}}
 ]},

/* ---------- the derby ---------- */
{id:'derby_song', tag:'derby', rec:'dig',
 q:[c=>'Their end were singing your name at the end. Not kindly.',
    c=>'You will have heard what their fans called you today. Any reply?'],
 a:[
  {k:'back', t:'"They pay their money. My players earned better than that."',
   d:'The dressing room likes hearing it', f:c=>{c.xi.forEach(id=>mAdj(id,8,'you stood in front of them at the derby'));return null}},
  {k:'blame', t:'"On that showing they were entitled."',
   d:'Fair. Bleak', f:c=>{c.xi.forEach(id=>mAdj(id,-6,'you agreed with the away end'));bAdj(-2,'conceded the derby without a fight');return null}},
  {k:'dig', t:'"They will sing at anything. It is the only thing they win."',
   d:'This one runs for a week', f:c=>{punditAdj(-2);return 'DERBY BLAST: "IT IS THE ONLY THING THEY WIN"'}}
 ]},
{id:'derby_since', tag:'derby', needs:'neverBeaten', rec:'back',
 q:[c=>'You have not beaten '+c.oppName+' yet. Does that eat at you?',
    c=>'Still no derby win under you. They have noticed across the city.'],
 a:[
  {k:'back', t:'"This group will beat them. Put a date on it if you like."',
   d:'A promise with your name on it', f:c=>{c.xi.forEach(id=>mAdj(id,9,'you promised the derby publicly'));bAdj(-2,'made a promise in public');return 'HE PUT A DATE ON IT: "WE WILL BEAT THEM"'}},
  {k:'blame', t:'"It eats at me every day of the week. That is the job."',
   d:'Nothing given away', f:c=>{punditAdj(2);return null}},
  {k:'dig', t:'"They have spent four times what we have. Congratulations to them."',
   d:'The dig lands. It always does', f:c=>{c.xi.forEach(id=>mAdj(id,5,'you took the heat off them'));punditAdj(-3);return 'MONEY TALK: BOSS TAKES AIM ACROSS THE CITY'}}
 ]},
{id:'derby_won', tag:'derby', needs:'resW', rec:'back',
 q:[c=>'A derby win. Half this city is yours tonight. Enjoy it, or bank it?',
    c=>'You beat '+c.oppName+' in front of their own. Tell us what that room was like.'],
 a:[
  {k:'back', t:'"Those players understood what today was. You could see it from the first whistle."',
   d:'The city will chant their names', f:c=>{c.xi.forEach(id=>mAdj(id,10,'you gave them the derby'));punditAdj(4);return 'THEY UNDERSTOOD THE DAY: '+UP(c.myName)+' TAKE THE CITY'}},
  {k:'blame', t:'"It is three points. I will enjoy it for one bath and then it is gone."',
   d:'Cold water on a hot night', f:c=>{bAdj(2,'kept a derby win in proportion');c.xi.forEach(id=>mAdj(id,-3,'you called their derby "three points"'));return null}},
  {k:'dig', t:'"Tell them the parade goes past their ground. Slowly."',
   d:'That line will be on flags', f:c=>{c.xi.forEach(id=>mAdj(id,6,'you rubbed it in for them'));punditAdj(-3);bAdj(-2,'poured petrol on a rivalry');return '"SLOWLY" — BOSS TWISTS THE DERBY KNIFE'}}
 ]},

/* ---------- runs, droughts, streaks ---------- */
{id:'winless_crisis', tag:'winless', rec:'blame',
 q:[c=>c.winlessRun+' without a win. How long before this is a crisis?',
    c=>'Winless in '+c.winlessRun+'. What word would you use, if not crisis?',
    c=>c.winlessRun+' games now. The people who set your objective are counting too.'],
 a:[
  {k:'back', t:'"Come to training. There is nothing wrong with these players."',
   d:'They will be told you said it', f:c=>{c.xi.forEach(id=>mAdj(id,11,'you backed them through a bad run'));bAdj(-3,'played down a bad run');return null}},
  {k:'blame', t:'"It is a crisis when I stop having answers. I have answers."',
   d:'Confident. Now go and win one', f:c=>{bAdj(1,'took the run on the chin');punditAdj(3);return null}},
  {k:'dig', t:'"Crisis. Great word. Sells papers, wins nothing."',
   d:'He will remember that on Sunday', f:c=>{punditAdj(-10);S().line=punditLine('slapped');return 'BOSS TURNS ON THE PRESS: "SELLS PAPERS, WINS NOTHING"'}}
 ]},
{id:'winless_fans', tag:'winless', needs:'home', rec:'back',
 q:[c=>'That is '+c.winlessRun+' now, and today they turned. You heard it. What do you do with that?',
    c=>'Your own supporters were on the players\' backs today. Do they deserve it?'],
 a:[
  {k:'back', t:'"They can boo me. The first one who boos a player answers to me."',
   d:'A line drawn in front of thirty thousand', f:c=>{c.xi.forEach(id=>mAdj(id,12,'you put yourself between them and the boos'));bAdj(-3,'picked a fight with the crowd');return 'BOO ME, NOT THEM: BOSS DRAWS THE LINE'}},
  {k:'blame', t:'"They are right. It is not good enough and it starts with me."',
   d:'Humility, printed in full', f:c=>{bAdj(2,'agreed with the supporters');punditAdj(4);return null}},
  {k:'dig', t:'"Where were they when we were winning? Louder then, I hope."',
   d:'Never fight the crowd. Never.', f:c=>{bAdj(-8,'insulted the paying support');punditAdj(-6);S().line=punditLine('slapped');return 'BOSS BLASTS OWN FANS. IT WILL NOT BE FORGOTTEN.'}}
 ]},
{id:'streak_end', tag:'streak', rec:'back',
 q:[c=>c.winRun+' wins on the spin. Go on — say the word "momentum".',
    c=>'That is '+c.winRun+' straight now. Are you allowed to enjoy this yet?'],
 a:[
  {k:'back', t:'"Momentum is eleven players refusing to lose. Say their names, not mine."',
   d:'Printed under all eleven faces', f:c=>{c.xi.forEach(id=>mAdj(id,8,'you handed the streak to them'));punditAdj(3);return UP(c.myName)+' JUST KEEP WINNING'}},
  {k:'blame', t:'"Streaks end. My job is making sure the football does not end with it."',
   d:'The sensible answer. Nobody quotes it', f:c=>{bAdj(2,'kept a streak boring');return null}},
  {k:'dig', t:'"Three weeks ago you had us in a crisis. Keep the word ready, you will want it back."',
   d:'He keeps receipts. So do you, apparently', f:c=>{punditAdj(-7);S().line=punditLine('slapped');return 'BOSS TO PRESS: "KEEP THE WORD READY"'}}
 ]},
{id:'clean_run', tag:'clean', rec:'back',
 q:[c=>c.cleanRun+' clean sheets in a row. Where has that come from?',
    c=>'Nobody has scored past you in '+c.cleanRun+' games. Boring, or beautiful?'],
 a:[
  {k:'back', t:'"From the back four running through walls. Beautiful is a matter of taste."',
   d:'The defence buys the first round tonight', f:c=>{c.xi.forEach(id=>mAdj(id,7,'you credited the shut-outs to them'));return 'THE WALL: '+c.cleanRun+' GAMES, NOTHING PAST THEM'}},
  {k:'blame', t:'"From hours on a training pitch you never write about."',
   d:'A small dig wrapped in a fact', f:c=>{punditAdj(2);return null}},
  {k:'dig', t:'"Ask the strikers we keep facing. Some of them should try a different trade."',
   d:'Every forward in the league just circled you', f:c=>{punditAdj(-3);bAdj(-1,'goaded the rest of the league');return '"TRY A DIFFERENT TRADE" — BOSS MOCKS THE LEAGUE\'S STRIKERS'}}
 ]},
{id:'drought', tag:'blank', rec:'blame',
 q:[c=>c.blankRun+' games without a goal from your side. Where are they hiding?',
    c=>'No goals in '+c.blankRun+'. Do you watch the shooting drills through your fingers?'],
 a:[
  {k:'back', t:'"The chances are coming. The day they stop coming is the day I worry."',
   d:'Calm, printed next to a zero', f:c=>{c.xi.forEach(id=>mAdj(id,6,'you kept faith through the drought'));bAdj(-2,'shrugged at a goal drought');return null}},
  {k:'blame', t:'"My shape strangles our own forwards. I am fixing it this week."',
   d:'A tactical confession, in public', f:c=>{bAdj(-1,'admitted the plan was wrong');punditAdj(5);return 'BOSS ADMITS IT: "MY SHAPE STRANGLES US"'}},
  {k:'dig', t:'"We were promised goalscorers in the summer. Ask upstairs what happened."',
   d:'The transfer committee reads this at breakfast', f:c=>{bAdj(-8,'blamed recruitment for the drought');punditAdj(3);return '"WE WERE PROMISED GOALSCORERS" — BOSS POINTS UP'}}
 ]},

/* ---------- upsets and statements ---------- */
{id:'upset_win', tag:'upsetWin', rec:'back',
 q:[c=>'Nobody gave you a prayer. Best night of your career?',
    c=>'The bookies had you buried. What did you know that they did not?'],
 a:[
  {k:'back', t:'"Best night of theirs. I stood and watched, mostly."',
   d:'They will love that', f:c=>{c.xi.forEach(id=>mAdj(id,12,'you gave them the credit'));punditAdj(6);return 'HE GAVE THEM THE CREDIT. ALL OF IT.'}},
  {k:'blame', t:'"One night. We are still what the table says we are."',
   d:'Feet on the floor', f:c=>{bAdj(2,'kept the celebrations sane');return null}},
  {k:'dig', t:'"Nobody gave us a prayer because nobody watches us. Their loss."',
   d:'Quotable. Cheap. Enjoyable', f:c=>{punditAdj(-4);return '"NOBODY WATCHES US" — AND NOW EVERYBODY IS'}}
 ]},
{id:'upset_loss', tag:'upsetLoss', rec:'blame',
 q:[c=>'You were the better side on paper by a distance. Explain that.',
    c=>'They are '+(c.oppPos?ord(c.oppPos)+' in the table':'half the club you are')+'. How does that happen to your team?'],
 a:[
  {k:'back', t:'"Paper does not play. They wanted it more and that is on me."',
   d:'Half a shield, half an admission', f:c=>{c.xi.forEach(id=>mAdj(id,4,'you softened it'));bAdj(-2,'excused a bad defeat');return null}},
  {k:'blame', t:'"I sent them out flat. Simple as that."',
   d:'They hear it as honesty. For now', f:c=>{bAdj(-4,'admitted sending them out flat');punditAdj(4);return null}},
  {k:'dig', t:'"Some of them fancied a day off. They will not get another."',
   d:'This one goes through the dressing-room wall', f:c=>{c.xi.forEach(id=>mAdj(id,-14,'you called them out in public'));c.xi.forEach(shock);punditAdj(2);return '"THEY FANCIED A DAY OFF" — MANAGER BLASTS OWN PLAYERS'}}
 ]},
{id:'thrash_message', tag:'thrash', rec:'back',
 q:[c=>c.gf+' scored. Was that a message to the rest of them?',
    c=>'That was a demolition. Who was it aimed at?'],
 a:[
  {k:'back', t:'"It was a message about these players. Nothing else."',
   d:'They will read it in the morning', f:c=>{c.xi.forEach(id=>mAdj(id,9,'you made the win about them'));return null}},
  {k:'blame', t:'"It was one afternoon. Ask me in May."',
   d:'Dull on purpose', f:c=>{bAdj(1,'kept his feet on the floor');return null}},
  {k:'dig', t:'"If the rest of them need a message, they should watch more football."',
   d:'That will be pinned up somewhere', f:c=>{punditAdj(-3);return '"THEY SHOULD WATCH MORE FOOTBALL"'}}
 ]},
{id:'comeback', tag:'comeback', rec:'back',
 q:[c=>c.maxDef+' down and you came back. What was said at half-time?',
    c=>'Most teams die at '+c.maxDef+' behind. Yours did not. Why?'],
 a:[
  {k:'back', t:'"Nothing was said. They looked at each other and decided. That is a dressing room."',
   d:'The myth writes itself', f:c=>{c.xi.forEach(id=>mAdj(id,10,'you told the world they saved themselves'));punditAdj(5);return 'THEY LOOKED AT EACH OTHER AND DECIDED'}},
  {k:'blame', t:'"I told them the first half was my mess and asked them to clean it up. They did."',
   d:'Honest arithmetic', f:c=>{c.xi.forEach(id=>mAdj(id,6,'you owned the first half'));bAdj(1,'fixed it and admitted it');punditAdj(4);return null}},
  {k:'dig', t:'"Ask their bench what was said. They were the ones celebrating at half-time."',
   d:'A wound for their manager to carry', f:c=>{punditAdj(-2);return 'CELEBRATING AT HALF-TIME. OH DEAR.'}}
 ]},
{id:'late_winner', tag:'late', rec:'back',
 q:[c=>'Won it in the last minute. Character, or a let-off?',
    c=>(c.scorer?surname(c.scorer):'Your man')+' in the '+(c.lateMin||90)+'th. Do you coach that or pray for it?'],
 a:[
  {k:'back', t:'"Character. They have had it all along, you just started watching."',
   d:'The room will enjoy that one', f:c=>{c.xi.forEach(id=>mAdj(id,10,'you called them a team of character'));punditAdj(-2);return 'LAST-MINUTE WINNER, AND A DIG ON THE WAY OUT'}},
  {k:'blame', t:'"A let-off. We should not have needed the ninety-third minute."',
   d:'Nobody left the room smiling', f:c=>{c.xi.forEach(id=>mAdj(id,-4,'you called a win a let-off'));bAdj(1,'refused to get carried away');return null}},
  {k:'dig', t:'"Ask them why it took ninety minutes. I have."',
   d:'Now they know the row was real', f:c=>{c.xi.forEach(id=>mAdj(id,-9,'you aired the dressing-room row'));c.xi.forEach(shock);return null}}
 ]},
{id:'late_loss', tag:'lateLoss', rec:'blame',
 q:[c=>'Ninety minutes of work undone in the last one. How do you pick them up from that?',
    c=>'Losing like that, at the death — is that bad luck or bad habits?'],
 a:[
  {k:'back', t:'"They gave me everything for ninety minutes. I will not bury them for one."',
   d:'The right thing, said out loud', f:c=>{c.xi.forEach(id=>mAdj(id,9,'you refused to blame them for the late one'));return null}},
  {k:'blame', t:'"Habits. Mine. We stop defending leads because I stop demanding it."',
   d:'Brutal self-surgery', f:c=>{bAdj(-2,'owned the late collapse');punditAdj(6);S().line=punditLine('backed');return '"MINE" — BOSS TAKES THE LATE COLLAPSE ALONE'}},
  {k:'dig', t:'"Count the minutes their keeper wasted from the hour. Then ask the referee where they went."',
   d:'The officials keep their own count', f:c=>{refCharge();return 'TIME-WASTING ROW BOILS OVER'}}
 ]},

/* ---------- the table, the objective, the scrap ---------- */
{id:'title_weight', tag:'title', rec:'back',
 q:[c=>'Keep this up and it is yours to lose. Do you feel the weight?',
    c=>'Everyone above you has stumbled. It is there for you now. Say it.'],
 a:[
  {k:'back', t:'"They carry it better than I do. Look at the table."',
   d:'Warm, and true', f:c=>{c.xi.forEach(id=>mAdj(id,8,'you said they carry it well'));punditAdj(4);return 'TOP OF THE PILE AND ENJOYING IT'}},
  {k:'blame', t:'"If it goes, it goes on me. Nobody else in this room."',
   d:'They will hold that receipt', f:c=>{bAdj(-3,'staked the title on himself');punditAdj(5);return 'HE STAKED HIS JOB ON THE TITLE'}},
  {k:'dig', t:'"Weight? Ask the clubs who were meant to be here instead of us."',
   d:'Half the division just got a fixture circled', f:c=>{punditAdj(-3);return 'SHOTS FIRED FROM THE TOP OF THE TABLE'}}
 ]},
{id:'title_bottle', tag:'title', needs:'dropped', rec:'blame',
 q:[c=>'Points dropped at the wrong end of the season. The word people use is "bottle".',
    c=>'That result keeps the race alive for everyone else. Did the occasion get to them?'],
 a:[
  {k:'back', t:'"These players have won us the right to stumble once. Nobody bottles anything here."',
   d:'A shield over a bruise', f:c=>{c.xi.forEach(id=>mAdj(id,8,'you refused the word bottle'));bAdj(-2,'brushed off a costly slip');return null}},
  {k:'blame', t:'"The occasion got to me. I made it bigger than it needed to be for them."',
   d:'A manager admitting nerves. Rare', f:c=>{bAdj(-1,'admitted the nerves were his');punditAdj(6);S().line=punditLine('backed');return 'THE NERVES WERE MINE, SAYS '+mgrUp()}},
  {k:'dig', t:'"Bottle. Write it. Then be at the ground in May when we are holding the thing."',
   d:'Either a famous quote or a famous epitaph', f:c=>{punditAdj(-6);bAdj(-2,'dared the press in a title race');S().line=punditLine('slapped');return '"BE THERE IN MAY" — BOSS DARES THE DOUBTERS'}}
 ]},
{id:'scrap_bottom', tag:'scrap', rec:'blame',
 q:[c=>ord(c.pos)+' with the run-in coming. Do you say the word "relegation" in that dressing room?',
    c=>'The table says you go down from here. What does your gut say?'],
 a:[
  {k:'back', t:'"I say it every day, and then I point at the players who will get us out of it."',
   d:'Fear, aimed properly, is fuel', f:c=>{c.xi.forEach(id=>mAdj(id,7,'you told them they were the way out'));bAdj(1,'faced the table honestly');return null}},
  {k:'blame', t:'"My gut says I have not been good enough, and my head says that changes now."',
   d:'A manager under water, swimming', f:c=>{bAdj(-1,'owned the position');punditAdj(5);return null}},
  {k:'dig', t:'"Three of the clubs down there have spent double what I was given. Look it up."',
   d:'True, and no one will care if you go down', f:c=>{bAdj(-7,'made the budget everyone\'s business');punditAdj(2);return 'BOSS: "LOOK UP WHAT I WAS GIVEN"'}}
 ]},
{id:'promoted_slip', tag:'promoted', rec:'blame',
 q:[c=>c.oppName+' came up from the division below and just took points off you. Explain it.',
    c=>'Everyone circles the promoted clubs as points in the bank. They did not read the script today.'],
 a:[
  {k:'back', t:'"Promoted clubs are hungry. Mine matched them for effort and lost on detail."',
   d:'Kind, and slightly hollow', f:c=>{c.xi.forEach(id=>mAdj(id,5,'you defended them after the slip'));bAdj(-2,'softened a bad result');return null}},
  {k:'blame', t:'"We treated it like a day off because I let the week feel like one."',
   d:'Preparation. His word against himself', f:c=>{bAdj(-3,'admitted the week was soft');punditAdj(5);return '"I LET THE WEEK GO SOFT" — BOSS'}},
  {k:'dig', t:'"They kicked everything that moved and the referee liked it. Say what you saw."',
   d:'The newly promoted love being patronised. They will keep the clipping', f:c=>{refCharge();return 'BOSS SNEERS AT THE NEW BOYS — AND THE REF'}}
 ]},

/* ---------- reunions, red cards, individuals ---------- */
{id:'return_club', tag:'returning', rec:'blame',
 q:[c=>'Back at '+c.oppName+'. Any part of you that did not want to win?',
    c=>'They used to sing your name here. What was today like from the away dugout?'],
 a:[
  {k:'back', t:'"Not one part. My players deserved better than sentiment."',
   d:'Cold. They will like cold', f:c=>{c.xi.forEach(id=>mAdj(id,7,'you put them before your old club'));return null}},
  {k:'blame', t:'"They were good to me here. Today I wanted them beaten."',
   d:'Straight down the middle', f:c=>{punditAdj(3);return 'NO SENTIMENT ON HIS RETURN'}},
  {k:'dig', t:'"They know why I left. So do the people who made me."',
   d:'Old wounds, opened live on air', f:c=>{punditAdj(-4);return 'OLD WOUNDS REOPENED: "THEY KNOW WHY I LEFT"'}}
 ]},
{id:'red_card', tag:'red', rec:'blame',
 q:[c=>'You finished with ten. Was the sending-off a sending-off?',
    c=>'The red card changed everything. Your honest view of it, on the record.'],
 a:[
  {k:'back', t:'"He is not that sort of player and everybody in the ground knows it."',
   d:'The lad will hear about that', f:c=>{c.xi.forEach(id=>mAdj(id,7,'you defended the man who was sent off'));return null}},
  {k:'blame', t:'"It was a red. He knows it, I know it, we move on."',
   d:'No argument, no charge', f:c=>{punditAdj(3);bAdj(1,'took the red card sensibly');return null}},
  {k:'dig', t:'"He has given three of those against us this season. Three."',
   d:'That is a charge waiting to be typed', f:c=>{refCharge();return 'REF ROW: "THREE OF THOSE AGAINST US"'}}
 ]},
{id:'hat_trick', tag:'hat', rec:'back',
 q:[c=>'Three for '+surname(c.hat)+'. How far can he go?',
    c=>surname(c.hat)+' took the ball home today. What do you say to a man in that form?'],
 a:[
  {k:'back', t:'"As far as he wants. Nobody at this club will hold him back."',
   d:'Every scout in the country just read that', f:c=>{c.xi.forEach(id=>mAdj(id,4,'you talked the team up'));punditAdj(4);return UP(surname(c.hat))+' HITS THREE — AND THE BOSS SAYS THE SKY'}},
  {k:'blame', t:'"He got three because ten others put it on a plate."',
   d:'Spread thin, felt wide', f:c=>{c.xi.forEach(id=>mAdj(id,8,'you shared the credit for the hat-trick'));return null}},
  {k:'dig', t:'"Further than this board will ever let him."',
   d:'That will be on the desk within the hour', f:c=>{bAdj(-9,'told the world the club is too small');punditAdj(5);return '"FURTHER THAN THIS BOARD WILL LET HIM"'}}
 ]},
{id:'first_win', tag:'firstWin', rec:'back',
 q:[c=>'First win in '+(c.prevWinless+1)+'. Relief, or were you never worried?',
    c=>'The run is over. Between us — how close was it to breaking you?'],
 a:[
  {k:'back', t:'"Relief for them. They have taken more stick than they earned."',
   d:'They will hear it and stand taller', f:c=>{c.xi.forEach(id=>mAdj(id,10,'you took the stick off them after a win'));return null}},
  {k:'blame', t:'"Worried every day. You would be, doing my job."',
   d:'Honest to a fault', f:c=>{punditAdj(3);bAdj(-1,'admitted he had been worried');return null}},
  {k:'dig', t:'"Never worried. Some of you had us buried in October."',
   d:'He was one of them', f:c=>{punditAdj(-8);S().line=punditLine('slapped');return 'BURIED IN OCTOBER, WINNING IN MARCH'}}
 ]},

/* ---------- the cup ---------- */
{id:'cup_out', tag:'cupOut', rec:'blame',
 q:[c=>'Out of the cup. For a club like this, is that a season lost or a distraction gone?',
    c=>'The cup was the shortest road to silver. It just closed. How much does that hurt?'],
 a:[
  {k:'back', t:'"Tell the players it was a distraction and see their faces. They wanted that trophy."',
   d:'The hurt made public, on their behalf', f:c=>{c.xi.forEach(id=>mAdj(id,7,'you honoured their cup run'));bAdj(-2,'sentiment over silverware');return null}},
  {k:'blame', t:'"I picked the wrong team for the wrong night. That exit is mine."',
   d:'Rotation. His word against himself', f:c=>{bAdj(-3,'owned the cup exit');punditAdj(5);return '"THE EXIT IS MINE" — BOSS ON CUP KO'}},
  {k:'dig', t:'"Ask the league what a replay would have done to our week. Somebody somewhere is relieved."',
   d:'Cynical. The cup romantics will hate you', f:c=>{punditAdj(-6);bAdj(2,'quietly prioritised the league');return 'BOSS SHRUGS AT CUP EXIT — ROMANTICS FUME'}}
 ]},
{id:'cup_on', tag:'cupOn', rec:'back',
 q:[c=>'Through again. The cup — do you dare say the word "final" yet?',
    c=>'A quarter-final is where seasons get remembered. How seriously are you taking this?'],
 a:[
  {k:'back', t:'"These players have earned the right to dream. I am not taking it off them."',
   d:'Now the town starts booking coaches', f:c=>{c.xi.forEach(id=>mAdj(id,8,'you let them dream about the cup'));punditAdj(2);return 'DREAM ON: '+UP(c.myName)+' MARCH IN THE CUP'}},
  {k:'blame', t:'"One round at a time. I have lost finals by talking about them in March."',
   d:'Scar tissue talking', f:c=>{bAdj(2,'kept the cup run calm');return null}},
  {k:'dig', t:'"Ask the big clubs if they fancy the draw. They avoided us twice already, in spirit."',
   d:'A wink at the balls in the bowl', f:c=>{punditAdj(-2);return '"NOBODY WANTS US" — CUP RUN GETS A VOICE'}}
 ]},
{id:'cup_shock', tag:'cupShock', rec:'back',
 q:[c=>'You have just put '+c.oppName+' out of the cup. Tell us that is not the story of the round.',
    c=>'A cup shock with your name on it. Where does that rank for you?'],
 a:[
  {k:'back', t:'"The story is eleven players who refused to be the punchline. Write them up properly."',
   d:'Every one of them keeps the clipping', f:c=>{c.xi.forEach(id=>mAdj(id,11,'you made them the story of the round'));punditAdj(5);return 'THE ROUND BELONGS TO '+UP(c.myName)}},
  {k:'blame', t:'"Rank it in May. Shocks are only stories if you build on them."',
   d:'The long game, played straight', f:c=>{bAdj(2,'kept a famous night in check');return null}},
  {k:'dig', t:'"They turned up thinking the badge would win it. Badges do not tackle."',
   d:'Their dressing room will frame that', f:c=>{punditAdj(-3);return '"BADGES DO NOT TACKLE" — THE QUOTE OF THE ROUND'}}
 ]},
{id:'cup_final_win', tag:'cupWon', rec:'back',
 q:[c=>'You have won the cup. Whatever else happens, that is forever. What do you do with a day like this?',
    c=>'Silverware. The thing they hired you for. Who gets this one?'],
 a:[
  {k:'back', t:'"It belongs to the players and the end that never stopped singing. I just carried the teamsheet."',
   d:'False modesty. Perfect modesty', f:c=>{c.xi.forEach(id=>mAdj(id,12,'you gave them the cup'));punditAdj(8);bAdj(4,'delivered and deflected');return 'THE CUP COMES HOME — AND '+mgrUp()+' GIVES IT AWAY'}},
  {k:'blame', t:'"I will enjoy it tonight. Tomorrow I will tell you what we won it despite."',
   d:'Even now, an edge', f:c=>{bAdj(-3,'hinted at problems on trophy day');punditAdj(3);return 'A TROPHY, AND A WARNING WITH IT'}},
  {k:'dig', t:'"A lot of people said this club was too small for days like this. Names available on request."',
   d:'Vengeance, gift-wrapped', f:c=>{punditAdj(-5);S().line=punditLine('slapped');return '"NAMES AVAILABLE ON REQUEST" — CUP WINNER SETTLES SCORES'}}
 ]},

/* ---------- Europe ---------- */
{id:'euro_win', tag:'euroWin', rec:'back',
 q:[c=>'A win in the '+c.comp+'. These nights — do they change how the world sees this club?',
    c=>'European football, and you looked like you belonged. Did that surprise you?'],
 a:[
  {k:'back', t:'"The players belonged. Passports do not intimidate this group."',
   d:'A line for the away end scarves', f:c=>{c.xi.forEach(id=>mAdj(id,9,'you told Europe they belonged'));punditAdj(4);return UP(c.myName)+' BELONG OUT THERE'}},
  {k:'blame', t:'"It changes nothing until we do it again. Europe remembers finishers, not visitors."',
   d:'Cold. Continental, even', f:c=>{bAdj(2,'kept a European night in proportion');return null}},
  {k:'dig', t:'"The world can see us fine. It is our own league that keeps looking away."',
   d:'A jab at home from abroad', f:c=>{punditAdj(-3);return 'BOSS: "OUR OWN LEAGUE KEEPS LOOKING AWAY"'}}
 ]},
{id:'euro_loss', tag:'euroLoss', rec:'blame',
 q:[c=>'Beaten in Europe. Is the gap to that level bigger than you thought?',
    c=>'That is what continental football does to you. What did your players learn tonight?'],
 a:[
  {k:'back', t:'"They learned they can live with it for an hour. Next time it will be ninety minutes."',
   d:'A defeat, reframed as a syllabus', f:c=>{c.xi.forEach(id=>mAdj(id,6,'you turned the euro lesson into belief'));return null}},
  {k:'blame', t:'"The gap was in the dugout tonight, not on the pitch. I was too cautious."',
   d:'Tactics confessed in two languages', f:c=>{bAdj(-2,'owned a European defeat');punditAdj(6);S().line=punditLine('backed');return '"THE GAP WAS IN THE DUGOUT" — '+mgrUp()}},
  {k:'dig', t:'"Their theatrics bought every whistle going. That is the level, apparently."',
   d:'UEFA-adjacent bodies also read papers', f:c=>{refCharge();return 'BOSS BLASTS "THEATRICS" ON EURO NIGHT'}}
 ]},
{id:'euro_deep', tag:'euroDeep', rec:'back',
 q:[c=>'The last four of the '+c.comp+'. Did you believe that in August?',
    c=>'This club, this deep in Europe. What is the ceiling now?'],
 a:[
  {k:'back', t:'"In August I believed in the players. They did the arithmetic themselves."',
   d:'History pages hold quotes like this', f:c=>{c.xi.forEach(id=>mAdj(id,10,'you shared the European stage with them'));punditAdj(6);return 'THE ARITHMETIC OF BELIEF: '+UP(c.myName)+' MARCH ON'}},
  {k:'blame', t:'"The ceiling is my imagination. I am working on it."',
   d:'Quietly enormous', f:c=>{punditAdj(4);bAdj(2,'dreamed responsibly');return null}},
  {k:'dig', t:'"Ask the coefficient people to check their spreadsheets. We were not in their plans."',
   d:'The blazers will pretend not to mind', f:c=>{punditAdj(-2);return 'NOT IN THEIR SPREADSHEETS. IN THEIR SEMI-FINALS.'}}
 ]},

/* ---------- wildcards: the squad, the window, the club ---------- */
{id:'player_struggle', tag:'*', needs:'strugglerId', rec:'back',
 q:[c=>c.strugglerName+' has had a rough few weeks. Is he still your man?',
    c=>'Every side has a man out of form. Right now yours is '+c.strugglerName+'. True or unfair?'],
 a:[
  {k:'back', t:'"He is my man. Anyone who says different can come and tell me."',
   d:'He will run through a wall for that', f:c=>{mAdj(c.strugglerId,26,'you backed him in front of the cameras');punditAdj(2);return UP(surname(c.strugglerName))+' GETS THE ARM ROUND HIM'}},
  {k:'blame', t:'"I have played him in the wrong shape. That is mine."',
   d:'You took his bullet', f:c=>{mAdj(c.strugglerId,14,'you took the blame for his form');bAdj(-3,'took the blame for a struggling player');return null}},
  {k:'dig', t:'"He knows he has been nowhere near it. Everybody in there knows."',
   d:'Brutal. It might even work', f:c=>{mAdj(c.strugglerId,-30,'you named him in public');c.xi.forEach(id=>{if(id!==c.strugglerId)mAdj(id,-5,'you named a team-mate in public')});shock(c.strugglerId);return UP(surname(c.strugglerName))+' HUNG OUT TO DRY'}}
 ]},
{id:'pundit_said', tag:'*', needs:'punditQuote', rec:'blame',
 q:[c=>c.punditName+' said, and I quote, "'+c.punditQuote+'"',
    c=>'You will have seen what '+c.punditName+' has been saying about you. Care to respond?'],
 a:[
  {k:'back', t:'"He has never been in my dressing room. I have."',
   d:'Firm without the fireworks', f:c=>{punditAdj(-3);c.xi.forEach(id=>mAdj(id,5,'you defended the room'));return null}},
  {k:'blame', t:'"On the evidence, he is not wrong."',
   d:'He will quote you saying it. Forever', f:c=>{punditAdj(9);S().line=punditLine('backed');bAdj(-2,'agreed with his own critics');return null}},
  {k:'dig', t:'"He was a coward as a player and he is a coward with a microphone."',
   d:'You have made an enemy for the season', f:c=>{punditAdj(-22);S().line=punditLine('slapped');bAdj(-3,'started a public feud');return 'WAR OF WORDS: BOSS CALLS PUNDIT A COWARD'}}
 ]},
{id:'board_backing', tag:'*', rec:'back',
 q:[c=>'Do you have everything you need from the people above you?',
    c=>'When did you last sit down with the owners, and did you leave that room happy?'],
 a:[
  {k:'back', t:'"I have what I have. I knew the job when I took it."',
   d:'Loyal. They notice', f:c=>{bAdj(4,'protected the board in public');return null}},
  {k:'blame', t:'"Plenty. I have not spent it well enough yet."',
   d:'You just wrote their statement for them', f:c=>{bAdj(3,'took responsibility for the spending');punditAdj(2);return null}},
  {k:'dig', t:'"Ask them. They are very good at answering questions in private."',
   d:'Satisfying. It will cost you', f:c=>{bAdj(-11,'took a public swing at the board');punditAdj(4);return 'OPEN WARFARE: "ASK THEM. THEY ANSWER IN PRIVATE."'}}
 ]},
{id:'crowd_mood', tag:'*', needs:'home', rec:'back',
 q:[c=>'Some of your own were leaving early again. Does that get to you?',
    c=>'The atmosphere in that ground has changed this season. Have you felt it from the dugout?'],
 a:[
  {k:'back', t:'"They have earned the right to leave when they want. We have not earned them staying."',
   d:'Humble. It plays well', f:c=>{bAdj(2,'took the supporters\' side');punditAdj(3);return null}},
  {k:'blame', t:'"It gets to me. It should get to everybody in that dressing room."',
   d:'A shot across the bow', f:c=>{c.xi.forEach(id=>mAdj(id,-6,'you pointed at the empty seats'));c.xi.forEach(shock);return null}},
  {k:'dig', t:'"They paid what this club charges them. Ask upstairs about that."',
   d:'Ticket prices. In public. Brave', f:c=>{bAdj(-7,'raised ticket prices in a press conference');punditAdj(4);return 'BOSS RAISES TICKET PRICES — IN PUBLIC'}}
 ]},
{id:'next_one', tag:'*', rec:'back',
 q:[c=>'What does this squad need before the next one?',
    c=>'If you could change one thing about this team by Saturday, what would it be?'],
 a:[
  {k:'back', t:'"Nothing they have not already got. They need telling, not fixing."',
   d:'Confidence, spread thin', f:c=>{c.xi.forEach(id=>mAdj(id,6,'you told the press they need no fixing'));return null}},
  {k:'blame', t:'"A better week of coaching. That is my department."',
   d:'Nobody else takes a scratch', f:c=>{punditAdj(3);return null}},
  {k:'dig', t:'"Two players and a chairman who returns a phone call."',
   d:'The room upstairs went very quiet', f:c=>{bAdj(-8,'asked for a chairman who answers the phone');punditAdj(5);return '"TWO PLAYERS AND A CHAIRMAN WHO ANSWERS"'}}
 ]},
{id:'unhappy_man', tag:'*', needs:'unhappyName', rec:'back',
 q:[c=>'Word is '+c.unhappyName+' is not a happy man. Anything in it?',
    c=>c.unhappyName+'\'s people have been talking to anyone who will listen. Is he staying?'],
 a:[
  {k:'back', t:'"He trains like a man who wants to be here. The rest is agent noise."',
   d:'Publicly claimed. Privately, sort it', f:c=>{mAdj(c.unhappyId,10,'you called it agent noise, kindly');punditAdj(2);return null}},
  {k:'blame', t:'"If a player of mine is unhappy, I have not managed him well enough. I will fix it."',
   d:'The grown-up answer', f:c=>{mAdj(c.unhappyId,14,'you promised to fix it in public');bAdj(1,'handled an unhappy player like an adult');return null}},
  {k:'dig', t:'"Nobody is bigger than this club. If he wants the door, it opens both ways."',
   d:'The whole squad just heard the rules', f:c=>{mAdj(c.unhappyId,-18,'you showed him the door in public');c.xi.forEach(shock);punditAdj(3);return UP(surname(c.unhappyName))+' TOLD: THE DOOR OPENS BOTH WAYS'}}
 ]},
{id:'identity_quote', tag:'*', needs:'identLine', rec:'blame',
 q:[c=>'People who know that dressing room say this: "'+c.identLine+'" Fair?',
    c=>'A description of your team doing the rounds: "'+c.identLine+'" Do you recognise it?'],
 a:[
  {k:'back', t:'"Whoever said that has never stood in that room on a Tuesday. My players know who we are."',
   d:'Denial, wearing a club tie', f:c=>{c.xi.forEach(id=>mAdj(id,5,'you rejected the whispers'));punditAdj(-2);return null}},
  {k:'blame', t:'"I built that room, so if that is what it is, I built it. Judge me on what it becomes."',
   d:'Ownership of the whole culture', f:c=>{bAdj(1,'owned the culture, good and bad');punditAdj(5);return '"I BUILT THAT ROOM" — '+mgrUp()+' OWNS IT ALL'}},
  {k:'dig', t:'"Somebody in my building is talking to you lot. When I find them, you lose a source."',
   d:'The mole hunt is now official', f:c=>{c.xi.forEach(id=>mAdj(id,-5,'the manager is hunting the leak'));punditAdj(-4);return 'MOLE HUNT: BOSS TURNS ON THE LEAK'}}
 ]},
{id:'deadline_day', tag:'*', needs:'deadline', once:true, rec:'blame',
 q:[c=>'The window shuts in days. Done, or is there one more call in you?',
    c=>'Deadline is coming. Every agent in the country has your number this week. Anything happening?'],
 a:[
  {k:'back', t:'"The squad in that room is the squad I want. The window can shut tonight for all I care."',
   d:'Twenty-odd players just felt taller', f:c=>{c.xi.forEach(id=>mAdj(id,8,'you told the window to shut'));bAdj(1,'settled the window early');return 'WINDOW? SHUT IT, SAYS '+mgrUp()}},
  {k:'blame', t:'"If we end the window short, that is my planning, nobody else\'s."',
   d:'Pre-signed confession, undated', f:c=>{punditAdj(3);return null}},
  {k:'dig', t:'"Ask me after deadline. If nothing arrives, ask the people who count the money."',
   d:'A hostage note to your own board', f:c=>{bAdj(-6,'held the board hostage over deadline');punditAdj(3);return 'DEADLINE JAB: "ASK THE PEOPLE WHO COUNT THE MONEY"'}}
 ]},
{id:'big_signing', tag:'*', needs:'signingName', rec:'back',
 q:[c=>c.signingName+', for '+money(c.signingFee)+'. That is real money for this club. Where does he fit?',
    c=>'Your new man '+c.signingName+' — the fee raised eyebrows. Sell him to the doubters.'],
 a:[
  {k:'back', t:'"Watch him for a month and then come back and ask about the fee."',
   d:'His shirt sales start today', f:c=>{if(c.signingId)mAdj(c.signingId,12,'the manager backed the fee in public');punditAdj(2);return money(c.signingFee)+'? CHEAP, SAYS THE BOSS'}},
  {k:'blame', t:'"If he fails, the fee is my mistake, not his. Print that and hold me to it."',
   d:'The fee is now your problem, forever', f:c=>{if(c.signingId)mAdj(c.signingId,8,'you took the fee pressure off him');bAdj(-2,'strapped the fee to his own back');punditAdj(4);return null}},
  {k:'dig', t:'"Half of you priced him at double when he was at a fashionable club. Funny, that."',
   d:'The press pack does not enjoy mirrors', f:c=>{punditAdj(-5);S().line=punditLine('slapped');return 'BOSS ACCUSES PRESS OF POSTCODE PRICING'}}
 ]},
{id:'big_sale', tag:'*', needs:'saleName', rec:'blame',
 q:[c=>c.saleName+' has gone for '+money(c.saleFee)+'. Fans call it selling the family silver. Do they have a point?',
    c=>'You let '+c.saleName+' leave. Explain that to the people who sing his song.'],
 a:[
  {k:'back', t:'"The players still here do not want to hear about the one who left. Nor do I."',
   d:'A door closed with a bang', f:c=>{c.xi.forEach(id=>mAdj(id,6,'you moved on and took them with you'));return null}},
  {k:'blame', t:'"I sold him. My call, my risk, and the money stays in my squad. Watch what it becomes."',
   d:'Now the reinvestment is a promise', f:c=>{bAdj(2,'owned the sale outright');punditAdj(4);return '"MY CALL, MY RISK" — '+mgrUp()+' ON THE BIG SALE'}},
  {k:'dig', t:'"Every family sells the silver when the roof leaks. Ask who let the roof leak."',
   d:'The metaphor lands upstairs, hard', f:c=>{bAdj(-9,'blamed the board for the sale');punditAdj(4);return '"ASK WHO LET THE ROOF LEAK"'}}
 ]},
{id:'offer_talk', tag:'*', needs:'offerName', rec:'back',
 q:[c=>'There is a bid on the table for '+c.offerName+'. Is he for sale?',
    c=>(c.offerClub||'A club')+' want '+c.offerName+'. One sentence: does he stay?'],
 a:[
  {k:'back', t:'"He stays. Next question."',
   d:'Four words. A wall', f:c=>{if(c.offerId)mAdj(c.offerId,10,'you shut the bid down in one line');punditAdj(3);return '"HE STAYS. NEXT QUESTION."'}},
  {k:'blame', t:'"Every player has a price and it is my job to know it. Right now nobody has met it."',
   d:'Honest, and the agent just smiled', f:c=>{if(c.offerId)mAdj(c.offerId,-6,'you admitted he has a price');bAdj(2,'talked the value up');return null}},
  {k:'dig', t:'"Tell them to add a one to the front of it and stop wasting my fax machine."',
   d:'The fee just went up in print', f:c=>{if(c.offerId)mAdj(c.offerId,4,'you priced him like a crown jewel');punditAdj(2);return 'ADD A ONE TO THE FRONT: BOSS TAUNTS BIDDERS'}}
 ]},
{id:'top_scorer', tag:'*', needs:'topScorerName', rec:'back',
 q:[c=>c.topScorerGoals+' goals now for '+c.topScorerName+'. Is he the best you have worked with?',
    c=>'Where would this team be without '+c.topScorerName+'\'s goals? Honestly.'],
 a:[
  {k:'back', t:'"Best finisher I have had. And the ten around him make the bullets."',
   d:'Everyone gets a share of the headline', f:c=>{if(c.topScorerId)mAdj(c.topScorerId,10,'the manager called him his best');c.xi.forEach(id=>{if(id!==c.topScorerId)mAdj(id,4,'you called them the bullet-makers')});return UP(surname(c.topScorerName))+': THE BEST I HAVE HAD, SAYS BOSS'}},
  {k:'blame', t:'"Without him we would be mid-table and I would be answering harder questions. So I coach the other ten harder."',
   d:'True enough to sting', f:c=>{if(c.topScorerId)mAdj(c.topScorerId,6,'you admitted he carries you');punditAdj(3);bAdj(-1,'admitted the dependence');return null}},
  {k:'dig', t:'"He is the best paid-by-others player in the league. Every big club is welcome to be disappointed."',
   d:'A no-sale wrapped in a wink', f:c=>{if(c.topScorerId)mAdj(c.topScorerId,5,'you warned the vultures off');punditAdj(2);return 'HANDS OFF: BOSS WARNS THE VULTURES'}}
 ]},
{id:'young_star', tag:'*', needs:'youngName', rec:'back',
 q:[c=>c.youngName+' is '+c.youngAge+'. You keep picking him when you do not have to. Why?',
    c=>'The kid, '+c.youngName+' — supporters love him already. How do you protect a boy from that?'],
 a:[
  {k:'back', t:'"Because he is good enough, and age is a fact, not a reason."',
   d:'The academy pinned it to the wall', f:c=>{if(c.youngId)mAdj(c.youngId,12,'the manager said age is not a reason');punditAdj(3);return 'AGE IS A FACT, NOT A REASON'}},
  {k:'blame', t:'"If it goes wrong for him it will be because I rushed him. I check that call every week."',
   d:'A duty of care, on record', f:c=>{if(c.youngId)mAdj(c.youngId,7,'you showed him you carry the risk');bAdj(1,'handled the kid responsibly');return null}},
  {k:'dig', t:'"Protect him? From you lot, mostly. Leave the boy alone until he is twenty-three."',
   d:'The pack does not like being the story', f:c=>{if(c.youngId)mAdj(c.youngId,9,'you stood between him and the press');punditAdj(-4);return 'LEAVE THE BOY ALONE, PRESS TOLD'}}
 ]},
{id:'old_legs', tag:'*', needs:'vetName', rec:'back',
 q:[c=>c.vetName+' is '+c.vetAge+' and still starting. Sentiment, or does he really get in on merit?',
    c=>'How many more seasons do those legs have? '+c.vetName+' would want you to say ten.'],
 a:[
  {k:'back', t:'"Merit. He wins us the minutes the kids do not even see yet."',
   d:'The old man will nod once. It means everything', f:c=>{if(c.vetId)mAdj(c.vetId,12,'you said merit, and meant it');return UP(surname(c.vetName))+': STILL IN ON MERIT'}},
  {k:'blame', t:'"The day sentiment picks my team, sack me. He plays because I trust him."',
   d:'Trust, notarised', f:c=>{if(c.vetId)mAdj(c.vetId,8,'the manager staked his name on him');punditAdj(3);return null}},
  {k:'dig', t:'"He has more football in him than half the wingers you lot rave about."',
   d:'A generation just got dismissed', f:c=>{if(c.vetId)mAdj(c.vetId,9,'you defended his legs in public');punditAdj(-3);return 'OLD GOLD: BOSS DEFENDS HIS VETERAN'}}
 ]},
{id:'job_pressure', tag:'*', needs:'confLow', rec:'blame',
 q:[c=>'People upstairs have gone quiet on you. Have you had assurances about your position?',
    c=>'Betting has you gone by the end of the season. Do you feel supported, '+(c.mgrSur||'boss')+'?'],
 a:[
  {k:'back', t:'"My players give me all the assurance I need. Watch them run."',
   d:'Brave face, well made', f:c=>{c.xi.forEach(id=>mAdj(id,7,'you said they were your assurance'));punditAdj(2);return null}},
  {k:'blame', t:'"I have not earned assurances. Results are the only contract that matters."',
   d:'Dignity, at a price', f:c=>{bAdj(3,'accepted the pressure without a whimper');punditAdj(6);S().line=punditLine('backed');return '"RESULTS ARE THE ONLY CONTRACT" — '+mgrUp()}},
  {k:'dig', t:'"Ask the bookies who they had winning the league. Clowns, the lot of them."',
   d:'The odds shortened as you spoke', f:c=>{punditAdj(-5);bAdj(-2,'laughed at the noose');return 'BOSS LAUGHS AT THE ODDS. THE ODDS SHORTEN.'}}
 ]},
{id:'above_obj', tag:'*', needs:'aboveObj', rec:'blame',
 q:[c=>'The board asked for "'+c.objText+'". You are '+ord(c.pos)+'. Time to raise the target?',
    c=>ord(c.pos)+', ahead of everything they asked of you. Are you overachieving, or were they under-asking?'],
 a:[
  {k:'back', t:'"The players outgrew the objective. I am not dragging them back down to it."',
   d:'Ambition, publicly contagious', f:c=>{c.xi.forEach(id=>mAdj(id,7,'you said they outgrew the target'));bAdj(-2,'moved the goalposts upward himself');return 'THEY OUTGREW THE OBJECTIVE'}},
  {k:'blame', t:'"Targets are set in summer by sensible people. My job is to embarrass the target."',
   d:'The board can live with that', f:c=>{bAdj(3,'overdelivered and stayed polite');punditAdj(3);return null}},
  {k:'dig', t:'"They under-asked. Write that down before somebody upstairs rewrites the summer."',
   d:'A little history war has started', f:c=>{bAdj(-6,'accused the board of small dreams');punditAdj(3);return '"THEY UNDER-ASKED" — BOSS REWRITES THE SUMMER'}}
 ]},
{id:'below_obj', tag:'*', needs:'belowObj', rec:'blame',
 q:[c=>'"'+c.objText+'" — their words in August. It is not happening, is it?',
    c=>'You are '+ord(c.pos)+' and the objective says otherwise. What do you tell the people who set it?'],
 a:[
  {k:'back', t:'"Count the rounds left, then count my players out. I would not advise either."',
   d:'Defiance with a fixture list', f:c=>{c.xi.forEach(id=>mAdj(id,6,'you told the world the sums still work'));bAdj(-2,'promised a late run');return null}},
  {k:'blame', t:'"I tell them the truth. We are behind, it is mine, and here is the plan."',
   d:'The plan had better exist', f:c=>{bAdj(2,'faced the objective gap squarely');punditAdj(5);return null}},
  {k:'dig', t:'"Objectives written in August do not survive the injuries of November. They know that."',
   d:'Excuses age worse than defeats', f:c=>{bAdj(-5,'renegotiated the objective through the press');punditAdj(-2);return 'BOSS BLAMES THE FIXTURE GODS'}}
 ]},
{id:'rival_sacked', tag:'*', needs:'vacancyClub', once:true, rec:'blame',
 q:[c=>'The '+c.vacancyClub+' job is coming open, everyone says so. Your name is in the conversation.',
    c=>'A dugout in this division will be vacant soon, and your name came up before the seat was cold. Flattered?'],
 a:[
  {k:'back', t:'"My name belongs to this club and these players. Conversations do not pick teams."',
   d:'Loyalty, stamped and dated', f:c=>{c.xi.forEach(id=>mAdj(id,7,'you shut the vacancy talk down'));bAdj(4,'pledged himself in public');return 'GOING NOWHERE: '+mgrUp()+' SHUTS THE TALK DOWN'}},
  {k:'blame', t:'"A man lost his job today. I will not dance on the grave. It comes for all of us."',
   d:'Grim fraternity of the dugout', f:c=>{punditAdj(6);bAdj(1,'showed a bit of class');return null}},
  {k:'dig', t:'"Flattered that a struggling club would want me? Think about what you just asked."',
   d:'The reporter went slightly red', f:c=>{punditAdj(-4);return 'BOSS SWATS THE VACANCY QUESTION'}}
 ]},
{id:'cup_league', tag:'*', needs:'cupAliveDeep', rec:'blame',
 q:[c=>'A cup '+(c.cupRound||'run')+' still alive and a league season to protect. Which one gets your best eleven?',
    c=>'Managers say they take the cup seriously right up until they make seven changes. What will you do?'],
 a:[
  {k:'back', t:'"My best eleven plays whatever is next. This squad does not do reserves-day."',
   d:'Rotation just got harder to explain', f:c=>{c.xi.forEach(id=>mAdj(id,6,'you promised no reserves-day'));bAdj(-1,'boxed himself in on rotation');return null}},
  {k:'blame', t:'"If we fall between two stools, the bruise is mine. I pick the teams."',
   d:'Clean lines of responsibility', f:c=>{bAdj(2,'owned the balancing act');punditAdj(3);return null}},
  {k:'dig', t:'"Ask the schedulers who put four games in eleven days. Then ask them to carry the kit."',
   d:'The fixture computer has no feelings. Its owners do', f:c=>{punditAdj(2);bAdj(-2,'moaned at the calendar');return 'BOSS v THE FIXTURE COMPUTER'}}
 ]},
{id:'presser_century', tag:'*', needs:'pressMile', once:true, rec:'blame',
 q:[c=>'By our count this is your '+c.pressMile+'th time in that chair for this club. Learned anything about us yet?',
    c=>c.pressMile+' press conferences here. Go on — which of us do you actually rate?'],
 a:[
  {k:'back', t:'"I have learned my players read what you write. So write carefully."',
   d:'A warning shot with a smile on it', f:c=>{c.xi.forEach(id=>mAdj(id,4,'you told the press to mind their words'));punditAdj(1);return null}},
  {k:'blame', t:'"All these press conferences and I still say too much. That one is on me as well."',
   d:'Even the room laughed', f:c=>{punditAdj(5);S().line=punditLine('backed');return null}},
  {k:'dig', t:'"Rate you? I rate the one at the back who never asks about my job. He can stay."',
   d:'The front row will remember', f:c=>{punditAdj(-3);return 'BOSS PICKS HIS FAVOURITE REPORTER. IT IS NOT YOU.'}}
 ]}
]}

/* a public slaughtering sometimes shocks a reaction out of a player */
function shock(id){
  const p=me().squad.find(x=>x.id===id);
  if(p&&rnd()<0.45)p.form=clamp(p.form+0.55,-2,2);
}
/* a swing at the officials is free until the charge sheet arrives */
function refCharge(){
  const c=me(), fine=Math.round((18000+c.rep*900)/1000)*1000;
  punditAdj(-4);
  if(c.bal>fine*4){ c.bal-=fine; note('Charged','A misconduct charge and a '+money(fine)+' fine. Worth it, probably.',
    {from:vV('league'),about:vC(c),rel:'charge'}); }
  else note('Charged','A misconduct charge. They have let you off the fine. This time.',
    {from:vV('league'),about:vC(c),rel:'charge'});
  bAdj(-3,'dragged the club in front of a disciplinary panel');
}

/* ---------- deciding whether there is anything worth asking ---------- */
function buildContext(m){
  const st=ensure();
  const c=me(), s=m.mine, o=1-s, R=m.R;
  const opp=G.clubs[m.hi===G.me?m.ai:m.hi];
  const gf=R.g[s], ga=R.g[o];
  const res=gf>ga?'W':gf===ga?'D':'L';
  const prevWinless=st.noWin||0;
  const city=derbyWith(opp), rival=nearestRival();
  const near=!city&&rival&&rival.id===opp.id&&Math.abs(opp.rep-c.rep)<=6;
  const gap=c.rep-opp.rep;
  const goals=R.ev.filter(e=>e.t==='goal');
  const scorers=goals.filter(e=>e.s===s);
  const tally={}; let hat=null;
  scorers.forEach(e=>{tally[e.wid]=(tally[e.wid]||0)+1; if(tally[e.wid]>=3)hat=e.who});
  /* the biggest hole we climbed out of, and whether the killer goal was late */
  let a=0,b=0,maxDef=0;
  goals.forEach(e=>{ if(e.s===s)a++; else b++; maxDef=Math.max(maxDef,b-a) });
  const lastGoal=goals.length?goals[goals.length-1]:null;
  const key=m.f&&m.f.comp?m.f.comp.key:'league';
  const isCup=key==='cup', isEuro=key==='ucl'||key==='uel'||key==='uecl';
  const stage=String(m.f&&m.f.stage||'');
  const table=leagueOf(c.id)?leagueTable(leagueOf(c.id)):null;
  const myPosNow=table?table.findIndex(x=>x.id===c.id)+1:9;
  const oppPos=table?table.findIndex(x=>x.id===opp.id)+1:0;

  const ctx={
    myName:c.name, oppName:opp.name, oppId:opp.id, home:m.hi===G.me?1:0,
    gf:gf, ga:ga, margin:Math.abs(gf-ga), res:res, comp:m.f.comp.name,
    compKey:key, isCup:isCup, isEuro:isEuro, stage:stage,
    resW:res==='W'?1:0, dropped:res!=='W'?1:0,
    city:city, derby:!!city||near, returning:st.clubs.indexOf(opp.id)>=0&&opp.id!==c.id,
    upsetWin:res==='W'&&gap<=-13, upsetLoss:res==='L'&&gap>=13,
    title:key==='league'&&G.week>=22&&myPosNow<=3&&(oppPos&&oppPos<=4),
    thrash:res==='W'&&Math.abs(gf-ga)>=4,
    heavy:(res==='L'&&Math.abs(gf-ga)>=3)||(res==='L'&&m.hi===G.me&&Math.abs(gf-ga)>=2),
    cupFinal:isCup&&/final/i.test(stage),
    euroSemiUp:isEuro&&/semi|final/i.test(stage),
    winlessRun:0, prevWinless:prevWinless,
    red:!!(R.drv&&R.drv.red&&R.drv.red[s]), hat:hat,
    comeback:res!=='L'&&maxDef>=2, maxDef:maxDef,
    lateGoal:res==='W'&&scorers.length&&scorers[scorers.length-1].m>=86,
    lateMin:scorers.length?scorers[scorers.length-1].m:0,
    lateLoss:res==='L'&&Math.abs(gf-ga)===1&&lastGoal&&lastGoal.s===o&&lastGoal.m>=85,
    late:res==='W'&&scorers.length?scorers[scorers.length-1].m>=86:false,
    scorer:scorers.length?scorers[scorers.length-1].who:null,
    xi:c.xi.map(x=>x.p.id),
    week:G.week, season:G.season, pos:myPosNow, oppPos:oppPos,
    mgrSur:mgrSur(),
    promotedOpp:key==='league'&&G.week<=16&&(st.promoted||[]).indexOf(opp.id)>=0
  };
  ctx.winlessRun=bumpRuns(res,gf,ga);
  ctx.winRun=st.winRun||0; ctx.cleanRun=st.cleanRun||0; ctx.blankRun=st.blankRun||0;
  ctx.winless=ctx.res!=='W'&&ctx.winlessRun>=3;
  ctx.firstWin=ctx.res==='W'&&prevWinless>=3;

  // head to head under you
  if(!st.vs[opp.id])st.vs[opp.id]={w:0,d:0,l:0};
  st.vs[opp.id][res==='W'?'w':res==='D'?'d':'l']++;
  ctx.neverBeaten=st.vs[opp.id].w===0?1:0;
  return ctx;
}
/* how badly does a reporter want this one? 0 = leave it alone */
function weigh(c){
  let w=0,tags=[];
  const T=(t,n)=>{w=Math.max(w,n);tags.push(t)};
  if(c.isCup&&c.cupFinal&&c.res==='W')T('cupWon',3);
  else if(c.isCup&&c.res==='L')T('cupOut',c.cupFinal?3:2);
  if(c.isCup&&c.res==='W'&&c.upsetWin)T('cupShock',3);
  else if(c.isCup&&c.res==='W'&&!c.cupFinal)T('cupOn',2);
  if(c.isEuro&&c.euroSemiUp)T('euroDeep',3);
  else if(c.isEuro&&c.res==='W')T('euroWin',2);
  else if(c.isEuro&&c.res==='L')T('euroLoss',2);
  if(c.derby)T('derby',3);
  if(c.heavy)T('heavy',c.margin>=4?3:2);
  if(c.returning)T('returning',3);
  if(c.upsetLoss)T('upsetLoss',3);
  if(c.upsetWin&&!c.isCup)T('upsetWin',2);
  if(c.winless)T('winless',2);
  if(c.title)T('title',2);
  if(c.thrash)T('thrash',2);
  if(c.firstWin)T('firstWin',2);
  if(c.red)T('red',2);
  if(c.hat)T('hat',2);
  if(c.late)T('late',2);
  if(c.lateLoss)T('lateLoss',2);
  if(c.comeback&&c.res==='W')T('comeback',c.maxDef>=2?3:2);
  if(c.winRun>=4&&c.res==='W')T('streak',2);
  if(c.cleanRun>=3&&c.res!=='L')T('clean',2);
  if(c.blankRun>=3&&c.res!=='W')T('blank',2);
  if(c.promotedOpp&&c.res!=='W')T('promoted',2);
  if(c.compKey==='league'&&c.week>=25&&c.pos>=18)T('scrap',2);
  c.tags=tags;
  return w;
}

/* ---------- everything else the press might know this week ----------
   All of it read through SW.get() and guarded: any module may be absent. */
function fillExtras(c,st){
  // the struggler: worst of your starters, or the unhappiest
  let str=null,worst=99;
  try{
    me().xi.forEach(({p})=>{
      const r=p.ratings.length?p.ratings[p.ratings.length-1]:6.5;
      const score=r-(p.morale<25?1.2:0);
      if(score<worst){worst=score;str=p}
    });
  }catch(e){}
  if(str){c.strugglerId=str.id;c.strugglerName=str.name}
  c.punditName=st.pundit.name; c.punditQuote=st.line;

  // an unhappy man, if the dressing room has one (and he is not today's struggler)
  try{
    const mo=SW.get('morale');
    if(mo&&typeof mo.unhappy==='function'){
      const u=mo.unhappy()||[];
      const pk=u.find(p=>p.id!==c.strugglerId)||u[0];
      if(pk){c.unhappyId=pk.id;c.unhappyName=pk.name}
    }
  }catch(e){}

  // the room's reputation, in the culture module's own words
  try{
    const cu=SW.get('culture');
    if(cu&&typeof cu.identity==='function'){
      const lines=cu.identity()||[];
      if(lines.length)c.identLine=pick(lines);
    }
  }catch(e){}

  // the window: deadline days, a live offer on the table
  if(G.window==='winter'&&G.week>=20)c.deadline=1;
  try{
    const mk=SW.get('market');
    if(mk&&typeof mk.offers==='function'){
      const off=(mk.offers()||[]).filter(o=>o.stage==='open');
      if(off.length){
        const o=off[0], p=me().squad.find(x=>x.id===o.player);
        if(p){c.offerId=p.id;c.offerName=p.name;c.offerFee=o.fee;
          c.offerClub=G.clubs[o.club]?G.clubs[o.club].name:null}
      }
    }
  }catch(e){}

  // a deal we actually did lately (tracked from onTransfer)
  if(st.deal&&NOW()-st.deal.at<=3){
    const p=me().squad.find(x=>x.id===st.deal.pid);
    if(st.deal.dir==='in'){c.signingName=st.deal.name;c.signingFee=st.deal.fee;c.signingId=p?p.id:null}
    else{c.saleName=st.deal.name;c.saleFee=st.deal.fee}
  }

  // the men worth a question in their own right
  try{
    const sq=squadOf(me());
    const ts=sq.slice().sort((x,y)=>(y.goals||0)-(x.goals||0))[0];
    if(ts&&(ts.goals||0)>=10){c.topScorerId=ts.id;c.topScorerName=ts.name;c.topScorerGoals=ts.goals}
    me().xi.forEach(({p})=>{
      if(p.age<=20&&!c.youngId){c.youngId=p.id;c.youngName=p.name;c.youngAge=p.age}
      if(p.age>=33&&!c.vetId){c.vetId=p.id;c.vetName=p.name;c.vetAge=p.age}
    });
  }catch(e){}

  // the chair getting warm
  try{
    const b=SW.get('board');
    if(b&&typeof b.confidence==='function'&&b.confidence()<=25)c.confLow=1;
  }catch(e){}

  // the table against the objective
  const obj=G.objective;
  if(obj&&obj.pos&&c.compKey==='league'){
    c.objText=obj.text;
    if(c.week>=10&&c.pos<=Math.max(1,obj.pos-3))c.aboveObj=1;
    if(c.week>=24&&c.pos>obj.pos+3)c.belowObj=1;
  }

  // a cup run still breathing while the league grinds on
  try{
    const cp=SW.get('cup');
    if(cp&&typeof cp.status==='function'){
      const s0=cp.status();
      if(s0&&s0.alive){c.cupName=s0.name;c.cupRound=s0.roundName;
        if(s0.round>=4&&c.compKey==='league')c.cupAliveDeep=1}
    }
  }catch(e){}

  // a dugout about to open elsewhere in the division
  try{
    if(c.compKey==='league'&&c.week>=8){
      const l=leagueOf(G.me);
      if(l){
        const t=leagueTable(l), bot=t[t.length-1];
        if(bot&&bot.id!==G.me&&(bot.form||[]).slice(-5).filter(x=>x==='L').length>=4)
          c.vacancyClub=bot.name;
      }
    }
  }catch(e){}

  // a round number in the chair
  const n=(st.pressCount||0)+1;
  if(n>0&&n%25===0)c.pressMile=n;
}

/* ---------- lifecycle ---------- */
SW.register({
id:'media',

init(){ const st=SW.state('media'); st.v=0; ensure(); },
onLoad(){ const st=ensure(); st.live=null; st.pending=null; },

onWeek(week){
  const st=ensure();
  if(st.clubs.indexOf(G.me)<0)st.clubs.push(G.me);
  st.view=Math.round(st.view*0.94);            // he cools off if you stop giving him material
  // he says something every few weeks whether you asked or not
  if(week%5===0&&!st.live)st.line=punditLine('idle');
},

onTransfer(p,seller,buyer,fee){
  const st=ensure();
  if(!p)return;
  const big=fee>=Math.max(1.5e6,(me().rep||20)*1.2e5);
  if(!big)return;
  if(buyer&&buyer.id===G.me)st.deal={dir:'in',pid:p.id,name:p.name,fee:fee,at:NOW()};
  else if(seller&&seller.id===G.me)st.deal={dir:'out',pid:p.id,name:p.name,fee:fee,at:NOW()};
},

onSeasonEndBefore(){
  const st=ensure();
  const l=leagueOf(G.me);
  st.prevLeague=l?l.clubs.slice():[];
},

onMatchEnd(m){
  if(!m||(m.hi!==G.me&&m.ai!==G.me))return;
  const st=ensure();
  const c=buildContext(m);
  const w=weigh(c); st.lastWeigh=w;

  // pundit tracks results before he ever opens his mouth
  let d=c.res==='W'?6:c.res==='D'?0:-6;
  if(c.upsetWin)d+=10; if(c.upsetLoss)d-=10;
  if(c.thrash)d+=5; if(c.heavy)d-=8;
  if(c.derby)d*=1.5;
  punditAdj(d);
  st.line=punditLine('idle');

  setHead(resultHeadline(c), w>=3, false, w>=2);

  if(c.isCup&&c.cupFinal&&c.res==='W')mile('Won the cup. '+c.gf+'-'+c.ga+' against '+c.oppName+'.');
  else if(c.derby&&c.res==='W')mile('Beat '+c.oppName+' in the derby, '+c.gf+'-'+c.ga+'.');
  else if(c.upsetWin)mile('Turned over '+c.oppName+' when nobody gave us a chance.');
  else if(c.thrash)mile(c.gf+'-'+c.ga+' against '+c.oppName+'. One of those afternoons.');
  else if(c.prevWinless>=6&&c.winlessRun===0)mile('Ended a run of '+c.prevWinless+' without a win.');

  // --- cadence: never a chore ---
  let fire=w>=2;
  if(st.pressedLast&&w<3)fire=false;             // never two running unless it is a big one
  if(w===2&&st.sincePress<1)fire=false;
  if(w===2&&rnd()<0.34&&st.sincePress<5)fire=false;   // he does not always bother
  if(fire){
    st.pending={c:c, w:w};
  }else{
    st.pending=null; st.pressedLast=false; st.sincePress=(st.sincePress||0)+1;
  }
},

/* takes over after the match report, only when there is a conference to run */
afterReport(){
  const st=ensure();
  if(!st.pending)return;
  const P=st.pending; st.pending=null;
  const qs=chooseQuestions(P.c,P.w);
  if(!qs.length){st.pressedLast=false;st.sincePress++;return}
  st.pressedLast=true; st.sincePress=0; st.pressCount++;
  st.lastQ=qs.map(q=>q.id);
  st.live={c:P.c, ids:st.lastQ, i:0, heads:[]};
  save();
  renderPress();
  return true;
},

hubBlocks(){
  const st=ensure();
  if(!st.head&&!st.line)return [];
  const h=st.head?st.head.t:null;
  return [`<div class="sechead" style="margin-top:14px">Back page</div>
   <div class="card" style="background:var(--s3);border-color:var(--strong);cursor:pointer"
        onclick="SWmedia.papers()">
    ${h?`<div style="font-family:var(--disp);font-weight:800;font-size:20px;line-height:22px;
      text-transform:uppercase;letter-spacing:-.01em">${esc(h)}</div>`:''}
    <div class="row" style="gap:11px;align-items:flex-start;${h?'border-top:1px solid var(--hair);margin-top:10px;padding-top:10px':''}">
      ${avatar(vPundit(),52)}
      <div style="min-width:0"><div style="font-size:12.5px;color:var(--t2);line-height:17px">&ldquo;${esc(st.line)}&rdquo;</div>
      <div style="color:var(--t3);font-size:11px;margin-top:4px;font-weight:600">${esc(st.pundit.name)} &middot; ${esc(st.pundit.role)}</div></div></div>
   </div>`];
},

onSeasonEndAfter(info){
  const st=ensure();
  const c=me(), pos=info&&info.pos?info.pos:myPos();
  const hit=info&&info.hit;
  const M=mgrUp();
  const t = pos===1 ? pickHead([UP(c.name)+' ARE CHAMPIONS. GET IT ON A WALL.',
      M+' DID WHAT HE SAID HE WOULD DO','CHAMPIONS. READ IT SLOWLY. CHAMPIONS.'])
    : hit ? pickHead(['JOB DONE — AND THEY WANT MORE NEXT YEAR','TARGET HIT. THE SUMMER BELONGS TO '+M])
    : pos>=18 ? pickHead(['DOWN. AND IT WAS COMING FROM CHRISTMAS','RELEGATED. NOBODY GETS TO LOOK SURPRISED.'])
    : pickHead(['FINISHED '+UP(ord(pos))+'. NOBODY REMEMBERS FIFTH.',
        UP(ord(pos))+'. THE OBJECTIVE SAYS OTHERWISE, AND SO WILL THE BOARD']);
  setHead(t, pos===1||pos>=18, true);
  if(pos===1)punditAdj(35); else if(!hit)punditAdj(-18); else punditAdj(8);
  st.view=Math.round(st.view*0.72);            // a new season, a shorter memory
  st.line = pos===1 ? pfresh([
      'I doubted {M} in August. I will be reminded of it until I die.',
      'Champions. Whatever you think of {M}, he got there first.',
      'They will name a stand after him if he is not careful.'])
    : pfresh([
      'Pre-season, and everyone is unbeaten. Ask me in October.',
      'New season. Same squad, same questions, same manager. We will see.',
      '{M} has bought himself a summer. Nothing more than that.',
      'The fixture list is out. Somewhere on it is the week that defines {M}.']);
  st.pressedLast=false; st.sincePress=99; st.vs={};
  st.noWin=0; st.winRun=0; st.cleanRun=0; st.blankRun=0;
  st.seasonAsked={};                       // the season's question memory resets with it
  st.deal=null;
  /* who came up into our league — the press will want a word when they take points off us */
  try{
    const l=leagueOf(G.me);
    if(l&&st.prevLeague&&st.prevLeague.indexOf(G.me)>=0)
      st.promoted=l.clubs.filter(id=>st.prevLeague.indexOf(id)<0);
    else st.promoted=[];
  }catch(e){st.promoted=[]}
  if(pos===1)mile('Champions. '+c.name+', '+(G.season-1)+'/'+String(G.season).slice(2)+'.');
},

/* ---------- published interface ---------- */
headline(){ const st=ensure(); return st.head?st.head.t:null },
pundit(){ const st=ensure(); return st.pundit?{name:st.pundit.name, line:st.line}:null }
});

/* ---------- picking the questions ----------
   A question situation sleeps for COOL weeks after it is asked, and the
   season's memory steers the pick toward situations not yet used this year.
   Phrasings rotate per situation, so even a returning situation reads new. */
function chooseQuestions(c,w){
  const st=S();
  st.askedAt=st.askedAt||{}; st.qv=st.qv||{}; st.seasonAsked=st.seasonAsked||{};
  const bank=Q(), out=[], used={};
  fillExtras(c,st);

  const ok=q=>{
    if(used[q.id])return false;
    if(q.once&&st.seasonAsked[q.id])return false;
    const at=st.askedAt[q.id];
    if(at!==undefined&&NOW()-at<COOL)return false;
    if(q.needs&&!c[q.needs])return false;
    return true;
  };
  const preferUnasked=list=>{
    const f=list.filter(q=>!st.seasonAsked[q.id]);
    return f.length?f:list;
  };
  const take=q=>{
    out.push(q); used[q.id]=1;
    st.qv[q.id]=st.qv[q.id]===undefined?ri(0,6):st.qv[q.id]+1;
    st.askedAt[q.id]=NOW();
    st.seasonAsked[q.id]=1;
  };
  const want=w>=3?3:2;
  // lead with the reason he came
  const lead=bank.filter(q=>q.tag!=='*'&&c.tags.indexOf(q.tag)>=0&&ok(q));
  if(lead.length)take(pick(preferUnasked(lead)));
  // then whatever else is on his pad
  while(out.length<want){
    const pool=bank.filter(q=>ok(q)&&(q.tag==='*'||c.tags.indexOf(q.tag)>=0));
    if(!pool.length)break;
    take(pick(preferUnasked(pool)));
  }
  return out.slice(0,3);
}
function qtext(q,c){
  const st=S();
  const v=Array.isArray(q.q)?q.q:[q.q];
  const i=((st.qv&&st.qv[q.id])||0)%v.length;
  try{return v[i](c)}catch(e){return v[0](c)}
}

/* ---------- the sheet ---------- */
function renderPress(){
  const st=S(), L=st.live;
  if(!L){render();return}
  const bank=Q(), q=bank.find(x=>x.id===L.ids[L.i]);
  if(!q){finishPress();return}
  const c=L.c, n=L.ids.length;
  const hint = q.rec==='blame' ? 'Take it yourself. They are fishing for a row.'
    : q.rec==='back' ? 'Get behind them. They will hear about it before you are back.'
    : 'Give them something. Just watch what it costs.';
  /* every question has an asker and a subject: the pundit when he is being
     quoted, the man you are being asked about when there is one */
  const asker = q.needs==='punditQuote' ? vPundit() : vPress();
  const subjP = c.strugglerId&&q.needs==='strugglerId' ? c.strugglerId
    : q.needs==='unhappyName'&&c.unhappyId ? c.unhappyId
    : q.needs==='topScorerName'&&c.topScorerId ? c.topScorerId
    : q.needs==='youngName'&&c.youngId ? c.youngId
    : q.needs==='vetName'&&c.vetId ? c.vetId
    : q.needs==='offerName'&&c.offerId ? c.offerId : null;
  const subj  = subjP!=null ? vP((me().squad.find(x=>x.id===subjP))||null)
      : q.tag==='hat'&&c.hat ? vP(me().squad.find(x=>x.name===c.hat))
      : (c.derby||c.returning||c.upsetWin||c.upsetLoss||c.heavy) ? vC(G.clubs[c.oppId])
      : null;
  sheet(`<h3>The press room</h3>
   <div class="sh-sub">${esc(c.myName)} ${c.gf}&ndash;${c.ga} ${esc(c.oppName)} &middot; ${esc(c.comp)}
     &middot; question ${L.i+1} of ${n}</div>
   ${speakerBar(asker,subj,subj&&subj.k==='c'?'vs':'about',
      q.needs==='punditQuote'?S().pundit.role:'Question '+(L.i+1)+' of '+n)}
   <div class="qcard">
     <span class="qmark">&ldquo;</span>
     <div style="font-size:15.5px;font-weight:600;line-height:22px">${esc(qtext(q,c))}</div>
   </div>
   <div class="asrow">${avatar(vV('assist'),44)}
     <div style="font-size:12.5px;color:var(--t2);line-height:17px"><b style="color:var(--acc)">Assistant</b>
       &mdash; ${esc(hint)}</div>
   </div>
   ${q.a.map((a,i)=>`<div class="opt${a.k===q.rec?' rec':''}" onclick="SWmedia.answer(${i})">
     <div><div style="font-weight:600;font-size:14px;line-height:19px">${esc(a.t)}</div>
       <div class="dim" style="font-size:12px;margin-top:3px">${esc(a.d)}</div></div>
     ${a.k===q.rec?'<span class="st">Advised</span>':''}</div>`).join('')}
   <button class="btn ghost sm" style="margin-top:6px" onclick="SWmedia.noComment()">No comment &mdash; walk out</button>
   <div style="font-size:11.5px;color:var(--t3);margin:9px 2px 0">Walking out costs you a little with the
   board and a lot with him.</div>`);
}

window.SWmedia={
  answer(i){
    const st=S(), L=st.live; if(!L)return;
    const bank=Q(), q=bank.find(x=>x.id===L.ids[L.i]); if(!q)return;
    const a=q.a[i]; if(!a)return;
    let h=null; try{ h=a.f(L.c) }catch(e){ console.error('[media.answer]',e) }
    if(h)L.heads.push(h);
    L.i++;
    save();
    if(L.i>=L.ids.length)finishPress(); else renderPress();
  },
  noComment(){
    const st=S(), L=st.live; if(!L)return;
    bAdj(-4,'walked out of a press conference');
    punditAdj(-9);
    st.line=punditLine('slapped');
    L.heads.push(pickHead(['NOT A WORD: BOSS WALKS OUT ON THE PRESS',
      mgrUp()+' WALKS. THE SILENCE SAYS PLENTY.',
      'EMPTY CHAIR, FULL BACK PAGE']));
    L.i=L.ids.length;
    finishPress();
  },
  papers(){
    const st=S();
    sheet(`<h3>The back pages</h3>
     <div class="sh-sub">${st.pressCount} press conference${st.pressCount===1?'':'s'} survived</div>
     ${st.papers.length?st.papers.map(p=>`<div class="card" style="background:var(--s1);margin-bottom:8px;padding:12px 14px">
       <div style="font-family:var(--disp);font-weight:800;font-size:15px;line-height:18px;text-transform:uppercase">${esc(p.t)}</div>
       <div class="dim" style="font-size:11px;margin-top:5px">${p.s}/${String(p.s+1).slice(2)} &middot; ${p.end?'end of season':'week '+(p.w+1)}</div>
     </div>`).join(''):'<div class="card" style="background:var(--s1)">Nothing worth printing yet.</div>'}
     <div class="sechead">The man with the microphone</div>
     ${speakerBar(vPundit(),null,'',st.pundit.role+' · '+
       (st.view>=45?'On your side':st.view>=15?'Coming round':st.view<=-45?'Wants you gone':st.view<=-15?'Not convinced':'Undecided'))}
     <div class="card" style="background:var(--s1);margin-top:-4px">
       <div style="font-size:13.5px;color:var(--t1);line-height:19px">&ldquo;${esc(st.line)}&rdquo;</div></div>
     <button class="btn" style="margin-top:12px" onclick="closeSheet()">Close</button>`);
  }
};

function finishPress(){
  const st=S(), L=st.live;
  if(!L){render();return}
  if(L.heads.length)setHead(L.heads[L.heads.length-1], L.heads.length>1, false, true);
  st.live=null;
  const h=st.head?st.head.t:'';
  save();
  sheet(`<h3>Tomorrow's back page</h3>
   <div class="sh-sub">This is what they went with.</div>
   <div class="card" style="background:var(--s3);border-color:var(--strong);padding:16px 15px">
     <div style="font-family:var(--disp);font-weight:800;font-size:9px;letter-spacing:.18em;
       text-transform:uppercase;color:var(--acc)">Back page</div>
     <div style="font-family:var(--disp);font-weight:800;font-size:22px;line-height:24px;
       text-transform:uppercase;margin-top:6px">${esc(h)}</div>
     <div class="row" style="gap:11px;align-items:flex-start;border-top:1px solid var(--hair);
       margin-top:12px;padding-top:11px">${avatar(vPundit(),52)}
       <div style="min-width:0"><div style="font-size:12.5px;color:var(--t2);line-height:17px">&ldquo;${esc(st.line)}&rdquo;</div>
       <div style="color:var(--t3);font-size:11px;margin-top:4px;font-weight:600">${esc(st.pundit.name)} &middot; ${esc(st.pundit.role)}</div></div></div>
   </div>
   <button class="btn" style="margin-top:14px" onclick="closeSheet();render()">Done</button>`);
}

})();
