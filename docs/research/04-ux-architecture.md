# 04 — UX Architecture: Structure & Behaviour

Owner: UX / Usability agent. Scope: information architecture, navigation, onboarding, interaction patterns, accessibility. **Not** colour, type, or art direction — that is the art-direction agent's document.

The brief is a contradiction: "a baby could play it" plus the breadth of FIFA Manager career mode. It is only a contradiction if depth lives in the *navigation*. It stops being one when depth lives in *optional overrides on top of always-good defaults*. Everything below follows from that single decision: **the game plays itself competently; the player's job is to disagree with it.** A newcomer never has to disagree. A fanatic disagrees fifty times a season. Both use the same screens.

---

## 1. The core loop UI

### The minimum path

The 20-second session must be complete and satisfying:

```
App open → Hub (Continue is already under the thumb) → tap CONTINUE
→ [0-2 action cards resolve, one tap each] → Match → Result → tap CONTINUE
→ Hub shows next fixture → close app.
```

That is **two mandatory taps** between launch and a played match. Everything else — squad tinkering, transfers, training — is opt-in detour, never a gate.

### Hub model: continue-first, with a triaged action queue

Three candidate models exist in this genre:

- **Inbox-first** (classic Football Manager). Fails on mobile. It opens with a wall of undifferentiated text and makes the player's first act *reading*. FM's own community complains about messy navigation and hard-to-find screens; App Store reviews of the Touch build cite an overcrowded UI and "a lack of visible buttons makes navigation difficult." Never open on a list.
- **Dashboard** (widget grid of finances, form, morale). Fails the 2-second test. A grid has no primary action, so a new player does not know what they are supposed to *do*.
- **Continue-button-first with a filtered action queue.** Adopted.

**Specification.** In the first 2 seconds the player sees, top to bottom: club identity strip, the next fixture card (opponent, home/away, date, one line of assistant opinion), a **NEEDS YOU** queue of at most three action cards, and a full-width primary button pinned above the tab bar. The button's label is always a verb naming the literal next event: `PLAY MATCH`, `CONTINUE TO FRIDAY`, `START PRE-SEASON`, `OPEN TRANSFER WINDOW`. Never the word "Continue" alone — it tells a newcomer nothing.

**The queue rule.** Only items that are (a) time-limited and (b) meaningfully change an outcome get a card. Injuries, contract expiries inside 6 months, an accepted bid awaiting your decision, board mandates, a scout report on a player you shortlisted. Everything else — congratulations, media chatter, youth intake fluff — is inbox-only, never a card, never a badge on the tab bar. If the queue is empty, the space collapses and the primary button rises further into the thumb zone. An empty queue is a *feature*, not dead space: it tells the player "nothing needs you, go play."

Autosave on every hub return. The app is never in a state where closing it loses progress; there is no "save" concept in the UI at all.

---

## 2. Navigation architecture

### Rules

1. **Five bottom tabs, fixed, always visible except during a match and during full-screen takeovers.**
2. **Nothing important is more than 2 taps from the hub.** Anything that would be 3+ must also be reachable at depth 1 via an action card when it is actually urgent.
3. **Tabs are nouns; screens inside them are segmented views, not new pages.** Squad/Tactics/Training are one screen with a segmented control, not three destinations.
4. **Modals for decisions, takeovers for events.** A modal is dismissible and returns you exactly where you were (bid, sub, offer contract). A takeover has no back button and ends in a decision or a result (match, press conference, season rollover, first run).
5. **Back is always a single chevron, top-left, plus edge-swipe. No nested back stacks deeper than two.**

### Sitemap

