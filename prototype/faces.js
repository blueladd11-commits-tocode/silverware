/* ============================================================
   FACE GENERATOR — layered vector identikit portraits
   Deterministic from player id. No AI art, no photos, no likeness risk.
   ~14 layers; every part hand-authored geometry.
   ============================================================ */
const SKIN=[
 ['#F5D5BC','#E0B295','#C98F6E'], ['#EFC6A5','#D9A47F','#BE8058'],
 ['#E0AE86','#C68C63','#A66D45'], ['#C98A5E','#AC6E45','#8A5432'],
 ['#A66A42','#8A5130','#6D3D22'], ['#7E4A2A','#653919','#4C2A11'],
 ['#5C3520','#472613','#33190B'], ['#FAE0CB','#E8BFA4','#D19E7E']
];
const HAIRC={black:'#1B1714',dark:'#33251C',brown:'#5A3A22',light:'#8A5C32',
  blonde:'#C9A05A',ginger:'#B45B26',grey:'#9BA0A6',white:'#D6DADF',bleach:'#E8DCA8'};
/* nationality → [skin index weights, hair colour weights] */
const ETHNIC={
 eng:[[3,3,2,2,1,1,1,3],['black',2,'dark',4,'brown',5,'light',3,'blonde',2,'ginger',1]],
 esp:[[1,3,4,3,1,1,0,2],['black',4,'dark',6,'brown',3,'light',1,'blonde',0,'ginger',0]],
 ita:[[1,3,4,3,1,0,0,2],['black',5,'dark',6,'brown',2,'light',1,'blonde',0,'ginger',0]],
 ger:[[4,3,2,1,1,1,0,4],['black',2,'dark',3,'brown',4,'light',4,'blonde',4,'ginger',1]],
 fra:[[2,3,3,2,2,2,2,2],['black',4,'dark',4,'brown',3,'light',2,'blonde',1,'ginger',0]],
 bra:[[1,2,3,3,3,2,2,1],['black',6,'dark',4,'brown',2,'light',1,'blonde',1,'ginger',0]],
 afr:[[0,0,0,1,2,4,5,0],['black',9,'dark',2,'brown',0,'light',0,'blonde',0,'ginger',0]],
 sca:[[5,3,1,0,0,0,0,5],['black',1,'dark',2,'brown',3,'light',4,'blonde',6,'ginger',2]]
};
function wpick(r,pairs){let t=0;for(let i=1;i<pairs.length;i+=2)t+=pairs[i];
  let x=r()*t;for(let i=1;i<pairs.length;i+=2){x-=pairs[i];if(x<=0)return pairs[i-1]}return pairs[0]}
function widx(r,w){let t=w.reduce((a,b)=>a+b,0),x=r()*t;
  for(let i=0;i<w.length;i++){x-=w[i];if(x<=0)return i}return 0}

