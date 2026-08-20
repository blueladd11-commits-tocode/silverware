# 09 — Visual UI Research: making SILVERWARE look like a football game

**Owner:** Mobile UI Design Research
**Scope:** the *visual* language — composition, imagery ratio, card anatomy, data-as-graphics, depth, motion, screen archetypes.
**Out of scope:** navigation and IA (`04-ux-architecture.md`), the token system and type stack (`05-art-direction.md`), logo (`08-logo-identity.md`).
**Status:** v1, prescriptive. Supersedes the *visual density* half of 05; keeps its token names.

---

## 0. The diagnosis, stated plainly

The owner's verdict — *"the UI doesn't look like a football game at all. Looks like operations at NASA"* — is not a complaint about taste. It is a structural description, and it is accurate.

I read the shipped prototype (`prototype/silverware.html`, ~455 KB, 24 modules). What it actually renders, per screen, is:

- **rows of text** (`.plr`, `.nm2`, `.meta`, `.dim`) — name, position, nation, age, ability, price, all as glyphs;
- **coloured numerals** as the primary encoding of ability (`ramp()` → a hex on a `<div>`);
- **hairline-separated flat panels** (`--hair:#2C333D`, no shadow, no gradient, no radius beyond a token);
- **two genuinely graphical assets** — `crestSVG()` and `pface()` — rendered at **12–40 px**, i.e. at sizes where they function as bullet points, not as imagery.

That last line is the whole problem in one sentence. **We already built the two hardest visual assets in the product and then rendered them at favicon size.** A 38 px procedural face next to three lines of 12 px text is a list row with a decoration. A 96 px face inside a framed, tiered, gradient-lit card *is a football game*.

The mistake in `05-art-direction.md` was not the palette — the amber-on-near-black is genuinely good and I recommend keeping it (see §8). The mistake was the reference set. It benchmarked **broadcast graphics packages and score apps** (Sky, DAZN, Sofascore, FotMob, FM24). Those are *reading* products: you look at them for 20 seconds to extract a fact. Games are *holding* products: you look at them for 40 minutes to feel something. Sofascore's job is to tell you the score. FC Mobile's job is to make you want the card.

Editorial restraint is the correct instinct applied to the wrong product category. The fix is not to abandon it — a garish reskin would be worse — but to **raise the graphic weight of the atomic objects by roughly 4× while keeping the ground calm.**

---

## 1. The top-grossing visual language

### 1.1 Comparison table

Sources are app-store screenshot sets, the Game UI Database catalogue, and published teardowns (see §11). "Img:Txt" is my estimate of the share of screen area occupied by graphic marks vs. type on a representative *meta* screen (not gameplay) — method in §2.1.

| Game | Ground | Accent strategy | Atomic object | Shape language | Depth | Img:Txt | Signature device to steal |
|---|---|---|---|---|---|---|---|
| **EA FC Mobile** | Near-black + team-colour wash | One hot accent per event (cyan/gold), high commitment | **Player card**, 3:4, tiered frame | Angular, chamfered corners, diagonal cuts | Heavy: drop shadow + inner rim light + gradient plate | ~72:28 | Card *is* the row. Rating numeral is the largest glyph on screen. |
| **eFootball** | Dark navy → black vertical gradient | Cool blue-white, restrained | Player card, portrait-dominant | Softer rounds, thin metallic strokes | Medium: gradient + hairline chrome | ~68:32 | Position badge as a filled lozenge, never plain text. |
| **Dream League Soccer** | Mid-dark with pitch-green undertone | Saturated green/blue | Kit + crest lockup | Chunky rounds, 12–16 px radius | Light-medium, flat-ish cards | ~60:40 | Kit render as identity — you recognise your team by *stripes*, not name. |
| **Top Eleven** | Dark grey-blue, textured | Orange/green, functional | Player row **with a portrait ring** | Rounded, utilitarian | Low — closest to us today | ~45:55 | The nearest neighbour to SILVERWARE, and notably the least visually loved of the set. |
| **MADFUT** | Pure black | Card art carries all colour | **The card, alone** | Card silhouette is the shape language | Card-intrinsic (foil, gradient, glow) | ~85:15 | Whole app is a card gallery. Proof a football game can be ~all cards and still be readable. |
| **Score! Hero** | Bright, high-key | Multi-colour | Level node / hero portrait | Very round, bubble buttons | Bevel + glow | ~70:30 | Progress as a *path of nodes*, not a percentage. |
| **Clash Royale** | Warm mid-blue, never black | Yellow = primary action, green = secondary, blue = ground | **Card**, 3:4, rarity-framed | Chunky rounds, thick 3–4 px strokes | Bevel, inner glow, drop shadow, gold rim | ~75:25 | Rarity frame + radial elixir ring; colour hierarchy is *documented policy*, not vibes. |
| **Brawl Stars** | Saturated, high contrast | Per-brawler colour identity | Brawler portrait tile | Oversized, cartoon-weight strokes | Strong rim light, cast shadow | ~80:20 | Oversized icons; silhouette readability at 60 px. |
| **Royal Match** | Warm stone/blue, tactile | Gold + royal blue | Level button / booster icon | Extremely round, soft | Baked-light 3D render feel | ~85:15 | Clean chrome — no pop-up clutter is *why* it reads premium at $4M/day. |
| **Monopoly GO** | Bright board, whimsical | Multi-colour, candy | Board tile / sticker card | Round, sticker-cut outlines | Sticker: white outline + drop shadow | ~80:20 | Sticker-cut treatment — a 2 px light outline makes any object read as a physical thing. |
| **Genshin Impact** | Translucent dark over art | Element colours (7) as a fixed system | Character card | Ornamented rounds, filigree corners | Layered translucency + blur | ~70:30 | Element colour is a *taxonomy*, learned once, used everywhere. |