```
HUB (Home tab)
├── Inbox                                      [icon, top-right — depth 1]
│   └── Message detail (card stack)                        depth 2
├── Action card → its resolution modal                     depth 1
├── PRIMARY BUTTON → Match Takeover / Date advance         depth 1
├── Club identity strip → Club Overview                    depth 1
└── ⚙ Settings (modal)                                     depth 1
    ├── Accessibility  ├── Notifications
    ├── Assistant level └── Data / restart

SQUAD (tab)
├── [Lineup] segment  ← default
│   ├── Player card (modal)                                depth 2
│   │   ├── Attributes (Simple / Detailed toggle)          depth 3*
│   │   ├── Contract → Renew (modal)                       depth 3*
│   │   └── Training focus                                 depth 3*
│   ├── Auto-pick button
│   └── Formation picker (modal)                           depth 2
├── [Tactics] segment                                      depth 2
│   ├── Style presets (6 big cards)  ← default view
│   └── ADVANCED drawer: 12 sliders, roles, set pieces     depth 3*
└── [Training] segment                                     depth 2
    ├── Weekly plan presets
    └── ADVANCED drawer: per-unit schedules                depth 3*

TRANSFERS (tab)
├── [Search] segment ← default (position + budget only)
│   ├── Player card → Make Offer (modal)                   depth 2
│   └── MORE FILTERS drawer (age, foot, wage, traits…)     depth 3*
├── [Shortlist] segment                                    depth 2
├── [My Deals] segment — bids in/out, statuses             depth 2
└── [Scouting] segment — assign scouts, reports            depth 2

CLUB (tab)
├── Overview ← default (facilities, staff, board mood)
├── Finances card → Finances detail                        depth 2
│   └── ADVANCED: full ledger, projections                 depth 3*
├── Board card → Requests / Mandates                       depth 2
├── Staff card → hire/fire                                 depth 2
└── Youth card → academy, intake                           depth 2

WORLD (tab)
├── [Table] segment ← default
├── [Fixtures] segment                                     depth 2
├── [Cups] segment                                         depth 2
└── [Stats] segment — top scorers, form guide              depth 2

TAKEOVERS (no tab bar, entered from context)
├── First-Run / Club Selection
├── Match Day
├── Press Conference
├── Season Rollover / End-of-season review
└── Contract Negotiation (opponent-facing)
```

`depth 3*` = advanced-only, behind a drawer that a newcomer never opens. **The 2-tap rule applies only to depth 1–2 content, and every depth-3 item has a depth-1 action-card path when it becomes urgent.**

### Core screen table

| Screen | Purpose | What's on it | Primary action | Taps from hub |
|---|---|---|---|---|
| **Hub** | Orient + advance time | Next fixture, ≤3 action cards, primary button, inbox badge | `PLAY MATCH` / date advance | 0 |
| **Inbox** | Non-urgent narrative | Card stack, newest first, swipe to archive | Read / archive | 1 |
| **Action modal** | Resolve one urgent thing | One question, 2–3 big buttons, assistant pick marked | Accept recommendation | 1 |
| **Squad – Lineup** | Pick XI | Pitch view, 11 slots + bench strip, fitness dots | Auto-pick, or drag a swap | 1 |
| **Player card** | Judge one player | Photo, role, form, fitness, morale, 6 star-bars, contract line | Set role / offer contract | 2 |
| **Squad – Tactics** | Choose approach | 6 style preset cards, current one selected, assistant's suggestion flagged | Tap a preset | 2 |
| **Squad – Training** | Set weekly load | 4 plan presets + intensity slider | Tap a plan | 2 |
| **Transfers – Search** | Find a player | Position chips, budget slider, results as cards | Open player → Make Offer | 1 |
| **Make Offer modal** | Bid | Fee stepper, valuation bar, "likely / unlikely" verdict | `SEND OFFER` | 2 |
| **Transfers – My Deals** | Track bids | In/out lists with plain-language status | Respond to a counter | 2 |
| **Transfers – Scouting** | Delegate discovery | Scout assignments, arriving reports | Assign a scout | 2 |
| **Club – Overview** | Club health at a glance | Board mood, finance headline, facilities, staff count | Open a card | 1 |
| **Finances** | Money detail | Balance, wage bar vs cap, transfer budget, 3 KPI rows | Request funds | 2 |
| **Board** | Expectations | Mandate, confidence meter, open requests | Accept / negotiate | 2 |
| **World – Table** | Standing | League table, your row pinned + highlighted | Tap a club | 1 |
| **Match Day (takeover)** | Play the game | Score, clock, event feed, speed control, subs button | Watch / skip / sub | 1 |
| **Press Conference (takeover)** | Flavour + morale lever | One question, 3–4 answer buttons, tone icons | Pick an answer | 1 (from match end) |
| **Club Selection (takeover)** | Start a save | 3 recommended clubs + browse | `TAKE THE JOB` | first run only |

