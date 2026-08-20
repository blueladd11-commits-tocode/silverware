# 13 — Football Visual Identity

**Brief:** the owner's verdict on the current build is *"the UI doesn't look like a football game at all. Looks like operations at NASA."* He is right. This document works out what specifically makes a screen read as **football**, and specifies how we render it with no photographs, no real crests, no image files — pure inline SVG and CSS.

**Scope.** This document owns *football-ness*. It does not cover general mobile monetisation UI, and it does not own the performance budget; where the two intersect, this document states the football requirement and the cheapest way to meet it. It builds on [`05-art-direction.md`](05-art-direction.md) (tokens, type, crest generator, motion) and does not restate it.

**Everything below is working, tested code.** Every SVG and CSS block in this document was built, rendered at 375px in a real browser, and visually checked before being written down. Where a first attempt failed the legibility test, the failure and the fix are recorded.

---

## 1. Why it reads as NASA

The diagnosis is mechanical, not aesthetic. Count the *football signifiers* currently on screen across the whole app:

| Screen | Football signifiers present |
|---|---|
| Home | none — a fixture card, a CTA, an advice box |
| Squad → Lineup | none — eleven `<div class="plr">` rows, identical to the bench rows below them |
| Squad → Tactics | the string `"4-2-3-1"` on a button |
| Table | none |
| Match | a momentum bar and a text feed |
| Player | a face, in a collar tinted with two club colours |

The total football content of the interface is **words**. Remove the word "goal" and the screen is a warehouse-management console. Three specific failures cause it:

1. **The starting eleven is a list.** A formation is a *spatial* object. Rendering it as a vertical list destroys the one piece of information the screen exists to convey — shape — and simultaneously destroys the one image every football fan carries in their head.
2. **Club colours are data we own and never draw.** Every club already has `primary` and `secondary`. They appear in the crest and nowhere else. A claret-and-blue club and a green-and-white club produce byte-identical screens.
3. **There is no green.** Not one pixel of the product is the colour of the thing it is about.

Those three are also the three cheapest things in this document to fix. That is not a coincidence — football's visual vocabulary is overwhelmingly **flat geometry**: white lines on green, coloured bands on cloth. It is almost perfectly suited to SVG and CSS gradients and almost entirely unsuited to photography, which is why licensed games look worse than they should and why we can look better than we have any right to.

---

## 2. The semiotics of football on screen

### What actually signals "football"

The test: show it to someone for 200 ms with no text. Do they say football?

The strongest signifiers are **not** the ones games spend money on. Nobody needs a rendered boot. The pitch markings alone — five white shapes on green — are recognised instantly and worldwide, by people who have never watched a match, because the geometry is unique to the sport. American football, basketball, hockey, cricket and rugby all have different, equally unmistakable line grammars. **The line grammar is the sport's logo.**

The second-strongest is **the striped shirt**. Vertical stripes, hoops, halves and sashes are effectively unused in any other visual context in modern life. A vertically striped rounded rectangle reads as a football shirt with no other cue present. This is enormously valuable to us because it costs one CSS gradient.

The third is **the shape** — eleven dots arranged 4-4-2. This one requires the viewer to know football, but our entire audience does, and it carries meaning as well as identity.

Everything after that is decoration.

### Ranking: impact versus cost

Cost is measured in what it costs *us* — SVG path complexity, and per-instance render cost in a scrolling list. "Signal" is 1–10 on the 200 ms test.

| # | Signifier | Signal | Cost to draw | Per-instance cost | Verdict |
|---|---|---:|---|---|---|
| 1 | **Pitch markings** (white lines on green) | 10 | ~24 elements, one static SVG | Zero — one instance, never in a list | **Build first.** The single highest-value object in the product. |
| 2 | **Kit pattern** (stripes/hoops/halves/sash) | 9 | One CSS gradient string | Effectively zero — one `background` value | **Build first.** Highest ratio in the entire table. |
| 3 | **Formation shape** (11 tokens in a shape) | 10 | Free once #1 and #2 exist | 11 DOM nodes, one screen | **Build first.** |
| 4 | **Shirt number in kit colours** | 8 | One `<span>` + outline | Zero | **Build first.** Replaces the face in every dense list. |
| 5 | **Mowing stripes** | 7 | 5 `<rect>` | Zero | Build first — it is five rectangles and it is what turns a green box into a *pitch*. |
| 6 | **Score bug** (broadcast scoreline block) | 8 | Pure CSS, ~14 nodes | Low — one per fixture row | Build early. |
| 7 | **Goal frame + net** | 7 | 1 path + one `<pattern>` of crossed lines | Zero (pitch only) | Build with the pitch. |
| 8 | **Shot map** | 8 | Free once #1 exists; dots sized by xG | Low | Build in phase 2 — it says "serious football" louder than any other stat view. |
| 9 | **Crest** | 7 | Already built (`crestSVG`) | Moderate — needs caching in lists | Already have it; extend per `05 §5.1`. |
| 10 | **Yellow/red card glyph** | 7 | 1 `<rect>` with a radius | Zero | Trivial; use in the match feed and suspension lists. |
| 11 | **Floodlight glow** | 6 | 2 `radialGradient` | Zero | Cheap atmosphere. Use sparingly. |
| 12 | **Crowd** | 6 | Generated circles with jitter | Zero (one plate, reused) | Cheap. Must be dim or it looks like a starfield. |
| 13 | **Corner flag** | 5 | 1 path | Zero | Include in the pitch, it costs nothing. |
| 14 | **Ball** | 6 | A correct truncated-icosahedron ball is fiddly; a 5-pentagon simplification is 6 paths | Low | Use as an *event glyph* only, never as decoration. |
| 15 | **Stand rake / stadium silhouette** | 5 | 3 skewed bands | Zero | Part of the atmosphere plate. |
| 16 | **Captain armband** | 4 | 1 `<rect>` on the token | Zero | Include — it is free and it is a genuine football detail. |
| 17 | **Boots** | 4 | Moderate path work, reads poorly at 24px | Low | Skip. The "goal" event is better served by the ball glyph. |
| 18 | **Grass blade texture** | 4 | Needs noise or a heavy `<pattern>` | **High** — the classic SVG filter trap | **Reject.** Mowing stripes do the same job for 1% of the cost. |
| 19 | **Dugout, tunnel** | 3 | Requires perspective drawing; reads as cartoon in flat vector | High | **Reject.** Photography's job, and we have no photography. |
| 20 | **Whistle, cones, training bibs** | 2–3 | Moderate | Low | Skip. Nobody has ever felt anything about a cone. |

**The pattern to take from this table:** the five cheapest items are also five of the six strongest. Football's identity is line geometry and flat colour bands. We should be rendering it, not approximating it.

**Two hard rejects, stated plainly.** Grass blade texture and any 3D-ish stadium furniture. Both are expensive, both look worse than the flat alternative on a phone, and both are the specific things that make unlicensed football games look cheap.

---

## 3. The pitch

### 3.1 Geometry

Real pitch markings, per IFAB Law 1: 105 × 68 m; penalty area 16.5 m deep × 40.32 m wide; goal area 5.5 × 18.32 m; penalty spot 11 m out; centre circle and penalty arc radius 9.15 m; corner arc 1 m; goal 7.32 m wide. Those ratios are what the eye recognises — get the penalty box proportion wrong and it stops reading as football.

**But a true 105 × 68 pitch is the wrong shape for a phone.** At the 343 px of usable width inside our 16 px gutters, a real-ratio vertical pitch is **530 px tall**. On an iPhone SE, after the top bar and tab bar, we have roughly 500 px. It does not fit, and cramming it leaves no room for the name labels under each token.

**The fix is a controlled squash, authored into the coordinates — not `preserveAspectRatio="none"`.** Non-uniform scaling of an SVG makes horizontal strokes thicker than vertical ones, which is immediately visible on a pitch made entirely of strokes. Instead we author the geometry directly at the display ratio with a single vertical factor:

```
k = 850 / 1050 = 0.8095      // pitch length 105 m drawn as 85 "metres"
```