### 1.2 What they all share, structurally

Seven traits appear in **every** title above and in **none** of our current screens:

1. **A framed atomic object, ≥120 px on its short edge.** Every one of these games has one repeated rectangle that is unmistakably *a thing you own*. Ours is a list row.
2. **Hero zone in the top 30–40% of the screen.** A large, graphic, non-scrolling area that establishes identity before any data. Ours starts with a topbar and immediately begins listing.
3. **Non-uniform tile sizes.** The most important object on screen is 2–4× the area of the second. Our rows are all the same height, which is exactly why it reads as a spreadsheet.
4. **Colour as taxonomy, not decoration.** Rarity tiers, element colours, team colours — a closed set of 5–7 hues the player *learns*. We have a 5-stop heat ramp (good) but it is applied to a 14 px numeral (wasted).
5. **Depth stack of ≥3 layers.** Ground → plate → object → glow/badge overlay. We have ground → flat panel. Two layers reads as a document.
6. **Chunky geometry.** Radii of 12–20 px on containers, 3–4 px strokes, 44–56 px touch targets. Our hairlines are 1 px at 1.4:1 contrast — invisible, and invisibility reads as *cheap* rather than *restrained* on a phone at arm's length.
7. **Numbers are rendered as objects.** A rating is not `<div>78</div>`; it is a numeral inside a shape with a fill, a stroke and a shadow.

### 1.3 The one trait we should *not* copy

Mascots and characters. Clash Royale, Brawl Stars, Monopoly GO and Royal Match all lean on a cast. We legally cannot use real players, and inventing a cartoon mascot would fight the "serious football product" positioning that the naming and brand work (`06`, `08`) committed to. **Our substitute for a mascot is the procedural face** — `pface()` already generates a distinct, ownable human per player. Rendered large, it does the mascot's job (identity, attachment, recognisability) without the tonal cost.

---

## 2. The image-to-text ratio — the crux

### 2.1 Method and honest caveat

There is no published study that measures this. I estimated it by taking a representative meta screen from each title's store screenshots and classifying every region as **graphic** (illustration, portrait, frame, badge, gradient plate, ring, bar, icon, crest) or **type** (any glyph run intended to be read as language, plus its padding). Numerals inside a shape count as graphic; numerals on a bare background count as type. These are ±8 percentage-point estimates, not measurements. The *ranking* is reliable; the decimals are not.

### 2.2 The numbers

| Category | Graphic share | Type share |
|---|---|---|
| Top-grossing casual (Royal Match, Monopoly GO, MADFUT) | 80–85% | 15–20% |
| Top-grossing mid-core (Clash Royale, Brawl Stars, Genshin) | 70–80% | 20–30% |
| Football games (FC Mobile, eFootball, DLS) | 60–72% | 28–40% |
| Score/data apps (Sofascore, FotMob) | 25–35% | 65–75% |
| **SILVERWARE today** | **~15–20%** | **~80–85%** |
| **SILVERWARE target** | **55–65%** | **35–45%** |

We are sitting on the *data-app* side of the line — further from FC Mobile than Sofascore is. That is the measurable form of "looks like operations at NASA."

I am deliberately **not** proposing 80%. A management game has irreducible language: contract terms, board messages, press questions, tactical instructions. 60/40 is the honest ceiling and it is enough — it is roughly where Dream League Soccer sits, and nobody says DLS looks like a spreadsheet.

### 2.3 How they convey information without words

The techniques, ranked by how much text they eliminate per pixel spent:

| Technique | Replaces | Where it's from | Our use |
|---|---|---|---|
| **Tier colour + frame** | "Rarity: Gold", "Quality: Elite" | FUT, Clash Royale | Ability band on the player card |
| **Progress ring** | "Fitness: 82%" | Clash Royale elixir, Apple rings | Condition |
| **Pips / segmented bar** | "Potential: 4 of 5" | Genshin constellation, star ratings | Potential, scout confidence |
| **W/D/L chip row** | "Last 5: W W D L W" | Every score app | Form (we already have `fstrip()` — keep, enlarge) |
| **Position lozenge** | "Position: Striker" | eFootball, FUT | Filled pill, position-family coloured |
| **Chevron / delta arrow** | "up 3 places" | Financial UI | League movement, value change |
| **Shield / badge silhouette** | "Captain", "Injured", "Suspended" | FUT badges | Status corner-badges on the card |
| **Size as magnitude** | "Most important item" | All | Hero card 2× squad card |
| **Heat fill** | Numeric attribute value | FM, sports analytics | Attribute spokes |
| **Crest + 3-letter code** | Full club name | Broadcast | Already in `crestSVG()` — enlarge |

**Rule to adopt:** *any label whose value set has ≤7 members must have a non-text encoding as its primary channel, with the word available on tap.* Position (7 families), form (3 states), morale (5 bands), condition (5 bands), tier (6 bands), transfer status (5 states) all qualify. That single rule removes an estimated 40% of the glyphs currently on a squad screen.

