# 05 — Art Direction & Graphics System

**Owner:** Art Direction / Graphics
**Scope:** visual language, colour, type, procedural identity generation, asset pipeline, motion, iconography.
**Out of scope:** navigation, screen flow and IA (UX agent); product name and logo (branding agent).
**Status:** v1 proposal, ready for build.

---

## 1. Visual benchmark research

I looked at five reference families, because each solves a different half of our problem.

**Broadcast football graphics (Sky Sports, TNT Sports, CBS Golazo, DAZN).** The devices that read instantly as "elite football" are few and consistent: a **deep near-black ground**; **one saturated hot accent** used at high commitment (full-bleed fills, not tints); **hard diagonal cuts** at 12–18° slicing panels and score bugs; **condensed uppercase kinetic type**; and the **score bug lockup** — crest, three-letter club code, tabular scoreline, all baseline-locked. Broadcast almost never uses shadows or gradients on chrome; depth comes from flat panels sliding over each other. TNT and DAZN run black-and-yellow at very high contrast, which is where our accent decision comes from.

**EA FC / FIFA menus.** The lasting lesson is the **card**: rating numeral top-left, position under it, name on a baseline strip, colour-coded frame. It is a *stat pill scaled up to poster size*, and it works because the hierarchy is identical every single time. EA also normalised the **diagonal-wipe transition** and a single electric accent on near-black.

**Football Manager 24/25.** The breadth benchmark and the *anti*-benchmark for looks. It proves dense football data can be navigated on a small screen, and that attribute values want to be **colour-ramped numerals**, not bars. But FM's default skin is grey-on-grey with competing accents — and the modding scene shipping dozens of dark reskins (Cheetah, Dark Polish, Material) is direct evidence the audience wants one committed dark theme with one accent, not a configurable soup.

**Betting and score apps (Sofascore, FotMob, bet365, Flashscore).** The true masters of dense football data at 390pt wide. Worth stealing: the **W/D/L form chip row** (five 18–20pt squares, colour *and* letter); the **two-line fixture row** (crest / name / score, kick-off time right-aligned in tabular figures); the **stat pill** (999px container, uppercase 11px label, tabular value); the **inline mini-table** showing only the four rows around your club; and **right-aligned tabular numerals in every column** — the single biggest legibility win in the category.

**Premium mobile games.** Restraint in motion, generous 16pt gutters, and the discipline that celebratory animation is *rationed*.

**Synthesis — the devices that read as "elite football product":** deep dark ground · exactly one hot accent · condensed uppercase display type · tabular numerals everywhere · diagonal cuts · stat pills · crest+abbreviation lockups · flat panels with hairline separators · colour-ramped attribute numerals · form chips.

---

## 2. Recommended direction: **"Floodlight"** — premium dark editorial with broadcast punctuation

**What the game feels like:** the *Monday-morning broadsheet football section, art-directed by a Champions League title sequence*. Calm, dark, confident, mostly typography and data — and then, four or five times per session, it turns into a broadcast graphic: a full-bleed amber slab, a diagonal cut, a scoreline in enormous condensed numerals. The baseline is **editorial and quiet so the data can breathe**; the peaks are **loud and broadcast** so the emotional moments land. Scrolling your squad should feel like reading a serious publication. Watching a 94th-minute winner go in should feel like watching Sky.

Concretely: near-black `#0A0C0F` canvas, flat cards, hairline rules, one amber accent `#FFC53D`, condensed Archivo for display, Inter for everything else. No gradients on chrome, no skeuomorphism, no stadium photography behind text.

**Rejected — full broadcast-graphics realism.** Simulated TV overlays everywhere: lower-thirds, animated wipes on every navigation, 3D crest plinths, photographic plates behind panels. It fights the product's core job: a broadcast overlay is designed to sit over moving video for eight seconds, not to hold a 40-row transfer shortlist. It also collapses the emotional peaks — if every screen is a graphics package, the goal moment has nowhere to go. It is the most expensive direction per screen and the fastest to age.

**Rejected — retro teletext / Ceefax nostalgia.** Page 302, block colours on pure black, chunky pixel crests. It is a *joke that has to land twice a day for two hundred hours*. It reads as a jam game, caps the audience at British men over 35, throws away legibility headroom we need for dense stats, and — critically — makes the unlicensed problem worse: teletext aesthetics only work if you already know the real clubs. Keep it as a **future unlockable cosmetic theme**, cheap once the token layer exists; never as the default.

*(Flat/illustrative was dropped early: friendly and cheap, but it reads as a casual puzzle game and undermines the "real product" requirement outright.)*

---

## 3. Colour system

**Dark is the default and the brand.** A light theme ships, but as a **token remap only** — every colour below is referenced through a semantic token, never a raw hex, so light mode is a values file and not a redesign. Target light theme for v1.1; define the tokens now so nothing is rebuilt.

All ratios below are computed WCAG 2.1 relative-luminance contrast ratios (verified numerically, not estimated). "Body" = ≥4.5:1 (AA normal text); "Large" = ≥3:1 (AA for ≥18.66px bold / ≥24px regular, and AA non-text 1.4.11).

### 3.1 Dark theme (default)