### Wireframe sketches

Structure only — proportions, hierarchy, and thumb placement. Visual treatment is the art-direction agent's.

**Hub** — the 2-second read: who I am, who's next, what needs me, what to press.

```
┌────────────────────────────────┐
│ [crest] BURNLEY FC     ✉ 3   ⚙ │  display + non-essential icons
├────────────────────────────────┤
│ SAT 17 AUG · MATCHDAY 1        │
│ ┌────────────────────────────┐ │
│ │  BUR   v   TOT             │ │  next fixture card
│ │  HOME · 15:00 · Prem       │ │
│ │  "Tough one. I'd sit deep."│ │  assistant, 1 line
│ └────────────────────────────┘ │
│                                │
│ NEEDS YOU                   2  │  collapses to nothing if empty
│ ┌────────────────────────────┐ │
│ │ ⚕  Hartman — 2 weeks out   │ │
│ │    Replace him          ›  │ │  1 tap → resolution modal
│ ├────────────────────────────┤ │
│ │ 🏛  Board: finish top 10    │ │
│ │    Accept · Discuss     ›  │ │
│ └────────────────────────────┘ │
│                                │
│         (free space)           │
│ ┌────────────────────────────┐ │
│ │      ▶   PLAY MATCH        │ │  64pt, full width, thumb arc
│ └────────────────────────────┘ │
├────────────────────────────────┤
│  🏠     👥      ⇄      🏟     🌍 │
│ Home  Squad Transfer Club World│
└────────────────────────────────┘
```

**Squad → Lineup** — drag-to-swap, with delegation always one tap away.

```
┌────────────────────────────────┐
│ ‹        SQUAD                 │
│ [ LINEUP ] Tactics  Training   │  segmented, not separate pages
├────────────────────────────────┤
│ 4-4-2 ▾            AUTO-PICK   │  formation modal | delegate
│ ┌────────────────────────────┐ │
│ │        ( 9 )   ( 10 )      │ │
│ │                            │ │
│ │  ( 7 )  ( 8 )  ( 6 ) ( 11 )│ │  slots ≥56pt, drag to swap
│ │                            │ │  tap-tap fallback identical
│ │  ( 3 )  ( 5 )  ( 4 ) ( 2 ) │ │
│ │                            │ │
│ │            ( 1 )           │ │
│ └────────────────────────────┘ │
│ BENCH  ← swipe →               │
│ ┌────┐┌────┐┌────┐┌────┐┌────┐ │
│ │Ryan││Cole││Amos││Diaz││Kane│ │  fitness ring + form pills
│ │●●●●││●●● ││●●●●││●●  ││●●●●│ │  on every card
│ │WWDL││ LDW││WWWD││ DLL││WWWW│ │
│ └────┘└────┘└────┘└────┘└────┘ │
│ ┌────────────────────────────┐ │
│ │        CONFIRM XI          │ │
│ └────────────────────────────┘ │
├────────────────────────────────┤
│  🏠     👥      ⇄      🏟     🌍 │
└────────────────────────────────┘
```

**Match Day** — takeover, no tab bar, speed control permanently under the thumb.