Every y-coordinate is multiplied by `k`; circles become ellipses with `ry = rx · k`; stroke width stays uniform. The result is a pitch of display ratio **0.80** instead of 0.648 — noticeably squarer than reality, and nobody notices, because everyone has seen a broadcast wide-angle shot which does exactly this. Vertical positions stay proportionally correct, which is all the formation view needs.

Working units are decimetres (1 unit = 0.1 m), with a 30-unit run-off surround so the goals have somewhere to go: `viewBox="0 0 740 910"`, pitch inset at (30, 30) sized 680 × 850.

### 3.2 Pitch colour tokens

Add to `:root` alongside the existing tokens:

```css
:root{
  --turf-1:    #12241B;  /* base turf, dark enough to sit inside #0A0C0F */
  --turf-2:    #15291E;  /* mowing stripe — 2 points lighter, no more */
  --turf-line: #7E9C8C;  /* markings — 5.30:1 against --turf-1 */
  --turf-edge: #0D1B14;  /* run-off / surround */
  --turf-goal: #E8EDF0;  /* goal frame and net, at 50% opacity */
}
```

Two decisions worth defending:

- **The turf is dark, not bright green.** A `#2E7D32` pitch inside a `#0A0C0F` app is a glowing rectangle that owns the screen and fights every number on it. `#12241B` reads unambiguously as grass in context — the white lines do the work — while staying inside the app's value range. A bright "Daylight" pitch ships with the light theme as a token remap, not as a redesign.
- **The mowing stripe contrast is deliberately almost nothing** (`#12241B` → `#15291E`, roughly 1.15:1). Any more and it becomes a barcode competing with the markings. It should be visible only when you look for it, which is exactly how a mown pitch looks on television.

**Markings contrast:** `--turf-line` on `--turf-1` computes to **5.30:1** — comfortably clear of the 3:1 non-text requirement, so the pitch is legible for low-vision users and in sunlight.

### 3.3 The pitch, as working code

Tested at 375 px. Absolute coordinates throughout, so the same path data can be re-cropped for a half-pitch shot map by changing only the `viewBox`.

```js
function pitchSVG(){
  const L = 'var(--turf-line)';
  return `<svg viewBox="0 0 740 910" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs>
    <linearGradient id="pv" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0"   stop-color="#fff" stop-opacity=".085"/>
      <stop offset=".45" stop-color="#fff" stop-opacity=".02"/>
      <stop offset="1"   stop-color="#000" stop-opacity=".22"/>
    </linearGradient>
    <pattern id="net" width="9" height="9" patternUnits="userSpaceOnUse">
      <path d="M0 0 L9 9 M9 0 L0 9" stroke="var(--turf-goal)" stroke-opacity=".28" stroke-width="1"/>
    </pattern>
  </defs>

  <rect width="740" height="910" fill="var(--turf-edge)"/>

  <!-- turf + mowing stripes + a vignette that fakes floodlight falloff -->
  <rect x="30" y="30" width="680" height="850" fill="var(--turf-1)"/>
  <g fill="var(--turf-2)">
    <rect x="30" y="30"  width="680" height="85"/><rect x="30" y="200" width="680" height="85"/>
    <rect x="30" y="370" width="680" height="85"/><rect x="30" y="540" width="680" height="85"/>
    <rect x="30" y="710" width="680" height="85"/>
  </g>
  <rect x="30" y="30" width="680" height="850" fill="url(#pv)"/>

  <!-- markings. All y already multiplied by k = 0.8095 -->
  <g fill="none" stroke="${L}" stroke-width="3" stroke-opacity=".9">
    <rect x="30" y="30" width="680" height="850"/>
    <line x1="30" y1="455" x2="710" y2="455"/>
    <ellipse cx="370" cy="455" rx="91.5" ry="74.1"/>
    <rect x="168.4" y="30"    width="403.2" height="133.6"/>  <!-- penalty area  -->
    <rect x="168.4" y="746.4" width="403.2" height="133.6"/>
    <rect x="278.4" y="30"    width="183.2" height="44.5"/>   <!-- goal area     -->
    <rect x="278.4" y="835.5" width="183.2" height="44.5"/>
    <path d="M296.8 163.6 A 91.5 74.1 0 0 0 443.2 163.6"/>    <!-- penalty arc   -->
    <path d="M296.8 746.4 A 91.5 74.1 0 0 1 443.2 746.4"/>
    <path d="M30 38.1 A 10 8.1 0 0 0 40 30"/>                 <!-- corner arcs   -->
    <path d="M700 30 A 10 8.1 0 0 0 710 38.1"/>
    <path d="M30 871.9 A 10 8.1 0 0 1 40 880"/>
    <path d="M700 880 A 10 8.1 0 0 1 710 871.9"/>
  </g>
  <g fill="${L}" fill-opacity=".9">
    <circle cx="370" cy="455" r="4"/><circle cx="370" cy="119" r="4"/><circle cx="370" cy="791" r="4"/>
  </g>

  <!-- goals, drawn into the run-off, with net fill -->
  <g stroke="var(--turf-goal)" stroke-opacity=".5" stroke-width="3">
    <rect x="333.4" y="12"  width="73.2" height="18" fill="url(#net)"/>
    <rect x="333.4" y="880" width="73.2" height="18" fill="url(#net)"/>
  </g>
 </svg>`;
}
```

**The penalty arc flags are the one place this is easy to get wrong.** The arc is centred on the penalty spot at `(370, 119)`, and must bulge *away* from the goal. Going from the left intersection to the right one via the lowest point is counter-clockwise on screen, so `sweep-flag = 0` at the top of the pitch and `1` at the bottom. Both were verified by rendering, not by reasoning.

**Intersection maths, for anyone regenerating this:** the arc meets the penalty-area line at `dx = rx · √(1 − (dy/ry)²)`. In the drawn coordinates the penalty-area edge is at `y = 163.6` and the spot at `y = 119`, so `dy = 44.6`, `ry = 74.1`, `rx = 91.5` — giving `dx = 73.2` and x-coordinates `296.8` and `443.2`.

### 3.4 The half-pitch crop

The shot map, set-piece diagrams and heat maps all want the attacking half. Because every coordinate above is absolute, this is a `viewBox` change and nothing else:

```js
// attacking half plus 45 units past halfway, so the centre circle edge shows
pitchSVG().replace('viewBox="0 0 740 910"', 'viewBox="0 0 740 500"')
```

That is worth designing for deliberately: **one pitch function, four crops** — full (formation), attacking half (shot map), own half (defensive shape), final third (set pieces).

---

## 4. The formation pitch view

This is the highest-value screen in the document. It replaces `viewSquad()`'s `G.squadView === 'lineup'` branch, which currently renders `c.xi.map(({slot,p}) => plrRow(p, slot))`.

### 4.1 Architecture: SVG pitch, HTML tokens

**Draw the pitch in SVG. Do not draw the players in SVG.** Player tokens are absolutely-positioned HTML `<button>`s layered over the pitch, positioned in percentages. Four reasons, all of which bit during the build:

1. **Touch targets.** A `<button>` gets a real 44 × 44 hit area for free. `<circle>` elements in SVG need manual hit-area padding and lose it on scaling.
2. **Drag is a CSS transform.** Dragging an HTML node is `transform: translate()` on a composited layer. Dragging an SVG child means rewriting `cx`/`cy` and forcing a re-layout of the whole SVG on every pointer move.
3. **Text.** SVG `<text>` does not wrap, does not ellipsis, and does not honour Dynamic Type. Player surnames need all three.
4. **Accessibility.** A `<button>` with an accessible name is a first-class control in VoiceOver and switch access. An SVG circle is not.

```css
.pitchwrap{position:relative;width:100%;aspect-ratio:740/910;border-radius:14px;
  overflow:hidden;background:var(--turf-edge);touch-action:none}
.pitchwrap svg{position:absolute;inset:0;width:100%;height:100%;display:block}
```

`aspect-ratio` means the pitch never needs measuring in JS and never causes layout shift.

### 4.2 Laying out any formation

The prototype already stores formations as strings (`'4-2-3-1'`) and slot arrays (`SHAPE['4-2-3-1'] = ['GK','FB','CB','CB','FB','DM','DM','W','AM','W','ST']`). **That data is already in exactly the right order** — goalkeeper first, then each band left-to-right — so the layout function's output index maps 1:1 onto `SHAPE` and onto `c.xi`. No data migration is required.

