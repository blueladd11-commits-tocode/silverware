# 08 — Logo & Visual Identity: SILVERWARE

**Owner:** Logo / Visual Identity
**Inputs:** `06-naming-brand.md` (name, promise, voice, exclusions) · `05-art-direction.md` (palette, type, visual system)
**Status:** decided and built. Working SVG shipped to `/brand/`.

**Built assets**

| File | What it is |
|---|---|
| `/brand/silverware-wordmark.svg` | Primary horizontal lockup — Cup mark + wordmark, brand colours |
| `/brand/silverware-icon.svg` | App icon / standalone mark, 1024×1024 full-bleed |
| `/brand/silverware-mono.svg` | Single-colour stacked lockup, `currentColor` |
| `/brand/_contact-sheet.html` | QA harness — renders all three at every critical size, light and dark. Open it before approving any change to the paths |

Every file is hand-built path geometry. **No fonts, no `<use>`, no `<image>`, no `url()`, no external references of any kind.** All three parse as well-formed XML and were rendered and visually inspected at 29 / 48 / 60 / 80 / 120 / 200 / 720 px before sign-off.

---

## 1. Concept exploration — six territories

The brief hands over one semantic core: **engraved metal**. Six ways to build a face from it. Each was drawn far enough to fail honestly.

### T1 — The Engraved Line
**Idea.** SILVERWARE cut into a horizontal rule, so the word reads as a name incised into the plate on a cup plinth — the rule passes behind the letters and the letters are the void.
**Why it fits.** It is the promise stated literally: your name, cut into metal, permanent. "You will be remembered" is a *typographic* claim before it is a pictorial one.
**Weakness.** Fatal at icon size. Incision is a lighting effect, and `05-art-direction.md` §2 explicitly bans gradients on chrome and skeuomorphism — without light the incision is just an outline. A wordmark-only identity also gives the store nothing: an app icon cannot be ten condensed letters at 60px.

### T2 — Trophy negative-space monogram
**Idea.** A single **S** whose two counters are shaped so the white space between them reads as a two-handled cup.
**Why it fits.** The clever-mark register (FedEx arrow, Yoga Australia) signals design confidence, and a monogram is the cheapest possible thing to scale.
**Weakness.** Two problems, either one disqualifying. First, `06-naming-brand.md` is explicit that the name is never abbreviated — a lone S trains the audience to abbreviate. Second, negative-space gags need ~200px and a moment of attention to fire; in a store search result you get 60px and 400 milliseconds. A gag nobody sees is just a wonky S.

### T3 — The medal / struck disc
**Idea.** A circular struck disc, off-centre in the frame, with a single incised device — the winner's medal rather than the trophy.
**Why it fits.** Medals are the *other* silverware, and a disc is the most robust shape in existence at small sizes. Round marks also survive Android's circular adaptive mask untouched.
**Weakness.** A disc with a device inside it is one heraldic step away from `roundel` and `roundel-ring` — two of the eight shield primitives the crest generator ships (`05-art-direction.md` §5.1). Our own procedural clubs would wear the brand's shape 2,500 times over. The logo must not be a member of the set it presides over. It also brushes the "no club-crest shape" exclusion.

### T4 — The plinth-plate lockup
**Idea.** The wordmark set on a rectangular plate with four corner rivets, as an engraved nameplate is actually fixed to a cup base.
**Why it fits.** The single most on-brief object in the whole territory, and it makes the tagline slot structural — "NOBODY REMEMBERS FIFTH." engraves onto the plate underneath.
**Weakness.** Rivets are ornament, and ornament is the first thing to die at 48px. A bounded plate also fights the app's own layout: everything in Floodlight is a flat panel with hairline rules, so a logo that is *itself* a panel disappears into the chrome. Demoted to a lockup variant, not the identity.

### T5 — Abstract S as trophy handle
**Idea.** The S built from two mirrored cup handles, so the letter and the object are the same stroke.
**Why it fits.** Elegant, ownable, and totally free of any real trophy's protected geometry.
**Weakness.** It reads as a ribbon, an ampersand fragment or a dollar sign long before it reads as a handle. Handles are only legible *attached to a bowl* — detached, they are just curves. High risk of the "what is that?" store review, which is the one review an icon cannot survive.