```
┌────────────────────────────────┐
│ BUR  1 — 0  TOT          67'   │  fixed header
├────────────────────────────────┤
│                                │
│      [ pitch / visual ]        │  art agent owns this region
│                                │
├────────────────────────────────┤
│ MOMENTUM  ▓▓▓▓▓▓▓░░░░░░        │  single bar, no chart
├────────────────────────────────┤
│ 64' ⚽ FOSTER — low drive!      │  reverse-chron feed
│ 58' 🟨 Reed — late challenge   │
│ 41' ✋ Great save from Ryan     │
├────────────────────────────────┤
│ ┌──────────────────────────┐   │
│ │KEY·│Highlt│ Full │Instant│   │  4-way, changeable any time
│ └──────────────────────────┘   │
│ ┌────────────┐  ┌────────────┐ │
│ │    SUBS    │  │   TACTICS  │ │
│ └────────────┘  └────────────┘ │
└────────────────────────────────┘

  ── interrupt sheet (max 3 per match, match pauses above) ──
┌────────────────────────────────┐
│ 67' — Foster is fading.        │
│ ┌────────────────────────────┐ │
│ │ BRING ON DIAZ    ★ suggested│ │  assistant pick badged
│ ├────────────────────────────┤ │
│ │ BRING ON COLE               │ │
│ ├────────────────────────────┤ │
│ │ NO CHANGE                   │ │
│ └────────────────────────────┘ │
│ MORE OPTIONS ▾                 │
└────────────────────────────────┘
```

**Transfers → Search + Make Offer** — two filters visible, everything else drawered.

```
┌────────────────────────────────┐
│ ‹      TRANSFERS               │
│ [SEARCH] Shortlist Deals Scouts│
├────────────────────────────────┤
│ POSITION  (GK)(DF)(MF)[ST]     │  chips, one tap
│ BUDGET    ├────────●──────┤    │
│           up to £4.5m          │  words, not a text field
│ MORE FILTERS ▾                 │  ← advanced drawer
├────────────────────────────────┤
│ ┌────────────────────────────┐ │
│ │ M. OKAFOR      ST · 23     │ │  swipe → to shortlist
│ │ ★★★★☆   Fits your style    │ │
│ │ Asking about £3.8m         │ │
│ └────────────────────────────┘ │
│ ┌────────────────────────────┐ │
│ │ L. VIEIRA      ST · 29     │ │
│ │ ★★★★★   Wages may be steep │ │
│ │ Asking about £6.2m         │ │
│ └────────────────────────────┘ │
├────────────────────────────────┤
│  🏠     👥      ⇄      🏟     🌍 │
└────────────────────────────────┘

  ── Make Offer modal ──────────────
┌────────────────────────────────┐
│ OFFER FOR M. OKAFOR         ✕  │
│                                │
│ FEE      ⊖    £3.8m    ⊕       │  stepper, never free text
│ ┌────────────────────────────┐ │
│ │ you ▓▓▓▓▓▓▓▓▓│ them ░░░    │ │  valuation vs offer
│ └────────────────────────────┘ │
│ "They'd probably accept."      │  live plain-language verdict
│                                │
│ ADVANCED ▾  (clauses, wages)   │
│ ┌────────────────────────────┐ │
│ │        SEND OFFER          │ │
│ └────────────────────────────┘ │
└────────────────────────────────┘
```

---

## 3. Progressive disclosure

Four mechanisms, applied uniformly. Do not invent a fifth.

**1. Assistant-recommended default, pre-selected.** Every choice surface opens with the assistant's answer already selected and visibly labelled as such ("Your assistant suggests"). The player's minimum action is to confirm. Never present an unanswered question with no default — that is the moment a newcomer quits. The assistant's pick must be genuinely competent; a bad default poisons trust permanently.

**2. Presets before parameters.** Tactics opens as six named style cards with a plain-English sentence each ("Sit deep, break fast — good against better teams"). Training opens as four weekly plans. Scouting opens as position + budget. The parameter space exists underneath, never above.

**3. The ADVANCED drawer.** One consistent affordance across the whole app: a full-width row at the bottom of a screen reading `ADVANCED ▾`. Tapping expands in place — it does not navigate. Its state is remembered per screen, forever. A player who opens the tactics drawer once has opened it; it stays open. A player who never taps it never sees a slider in their life. This is the single most important control in the design: **it is how the same build serves both audiences without a difficulty setting.**

**4. Earned unlocks, framed as offers not gates.** Systems appear when they first become relevant, announced by the assistant in one sentence with an accept/decline: scouting network at the first transfer window, contract clauses at the first renewal of a player worth more than the club paid, youth intake in March of season 1, finance detail the first time the board sets a budget. Declining is permanent-until-asked-for and never nags. Nothing is *locked* — the tab is there from day one — but the player is only *told* about it once.