```js
/* band depths as % of pitch height, own goal at 100%, attacking upward */
const BAND_Y = {2:[74,38], 3:[76,52,24], 4:[78,60,40,20], 5:[79,66,51,35,18]};
/* how wide a band of n players spreads, as a fraction of pitch width */
const SPREAD = {1:0, 2:.42, 3:.64, 4:.84, 5:.88, 6:.90};

function layout(formation){
  const bands = formation.split('-').map(Number);
  const ys = BAND_Y[bands.length] || BAND_Y[3];
  const out = [{x:50, y:90}];                       // goalkeeper
  bands.forEach((n, b) => {
    const last = b === bands.length - 1;
    // a front three goes wide; a lone striker or a strike pair stays central
    const s = (SPREAD[n] || .88) * (last && n >= 3 ? 1.12 : 1);
    for (let i = 0; i < n; i++)
      out.push({ x: +(50 + s * 100 * ((i + .5) / n - .5)).toFixed(1), y: ys[b] });
  });
  return out;
}
```

It generalises to any formation string with 2–5 bands, including ones we do not ship yet. Verified output:

| Formation | Result |
|---|---|
| `4-4-2` | back four at 18.5 / 39.5 / 60.5 / 81.5 %, wingers on the same x as the full-backs, strike pair at 39.5 / 60.5 |
| `4-2-3-1` | back four, double pivot at 39.5 / 60.5, W–AM–W at 28.7 / 50 / 71.3, lone striker at 50 |
| `4-3-3` | midfield three narrow at 28.7 / 50 / 71.3, front three wide at 26.1 / 50 / 73.9 |
| `3-5-2` | wing-backs at 14.8 / 85.2 — the widest positions the system generates, and still 9 % clear of the touchline at token size |
| `5-3-2` | back five at 14.8 / 32.4 / 50 / 67.6 / 85.2 |

The `last && n >= 3` rule is the only special case, and it earns its keep: without it a front three sits narrower than the midfield three behind it, which looks wrong to anyone who has watched a match.

**Goalkeeper depth is 90 %, not 92 %.** At 92 % the surname label below the token clipped the bottom of the pitch container. Found by rendering.

### 4.3 The player token

**The token is the kit, in a circle.** That single decision is where most of the football-ness comes from: eleven claret-and-blue circles in a 4-4-2 is instantly, unmistakably a football team, and it costs one `background` string per player.

```css
.tok{position:absolute;width:44px;height:44px;margin:-22px 0 0 -22px;border:0;padding:0;
  background:none;cursor:grab;transform:translateZ(0);will-change:transform}
.tok .kit{position:absolute;inset:0;border-radius:50%;
  box-shadow:0 2px 6px rgba(0,0,0,.55), inset 0 0 0 2px rgba(255,255,255,.16)}
.tok .no{position:absolute;inset:0;display:grid;place-items:center;
  font-family:var(--disp);font-weight:800;font-size:17px;line-height:1;letter-spacing:-.02em}
.tok .lbl{position:absolute;top:46px;left:50%;transform:translateX(-50%);white-space:nowrap;
  font-size:10px;font-weight:700;line-height:12px;color:#fff;
  text-shadow:0 1px 3px rgba(0,0,0,.95)}
.tok .ring{position:absolute;inset:-3px}
.tok.drag{cursor:grabbing;z-index:10}
.tok.drag .kit{box-shadow:0 10px 22px rgba(0,0,0,.7), inset 0 0 0 2px var(--acc)}
.tok.tgt  .kit{box-shadow:0 0 0 3px var(--acc), 0 2px 6px rgba(0,0,0,.55)}
```

**The inner light ring and the drop shadow are not decoration — they are required.** Measured during the build: a claret token (`#7A1F35`) on the turf (`#12241B`) has a contrast ratio of **1.58:1**. It is invisible. Since club colours are generated data and roughly a third of them will be dark, **every token must carry a 2 px `inset 0 0 0 2px rgba(255,255,255,.16)` ring and a drop shadow**, which lifts the silhouette off the turf regardless of the fill. This is a hard rule, not a style choice.

```js
function token(p, pos, i){
  const {ink, halo} = numInk(p.kit);
  const C = 2 * Math.PI * 23;
  const showRing = p.cond < 85;                  // only draw the exception
  return `<button class="tok" data-i="${i}" style="left:${pos.x}%;top:${pos.y}%"
      aria-label="${p.slot} ${p.name}, ability ${p.ca}, ${p.cond}% fit">
   ${showRing ? `<svg class="ring" viewBox="0 0 50 50" width="50" height="50" aria-hidden="true">
     <circle cx="25" cy="25" r="23" fill="none" stroke="rgba(0,0,0,.45)" stroke-width="3"/>
     <circle cx="25" cy="25" r="23" fill="none" stroke="${p.cond<66?'var(--inj)':'var(--acc)'}"
       stroke-width="3" stroke-linecap="round"
       stroke-dasharray="${(C*p.cond/100).toFixed(1)} ${C.toFixed(1)}"
       transform="rotate(-90 25 25)"/></svg>` : ''}
   <span class="kit" style="background:${kitCSS(p.kit)}"></span>
   <span class="no" style="color:${ink};text-shadow:${halo}">${p.no}</span>
   ${p.captain ? '<span class="arm"></span>' : ''}
   <span class="lbl">${esc(p.sn)}<br>
     <i style="font-style:normal;color:${ramp(p.ca/5)}">${p.ca}</i>
     <i style="font-style:normal;color:var(--t2);font-weight:600"> ${p.slot}</i></span>
  </button>`;
}
```

**Show the exception, not the rule.** The first version drew a fitness ring on all eleven tokens. Eleven rings is noise — the eye cannot tell 100 % from 92 % and stops looking. Drawing the ring only below 85 % means the ring itself *is* the warning, and the tired player is findable at a glance. Same principle for the injury cross and the off-position flag.

**What goes on a token, in priority order.** Shirt number (in the kit) → surname → ability → slot. Condition, captaincy, injury and off-position are **exception flags only**. Anything beyond that belongs in the sheet that opens on tap.

### 4.4 Drag to swap

Two interactions, both needed:

- **Tap** a token → open the player sheet (existing `showPlayer`).
- **Long-press-and-drag** a token onto another → swap the two players, keeping the slots.

```js
function bindDrag(wrap, XI, onSwap){
  let drag = null;
  wrap.querySelectorAll('.tok').forEach(el => {
    el.addEventListener('pointerdown', e => {
      el.setPointerCapture(e.pointerId);
      drag = {el, i:+el.dataset.i, x0:e.clientX, y0:e.clientY, tgt:null, moved:false};
      el.classList.add('drag');
      if (navigator.vibrate) navigator.vibrate(8);      // pick-up haptic
    });
    el.addEventListener('pointermove', e => {
      if (!drag || drag.el !== el) return;
      const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
      if (Math.hypot(dx, dy) > 6) drag.moved = true;
      el.style.transform = `translate(${dx}px,${dy}px) scale(1.14)`;
      let best = null, bd = 60 * 60;                    // 60px snap radius
      wrap.querySelectorAll('.tok').forEach(o => {
        if (o === el) return;
        const b = o.getBoundingClientRect();
        const d = (b.left + 22 - e.clientX) ** 2 + (b.top + 22 - e.clientY) ** 2;
        if (d < bd) { bd = d; best = o; }
      });
      if (drag.tgt && drag.tgt !== best) drag.tgt.classList.remove('tgt');
      if (best) best.classList.add('tgt');
      drag.tgt = best;
    });
    el.addEventListener('pointerup', () => {
      if (!drag || drag.el !== el) return;
      el.classList.remove('drag'); el.style.transform = '';
      if (drag.tgt) {
        drag.tgt.classList.remove('tgt');
        if (navigator.vibrate) navigator.vibrate([6, 40, 12]);   // drop haptic
        onSwap(drag.i, +drag.tgt.dataset.i);
      } else if (!drag.moved) {
        showPlayer(XI[drag.i].id);
      }
      drag = null;
    });
  });
}
```