### T6 — The Cup ✅
**Idea.** One original two-handled cup on a stepped plinth, drawn as a hard geometric silhouette on the same rectilinear grid as the wordmark, at monumental scale, flat, in the brand's amber and near-black.
**Why it fits.** It is the point of the game rendered as an object, in a colour nobody else in the category owns. The engraving is expressed *structurally* — the plinth is the plate — rather than as a texture the art direction forbids. The bowl, plinth and handles are drawn with the same 90°/diagonal vocabulary as the letterforms, so the mark and the word are visibly the same alphabet.
**Weakness.** "A trophy" is the obvious answer, and obvious answers are easy to execute badly. The mark carries no defence except craft: geometry, colour, scale and restraint have to do all the work, because there is no idea to hide behind. It also has to be built carefully enough to be unmistakably *not* the UCL, PL or World Cup trophy.

---

## 2. The recommendation

> ### T6 — THE CUP, at monumental scale, amber ground, near-black mark, flat.

**Defence.**

1. **It is legible in the two places that decide the business.** A store search result at 60px, and a home screen at 60pt among sixty other icons. Every other territory here is a wordmark idea, a gag, or an ornament — none of them survive the crop. The Cup is a single high-contrast object with one silhouette, and it reads at 48px, verified by rendering rather than asserted.
2. **The differentiation is the colour, not the object.** The football-management category is green pitches, blue-and-orange gradients, cartoon managers, and shield-shaped badges. Amber `#FFC53D` at full commitment with no gradient and no outline is a beacon in that grid, and it is not a decorative choice — it is `accent/base`, the app's one hot accent, used exactly as `05-art-direction.md` §3.2 demands: "solid fills with dark text", never a thin stripe.
3. **It refuses the crest problem outright.** A cup is not a badge. It cannot be mistaken for a club, a league or a federation, which kills the single largest legal exposure in this category before it starts.
4. **It is the promise as a noun.** "Nobody remembers fifth" needs a first place to point at. Every other territory illustrates the *feeling* of winning; this one shows the thing you get.
5. **It is one system with the wordmark.** Both are drawn from horizontals, verticals and one repeated diagonal at the same weight. Put them together and they look drawn by the same hand on the same day — which is what makes an identity look expensive.

**Runner-up 1 — T4, the plinth-plate lockup.** Lost on size, not on idea. It is the most literally on-brief thing here and the best home for the tagline, but rivets and a bounding plate die below ~120px and it collides visually with Floodlight's own flat-panel chrome. **Kept as a sanctioned variant** for splash screens, end-cards and merch, built by setting the mono lockup inside a `surface/02` `#1A1F26` plate with a `border/strong` `#3A424E` hairline. It is a lockup, not the logo.

**Runner-up 2 — T1, the engraved line.** Lost on physics. Incision requires light, and the art direction bans the light. Executed flat it becomes an outlined wordmark, which is weaker than the solid wordmark we already have. Its real contribution survived: the wordmark's rectilinear, chisel-cut construction came out of this territory even though the treatment did not.