| Token | Hex | Role | Contrast vs `#12161B` | Verdict |
|---|---|---|---|---|
| `bg/base` | `#0A0C0F` | App canvas, behind everything | — | — |
| `surface/01` | `#12161B` | Cards, list rows, tab bar | — | — |
| `surface/02` | `#1A1F26` | Raised: sheets, selected row, input fields | — | — |
| `surface/03` | `#232A33` | Popovers, tooltips, sticky headers | — | — |
| `border/hairline` | `#2C333D` | Decorative row separators | 1.43:1 | decorative only — exempt |
| `border/strong` | `#3A424E` | Card edges, dividers | 1.79:1 | decorative only — exempt |
| `border/interactive` | `#5C6572` | Outlines of inputs, toggles, chips | **3.08:1** | passes 1.4.11 non-text |
| `text/primary` | `#F4F6F8` | Headings, values, player names | **16.76:1** | AAA |
| `text/secondary` | `#A8B2BF` | Labels, metadata, positions | **8.46:1** | AAA |
| `text/tertiary` | `#6E7885` | Timestamps, disabled-ish captions | **4.05:1** | Large only — never below 17px |
| `text/disabled` | `#4A525E` | Disabled control labels | 2.30:1 | exempt (WCAG 1.4.3 disabled) |
| `text/inverse` | `#0A0C0F` | Text on accent fills | 12.41:1 *(on accent)* | AAA |
| **`accent/base`** | **`#FFC53D`** | The one hot accent: primary CTA, focus, key numerals | **11.51:1** | AAA |
| `accent/press` | `#E5A81F` | Pressed / hover state | 9.28:1 *(on base)* | AAA |
| `accent/wash` | `#3A2E10` | 12% accent over base, as a solid | — | background only |
| `focus/ring` | `#7FD9FF` | Keyboard / switch-access focus ring | 12.38:1 *(on base)* | AAA |

### 3.2 Semantic colours (dark)

| Token | Hex | Meaning | Contrast vs `#12161B` | Verdict |
|---|---|---|---|---|
| `sem/win` | `#35D07F` | Win, money in, positive delta, form ▲ | **9.06:1** | AAA |
| `sem/draw` | `#9AA4B2` | Draw, neutral delta, form ▬ | **7.20:1** | AAA |
| `sem/loss` | `#F0484F` | Loss, money out, negative delta, form ▼ | **4.97:1** | AA |
| `sem/injury` | `#FF7043` | Injured / unavailable | **6.62:1** | AA |
| `sem/transfer` | `#4C8DFF` | Transfer activity, listed, bid received | **5.67:1** | AA |
| `sem/loan` | `#A78BFA` | Loan in/out, youth promotion | **6.67:1** | AA |
| `sem/card-yellow` | `#F2C230` | Yellow card (literal object) | 10.84:1 | AAA |
| `sem/card-red` | `#E23B3B` | Red card, suspension (literal object) | 4.26:1 | Large only — always paired with card glyph |

**Note on the accent/semantic collision.** The accent is deliberately **amber, not green or lime**, because green, red and grey are already spoken for by win/loss/draw — the most-read colours in the entire product. Amber also matches the broadcast reference set (TNT, DAZN) and reads as floodlight and trophy rather than as a warning, *provided it is used in solid fills with dark text* rather than as a thin warning stripe. `sem/card-yellow` is deliberately a different, greener yellow from `accent/base` so a booking never reads as a call-to-action.

### 3.3 Attribute heat ramp (5 stops, for 1–20 attribute values and match ratings)

| Stop | Hex | Range | Contrast vs `#12161B` |
|---|---|---|---|
| 1 — poor | `#F0484F` | 1–5 | 4.97:1 |
| 2 — weak | `#FF7A45` | 6–9 | 7.02:1 |
| 3 — average | `#FFC53D` | 10–13 | 11.51:1 |
| 4 — good | `#A9D94B` | 14–16 | 11.00:1 |
| 5 — elite | `#35D07F` | 17–20 | 9.06:1 |

All five clear AA as text, so attribute values can be **coloured numerals** (FM-style) instead of bars — denser and more legible.

### 3.4 Light theme ("Daylight", v1.1)

| Token | Hex | Contrast vs `#FFFFFF` | Verdict |
|---|---|---|---|
| `bg/base` | `#F5F7FA` | — | — |
| `surface/01` | `#FFFFFF` | — | — |
| `text/primary` | `#0E1319` | **18.65:1** | AAA |
| `text/secondary` | `#4A5563` | **7.58:1** | AAA |
| `text/tertiary` | `#6B7683` | **4.62:1** | AA |
| `accent/base` (fills) | `#FFC53D` | — | dark text on top: 12.41:1 |
| `accent/text` | `#8A5B00` | **5.87:1** | AA — accent as *text* must darken |
| `sem/win` | `#0E8F4E` | 4.15:1 | Large / bold only |
| `sem/loss` | `#C42B32` | **5.62:1** | AA |
| `sem/draw` | `#5B6472` | **5.98:1** | AA |
| `sem/injury` | `#C2410C` | **5.18:1** | AA |
| `sem/transfer` | `#1D4ED8` | **6.70:1** | AA |
| `sem/loan` | `#6D28D9` | **7.10:1** | AAA |