**How it should feel, specified:**

| Moment | Behaviour | Duration / easing |
|---|---|---|
| Pick up | Token scales to **1.14**, shadow deepens to `0 10px 22px`, accent inner ring appears. 8 ms haptic tick. | 120 ms `ease/standard` |
| Drag | Token follows the finger 1:1 with **no lag and no easing** — any smoothing here reads as latency | none |
| Hover a target | Target token gets a 3 px amber outline. Snap radius 60 px, nearest-centre wins. | 90 ms `ease/standard` |
| Drop on a target | Both tokens cross-translate to each other's positions along a straight line. Light double-tap haptic. | 260 ms `ease/emphasised` |
| Drop on empty turf | Token springs back to origin. No haptic — nothing happened. | 200 ms `ease/exit` |
| Drop onto a bench player | Same swap, plus the sub's kit token fades in over the outgoing one | 260 ms |

`touch-action: none` on `.pitchwrap` is required or the browser steals the gesture for page scroll. The 60 px snap radius was chosen because it is slightly larger than the tightest token gap (`4-2-3-1` double pivot, ~72 px apart at 375 px), so a sloppy drop still lands somewhere sensible rather than nowhere.

### 4.5 Fitting a 375 px portrait screen

At 375 px with 16 px gutters: pitch is **343 × 422 px**. Budget for the whole screen:

| Element | Height |
|---|---|
| Top bar | 62 |
| Segmented control (Lineup / Tactics / Training / Academy) | 44 |
| Formation + XI-average row | 34 |
| **Pitch** | **422** |
| Bench strip (horizontal scroll of kit tokens) | 76 |
| Tab bar | 60 |
| **Total** | **698** |

That overflows a 667 px iPhone SE viewport by 31 px, which is correct — the bench strip should be *just* below the fold, so the screen invites one small scroll. On a 844 px iPhone 15 everything is visible with 146 px spare. Do not shrink the pitch to force a no-scroll fit on the smallest device; the pitch is the screen.

**The bench is a horizontal strip of the same kit tokens**, not a list. It keeps the visual language consistent and makes drag-from-bench-to-pitch the obvious gesture.

---

## 5. Kits as identity

Every club already carries `primary` and `secondary`. Adding one field — `pattern` — turns two hex values into a recognisable identity that can appear in forty places for almost no cost.

### 5.1 The club kit record

```js
club.kit = {
  p:   club.primary,       // shirt ground
  s:   club.secondary,     // pattern colour
  trim: club.secondary,    // collar and cuffs; sometimes a third tincture
  pat: 'stripes',          // deterministic from hash(club.id + worldSeed)
  collar: 'v',             // crew | v | polo | none
  sleeve: 'matching'       // matching | contrast
};
```

Derive `pat` from the same seeded RNG that drives the crest, weighted by nation per `05 §5.1` — English clubs skew to `plain`, `stripes`, `hoops`; Spanish to `stripes`; Italian to `stripes` and `plain`; Dutch to `plain` and `band`. The crest and the kit must draw from the *same two tinctures*, because that coherence is what makes a fake club feel like a club.

### 5.2 The cheap renderer — CSS gradients

**Twelve of the fourteen kit patterns are expressible as a single CSS gradient.** This is the most important performance finding in this document: a kit swatch in a list costs one `background` string and zero DOM nodes beyond the element that already exists.

```js
function kitCSS(k){
  const p = k.p, s = k.s;
  switch(k.pat){
    case 'stripes':   return `repeating-linear-gradient(90deg,${p} 0 11.11%,${s} 11.11% 22.22%)`;
    case 'stripes-w': return `repeating-linear-gradient(90deg,${p} 0 20%,${s} 20% 40%)`;
    case 'pinstripe': return `repeating-linear-gradient(90deg,${p} 0 11%,${s} 11% 13%)`;
    case 'hoops':     return `repeating-linear-gradient(180deg,${p} 0 11.11%,${s} 11.11% 22.22%)`;
    case 'hoops-w':   return `repeating-linear-gradient(180deg,${p} 0 20%,${s} 20% 40%)`;
    case 'halves':    return `linear-gradient(90deg,${p} 0 50%,${s} 50% 100%)`;
    case 'quarters':  return `conic-gradient(from 0deg,${p} 0 25%,${s} 25% 50%,${p} 50% 75%,${s} 75% 100%)`;
    case 'sash':      return `linear-gradient(115deg,${p} 0 33%,${s} 33% 55%,${p} 55% 100%)`;
    case 'band':      return `linear-gradient(180deg,${p} 0 37%,${s} 37% 63%,${p} 63% 100%)`;
    case 'shoulders': return `linear-gradient(180deg,${s} 0 24%,${p} 24% 100%)`;
    case 'halo':      return `radial-gradient(circle at 50% 50%,${p} 0 33%,${s} 33% 55%,${p} 55% 100%)`;
    default:          return p;                                  // plain
  }
}
```

Only `chevron` and `checkerboard` need real geometry; they are SVG-only and used on the shirt, never on a token.

**Where the CSS renderer is used:** player tokens on the pitch, squad-list swatches, fixture rows, the league table, the score bug, transfer shortlists, the bench strip — i.e. everywhere that appears in a scrolling list. **Where the SVG shirt is used:** the player card, the kit-clash screen, the season-preview page — i.e. the handful of places where one large kit is the subject.

### 5.3 Shirt-number legibility — the failure and the fix

The first version chose the number's ink from a *weighted average* of the two kit colours. **It failed on three of twelve patterns**, and the failures were exactly the ones that matter: a navy-and-cream hooped shirt averages light, so the number was drawn dark — and landed on a navy hoop. Unreadable. The same on a cream shirt with a navy chest band.

The fix has two parts, and both are how real shirts solve it:

1. **Choose the ink from the colour actually behind the number**, not the average. For a centred number on a token, that colour is deterministic per pattern.
2. **Always outline the number.** Real football shirt numbers are outlined precisely because the shirt beneath them is often striped. A 1 px hard ring in the opposite value survives any pattern.

```js
function lum(h){                                  // WCAG relative luminance
  const n = parseInt(h.slice(1), 16);
  const f = [n>>16&255, n>>8&255, n&255].map(v => {
    v /= 255; return v <= .03928 ? v/12.92 : Math.pow((v+.055)/1.055, 2.4);
  });
  return .2126*f[0] + .7152*f[1] + .0722*f[2];
}

/* patterns whose centre pixel is the SECONDARY colour, not the ground */
const CENTRE_IS_SECONDARY = { band:1, sash:1 };

function numInk(k){
  const behind = CENTRE_IS_SECONDARY[k.pat] ? k.s : k.p;
  const dark   = lum(behind) < .32;
  const ink    = dark ? '#FFFFFF' : '#0B0E12';
  const edge   = dark ? 'rgba(0,0,0,.85)' : 'rgba(255,255,255,.9)';
  const halo   = `-1px 0 0 ${edge},1px 0 0 ${edge},0 -1px 0 ${edge},0 1px 0 ${edge},0 0 3px ${edge}`;
  return { ink, halo };
}
```

Re-rendered across all twelve patterns: **all twelve legible**, including navy hoops, cream-with-navy-band and crimson-on-black hoops. In SVG the same effect is one attribute — `paint-order="stroke"` with `stroke-width="3"` — which is cheaper and sharper than four text-shadows; use that form on the shirt.

**Related rule, from the score-bug build:** when a club colour is used for a *thin* element on a dark background — a 5 px edge bar, a 2 px form underline, a table row marker — a dark club colour disappears. Always pick the lighter of the club's two colours for thin marks:

```js
const bright = k => lum(k.p) >= lum(k.s) ? k.p : k.s;
```

### 5.4 The SVG shirt renderer

One shirt mesh, one clip path, a pattern layer, sleeves, cuffs and a collar. Rendered and verified across twelve patterns and three collar types.