**Assistant level setting** (Settings, three options, default middle): *Handle it for me* (assistant auto-resolves routine action cards and reports what it did), *Suggest and I decide* (default), *I'll do everything* (no recommendations shown, all drawers open by default). Changing this is a one-tap re-skin of the entire game's demandingness. A fanatic sets it to the third option in minute one and never feels condescended to again.

---

## 4. Onboarding: the first five minutes

Principles from mobile-game FTUE practice: open directly into something, teach one mechanic at a time by doing it, give an early win, defer permissions and settings, cap explanatory text at one sentence per moment. No modal tutorial overlays with "Next →". No dimmed-screen finger-pointer chains longer than one step.

### Minute-by-minute script

**0:00–0:20 — No menu.** App opens on a full-bleed takeover: "Which club do you support?" and a search field with the keyboard already up. Typing three letters filters. No account, no settings, no privacy prompt, no difficulty choice.

**0:20–0:50 — Club selection.** Having named a club, show three cards: *Your club* (their pick), *An easier start* (a mid-table side in the same league), *A proper challenge* (a struggling lower-league side). Each card carries three plain lines: league, budget in words ("Almost no money"), and the board's one-line expectation. Big `TAKE THE JOB` button. Browse-all is a secondary text link for people who want it.

**0:50–1:20 — Arrival.** Single takeover: the chairman's welcome, four sentences maximum, ending with the mandate stated as one sentence ("Finish 10th or better. Don't spend money we don't have."). One button: `GET TO WORK`. This is the only prose block in the entire onboarding.

**1:20–2:10 — First teaching moment: pick a team.** Land on Squad → Lineup, *not* the hub. The XI is already picked by the assistant. A single coach-mark points at one thing only: a player flagged with a fatigue icon. Caption: "Hartman is tired. Drag someone on." The player drags any bench player onto the slot. The swap animates, the fatigue flag clears, a subtle confirmation fires. **Mechanic taught: drag-to-swap. Nothing else.** If they do nothing for 12 seconds, the assistant offers `AUTO-PICK` and the flow continues — the tutorial cannot be failed or stalled.

**2:10–2:40 — Second teaching moment: choose a style.** Auto-advance to the Tactics segment. Six preset cards, the assistant's pick already selected and badged. Caption: "Pick how you want to play. You can change this any time." Any tap proceeds. No sliders exist on this screen yet. `ADVANCED ▾` is visible but unexplained — deliberately. Curious players find it; nobody is told they should.

**2:40–3:00 — The hub, finally.** First time the tab bar and hub appear. The action queue is deliberately seeded with exactly one card: a squad-registration or shirt-number nicety that resolves in one tap and cannot go wrong. The player learns *the queue is a thing you clear* before it ever contains something scary. Then the button: `PLAY MATCH`.

**3:00–4:30 — First match.** Full takeover. Starts on **Highlights** speed. The first match is scripted to be competitive and to produce at least one moment where the player is offered a substitution prompt around the 60th minute. Two named suggestions plus `NO CHANGE`, assistant's pick badged. **Mechanic taught: you can intervene mid-match, and it is one tap.** Result is not scripted to be a win — a scripted win teaches nothing and reads as fake — but the post-match screen must find something positive to name regardless of result.

**4:30–5:00 — The hook.** Post-match takeover: score, a player-of-the-match card with a one-line quote, and the next fixture with a countdown. Primary button `CONTINUE`. On tapping it, the *only* system prompt of the session appears: notification permission, phrased around the specific thing they just saw — "Want me to tell you when your next match is ready?" Asked here, after value, not at launch.

### What must be understood before the first match
Where the team is (Squad tab). That the XI can be changed by dragging. That a tactic is a named style, not a parameter set. That the big button advances time. That the assistant has an opinion and it is usually fine.

### What waits
Season 2 or first relevance: contract clauses, scouting filters, finance detail beyond one balance number, youth development, staff hiring, set-piece routines, individual training, loan structures, board fund requests. **Season 1 has no wage-bill screen and no attribute numbers unless the player opens a drawer.**