**Hard rule: colour is never the only channel.** Every W/D/L chip carries its letter; every form arrow carries a glyph; every money delta carries a `+`/`−`. This is required for the ~8% of male players with colour-vision deficiency, and W/L red-green is the exact axis that fails.

---

## 4. Typography

Two families, both variable, both **SIL Open Font License 1.1** — verified from the upstream repositories, which is what matters legally, not the Google Fonts mirror.

| Family | Licence | Verified at | Role |
|---|---|---|---|
| **Archivo** (Omnibus-Type; Héctor Gatti) | SIL OFL 1.1 | `github.com/Omnibus-Type/Archivo` | Display, scorelines, screen titles. Ships a **variable width axis** (ExtraCondensed → Expanded) — one file gives us condensed table headers *and* an expanded broadcast scoreline. |
| **Inter** (Rasmus Andersson) | SIL OFL 1.1 | `github.com/rsms/inter` | Body, UI, all data. Purpose-built for on-screen UI at small sizes; ships **`tnum` tabular figures**, plus `case`, `ss01`, and slashed zero. |

OFL 1.1 explicitly permits bundling, embedding and redistribution inside commercial software; the only real constraints are (a) don't sell the fonts standalone, and (b) if we modify them, the derivative must not use a Reserved Font Name. **We will not rename or fork either family** — we ship the upstream binaries subsetted, and include `OFL.txt` in an in-app Licences screen. Barlow / Barlow Condensed (Jeremy Tribby, SIL OFL 1.1) is the approved fallback if Archivo's expanded widths prove too wide in German and Portuguese club names.

### 4.1 Type scale (mobile portrait, sizes in **px = logical pt**)

| Token | Family / weight / width | Size | Line | Tracking | Figures | Use |
|---|---|---|---|---|---|---|
| `display/score` | Archivo 800, SemiExpanded | 44 | 44 | −2.0% | tabular | Full-time scoreline, headline fee |
| `display/hero` | Archivo 800, Normal | 32 | 34 | −1.5% | tabular | Match-day hero, season-end |
| `title/l` | Archivo 700 | 24 | 28 | −1.0% | tabular | Screen title |
| `title/m` | Archivo 700 | 20 | 24 | −0.5% | tabular | Section header |
| `title/s` | Inter 600 | 17 | 22 | 0 | tabular | Card header, player name in list |
| `body/l` | Inter 400 | 16 | 22 | 0 | proportional | News item body, dialogue |
| `body/m` | Inter 400 | 15 | 20 | 0 | proportional | **Default body** |
| `body/s` | Inter 400 | 13 | 18 | 0 | proportional | Secondary metadata |
| `label/m` | Inter 600 | 13 | 16 | +2.0% | tabular | Buttons, tabs |
| `label/s` | Inter 700, UPPERCASE | 11 | 14 | +6.0% | tabular | Table column headers, tags, pill labels |
| `caption` | Inter 400 | 11 | 14 | +1.0% | tabular | Timestamps, footnotes |
| `data/l` | Inter 700 | 20 | 24 | 0 | **tabular** | Attribute values, big stat |
| `data/m` | Inter 600 | 15 | 18 | 0 | **tabular** | Table cells, league points |
| `data/s` | Inter 600 | 12 | 14 | 0 | **tabular** | Stat pill values, form chips |
| `mono/abbr` | Archivo 700, Condensed, UPPERCASE | 13 | 14 | +4.0% | tabular | Three-letter club codes (ARS, TOT) |

Nothing below 11px. Minimum tap target 44×44pt regardless of type size. Support Dynamic Type / Android font scaling to 200% — layouts must reflow, and every table must be able to drop to a two-line row rather than clip.

### 4.2 Why tabular figures are non-negotiable

In **proportional** figures, `1` is narrower than `8`. In a league table that means `11` and `88` are different widths, so the points column *shimmers* as you scroll, the decimal points in xG columns fail to line up, and a number that ticks from `9` to `10` visually jumps and shifts everything after it. **Tabular** figures (`font-feature-settings: "tnum" 1`) give every digit an identical advance width. Consequences: columns are vertically aligned without measuring text, a counting-up animation doesn't reflow its own row, right-aligned money columns compare at a glance, and clock digits (`89:04`) don't wobble. Inter's `tnum` is applied globally to every `data/*` and `label/*` token, and to any numeral inside a table, pill, chip, badge or clock. Proportional figures are used *only* inside running prose (news items, board feedback), where tabular digits look mechanical. Also enable `zero` (slashed zero) in `data/*` so `0` and `O` never confuse in generated player IDs and scorelines.

---

## 5. The unlicensed problem

Unlicensed football games fail emotionally not because the crests are fake, but because they are *arbitrary* — a random polygon with a random gradient has no history, so the club has no history, so relegating them costs nothing. The fix is not better art. **The fix is a grammar.** Real crests obey heraldic rules and regional conventions; if our generator obeys the same rules, players' pattern recognition does the emotional work for us. Community evidence supports this: EA's create-a-club crest scene and FM's newgen-face packs exist precisely because the shipped generic assets had no grammar, and modders replaced them with grammatically consistent libraries.

Three principles:

1. **Determinism.** Every identity derives from `hash(entityID + worldSeed)` — byte-identical on every device, every save, forever. Identity that changes is identity that doesn't exist.
2. **Regional grammar.** Primitive weights are biased by nation, so English clubs feel English and Spanish clubs feel Spanish before you read a word.
3. **Constraint over variety.** A generator that makes ten million crests but only two thousand *good* ones is worse than one that makes fifty thousand good ones. Every output is gated through validity rules.

### 5.1 Procedural crest system

Six composable layers, all SVG, all rendered on a **512×512 viewBox** with a 32-unit safe margin.

| Layer | Count | Primitives |
|---|---|---|
| **1 — Shield silhouette** | 8 | `heater` (classic pointed) · `roundel` · `roundel-ring` (concentric band for lettering) · `french` (square-top, curled base) · `spade` · `pennant` (downward triangle) · `hexagon` · `oval-vertical` |
| **2 — Field division** *(heraldic divisions of the field)* | 12 | `plain` · `per-pale` (vertical halves) · `per-fess` (horizontal halves) · `per-bend` (diagonal) · `per-bend-sinister` · `quarterly` · `per-chevron` · `paly-4` · `paly-6` (stripes) · `barry-6` (hoops) · `per-saltire` · `gyronny` |
| **3 — Ordinary overlay** *(optional; ~55% carry one)* | 7 | `none` · `chief` (top-third band) · `fess` (horizontal) · `pale` (vertical) · `bend` (diagonal) · `chevron` · `bordure` (inner border) |
| **4a — Charge: fauna** | 10 | lion rampant · lion passant · eagle displayed · raven · bull's head · stag · horse rampant · falcon · wolf head · dolphin |
| **4b — Charge: flora & elements** | 7 | rose · oak leaf · thistle · wheat sheaf · fleur-de-lis · sun-in-splendour · six-pointed star |
| **4c — Charge: industry & place** | 11 | anchor · cogwheel · hammer · ship under sail · lighthouse · castle tower · bridge span · chimney/kiln · pickaxe crossed · key crossed · mountain peak |
| **4d — Charge: football & abstract** | 12 | ball (hex-panel) · boot · crossed corner flags · goal frame · laurel wreath · crown · cross (Latin) · saltire · cross-crosslet · monogram (2–3 letters, Archivo Condensed 800) · chevron-stack · torch |
| **5 — Fimbriation / edge** | 4 | `none` · `hairline` (4-unit metal outline) · `heavy` (16-unit) · `double` (two-colour) |
| **6 — Furniture** *(optional)* | 5 | `none` · `scroll` (base ribbon, founding year or motto) · `arc-text` (name on roundel band) · `stars` (0–3 pips, tied to titles won) · `laurel` (flanking wreath) |

All charges are drawn as flat two-tone silhouettes on the same 512-unit grid.

**Colour rules.** A palette of **18 tinctures** — 5 metals/lights (argent `#F2F0E9`, or `#E8C64A`, `#F5F5F5`, `#EFE3C8`, `#D9D2C4`) and 13 colours (claret `#7A1F35`, scarlet `#C8102E`, crimson `#9B1B30`, navy `#0B2B5B`, royal `#1145A3`, sky `#5CA8E0`, forest `#0C5C3A`, emerald `#12864F`, black `#111111`, maroon `#5A1A2B`, amber `#E08A1E`, purple `#4B1B69`, teal `#0E6E72`). Each crest draws **two or three**. The generator enforces the heraldic **rule of tincture — never colour on colour, never metal on metal** — which is not a stylistic affectation but the reason real crests stay legible at 24pt on a fixture row. Charges render in a tincture contrasting ≥3:1 against the field beneath them; if a pairing fails, the generator inserts a metal `fimbriation` outline rather than rerolling — exactly what real heraldry does.

**Combinatorics, honestly stated.** 8 shields × 12 divisions × 7 ordinaries × 40 charges × 4 fimbriations × 5 furniture = **537,600 structural forms**. Roughly 96 of the 153 two-tincture pairs survive the rule of tincture, giving ≈**51.6 million nominal outputs**. That number is meaningless alone — what matters is *distinctness within a league*. v1 needs ~2,500 clubs across ~40 leagues, so 20–24 clubs must be mutually distinguishable at 24pt. A per-nation rejection sampler enforces it: compute a feature vector (shield, division, ordinary, charge-family, dominant tincture, secondary tincture) and reject any candidate within Hamming distance 2 of an existing club in the same nation. At 20 clubs per league this rejects <4% of first draws.

**Regional grammar (the emotional payload).** Primitive weights are per-nation tables:

| Nation | Shield bias | Division bias | Charge bias | Furniture bias |
|---|---|---|---|---|
| England | heater 60%, french 20% | plain, per-pale, chief | lion, rose, anchor, cog, castle, ship | scroll w/ founding year 70% |
| Scotland | heater, spade | per-saltire, quarterly | thistle, saltire, stag, castle | scroll + motto |
| Spain | roundel-ring 45%, heater | paly-6, per-pale | crown 55%, bat, castle, monogram | arc-text |
| Italy | oval, heater | per-fess, per-pale | eagle, cross, wolf | stars (scudetti) |
| Germany | roundel 65% | plain, bordure | monogram 45%, minimal charge | none 80% |
| Netherlands | roundel, hexagon | per-fess, per-bend | monogram, lion, simple ordinary | none |
| Brazil / Argentina | spade, oval | per-bend, barry-6 | monogram + stars, sun-in-splendour | stars |

