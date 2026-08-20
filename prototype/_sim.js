/* Headless economics harness — TEMPORARY, not part of the build. */
window.__SIM={state:'idle',rows:[],log:[]};

function simMedian(a){if(!a.length)return 0;const b=a.slice().sort((x,y)=>x-y);const m=b.length>>1;
  return b.length%2?b[m]:Math.round((b[m-1]+b[m])/2)}

function simSnapshot(tag,seasonIdx){
  const c=me();
  const vals=[],wgs=[],sq=[],ratios=[];
  G.clubs.forEach(k=>{sq.push(squadOf(k).length);ratios.push(costRatio(k));
    k.squad.forEach(p=>{vals.push(value(p));wgs.push(p.wage)})});
  return {tag,season:seasonIdx,tier:c.tier,rep:c.rep,
    ratio:costRatio(c),rev:Math.round(revenue(c)/1e5)/10,wage:Math.round(wageBill(c)*52/1e5)/10,
    mySquad:squadOf(c).length,
    over85:ratios.filter(r=>r>85).length,
    medVal:simMedian(vals),medWage:simMedian(wgs),medSquad:simMedian(sq),
    medRatioT0:simMedian(G.clubs.filter(k=>k.tier===0).map(costRatio)),
    medRatioT1:simMedian(G.clubs.filter(k=>k.tier===1).map(costRatio)),
    medRatioT2:simMedian(G.clubs.filter(k=>k.tier===2).map(costRatio))};
}

/* Plays the human club's league fixture the way simOthers plays everyone else's,
   then hands the week to the normal engine. No transfers, no offers accepted —
   the pure control run. */
function simPlayWeek(){
  const f=myLeagueFixture(G.week);
  if(f){const h=G.clubs[f.home],a=G.clubs[f.away];
    autoXI(h);autoXI(a);
    const r=simulate(h,a);
    applyLeague(f.home,f.away,r);creditStats(r,f.home,f.away);
    rollInjuries(h);rollInjuries(a);}
  advanceWeek();
}

function simRun(seasons,clubName){
  window.__SIM={state:'running',rows:[],log:[]};
  const _save=window.save; window.save=()=>true;          // no localStorage churn
  RND=mulberry32(20260820); buildWorld();
  let target=G.clubs.find(c=>c.name===clubName);
  if(!target)target=G.clubs.filter(c=>c.nat==='eng'&&c.tier===0).sort((a,b)=>a.rep-b.rep)[0];
  const tid=target.id, tname=target.name;
  newGame(tid);
  window.__SIM.club=tname;
  let s=0;
  function step(){
    try{
      window.__SIM.rows.push(simSnapshot('start',s));
      let guard=0;
      while(!G.seasonEnded&&guard++<60)simPlayWeek();
      window.__SIM.rows.push(simSnapshot('end',s));
      endSeasonProcess();
      s++;
      window.__SIM.progress=s+'/'+seasons;
      if(s<seasons){setTimeout(step,0);return}
      window.save=_save;
      window.__SIM.state='done';
    }catch(e){window.save=_save;window.__SIM.state='error';window.__SIM.err=e.message+'\n'+e.stack}
  }
  setTimeout(step,0);
  return 'started';
}