**Accessibility guard (carried forward from 05, non-negotiable):** colour is never the *only* channel. Every W/D/L chip keeps its letter. Every tier frame has a distinct *shape* cue as well as a hue (§3.4). Every money delta keeps its `+`/`−`.

---

## 3. The player card — our atomic unit

### 3.1 Why the card format works emotionally

Four mechanisms, all of which survive the loss of photography:

1. **Ownership framing.** A bounded rectangle with a frame reads as an *object with an edge*, and objects with edges can be possessed, collected, traded and lost. A list row cannot. This is why FUT's economy works and why a squad list feels like admin.
2. **Constant hierarchy.** The rating is always top-left, always the biggest glyph. After ten seconds of exposure the player stops *reading* the card and starts *pattern-matching* it. Every card in the corpus above obeys a fixed skeleton for exactly this reason — and it is the same reason FUT moved chemistry style to the bottom when name and rating needed priority.
3. **Tier legibility at a glance.** Colour-coded frames mean a 40-card grid is parsed in under two seconds — you see the *distribution* before you read a single name.
4. **The face.** A human face is the single highest-salience object in visual perception. Even a crude, geometric, obviously-synthetic face pulls attention and generates attachment. Our `pface()` generator already produces per-player variation in skin, hair, beard, head width and kit colours from a seed.

### 3.2 Anatomy — the SILVERWARE card

Aspect **3:4** (matches FUT ~0.72 and standard trading cards ~0.716). Three sizes:

| Variant | Size | Used on |
|---|---|---|
| `--card-sm` | 96 × 128 | Formation pitch tokens, bench strip |
| `--card-md` | 132 × 176 | Squad grid, transfer results, shortlist |
| `--card-lg` | 264 × 352 | Player detail hero, transfer offer, reveal moments |

Zones (percentages of card height):

```
┌─────────────────────────────┐
│ ▓ RAIL 22% w  │  PORTRAIT   │  0–62%   portrait plate + face
│   rating 34px │  face 62%h  │          rail: rating, position
│   pos lozenge │  ↖ status   │          badge corner: status
│   pips        │             │
├───────────────┴─────────────┤
│  SURNAME (condensed caps)   │  62–78%  name strip, 1 line
├─────────────────────────────┤
│  ⬤ crest ABBR   ·   ▮▮▮▯▯   │  78–100% club lockup + form
└─────────────────────────────┘
     ▲ 2px tier frame, chamfered bottom-left corner
```

Rules:
- **Surname only** on `sm`/`md`. Full name on `lg`. Truncation is a design failure — pick the shorter token.
- **Rating is the largest glyph on the card at every size** (34 px on `md`, 64 px on `lg`), tabular numerals, tier-coloured.
- **Never more than 9 words of type on an `md` card.**
- Chamfer the **bottom-left corner at 45°/14 px** — it echoes the diagonal-cut language from `05` and makes the silhouette ownable at thumbnail size.

### 3.3 Tier system

Mapped onto the existing `CA()` scale (breakpoints from `ramp()` at 45/58/72/85, so this is a superset, not a replacement):

| Tier | CA range | Frame | Plate gradient | Shape cue |
|---|---|---|---|---|
| `iron` | < 45 | `#6E7885` | `#1A1F26 → #12161B` | flat corner |
| `bronze` | 45–57 | `#C1783C` | `#2A1C10 → #16110C` | flat corner |
| `silver` | 58–71 | `#B9C3CE` | `#232A33 → #141A20` | single notch |
| `gold` | 72–84 | `#FFC53D` | `#3A2E10 → #17130A` | single notch |
| `elite` | 85–91 | `#7FD9FF` | `#0E2A38 → #08161E` | double notch + rim light |
| `silverware` | 92+ | `#F4F6F8` on black | `#1A1A1A → #000` + sheen | double notch + animated sheen |

Six tiers is the right number: five is not enough granularity for a 30–95 scale, eight becomes unlearnable. Note `elite` uses the existing `focus/ring` cyan and `gold` uses `accent/base` — no new hues invented.

### 3.4 Reference implementation (self-contained, no assets)