**Inline SVG — the primitives, demonstrated.** Each of these is a real, renderable layer of the generator:

```svg
<!-- L1: heater shield silhouette (used as a clipPath for all lower layers) -->
<path id="shield-heater" d="M256 40 L462 96 C462 300 400 420 256 472
                            C112 420 50 300 50 96 Z"/>

<!-- L1: roundel-ring (outer band carries arc-text) -->
<circle id="shield-roundel-ring" cx="256" cy="256" r="216"/>
<circle id="roundel-inner"       cx="256" cy="256" r="164"/>

<!-- L2: per-pale (vertical halves) and paly-6 (six vertical stripes) -->
<rect id="div-per-pale-a" x="0"   y="0" width="256" height="512" fill="var(--tinc1)"/>
<rect id="div-per-pale-b" x="256" y="0" width="256" height="512" fill="var(--tinc2)"/>
<g id="div-paly-6" fill="var(--tinc2)">
  <rect x="85.3"  y="0" width="85.3" height="512"/>
  <rect x="256"   y="0" width="85.3" height="512"/>
  <rect x="426.7" y="0" width="85.3" height="512"/>
</g>

<!-- L2: per-bend (diagonal) and barry-6 (hoops) -->
<path id="div-per-bend" d="M0 0 L512 0 L0 512 Z" fill="var(--tinc2)"/>
<g id="div-barry-6" fill="var(--tinc2)">
  <rect y="85.3"  x="0" height="85.3" width="512"/>
  <rect y="256"   x="0" height="85.3" width="512"/>
  <rect y="426.7" x="0" height="85.3" width="512"/>
</g>

<!-- L3: ordinaries -->
<rect id="ord-chief" x="0" y="0"   width="512" height="150" fill="var(--tinc3)"/>
<rect id="ord-fess"  x="0" y="200" width="512" height="112" fill="var(--tinc3)"/>
<path id="ord-chevron" d="M0 400 L256 190 L512 400 L512 470 L256 260 L0 470 Z"
      fill="var(--tinc3)"/>

<!-- L4: charge — a flat two-tone star, and a monogram set in Archivo Condensed -->
<path id="charge-star6" d="M256 150 L288 232 L374 232 L305 284 L331 366
                           L256 316 L181 366 L207 284 L138 232 L224 232 Z"
      fill="var(--charge)"/>
<text id="charge-monogram" x="256" y="320" text-anchor="middle"
      font-family="Archivo" font-stretch="condensed" font-weight="800"
      font-size="200" letter-spacing="-6" fill="var(--charge)">NA</text>

<!-- L5: fimbriation — always a metal, applied when charge:field contrast < 3:1 -->
<use href="#charge-star6" fill="none" stroke="var(--metal)" stroke-width="14"
     stroke-linejoin="round"/>
```

The runtime composes: `<svg viewBox="0 0 512 512"><clipPath id="c"><use href="#shield-X"/></clipPath><g clip-path="url(#c)">[division][ordinary]</g>[charge][fimbriation][furniture]</svg>`, with tinctures injected as CSS custom properties.

### 5.2 Procedural kit renderer

Same philosophy, one template. A **shirt base mesh** (torso + two sleeves + collar) drawn once as SVG at 256×256, then a pattern layer clipped to the torso.

**Patterns (14):** `plain` · `stripes-wide` (5 bars) · `stripes-narrow` (9 bars) · `pinstripes` (14 hairlines) · `hoops-wide` (5) · `hoops-narrow` (9) · `halves` · `quarters` · `sash-left` · `sash-right` · `chevron` · `shoulder-yoke` · `checkerboard` · `centre-band`.
**Sleeve treatments (4):** `matching` · `contrast-solid` · `contrast-from-shoulder` · `hooped`.
**Collar (4):** `crew` · `v-neck` · `polo-two-button` · `grandad`.
**Trim (3):** `none` · `cuff+collar` · `cuff+collar+placket`.

That is 14 × 4 × 4 × 3 = **672 kit forms**, each taking 2–3 colours **derived from the club's crest tinctures** — home uses tincture 1 + 2, away inverts to metal-dominant, third takes tincture 3 or a nation-flavoured alternate. This derivation is the trick that makes a fake club cohere: crest, kit and league-table row share the same two colours, so `NAA` in claret-and-blue becomes a *thing you recognise* within three seasons. Shirt numbers use one condensed numeral style; no player names on shirts at v1.

### 5.3 Player representation — recommendation: **layered vector "identikit" avatars**

| Option | Cost | Legal risk | Emotional payoff | Verdict |
|---|---|---|---|---|
| Silhouettes / initials chip | Near-zero. One SVG. | None | Inert. Players never become people. | Use only as the *dense-list* variant |
| Generated photoreal portraits (GAN/diffusion) | High: 50k–200k images to generate, curate, store or serve; ongoing pipeline | **Highest** — see below | High when it works, uncanny at scale | **Reject** |
| **Layered vector identikit avatars** | Moderate: ~1 artist-month, ~150 flat SVG parts | Effectively none | Strong, and *stylistically ownable* | **Recommend** |