---

## 5. Decision surfaces

One pattern per decision type. Consistency beats cleverness; a player should be able to predict the interaction before the screen loads.

| Decision | Pattern | Why / tradeoff |
|---|---|---|
| **Team selection** | Pitch view + **drag-to-swap**, with `AUTO-PICK` always present | Drag is spatial and needs no reading; it is the one gesture worth teaching. Tradeoff: drag is imprecise on small phones, so slots are ≥56pt and a *tap-tap* fallback (tap player, tap destination) does the same thing. Never require a long-press. |
| **Substitutions (in match)** | **Big-button choice**, 2 suggestions + `NO CHANGE`, on a half-height sheet over the live match | Speed matters; the match is running. Full sub control is behind `MORE OPTIONS` on the same sheet. Tradeoff: limits expression — acceptable, because the sheet expands. |
| **Transfer bid** | **Stepper + verdict bar** in a modal. Fee adjusts in sensible increments, a bar shows their valuation vs your offer, and a plain-language verdict updates live ("They'd probably say no") | A free-text number field is the worst possible mobile input for this. Stepper removes the "what number is even reasonable?" paralysis. |
| **Board requests / mandates** | **Two-option big buttons** with consequence preview text under each | Binary, high-stakes, infrequent. Never a slider. Show the consequence *before* the tap, never after. |
| **Press questions** | **Card stack**, one question per card, 3–4 answer buttons with tone icons (calm / defiant / blame-me / praise-them) | Card stack makes a multi-question sequence feel short and skippable. `SKIP ALL` is always available and costs a small, stated morale penalty rather than being punished silently. |
| **Contract renewal** | **Sheet with three pre-built packages** (Keep it cheap / Fair / Whatever it takes) + `ADVANCED ▾` for clauses | Packages let a newcomer renew a contract in one tap; the drawer holds the clause matrix fanatics want. |
| **Scouting** | **Position chips + budget slider**, results as swipeable cards; swipe-right shortlists | Swipe is right for triage of many similar items. Never use swipe for anything destructive or irreversible. |
| **Formation** | **Grid of named shapes** in a modal, each with one-line strengths | Recognisable, tappable, no dragging of tactical dots. |

Universal rules: destructive or expensive actions (sell a player, sack staff, accept a bid) require a confirmation sheet that restates the outcome in a full sentence. Nothing irreversible is ever a swipe. Every modal has one clear primary and at most one secondary. Never three equal-weight buttons.

---

## 6. The match experience

Match is a **full-screen takeover with no tab bar**. It is the emotional core and the most common drop-off point, so it must serve four very different intents without a settings trip.

**Four speeds, one control.** A segmented control pinned bottom-centre, always in the thumb zone, changeable at any moment mid-match without penalty:

- `KEY MOMENTS` (default) — only goals, big chances, cards, injuries. ~60–90 seconds per match.
- `HIGHLIGHTS` — adds near-misses and momentum swings. ~3 minutes.
- `FULL` — continuous event feed with a speed slider.
- `INSTANT` — skip to full time immediately.

Instant Result is a proven need, not a concession: FM players use it heavily for cup ties and friendlies, and FM 26 finally shipped it natively after years of community mods. **Ship it on day one and put it on the main control, not buried in settings.** The player who skips 30 matches to reach the one that matters is still playing your game.

**Presentation.** The pitch representation is the art agent's call; the *information layout* is not. Top: score, clock, and the two crests. Middle: the visual. Lower-middle: a reverse-chronological event feed of short lines with an icon per event type. Bottom: speed control and a `SUBS` button. Momentum is a single horizontal bar, not a chart.

**When to interrupt.** Interrupt only for: an injury to a starter, a red card, conceding two goals inside ten minutes, and one scripted "shall we change something?" prompt in the 60–70th minute window if the game is close. **Maximum three interruptions per match.** Each is a half-height sheet — the match stays visible above it and *pauses*. Never interrupt for a goal you scored, a yellow card, or a substitution the opponent made.