```js
const SHIRT = "M70 22 L44 30 L16 62 L30 104 L57 92 L57 182 Q100 191 143 182 "
            + "L143 92 L170 104 L184 62 L156 30 L130 22 C126 44 74 44 70 22 Z";

function kitSVG(k, size, opt){
  opt = opt || {};
  const id = 'k' + (kitSVG.n = (kitSVG.n || 0) + 1);
  const p = k.p, s = k.s, tr = k.trim || k.s;
  const R = (x,y,w,h,f) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"/>`;
  let pat = '';
  switch(k.pat){
    case 'stripes':   for(let i=1;i<9;i+=2) pat += R(i*200/9, 0, 200/9, 200, s); break;
    case 'stripes-w': for(let i=1;i<5;i+=2) pat += R(i*40, 0, 40, 200, s); break;
    case 'pinstripe': for(let i=1;i<14;i++) pat += R(i*200/14, 0, 4, 200, s); break;
    case 'hoops':     for(let i=0;i<9;i+=2) pat += R(0, 20+i*19, 200, 19, s); break;
    case 'hoops-w':   for(let i=0;i<5;i+=2) pat += R(0, 20+i*34, 200, 34, s); break;
    case 'halves':    pat = R(100,0,100,200,s); break;
    case 'quarters':  pat = R(100,0,100,100,s) + R(0,100,100,100,s); break;
    case 'sash':      pat = `<path d="M6 44 L150 200 L200 200 L56 30 Z" fill="${s}"/>`; break;
    case 'band':      pat = R(0,88,200,38,s); break;
    case 'shoulders': pat = R(0,0,200,60,s); break;
    case 'chevron':   pat = `<path d="M0 96 L100 40 L200 96 L200 128 L100 72 L0 128 Z" fill="${s}"/>`; break;
    case 'checks':    for(let y=0;y<5;y++) for(let x=0;x<5;x++) if((x+y)%2) pat += R(x*40,y*40,40,40,s); break;
  }
  const sl = k.sleeve === 'contrast'
    ? `<path d="M70 22 L44 30 L16 62 L30 104 L57 92 L57 40 Z"    fill="${tr}"/>
       <path d="M130 22 L156 30 L184 62 L170 104 L143 92 L143 40 Z" fill="${tr}"/>` : '';
  const cuff = k.cuff === false ? '' : `<g fill="${tr}">
    <path d="M16 62 L30 104 L44 98 L31 55 Z"/><path d="M184 62 L170 104 L156 98 L169 55 Z"/></g>`;
  const collar = {
    crew: `<path d="M70 22 C74 44 126 44 130 22 L122 18 C118 36 82 36 78 18 Z" fill="${tr}"/>`,
    v:    `<path d="M78 20 L100 54 L122 20 L114 16 L100 42 L86 16 Z" fill="${tr}"/>`,
    polo: `<path d="M70 22 C74 44 126 44 130 22 L122 18 C118 36 82 36 78 18 Z" fill="${tr}"/>
           <rect x="95" y="33" width="10" height="28" fill="${tr}"/>`,
    none: ''
  }[k.collar || 'crew'];
  const no = opt.no == null ? '' :
    `<text x="100" y="150" text-anchor="middle" font-family="Archivo,system-ui" font-weight="800"
       font-size="62" letter-spacing="-2" fill="${opt.ink}" stroke="${opt.edge}"
       stroke-width="3" paint-order="stroke">${opt.no}</text>`;
  return `<svg viewBox="0 0 200 200" width="${size}" height="${size}" role="img" aria-label="club kit">
   <defs><clipPath id="${id}"><path d="${SHIRT}"/></clipPath></defs>
   <g clip-path="url(#${id})"><rect width="200" height="200" fill="${p}"/>${pat}${sl}${cuff}</g>
   ${collar}${no}
   <path d="${SHIRT}" fill="none" stroke="rgba(0,0,0,.45)" stroke-width="2.5" stroke-linejoin="round"/>
  </svg>`;
}
```

**Combinatorics:** 14 patterns × 4 collars × 2 sleeve treatments × 2 cuff states = **224 kit forms** before colour. With the 18-tincture palette from `05 §5.1` under the rule of tincture, that is comfortably more than enough for 2,500 clubs to be mutually distinguishable within a league.

**Every rect is clipped to the shirt path**, which is why patterns can be authored across the full 200 × 200 square and simply spill off the sleeves. That is also why the pattern maths is trivial — no shirt-shaped arithmetic anywhere.

### 5.5 Where kits appear

This is the part that changes the product, and it is nearly free once §5.2 exists:

| Surface | Kit form | Size | Effect |
|---|---|---|---|
| Formation pitch | CSS circle | 44 px | The team becomes a team |
| Squad list row | CSS rounded square + number | 30 px | Replaces the tiny face; faster to scan and cheaper |
| Bench strip | CSS circle | 40 px | Substitution becomes a spatial act |
| Fixture card | CSS rounded square ×2 | 26 px | Every fixture shows the two kits that will actually meet |
| League table | 3 px left edge bar in `bright(kit)` | — | The table becomes readable at a glance, by colour |
| Score bug | CSS rounded square ×2 + edge bars | 26 px | Broadcast |
| Transfer shortlist | CSS circle + number | 28 px | You can see which club a target plays for without reading |
| Player card | **SVG shirt** | 110 px | The one place the kit is the subject |
| Kit-clash screen | **SVG shirt** ×2 | 120 px | Home/away decision, and a genuinely football moment |

The league-table edge bar deserves a note: it is the cheapest possible use of club colour — one 3 px `border-left` — and it converts the single most list-like, least football-like screen in the product into something that scans by colour the way a real table does.

---

## 6. The player card

The job is to make a generated player feel like a person rather than a row. Football games do this with a consistent five-part grammar, and every one of those parts is data we already have.

**The grammar:** rating (large, top-left) · position (under it) · nation (a flag) · portrait (looking at you) · shirt number (top-right) · name in a bar (given name small, surname large) · attributes in a grid below.

```css
.pcard{position:relative;border-radius:18px;overflow:hidden;background:var(--s1);border:1px solid var(--hair)}
.pcard .hd{position:relative;height:132px;overflow:hidden}
.pcard .hd .bgkit{position:absolute;inset:0;opacity:.42}
.pcard .hd .scrim{position:absolute;inset:0;
  background:linear-gradient(180deg,rgba(10,12,15,.05) 0%,rgba(10,12,15,.52) 44%,var(--s1) 100%)}
/* broadcast diagonal cut. Drawn BEFORE the portrait so the head breaks the frame. */
.pcard .hd .cut{position:absolute;left:0;right:0;bottom:-1px;height:26px;background:var(--s1);
  clip-path:polygon(0 100%,0 62%,100% 0,100% 100%)}
.pcard .hd svg.face{position:absolute;left:50%;bottom:-4px;transform:translateX(-50%);z-index:1}

.pcard .rt{position:absolute;left:13px;top:11px;z-index:2;text-align:center}
.pcard .rt .v{font-family:var(--disp);font-weight:800;font-size:36px;line-height:32px;color:var(--acc)}
.pcard .rt .p{font-family:var(--disp);font-weight:800;font-size:11px;letter-spacing:.1em;margin-top:5px}
.pcard .sh{position:absolute;right:13px;top:11px;z-index:2}
.pcard .sh .n{font-family:var(--disp);font-weight:800;font-size:30px;line-height:28px;opacity:.85}

.pcard .nmbar{padding:9px 14px 11px;border-bottom:1px solid var(--hair)}
.pcard .nmbar .f{font-size:11px;color:var(--t3);letter-spacing:.06em;text-transform:uppercase;font-weight:700}
.pcard .nmbar .s{font-family:var(--disp);font-weight:800;font-size:23px;line-height:25px}