function faceSVG(seed,opts){
  opts=opts||{};
  const size=opts.size||64, nat=ETHNIC[opts.nat]||ETHNIC.eng;
  const r=mulberry32((seed*2654435761)>>>0 ^ 0x9E3779B9);
  const sk=SKIN[widx(r,nat[0])], hc=HAIRC[wpick(r,nat[1])];
  const [skin,shade,dark]=sk;
  const headShape=Math.floor(r()*3);      // 0 oval 1 square 2 round
  const age=opts.age||24;
  // hair thins with age: baldness/receding weighted up after 30, never for teens
  const balder=clamp((age-26)/14,0,1);
  const hw=[0.5+7*balder, 5, 7, 6, 6, 3, 1.5+6*balder, 4, 3, 2.5, 3, 5, 4, 3];
  const hair=widx(r,hw);
  const brow=Math.floor(r()*3);
  const eyeT=Math.floor(r()*3);
  const nose=Math.floor(r()*3);
  const mouth=Math.floor(r()*3);
  const beard=r()<0.42?Math.floor(r()*5):0;
  const ey=r()<0.5?'#4A3428':(r()<0.5?'#3A5A6E':'#4A6B44');
  const kitA=opts.kitA||'#2A3038', kitB=opts.kitB||'#1A1F26';
  const bg=opts.bg||'#1A1F26';

  const HEAD=[
   'M50 16 C68 16 76 30 76 46 C76 66 64 80 50 80 C36 80 24 66 24 46 C24 30 32 16 50 16 Z',
   'M50 16 C69 16 77 28 77 44 L77 58 C77 72 65 80 50 80 C35 80 23 72 23 58 L23 44 C23 28 31 16 50 16 Z',
   'M50 15 C69 15 78 31 78 48 C78 67 65 81 50 81 C35 81 22 67 22 48 C22 31 31 15 50 15 Z'
  ][headShape];

  /* hair styles: [back layer, front layer] */
  const HAIR=[
   ['',''],                                                                     // 0 bald
   ['','M24 44 C24 25 34 13 50 13 C66 13 76 25 76 44 C76 34 67 28 50 28 C33 28 24 34 24 44 Z'], // 1 buzz
   ['','M23 47 C23 23 34 11 50 11 C66 11 77 23 77 47 C75 35 70 26 61 30 C53 34 40 25 32 30 C26 34 24 39 23 47 Z'], // 2 short side-part
   ['M18 54 C18 22 32 9 50 9 C68 9 82 22 82 54 L75 54 C75 30 66 21 50 21 C34 21 25 30 25 54 Z',
    'M23 49 C23 22 34 10 50 10 C66 10 77 22 77 49 C73 34 65 27 50 27 C35 27 27 34 23 49 Z'],   // 3 thick volume
   ['','M22 45 C22 21 34 10 50 10 C66 10 78 20 78 43 C73 39 71 23 57 26 C47 28 39 21 33 27 C28 32 25 38 22 45 Z'], // 4 quiff
   ['M19 48 C19 19 34 8 50 8 C66 8 81 19 81 48 C81 60 79 67 77 71 L69 62 C74 40 67 23 50 23 C33 23 26 40 31 62 L23 71 C21 67 19 60 19 48 Z',''], // 5 long
   ['','M27 41 C29 22 37 13 50 13 C63 13 71 22 73 41 C69 35 65 31 59 33 C54 35 46 35 41 33 C35 31 31 35 27 41 Z'], // 6 receding
   ['','M50 6 C72 6 82 24 79 46 C77 35 75 32 71 34 C67 23 59 18 50 18 C41 18 33 23 29 34 C25 32 23 35 21 46 C18 24 28 6 50 6 Z'], // 7 afro
   ['','M26 44 C26 23 36 12 50 12 C64 12 74 23 74 44 C71 39 68 36 63 37 C60 32 55 34 51 31 C47 35 41 33 37 36 C32 34 28 38 26 44 Z'], // 8 textured crop
   ['M37 15 C37 6 63 6 63 15 C70 17 70 28 63 28 L37 28 C30 28 30 17 37 15 Z',
    'M24 45 C24 24 34 12 50 12 C66 12 76 24 76 45 C74 35 66 29 50 29 C34 29 26 35 24 45 Z'],   // 9 man bun
   ['','M22 44 L22 26 C22 18 30 12 50 12 C70 12 78 18 78 26 L78 44 C74 36 68 31 50 31 C32 31 26 36 22 44 Z'], // 10 flat top
   ['','M50 9 C67 9 78 21 77 40 C74 34 74 28 68 30 C64 24 58 26 54 22 C50 27 42 24 38 29 C33 26 28 30 27 36 C24 30 24 9 50 9 Z M27 36 C24 40 23 44 23 46 M77 40 C79 43 79 45 78 47'], // 11 curly
   ['M22 50 C22 20 34 9 50 9 C66 9 78 20 78 50 L74 66 L70 50 L66 66 L62 48 L58 66 L54 48 L50 66 L46 48 L42 66 L38 48 L34 66 L30 50 L26 66 Z',''], // 12 dreads
   ['','M23 46 C23 22 35 11 50 11 C65 11 77 22 77 46 C75 38 72 30 64 28 C58 26.5 52 30 46 28 C38 25 30 32 23 46 Z']  // 13 flop / fringe
  ][hair];

  const BROWS=[
   [`<path d="M33 44 Q40 40 46 43" stroke="${hc}" stroke-width="3.2" fill="none" stroke-linecap="round"/>`,
    `<path d="M54 43 Q60 40 67 44" stroke="${hc}" stroke-width="3.2" fill="none" stroke-linecap="round"/>`],
   [`<rect x="33" y="42" width="13" height="3.4" rx="1.7" fill="${hc}"/>`,
    `<rect x="54" y="42" width="13" height="3.4" rx="1.7" fill="${hc}"/>`],
   [`<path d="M33 45 Q39 41 46 44" stroke="${hc}" stroke-width="4" fill="none" stroke-linecap="round"/>`,
    `<path d="M54 44 Q61 41 67 45" stroke="${hc}" stroke-width="4" fill="none" stroke-linecap="round"/>`]
  ][brow];
  const BROW_L=BROWS[0], BROW_R=BROWS[1];

  const EYE=[
   `<ellipse cx="39.5" cy="52" rx="5.2" ry="3.6" fill="#FFF"/><circle cx="39.5" cy="52" r="2.5" fill="${ey}"/><circle cx="39.5" cy="52" r="1.1" fill="#140F0C"/>
    <ellipse cx="60.5" cy="52" rx="5.2" ry="3.6" fill="#FFF"/><circle cx="60.5" cy="52" r="2.5" fill="${ey}"/><circle cx="60.5" cy="52" r="1.1" fill="#140F0C"/>`,
   `<path d="M34 52 Q39.5 47.6 45 52 Q39.5 55.6 34 52 Z" fill="#FFF"/><circle cx="39.5" cy="52" r="2.3" fill="${ey}"/><circle cx="39.5" cy="52" r="1" fill="#140F0C"/>
    <path d="M55 52 Q60.5 47.6 66 52 Q60.5 55.6 55 52 Z" fill="#FFF"/><circle cx="60.5" cy="52" r="2.3" fill="${ey}"/><circle cx="60.5" cy="52" r="1" fill="#140F0C"/>`,
   `<ellipse cx="39.5" cy="52" rx="4.6" ry="4" fill="#FFF"/><circle cx="39.5" cy="52.3" r="2.6" fill="${ey}"/><circle cx="39.5" cy="52.3" r="1.1" fill="#140F0C"/>
    <ellipse cx="60.5" cy="52" rx="4.6" ry="4" fill="#FFF"/><circle cx="60.5" cy="52.3" r="2.6" fill="${ey}"/><circle cx="60.5" cy="52.3" r="1.1" fill="#140F0C"/>`
  ][eyeT];

  const NOSE=[
   `<path d="M50 54 L47 63 Q50 65 53 63 Z" fill="${shade}" opacity=".85"/>`,
   `<path d="M49 55 L46 64 Q50 66.5 54 64 L51 55" fill="${shade}" opacity=".7"/>`,
   `<path d="M50 56 Q45 62 47.5 64.5 Q50 66 52.5 64.5 Q55 62 50 56 Z" fill="${shade}" opacity=".8"/>`
  ][nose];

  /* Morale drives the mouth. A squad where the unhappy players visibly look
     unhappy is a football game; a "Morale: Poor" column is a database.
     The first pass was far too timid to read at 44px — the curve now spans a
     real frown to an open grin, and the eyebrows angle with it. */
  const mor = (opts.morale===undefined||opts.morale===null) ? null : clamp(opts.morale,-100,100);
  const mNorm = mor===null ? 0.25 : mor/100;          // -1 … +1
  const x0=41.5, x1=58.5, my=70.5;
  const bend = mNorm*11;                               // control-point offset, +ve = smile
  let MOUTH;
  if(mNorm>0.45){
    // open grin: filled shape, reads instantly even at 40px
    const d=6+mNorm*4;
    MOUTH=`<path d="M${x0} ${my-1} Q50 ${my+d} ${x1} ${my-1} Q50 ${my+d*0.34} ${x0} ${my-1} Z" fill="${dark}"/>`;
  } else {
    const wt = mNorm<-0.5 ? 3.0 : 2.5;
    MOUTH=`<path d="M${x0} ${my} Q50 ${my+bend} ${x1} ${my}" stroke="${dark}"
       stroke-width="${wt}" fill="none" stroke-linecap="round"/>`;
  }

  const BEARD=['',
   `<path d="${HEAD}" fill="${hc}" opacity=".22" clip-path="url(#lo${seed})"/>`,                       // stubble
   `<path d="M43 66 Q50 63 57 66 Q57 69 50 69 Q43 69 43 66 Z" fill="${hc}"/>`,                          // moustache
   `<path d="M36 62 C36 78 42 84 50 84 C58 84 64 78 64 62 C64 74 58 78 50 78 C42 78 36 74 36 62 Z" fill="${hc}"/>
    <path d="M43 66 Q50 63 57 66 Q57 69 50 69 Q43 69 43 66 Z" fill="${hc}"/>`,                          // goatee+tash
   `<path d="${HEAD}" fill="${hc}" opacity=".55" clip-path="url(#lo${seed})"/>
    <path d="M43 66 Q50 63.5 57 66 Q57 69 50 69 Q43 69 43 66 Z" fill="${hc}"/>`                         // full beard
  ][beard];

  const browRot = -mNorm*9;                 // unhappy: inner ends drive down and together
  const browY   = -mNorm*1.4;
  return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" class="face" aria-hidden="true">
   <defs>
     <clipPath id="fc${seed}"><circle cx="50" cy="50" r="50"/></clipPath>
     <clipPath id="lo${seed}"><rect x="20" y="60" width="60" height="30"/></clipPath>
   </defs>
   <g clip-path="url(#fc${seed})">
    <rect width="100" height="100" fill="${bg}"/>
    <path d="M14 100 C14 86 30 80 50 80 C70 80 86 86 86 100 Z" fill="${kitA}"/>
    <path d="M44 100 L44 81 Q50 84 56 81 L56 100 Z" fill="${kitB}"/>
    <path d="M43 72 L57 72 L57 84 Q50 88 43 84 Z" fill="${shade}"/>
    ${HAIR[0]?`<path d="${HAIR[0]}" fill="${hc}"/>`:''}
    <ellipse cx="22" cy="54" rx="4.4" ry="6" fill="${shade}"/>
    <ellipse cx="78" cy="54" rx="4.4" ry="6" fill="${shade}"/>
    <g transform="translate(50 50) scale(${(0.94+r()*0.13).toFixed(3)} 1) translate(-50 -50)"><path d="${HEAD}" fill="${skin}"/></g>
    ${BEARD}
    <g transform="translate(0 ${browY})">
      <g transform="rotate(${browRot} 39.5 43)">${BROW_L}</g>
      <g transform="rotate(${-browRot} 60.5 43)">${BROW_R}</g></g>
    ${EYE}${NOSE}${MOUTH}
    ${HAIR[1]?`<path d="${HAIR[1]}" fill="${hc}"/>`:''}
   </g></svg>`;
}
