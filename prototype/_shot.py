#!/usr/bin/env python3
"""Render a SILVERWARE screen headless and drop a PNG next to it.

The browser pane hands back stale frames, so every visual check goes through
here instead: build a one-off copy of the page with a boot script appended,
point headless Chrome at it, screenshot at phone width.

  python3 _shot.py <name> <height> '<js that sets up and renders>'
"""
import pathlib, subprocess, sys, os, json, time

HERE = pathlib.Path(__file__).parent
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OUT = HERE / "_shots"
OUT.mkdir(exist_ok=True)

BOOT = """
<script>
/* headless Chrome will not open a window narrower than 500px, so the phone is
   built inside it: 375 CSS px of page, the rest is ground. */
(function(){
  Object.defineProperty(window,'innerWidth',{get:function(){return 375}});
  var st=document.createElement('style');
  st.textContent='html,body{width:375px;overflow-x:hidden}#app{max-width:375px;margin:0}';
  document.addEventListener('DOMContentLoaded',function(){document.head.appendChild(st)});
})();
window.__clean = function(){
  document.querySelectorAll('.take,.sheetwrap').forEach(function(e){e.remove()});
  document.body.classList.remove('locked'); document.body.style.top='';
  window.scrollTo(0,0);
};
window.addEventListener('load', function(){
  try{
    localStorage.clear();
    newGame(G.leagues[0].clubs[9]);
    G.objective.accepted = true; G.speed = 'instant';
    for (var i=0;i<14;i++){ if (weekFixtures().length) startMatch(); else advanceWeek(); }
    closeSheet(); __clean();
    G.shortlist = [];
    try{ var pool = mktSort(mktFilter(scoutPool()));
         for (var j=0;j<6;j++) if (pool[j]) G.shortlist.push(pool[j].p.id); }catch(e){}
  }catch(e){ document.body.innerHTML = '<pre style="color:#f66;font:12px monospace;padding:12px;white-space:pre-wrap">'
      + e + '\\n' + e.stack + '</pre>'; document.title='ERR'; return; }
  /* whatever the onboarding module reopens on a timer, it reopens before this */
  setTimeout(function(){
    try{ __clean(); __SCENE__ document.title = 'READY'; }
    catch(e){ document.body.innerHTML = '<pre style="color:#f66;font:12px monospace;padding:12px;white-space:pre-wrap">'
      + e + '\\n' + e.stack + '</pre>'; document.title='ERR'; }
  }, 900);
});
</script>
"""

def main():
    name   = sys.argv[1]
    height = int(sys.argv[2])
    scene  = sys.argv[3]
    src = (HERE / "silverware.html").read_text()
    # the onboarding module reopens its own sheet on a timer and would sit on top
    # of every shot; it is not what is being looked at.
    a = src.find("/* ==== module: 95-onboarding.js ==== */")
    if a > 0:
        b = src.find("</script>", a)
        src = src[: src.rfind("<script>", 0, a)] + src[b + 9 :]
    page = src + BOOT.replace("__SCENE__", scene)
    tmp = HERE / ("_shot_%s.html" % name)
    tmp.write_text(page)
    png = OUT / ("%s.png" % name)
    if png.exists():
        png.unlink()
    cmd = [CHROME, "--headless=old", "--disable-gpu", "--no-sandbox",
           "--hide-scrollbars", "--force-device-scale-factor=2",
           "--window-size=500,%d" % (height+90),
           "--virtual-time-budget=12000",
           "--screenshot=%s" % png, tmp.as_uri()]
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=180)
    tmp.unlink(missing_ok=True)
    if not png.exists():
        print("FAILED\n", r.stderr[-2500:])
        sys.exit(1)
    print(png, png.stat().st_size, "bytes")

main()