```html
<style>
:root{
  --bg:#0A0C0F; --s1:#12161B; --s2:#1A1F26; --t1:#F4F6F8; --t2:#A8B2BF;
  --acc:#FFC53D;
  --noise:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='.4'/%3E%3C/svg%3E");
}
/* THREE gotchas, all solved below:
   1. clip-path clips outer box-shadows away  → cast shadow becomes a filter on
      the wrapper (filters follow the clipped silhouette).
   2. an `inset 0 0 0 2px` frame gets clipped at the chamfers, leaving the
      diagonal edge unframed → the frame is a real 2px padded layer instead.
   3. one shared --chamfer keeps both clip paths identical.                    */
.pc-wrap{
  --chamfer:14px; --tier:#FFC53D; --plate-a:#3A2E10; --plate-b:#17130A;
  display:inline-block; width:132px; aspect-ratio:3/4; padding:2px;
  background:var(--tier);                        /* becomes the frame */
  clip-path:polygon(var(--chamfer) 0,calc(100% - var(--chamfer)) 0,
                    100% var(--chamfer),100% 100%,var(--chamfer) 100%,
                    0 calc(100% - var(--chamfer)),0 var(--chamfer));
  filter:drop-shadow(0 1px 2px rgba(0,0,0,.6)) drop-shadow(0 12px 20px rgba(0,0,0,.7));
  transition:transform .22s cubic-bezier(.34,1.56,.64,1);
  will-change:transform;
}
.pc-wrap:active{ transform:translateY(2px) scale(.97); }
.pc{
  position:relative; width:100%; height:100%;
  display:grid; grid-template-rows:62% 16% 22%;
  clip-path:polygon(calc(var(--chamfer) - 2px) 0,calc(100% - var(--chamfer) + 2px) 0,
                    100% calc(var(--chamfer) - 2px),100% 100%,
                    calc(var(--chamfer) - 2px) 100%,
                    0 calc(100% - var(--chamfer) + 2px),0 calc(var(--chamfer) - 2px));
  background:
    var(--noise),
    linear-gradient(155deg,var(--plate-a) 0%,var(--plate-b) 62%),
    var(--s1);
  background-blend-mode:overlay,normal,normal;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.22),        /* rim light, top edge */
    inset 0 -30px 40px -30px rgba(0,0,0,.9);    /* base vignette */
}
.pc::after{                                     /* diagonal sheen */
  content:""; position:absolute; inset:0; pointer-events:none;
  background:linear-gradient(112deg,transparent 38%,rgba(255,255,255,.10) 47%,transparent 56%);
}
.pc .top{ position:relative; display:grid; grid-template-columns:30% 1fr; }
.pc .rail{ padding:8px 0 0 8px; display:flex; flex-direction:column; gap:4px; align-items:flex-start; }
.pc .rating{
  font:800 34px/0.9 'Archivo',system-ui,sans-serif; font-variant-numeric:tabular-nums;
  color:var(--tier); letter-spacing:-.02em;
  text-shadow:0 2px 0 rgba(0,0,0,.55);
}
.pc .pos{
  font:800 10px/1 'Inter',system-ui,sans-serif; letter-spacing:.08em;
  padding:3px 6px; border-radius:999px; color:#0A0C0F; background:var(--posc,#A9D94B);
}
.pc .pips{ display:flex; gap:2px; }
.pc .pips i{ width:6px; height:6px; border-radius:1px; background:#3A424E; }
.pc .pips i.on{ background:var(--tier); box-shadow:0 0 5px var(--tier); }
.pc .face{ align-self:end; width:100%; height:100%; object-fit:contain; }
.pc .name{
  display:flex; align-items:center; justify-content:center;
  font:700 15px/1 'Archivo',system-ui,sans-serif; text-transform:uppercase;
  letter-spacing:.04em; color:var(--t1);
  background:linear-gradient(180deg,rgba(0,0,0,.35),rgba(0,0,0,.6));
  border-block:1px solid rgba(255,255,255,.09);
}
.pc .foot{ display:flex; align-items:center; gap:6px; padding:0 8px; }
.pc .abbr{ font:700 11px/1 'Inter',system-ui,sans-serif; color:var(--t2); letter-spacing:.06em; }
.pc .form{ margin-left:auto; display:flex; gap:2px; }
.pc .form i{ width:7px; height:7px; border-radius:1px; }
</style>

<div class="pc-wrap" style="--tier:#FFC53D;--plate-a:#3A2E10;--plate-b:#17130A;--posc:#F0484F">
 <div class="pc">
  <div class="top">
    <div class="rail">
      <div class="rating">78</div>
      <div class="pos">ST</div>
      <div class="pips"><i class="on"></i><i class="on"></i><i class="on"></i><i class="on"></i><i></i></div>
    </div>
    <!-- pface(p, 96) output drops in here unchanged -->
    <svg class="face" viewBox="0 0 100 100" aria-hidden="true"><!-- procedural face --></svg>
  </div>
  <div class="name">OYELARAN</div>
  <div class="foot">
    <!-- crestSVG(club, 16) -->
    <svg width="16" height="17" viewBox="0 0 100 110" aria-hidden="true"><!-- crest --></svg>
    <span class="abbr">NWC</span>
    <span class="form">
      <i style="background:#35D07F"></i><i style="background:#35D07F"></i>
      <i style="background:#9AA4B2"></i><i style="background:#F0484F"></i>
      <i style="background:#35D07F"></i>
    </span>
  </div>
 </div>
</div>
```

Verified in Chrome/Safari/Firefox: `clip-path` with `calc()` inside `polygon()`, `aspect-ratio`, `background-blend-mode` and layered `drop-shadow()` filters are all baseline-supported. `@property` (§4.2) is the only newer feature used and it degrades to an instant, un-animated ring where unsupported.

**Cost note:** this is ~60 lines of CSS and it consumes `pface()` and `crestSVG()` **unmodified**. The only change needed in the generators is to stop hard-coding `class="face"` sizing assumptions and accept a size argument (they already do). This is the highest ratio of visual gain to engineering cost in the entire document.

### 3.5 Minimum viable version

If only one thing ships: **frame + rating + face + name strip**, no pips, no form, no crest. That is four elements and it already reads as a football card. Everything else is refinement.

---

## 4. Making data visual

Our data types, with a mandated visual encoding for each. Ranges taken from the prototype (`CA()` ≈ 30–95, `cond` 0–100, `morale` 0–100, `form` signed small integer, `p.a[i]` attribute array of 8).