**Explicitly rejected and not revisited:** T2 (violates the no-abbreviation rule), T3 (collides with the crest generator's own `roundel` primitive), T5 (illegible without the object it belongs to).

---

## 3. The build

### 3.1 Construction system

Everything is drawn on **one grid, in one alphabet of moves**: horizontal, vertical, and diagonals of a single family. No curves anywhere in the identity. That is the whole styling decision, and it is why the mark and the word cohere.

**Letterforms.** A ten-glyph condensed uppercase, constructed as outlined paths — **there is no font dependency and nothing to install, licence or subset.**

| Parameter | Value |
|---|---|
| Cap height | 100 units |
| Stem weight | 17 units (17% of cap) |
| Tracking | 16 units (16% of cap) |
| Glyph widths | I 17 · L/E 52 · S 54 · V/A/R 58 · W 104 |
| Wordmark width | 707 units |
| Counters | `fill-rule="evenodd"` subpaths — no masks, no clip paths |

It sits deliberately close to **Archivo 800 Condensed**, the display face already specified in `05-art-direction.md` §4, so the logo and the app's own `display/hero` and `title/l` type read as relatives without the logo *being* set in a font that a licence, a renderer or a font-loading failure could take away.

**The Cup.** Authored once on a 1024 grid, used at three scales across the three files, so there is exactly one geometry to maintain.

| Part | Geometry |
|---|---|
| Rim | `x 292–732, y 240–296` |
| Bowl | trapezoid, `316–708` at top → `424–600` at `y 568` (21.6° from vertical) |
| Stem | `424–600` → `480–544` at `y 660` |
| Base slab | `x 404–620, y 660–708` |
| Plinth | `x 340–684, y 708–788` — *this is the engraved plate* |
| Handles | rectangular loops, `y 326–516`, bar weight 46, inner window's leading edge cut parallel to the bowl wall |
| Extents | `x 240–784` (544) × `y 240–788` (548) — near-square, centred on `x 512` |

Rim, bowl, stem, base and plinth are **a single continuous path**, not five stacked shapes, so there are no abutting-edge antialiasing seams at any scale. The handles are two separate `evenodd` paths that overlap the bowl — separate elements, so the overlap unions visually with no winding conflict.

**Originality / non-infringement.** The Champions League trophy is defined by huge curved ears and a bulbous bowl on a narrow foot; the Premier League trophy by a crown and ornate curved handles; the World Cup trophy is figurative. This form is a **plain geometric loving cup** — straight conical bowl, rectangular loop handles, two-step square plinth, no crown, no ornament, no figures, no curves at all. It is a public-domain vessel type rendered in a house geometry, and it shares no distinctive element with any protected design.

### 3.2 Primary wordmark — horizontal lockup

`/brand/silverware-wordmark.svg` · viewBox `0 0 958 196` · mark `#FFC53D`, word `#F4F6F8`, transparent ground.

The Cup is scaled to 148 units (1.48× cap height), **baseline-aligned** — its plinth sits on the word's baseline and it overshoots 48 units above the cap line, which is what stops the lockup reading as a word with a picture parked next to it. Gap between mark and word: 56 units.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 958 196" width="958" height="196" role="img" aria-label="Silverware">
  <title>Silverware</title>
  <g transform="translate(24 72)">

    <!-- THE CUP - authored on a 1024 grid, scaled 0.27, baseline-aligned -->
    <g id="mark" fill="#FFC53D" transform="translate(-64.8 -112.76) scale(0.27)">
      <path id="cup-body" d="M292 240H732V296H708L600 568L544 660H620V708H684V788H340V708H404V660H480L424 568L316 296H292Z"/>
      <path id="cup-handle-l" fill-rule="evenodd" d="M240 326H430V516H240Z M286 372H340L379 470H286Z"/>
      <path id="cup-handle-r" fill-rule="evenodd" d="M784 326H594V516H784Z M738 372H684L645 470H738Z"/>
    </g>

    <!-- WORDMARK - cap height 100, stem 17, tracking 16, total width 707 -->
    <g id="word" fill="#F4F6F8" transform="translate(203 0)">
      <path transform="translate(0 0)"   d="M0 0H54V17H17V41.5H54V100H0V83H37V58.5H0Z"/>
      <path transform="translate(70 0)"  d="M0 0H17V100H0Z"/>
      <path transform="translate(103 0)" d="M0 0H17V83H52V100H0Z"/>
      <path transform="translate(171 0)" d="M0 0H17L29 74L41 0H58L37 100H21Z"/>
      <path transform="translate(245 0)" d="M0 0H52V17H17V41.5H46V58.5H17V83H52V100H0Z"/>
      <path transform="translate(313 0)" fill-rule="evenodd" d="M0 0H58V58.5H17V100H0Z M17 17H41V41.5H17Z"/>
      <path transform="translate(313 0)" d="M30 55H47L58 100H41Z"/>
      <path transform="translate(387 0)" d="M0 0H15.2L26 74L36.8 0H52L33.2 100H18.8Z"/>
      <path transform="translate(387 0)" d="M52 0H67.2L78 74L88.8 0H104L85.2 100H70.8Z"/>
      <path transform="translate(507 0)" fill-rule="evenodd" d="M0 100L21 0H37L58 100H41L37 81H21L17 100Z M29 22L37.8 64H20.2Z"/>
      <path transform="translate(581 0)" fill-rule="evenodd" d="M0 0H58V58.5H17V100H0Z M17 17H41V41.5H17Z"/>
      <path transform="translate(581 0)" d="M30 55H47L58 100H41Z"/>
      <path transform="translate(655 0)" d="M0 0H52V17H17V41.5H46V58.5H17V83H52V100H0Z"/>
    </g>

  </g>
</svg>
```

**Extracting sub-assets.** `#mark` alone is the standalone Cup. `#word` alone is the word-only wordmark (707 × 100 units). Both are addressable groups — never redraw them, and never re-space the glyphs.

### 3.3 App icon / standalone mark

`/brand/silverware-icon.svg` · viewBox `0 0 1024 1024` · ground `#FFC53D`, cup `#0A0C0F`.

The Cup is scaled 1.30× about its optical centre so it occupies **69% of the icon width and 69.5% of its height**, leaving 156-unit margins — comfortably inside the 80% safe area every platform mask assumes.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024" role="img" aria-label="Silverware app icon">
  <title>Silverware app icon</title>

  <!-- GROUND: accent/base #FFC53D, full bleed -->
  <rect x="0" y="0" width="1024" height="1024" fill="#FFC53D"/>

  <g id="cup" fill="#0A0C0F" transform="translate(512 512) scale(1.30) translate(-512 -514)">
    <path id="cup-body" d="M292 240H732V296H708L600 568L544 660H620V708H684V788H340V708H404V660H480L424 568L316 296H292Z"/>
    <path id="cup-handle-l" fill-rule="evenodd" d="M240 326H430V516H240Z M286 372H340L379 470H286Z"/>
    <path id="cup-handle-r" fill-rule="evenodd" d="M784 326H594V516H784Z M738 372H684L645 470H738Z"/>
  </g>
</svg>
```

**How it degrades — measured, not guessed.** At 48px one icon pixel is 21.3 grid units. Rendered and inspected:

| Size | What happens | Verdict |
|---|---|---|
| **1024** | Full geometry. Rim overhangs, two-step plinth and the handle windows are all crisp. | ✅ store hero |
| **180 / 120** | Identical read. Nothing is lost. | ✅ |
| **80** | Base slab and plinth begin to merge into one stepped foot. Silhouette unchanged. | ✅ |
| **60** (iOS home screen) | Handle windows are ~4px, rim ~4px, plinth ~5.5px. Still unmistakably a two-handled cup. | ✅ **the target case, and it holds** |
| **48** | Handle bars ~2.6px, windows ~4.2px. The two-step foot reads as one tapered foot. Object still reads. | ✅ floor for "reads as a trophy" |
| **29** (Spotlight/Settings) | Windows close to ~2.5px and soften; it becomes a dark trophy-ish glyph on amber. Recognisable as *this app* by colour and mass, not by detail. | ⚠️ acceptable — no false read, just less detail |

The deliberate omissions that make this possible: **no engraved slot cut into the plinth, no outline, no bevel, no inner shadow, no text.** Every one of those was drawn and cut, because at 48px each becomes a sub-pixel smear that makes the whole icon look soft. Detail you cannot see does not read as detail; it reads as blur, and blur reads as cheap.

**Android adaptive icon.** The circular mask clips a 61%-diameter zone, and our handles sit at mid-height where a circle is widest — so do not ship the 1.30 file as an adaptive foreground. Build the foreground layer by changing one number: `scale(1.30)` → `scale(1.08)` (57% of the field), over a solid `#FFC53D` background layer. Nothing else changes.

### 3.4 Monochrome / single-colour

`/brand/silverware-mono.svg` · viewBox `0 0 755 451` · **stacked** — mark centred above the word.

Stacked rather than horizontal on purpose: the single-colour version's jobs are splash screens, watermarks, loading states, embossing and one-colour print, and all of them are vertical or square containers. Every fill is `currentColor`, so it inherits the colour of whatever it is dropped into — no recolouring, no variants to maintain, and it can be tinted per-context in code.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 755 451" width="755" height="451" role="img" aria-label="Silverware">
  <title>Silverware</title>
  <g fill="currentColor" transform="translate(24 270.6)">

    <!-- THE CUP - centred over the wordmark, scaled 0.45 -->
    <g id="mark" transform="translate(123.1 -354.6) scale(0.45)">
      <path d="M292 240H732V296H708L600 568L544 660H620V708H684V788H340V708H404V660H480L424 568L316 296H292Z"/>
      <path fill-rule="evenodd" d="M240 326H430V516H240Z M286 372H340L379 470H286Z"/>
      <path fill-rule="evenodd" d="M784 326H594V516H784Z M738 372H684L645 470H738Z"/>
    </g>

    <!-- WORDMARK -->
    <g id="word" transform="translate(0 56)">
      <path transform="translate(0 0)"   d="M0 0H54V17H17V41.5H54V100H0V83H37V58.5H0Z"/>
      <path transform="translate(70 0)"  d="M0 0H17V100H0Z"/>
      <path transform="translate(103 0)" d="M0 0H17V83H52V100H0Z"/>
      <path transform="translate(171 0)" d="M0 0H17L29 74L41 0H58L37 100H21Z"/>
      <path transform="translate(245 0)" d="M0 0H52V17H17V41.5H46V58.5H17V83H52V100H0Z"/>
      <path transform="translate(313 0)" fill-rule="evenodd" d="M0 0H58V58.5H17V100H0Z M17 17H41V41.5H17Z"/>
      <path transform="translate(313 0)" d="M30 55H47L58 100H41Z"/>
      <path transform="translate(387 0)" d="M0 0H15.2L26 74L36.8 0H52L33.2 100H18.8Z"/>
      <path transform="translate(387 0)" d="M52 0H67.2L78 74L88.8 0H104L85.2 100H70.8Z"/>
      <path transform="translate(507 0)" fill-rule="evenodd" d="M0 100L21 0H37L58 100H41L37 81H21L17 100Z M29 22L37.8 64H20.2Z"/>
      <path transform="translate(581 0)" fill-rule="evenodd" d="M0 0H58V58.5H17V100H0Z M17 17H41V41.5H17Z"/>
      <path transform="translate(581 0)" d="M30 55H47L58 100H41Z"/>
      <path transform="translate(655 0)" d="M0 0H52V17H17V41.5H46V58.5H17V83H52V100H0Z"/>
    </g>

  </g>
</svg>
```

> **Note for anyone embedding it.** `currentColor` inherits from the *containing element*. Inline the SVG, or set `color` on its wrapper. Loaded through `<img src>` it becomes an independent document and falls back to black — correct on light grounds, invisible on dark. On dark, inline it.

### 3.5 Fonts

**No font is required to render any of the three files.** All ten letterforms are outlined path geometry.

Where a font *is* needed — taglines, store art, splash sub-copy set beneath the mark — use the families already cleared in `05-art-direction.md` §4: **Archivo** (Omnibus-Type) and **Inter** (Rasmus Andersson), both **SIL Open Font License 1.1**, which explicitly permits bundling, embedding and redistribution inside commercial software. Neither family may be renamed or forked (Reserved Font Name); ship the upstream binaries subsetted with `OFL.txt` in the in-app Licences screen. Tagline setting: **Archivo 700 Condensed, uppercase, +6% tracking** — the `label/s` treatment scaled up.

---

## 4. Usage rules

### 4.1 Clear space

**Clear space = 0.5 × cap height (50 grid units) on all four sides**, measured from the lockup's bounding box. Nothing enters it — no text, no rule, no crest, no screen edge, no card border.

All three files already carry **24 units** of that as built-in padding inside the viewBox. When placing them, add the remaining half yourself; do not assume the file's padding is the whole allowance.

### 4.2 Minimum sizes

| Asset | Minimum | Why |
|---|---|---|
| Full horizontal lockup | **120 px wide** | below this the 17-unit stems fall under 2.1px and the wordmark greys out |
| Word only (`#word`) | **96 px wide** | cap height 13.6px, stem 2.3px |
| Cup mark alone | **32 px** | handle bars 2.7px; **24px is the absolute floor**, below which use the app icon, not the mark |
| Stacked mono lockup | **110 px wide** | |
| App icon | **48 px** for the object to read; **29 px** is the smallest sanctioned placement | see §3.3 |

Never scale the mark and the word independently. Scale the lockup as a unit.

### 4.3 Approved backgrounds

Hex values are the live tokens from `05-art-direction.md` §3.

**Dark (default and primary):**

| Token | Hex | Wordmark version |
|---|---|---|
| `bg/base` | `#0A0C0F` | Primary — mark `#FFC53D`, word `#F4F6F8` |
| `surface/01` | `#12161B` | Primary |
| `surface/02` | `#1A1F26` | Primary |
| `surface/03` | `#232A33` | Primary |

Word `#F4F6F8` on `#12161B` is **16.76:1**. Mark `#FFC53D` on `#12161B` is **11.51:1**. Both AAA.

**Amber:**

| Token | Hex | Version |
|---|---|---|
| `accent/base` | `#FFC53D` | **Mono, in `#0A0C0F`.** Never the two-colour lockup — the mark would vanish into the ground. 12.41:1 |
| `accent/press` | `#E5A81F` | Mono, `#0A0C0F` |

**Light (Daylight, v1.1):**

| Token | Hex | Version |
|---|---|---|
| `bg/base` | `#F5F7FA` | **Mono, in `text/primary` `#0E1319`** |
| `surface/01` | `#FFFFFF` | Mono, `#0E1319` |

On light grounds the amber mark is not permitted as a solo element — `#FFC53D` on white is under 2:1. If the accent must appear on light, it appears as a **fill behind** dark artwork, never as the artwork. This is the same rule `05-art-direction.md` §3.4 applies to `accent/text`.

**Photography and video:** only over a solid `#0A0C0F` plate or a full-bleed `#0A0C0F` scrim at ≥80% opacity. Never directly on an image, and never on the abstract stadium backdrop plates without a plate behind it.

### 4.4 Never do this

1. **Never add "FC"** — not as prefix, suffix, subtitle, icon element or file name.
2. **Never put "Football" and "Manager" adjacent** to the mark in any lockup, store field, screenshot or key art. If "manager" is needed for ASO it goes in the invisible keyword field.
3. **Never set the mark inside a shield, badge, roundel or ring.** Those are crest-generator primitives; the logo must not join the set it presides over.
4. **Never abbreviate to "SW", "S/W" or a lone S.** One word, always whole, never "Silver Ware", never hyphenated, never broken across two lines.
5. **Never redraw the letterforms in a font.** Not in Archivo, not in Inter, not in anything. The paths are the wordmark.
6. **Never re-space, condense, extend, slant, arch or outline the wordmark.**
7. **No gradients, bevels, embossing, drop shadows, inner shadows, glows or metallic sheen** — on the mark or the icon. This is a direct instruction from `05-art-direction.md` §2, and "engraved" here means *structural*, not shaded.
8. **Never recolour** outside the table in §4.3. No club colours, no seasonal palettes, no rainbow, no gold.
9. **Never add a year, edition number or version suffix** ("Silverware 27", "Silverware II"). It reads as an annualised franchise and points straight at the marks we are avoiding.
10. **Never depict a real trophy** beside, behind or inside the mark. Not the UCL cup, not the PL cup, not the World Cup, not a real medal or a real league logo.
11. **Never place the mark on `border/*` greys or on `sem/*` colours** — win green, loss red, injury orange. The logo is never a status.
12. **Never animate the letterforms.** The Cup may fade and scale on splash (280ms, `ease/emphasised`) and it is one of the two permitted particle moments per season. The word arrives, or it does not.
13. **Never crop the mark or bleed it off an edge** except in the sanctioned oversize watermark, at ≤8% opacity, behind content, mono only.
14. **Never rotate.** Zero degrees, always.

---

## 5. App icon strategy

An app icon is the only piece of this identity that most people will ever see. It is not a logo application — **it is the ad**, and it competes in a 60-pixel square against every other result on the page.

### 5.1 What it has to achieve at thumbnail size

Four jobs, in strict order:

1. **Be seen.** Before it is read, it has to survive peripheral vision in a scrolling grid. That is a colour and mass problem, not a drawing problem.
2. **Say "football" in under 400ms** — without the word "football", which the title is already spending its 30 characters on.
3. **Say "premium", not "free-to-play".** This is the entire commercial argument for the game, and it is decided by the icon before anyone reads a single review.
4. **Be findable again.** After install, it has to be located on a home screen of sixty icons in one glance, by colour and silhouette alone.

### 5.2 What the category does

Football management on mobile has converged hard, and it converged on the same four moves: **a pitch-green or blue-green ground; a shield or badge silhouette; a rendered or cartooned human manager; and a soft gradient with a highlight or bevel.** Top Eleven, OSM, Football Chairman and FM Mobile each land on three or four of the four. ([Top Eleven — App Store](https://apps.apple.com/us/app/top-eleven-be-a-soccer-manager/id459035295) · [Online Soccer Manager — App Store](https://apps.apple.com/us/app/online-soccer-manager-osm/id400201466))

The convergence is not stupid — green says football and a badge says club. It is just **saturated**. In a search result for "football manager", four green-and-blue badge icons in a column are indistinguishable from each other, and a fifth is invisible. Worse, gradient-plus-bevel is the single most reliable free-to-play signal on the store; it is the visual grammar of a game that will ask you for money in nine minutes. Top Eleven even ships *alternate* competition-themed icons — which tells you how hard the category is working to be noticed inside its own conventions rather than outside them.

### 5.3 How ours beats it

| The category's move | Ours | Why it wins at 60px |
|---|---|---|
| Pitch green / blue-green | **Amber `#FFC53D`, full bleed** | Warm against a column of cool. The only amber icon on the results page, and 12.41:1 against its own mark |
| Shield or badge outline | **A cup — no container at all** | The mark *is* the shape. No frame stealing pixels from the object |
| Gradient + bevel + highlight | **Flat. One colour on one colour.** | Zero rendering cost at small size — every pixel that isn't ground is object. Also the strongest available "this is a serious product" signal |
| A person, a ball, a badge | **The prize** | Competitors show the job. We show the point of the job — and it matches the name at a glance |
| Object at 40–50% of the frame | **Object at 69%** | Monumental scale is what survives downscaling; small centred objects turn to soup first |

**Why amber ground and dark mark, and not the reverse.** A near-black icon with an amber cup is the more fashionable choice and it matches the app's interior — but it disappears on a dark wallpaper, which is what most of this audience runs, and it loses the peripheral-vision fight in a store grid. Amber-ground wins on every metric that has money attached. The inverse (ground `#0A0C0F`, cup `#FFC53D`) is retained as the **Dark variant** for splash screens, press kits, and any surface that is already dark and already ours — never for the store.

**The premium comes from what is missing.** No outline, no shadow, no gradient, no highlight, no text, no character, no sparkle, no badge. One object, one colour, one edge, enormous negative space. It is a Swiss poster in a 60px square, and everything around it in the search results is a 3D render — which is exactly the gap the positioning is built on.

### 5.4 Export

Ship **one 1024×1024 PNG** from `/brand/silverware-icon.svg` for iOS and let the OS downscale — the geometry is built to survive it, and §3.3 documents each step. Do not hand-tune per-size variants; that is how icon families drift.

- **iOS:** 1024 marketing asset; the system generates 180 / 167 / 152 / 120 / 87 / 80 / 76 / 60 / 58 / 40 / 29. Square, no rounding, no alpha, no pre-applied mask.
- **Android adaptive:** background layer solid `#FFC53D`; foreground layer the cup at `scale(1.08)` (see §3.3).
- **Google Play store icon:** 512×512, 32-bit PNG, same art.
- **Feature graphic (1024×500):** Cup mark left, `#0A0C0F` ground, mono lockup in `#F4F6F8`, tagline **NOBODY REMEMBERS FIFTH.** in Archivo 700 Condensed. No screenshots inside it, no device frames.

### 5.5 Before any change ships

Open `/brand/_contact-sheet.html`. It renders all three assets at every size in this document, on dark and light. Any edit to the paths gets re-checked at **48px and 60px first** — if it does not hold there, it does not ship, however good it looks at 1024.

---

## 6. Open items for the trademark filing

From `06-naming-brand.md` Part B: file the **stylised lockup** in Class 9 and Class 41, not the bare word, because SilverWare POS (Markham, ON) holds Class 9/42 in hospitality software. The lockup filed should be **`/brand/silverware-wordmark.svg`** — the Cup plus the constructed letterforms — since the distinctiveness lives in the combination, not the dictionary word. Commission the clearance search before any spend on the identity.