.att{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--hair)}
.att div{background:var(--s1);padding:9px 4px;text-align:center}
.att .k{font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:var(--t3);font-weight:700}
.att .v{font-weight:700;font-size:18px;line-height:20px;margin-top:1px}
.flag{width:20px;height:14px;border-radius:2px;display:inline-block;
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.2)}
```

```js
function playerCard(p){
  return `<div class="pcard">
   <div class="hd">
     <div class="bgkit" style="background:${kitCSS(p.kit)}"></div>
     <div class="scrim"></div>
     <div class="cut"></div>
     ${faceSVG(p.id*13+7, {size:126, nat:p.nat, age:p.age,
                           kitA:p.kit.p, kitB:p.kit.s, bg:'transparent'})}
     <div class="rt"><div class="v">${p.ca}</div><div class="p">${p.pos}</div>
       <div style="margin-top:7px"><span class="flag" style="background:${flagCSS(p.nat)}"></span></div></div>
     <div class="sh"><div class="n">${p.no}</div></div>
   </div>
   <div class="nmbar"><div class="f">${esc(p.first)}</div><div class="s">${esc(p.sn)}</div></div>
   <div class="att">${p.attrs.map(([k,v]) =>
     `<div><div class="k">${k}</div><div class="v" style="color:${ramp(v)}">${v}</div></div>`).join('')}</div>
  </div>`;
}
```

**The diagonal cut is the single detail that makes it read as sport.** A rectangular header with a portrait in it is a contact card. A 26 px diagonal that the portrait's shoulders *break through* is a broadcast player bug. The layer order matters and is easy to get wrong: draw the cut, then the portrait on top with `z-index:1`. The first attempt drew the cut over the portrait and decapitated it.

**The kit is the background.** At `opacity:.42` under a scrim, the club's stripes are legible behind the head without competing with it — the player is visibly *of* a club before you read a word.

### Flags, cheaply

Most national flags are two or three bands. That covers a large majority of European and South American nations exactly, at the cost of one gradient:

```js
function flagCSS(f){          // f = {c:['#008751','#FFFFFF','#008751'], d:'v'}
  const dir = f.d === 'v' ? '90deg' : '180deg', n = f.c.length;
  return `linear-gradient(${dir},${f.c.map((c,i)=>`${c} ${i*100/n}% ${(i+1)*100/n}%`).join(',')})`;
}
```

Nations whose flags carry a charge (a cross, a crescent, a canton) need a small SVG each — budget roughly 15 hand-drawn flag overlays to cover our five nations plus the common import nationalities. National flags are not trademarks; using them is safe, unlike competition marks.

---

## 7. Match presentation

The match is a text feed. The job is to make it feel like *watching*. The rule that decides everything below: **spend the pixels on the two things a broadcast spends them on — the persistent scoreline, and the moment a goal goes in.** Everything else is optional.

### 7.1 The score bug

```css
.bug{position:relative;background:var(--s1);border:1px solid var(--hair);border-radius:14px;
  overflow:hidden;display:flex;align-items:stretch;height:62px}
.bug .side{flex:1;display:flex;align-items:center;gap:9px;padding:0 12px;min-width:0}
.bug .side.r{flex-direction:row-reverse}
.bug .bar{width:5px;flex:0 0 auto}                    /* club colour, always bright(kit) */
.bug .ab{font-family:var(--disp);font-weight:800;font-size:16px;letter-spacing:.04em}
.bug .sc{flex:0 0 auto;display:flex;flex-direction:column;align-items:center;justify-content:center;
  padding:0 14px;background:var(--s2);position:relative}
/* the two skewed shoulders are what make it broadcast rather than a table cell */
.bug .sc::before,.bug .sc::after{content:"";position:absolute;top:0;bottom:0;width:18px;
  background:var(--s2);transform:skewX(-12deg)}
.bug .sc::before{left:-9px} .bug .sc::after{right:-9px}
.bug .sc .g{position:relative;z-index:1;font-family:var(--disp);font-weight:800;font-size:27px;
  line-height:27px;letter-spacing:-.02em;white-space:nowrap}
.bug .sc .g i{font-style:normal;opacity:.3;margin:0 4px}
.bug .clk{position:relative;z-index:1;font-size:9px;font-weight:700;letter-spacing:.13em;
  color:var(--acc);margin-top:3px}
.bug.live .clk::after{content:"";display:inline-block;width:4px;height:4px;border-radius:2px;
  background:var(--loss);margin-left:5px;vertical-align:1px;animation:pulse 1.6s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}

/* the shared kit swatch, used by the score bug, squad rows, fixtures and the bench */
.ksw{width:26px;height:26px;border-radius:7px;flex:0 0 auto;position:relative;overflow:hidden;
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.14)}
.ksw b{position:absolute;inset:0;display:grid;place-items:center;
  font-family:var(--disp);font-weight:800;font-size:13px}