| Data | Range | Primary visual encoding | Secondary | Text shown? |
|---|---|---|---|---|
| **Ability (CA)** | 30–95 | **Tier frame colour** on the card + large tier-coloured numeral | Card size in hero contexts | Numeral, always (it's the one number players want) |
| **Potential (PA)** | 30–95 | **5 pips**, filled to `round((PA-30)/13)`; unfilled pips are `#3A424E` | Pip glow when PA−CA ≥ 12 ("headroom") | On tap only |
| **Scout confidence** | 0–1 | **Pip blur + dashed frame** — low knowledge renders the rating as `??` on a hatched plate | Desaturated tier colour | Never — uncertainty must *look* uncertain |
| **Form** | −3…+3 | **5-chip W/D/L strip** (existing `fstrip()`), enlarged to 7 px chips with letters at `lg` | Chevron ▲▬▼ on the numeral | Letters inside chips |
| **Condition** | 0–100 | **Progress ring**, 3 px stroke, wrapping the position lozenge; heat-ramped | Ring turns `--inj` and pulses under 60 | On tap only |
| **Morale** | 0–100 | **Face expression** — mouth curve on `pface()`, 5 states | Mood glyph badge in card corner | Word on the player detail screen |
| **Money / value** | £ | **Bar width relative to your balance** + `+`/`−` colour | Bold tabular numeral, abbreviated (£1.4m) | Numeral, always |
| **Wage vs budget** | % | **Stacked horizontal bar**, your player as a highlighted segment of the wage bill | Segment glows on hover/select | % on tap |
| **Attributes (8)** | 1–20 | **Octagonal radar**, tier-coloured fill at 30% opacity, 2 px stroke | Spoke tips as pips | Numerals inside the radar at `lg` only |
| **League position** | 1–20 | **Position chip** + delta chevron; zone colour bar on the left edge of the row | Row height +20% for your club | Ordinal, always |
| **Fatigue risk** | derived | **Diagonal hazard hatching** across the card's bottom-left chamfer | — | On tap |
| **Contract expiry** | months | **Depleting arc** on the card's bottom-right corner, red under 6 months | — | Date on detail |

### 4.1 Morale via facial expression — the highest-leverage idea in this document

`pface()` already draws a mouth-ish region implicitly. Adding **one path** parameterised by morale gives us an emotional read of the entire squad at a glance, with zero new assets and zero words:

```js
// morale 0-100 → mouth control point. -6 (deep frown) … +6 (grin)
const m = (p.morale - 50) / 50 * 6;
const mouth = `<path d="M42 68 Q50 ${68 + m} 58 68" stroke="${shade}"
   stroke-width="2.2" stroke-linecap="round" fill="none"/>`;
```

A squad screen where the unhappy players are visibly unhappy is a *football game*. A squad screen with a "Morale: Poor" column is a database. This is roughly six lines of code.

### 4.2 Progress ring, pure CSS

```css
.ring{
  --v:82;                       /* 0-100 */
  --c:#A9D94B;
  width:34px; aspect-ratio:1; border-radius:50%;
  background:
    conic-gradient(var(--c) calc(var(--v)*1%), #232A33 0),
    radial-gradient(closest-side,#12161B 72%,transparent 73%);
  background-blend-mode:normal;
  display:grid; place-items:center;
  filter:drop-shadow(0 0 4px color-mix(in srgb,var(--c) 45%,transparent));
}
```

`conic-gradient` + a `radial-gradient` knockout gives a ring with no SVG and no JS. Animate by transitioning `--v` with `@property`:

```css
@property --v{ syntax:'<number>'; initial-value:0; inherits:false; }
.ring{ transition:--v .6s cubic-bezier(.22,1,.36,1); }
```

### 4.3 Attribute radar, inline SVG

```html
<svg viewBox="0 0 120 120" width="120" height="120" aria-label="Attributes">
  <g fill="none" stroke="#2C333D" stroke-width="1">
    <polygon points="60,8 97,26 112,64 97,102 60,112 23,102 8,64 23,26"/>
    <polygon points="60,34 79,43 86,62 79,81 60,86 41,81 34,62 41,43" opacity=".6"/>
  </g>
  <!-- data polygon: 8 spokes, radius = 8 + (attr/20)*52 -->
  <polygon points="60,14 92,30 104,64 88,96 60,104 30,94 16,62 30,32"
     fill="#FFC53D" fill-opacity=".28" stroke="#FFC53D" stroke-width="2"
     stroke-linejoin="round" style="filter:drop-shadow(0 0 6px #FFC53D66)"/>
  <g fill="#FFC53D">
    <circle cx="60" cy="14" r="2.5"/><circle cx="92" cy="30" r="2.5"/>
  </g>
</svg>
```

A radar is the correct chart here specifically because **shape is the message**: a winger and a centre-back produce visibly different polygons, so squad balance becomes a visual pattern rather than an arithmetic exercise. Do *not* use radar for comparing two players on precise values — use paired bars for that.

---

## 5. Depth, texture and motion

Six techniques, with values, in order of impact per line of CSS.

### 5.1 The three-shadow stack

Never a single `box-shadow`. Every raised object gets three:

```css
.raised{
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.14),     /* 1. rim light — the top edge catches light */
    0 1px 2px rgba(0,0,0,.55),               /* 2. contact shadow — tight, dark */
    0 12px 28px -10px rgba(0,0,0,.8);        /* 3. ambient — wide, soft, offset down */
}
```

The rim light is the one everybody skips and it is the one that does the work: a 1 px inner white highlight on the top edge is what separates "panel" from "physical object." Confirmed by the glassmorphism literature — a light border on the top edge mimics how light catches the rim of a real object.

### 5.2 Gradient plates instead of flat fills

Rule: **no surface larger than 80 × 80 px is a flat colour.** Minimum 6% luminance travel across it, at 155° (light from top-left).

```css
.plate{ background:linear-gradient(155deg,#1A1F26 0%,#12161B 70%); }
.plate-hot{ background:linear-gradient(155deg,#3A2E10 0%,#17130A 62%); }  /* accent wash */
```

Gradients add depth and vibrancy to flat design when they mimic natural light direction; keeping a single consistent light angle across the whole app is what stops it looking like random decoration.

### 5.3 Noise

A 3–5% noise overlay is the difference between "digital gradient" and "printed object." One data-URI, reused globally (already defined as `--noise` in §3.4):

```css
.textured::before{
  content:""; position:absolute; inset:0; pointer-events:none;
  background-image:var(--noise); opacity:.045; mix-blend-mode:overlay;
  border-radius:inherit;
}
```

Cost: ~300 bytes, once. Applies to every card, sheet and hero.

### 5.4 Glow, rationed

Glow signals *importance* and stops meaning anything if everything has it. Budget: **at most two glowing objects per screen.**

```css
.glow-acc{ filter:drop-shadow(0 0 6px rgba(255,197,61,.45)) drop-shadow(0 0 18px rgba(255,197,61,.18)); }
```

Two stacked `drop-shadow`s (tight + wide) reads as a real light source; a single one reads as a blur artefact.

### 5.5 Angled cuts

Carried forward from `05` and now load-bearing, because angles are the cheapest way to stop a screen looking like a document:

```css
.slab{ clip-path:polygon(0 0,100% 0,100% calc(100% - 18px),0 100%); }
.chip-skew{ transform:skewX(-8deg); }  /* un-skew the inner text by +8deg */
```

Use at **12–18°**, one direction only, app-wide. Two directions reads as chaos.

### 5.6 Motion — springs, not linear

The single most impactful change: replace every `ease` with an overshoot curve on *appearing* objects, and keep `ease-out` for *dismissing* ones.

```css
:root{
  --spring:cubic-bezier(.34,1.56,.64,1);   /* overshoots ~8% — the "pop" */
  --swift:cubic-bezier(.22,1,.36,1);       /* fast-out, no overshoot */
}
.card-enter{ animation:pop .28s var(--spring) both; }
@keyframes pop{ from{ opacity:0; transform:scale(.88) translateY(10px); } }
.card-enter:nth-child(n){ animation-delay:calc(var(--i,0) * 28ms); }  /* stagger */
```

Rules with numbers:
- **Press feedback: 90 ms, `scale(.96)`.** Every tappable object. Non-negotiable — this alone is worth more than any gradient.
- **Card grid entrance: 28 ms stagger, cap the cascade at 12 items** (beyond that it feels slow).
- **Number counting: 600 ms** on money and rating changes, `--swift`.
- **Celebration (goal, promotion, signing): 900–1400 ms**, allowed screen-shake ≤ 4 px, allowed particles. **Rationed to 4–5 moments per session** — this is where the "juice" budget goes.
- **Everything else: 180–260 ms.**
- Respect `prefers-reduced-motion: reduce` — drop to opacity-only fades at 120 ms.

The juice principle from the canonical GDC framing applies: feedback must *echo* something that already exists in the simulation. Do not animate a screen transition harder than you animate a 94th-minute winner.

---

## 6. Screen archetypes

### 6.1 Squad — from list to **grid of cards over a pitch**

*Today:* 25 uniform `.plr` rows, ~64 px each, scrolled.

*Instead:* two modes on one screen, toggled by a segmented control.

**Mode A — Pitch (default).** Upper 58% of the viewport is a pitch plate: a radial-gradient green-black ellipse (floodlight pool), hairline pitch markings in SVG at 8% opacity, and **11 `--card-sm` tokens positioned by formation**. Each token is a mini card: face, rating, position lozenge with condition ring. Bench is a horizontal scroll strip of 7 tokens below. Drag-and-drop is `transform: translate3d()` with the spring curve; the drop target pulses a 2 px amber outline.

This is one screen that is 80% graphic and 20% text and it replaces the single most spreadsheet-like view in the game.

```css
.pitch{
  aspect-ratio:3/4; border-radius:18px; position:relative; overflow:hidden;
  background:
    radial-gradient(120% 80% at 50% 18%, #17301F 0%, #0D1A12 46%, #0A0C0F 100%),
    repeating-linear-gradient(180deg, rgba(255,255,255,.014) 0 24px, transparent 24px 48px);
  box-shadow:inset 0 0 60px rgba(0,0,0,.85), inset 0 1px 0 rgba(255,255,255,.08);
}
```

**Mode B — Table.** Keep the current dense rows for power users, but restyle rows to carry a 44 px face, a tier-coloured left edge bar (4 px), and a condition ring. Even the "list" mode should be ~40% graphic.

### 6.2 Transfer market — from results list to **shelf**

*Today:* `mktRow()` — a text row with a 38 px face and a price.

*Instead:*
- **Hero band, top 30%:** one featured target as a `--card-lg` on an angled amber slab, with the fee as a huge condensed numeral and an affordability bar underneath (your balance as the track, the fee as the fill; overflow turns `--loss` red).
- **Below:** a **2-column card grid** of `--card-md`, not rows. Six cards fill a phone screen — the same information density as six rows, but 4× the graphic weight.
- **Filters as chips**, horizontally scrolling, each with a filled/unfilled state — never a form.
- **Shortlist** is a persistent bottom strip of `--card-sm` cards, thumbnail-visible at all times. Collections need to be *visible* to be desirable.

### 6.3 League table — from table to **ladder**

A table is unavoidable here, but it does not have to *look* like one:

- **Zone bars:** 4 px left edge on every row, `--acc` for the title/UCL zone, `--uel` orange for Europa, `--loss` red for relegation, transparent for midtable. The shape of the season becomes visible without reading a single position number.
- **Your row is 1.5× tall**, on `surface/02`, with a rim light and a 28 px crest — every other row gets a 20 px crest.
- **Points as a proportional bar** behind the row (a subtle `linear-gradient` fill to `pts/leaderPts * 100%` at 8% opacity) — the gaps in the table become physically visible.
- **Delta chevrons** on position, coloured, animated on matchday.
- **Form column as 5 chips**, not letters.
- Sticky mini-table when scrolled away from your club — a pattern lifted straight from FotMob and genuinely good.

### 6.4 Match screen — the emotional peak, currently the flattest

This is where the biggest gap between "our game" and "a football game" sits.

- **Score bug:** full-bleed slab, angled 14° cut, crest + 3-letter code + tabular scoreline at 56 px condensed. Occupies the top 22% and **never scrolls**.
- **Momentum bar:** a horizontal diverging bar (home colour ↔ away colour) that moves live. One graphic that replaces a possession percentage, a shots count and a paragraph.
- **Event feed as tiles, not lines:** each event is a `surface/02` chip with an icon glyph (⚽ 🟨 🔁 🩹), a minute in a filled circle, and the player's 32 px face. Goals get a full-width amber slab, a 900 ms `pop`, and a 4 px shake.
- **Live pitch heat:** a simplified pitch with a 3-zone territory fill, updated per phase.
- **Post-match ratings** as a grid of `--card-sm` with the match rating replacing the ability numeral, tier-coloured by performance.

---

## 7. What to avoid — where rich tips into tacky

| Do | Don't | Why |
|---|---|---|
| One accent (amber) + tier taxonomy | Rainbow gradients on buttons | Multi-hue gradients on CTAs is the #1 tell of a casino app |
| Rationed glow, ≤2 per screen | Glow on every element | Glow inflation destroys hierarchy |
| Noise at 4–5% | Visible texture, leather, felt | Skeuomorphic texture aged badly and reads as 2011 |
| 900–1400 ms celebration, 4–5 per session | Confetti on every tap | Constant celebration is the slot-machine signature |
| Chamfer + 14 px radii, consistent | Mixed radii (4 px here, 28 px there) | Inconsistent radii is the strongest "amateur" signal |
| Faces at 44 px+ | Faces at 12–20 px | Below ~32 px a face is noise, not identity |
| Condensed caps for display only | Everything uppercase | Uppercase body text destroys reading speed |
| Tabular numerals everywhere | Proportional figures in columns | Jittering digits look broken |
| Dark ground stays dark | Bright saturated backgrounds | We are not a match-3; the ground is our restraint budget |
| Real depth via light logic | Drop shadows in random directions | One light source (155°, top-left), app-wide |
| Bounded, legible card silhouettes | Foil/holo/rainbow shimmer on everything | Reserve sheen for `silverware` tier only |

Two specific traps for us:

1. **Fake pack-opening.** Do not add a card-pack-opening ceremony to signings. It is the most-copied mechanic in the category and it would drag SILVERWARE from "management sim" to "gacha" in one screen — undercutting the entire positioning in `01` and `06`. A signing *reveal* (the card flipping in, spring curve, 1.2 s) gets 80% of the emotional payload with none of the tonal damage.
2. **Crest realism.** `crestSVG()` is procedurally generated and legally clean. Do not "improve" it toward photoreal club-badge pastiche — that is exactly the line `07-licensing-safety.md` protects. Enlarging and lighting it is fine; making it look like a real badge is not.

---

## 8. Palette verdict: keep it, and add a tier layer

The brief asked whether the dark editorial palette should change. **No — but it needs to stop being the only thing.**

Arguments for keeping `#0A0C0F` + `#FFC53D`:
- The contrast maths in `05` is done and verified; amber-on-near-black hits 11.51:1 (AAA).
- It is genuinely differentiated. Every competitor is either mid-blue (Top Eleven), navy (eFootball) or bright (DLS). A near-black product with a floodlight accent is ownable.
- The "looks like NASA" problem is **compositional, not chromatic**. Repainting a spreadsheet does not stop it being a spreadsheet.

What to add:
1. **The six tier hues** (§3.3) — the only genuinely new colour system, and it is a *taxonomy*, which is exactly what the corpus does.
2. **Pitch green as a surface**, not an accent: `#17301F → #0D1A12` used only for pitch plates. Football games need green somewhere and this is the disciplined place for it.
3. **Position-family colours** for lozenges — 4 hues, reusing existing tokens: GK `--loan` violet, DEF `--trf` blue, MID `--win` green, ATT `--loss` red. Learned in one session.
4. **Raise the hairlines.** `--hair:#2C333D` at 1.43:1 is invisible on a phone in daylight. Move decorative separators to `#333B47` and stop using hairlines as the primary structuring device — use *gaps and elevation* instead. Separators are a document idiom; gaps between raised objects are a product idiom.

---

## 9. The ten highest-impact changes, in order

Ranked by (visual gain) ÷ (engineering cost). Items 1–4 alone move us from ~18% to ~50% graphic share.

| # | Change | Why it's here | Rough cost |
|---|---|---|---|
| **1** | **Ship the player card** (§3.4) and use it everywhere a player appears — squad, market, shortlist, offers, post-match | The single change that makes it a football game. Reuses `pface()` and `crestSVG()` unmodified. | 1–2 days |
| **2** | **Render faces at 96 px on cards, 44 px in any remaining row** | We already own the asset; we are just displaying it at the wrong size. Nearly free. | hours |
| **3** | **Squad screen → pitch view with card tokens** (§6.1) | Kills the single most spreadsheet-like screen; makes formation a picture. | 2–3 days |
| **4** | **Tier frame system** (§3.3) | Turns ability from a numeral into a colour taxonomy readable across a whole grid. | 1 day |
| **5** | **Press feedback + spring curves on everything** (§5.6) — `scale(.96)` at 90 ms, `--spring` on entrances, 28 ms stagger | Cheapest possible "this feels like a game" win. Pure CSS. | hours |
| **6** | **Depth pass: three-shadow stack, gradient plates, noise, rim lights** (§5.1–5.3) | Global find-and-replace on flat fills. Removes the "document" read app-wide. | 1 day |
| **7** | **Morale as facial expression** (§4.1) | Six lines of code, and the squad becomes emotionally legible with zero words. | hours |
| **8** | **Match screen rebuild** (§6.4) — score-bug slab, momentum bar, event tiles with faces | Where the emotional peaks live and where flatness costs most. | 2–3 days |
| **9** | **Transfer market → card shelf + hero band** (§6.2) | Makes acquisition feel like acquisition. | 1–2 days |
| **10** | **League table → ladder** (§6.3) — zone bars, tall own-row, proportional points fill | Highest-frequency data screen; small graphic additions, large perceived change. | 1 day |

**Deliberately below the line** (do later, or never): light theme, particle systems, parallax on scroll, 3D card tilt on device gyro, animated backgrounds, pack-opening ceremony.

---

## 10. Acceptance test

A screen passes if all four are true:

1. **The 3-second test.** Screenshot it, show it to someone for 3 seconds, ask what game it is. "Football" must come back without the word "football" appearing in the screenshot.
2. **The squint test.** Blur the screenshot by 8 px. If the composition still has a clear focal object and a readable structure, it works. Today every one of our screens blurs into uniform grey stripes.
3. **The ratio test.** Graphic area ≥ 55% (§2.1 method).
4. **The greyscale test.** Desaturate it. All information must still be recoverable — proving colour is a reinforcing channel, not the only one.

---

## 11. Sources

- [Best Examples in Mobile Game UI Designs (2026 Review) — Pixune](https://pixune.com/blog/best-examples-mobile-game-ui-design/)
- [UX in Clash Royale, Part 3 — Maciej Górnicki](https://gornicki.me/blog/Bd87/ux-in-clash-royale-part-3)
- [Game Design UX Best Practices: Clash Royale breakdown — The Rookies](https://www.therookies.co/blog/education/game-design-ux-best-practices-detailed-breakdown-of-clash-royale)
- [A Brief Look: Brawl Stars UX/UI — Matt Sullivan](https://medium.com/@matt.sullivan28/a-brief-look-brawl-stars-ux-ui-562f6225b7e3)
- [Design Critique: Brawl Stars — IXD@Pratt](https://ixd.prattsi.org/2025/02/design-critique-brawl-stars/)
- [Game UI Database — Royal Match](https://www.gameuidatabase.com/gameData.php?id=1061)
- [Who Wins? Royal Match vs. Monopoly Go — GameMakers](https://www.gamemakers.com/p/who-wins-royal-match-vs-monopoly)
- [FIFA Ultimate Team card design (FUT 16 anatomy) — FIFPlay](https://www.fifplay.com/fifa-16-ultimate-team-new-card-design/)
- [FIFA 20 Ultimate Team Player Items Explained — FUTeam](https://fifauteam.com/fifa-20-ultimate-team-players-items-explained/)
- [Squeezing more juice out of your game design — GameAnalytics](https://www.gameanalytics.com/blog/squeezing-more-juice-out-of-your-game-design)
- [Instant Game Feel — Springs Explained — Game Developer](https://www.gamedeveloper.com/game-platforms/instant-game-feel---springs-explained)
- [Gradients in UI Design: A Guide — Supercharge](https://supercharge.design/blog/gradients-in-ui-design-a-guide)
- [Glassmorphism UI: features and best practices — UX Pilot](https://uxpilot.ai/blogs/glassmorphism-ui)
- [Bevels in video games — Radiator Blog](https://www.blog.radiator.debacle.us/2017/07/bevels-in-video-games.html)
- [Radial Bar Charts: when to use them — Domo](https://www.domo.com/learn/charts/radial-bar-chart)
- Internal: `prototype/silverware.html` (`pface()` L~325, `crestSVG()` L~1455, `ramp()` L1439, `CA()` L585, `mktRow()` L1786), `docs/research/05-art-direction.md`, `docs/research/07-licensing-safety.md`
