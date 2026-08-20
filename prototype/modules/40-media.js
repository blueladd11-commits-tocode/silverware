/* ============================================================
   media — press conferences, back-page headlines, pundit reaction
   Module 4 of 10. Owns: afterReport press sheet, hub "Back page" block.
   Reads morale/board/history through SW.get() only, always guarded.
   ============================================================ */
(function(){

/* ---------- state ---------- */
const S=()=>SW.state('media');
function ensure(){
  const st=S();
  if(!st.v){
    st.v=1;
    st.pundit=null;          // {name, role, tic}
    st.view=0;               // -100..100 what the pundit makes of you
    st.line='';              // his current take
    st.head=null;            // {t, s, w, big}
    st.papers=[];            // recent back pages
    st.live=null;            // press conference in progress
    st.lastQ=[];             // question ids used last time
    st.recentQ=[];           // question ids used lately
    st.sincePress=99;        // matches since the last press conference
    st.pressedLast=false;
    st.pressCount=0;
    st.clubs=[];             // every club id you have managed
    st.vs={};                // head-to-head under you, by club id
    st.lastMile=-99;
    st.pending=null;         // press conference queued by the last match
  }
  if(!st.pundit)newPundit();
  if(!st.line)st.line=punditLine('idle');
  if(!st.clubs)st.clubs=[];
  if(st.clubs.indexOf(G.me)<0)st.clubs.push(G.me);
  return st;
}

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
  'I was wrong about him. I do not enjoy saying it, but I was wrong.',
  'Whatever he is selling in that dressing room, the rest of them should buy it.',
  'He has made a hard job look ordinary. That is the highest praise I have.',
  'If he leaves that club, six others will empty their pockets. Mark it down.'
];
const P_WARM=[
  'Say what you like — the team looks like it belongs to somebody now.',
  'He gets more out of that squad than the squad deserves.',
  'Quietly, without any fuss, he is building something there.'
];
const P_NEUT=[
  'Jury is out. It usually is at that club.',
  'Ask me in ten games. I have been burned by fast starts before.',
  'He talks a good match. I would like to watch one.',
  'Nothing he has done yet tells me anything I did not already suspect.'
];
const P_COOL=[
  'That was a team with no idea what it was meant to be doing.',
  'I have watched better organised car parks.',
  'He is running out of games and he knows it.'
];
const P_COLD=[  // he wants you gone
  'I said it in August. He is out of his depth and the water is rising.',
  'They should have moved in the summer. Now they will pay twice for it.',
  'He has lost that dressing room. You can hear it from the press box.',
  'Somebody at that club has to be brave enough to end this.'
];
function punditLine(mood){
  const st=S(), v=st.view;
  if(mood==='slapped')return pick([
    'He can call me what he likes. I will still be here when he is not.',
    'Thin skin, that one. Always is when the results go.',
    'I have been called worse by better. It changes nothing I said.'
  ]);
  if(mood==='backed')return pick([
    'Fair play to him for fronting up. Not many do any more.',
    'He took it on the chin. That buys him a fortnight from me, no more.'
  ]);
  if(v>=55)return pick(P_HOT);
  if(v>=20)return pick(P_WARM);
  if(v<=-55)return pick(P_COLD);
  if(v<=-20)return pick(P_COOL);
  return pick(P_NEUT);
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
const surname=n=>String(n).split(' ').slice(-1)[0];
const UP=s=>String(s).toUpperCase();
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
function bumpWinless(res){const st=S();st.noWin=res==='W'?0:(st.noWin||0)+1;return st.noWin}

/* ---------- headlines ---------- */
function setHead(t,big,end,keep){
  const st=S();
  st.head={t:t,s:G.season,w:G.week,big:!!big};
  if(!keep&&!big&&!end)return;                      // routine week: printed, not framed
  const p={t:t,s:G.season,w:G.week,end:!!end};
  // one match, one back page: a press splash replaces the result line, it does not sit beside it
  if(st.papers[0]&&st.papers[0].s===p.s&&st.papers[0].w===p.w&&!end)st.papers[0]=p;
  else st.papers.unshift(p);
  if(st.papers.length>14)st.papers.length=14;
  if(big)note('Back page','"'+t+'" — and the phone has not stopped ringing.');
}
function resultHeadline(c){
  const my=UP(c.myName), opp=UP(c.oppName), sc=c.scorer?UP(surname(c.scorer)):null;
  const T=[];
  if(c.derby&&c.res==='W')T.push(c.city?UP(c.city)+' IS OURS':'BRAGGING RIGHTS, AND THEY KNOW IT',
    my+' TAKE THE DERBY — AND THE PARADE ROUTE');
  if(c.derby&&c.res==='L')T.push('DERBY DAY, AND '+my+' TURNED UP IN SLIPPERS',
    'THEY WILL SING ABOUT THIS ONE FOR A YEAR');
  if(c.derby&&c.res==='D')T.push('NOTHING SETTLED. NOTHING FORGIVEN.');
  if(c.res==='W'&&c.margin>=4)T.push(my+' '+c.gf+', '+opp+' '+c.ga+': TAKEN APART',
    'RUTHLESS. '+opp+' HAD NOWHERE TO HIDE');
  if(c.res==='L'&&c.margin>=4)T.push('HUMILIATED — AND NOT FOR THE FIRST TIME',
    c.gf+'-'+c.ga+'. SOMEBODY HAS TO ANSWER FOR THAT');
  if(c.res==='L'&&c.margin===3)T.push('PICKED OFF. '+my+' NEVER LAID A GLOVE ON THEM');
  if(c.res==='L'&&c.home&&c.margin>=2)T.push('BOOED OFF AT HOME. THAT IS WHERE IT STARTS');
  if(c.upsetWin)T.push('THE NIGHT '+my+' KNOCKED '+opp+' OVER',
    'NOBODY GAVE THEM A PRAYER. NOBODY ASKED THEM');
  if(c.upsetLoss)T.push('EMBARRASSED BY '+opp,'THAT IS A RESULT THAT FOLLOWS YOU AROUND');
  if(c.title&&c.res==='W')T.push(my+' MEAN IT. THEY ACTUALLY MEAN IT','THIS IS A TITLE RACE NOW');
  if(c.title&&c.res!=='W')T.push('THE WHEELS ARE NOT OFF. BUT YOU CAN HEAR THEM');
  if(c.returning)T.push('NO HANDSHAKES AT '+opp,'HE WENT BACK. THEY HAD NOT FORGIVEN HIM');
  if(c.winlessRun>=4&&c.res!=='W')T.push(c.winlessRun+' GAMES. NO WINS. NO EXCUSES.');
  if(c.winlessRun===0&&c.prevWinless>=4)T.push('AT LAST. '+my+' REMEMBER HOW');
  if(!T.length){
    if(c.res==='W')T.push(sc?sc+' DOES IT AGAIN':my+' GET THE JOB DONE',
      'THREE POINTS, NO FUSS, NO THANKS',sc?'ONE MOMENT. '+sc+' FOUND IT':'GROUND OUT, AND THEY WILL TAKE IT',
      my+' WIN UGLY AND WIN ANYWAY','THAT WILL DO. IT WILL NOT WIN ANYTHING ON ITS OWN.');
    else if(c.res==='D')T.push('A POINT. NOBODY LEFT SINGING','SHARED SPOILS, SHARED SHRUGS',
      'HONOURS EVEN AND NOBODY THE WISER','A DRAW THAT SUITS NEITHER OF THEM',
      c.gf===0?'NOTHING IN IT. NOTHING FROM IT.':'TWO POINTS DROPPED. ASK ANY OF THEM.');
    else T.push('BEATEN. AND IT LOOKED LIKELY FROM EARLY',my+' COME UP SHORT AGAIN',
      'ANOTHER ONE GONE. THE QUESTIONS START NOW','NOT ENOUGH. NOWHERE NEAR ENOUGH.',
      c.home?'BEATEN AT HOME. THE WORST KIND.':'NOTHING BROUGHT BACK FROM '+opp);
  }
  return pick(T);
}

/* ---------- press-conference question bank ----------
   Every answer is one of three characters:
   back  — get behind your players
   blame — take it yourself
   dig   — swing at somebody (ref, opposition, pundit, your own board)
------------------------------------------------------- */
function Q(){ return [
{id:'heavy_when', tag:'heavy',
 q:c=>c.gf+'-'+c.ga+'. When did you know it was gone?',
 rec:'blame',
 a:[
  {k:'back', t:'"Nobody hid. I have seen worse from better players."',
   d:'They will hear that on the bus home', f:c=>{c.xi.forEach(id=>mAdj(id,10,'you shielded them after a hiding'));bAdj(-3,'refused to face the defeat');return 'SHIELDED: BOSS REFUSES TO BLAME HIS PLAYERS'}},
  {k:'blame', t:'"I picked it. I set it up. I got it wrong."',
   d:'The board wanted contrition. They got it', f:c=>{c.xi.forEach(id=>mAdj(id,6,'you carried it for them'));bAdj(2,'fronted up after a heavy defeat');punditAdj(6);S().line=punditLine('backed');return '"MY FAULT" — BOSS FALLS ON HIS SWORD'}},
  {k:'dig', t:'"Ask the officials. The second goal was three yards off."',
   d:'The governing body reads the papers too', f:c=>{refCharge();return 'REF ROW: BOSS FACES A CHARGE'}}
 ]},
{id:'heavy_worst', tag:'heavy',
 q:c=>'Is that the worst you have been since you walked in?',
 rec:'blame',
 a:[
  {k:'back', t:'"It is the worst we have been. It is not what we are."',
   d:'Steady. Dull. Safe', f:c=>{c.xi.forEach(id=>mAdj(id,5,'you kept it calm in public'));return null}},
  {k:'blame', t:'"Yes. And I am the one who has to fix it."',
   d:'Honest. They will hold you to it', f:c=>{bAdj(-2,'admitted it was the low point');punditAdj(4);return '"THE WORST WE HAVE BEEN" — BOSS ADMITS IT'}},
  {k:'dig', t:'"Ask the people upstairs what they funded. Then ask me again."',
   d:'That will be read out in the boardroom', f:c=>{bAdj(-9,'blamed the board in public');punditAdj(3);return '"BACK ME OR SACK ME" — BOSS TURNS ON HIS BOARD'}}
 ]},
{id:'derby_song', tag:'derby',
 q:c=>'Their end were singing your name at the end. Not kindly.',
 rec:'dig',
 a:[
  {k:'back', t:'"They pay their money. My players earned better than that."',
   d:'The dressing room likes hearing it', f:c=>{c.xi.forEach(id=>mAdj(id,8,'you stood in front of them at the derby'));return null}},
  {k:'blame', t:'"On that showing they were entitled."',
   d:'Fair. Bleak', f:c=>{c.xi.forEach(id=>mAdj(id,-6,'you agreed with the away end'));bAdj(-2,'conceded the derby without a fight');return null}},
  {k:'dig', t:'"They will sing at anything. It is the only thing they win."',
   d:'This one runs for a week', f:c=>{punditAdj(-2);return 'DERBY BLAST: "IT IS THE ONLY THING THEY WIN"'}}
 ]},
{id:'derby_since', tag:'derby',
 q:c=>'You have not beaten '+c.oppName+' yet. Does that eat at you?',
 rec:'back',
 a:[
  {k:'back', t:'"This group will beat them. Put a date on it if you like."',
   d:'A promise with your name on it', f:c=>{c.xi.forEach(id=>mAdj(id,9,'you promised the derby publicly'));bAdj(-2,'made a promise in public');return 'HE PUT A DATE ON IT: "WE WILL BEAT THEM"'}},
  {k:'blame', t:'"It eats at me every day of the week. That is the job."',
   d:'Nothing given away', f:c=>{punditAdj(2);return null}},
  {k:'dig', t:'"They have spent four times what we have. Congratulations to them."',
   d:'The dig lands. It always does', f:c=>{c.xi.forEach(id=>mAdj(id,5,'you took the heat off them'));punditAdj(-3);return 'MONEY TALK: BOSS TAKES AIM ACROSS THE CITY'}}
 ]},
{id:'winless_crisis', tag:'winless',
 q:c=>c.winlessRun+' without a win. How long before this is a crisis?',
 rec:'blame',
 a:[
  {k:'back', t:'"Come to training. There is nothing wrong with these players."',
   d:'They will be told you said it', f:c=>{c.xi.forEach(id=>mAdj(id,11,'you backed them through a bad run'));bAdj(-3,'played down a bad run');return null}},
  {k:'blame', t:'"It is a crisis when I stop having answers. I have answers."',
   d:'Confident. Now go and win one', f:c=>{bAdj(1,'took the run on the chin');punditAdj(3);return null}},
  {k:'dig', t:'"Crisis. Great word. Sells papers, wins nothing."',
   d:'He will remember that on Sunday', f:c=>{punditAdj(-10);S().line=punditLine('slapped');return 'BOSS TURNS ON THE PRESS: "SELLS PAPERS, WINS NOTHING"'}}
 ]},
{id:'upset_win', tag:'upsetWin',
 q:c=>'Nobody gave you a prayer. Best night of your career?',
 rec:'back',
 a:[
  {k:'back', t:'"Best night of theirs. I stood and watched, mostly."',
   d:'They will love that', f:c=>{c.xi.forEach(id=>mAdj(id,12,'you gave them the credit'));punditAdj(6);return 'HE GAVE THEM THE CREDIT. ALL OF IT.'}},
  {k:'blame', t:'"One night. We are still what the table says we are."',
   d:'Feet on the floor', f:c=>{bAdj(2,'kept the celebrations sane');return null}},
  {k:'dig', t:'"Nobody gave us a prayer because nobody watches us. Their loss."',
   d:'Quotable. Cheap. Enjoyable', f:c=>{punditAdj(-4);return '"NOBODY WATCHES US" — AND NOW EVERYBODY IS'}}
 ]},
{id:'upset_loss', tag:'upsetLoss',
 q:c=>'You were the better side on paper by a distance. Explain that.',
 rec:'blame',
 a:[
  {k:'back', t:'"Paper does not play. They wanted it more and that is on me."',
   d:'Half a shield, half an admission', f:c=>{c.xi.forEach(id=>mAdj(id,4,'you softened it'));bAdj(-2,'excused a bad defeat');return null}},
  {k:'blame', t:'"I sent them out flat. Simple as that."',
   d:'They hear it as honesty. For now', f:c=>{bAdj(-4,'admitted sending them out flat');punditAdj(4);return null}},
  {k:'dig', t:'"Some of them fancied a day off. They will not get another."',
   d:'This one goes through the dressing-room wall', f:c=>{c.xi.forEach(id=>mAdj(id,-14,'you called them out in public'));c.xi.forEach(shock);punditAdj(2);return '"THEY FANCIED A DAY OFF" — MANAGER BLASTS OWN PLAYERS'}}
 ]},
{id:'title_weight', tag:'title',
 q:c=>'Keep this up and it is yours to lose. Do you feel the weight?',
 rec:'back',
 a:[
  {k:'back', t:'"They carry it better than I do. Look at the table."',
   d:'Warm, and true', f:c=>{c.xi.forEach(id=>mAdj(id,8,'you said they carry it well'));punditAdj(4);return 'TOP OF THE PILE AND ENJOYING IT'}},
  {k:'blame', t:'"If it goes, it goes on me. Nobody else in this room."',
   d:'They will hold that receipt', f:c=>{bAdj(-3,'staked the title on himself');punditAdj(5);return 'HE STAKED HIS JOB ON THE TITLE'}},
  {k:'dig', t:'"Weight? Ask the clubs who were meant to be here instead of us."',
   d:'Half the division just got a fixture circled', f:c=>{punditAdj(-3);return 'SHOTS FIRED FROM THE TOP OF THE TABLE'}}
 ]},
{id:'return_club', tag:'returning',
 q:c=>'Back at '+c.oppName+'. Any part of you that did not want to win?',
 rec:'blame',
 a:[
  {k:'back', t:'"Not one part. My players deserved better than sentiment."',
   d:'Cold. They will like cold', f:c=>{c.xi.forEach(id=>mAdj(id,7,'you put them before your old club'));return null}},
  {k:'blame', t:'"They were good to me here. Today I wanted them beaten."',
   d:'Straight down the middle', f:c=>{punditAdj(3);return 'NO SENTIMENT ON HIS RETURN'}},
  {k:'dig', t:'"They know why I left. So do the people who made me."',
   d:'Old wounds, opened live on air', f:c=>{punditAdj(-4);return 'OLD WOUNDS REOPENED: "THEY KNOW WHY I LEFT"'}}
 ]},
{id:'thrash_message', tag:'thrash',
 q:c=>c.gf+' scored. Was that a message to the rest of them?',
 rec:'back',
 a:[
  {k:'back', t:'"It was a message about these players. Nothing else."',
   d:'They will read it in the morning', f:c=>{c.xi.forEach(id=>mAdj(id,9,'you made the win about them'));return null}},
  {k:'blame', t:'"It was one afternoon. Ask me in May."',
   d:'Dull on purpose', f:c=>{bAdj(1,'kept his feet on the floor');return null}},
  {k:'dig', t:'"If the rest of them need a message, they should watch more football."',
   d:'That will be pinned up somewhere', f:c=>{punditAdj(-3);return '"THEY SHOULD WATCH MORE FOOTBALL"'}}
 ]},
{id:'first_win', tag:'firstWin',
 q:c=>'First win in '+(c.prevWinless+1)+'. Relief, or were you never worried?',
 rec:'back',
 a:[
  {k:'back', t:'"Relief for them. They have taken more stick than they earned."',
   d:'They will hear it and stand taller', f:c=>{c.xi.forEach(id=>mAdj(id,10,'you took the stick off them after a win'));return null}},
  {k:'blame', t:'"Worried every day. You would be, doing my job."',
   d:'Honest to a fault', f:c=>{punditAdj(3);bAdj(-1,'admitted he had been worried');return null}},
  {k:'dig', t:'"Never worried. Some of you had us buried in October."',
   d:'He was one of them', f:c=>{punditAdj(-8);S().line=punditLine('slapped');return 'BURIED IN OCTOBER, WINNING IN MARCH'}}
 ]},
{id:'red_card', tag:'red',
 q:c=>'You finished with ten. Was the sending-off a sending-off?',
 rec:'blame',
 a:[
  {k:'back', t:'"He is not that sort of player and everybody in the ground knows it."',
   d:'The lad will hear about that', f:c=>{c.xi.forEach(id=>mAdj(id,7,'you defended the man who was sent off'));return null}},
  {k:'blame', t:'"It was a red. He knows it, I know it, we move on."',
   d:'No argument, no charge', f:c=>{punditAdj(3);bAdj(1,'took the red card sensibly');return null}},
  {k:'dig', t:'"He has given three of those against us this season. Three."',
   d:'That is a charge waiting to be typed', f:c=>{refCharge();return 'REF ROW: "THREE OF THOSE AGAINST US"'}}
 ]},
{id:'hat_trick', tag:'hat',
 q:c=>'Three for '+surname(c.hat)+'. How far can he go?',
 rec:'back',
 a:[
  {k:'back', t:'"As far as he wants. Nobody at this club will hold him back."',
   d:'Every scout in the country just read that', f:c=>{c.xi.forEach(id=>mAdj(id,4,'you talked the team up'));punditAdj(4);return UP(surname(c.hat))+' HITS THREE — AND THE BOSS SAYS THE SKY'}},
  {k:'blame', t:'"He got three because ten others put it on a plate."',
   d:'Spread thin, felt wide', f:c=>{c.xi.forEach(id=>mAdj(id,8,'you shared the credit for the hat-trick'));return null}},
  {k:'dig', t:'"Further than this board will ever let him."',
   d:'That will be on the desk within the hour', f:c=>{bAdj(-9,'told the world the club is too small');punditAdj(5);return '"FURTHER THAN THIS BOARD WILL LET HIM"'}}
 ]},
{id:'late_winner', tag:'late',
 q:c=>'Won it in the last minute. Character, or a let-off?',
 rec:'back',
 a:[
  {k:'back', t:'"Character. They have had it all along, you just started watching."',
   d:'The room will enjoy that one', f:c=>{c.xi.forEach(id=>mAdj(id,10,'you called them a team of character'));punditAdj(-2);return 'LAST-MINUTE WINNER, AND A DIG ON THE WAY OUT'}},
  {k:'blame', t:'"A let-off. We should not have needed the ninety-third minute."',
   d:'Nobody left the room smiling', f:c=>{c.xi.forEach(id=>mAdj(id,-4,'you called a win a let-off'));bAdj(1,'refused to get carried away');return null}},
  {k:'dig', t:'"Ask them why it took ninety minutes. I have."',
   d:'Now they know the row was real', f:c=>{c.xi.forEach(id=>mAdj(id,-9,'you aired the dressing-room row'));c.xi.forEach(shock);return null}}
 ]},
/* --- follow-ups, fit any conference --- */
{id:'player_struggle', tag:'*', needs:'struggler',
 q:c=>c.strugglerName+' has had a rough few weeks. Is he still your man?',
 rec:'back',
 a:[
  {k:'back', t:'"He is my man. Anyone who says different can come and tell me."',
   d:'He will run through a wall for that', f:c=>{mAdj(c.strugglerId,26,'you backed him in front of the cameras');punditAdj(2);return UP(surname(c.strugglerName))+' GETS THE ARM ROUND HIM'}},
  {k:'blame', t:'"I have played him in the wrong shape. That is mine."',
   d:'You took his bullet', f:c=>{mAdj(c.strugglerId,14,'you took the blame for his form');bAdj(-3,'took the blame for a struggling player');return null}},
  {k:'dig', t:'"He knows he has been nowhere near it. Everybody in there knows."',
   d:'Brutal. It might even work', f:c=>{mAdj(c.strugglerId,-30,'you named him in public');c.xi.forEach(id=>{if(id!==c.strugglerId)mAdj(id,-5,'you named a team-mate in public')});shock(c.strugglerId);return UP(surname(c.strugglerName))+' HUNG OUT TO DRY'}}
 ]},
{id:'pundit_said', tag:'*', needs:'pundit',
 q:c=>c.punditName+' said, and I quote, "'+c.punditQuote+'"',
 rec:'blame',
 a:[
  {k:'back', t:'"He has never been in my dressing room. I have."',
   d:'Firm without the fireworks', f:c=>{punditAdj(-3);c.xi.forEach(id=>mAdj(id,5,'you defended the room'));return null}},
  {k:'blame', t:'"On the evidence, he is not wrong."',
   d:'He will quote you saying it. Forever', f:c=>{punditAdj(9);S().line=punditLine('backed');bAdj(-2,'agreed with his own critics');return null}},
  {k:'dig', t:'"He was a coward as a player and he is a coward with a microphone."',
   d:'You have made an enemy for the season', f:c=>{punditAdj(-22);S().line=punditLine('slapped');bAdj(-3,'started a public feud');return 'WAR OF WORDS: BOSS CALLS PUNDIT A COWARD'}}
 ]},
{id:'board_backing', tag:'*',
 q:c=>'Do you have everything you need from the people above you?',
 rec:'back',
 a:[
  {k:'back', t:'"I have what I have. I knew the job when I took it."',
   d:'Loyal. They notice', f:c=>{bAdj(4,'protected the board in public');return null}},
  {k:'blame', t:'"Plenty. I have not spent it well enough yet."',
   d:'You just wrote their statement for them', f:c=>{bAdj(3,'took responsibility for the spending');punditAdj(2);return null}},
  {k:'dig', t:'"Ask them. They are very good at answering questions in private."',
   d:'Satisfying. It will cost you', f:c=>{bAdj(-11,'took a public swing at the board');punditAdj(4);return 'OPEN WARFARE: "ASK THEM. THEY ANSWER IN PRIVATE."'}}
 ]},
{id:'crowd_mood', tag:'*',
 q:c=>'Some of your own were leaving early again. Does that get to you?',
 rec:'back',
 a:[
  {k:'back', t:'"They have earned the right to leave when they want. We have not earned them staying."',
   d:'Humble. It plays well', f:c=>{bAdj(2,'took the supporters\' side');punditAdj(3);return null}},
  {k:'blame', t:'"It gets to me. It should get to everybody in that dressing room."',
   d:'A shot across the bow', f:c=>{c.xi.forEach(id=>mAdj(id,-6,'you pointed at the empty seats'));c.xi.forEach(shock);return null}},
  {k:'dig', t:'"They paid what this club charges them. Ask upstairs about that."',
   d:'Ticket prices. In public. Brave', f:c=>{bAdj(-7,'raised ticket prices in a press conference');punditAdj(4);return 'BOSS RAISES TICKET PRICES — IN PUBLIC'}}
 ]},
{id:'next_one', tag:'*',
 q:c=>'What does this squad need before the next one?',
 rec:'back',
 a:[
  {k:'back', t:'"Nothing they have not already got. They need telling, not fixing."',
   d:'Confidence, spread thin', f:c=>{c.xi.forEach(id=>mAdj(id,6,'you told the press they need no fixing'));return null}},
  {k:'blame', t:'"A better week of coaching. That is my department."',
   d:'Nobody else takes a scratch', f:c=>{punditAdj(3);return null}},
  {k:'dig', t:'"Two players and a chairman who returns a phone call."',
   d:'The room upstairs went very quiet', f:c=>{bAdj(-8,'asked for a chairman who answers the phone');punditAdj(5);return '"TWO PLAYERS AND A CHAIRMAN WHO ANSWERS"'}}
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
  if(c.bal>fine*4){ c.bal-=fine; note('Charged','A misconduct charge and a '+money(fine)+' fine. Worth it, probably.'); }
  else note('Charged','A misconduct charge. They have let you off the fine. This time.');
  bAdj(-3,'dragged the club in front of a disciplinary panel');
}

/* ---------- deciding whether there is anything worth asking ---------- */
function buildContext(m){
  const st=ensure();
  const c=me(), s=m.mine, o=1-s, R=m.R;
  const opp=G.clubs[m.hi===G.me?m.ai:m.hi];
  const gf=R.g[s], ga=R.g[o];
  const res=gf>ga?'W':gf===ga?'D':'L';
  const prevWinless=st.prevWinless||0;
  const city=derbyWith(opp), rival=nearestRival();
  const near=!city&&rival&&rival.id===opp.id&&Math.abs(opp.rep-c.rep)<=6;
  const gap=c.rep-opp.rep;
  const scorers=R.ev.filter(e=>e.t==='goal'&&e.s===s);
  const tally={}; let hat=null;
  scorers.forEach(e=>{tally[e.wid]=(tally[e.wid]||0)+1; if(tally[e.wid]>=3)hat=e.who});
  const table=leagueOf(c.id)?leagueTable(leagueOf(c.id)):null;
  const myPosNow=table?table.findIndex(x=>x.id===c.id)+1:9;
  const oppPos=table?table.findIndex(x=>x.id===opp.id)+1:9;

  const ctx={
    myName:c.name, oppName:opp.name, oppId:opp.id, home:m.hi===G.me,
    gf:gf, ga:ga, margin:Math.abs(gf-ga), res:res, comp:m.f.comp.name,
    city:city, derby:!!city||near, returning:st.clubs.indexOf(opp.id)>=0&&opp.id!==c.id,
    upsetWin:res==='W'&&gap<=-13, upsetLoss:res==='L'&&gap>=13,
    title:m.f.comp.key==='league'&&G.week>=22&&myPosNow<=3&&oppPos<=4,
    thrash:res==='W'&&Math.abs(gf-ga)>=4,
    heavy:(res==='L'&&Math.abs(gf-ga)>=3)||(res==='L'&&m.hi===G.me&&Math.abs(gf-ga)>=2),
    winlessRun:0, prevWinless:prevWinless,
    red:!!(R.drv&&R.drv.red&&R.drv.red[s]), hat:hat,
    late:res==='W'&&scorers.length?scorers[scorers.length-1].m>=86:false,
    scorer:scorers.length?scorers[scorers.length-1].who:null,
    xi:c.xi.map(x=>x.p.id),
    week:G.week, season:G.season
  };
  ctx.winlessRun=bumpWinless(res);
  ctx.winless=ctx.res!=='W'&&ctx.winlessRun>=3;
  ctx.firstWin=ctx.res==='W'&&prevWinless>=3;

  // head to head under you
  if(!st.vs[opp.id])st.vs[opp.id]={w:0,d:0,l:0};
  st.vs[opp.id][res==='W'?'w':res==='D'?'d':'l']++;
  ctx.neverBeaten=st.vs[opp.id].w===0;
  st.prevWinless=ctx.winlessRun;
  return ctx;
}
/* how badly does a reporter want this one? 0 = leave it alone */
function weigh(c){
  let w=0,tags=[];
  if(c.derby){w=Math.max(w,3);tags.push('derby')}
  if(c.heavy){w=Math.max(w,c.margin>=4?3:2);tags.push('heavy')}
  if(c.returning){w=Math.max(w,3);tags.push('returning')}
  if(c.upsetLoss){w=Math.max(w,3);tags.push('upsetLoss')}
  if(c.upsetWin){w=Math.max(w,2);tags.push('upsetWin')}
  if(c.winless){w=Math.max(w,2);tags.push('winless')}
  if(c.title){w=Math.max(w,2);tags.push('title')}
  if(c.thrash){w=Math.max(w,2);tags.push('thrash')}
  if(c.firstWin){w=Math.max(w,2);tags.push('firstWin')}
  if(c.red){w=Math.max(w,2);tags.push('red')}
  if(c.hat){w=Math.max(w,2);tags.push('hat')}
  if(c.late){w=Math.max(w,2);tags.push('late')}
  c.tags=tags;
  return w;
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

  if(c.derby&&c.res==='W')mile('Beat '+c.oppName+' in the derby, '+c.gf+'-'+c.ga+'.');
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
  st.recentQ=(st.lastQ.concat(st.recentQ||[])).slice(0,8);
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
    <div style="font-size:12.5px;color:var(--t2);line-height:17px;${h?'border-top:1px solid var(--hair);margin-top:10px;padding-top:9px':''}">
      &ldquo;${esc(st.line)}&rdquo;<br>
      <span style="color:var(--t3)">${esc(st.pundit.name)} &middot; ${esc(st.pundit.role)}</span></div>
   </div>`];
},

onSeasonEndAfter(info){
  const st=ensure();
  const c=me(), pos=info&&info.pos?info.pos:myPos();
  const hit=info&&info.hit;
  const t = pos===1 ? UP(c.name)+' ARE CHAMPIONS. GET IT ON A WALL.'
    : hit ? 'JOB DONE — AND THEY WANT MORE NEXT YEAR'
    : pos>=18 ? 'DOWN. AND IT WAS COMING FROM CHRISTMAS'
    : 'FINISHED '+UP(ord(pos))+'. NOBODY REMEMBERS FIFTH.';
  setHead(t, pos===1||pos>=18, true);
  if(pos===1)punditAdj(35); else if(!hit)punditAdj(-18); else punditAdj(8);
  st.view=Math.round(st.view*0.72);            // a new season, a shorter memory
  st.line = pos===1 ? pick([
      'I doubted him in August. I will be reminded of it until I die.',
      'Champions. Whatever you think of him, he got there first.'])
    : pick([
      'Pre-season, and everyone is unbeaten. Ask me in October.',
      'New season. Same squad, same questions, same manager. We will see.',
      'He has bought himself a summer. Nothing more than that.']);
  st.pressedLast=false; st.sincePress=99; st.vs={}; st.noWin=0; st.prevWinless=0;
  if(pos===1)mile('Champions. '+c.name+', '+(G.season-1)+'/'+String(G.season).slice(2)+'.');
},

/* ---------- published interface ---------- */
headline(){ const st=ensure(); return st.head?st.head.t:null },
pundit(){ const st=ensure(); return st.pundit?{name:st.pundit.name, line:st.line}:null }
});

/* ---------- picking the questions ---------- */
function chooseQuestions(c,w){
  const st=S(), bank=Q(), out=[], used={};
  const blocked={}; (st.lastQ||[]).forEach(id=>blocked[id]=1);
  const want=w>=3?3:2;

  // the struggler: worst of your starters, or the unhappiest
  let str=null,worst=99;
  me().xi.forEach(({p})=>{
    const r=p.ratings.length?p.ratings[p.ratings.length-1]:6.5;
    const score=r-(p.morale<25?1.2:0);
    if(score<worst){worst=score;str=p}
  });
  if(str){c.strugglerId=str.id;c.strugglerName=str.name}
  c.punditName=st.pundit.name; c.punditQuote=st.line;

  const recent={}; (st.recentQ||[]).forEach(id=>recent[id]=1);
  const eligible=id=>!blocked[id]&&!used[id];
  const fits=q=>{
    if(!eligible(q.id))return false;
    if(q.needs==='struggler'&&!c.strugglerId)return false;
    if(q.needs==='pundit'&&!c.punditQuote)return false;
    return true;
  };
  // lead with the reason he came
  const fresh=list=>{const f=list.filter(q=>!recent[q.id]);return f.length?f:list};
  const lead=bank.filter(q=>q.tag!=='*'&&c.tags.indexOf(q.tag)>=0&&fits(q));
  if(lead.length){const q=pick(fresh(lead));out.push(q);used[q.id]=1}
  // then whatever else is on his pad
  while(out.length<want){
    const pool=bank.filter(q=>fits(q)&&(q.tag==='*'||c.tags.indexOf(q.tag)>=0));
    if(!pool.length)break;
    const q=pick(fresh(pool)); out.push(q); used[q.id]=1;
  }
  return out.slice(0,3);
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
  sheet(`<h3>The press room</h3>
   <div class="sh-sub">${esc(c.myName)} ${c.gf}&ndash;${c.ga} ${esc(c.oppName)} &middot; ${esc(c.comp)}
     &middot; question ${L.i+1} of ${n}</div>
   <div class="card" style="background:var(--s1);padding:13px 14px;margin-bottom:12px">
     <div style="font-size:15px;font-weight:600;line-height:21px">&ldquo;${esc(q.q(c))}&rdquo;</div>
   </div>
   <div class="row" style="gap:8px;margin:0 2px 12px;align-items:flex-start">
     <span style="color:var(--acc);font-size:12px;margin-top:1px">&#9670;</span>
     <div style="font-size:12px;color:var(--t2);line-height:16px"><b>Assistant</b> &mdash; ${esc(hint)}</div>
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
    L.heads.push('NOT A WORD: BOSS WALKS OUT ON THE PRESS');
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
     <div class="card" style="background:var(--s1);margin-top:10px">
       <div class="kv"><span class="k2">${esc(st.pundit.name)}</span>
         <span class="v2">${st.view>=45?'On your side':st.view>=15?'Coming round':st.view<=-45?'Wants you gone':st.view<=-15?'Not convinced':'Undecided'}</span></div>
       <div style="font-size:12.5px;color:var(--t2);line-height:17px;padding-top:9px;border-top:1px solid var(--hair)">
         &ldquo;${esc(st.line)}&rdquo;</div></div>
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
     <div style="font-size:12.5px;color:var(--t2);line-height:17px;border-top:1px solid var(--hair);
       margin-top:11px;padding-top:9px">&ldquo;${esc(st.line)}&rdquo;<br>
       <span style="color:var(--t3)">${esc(st.pundit.name)} &middot; ${esc(st.pundit.role)}</span></div>
   </div>
   <button class="btn" style="margin-top:14px" onclick="closeSheet();render()">Done</button>`);
}

})();