**Recommended:** a parametric, non-photoreal, flat-vector head — deliberately stylised (a broadcast graphic's abstracted portrait, not a caricature). Layers: head shape (6) × skin tone ramp (12, evenly sampled across Fitzpatrick I–VI so global squads look global) × hairstyle (28) × hair colour (9) × facial hair (12) × brow (5) × eye treatment (6) × nose/mouth abstraction (8) × accessories (6: none, headband, glasses, tape, gloves-implied, armband cue). **~150 drawn parts**, ~19 million deterministic combinations, seeded from `hash(playerID)`, composited over a club-coloured collar so a player visibly "wears" their team.

**Why not photoreal.** (1) **Legal:** models trained on scraped imagery can and do reproduce recognisable real people, and right of publicity is a live, expanding area — the NO FAKES Act advanced out of the US Senate Judiciary Committee in June 2026, and New York's law effective 9 June 2026 requires conspicuous disclosure of AI-generated synthetic performers and extends post-mortem digital-replica rights. Shipping 100,000 synthetic faces is 100,000 chances to ship a real footballer's face into a commercial product. (2) **Compliance overhead:** EU AI Act transparency obligations for machine-readable marking of AI-generated images apply from 2 August 2026, and the "evidently artistic/fictional" carve-out is assessed per-content, not per-category — relying on it undocumented is itself a risk. Stylised vector art generated by *our own deterministic code from art we drew* sidesteps all of it. (3) **Craft:** photoreal faces at scale sit in the uncanny valley and clash with a flat editorial UI.

**Where faces appear:** player profile (120pt), transfer target card (64pt), match-report scorer (40pt). **Where they don't:** squad lists, league tables, any table row — those get a **shirt-number chip in club colours** (28pt rounded square, tabular numeral, club tincture ground). Cheaper and faster to scan than a wall of tiny faces, and it is how the best score apps already work.

---

## 6. Asset pipeline

**Generate at runtime (vector, deterministic, zero download weight):** crests, kits, player avatars, competition marks, stadium plan diagrams, formation pitch overlays, form chips, flags.
**Author by hand (ships in bundle):** the ~150 avatar parts, the 40 crest charges, the shirt base mesh, the icon set, 6 abstract stadium/atmosphere backdrop plates, 1 grain/noise tile, 1 pitch-texture tile, brand splash art (branding agent).

**Formats.**
- **SVG for everything generated.** Resolution-independent, so we never export @1x/@2x/@3x for crests — a 3× phone gets a crisp 512-unit crest from the same ~2 KB of path data. Crest + kit + avatar libraries together: **< 900 KB** of paths.
- **Rasterise once, cache forever.** Rendering SVG per-frame in a scrolling list is the classic performance trap. Render each composed crest **once** at the three sizes we use (24 / 48 / 120pt × device scale) into an on-device LRU texture cache keyed `(entityID, sizeBucket, scale)`, then blit. A 2,500-club world caches to ~8–14 MB — *generated*, not downloaded.
- **Sprite atlas only for the icon set** (one 1024×1024 sheet). Crests are too many and too dynamic to atlas usefully.
- **WebP for the handful of photographic plates**, quality 80. AVIF adds decode cost on older Android; revisit post-launch.
- **Fonts subsetted** to Latin + Latin-Ext, variable format. Two variable families subset to ≈ **340 KB total**.

**Download budget.** Target **≤ 60 MB install / ≤ 45 MB download** — under cellular-download thresholds, which materially improves install conversion. The generative approach buys this: shipping 2,500 hand-drawn crests plus 100,000 portraits would be 400 MB+.

**Density.** Design at 1× logical points, ship vectors, snap strokes and hairlines to the device pixel grid (a 1pt hairline on a 3× screen renders as 3 aligned physical pixels, not blurred across 4). Icon strokes are 2pt on a 24pt grid — never scale an icon without scaling its stroke.

**Unique assets v1 needs:** ~**430 hand-authored vector assets** (checklist below), ~10 raster plates, 2 font families. Every crest, kit and face in the world composes from those at runtime.

---

## 7. Motion

Motion earns its place in exactly four situations: **confirming a state change**, **showing a spatial relationship**, **pacing a reveal**, and **celebrating**. Everything else is latency wearing a costume.

**Easing tokens**
- `ease/standard` — `cubic-bezier(0.2, 0, 0, 1)` — the default; asymmetric ease-out so things *arrive* rather than drift.
- `ease/emphasised` — `cubic-bezier(0.05, 0.7, 0.1, 1)` — hero transitions, sheet presentation.
- `ease/exit` — `cubic-bezier(0.3, 0, 1, 1)` — anything leaving; fast out, no lingering.
- `spring/table` — stiffness 220, damping 26, mass 1 — league-table row reordering only.

**Durations**

| Moment | Duration | Easing | Notes |
|---|---|---|---|
| Button / chip press feedback | **90 ms** | `ease/standard` | Scale to 0.97 + surface lift; no colour flash |
| Toggle, checkbox, tab underline | **120 ms** | `ease/standard` | |
| Standard screen push / pop | **220 ms** | `ease/standard` | Shared-element crest morph where the crest persists |
| Bottom sheet in | **280 ms** | `ease/emphasised` | Out: **200 ms** `ease/exit` |
| Toast / snackbar in | **180 ms** | `ease/standard` | Dwell 4 s, out 140 ms |
| Skeleton shimmer cycle | **1200 ms** | linear | Only if load > 400 ms; below that, show nothing |
| **Results reveal** (fixture list settling) | **80 ms stagger**, 240 ms per row | `ease/standard` | Rows fade+rise 8pt in fixture order; whole list settles in ≤ 1.4 s; tap anywhere skips to end |
| **League table movement** | **420 ms** | `spring/table` | Rows physically translate to new positions; the moved row holds a 1200 ms accent left-edge bar afterwards |
| **Goal moment** | **900 ms** total | `ease/emphasised` | Amber slab wipes in on a 15° diagonal (260 ms), scoreline numeral counts and settles (300 ms), scorer name slides up (200 ms), hold (140 ms). Once per goal. Never repeated on scrollback. |
| **Transfer confirmation** | **650 ms** | `ease/emphasised` | Crest-to-crest: player chip travels from selling club's crest to buying club's crest along a 40pt arc, fee numeral counts up in tabular figures |
| Trophy / promotion | **1800 ms** | `ease/emphasised` | The *only* place particles are allowed. Max twice per in-game season. |
| Attribute value change | **400 ms** | `ease/standard` | Numeral crossfades + heat-ramp colour tween; **only** on the player profile, never in a list |

**Where motion is banned.**
- No animation on rows as you scroll a list. Ever. Entrance animations on scroll are the single most common way a data app starts feeling cheap and slow.
- No spinners. Skeletons or nothing.
- No number count-up in tables — only on hero figures (fee, scoreline, balance).
- No parallax, no page-curl, no 3D card flips, no bouncing tab bars.
- No celebration for routine events: a completed training session, a scouted player, a saved tactic. Confetti for a 1–0 win against Rotherham devalues the trophy lift.
- No blocking animation. Every celebratory sequence is interruptible by a tap, and every one of them is skipped entirely if the user has turned on `prefers-reduced-motion` / *Reduce Motion* — in which case the end state simply appears with a 120 ms crossfade. Add an in-app **"Reduce celebrations"** toggle for the second-season veteran who now sims 60 matches an hour.

---

## 8. Iconography

**Recommended base set: Lucide** — **ISC licence** (permissive, MIT-compatible, commercial use fine, no visible attribution required, keep the licence text in source). Drawn on a **24×24 grid with a 2px stroke, round caps, round joins**, which matches the editorial-not-playful tone and stays legible at 20pt. **Phosphor** (MIT) is the approved alternative if we want its optional filled/duotone weights.

Lucide has no football vocabulary, so we draw **~14 custom glyphs on the identical 24×24 / 2px grid** — this is the standard approach and keeps the set visually seamless. Custom glyphs get a filled variant for selected states.

**The ~30 icons v1 needs**

*Navigation & structure (6):* home/dashboard · squad · fixtures (calendar) · table (list-ordered) · inbox (envelope) · settings (sliders).
*Football-specific — custom (14):* **ball** · **boot** (goal) · **assist** (arrow-into-net) · **pitch/formation** · **whistle** · **yellow card** · **red card** · **substitution** (paired up/down arrows) · **captain armband** · **clean sheet** (shield-zero) · **penalty spot** · **corner flag** · **stadium** · **training cone**.
*Squad & player (5):* injury (cross) · fitness (heart-pulse) · morale (smile/frown pair) · contract (file-signature) · scout (binoculars).
*Transactions & money (5):* transfer-in (arrow-down-into-tray) · transfer-out (arrow-up-from-tray) · money (banknote) · trending-up · trending-down.
*Utility (6):* search · filter · sort (arrow-up-down) · chevron-right · close (x) · info (circle-i).
*Status (4):* star (rating) · lock · check-circle · alert-triangle.

That is **40 icons** total — the 30 the brief anticipated plus the football set that has no off-the-shelf equivalent. Every icon that carries meaning is paired with a text label or an accessible name; icon-only controls get a 44×44pt hit area and a `contentDescription`/`accessibilityLabel`.

---

## 9. v1 asset checklist

| # | Asset group | Type | Count | Produced how |
|---|---|---|---|---|
| 1 | Crest shield silhouettes | SVG path | 8 | Hand-drawn |
| 2 | Crest field divisions | SVG path | 12 | Hand-drawn |
| 3 | Crest ordinaries | SVG path | 7 | Hand-drawn |
| 4 | Crest charges | SVG path | 40 | Hand-drawn |
| 5 | Crest fimbriation styles | SVG rule | 4 | Code |
| 6 | Crest furniture (scroll, arc-text, stars, laurel) | SVG path | 5 | Hand-drawn |
| 7 | Tincture palette | tokens | 18 | Defined above |
| 8 | Kit base mesh (torso/sleeves/collar) | SVG | 1 | Hand-drawn |
| 9 | Kit patterns | SVG clip | 14 | Hand-drawn |
| 10 | Kit sleeve / collar / trim variants | SVG | 11 | Hand-drawn |
| 11 | Player avatar parts | SVG | ~150 | Hand-drawn |
| 12 | Shirt-number chip | component | 1 | Code |
| 13 | Icon set (Lucide subset) | SVG | 26 | Licensed (ISC) |
| 14 | Icon set (custom football) | SVG | 14 | Hand-drawn |
| 15 | Competition mark generator parts | SVG | 12 | Hand-drawn |
| 16 | National flag set (vector, top 60 nations) | SVG | 60 | Public-domain vectors |
| 17 | Pitch / formation overlay | SVG | 1 + 12 formation presets | Hand-drawn |
| 18 | Attribute heat ramp | tokens | 5 | Defined above |
| 19 | Form chip (W/D/L) | component | 3 states | Code |
| 20 | Stadium / atmosphere backdrop plates (abstract, non-photographic) | WebP | 6 | Illustrated |
| 21 | Grain tile + pitch-texture tile | WebP | 2 | Illustrated |
| 22 | Empty-state illustrations | SVG | 6 | Hand-drawn |
| 23 | Goal-moment slab + diagonal wipe | component | 1 | Code |
| 24 | Trophy silhouettes (league / cup / continental) | SVG | 6 | Hand-drawn |
| 25 | Fonts (Archivo + Inter, variable, subsetted) | woff2/ttf | 2 families | Licensed (OFL 1.1) |
| 26 | App icon + splash | raster set | 1 set | **Branding agent** |
| 27 | Store screenshots / feature graphic | raster | 8 | **Branding agent** |
| | **Total hand-authored vector assets** | | **≈ 430** | |

**Definition of done for v1 art:** all 430 assets on-grid and colour-tokenised; the crest generator passes a 2,500-club distinctness audit at 24pt; the kit renderer derives colours from crest tinctures automatically; both themes' tokens defined; every one of the contrast ratios in §3 re-verified in the shipped build; `prefers-reduced-motion` honoured on every sequence in §7.

---

## Sources

- [Inter font family — rsms](https://rsms.me/inter/) · [rsms/inter (GitHub)](https://github.com/rsms/inter) — SIL OFL 1.1, tabular figures
- [Omnibus-Type/Archivo (GitHub)](https://github.com/Omnibus-Type/Archivo) — SIL OFL 1.1, variable width axis
- [jpt/barlow (GitHub)](https://github.com/jpt/barlow) · [Barlow Condensed — Google Fonts](https://fonts.google.com/specimen/Barlow%2BCondensed) — SIL OFL 1.1
- [SIL Open Font License — Wikipedia](https://en.wikipedia.org/wiki/SIL_Open_Font_License)
- [Lucide licence (ISC)](https://lucide.dev/license) · [lucide-icons/lucide LICENSE](https://github.com/lucide-icons/lucide/blob/main/LICENSE) · [Icon licence comparison](https://www.adastack.io/icon-licenses)
- [Division of the field — Wikipedia](https://en.wikipedia.org/wiki/Division_of_the_field) · [Rule of tincture — Wikipedia](https://en.wikipedia.org/wiki/Rule_of_tincture) · [Heraldry: elements and grammar of heraldic design — Britannica](https://www.britannica.com/topic/heraldry/The-elements-and-grammar-of-heraldic-design) · [Fimbriation — Wikipedia](https://en.wikipedia.org/wiki/Fimbriation)
- [Dark Theme with MDC — Chris Banes, Android Developers](https://medium.com/androiddevelopers/dark-theme-with-mdc-4c6fc357d956) · [Design a dark theme with Material and Figma — Google Codelabs](https://codelabs.developers.google.com/codelabs/design-material-darktheme)
- [Top 10 Football Manager 2024 skins — Dotesports](https://dotesports.com/football-manager/news/top-10-football-manager-2024-skins-fm24-skins-ranked) · [Dark Polish FM24 Skin — FM Scout](https://www.fmscout.com/a-dark-polish-fm24-skin.html)
- [NG_Regens newgen facepack](https://ngregens.org/) · [Newgen faces — sortitoutsi](https://sortitoutsi.net/graphics/style/42/newgen-faces)
- [Crest Megapack, EA Sports FC 26 create-a-club — Nexus Mods](https://www.nexusmods.com/easportsfc26/mods/1197) · [Lords of Football — Wikipedia](https://en.wikipedia.org/wiki/Lords_of_Football)
- [AI-Generated Game Assets: Copyright, Ownership & Platform Disclosure — Promise Legal](https://blog.promise.legal/ai-generated-assets-game-ip-disclosure/) · [The NO FAKES Act Moves Forward — Kaufman & Canoles](https://www.kaufcan.com/newsroom/news/the-no-fakes-act-moves-forward-how-ai-voice-and-likeness-rights-could-reshape-entertainment-deals) · [AI Is Rewriting the Rules on Likeness — Lathrop GPM](https://www.lathropgpm.com/insights/ai-is-rewriting-the-rules-on-likeness-update-your-contracts-now/) · [Right of Publicity Revisited in the AI Era — Outside GC](https://outsidegc.com/blog/retail-marketing-social-media/right-of-publicity-revisited-in-the-ai-era/)
- [OpenType feature: tnum — Preussische Schriftgiesserei](https://www.preusstype.com/techdata/otf_tnum.php)
