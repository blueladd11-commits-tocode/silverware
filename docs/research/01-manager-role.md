# 01 — The Manager's Role: Research → Mechanics

**Purpose:** what a real football manager's job consists of, translated into mechanics for a lightweight mobile manager game (FC Chairman simplicity, FIFA Manager breadth, explicitly *not* Football Manager depth).
**Design rule this doc serves:** simple to play, deep in consequence. Most decisions 1–3 taps.

---

## PART A — How the job actually works

### A1. The in-season week (one match per week)

The week is a **fixed loop with a small number of real decision points**. Everything else is routine.

| Day | What actually happens | Real decision content |
|---|---|---|
| Sun/Mon | Match review with staff; GPS/load data from sports science; who trains full, partial, or rests | Who is protected this week |
| Mon | Medical report; injury triage; treatment plans | Rush a player back or not |
| Tue | Opposition analysis with assistants/analysts (4–5 hrs); tactical theme set for the week | What plan we're playing |
| Wed | Individual player conversations — mostly the ones *not* starting. Widely described as the most draining part of the job. Agent calls land here | Who gets managed, who gets ignored |
| Thu | **Pre-match press conference** (20–45 min, planned since Monday). Reveal nothing, set the narrative | Public line: protect player, attack ref, absorb blame, or raise expectation |
| Fri | Short, sharp session; set pieces; team meeting; team announced internally | Final XI |
| Sat | Matchday: team talk, in-game reads, 3–5 subs, post-match media | Selection, tactics, subs, post-match tone |

Two-game weeks (cup, Europe) **delete Tue/Wed** — no tactical block, no player management, just recovery and rotation. That is the entire mechanic of fixture congestion: *the manager loses the ability to prepare.*

### A2. Off-week / no-match periods
- International breaks: players leave, return tired or injured; time for 1-on-1s, youth review, recruitment meetings.
- Winter break / summer: the calendar goes quiet and **admin dominates** — contracts, scouting, board reviews.

### A3. The annual calendar

1. **Pre-season (4–6 weeks).** Three phases: base fitness → intensity → match sharpness. 4–8 friendlies, first ~2 weeks in, last one 7–10 days before opener. Integrate signings, blood academy kids, set the culture and the season objectives.
2. **Summer window.** Closes ~2–3 weeks *after* the season starts, so the first fixtures are played with an unfinished squad. Budget set by the board, not the manager.
3. **August–December.** Form establishes the narrative. Cup runs begin — welcome money and momentum, but they eat the training week.
4. **December–January congestion.** Most sackings cluster here. January window: reactive, expensive, mostly loans and panic.
5. **February–April.** The run-in. Injuries accumulate, squad depth is exposed, the table stops lying.
6. **End of season.** Board review against pre-set objectives; retained list; contract renewals and expiries; released players; academy promotions; next-season budget agreed. This meeting decides whether you are still employed.

### A4. Who the manager deals with — and the friction

| Stakeholder | What they want | Friction |
|---|---|---|
| **Owner / board** | Objectives hit, cost control, no embarrassment | They judge on a target set 10 months ago in different circumstances |
| **Sporting director** | Multi-year squad building, profile-fit signings, asset value | Coach wants results *now*; SD thinks in 3-year cycles. This is the single most reliable conflict in modern football |
| **Scouts** | Their recommendations used | Manager wants proven, scouts push potential |
| **Medical / sports science** | Player protection, load management | They say no; the manager needs him Saturday |
| **Assistant / coaching staff** | Influence, loyalty rewarded | Inherited staff may be the board's eyes |
| **Agents** | Wages, moves, playing time for clients | Leverage via press leaks and unsettled clients |
| **Players** | Minutes, respect, a new contract | The unhappy fringe player is where dressing rooms are lost |
| **Press** | A quote, a crisis, a story | Every honest answer becomes a headline that reaches the dressing room |
| **Fans** | Identity, effort, hope | Fan mood is the pressure that transmits to the board |

### A5. Real failure modes (how managers actually die)

- **Expectation gap, not results.** 6th at a club expecting 10th is a triumph; 6th at a club expecting 4th is a sacking. The gap is the metric.
- **The run.** Boards act pre-emptively — they don't wait for unsalvageable. Average tenure is now ~16 months across Europe's elite; recent Premier League averages sit under two years.
- **Losing the dressing room.** Senior player conflict, freezing out the wrong name, publicly blaming players.
- **Losing the board.** Briefing against the club in press, demanding money that isn't there, feuding with the sporting director.
- **Financial mismanagement.** Blowing the wage structure on one signing; leaving the club exposed to a spending cap breach.
- **Timing.** Clubs that change manager *early* while in the relegation zone usually survive; late changes usually don't. Both the board and the player know this.

