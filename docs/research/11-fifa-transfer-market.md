# 11 — The FIFA 10/11/12 Transfer Market, Reconstructed

Research date: 20 Aug 2026. Owner: FIFA Career Mode research agent.
Scope: the transfer market of FIFA 10 Manager Mode, FIFA 11 Career Mode and FIFA 12 Career Mode — search screen, negotiation, valuation, scouting — and the cut-down version we should build.

**The owner's instruction:** the FIFA 10/11/12 transfer market is the model. *"That is what we need."* Our current market has "all the stupid needless details" and no way to filter. This document is the specification we build from.

---

## 0. Confidence key — read this first

This is a 15-year-old system with no surviving official documentation. Every claim below carries a marker:

| Mark | Meaning |
|---|---|
| **✅** | Directly documented in a primary source (EA developer blog, EA community manager, contemporaneous press, or the shipped game data files) |
| **🟡** | Multiple secondary sources agree (forum posts by players of the game at the time, contemporaneous guides) |
| **⚪** | Reconstructed by inference or from community memory. **Treat as a design proposal, not a fact.** |

**The single most valuable source found.** The shipped FIFA data files (`playervalues.ini`, `playerwages.ini`, `transfer.ini`, `transfers.ini`, `transferteamdecision.ini`, `playercontract.ini`, `scout.ini`) are plain text and survive in modding repositories. The copies used here are from a **FIFA 13** community patch ([mxcrml/fifa13-realistic-patch](https://github.com/mxcrml/fifa13-realistic-patch)). Two caveats, both important:

1. **FIFA 13 is not FIFA 12** — but FIFA 13's career mode was built on the same code as FIFA 12's (FIFA 12 rebuilt scouting and transfers; FIFA 13 iterated on it). One of the files in that repo is even commented `// (Valores do Mod FIFA 12)`.
2. **It is a community patch**, so some numbers are modded. The *structure* — the keys, the tables, the decision model — is EA's and is not something a modder invents. The *values* may be tuned. Where a number matters I say so.

Everything drawn from those files is marked ✅ for structure, ⚪ for exact value.

---

## 1. TL;DR — what actually made it good

Six things, in order of importance:

1. **The bid was one number.** No instalments, no sell-on clause, no buy-back, no player exchange, no release clause, no agent fee line item. You typed a fee. That is the whole offer. ✅ (Those features arrived with FIFA 18's negotiation table, six years later.)
2. **The filter screen returned a small, sorted, scannable list** with the four numbers that matter — overall, age, value, club — and you could sort it. 🟡
3. **A named human told you why it would fail before you bid.** The "negotiator" warned you: not enough financial power, rival club, he just joined them, your league isn't prestigious enough. ✅ This is the most-cited pleasure in the whole mode and it costs one line of text.
4. **Two stages, two answers.** Club yes / player no was a *story*, not an error. ✅
5. **Rejection had a reason and the reason was legible.** "They've just acquired him." "He's a home-town boy." "They want 9.4m." ✅
6. **It was fast.** Search, bid, advance, read email, done. The whole transfer window was inbox-driven and never blocked play. ✅

And one thing that made it *feel* deep without being deep: **you had to overpay for players who weren't listed.** ✅ That single rule creates the entire economy of the mode.

---

## 2. The search / scout screen

### 2.1 Where it lived

- **FIFA 10:** Manager Mode → **Transfer Centre** → *Transfer Market* (the list of already-listed players) or *Search Players* (manual search). ✅ FIFA Encyclopedia: "The Transfer Market lists players who are already up for sale, so they are easier to buy. You can manually search for players you would like to buy."
- **FIFA 11 / 12:** Career Mode HUB → **Transfers** → *Free Agents* / *Transfer Listed* / *Search Players* / *Negotiation History* / *Shortlist*. ✅ (Negotiation History confirmed by a FIFA 11 player: *"You should check out the negotiation history under transfers, and selecting the player."*)

The three-list structure matters and we should copy it: **Free Agents** and **Transfer Listed** were *browsable lists you skimmed first*, and **Search** was the thing you fell back to when neither had what you needed. That is exactly how the EA producer describes his own first day in FIFA 11:

> ✅ "First I have a look at the current Free Agents… On to the Transfer Listed players… No flat-out 'this is the guy I want' on here… Therefore I will search for non-transfer listed players that match my overall expectations."
> — Marcel Kuhn, Producer/Designer, FIFA 11 Career Mode ([WorthPlaying, 27 Aug 2010](https://worthplaying.com/article/2010/8/27/news/76511-fifa-11-all-details-career-mode-screens/))

### 2.2 The reconstructed filter set

The strongest evidence is the producer's own blog, which prints two of his searches verbatim:

> ✅ **"My next search is: Overall: 80-90 / Position: Midfield / Role: Centre Defensive Midfield / Transfer Status: Any / Max. Transfer Value: 10 Mil."**
>
> ✅ **"My next searches are: Overall: 75-85 / Acceleration: 80-100 / Position: Midfield / Role: Left/Right Wing / Transfer Status: Any / Max. Transfer Value: 10 Mil."**

And EA's UK community manager on what FIFA 11 *added*:

> ✅ "There are now a few more search options in the transfer market with you being able to search for a **primary attribute and a secondary attribute and respective ratings for them**." — Phil Wride, EA UK ([ModdingWay, Aug 2010](https://www.moddingway.com/news/1828.html))

That sentence is load-bearing: it tells us attribute filters are **new in FIFA 11**, which means FIFA 10 had the base set without them.

Age min/max is confirmed by a FIFA 11 player writing a how-to at the time:

> 🟡 "When looking for a specific player, let's say a Left Back with an overall of at least 55 and up to 65. **Make sure to set age limits, let's say 17-25 (love how they did this).**" — GameFAQs, FIFA Soccer 11 board

**The table.**

| Filter | FIFA 10 | FIFA 11 | FIFA 12 | Evidence |
|---|:---:|:---:|:---:|---|
| **Position** (line: GK / Defence / Midfield / Attack) | 🟡 yes | ✅ yes | ✅ yes | Producer blog prints `Position: Midfield` |
| **Role** (specific: CDM, LW/RW, ST…) | ⚪ probably | ✅ yes | ✅ yes | Producer blog prints `Role: Centre Defensive Midfield` |
| **Overall min–max** | 🟡 yes | ✅ yes | ✅ yes | Producer blog `Overall: 80-90`; GameFAQs "at least 55 and up to 65" |
| **Age min–max** | 🟡 yes | 🟡 yes | 🟡 yes | GameFAQs, FIFA 11 board |
| **Max transfer value** | 🟡 yes | ✅ yes | ✅ yes | Producer blog `Max. Transfer Value: 10 Mil` |
| **Transfer status** (Any / Transfer Listed / Loan Listed) | 🟡 yes | ✅ yes | ✅ yes | Producer blog `Transfer Status: Any`; secondary guides cite "listed"/"for loan" |
| **Primary attribute + min–max** | ❌ **no** | ✅ **new** | ✅ yes | EA community manager, explicitly framed as new for FIFA 11 |
| **Secondary attribute + min–max** | ❌ no | ✅ new | ✅ yes | Same |
| **Name search** | 🟡 yes | ⚪ yes | ⚪ yes | Weak — one secondary source ("search by the last name") |
| **Nationality** | ⚪ | ⚪ | ⚪ | Widely believed; **not confirmed** in any primary source found |
| **League / Club** | ⚪ | ⚪ | ⚪ | Same — assume present, do not treat as fact |
| **Wage / max wage** | ⚪ | ⚪ | ⚪ | Not found. The wage constraint was expressed via the **Budget Allocator**, not a filter |
| **Contract expiry / length** | ❌ | ❌ | ❌ | No evidence. Contract-expiry filtering is a later-FIFA feature |
| **Preferred foot** | ❌ | ❌ | ❌ | No evidence in career mode search (it exists in FUT) |
| **Height / weight** | ❌ | ❌ | ❌ | No evidence |
| **Work rate** | ❌ | ❌ | ❌ | No evidence |
| **Potential** | ❌ | ❌ | ❌ | **Never a filter.** Potential was hidden; only the assistant's prose hinted at it |

**The headline finding: the filter set is small.** Six to eight controls, one screen, no scrolling. There is no potential filter, no contract filter, no foot/height/work-rate filter. The owner's complaint about "stupid needless details" is a complaint about a *later* FIFA design, not this one.

### 2.3 What the results looked like

🟡/⚪ — reconstructed from player accounts, since no screenshot analysis was possible.

- Results came back as a **flat sortable table**, roughly 8–12 rows visible at once. The FIFA 11 player guide says *"Look at the prices of the first 10 results."*
- **Sorting was the primary interaction after searching.** 🟡 *"First thing you need to do is sort the players by age, or overall, depending on what you think is more important."* Sorting by value/price is also implied ("toggle between the highest and lowest transfer costs").
- The row carried, at minimum: **Name, Age, Position/Role, Overall, Club, Market Value.** ⚪ Contract length and wage were probably on the row too but this is not confirmed.
- **Potential was not on the row.** ✅ (It was not visible anywhere for a bought player in FIFA 10 without the scout chart, and was never a search field.)
- Results were **not paginated in a page-number sense**; you scrolled the list.

### 2.4 One detail worth stealing verbatim

> ✅ "Changing the offers is now faster as you can **modify each digit individually**." — Marcel Kuhn, FIFA 11

They shipped a *digit-wheel* for the fee because typing a big number on a controller is slow. On a phone the equivalent problem is worse. See §10.3.

---

## 3. The player detail view

⚪ Largely reconstructed; the visual hierarchy below is inferred from what the producer's playthrough references and from the FIFA 11/12 player-card conventions.

What was surfaced, in rough order of prominence:

1. **Name, club crest, nationality flag, age, position/role, and the big Overall number.** The Overall dominated.
2. **Market value** and **current wage**. The producer reasons in exactly these terms: *"at 6.3 Mil Market Value he carries the smallest price tag."*
3. **Contract expiry.**
4. **Attributes.** FIFA 11/12 grouped ~35 attributes into panels (Pace, Shooting, Passing, Dribbling, Defending, Physical, plus goalkeeping). You could see them but they were a *second screen or a scroll*, not the first thing.
5. **Transfer status** — listed / loan listed / not for sale.
6. **Form and morale.** ✅ FIFA 12 made morale a first-class concept — *"player morale and opinion factoring into the transfer equation"* (Simon Humber, Creative Director) — and morale/form are literally value modifiers in the data files (§5.2).
7. **Potential: never a number.** ✅ In FIFA 10 the scout could predict future overall only *after* you bought the player. In FIFA 11/12 potential surfaced as **assistant-coach prose** on the Player Growth screen: *"Has reached his potential, isn't going to grow anymore"*, *"could develop quickly if given game time."*

**The design lesson.** The detail view was not an attribute dump. It was: *who is he, what does he cost, what does he earn, how long is he tied up, and does anybody think he'll get better.* Attributes were available but demoted.

---

## 4. The negotiation flow

### 4.1 The two stages

FIFA 11 introduced the structure that FIFA 12 kept:

> ✅ "The transfer system is now a **two-stage negotiation** where you agree a fee with the club in question and then have to agree terms with the player themselves… I've already had the experience of the club saying yes and the player saying no (Higuain) as he didn't want to move country." — Phil Wride, EA UK

### 4.2 What was in an offer

**Stage 1 (club): a single cash fee. Nothing else.** ✅

There were **no** instalments, **no** sell-on clause, **no** buy-back, **no** player-exchange, **no** release clause in FIFA 10/11/12 career mode. Those are FIFA 18-era additions, introduced with the cutscene negotiation table. If the owner remembers those from FIFA 12, that memory is of a later game.

The only structural variant that existed was the **loan**, and FIFA 12 added **option-to-buy after a loan** ✅ (*"Loans will now come with the option to purchase"*).

**Stage 2 (player): wage + contract length.** ✅ The producer: *"I increase my offer to 65k/week for a 3 year long contract."* Squad role and signing bonus exist in the underlying data model (§4.6) but were not exposed as sliders the way FIFA 18+ exposes them.

### 4.3 The flow, step by step

```
                    ┌──────────────────────────────┐
                    │  TRANSFERS                   │
                    │  Free Agents │ Listed │ Search│
                    └───────────────┬──────────────┘
                                    │  set filters, sort, pick a player
                                    ▼
                    ┌──────────────────────────────┐
                    │  PLAYER  →  MAKE OFFER       │
                    │  fee entered digit-by-digit  │
                    └───────────────┬──────────────┘
                                    │
                                    ▼
              ╔═════════════════════════════════════════════╗
              ║  NEGOTIATOR PRE-WARNING  (before you send)  ║  ✅ the beloved bit
              ║  • "You don't have the financial power."    ║
              ║  • "Rival team — you'll have to pay more."  ║
              ║  • "He just joined them, he won't leave."   ║
              ║  • "Your league isn't prestigious enough."  ║
              ║  • "He's a starting XI player — pay extra   ║
              ║     just to have the offer looked at."      ║
              ╚═════════════════════╤═══════════════════════╝
                                    │  send
                                    ▼
                    ┌──────────────────────────────┐
                    │  ADVANCE THE CALENDAR        │  ✅ you must sim ≥1 day
                    │  reply lands in 1–3 days     │     (FIFA 10: ≥1 match)
                    │  sim halts when email arrives│
                    └───────────────┬──────────────┘
                                    │
                    ┌───────────────┼──────────────────┐
                    ▼               ▼                  ▼
            ┌──────────────┐ ┌──────────────┐  ┌──────────────────┐
            │  ACCEPTED    │ │ COUNTER      │  │ REJECTED         │
            │              │ │ "we want 9.4m"│ │ with a REASON:   │
            │              │ │              │  │ • just acquired  │
            │              │ │              │  │ • home-town boy  │
            │              │ │              │  │ • he's on loan   │
            │              │ │              │  │   from elsewhere │
            └──────┬───────┘ └──────┬───────┘  └────────┬─────────┘
                   │                │                   │
                   │        ┌───────┴────────┐          │
                   │        │ RE-OFFER via   │          └─→ dead, or wait
                   │        │ NEGOTIATION    │              (CPU may re-open)
                   │        │ HISTORY screen │
                   │        │ ≤ ~6 rounds ✅ │
                   │        │ each must beat │
                   │        │ last by ≥10% ✅│
                   │        └───────┬────────┘
                   │                │  lowball repeatedly →
                   │                │  "they're getting annoyed" → TERMINATED ✅
                   │                ▼
                   │        (back to accept/counter/reject)
                   ▼
        ╔══════════════════════════════════════════════════════╗
        ║  STAGE 2 — PERSONAL TERMS                            ║
        ║  offer  WAGE per week  +  CONTRACT LENGTH (years)    ║
        ║  negotiator: "several other clubs are interested"    ║ ✅
        ╚══════════════════════╤═══════════════════════════════╝
                               │  advance calendar again
                   ┌───────────┼──────────────┐
                   ▼           ▼              ▼
            ┌──────────┐ ┌──────────────┐ ┌────────────────────┐
            │ SIGNS    │ │ AGENT COUNTER│ │ REFUSES            │
            │ Chief    │ │ "wants 80k/wk"│ │ • won't change     │
            │ Exec     │ │              │ │   country          │
            │ congrats │ │ accept / walk│ │ • wage too low     │
            │ + "put   │ └──────────────┘ │ • your club too    │
            │ him in   │                  │   small            │
            │ the XI"  │                  └────────────────────┘
            └──────────┘
```

Every box in that diagram is sourced. The producer's own playthrough contains: a rejection because *"they've just recently acquired his services"*, a rejection because the player is *"their home-town boy… in addition it's not really 'their' player as he is on loan from Manchester City"*, a counter (*"ask me to increase my offer to almost 12 Mil"*), a successful club acceptance followed by a player agent counter (*"Barry submits a counter offer via his agent. He wants his wage offer raised to 80k/week"*), and a negotiation that dies from annoyance (*"Everton… seem to start to get annoyed with me trying to low-ball them. They raise the price up to 8.4 Mil"* → *"I guess this negotiation is over"*).

### 4.4 The "interest" indicator

There was no numeric interest meter. Interest was communicated **as prose from the negotiator**, at two moments:

- Before you bid: whether the deal is even plausible. ✅
- During personal terms: *"my negotiator warns me that several other clubs are interested in the player as well."* ✅

FIFA 12 added a press layer on top: *"The press could indicate another club is interested"* ✅ (Simon Humber, PlayStation Universe).

### 4.5 Deadline day

✅ FIFA 12's signature addition, and the most-loved single feature of the mode.

- The final day of the window runs **in hours, not days** — 8 hours per contemporaneous player reports, `TOTALNUMHOURS=10` in the FIFA 13 data.
- The HUB is replaced by a **broadcast-style hub** showing total spend across the league and a live feed of every completed deal, updating each hour.
- AI clubs that failed to fill a need get desperate: *"Any CPUs that haven't purchased what they wanted may throw big money out there."* ✅
- In the data, the AI's willingness to raise its bid escalates hour by hour: `APPROACH_DEADLINEDAY_MAX_INCREASE_HOUR_0 = 5%` climbing to `..._HOUR_10 = 55%`. ✅ structure / ⚪ values
- Response windows compress: `MAX_DAYS_TO_RESPOND = 5` normally, `MAX_DAYS_TO_RESPOND_LAST_WEEK = 1`, `MAX_HOURS_TO_RESPOND_DEADLINEDAY = 1`. ✅

### 4.6 The AI accept / counter / reject model (the real one)

This is the most valuable thing in this document. From `transferteamdecision.ini`. ✅ structure, ⚪ values.

**Step 1 — the club generates a *wanted fee*, not a market value.** The club scores the player on four axes and the total score slides the asking price between the player's *base* value and an *adjusted* (inflated) value:

| Factor | Effect on the asking price |
|---|---|
| **Time at club** | Just arrived (≤3 months) = `-250` points → **will not sell at any price**. 3–4 years = `0`. Very long serving (5+ years) = `-75` (sentimental, sells dear again) |
| **Squad size** | Bloated squad (50) = `+45` (happy to sell). Thin squad (18) = `-100` |
| **Team overall** | Weak club (OVR 30) = `+80` (cash matters). Elite club (OVR 92+) = `-75` |
| **Player rank in his position** | Best in his position at the club = `-75`. Fifth-choice = `+100` |

`TOTAL_POINTS_CAP: MAX_POINTS = 125` (*"a score of 125 would have the team accept less than the base of the player"*) … `MIN_POINTS = -100` (*"it would take the full adjusted value for the team to sell"*).

**This is the mechanism behind "you must overpay for unlisted players."** It is not a flat multiplier — it is four legible reasons, each of which the negotiator can say out loud.

**Step 2 — your offer is compared to the wanted fee, and the answer is a dice roll from a band table.**

Offer as % of the club's *wanted fee* → probability of each outcome (high-value players, `MAX_WANTED_TABLE`):

| Offer / wanted fee | Accept | Counter | Reject |
|---:|---:|---:|---:|
| ≥ 140% | 100% | 0% | 0% |
| ≥ 130% | 100% | 0% | 0% |
| ≥ 120% | 90% | 10% | 0% |
| ≥ 110% | 75% | 25% | 0% |
| **= 100%** | **40%** | **60%** | 0% |
| ≥ 90% | 20% | 80% | 0% |
| ≥ 80% | 10% | 90% | 0% |
| ≥ 70% | 0% | 100% | 0% |
| ≥ 60% | 0% | 80% | 20% |
| ≥ 50% | 0% | 0% | 100% |
| < 50% | 0% | 0% | 100% |

A second, more forgiving table (`MIN_WANTED_TABLE`) is used for cheap players (wanted fee below ~£810k): everything down to 100% is an automatic accept.

Note the shape: **offering exactly the asking price accepts only 40% of the time, and 50% of the asking price is an automatic wall.** The negotiation always has at least one more round in it, and the floor is hard. Both facts are what make it feel like haggling rather than a slot machine.

**Step 3 — re-offer constraints.** ✅ From `transfer.ini`:

```
MAX_COUNTER_OFFERS          = 6     # rounds before the club walks
MIN_OFFER_IMPROVEMENT_PERCENT = 10  # each new bid must beat the last by 10%
MIN_DAYS_TO_RESPOND         = 2
MAX_DAYS_TO_RESPOND         = 4
MIN_NUM_WAITING_DAYS        = 2
APPROACH_MIN_DAYS_BETWEEN_CPU_APPROACH = 5
```

### 4.7 Stage 2 — the player's decision model

✅ structure, ⚪ values. From `transfers.ini` `[TRANSFERS_PLAYER_DECISION_POINTS]`. The player sums points and compares against a threshold randomised in `100–130`:

| Factor | Points |
|---|---:|
| Has a grudge against you | **−400** |
| Your club is his club's rival | **−200** |
| Strong identity with current club | **−175** |
| Squad role offered is badly wrong | **−1750** (a hard no) |
| Squad role too high / too low | −175 each |
| Worried about his role | −175 |
| Is a veteran (31+, 14 yrs pro) | −85 |
| Not the best player for his position at your club | −20 |
| Currently a top-3 player at his club | −5 |
| **He is transfer listed** | **+175** |
| Position available for his main role | +40 |
| Your club is a 5-star team | +75 |
| Same nationality as your club's country | +20 |
| Good role offer | +25 |
| Contract length offered (0/1/2/3/4 yrs) | 0 / +5 / +10 / +15 / +20 |
| League rank change (down 2 → up 2) | −40 / −15 / 0 / +15 / +35 |
| Team star rank (1★ → 5★+) | −65 … +50 |
| Manager prestige (0 → 9) | +3 … +35 |

And the **wage curve** (`transfer.ini`), where the input is your offer as a percentage above or below his demand:

| Offer vs demand | −90% | −50% | −20% | **0%** | +20% | +50% | +90% |
|---|---:|---:|---:|---:|---:|---:|---:|
| Points | −200 | −80 | −30 | **+50** | +60 | +90 | +150 |

Read that carefully: **meeting his demand exactly is worth +50 of the ~100–130 he needs.** Everything else — your league, your club's stars, your prestige, his role — has to make up the rest. That is why a big club signs players cheaply and a small club cannot buy anyone at any wage. It is also why "throw money at it" only half-works, which is the correct feel.

Contract-length demands are capped by age ✅:

| Age | ≤24 | ≤28 | ≤32 | ≤35 | 35+ |
|---|---|---|---|---|---|
| Max years he'll sign | 5 | 5 | 4 | 2 | 1 |

---

## 5. Valuation and wage logic

### 5.1 The two methods EA shipped

`playervalues.ini` exposes a `METHOD` switch: ✅

- **`METHOD = 0` — "CLASSIC", a pure power curve.**
  ```
  MAGICNUMBER   = 39,000,000
  MAGICPOWER    = 10
  FUTURE_OVERALL = 5
  ```
  i.e. roughly `value ≈ 39,000,000 × (ovr / 100)^10`, with potential contributing via a 5-point look-ahead on overall.

  **This is a direct corroboration of our own model.** `docs/research/03-simulation-engine.md` §4.1 already specifies `BASE(CA) = 12_000_000 * (CA/70)^10`. Same exponent. The shape we independently derived is the shape EA shipped. Keep it.

  Wages had their own classic curve: `MAGICADDITION_OVERALL = 0.4`, `MAGICPOWER_OVERALL = 3` — i.e. wages scale roughly as the **cube** of rating while value scales as the **tenth power**. That gap is why elite players are unaffordable to buy but affordable to pay, and why free transfers of 85-rated veterans are so attractive. Preserve the gap.

- **`METHOD = 1` — "NEW", a piecewise lookup table plus percentage modifiers.** This is what shipped.

### 5.2 The lookup table (METHOD 1)

**Base value by overall** ⚪ (patch values; stock FIFA 12/13 numbers were in the same order of magnitude):

| OVR | 40 | 50 | 56 | 61 | 65 | 69 | 71 | 73 | 75 | 77 | 79 | 81 | 83 | 85 | 87 | 89 | 91 | 93 | 95 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Base £ | 14k | 23k | 70k | 156k | 363k | 686k | 1.13m | 1.78m | 2.45m | 3.75m | 5.5m | 7.9m | 10m | 13.5m | 18.9m | 23m | 29.5m | 50m | 60m |

Then a set of **percentage modifiers** applied on top: ✅

| Modifier | Range | Notes |
|---|---|---|
| **Age** | +20% at 20–22, 0% at 23–27, −15% at 30, −45% at 34, −95% at 39 | Peak value is bought at 20–22, not at peak ability |
| **Remaining potential** (PA − CA) | +10% at 1 point, +100% at 8, +170% at 16+ | ✅ FIFA 12's headline change: *"Potential now factors into a player's market value"* |
| **Contract years left** | **−35% at 0 years**, −20% at 1, +5% at 2, +20% at 6+ | The expiring-contract discount |
| **Form** (1–10) | −60% at 1–3, 0% at 6, +80% at 10 | |
| **Morale** (1–10) | −20% at 1–2, 0% at 5–6, +15% at 9–10 | |
| **Club prestige** (0–20) | +5% at 1, +18% at 20 | Selling club's brand inflates the fee |
| **Position** | GK −50%, CB/FB −10%, DM −15%, CM 0%, **AM/W/ST +15%** | ✅ *"goalkeepers and defenders will be less expensive than attacking players"* |
| **Overall scaling weight** | ×1.0 below OVR 70, ×0.8 at 80, ×0.4 at 90, ×0.2 at 100 | Modifiers matter *less* the better the player is — elite value is dominated by raw rating |

⚪ **The assembly order is not recoverable from the ini alone.** The most plausible reading — and the one I'd build — is:

```
value = BASE(ovr) × ( 1 + OVERALL_WEIGHT(ovr) × Σ(modifier_pct) / 100 )
```

Say so in code comments; do not present it as EA's exact formula.

### 5.3 The wage table

Same structure. Base wage by overall ⚪:

| OVR | 40 | 50 | 60 | 66 | 72 | 75 | 78 | 81 | 85 | 88 | 90 | 92 | 96+ |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| £/week | 1,000 | 1,650 | 2,500 | 4,500 | 9,000 | 12,000 | 18,000 | 26,000 | 41,000 | 55,000 | 68,000 | 90,000 | 100k–140k |

Modifiers: ✅

- **Age:** −20% at ≤16, −10% at ≤18, **0% from 19 to 28**, −5% to 32, −15% to 35, −20% to 39, −50% beyond. Wages barely move with age. Value collapses with age. That asymmetry is the whole reason ageing squads bankrupt you.
- **Remaining potential:** peaks at **+50%** when he has 6–8 points of growth left, tapering to +10% at 20+. Wonderkids are expensive to pay *and* to buy.
- **Club prestige:** −20% at a tiny club, **+50%** at a giant. The same player asks half as much to join a minnow.
- **International reputation (0–5):** −20% … +30%.
- **Position:** attacking positions +10%, everyone else 0%.
- **Contract renewal drift:** `SALARY_INITIAL_DEMAND_MIN_INCREASE = 5%`, `MAX_INCREASE = 20%` on renewal; `transfer.ini` also carries a comment that *"for every player growth point since his last contract sign, he will ask +$2000."*

**Floor:** `TRANSFER_MINIMUM_SALARY` runs £750–£2,250/week by league tier. Nobody works for nothing.

### 5.4 The budget

✅ FIFA 11's **Budget Allocator**: one slider splitting a single board-set pot between transfer money and wage headroom.

> "You can change the proportion of your budget allocated to transfer fees and to player wages based on a sliding scale. So I may start with an **80/20 split** with £50 Million to spend and £200K wage budget, change the slider to 60/40 and that may be £40 Million to spend and £250K wage budget. **There is a limit however… this is only available 3 times.**"

`cmsettings.ini` confirms `TRANSFER_WAGE_SPLIT_PERCENT = 80` as the season-start default. ✅

Board strictness controls how much of a sale returns to you: lenient 100%, moderate 85%, strict 75%. ✅ Budget for next season is multiplied by league-objective performance: exceeding 120%, meeting 100%, far below 70%. ✅

**One slider, three uses a season, and a visible consequence.** That is the entire finance UI. Copy it.

### 5.5 What FIFA 12 fixed about values

✅ From a contemporaneous compilation of EA's FIFA 12 briefings:

- *"The value of each individual player is more realistic, Simon Humber has finely tuned the values."*
- *"Potential now factors into a player's market value."*
- *"The values are designed to mirror real world values, goalkeepers and defenders will be less expensive than attacking players."*
- *"The CPU is a lot more aggressive… will bid on players who aren't transfer listed… The bids you receive will be much more in line with the worth of the player… **Bids are not limited by your budget.**"*
- *"You can stall CPU offers to buy yourself time, their offers will remain valid for a number of days."*

---

## 6. Scouting

### 6.1 FIFA 10 — scouting trips

✅ FIFA 10 had a **Head Scout** you levelled up via **Staff Upgrades**, alongside a **Negotiator** (*"by increasing the level of your Negotiator, the transfer of new players will be increasingly easier and transfer targets will be less likely to reject your offer"*), position coaches, fitness coach and stadium manager.

You sent the scout on a **trip** with a chosen **length** and **location**. He came back with a player. Quality scaled with scout level, trip length and luck. ✅ The scout could also *predict a bought player's future overall* — but only after you had signed him.

**FIFA 11 deleted all of this.** ✅ *"For now there are no training options, or those to improve your stadium, negotiator, coaches etc."* FIFA 11 replaced it with a scout who "can be consulted on transfer searches and decisions". This is the single biggest regression in the trilogy.

### 6.2 FIFA 12 — the scouting network

✅ FIFA 12 rebuilt it properly and this is the version worth copying.

- **Up to 3 scouts.** ✅ (`SCOUT_MAXIMUM_SCOUTS_NUMBER = 3`)
- Each scout has **two 1–5 star ratings: Experience and Judgement** ✅ (called `EXPERIENCE` and `KNOWLEDGE` in the data). Community consensus, corroborated by the data:
  - **Experience** → *how many* players he finds per month, and how often he finds the *player type you asked for*. Level 1 finds 1–2/month with a 30% exact-type match; level 5 finds 4–6/month with a 70% exact match. ✅
  - **Judgement/Knowledge** → the *tier* of player found. Level 1: 3% chance of a Tier-1 prospect, 75% Tier-4. Level 5: 13% Tier-1, 17% Tier-4. ✅
  - Community guides say it more bluntly: *"A scout's experience level determines the quality of players he finds, whilst his judgment determines how accurate his reports are."* 🟡 — note this **conflicts** with the data-file reading above. Both were reported; the data is more authoritative but the community belief shaped how people played.
- **Assignment:** you pick a **continent → country**, and a **position** (CM, RW, ST…). ✅ FIFA 12 explicitly added scouting by position.
- **Missions run 3, 6 or 9 months** ✅ (`SCOUT_MISSION_DURATION 3/6/9`), costing a base fee × a duration multiplier × 10% per scout level. Reports arrive **monthly**.
- **The scout pool refreshes weekly** ✅ (`SCOUT_NUM_DAYS_FOR_POOL_UPDATE = 7`; community reports "reload every Friday/Saturday" and save-scumming for a 5/5 scout was standard practice).
- **Prospects are 14–17 years old.** ✅
- **Potential is shown as a widening/narrowing range, never a number.** ✅ Initial reports show something like `68–91`; scout the player longer and it tightens toward `82–88`. 🟡 Community reports the academy ceiling around 85–91.
- **The core tension:** *"Initial scout reports will be vague, you'll have to scout a player multiple times to access all of the available information. If you scout a player for too long you risk losing him."* ✅ **This is the best mechanic in the entire trilogy.** Information costs time, and time costs the player.
- Regions differ in yield 🟡 — Argentina, Brazil, England, France, Germany, Italy, Spain best; Asia and Australia worst — and scouts are more accurate in their home country.
- Signed prospects go into a **Youth Academy** (max 25), promotable to the first team from age 15–16, with ranges narrowing monthly. Youth wage demands £600–900/week. ✅

---

## 7. Loans, free agents, youth academy

**Loans** ✅
- Two lengths: **short (3 months)** and **full season (12 months)**.
- FIFA 11 modelled real loans at career start: a player on loan returns to his parent club when it ends.
- FIFA 12 added **option to buy at the end of a loan**.
- Loaning out young players for game time was the standard growth strategy 🟡.
- You cannot bid to loan a player who is not loan-listed 🟡 (a live complaint on the FIFA 11 boards).

**Free agents** ✅
- A permanent browsable list, refreshed as players are released.
- The data files generate free agents by stripping surplus players off oversized squads (`FREE_AGENTS_MIN_NUM_PLAYERS_ON_TEAMS = 25`) and keep a floor on pool size (`MIN_FREE_AGENTS_TEAM_SIZE = 40`).
- **They cost zero transfer budget — only wage budget.** 🟡 This is the single most-repeated tip in every FIFA 12 guide, and it is the escape hatch that lets a poor club improve.

**Youth academy** ✅ — see §6.2. Feeds the market indirectly: promoted youth are free squad depth, and the surplus gets sold.

---

## 8. What changed across 10 → 11 → 12, and which is best

| | FIFA 10 | FIFA 11 | FIFA 12 |
|---|---|---|---|
| Mode name | Manager Mode | Career Mode (rebuilt from scratch) | Career Mode |
| Negotiation | Single stage (club only) | **Two stage: club, then player** ✅ | Two stage |
| Search filters | Position, role, OVR, age, value, status | **+ primary & secondary attribute ranges** ✅ | Same as 11 |
| Fee entry | — | **Digit-by-digit editing** ✅ | Same |
| Staff | **Upgradeable: Head Scout, Negotiator, coaches, stadium** ✅ | **All removed** ✅ | Still absent |
| Scouting | Scouting *trips* (length + location) | **None** — regeneration only | **Scouting network: 3 scouts, regions, positions, monthly reports, potential ranges** ✅ |
| Youth | — | — | **Youth Academy** ✅ |
| Budget | Fixed | **Budget Allocator slider, 3 uses/season** ✅ | Same |
| Values | Crude | Crude | **Retuned; potential affects fee; positional realism** ✅ |
| AI aggression | Passive | Passive | **Bids on unlisted players; bids exceed your budget; stalling; counter-offers** ✅ |
| Loans | Basic | **Real loans modelled at start; 3-month or season** ✅ | **+ option to buy** ✅ |
| Deadline day | No | No | **Yes — hourly clock, broadcast hub, desperate AI** ✅ |
| Morale in transfers | No | No | **Yes — morale/role drives transfer requests** ✅ |
| Player growth | Auto (preset curves) | Auto | Auto, faster |

### The verdict: **FIFA 12 got it most right.**

Reasoning, in order:

1. **It is the only one of the three with a complete loop.** Search → bid → sign is the same in all three. Only FIFA 12 also has *scout → develop → promote → sell*, and only FIFA 12 has an AI that comes for *your* players. A market with two directions is twice the game.
2. **Deadline day is the emotional peak of the entire mode** and it exists only in 12. It converts an admin screen into an event.
3. **FIFA 12 fixed the economy.** Potential in the fee, positional realism, values that mirror reality, AI bids that aren't clamped to your budget. FIFA 10 and 11 both had markets you could break.
4. **FIFA 11's contribution is the two-stage negotiation** — genuinely the structural insight of the trilogy — but FIFA 11 shipped it inside a hollow mode. It deleted staff, deleted scouting, and gave nothing back. Contemporaneous coverage called it *"a watered-down version because it is the first year of a new way of doing career mode."*
5. **FIFA 10's contribution is the Negotiator as an upgradeable staff member** — a lever that directly bought you better transfer outcomes. It was thrown away and never came back. It is worth reviving.

**So: build FIFA 12's structure, with FIFA 11's two-stage negotiation, and put FIFA 10's Negotiator back as a single upgrade.**

---

## 9. Why people still praise it

The literal Reddit threads are not reachable by our tooling (reddit.com is blocked at both the search and browse layer), so this section leans on contemporaneous forum posts, guides written by players at the time, and secondary write-ups of community sentiment. Flagged accordingly.

**What people actually say, and what it means:**

1. **"You could just buy players and play."** 🟡 The nostalgia is not for depth. It is for *low friction between wanting a player and having him*. Every added negotiation lever since FIFA 18 has increased the taps between intent and outcome. Secondary write-ups of the community mood put it exactly this way: people "long for the simpler times of career mode — just buying players and playing."
2. **The filter screen was a *tool*, not a wall.** It answered a specific question — *"who is a 75–85 winger with 80+ acceleration under £10m?"* — in one screen, and returned a sortable list. Modern FIFA replaced it with a scouting pipeline that answers the same question in three days of in-game time. People notice.
3. **The negotiator's warning is the mechanic everyone remembers.** The top FIFA 11 GameFAQs how-to is *entirely* about it: *"make sure to check the negotiator feedback. This is very important, this is where most people have probably failed."* It gave the market a **voice**. Compare Football Chairman, whose top complaint in our genre teardown (doc 02, §opportunity list) is that *"the transfer market is a black box — I would have a better idea what I wanted to bid if I knew what their value was."* FIFA 10/11/12 solved that with one sentence of prose.
4. **Rejection was narrative, not failure.** "Home-town boy." "He just signed for them." "He won't move country." You lost the player and gained a story. Modern systems return a percentage.
5. **Versus Football Manager:** FM's market is admired and not enjoyed by this audience. FM asks you to build a scout assignment, wait, read a report, run a shortlist filter with forty attributes, negotiate eight clauses. FIFA 12 asks you to type a number. The praise for FIFA 12 is explicitly *relative* — it is praised for being the most management you can do in five minutes.
6. **Versus later FIFA:** the FIFA 18+ negotiation cutscene is universally described as slow. It is the same decision (how much?) wrapped in an animation and five extra optional clauses that rarely change the outcome. Depth that does not change outcomes is friction.

**The distilled principle for us:** *the market should be a search box that talks back.*

---

## 10. OUR VERSION

Constraints: a season is 15–20 minutes. Every decision is 1–3 taps. Players have **7 visible attributes** (Pace, Technical, Vision, Finishing, Defending, Physical, Composure), a **hidden potential**, age, nationality, position, wage, contract years, and a derived **ability 1–99**. All names and clubs are generated.

Budget: **the entire transfer market is three screens.** Search, Player, Offer. Nothing else.

### 10.1 Keep / Simplify / Cut

| | Decision | Why |
|---|---|---|
| **KEEP — verbatim** | Single-number cash fee | The whole reason the old market was fast |
| | Two-stage: club fee, then player terms | The one structural idea worth every tap it costs |
| | Negotiator warning **before** you bid | The single most-loved mechanic. One line of plain text |
| | Rejection with a named reason | Turns failure into story |
| | Attribute filter (FIFA 11's best addition) | With 7 attributes it becomes a chip row — nearly free |
| | Sort the results | The interaction people actually did after searching |
| | Free Agents / Listed / Search as three entry points | Skimmable lists first, search as fallback |
| | Overpay-for-unlisted rule | Creates the whole economy from one line of logic |
| | Deadline day as an hourly event | The emotional peak. Non-negotiable |
| | Potential as a **range**, never a number | And it tightens the longer you watch him |
| | Budget Allocator slider, limited uses | One slider, one consequence |
| | Loan with option to buy | The poor club's ladder |
| **SIMPLIFY** | 6 counter-offer rounds → **2** | 15-minute season. Round 1 is your bid, round 2 is your response to their counter, done |
| | Free-text fee entry → **3 preset buttons + fine dial** | Nobody types a number on a phone |
| | Wage negotiation → **3 preset buttons** (Low / Fair / Generous) | Same |
| | Scouting network of 3 scouts, regions, durations → **1 scout, 1 assignment, set-and-forget** | Three scouts is three decisions a month we cannot afford |
| | 35 attribute filters → **1 "Strong at" chip row of 7** | Direct translation of FIFA 11's primary attribute |
| | Nationality / League / Club filters → **cut from the filter bar**, available under a magnifier | Rarely used, always in the way |
| | Response delay of 1–5 days → **resolves on the next Continue** | Never make the player wait two sessions for an answer |
| **CUT ENTIRELY** | Instalments, sell-on clause, buy-back, player exchange, release clause | Not in FIFA 10/11/12 either. They are FIFA 18 features and they are the friction the owner is complaining about |
| | Agent fees as a visible line item | Fold silently into the fee |
| | Signing bonus as a negotiable | Fold into wage |
| | Squad-size / min-players-per-position rules exposed to the player | Keep in the AI, never surface |
| | Form and morale as *value* modifiers | Keep morale for transfer *requests*; keep it out of the price so the price is predictable |
| | International reputation, club prestige as separate stats | Collapse both into one **club tier 1–5** |
| | Contract-expiry filter, work rate, height, weight | Never existed here and we do not want them |

### 10.2 The exact filter list

**Six controls. One screen. No scrolling. All of them are taps, not text entry.**

```
┌───────────────────────────────────────────────┐
│  ← TRANSFERS                            🔍    │   magnifier = name search (rare path)
│  [ Free Agents ]  [ Listed ]  [ Search ]      │   3 tabs, Search is the default
├───────────────────────────────────────────────┤
│  1  POSITION      ⦿Any  GK  DEF  MID  ATT     │   segmented, single-select
│  2  MAX FEE       ●────────────○  £12m        │   snapped slider; starts at your budget
│  3  AGE           ⦿Any  U21  U24  Prime  30+  │   segmented
│  4  MIN ABILITY   ●──────○────────  72        │   snapped slider; default = smart (below)
│  5  STRONG AT     Any Pace Tech Vis Fin Def Phy Comp │  chip row, single-select
│  6  AVAILABILITY  ⦿Any  Listed  Free  Loan    │   segmented
├───────────────────────────────────────────────┤
│  SORT  [ Best fit ▾ ] Ability · Value · Age   │
│                                               │
│  ⚡ ASSISTANT'S PICKS                          │   one tap: fills all six for your worst
└───────────────────────────────────────────────┘   position and searches immediately
```

Rules:

- **Every filter is a tap.** No keyboards on this screen.
- **Defaults are already correct.** `Max Fee` opens at your available transfer budget. `Min Ability` opens at *(the ability of your third-best player in your weakest position) − 2*. A player who taps Search without touching anything gets a good list. This is the single highest-leverage decision on the screen.
- **"Assistant's Picks"** is the 1-tap path and should be the fastest route to a signing in the game. It is the FIFA 11 negotiator, promoted to a button.
- **`Strong at`** is our translation of FIFA 11's primary-attribute filter. With 7 attributes it is a chip row, and it is the filter that makes the screen feel like a tool. Under the hood: `attribute ≥ 75th percentile for that position`. Do not expose a numeric range — one chip, one tap.
- **Sort defaults to "Best fit"** — a single score `(ability_gain × 1.0 + potential_gain × 0.45) / (value/1e6)^0.8`, lifted from our own AI shortlist logic in doc 03 §4.2 so the assistant and the AI clubs visibly use the same brain.
- **Filter state persists** between visits within a window.

**What we deliberately do not put here:** nationality, league, club, contract length, potential, foot, height, work rate, wage. Nationality and league live behind the magnifier alongside name search, for the 5% of players who want them.

### 10.3 The exact bid flow

Target: **3 taps from list to bid sent. 2 more to agree terms.** Everything resolves on the next Continue.

```
LIST ROW ─tap──────────────────────────────────────────────► PLAYER SHEET (half-height modal)
                                                              │
   ╔══════════════════════════════════════════════════════╗   │
   ║  PLAYER SHEET                                        ║   │
   ║  ┌────────────────────────────────────────────────┐  ║   │
   ║  │ ▮ M. Okonjo      ST   🇳🇬   24        ⟨ 79 ⟩   │  ║   │
   ║  │   Riverton FC · 3 yrs left                     │  ║   │
   ║  │   ★★★☆☆  potential 82–88                       │  ║   │  ← range, never a number
   ║  ├────────────────────────────────────────────────┤  ║   │
   ║  │  PACE 84  TECH 71  VIS 63                      │  ║   │  ← 7 bars, one glance
   ║  │  FIN 86   DEF 22   PHY 74   COMP 70            │  ║   │
   ║  ├────────────────────────────────────────────────┤  ║   │
   ║  │  VALUE £14.2m        WAGE £38k/wk              │  ║   │
   ║  │  ASKING £17.5m                          ●●●○○  │  ║   │  ← asking price shown UP FRONT
   ║  ├────────────────────────────────────────────────┤  ║   │
   ║  │  🗣 "They rate him. You'll need to beat the     │  ║   │  ← THE NEGOTIATOR LINE
   ║  │      asking price to be taken seriously."      │  ║   │     one sentence, always present
   ║  └────────────────────────────────────────────────┘  ║   │
   ║   [  SHORTLIST  ]        [   MAKE OFFER   ]          ║   │
   ╚══════════════════════════╤═══════════════════════════╝   │
                              │ tap 2
                              ▼
   ╔══════════════════════════════════════════════════════╗
   ║  OFFER                                    Budget £22m║
   ║                                                      ║
   ║   [ £14.9m ]      [ £17.5m ]      [ £20.1m ]         ║   ← 85% / 100% / 115% of ASKING
   ║     Cheeky          Asking         Strong            ║      one tap each
   ║                                                      ║
   ║   ⊖   £ 1 7 . 5 m   ⊕      ← fine dial, ±£0.1m       ║   ← the digit-wheel, modernised
   ║                                                      ║      (optional; nobody has to touch it)
   ║   Likely: ●●●○○  they'll probably counter            ║   ← live, updates with the number
   ║                                                      ║
   ║              [   SEND OFFER   ]                      ║   ← tap 3
   ╚══════════════════════════╤═══════════════════════════╝
                              │
                              ▼
              ┌───────────────────────────────────────┐
              │  Next CONTINUE → an action card:      │   never more than one session's wait
              │                                       │
              │  ✅ ACCEPTED  → straight to TERMS     │
              │  ↩  COUNTER "£19.8m"  → [ACCEPT] [WALK]│  ← exactly ONE counter round
              │  ✖  REJECTED + reason                 │
              └───────────────────┬───────────────────┘
                                  │ accepted
                                  ▼
   ╔══════════════════════════════════════════════════════╗
   ║  PERSONAL TERMS          He wants £41k/wk            ║
   ║                                                      ║
   ║   [ £37k ]        [ £41k ]        [ £47k ]           ║   ← 90% / 100% / 115% of demand
   ║     Tight          Fair           Generous           ║
   ║                                                      ║
   ║   YEARS   [ 1 ]  [ 3 ]  [ 5 ]                        ║   ← 3 chips, 3 preselected
   ║   ROLE    [ Star ] [ Rotation ] [ Prospect ]         ║   ← 3 chips, auto-set from his ability
   ║                                                      ║      vs your squad — usually correct
   ║   🗣 "Two other clubs are circling. Don't lowball."   ║
   ║                                                      ║
   ║              [   OFFER TERMS   ]                     ║
   ╚══════════════════════════╤═══════════════════════════╝
                              ▼
              ┌───────────────────────────────────────┐
              │  Next CONTINUE:                       │
              │  ✅ SIGNED  →  celebration card       │
              │  ↩  AGENT WANTS £46k → [PAY] [WALK]   │  ← one counter round only
              │  ✖  REFUSED + reason ("won't drop     │
              │      down a division")                │
              └───────────────────────────────────────┘
```

**Non-negotiable rules of this flow:**

1. **The asking price is visible before you bid.** FIFA hid it; that hiding is what produced Football Chairman's top complaint in doc 02. Show it. The *interest dots* carry the uncertainty instead.
2. **The negotiator sentence is always present**, never empty, and is generated from the highest-magnitude term in the club-decision score (§10.5). It is the game's voice.
3. **One counter round per stage.** FIFA allowed six. At 15 minutes a season, two rounds is one round of drama and no attrition.
4. **Everything resolves on the next Continue.** Never across two sessions.
5. **No free-text number entry anywhere.** Three presets cover 95% of bids; the dial covers the rest.
6. **Walking away is always one tap and always safe.** No penalty, no hidden state.

### 10.4 The exact player row

**72pt tall. Three lines. Readable at arm's length on a 375pt-wide phone.**

```
┌───────────────────────────────────────────────────────────┐
│ ▮ M. Okonjo                     ST          🇳🇬        79 │  line 1: name · pos · nat · ABILITY
│   24 · Riverton FC · 3yr                    ★★★☆☆         │  line 2: age · club · contract · potential band
│   £14.2m   £38k/wk                          ●●●○○  LISTED │  line 3: value · wage · interest · status
└───────────────────────────────────────────────────────────┘
   ↑                                              ↑      ↑
   position colour bar                    interest   status pill
   (GK yellow / DEF blue /                dots       (LISTED / FREE / LOAN /
    MID green / ATT red)                             blank if not for sale)
```

Field-by-field justification:

| Field | Why it earns its pixels |
|---|---|
| **Ability (1–99), large, right-aligned** | The number everyone sorts by. Must be the largest glyph in the row |
| **Name** | Generated; short forms only (`M. Okonjo`), never full names — they break the layout |
| **Position badge + colour bar** | Scanning a mixed list by position is the most common eye movement |
| **Nationality flag** | Pure flavour, one glyph, high emotional return. Not a filter |
| **Age** | The second number people sort by |
| **Club** | Context for "is this realistic" — and it's the story |
| **Contract years** | Cheap, and it is the tell for a bargain |
| **Potential band (★ 1–5)** | Coarse, scout-dependent, **never a number**. Unscouted players show `★?` |
| **Value** | Bold. It is the decision |
| **Wage/week** | Because our wage budget is the real constraint, exactly as in FIFA 11 |
| **Interest dots (5)** | How gettable he is. Replaces the negotiator's paragraph at list level |
| **Status pill** | LISTED / FREE / LOAN. Absent = not for sale = you'll overpay |

**Explicitly not on the row:** height, weight, foot, work rate, form, morale, the seven attributes, league, agent, international caps. They are on the sheet or nowhere.

**List behaviour:** ~9 rows visible; infinite scroll capped at **40 results** (a cap is a feature — it forces the filter to be used and keeps the list scannable). Sticky sort header. Long-press a row to shortlist.

### 10.5 Tuning constants to ship with

Adapted from the FIFA data, compressed for a 15-minute season.

**Asking price.** `asking = value × (1.05 + 0.35 × squad_importance + 0.20 × recently_signed + 0.15 × rivalry)`, where `squad_importance` is 0–1 from his rank in his position at his club. `recently_signed` (< 6 months) additionally hard-blocks the sale — the FIFA `-250` rule, kept because it produces the best rejection line in the game.

**Club accept / counter / reject** (offer as % of asking):

| Offer / asking | Accept | Counter | Reject |
|---:|---:|---:|---:|
| ≥ 120% | 100% | 0 | 0 |
| ≥ 110% | 85% | 15% | 0 |
| ≥ 100% | 55% | 45% | 0 |
| ≥ 90% | 25% | 75% | 0 |
| ≥ 75% | 0 | 85% | 15% |
| < 75% | 0 | 0 | 100% |

Softened versus FIFA (which accepts at 100% only 40% of the time and hard-walls at 50%) because we allow only one counter round. The counter is always `asking × (1.02 + 0.06 × rand)` — i.e. it lands just above asking, so "accept the counter" is nearly always the right call and the decision stays fast.

**Player decision.** Single score against a threshold of 100:

```
score  =  wage_points                       # −80 at 50% of demand, +50 at 100%, +90 at 150%
        + role_points                       # +25 correct, −175 too low, −60 too high
        + club_tier_delta × 22              # moving up/down our 1–5 club tier
        + contract_years × 5
        + manager_reputation × 3
        + 175 if transfer_listed
        + 20  if same nationality as club country
        − 200 if rival club
        − 85  if age ≥ 32
        + noise(−15 … +15)
```
Meeting his wage demand exactly is worth +50 of 100. Everything else must come from what your club *is*. That asymmetry is the correct feel and it is EA's, not ours.

**Interest dots** = `clamp(round(score / 25), 0, 5)` for the player, and the equivalent band for the club. One shared function drives the dots, the negotiator sentence, and the AI.

**The negotiator sentence** is generated by taking the single largest-magnitude term in whichever score is worse and looking it up in a phrase table. Ship ~24 phrases. Examples:

| Dominant term | Line |
|---|---|
| `recently_signed` | "They only just signed him. Forget it this window." |
| `squad_importance` high | "He's their best player. It'll take a silly number." |
| `rival club` | "They'd rather burn him than sell to us." |
| `club_tier_delta` negative | "He won't drop a division for us. Not yet." |
| `wage_points` negative | "That wage is an insult. He'll walk." |
| `transfer_listed` | "They want him gone. Don't overpay." |
| budget shortfall | "We can't cover this without selling someone." |

### 10.6 Height, weight, preferred foot, work rate — the recommendation

| Stat | Verdict | Reasoning |
|---|---|---|
| **Preferred foot** | **Add — as a display flag only, not a filter, not a stat** | One bit per player. It costs nothing, it makes generated players feel authored, and "a genuine left-footer" is a phrase football fans feel. Use it to modulate scarcity for LB/LW/LCB so left-footers of equal ability are ~8% dearer. **Do not put it in the filter bar** — the tap cost outweighs the payoff at our session length. Revisit only if we ever add a tactical system that reads it. |
| **Height** | **Do not add as a stat. Derive it for display** | Show a plausible height computed from Physical + position, purely as flavour on the player sheet. A real height stat implies aerial duels, set-piece modelling and a header attribute — all of which we do not have, and which would make the number a lie. |
| **Weight** | **Never** | Zero gameplay meaning even in FIFA. Pure noise. |
| **Work rate** | **Do not add** | It is the one the owner would most regret. In FIFA it is two enum values that most players cannot interpret, and its effect is invisible in a simmed match. Our Physical + Composure already cover the same ground, and our tactics layer is where effort should be expressed — as a *manager* decision, not a *player* attribute. Adding it means adding a filter for it, and that is precisely the "stupid needless detail" we were told to remove. |

**Net:** add one boolean (foot), derive one cosmetic number (height), add nothing else. Our seven attributes plus age, contract, value and wage are already more than the FIFA 11 search screen exposed.

### 10.7 Scouting, sized for us

One scout. One assignment. Set and forget.

- **Assign:** pick a **region** (5–6 generated regions, each with a visible bias — "produces quick forwards", "produces technical midfielders") and a **position group**. Two taps, once per season.
- **Output:** a report card in the inbox **once a month**, listing 2–4 prospects aged 15–17.
- **Potential is a range that narrows.** First sighting `62–88`. Each subsequent month it tightens by ~3 points on each side. Sign early and gamble; wait and risk a rival taking him. Ship the FIFA 12 tension verbatim — it is free drama.
- **Scout quality is a single 1–5 upgrade** bought with club money, not a hiring market. It widens the tier distribution and tightens the ranges faster. This is FIFA 10's Head Scout, restored.
- **A second single upgrade: the Negotiator, 1–5.** It improves the counter-offer you receive by up to 8% and unlocks a more specific negotiator sentence. Restoring FIFA 10's best deleted idea costs us two numbers.

### 10.8 Deadline day

Non-negotiable. Ship it.

- The last **6 hours** of each window run as hourly ticks with a dedicated takeover screen: a live ticker of every deal in the league, running total spend, and a countdown.
- AI urgency rises each hour: clubs that failed to fill a need bid **up to +40% above asking** in the final two hours, including for *your* players.
- Response time collapses to **one hour**.
- Budget: this is one screen and one AI multiplier curve. It is the cheapest emotional peak in the entire game.

---

## 11. Sources

**Primary (EA staff, contemporaneous):**
- Marcel Kuhn (Producer/Designer, FIFA 11 Career Mode), career mode playthrough blog — [WorthPlaying, 27 Aug 2010](https://worthplaying.com/article/2010/8/27/news/76511-fifa-11-all-details-career-mode-screens/). *The single best source; contains the verbatim search parameters.*
- Phil Wride (EA UK Community Manager), "FIFA 11 Manager Mode is changing to Career Mode" — [ModdingWay](https://www.moddingway.com/news/1828.html).
- Simon Humber (Creative Director, FIFA 12), interview — [PlayStation Universe](https://www.psu.com/news/ea-sports-gets-personal-in-fifa-12s-career-mode/).

**Primary (shipped game data):**
- `playervalues.ini`, `playerwages.ini`, `playercontract.ini`, `transfer.ini`, `transfers.ini`, `transferteamdecision.ini`, `scout.ini`, `youth_scout.ini`, `cmsettings.ini` — [mxcrml/fifa13-realistic-patch](https://github.com/mxcrml/fifa13-realistic-patch). FIFA 13 engine, community-patched values, one file explicitly carrying FIFA 12 values.
- Related stock-file archives: [xAranaktu/Fifa-17---IniToCT](https://github.com/xAranaktu/Fifa-17---IniToCT) (`ORG_INIFILES/`), [paulov-t/FIFA-16-Career-Mod](https://github.com/paulov-t/FIFA-16-Career-Mod).

**Contemporaneous player accounts:**
- ["Tips for buying players in Manager Mode"](https://gamefaqs.gamespot.com/boards/988950-fifa-soccer-11/56642214) — GameFAQs, FIFA Soccer 11. *Age/overall min-max, sorting, negotiator feedback, negotiation history.*
- ["| FIFA 12 | Important Career Mode Details |"](https://gamefaqs.gamespot.com/boards/631377-fifa-soccer-12/59855195) — GameFAQs, FIFA Soccer 12. *Full FIFA 12 transfer/scouting feature list from EA briefings.*
- ["FIFA 12 Career Mode Tips"](https://thefrontmen.blogspot.com/2011/10/fifa-12-career-mode-tips.html) — The Front Men blog, Oct 2011.
- [FIFA Encyclopedia](https://fifaencyclopedia.com/) — FIFA 09 / 10 / 11 / 12 manager-mode reference pages. *Source for FIFA 10's Negotiator and Head Scout staff upgrades.*
- [FIFA 12 scouting guide](https://fifascoutingtips.com/fifa-12-scouting-tips-tricks/) and [FIFA 13 scouting guide](https://fifascoutingtips.com/fifa-13-scouting-guide/) — FIFA Scouting Tips. *Scout star ratings, potential ranges, regional yields.*

**Not reachable:** reddit.com (blocked at both search and browse layer), Operation Sports forums (403), SoccerGaming forums (403), archive.org (blocked). §9 is therefore weaker than the rest of this document and is flagged as such.

**Related internal docs:** `02-genre-teardown.md` §1 (Football Chairman's black-box transfer market — the failure mode this design avoids), `03-simulation-engine.md` §4 (our existing valuation model — note the independently-derived `^10` exponent matches EA's `MAGICPOWER = 10`), `04-ux-architecture.md` §1–2 (hub, action cards, 2-tap rule this flow must live inside).