```

```js
function scoreBug(h, a, hs, as, min, live){
  return `<div class="bug${live ? ' live' : ''}">
   <span class="bar" style="background:${bright(h.kit)}"></span>
   <span class="side"><span class="ksw" style="background:${kitCSS(h.kit)}"></span>
     <span class="ab">${h.abbr}</span></span>
   <span class="sc"><span class="g">${hs}<i>&ndash;</i>${as}</span><span class="clk">${min}</span></span>
   <span class="side r"><span class="ksw" style="background:${kitCSS(a.kit)}"></span>
     <span class="ab">${a.abbr}</span></span>
   <span class="bar" style="background:${bright(a.kit)}"></span></div>`;
}
```

**The minute goes under the score, inside the centre block.** The first attempt floated it absolutely at the bottom centre and it collided with the scoreline. Stack it.

**The skewed shoulders on the centre block are the whole trick.** Two pseudo-elements, `skewX(-12deg)`, and a flat data row becomes a graphics package. It costs nothing and it is the most recognisably-broadcast element in the entire product.

The same component serves the live match header, every fixture row, every result in the inbox and the club's results history. **Build it once, use it in six places** — which is also how a real broadcaster's graphics package works.

### 7.2 What earns its place on a phone

| Element | Verdict | Why |
|---|---|---|
| **Persistent score bug** | **Build** | The single most important object on the match screen. It never scrolls away. |
| **Goal moment** (amber slab wipe) | **Build** — already exists as `.slab` | This is the emotional peak. Everything else exists to make this land. |
| **Momentum bar** | **Keep** — already exists | Cheap, continuous, and it is genuinely how it feels to watch a match swing. |
| **Shot map** | **Build**, on the full-time screen | Says "serious football" louder than any other stat view. Free once the pitch exists. |
| **Event markers on a mini pitch** | **Build**, at half-time and full-time only | Valuable as a *summary*. Live, it competes with the feed. |
| **Live animated 2D player dots** | **Reject** | A rendering loop, a whole extra simulation output, and the engine is event-based not positional. It would be a lie about the model. |
| **Formation-versus-formation graphic** | **Build**, on the pre-match screen | One pitch, twenty-two tokens, two kits. Pure signal, near-zero cost. |
| **Commentary avatars / pundits** | **Reject** | Uncanny, expensive, and ages badly. |
| **Radar / spider charts** | **Reject** in match; keep for player comparison | Illegible below ~200 px. |
| **Possession donut** | **Reject** | A percentage in tabular figures says the same thing in a tenth of the space. |

### 7.3 The shot map

Convention, from published football analytics practice: **marker area encodes xG**, marker fill encodes outcome, and the two teams are separated rather than overlaid. On a phone, separate them by *shooting into opposite ends of one full pitch* — it uses the pitch we already have and avoids a second crop.

```js
function shotMap(shots, home, away){   // shot = {x, y, xg, outcome, home}
  const dot = s => {
    const r = 8 + Math.sqrt(s.xg) * 34;              // area ∝ xG
    const fill = s.outcome === 'goal'   ? 'var(--acc)'
               : s.outcome === 'target' ? 'var(--t2)' : 'none';
    const stroke = bright((s.home ? home : away).kit);
    return `<circle cx="${s.x}" cy="${s.y}" r="${r.toFixed(1)}" fill="${fill}"
      fill-opacity="${s.outcome === 'goal' ? .95 : .45}"
      stroke="${stroke}" stroke-width="3" stroke-opacity=".9"/>`;
  };
  return pitchSVG().replace('</svg>', `<g>${shots.map(dot).join('')}</g></svg>`);
}
```

- Radius `8 + √xG · 34` in pitch units (0.1 m) puts a 0.05 xG pot-shot at ~16 units (≈ 8 px on screen) and a penalty at ~32 units (≈ 16 px). Square-root scaling is required so *area*, not radius, tracks xG — a linear radius over-states big chances by a factor of the ratio squared.
- **Goals are filled amber and solid; everything else is outlined.** Colour is never the only channel: goals are also the only filled markers, so the map survives colour-vision deficiency.
- The shot's *stroke* carries the club colour, so a map of a match reads as two teams without a legend.

### 7.4 The goal moment

Already specified in `05 §7` at 900 ms: amber slab wipes in on a 15° diagonal (260 ms), scoreline counts and settles (300 ms), scorer name slides up (200 ms), hold (140 ms). Two football-specific additions:

- **Wipe in the scoring club's colour, not the accent**, when the scoring club is not the player's. It is a small thing and it means a goal against you does not feel like a celebration.
- **The net ripples.** One `<pattern>` transform on the goal's net fill — 180 ms of `translate(0,3)` and back — sold on any goal graphic that shows a goal. Roughly four lines of CSS for a disproportionate amount of "that's football".

---

## 8. Crowd, stadium and atmosphere

The constraint: suggest a stadium without art, without looking cartoonish, and without competing with data. The answer is that a night-time crowd, seen from the pitch, is **thousands of small dim points of light in near-darkness** — which is exactly what SVG circles with jittered opacity look like.

```js
function atmoSVG(){
  const band = (y, h, rows, cols, r, op, skew) => {
    let d = '';
    for (let ry = 0; ry < rows; ry++) for (let cx = 0; cx < cols; cx++){
      const jx = ((ry*7 + cx*13) % 5) / 5, jy = ((cx*11 + ry*5) % 4) / 4;
      const o  = (op * (.45 + ((cx*ry + cx + ry) % 7) / 9)).toFixed(2);
      d += `<circle cx="${(cx + jx*.6) * (375/cols) + 2}"
                    cy="${y + (ry + jy*.5) * (h/rows) + 2}" r="${r}" opacity="${o}"/>`;
    }
    return `<g fill="#A9BDD2" transform="skewY(${skew})">${d}</g>`;
  };
  return `<svg viewBox="0 0 375 120" preserveAspectRatio="none" aria-hidden="true">
   <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0E141C"/><stop offset="1" stop-color="#070A0E"/></linearGradient>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0"  stop-color="#0A0C0F" stop-opacity=".7"/>
      <stop offset=".5" stop-color="#0A0C0F" stop-opacity=".1"/>
      <stop offset="1"  stop-color="#0A0C0F" stop-opacity="1"/></linearGradient>
    <radialGradient id="lamp" cx=".5" cy=".5" r=".5">
      <stop offset="0"  stop-color="#FFE9AE" stop-opacity=".40"/>
      <stop offset=".4" stop-color="#FFD36B" stop-opacity=".11"/>
      <stop offset="1"  stop-color="#FFC53D" stop-opacity="0"/></radialGradient>
   </defs>
   <rect width="375" height="120" fill="url(#sky)"/>
   <ellipse cx="42"  cy="8" rx="130" ry="80" fill="url(#lamp)"/>
   <ellipse cx="333" cy="2" rx="130" ry="80" fill="url(#lamp)"/>
   ${band(8,  26, 4, 60, .85, .30, -2.2)}
   <rect y="36" width="375" height="2.5" fill="#0A0C0F" opacity=".85" transform="skewY(-2.2)"/>
   ${band(40, 34, 5, 46, 1.15, .42, -2.2)}
   <rect y="76" width="375" height="3" fill="#0A0C0F" opacity=".85" transform="skewY(-2.2)"/>
   ${band(80, 26, 3, 34, 1.5,  .50, -2.2)}
   <rect y="105" width="375" height="15"  fill="#0C1218"/>
   <rect y="105" width="375" height="1.5" fill="#FFC53D" opacity=".16"/>
   <rect width="375" height="120" fill="url(#fade)"/>
  </svg>`;
}
```

Four things make it read as a crowd rather than a halftone screen — the first version failed on all four:

1. **Three bands at different dot scales** (0.85 / 1.15 / 1.5 px), because a lower tier is closer and its people are bigger.
2. **Per-dot opacity jitter.** A uniform-opacity grid is unmistakably a pattern. The `(cx*ry + cx + ry) % 7` term is deterministic, cheap, and enough to break the regularity.
3. **A `skewY(-2.2)` rake**, because stands are never level with the frame.
4. **Two dark separator lines** between tiers, which is what turns a field of dots into architecture.

**Rules for using it.** One plate, rendered once, reused. It appears behind the **match screen header, the season-preview screen and the trophy moment — nowhere else**. It sits at 100 % of its own (already dark) opacity, and every piece of text over it sits on the `url(#fade)` gradient, never on the crowd directly. Never animate it. Never put it behind a table, a squad list, or anything with numbers on it. The moment atmosphere appears behind data, the product looks like a free-to-play game.

**Floodlight glow** is two `radialGradient` ellipses at the top corners. It is doing more work than the crowd is, for a hundredth of the cost, and it is the single cheapest way to make a dark header feel like a night match. Use it on its own — without the crowd — behind the pre-match screen.

---

## 9. Colour

### The recommendation: keep amber. Add green as a surface, not as an accent.

**Do not change the accent.** `#FFC53D` on `#0A0C0F` stays. Three reasons, in order of weight:

1. **Green, red and grey are already spoken for**, by win, loss and draw — the most-read colours in the entire product. An accent that collides with the result semantics would make every league table and every form string ambiguous. This is not a preference; it is the thing that breaks first.
2. **Amber already is a football colour** — it is floodlight, it is the trophy, it is the low winter sun at a 3 pm kick-off. It is only reading as "generic dark-app amber" because it currently has no football context around it. Put it next to a pitch and it becomes floodlight. **The fix is not a new accent; it is giving the existing accent something football to sit next to.** Rename the token's *meaning* in the design system from "amber" to **"floodlight"** and the palette stops feeling arbitrary.
3. It is already threaded through ten modules and the brand identity (`08-logo-identity.md`). Changing it is a rebuild for a problem that is not the accent's fault.

### How football colour actually gets in

Football's colour arrives through **three new channels**, none of which is the accent:

| Channel | Where it lives | Rule |
|---|---|---|
| **Turf** | The pitch object, and only the pitch object | Dark, desaturated: `#12241B`. Never a page background, never behind text, never a card fill. Its job is to make one object unmistakable, not to tint the app. |
| **Club colour** | Kits, crest, table edge bars, score-bug bars, shot strokes | **Data, never chrome.** A club colour never colours a button, a tab, a header or a link. It only ever describes *which club this is*. This is the rule that keeps a 20-club table from looking like a paint chart. |
| **Floodlight** | The existing accent | Unchanged. Reframed. |

The discipline this buys: the app stays a calm dark editorial product where data lives, and the football colour is concentrated in the objects that are *about* football. That is also, not coincidentally, how a broadcast graphics package works — the studio is grey, the pitch is green, the shirts are loud.

### Two contrast rules that fall out of this

Both were discovered by rendering, and both are hard rules because club colours are *generated* and roughly a third of them are dark:

1. **Any club colour used as a fill needs a light inner ring** — `inset 0 0 0 2px rgba(255,255,255,.16)` — plus a drop shadow. A claret token on turf measures **1.58:1** without it. Invisible.
2. **Any club colour used as a thin mark must use `bright(kit)`**, the lighter of the club's two colours. A 5 px navy bar on `#12161B` does not exist.

### The green that must not happen

A bright `#2E7D32` pitch, or green as a UI accent, or green cards, or a green tab bar. Every unlicensed football game that looks cheap looks cheap partly because of this. Football green on screen must be **dark and desaturated** and must appear only where grass would actually be.

---

## 10. Motion that reads as sport

`05 §7` already specifies the general motion system — the easings, the durations, the bans. This section adds only what is *football-specific*, and it obeys the same rule: motion earns its place four times a session, not four times a screen.

Broadcast motion has one distinguishing characteristic that UI motion does not: **it moves on a diagonal.** Sports graphics wipe, they do not fade; they enter along a skewed edge, they do not scale from centre. That single property is most of what makes something feel like sport rather than like software.

| Moment | Motion | Duration | Easing |
|---|---|---|---|
| **Score bug entering** | Centre block wipes from `scaleX(0)` at the skew angle, sides slide in ±20 px behind it | 260 ms | `ease/emphasised` |
| **Score flip** | Old numeral slides up and out (110 ms), new numeral slides up and in (150 ms), overshooting 2 px. Never a crossfade — a scoreline changing must feel *mechanical*, like a flip board. | 260 ms | `ease/standard` |
| **Goal** | Per `05 §7`, in the scoring club's colour. Add: net ripple, `translate(0,3)` and back. | 900 ms total, ripple 180 ms | `ease/emphasised` |
| **Table movement** | Rows physically translate to new positions, spring 220/26; the moved row holds an accent left-edge bar for 1200 ms | 420 ms | `spring/table` |
| **Formation change** | All eleven tokens travel to their new coordinates **simultaneously, not staggered** — a team changing shape moves as one body | 340 ms | `ease/emphasised` |
| **Token pick-up / drop** | See §4.4 | 120 / 260 ms | `ease/standard` / `ease/emphasised` |
| **Substitution** | Outgoing token fades and shrinks to 0.9; incoming token rises from the bench strip along a 40 px arc | 300 ms | `ease/emphasised` |
| **Half-time / full-time** | Full-width slab wipes across on a 15° diagonal, holds, wipes off | in 300, hold 900, out 240 ms | `ease/emphasised` |
| **Kick-off** | Pitch scales 1.04 → 1.0 with the floodlight vignette brightening | 420 ms | `ease/emphasised` |

**Football-specific bans**, on top of the general ones:

- **No bouncing ball loaders.** It is the single most common cheap-football-game signal in existence.
- **No spinning crests.** A crest is a heraldic object; it does not rotate.
- **No animated crowd.** Twinkling dots read as a starfield, not a stadium.
- **No confetti except a trophy or a promotion**, max twice per in-game season, per `05 §7`.
- **The pitch never animates while you are reading it.** No shimmer on the turf, no drifting mowing stripes.

Every sequence above is interruptible by a tap and is replaced by a 120 ms crossfade to the end state under `prefers-reduced-motion`.

---

## 11. Rendering cost

Owned in detail by the performance stream; the football-specific numbers, so the two documents agree:

- **A kit swatch in a list costs one CSS `background` string and zero extra DOM nodes.** This is why §5.2 exists. Forty rows of kit swatches is cheaper than forty rows of the current 36 px `faceSVG` portraits, which are ~14 SVG elements each — **replacing faces with kit-number chips in lists is a net performance *win* as well as a design one.**
- **The pitch is one SVG, ~34 elements, one instance per screen, never in a list.** It is static after first paint; no re-render on token drag because tokens are separate HTML nodes.
- **`kitSVG()` is ~10–30 elements** and is used only where one large kit is the subject — never more than two on screen at once.
- **The atmosphere plate is generated once and reused.** At 60 × 4 + 46 × 5 + 34 × 3 = 572 circles it is not something to build per screen; build it once at boot, cache the string, and stamp the same markup wherever it is needed.
- **`crestSVG` is the only thing in this document that genuinely needs caching in lists**, per `05 §6` — memoise by `(clubId, sizeBucket)`.

---

## 12. What to change, most impactful first

Ordered by how much each one moves the *feel* per unit of work.

| # | Change | Effort | Why it is here |
|---|---|---|---|
| **1** | **Replace the lineup list with the pitch view.** `pitchSVG()` + `layout()` + `token()`, swapping the `G.squadView === 'lineup'` branch of `viewSquad()`. | ~1 day | The single largest change in the document. It converts the most-visited screen in the game from a spreadsheet into football, it uses the existing `SHAPE` data unmodified, and it is where drag-to-swap finally makes sense. Nothing else on this list comes close. |
| **2** | **Add `kit` to the club record and `kitCSS()` to the renderer.** | ~2 hours | Two hex values we already store become a visible identity. Unblocks 3, 4, 5, 6 and half of 8. Highest ratio of change-in-feel to lines-of-code in the project. |
| **3** | **Kit-number chips replace faces in every list.** Squad, bench, shortlist, academy. | ~2 hours | Faster to scan, cheaper to render, and it makes every list obviously football. A rare change that is simultaneously a design win and a performance win. |
| **4** | **The score bug**, used in the match header, every fixture card, every result and the inbox. | ~3 hours | The skewed centre block is the most recognisably-broadcast object we can build, and it appears in six places from one component. |
| **5** | **Club-colour edge bars on the league table** — one 3 px `border-left` in `bright(kit)`. | ~30 min | Converts the least football-like screen in the product for almost no work. |
| **6** | **The player card**, replacing the top of the player sheet. | ~4 hours | Turns a generated row into a person. The diagonal cut with the portrait breaking it is what does the work. |
| **7** | **Pitch colour tokens into `:root`**, and the floodlight vignette. | ~30 min | Prerequisite for 1; also lets everything else stop being invented locally. |
| **8** | **The formation-versus-formation pre-match screen.** One pitch, twenty-two tokens, two kits. | ~3 hours | Reuses 1 and 2 entirely. Gives the pre-match moment — currently a button — an actual shape. |
| **9** | **Shot map on the full-time screen.** | ~3 hours | Free once 1 exists. Says "serious football game" more loudly than any other stat surface. |
| **10** | **The atmosphere plate** behind the match and season-preview headers, plus floodlight glow. | ~3 hours | Real atmosphere for one cached string. Strictly limited to three screens. |
| **11** | **`kitSVG()`** for the player card background and a kit-clash screen. | ~4 hours | The place kits become the subject rather than an identifier. |
| **12** | **Football motion**: score flip, formation-change travel, net ripple, half-time wipe. | ~4 hours | Only worth doing after 1–6 exist; motion on a NASA console is still a NASA console. |
| **13** | **Extend the crest generator** to the full grammar in `05 §5.1`. | ~1 week | Real, but it is the *slowest* item here per unit of feel — the current four-shield generator is adequate, and crests are small and rarely the focus. Do it after everything above. |

**The honest summary:** items 1, 2 and 3 together are roughly a day and a half of work, and they change the answer to "does this look like a football game?" from no to yes. Everything from 4 down is refinement on top of a product that already reads correctly. If only one thing gets built, build the pitch view.

---

## Sources

- [Law 1 — The Field of Play, IFAB](https://www.theifab.com/laws/latest/the-field-of-play/) — pitch and marking dimensions
- [Football Pitch Field Dimensions & Drawings, Dimensions.com](https://www.dimensions.com/element/football-soccer-pitch-field) — penalty area, goal area, centre circle and arc measurements
- [Tactics — Football Manager 2026 Mobile, Sports Interactive](https://community.sports-interactive.com/sigames-manual/football-manager-mobile-2026/tactics-r5249/) — tap-and-tap / drag position editing on a pitch view
- [Match Day — Football Manager 2026 Mobile, Sports Interactive](https://community.sports-interactive.com/sigames-manual/football-manager-mobile-2026/match-day-r5263/) — full-pitch versus commentary-only match presentation modes
- [FM26's Reimagined User Interface, Football Manager](https://www.footballmanager.com/fm26/features/fm26s-reimagined-user-interface) — tactical visualiser and instruction integration
- [Score bug, Wikipedia](https://en.wikipedia.org/wiki/Score_bug) — origin of the persistent score bug at Sky Sports, 1992
- [Designing the Modern Scorebug, Sports Video Group](https://www.sportsvideo.org/2026/06/09/designing-the-modern-scorebug-how-broadcast-graphics-teams-are-rethinking-the-most-important-element-on-screen/) — contemporary scorebug hierarchy practice
- [What Is a Score Bug? Anatomy and Examples, Stream Builder](https://www.stream-builder.co.uk/blog/what-is-a-score-bug) — score bug content inventory
- [Visualising football, Soccermatics](https://soccermatics.readthedocs.io/en/latest/lesson1/VisualisingFootball.html) — shot map and pitch plotting conventions
- [From Data to Insights: Creating a Shot Map in Football](https://medium.com/@yogakrisanto1129/from-data-to-insights-a-python-tutorial-for-creating-a-shot-map-in-football-6e6f2caa4eef) — marker area encoding xG, half-pitch layouts, home/away separation