**When to leave them alone.** Everything else. If the player has chosen `INSTANT`, interrupt for nothing at all; deliver every consequence in the post-match summary instead.

**Post-match.** One takeover, three things: the score with a one-line story, player-of-the-match, and the next fixture. Ratings and full stats are behind a `FULL STATS` link, not on the screen by default. Then `CONTINUE` returns to the hub with the queue already refreshed.

---

## 7. Numbers & legibility

### The three-layer number rule

Every quantity has three representations. The player's chosen layer applies globally, set once by the assistant-level setting and overridable in Settings.

| Quantity | Layer 1 (default) | Layer 2 (drawer) | Layer 3 (advanced) |
|---|---|---|---|
| Player quality | 5 stars, half-steps | Star + role label ("Solid starter") | 1–20 attributes |
| Money | Words + magnitude ("About £4m spare") | Rounded figure | Full ledger |
| Form | 5 result pills W/D/L | Pills + goals | Rolling xG, per-90s |
| Morale | Face icon + word ("Happy") | Word + reason | Numeric 0–100 |
| Fitness | Ring fill + word ("Fresh") | % | Load history |
| Condition risk | Icon only | Icon + word | Injury probability |

**Stars for potential and quality; bars for anything with a ceiling (fitness, wage budget used); words for feelings (morale, board confidence); pills for sequences (form).** Never a bare number in Layer 1. Never a percentage where a word will do.

### Accessibility — hard numbers

- **Tap targets: 48×48dp minimum everywhere** (Material's floor, ~9mm physical, and it satisfies Apple's 44×44pt iOS guidance simultaneously). Primary buttons 56–64pt tall, full width minus 16pt margins. **8dp minimum spacing between adjacent targets.**
- WCAG 2.2 SC 2.5.8 (AA) requires only 24×24 CSS px; SC 2.5.5 (AAA) requires 44×44. **We hold the AAA bar on every control.** FM Mobile reviews specifically cite "text often small and buttons fiddly to press" — this is the exact failure to avoid.
- **Type: nothing below 11pt (iOS) / 12sp (Android); body copy 16sp/17pt.** Support Dynamic Type and Android font scaling through the full range including the AX1–AX5 accessibility sizes, where body text scales to roughly 310%. **No fixed-height text containers, anywhere.** Layouts must reflow, not clip.
- **Colourblind safety.** Roughly 8% of men have a red-green deficiency. Never encode meaning in colour alone: every positive/negative state carries an icon or a word as well as a hue. Form pills carry W/D/L letters. Fitness carries a word. Bid verdicts carry text. Test every screen under deuteranopia simulation before sign-off.
- **Reach zones.** About 49% of phone use is one-handed and ~75% of interactions are thumb-driven. On a 6.7" device the comfortable arc is the bottom ~55% of the screen, centre-weighted. **Every primary action lives there.** The top strip is display-only (crest, score, clock, title) plus two destructive-proof icons (inbox, settings) that are never required to complete a task. Never put a confirm button top-right.
- Full VoiceOver/TalkBack labels on every control; star ratings announce as "4 and a half out of 5", not as image counts.

---

## 8. Notifications & retention

Push is a **service, not a hook**. Ask for permission only after the first match, framed around the thing just experienced. Respect a "no" for at least 60 days and re-ask only on a genuine context change.