### A6. Modern financial reality (practical version)

- **Spending caps, not budgets.** Premier League has moved from PSR (£105m losses / 3 years) to **Squad Cost Ratio**: total wages + transfer amortisation + agent fees capped at **85% of revenue** (70% for clubs in Europe, under UEFA's rule). Practical meaning: *success raises revenue, which raises the cap.* Failure shrinks the club.
- **Amortisation.** A £50m fee on a 5-year deal costs £10m/year on the books; on a 2-year deal, £25m/year. Longer contracts = cheaper *this* year, riskier later. This is the entire "spread the cost" decision.
- **Wage structure.** The real constraint. One player above the ceiling detonates the dressing room and every renewal that follows.
- **Agent fees.** Typically ~5–10% of the deal; count against the cap.
- **Clauses.** Release clause (club must let him talk if triggered), sell-on (a % of the next sale), buy-back, loan **with option** vs **with obligation** to buy, appearance/goal add-ons.
- **Loans.** How mid and small clubs get quality they cannot buy; how big clubs park youth. Cost is wage share, not fee.
- **Academy & registration.** Homegrown quotas and work-permit/GBE points restrict who you can register — youth is cheap, quota-safe, and sellable at pure profit (no amortisation on an academy player).

### A7. The job at three club sizes

| | **Rich club** | **Mid-table club** | **Struggling club** |
|---|---|---|---|
| Objective | Trophies; 4th is failure | Improve one place; sell well | Survive |
| Real work | Ego management, rotation, Europe | Recruitment cleverness, selling your best player every summer | Firefighting, morale, injuries |
| Money | Cap-limited, not cash-limited | Every signing is a bet | Free transfers and loans |
| Press | Global, hostile, daily | Local, transactional | Fatalistic |
| Failure | Sacked after 3 bad results | Sacked after a bad half-season | Sacked in December |
| Emotional core | *Can you keep winning?* | *Can you build something before they take it apart?* | *Can you keep it alive?* |

---

## PART B — Translation table (duty → mechanic)

| Real-world duty | Proposed game mechanic | Taps | Cut it? |
|---|---|---|---|
| Match review + GPS load data | Post-match card: 3 flagged players (tired / knock / off form) with one action each | 1–3 | Keep — cheap, feeds the week |
| Injury triage | Medical card per injured player: **Rest / Rush** with an honest % re-injury risk | 1 | Keep — best 1-tap dilemma in the game |
| Weekly training focus | Pick **one** weekly focus from ~5 (Fitness, Attack, Defence, Set Pieces, Team Spirit) | 1 | Keep. **Cut** per-drill schedules entirely |
| Opposition analysis | Scout report card: 1 opponent strength + 1 weakness; choose one **counter-plan** from 3 | 1 | Keep — this is "tactics" for us |
| Individual player conversations | Weekly "Office" — max 2 players want you (unhappy, wants contract, wants out). 3 reply tones | 1–2 | Keep, but hard-cap at 2 per week |
| Press conference | 1 question, 3 answers with visible tags (Squad morale ↑ / Fan mood ↑ / Board patience ↓) | 1 | Keep. **Cut** multi-question interviews |
| Team selection | Auto-picked XI you can override; drag-swap only | 0–4 | Keep. **Cut** individual player instructions |
| In-match management | Highlights view; 2–4 decision moments: sub / shift mentality / hold on | 1 per moment | Keep — the emotional core |
| Substitutions | Two suggested subs + a manual option | 1 | Keep |
| Set pieces | Assign taker roles once per season, not per match | 1 (rare) | **Trim** — season-level only |
| Board meeting / objectives | Start-of-season contract: 3 objectives, visible always as a progress bar | 2 (accept/negotiate) | Keep — the game's spine |
| Board requests mid-season | Occasional demand ("sell X", "play the academy kid"): Accept / Refuse | 1 | Keep |
| Sporting director relationship | SD proposes signings you didn't ask for; Accept / Reject / "Get me a striker instead" | 1–2 | Keep — best source of authored conflict |
| Scouting | Assign scouts to a **region/profile**, get a shortlist of 5 with a confidence star, not 40 attributes | 1–2 | Keep. **Cut** manual scout filtering UI |
| Transfer negotiation | Slider-free: 3 pre-computed offers (Lowball / Fair / Overpay) + up to 2 clause toggles (sell-on, instalments) | 2–3 | Keep — **cut** free-text haggling |
| Contract negotiation | 3 packages (Loyal / Market / Blow-the-wage-structure) with a wage-structure warning bar | 1–2 | Keep |
| Agent handling | Agent demands a fee/clause as a yes/no gate on a deal | 1 | Keep — 1 tap, real cost |
| Release / sell-on clauses | Shown as toggles at signing; fire automatically later as news events | 1 at signing | Keep |
| PSR / SCR compliance | Single **Squad Cost meter** (% of revenue) that turns amber/red. Blocks deals when red | 0 (passive) | Keep — **cut** all balance-sheet screens |
| Amortisation | Automatic; surfaced only as "Cost per season: £10m over 5 yrs" on the offer card | 0 | Keep as text, never as a system |
| Loans in/out | List of loan candidates; Accept / Decline; option-to-buy toggle | 1–2 | Keep |
| Academy | Once a season: promote up to 2 youth players; monthly one-line academy news | 1–2/yr | Keep — cheap, high emotion |
| Homegrown / registration quota | Squad screen shows "Homegrown 7/8" as a badge; blocks registration if short | 0 (passive) | Keep as constraint, **cut** as screen |
| Pre-season | Choose a pre-season **plan** (Fitness-first / Tactical / Money tour) — one tap, season-long effect | 1 | Keep |
| Friendly scheduling | Auto. Manager picks tour destination only | 0–1 | **Cut** individual fixture booking |
| Fixture congestion | Two-game weeks visibly remove the training-focus and Office slots | 0 (structural) | Keep — great, invisible design |
| End-of-season review | Board verdict screen: objectives met/missed, new contract or sack, next budget | 1–2 | Keep — the annual climax |
| Staff hiring | Hire assistant/coach/physio/scout once a season; each gives one clear passive bonus | 1–2 | **Trim** to 4 staff slots max |
| Fan mood | Passive meter driven by results, style, selling favourites, ticket-price events | 0 | Keep |
| Media narratives / rivalries | Auto-generated headline in the daily feed; no interaction | 0 | Keep as flavour |
| Detailed tactics (roles, instructions, mentality per player) | — | — | **CUT ENTIRELY.** One formation + one team style + one counter-plan |
| Attribute-level scouting (200 stats) | Replaced by 4 visible ratings + one hidden trait revealed over time | — | **CUT** the stat sheet |
| Youth intake day, training facilities upgrades, ticket pricing, kit deals | Board-side; report as news, never as a screen | 0 | **CUT** as player-facing systems |

---

## PART C — The 10 decisions that define the game

Never automate these. Each one must be a single screen, few taps, and slow-burning consequence.

1. **Which job you take.** Rich/mid/struggling club with different objectives, budgets and patience — this sets the entire emotional tone of the save.
2. **Whether to accept the board's objectives or negotiate them.** Argue for a softer target and get less money; accept a hard one and buy yourself credibility.
3. **Rush the injured star or rest him.** One tap, an honest risk %, and a real chance you break his season.
4. **Sell your best player.** The board wants the money, the fans want the player, and the fee funds three signings. The defining mid-table decision.
5. **Break the wage structure for one signing.** Immediate quality vs. a year of unhappy senior players and inflated renewals.
6. **Play the academy kid or the safe veteran.** Cheap, quota-friendly, future asset — or points now.
7. **Who to blame in the press after a bad defeat.** Yourself (board patience ↓), the players (morale ↓), the officials (fan mood ↑, FA charge risk). No neutral option.
8. **Whether to back or bin an unhappy senior player.** The dressing-room fork — losing it is a distinct, visible losing condition.
9. **Prioritise the cup run or the league.** Rotation in a congested week; a trophy is emotion and money, but survival is the job.
10. **Take the bigger job when it calls — or finish what you started.** Loyalty vs. ambition, mid-save, with the project unfinished.

---

### Sources
Striker Report (week in the life of a manager); Sky Sports (press conference operations; managerial tenure data); Premier League / Farrer & Co / Brabners (PSR → Squad Cost Ratio & SSR reform); UEFA Pro Diploma syllabus (leadership, crisis and media management content); Jobs In Football, Association of Sporting Directors, Bundesliga.com (sporting director role and coach friction); CIES Football Observatory (coach tenure); Zone14 / SportsLabTools (pre-season phase planning); Jobs In Football, Wikipedia (release/buyout clauses, agent commission, loan structures).