**Notify:** your next match is ready (once, at the player's usual play time); a transfer bid was accepted or rejected; a key player got injured or suspended; a contract enters its final 30 days; a season-defining result in your league that changes your position; end of season.

**Never notify:** "You haven't played in 3 days"; "Your squad misses you"; any countdown or expiring-offer timer; energy/stamina refills (there are none); anything with a fake-urgency verb; more than **one push per day, hard cap**; anything between 22:00 and 08:00 local.

Every notification deep-links to the exact screen that resolves it — never to the hub. In Settings, expose per-category toggles and a "quiet season" master switch. The retention argument for restraint is simple: one meaningful notification per day beats ten average ones, and a game that respects the player's attention is one they return to voluntarily for years.

---

## 9. Anti-patterns — never do these

1. **Never open on the inbox.** It is the single biggest reason newcomers bounce off management games.
2. **Never show a screen with no default answer.** A pre-selected assistant recommendation is mandatory on every choice.
3. **Never require pinch-zoom or horizontal scrolling to read a table.** Desktop grids ported to phones are the defining sin of this genre.
4. **Never put a confirm button in the top-right corner.**
5. **Never make the player scroll to find the primary action.** It is pinned.
6. **Never use a raw 1–20 attribute number in a Layer-1 view.**
7. **Never hide a required action inside a message the player might archive.** If it needs doing, it is an action card.
8. **Never punish delegation.** Auto-pick, auto-tactics, and Instant Result must produce competent results, not deliberately worse ones.
9. **Never gate depth behind a difficulty setting or an unlock grind.** The drawer is always there.
10. **Never nag.** One offer per new system, one push per day, no re-prompts.
11. **Never use a modal to deliver information.** Modals are for decisions only.
12. **Never lose the player's place.** Back from any depth-2 screen returns to the exact scroll position.
13. **Never show a loading screen longer than 400ms between hub and match.** Sim in the background during the pre-match takeover.
14. **Never use colour as the only signal.**
15. **Never write more than one sentence of instruction at a time.** If a concept needs a paragraph, it needs a better default instead.

---

## Sources

- [Apple HIG touch target guidance (44×44pt) — summary](https://medium.com/@zacdicko/size-matters-accessibility-and-touch-targets-56e942adc0cc)
- [Android touch target size — Android Accessibility Help](https://support.google.com/accessibility/android/answer/7101858?hl=en)
- [Material Design 3 — accessibility & structure](https://m3.material.io/foundations/designing/structure)
- [WCAG 2.5.8 Target Size (Minimum), AA](https://silktide.com/accessibility-guide/the-wcag-standard/2-5/input-modalities/2-5-8-target-size-minimum/)
- [Target Size (Minimum) vs Enhanced — wcag22aa.org](https://wcag22aa.org/new-criteria/target-size/)
- [The Thumb Zone: Designing For Mobile Users — Smashing Magazine](https://www.smashingmagazine.com/2016/09/the-thumb-zone-designing-for-mobile-users/)
- [How to design for thumbs in the era of huge screens — Scott Hurff](https://www.scotthurff.com/posts/how-to-design-for-thumbs-in-the-era-of-huge-screens/)
- [Mobile game onboarding UX strategies](https://medium.com/@amol346bhalerao/mobile-game-onboarding-top-ux-strategies-that-boost-retention-6ef266f433cb)
- [Onboarding decides your D1: first-session design — Playio](https://blog.playio.co/mobile-game-onboarding-retention)
- [Best practices for mobile game onboarding — Adrian Crook & Associates](https://adriancrook.com/best-practices-for-mobile-game-onboarding/)
- ["The new FM UI is so bad that…" — Sports Interactive Community](https://community.sports-interactive.com/forums/topic/595788-the-new-fm-ui-is-so-bad-that-football-manager-edition/)
- [Football Manager 26 Touch — App Store reviews](https://apps.apple.com/us/app/football-manager-26-touch/id1626267810?see-all=reviews&platform=iphone)
- [Football Manager 26 adds Instant Result — Operation Sports](https://www.operationsports.com/football-manager-26-adds-instant-result-option-for-matches/)
- [Match Day — Football Manager 2026 Mobile manual](https://community.sports-interactive.com/sigames-manual/football-manager-mobile-2026/match-day-r5263/)
- [Colour blindness: designing an accessible UI — UX Collective](https://uxdesign.cc/color-blindness-in-user-interfaces-66c27331b858)
- [WebAIM: Visual Disabilities — Colour-blindness](https://webaim.org/articles/visual/colorblind)
- [Push notifications for game retention — PushEngage](https://www.pushengage.com/push-notifications-game-retention/)
- [Apple typography guidance (11pt minimum) — Median](https://median.co/blog/apples-ui-dos-and-donts-typography)
- [Guide for mobile text scaling — Deque](https://docs.deque.com/devtools-mobile/2025.7.2/en/text-scaling/)
