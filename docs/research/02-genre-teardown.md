# 02 — Genre Teardown: Mobile Football Management

Research date: 20 Aug 2026. Sources: App Store / Google Play listings and review pages, TapTap, Metacritic, Trustpilot, developer sites, published game deconstructions, review press. Reddit is not crawlable by our tooling — review-site and forum sentiment was used as the substitute and is flagged where it is second-hand.

**Naming correction up front.** "FC Chairman" and "FC Pro 2" are the *Football Chairman* series, developed by **Underground Creative Ltd** (football-chairman.com), not Ellyland — no studio by that name exists in this space. The line is: Football Chairman (free, ads + IAP), Football Chairman Pro (£1.99 premium), Football Chairman Pro 2 (£3.99 / $3.99 premium, released Aug 2024). Series has 2M+ downloads and four Apple Editor's "Best of" awards (2013, 2014, 2016, 2017).

---

## 1. The reference games: Football Chairman / Pro / Pro 2

### Core loop
You are the **chairman, not the manager**. You never pick a team or set tactics. The loop is:

1. Hire a manager (each with a personality, preferred formation, wage demand, and happiness meter).
2. Approve/reject his transfer requests; negotiate fees and contracts.
3. Set ticket prices, player bonuses, sponsorship deals, pre-season friendlies.
4. Build: stadium stands (individually named), training facilities, youth setup, backroom staff (coaches, scouts, physios).
5. Tap through matchweeks — every match has **Skip to End**; a reviewer measured "home screen → match → home screen in a few seconds."
6. End of season: promotion/relegation across **seven English divisions**, then repeat.

Two meters govern everything: **fan happiness** (determines whether you keep your job) and **the bank** (determines whether you survive). The manager's happiness is a third, softer meter feeding results.

### Session shape
**A full season takes 15–20 minutes.** Reaching the top division from non-league takes 40–50 hours. That ratio is the single most important number in this document: the *unit of progress* is a season, and a season fits inside one commute. The free version caps a career at 30 seasons; Pro adds an "Immortal" never-ending mode.

### What Pro 2 adds
Domestic + European cups, a World Team Cup, multi-club careers, full youth squad management, custom kit design each season, manager personality profiles, transfer shortlist, Hall of Fame, Trophy Cabinet, 99 achievements, four challenge scenarios (incl. Financial Fair Play), pick-your-derby-rival, datapack editor. Annual free data updates. 4.8/5 on 165 US ratings.

### What reviews PRAISE
- "Exactly the right depth for a game played on the go, while still having enough depth to keep you coming back."
- "Simple, addictive, and loads of replay value."
- "Really enjoy how quickly you can play through a season."
- Premium and offline: **no ads, no timers, no internet required.** This is repeatedly cited as the reason people prefer it to every free rival.
- Building an institution rather than a squad — "your character development is the club."

### What reviews COMPLAIN about — this is the opportunity list
1. **"Rigged" / scripted losing streaks.** The dominant negative theme across Pro and Pro 2: difficulty spikes that feel authored, overpowered home advantage, teams "unable to win away even against poor sides." Users say "the game is rigged so you keep losing to encourage spending money."
2. **RNG that reads as punishment, not drama.** Frequent injuries clustered at bad moments; results described as "random compared to the achievements you can obtain."
3. **Transfer market is a black box.** "I would have a better idea what I wanted to bid if I knew what their value was." Buy/sell price discrepancy called unfair. No search, no filtering, no scouting narrative.
4. **Economy realism.** "Weekly running costs are categorically and highly unrealistic"; constant contract-demand spam.
5. **Repetition.** The loop is enjoyable "for passing time" but thins out — after ~10 seasons the decisions stop changing.
6. **No players as people.** Users explicitly ask for deeper transfer windows, real players, the ability to create players. Squad members are rows, not characters.
7. **Cosmetic-tier simulation.** Every division has 22 teams; no real league structures.

**Read that list as a product brief.** Five of the seven complaints are about *opacity and thinness*, not about missing depth. Fixing them does not require Football Manager's complexity.

---

## 2. The wider field

| Game | Depth | Session length | Monetisation | Platform | One thing it does best | Fatal flaw |
|---|---|---|---|---|---|---|
| **Football Chairman Pro 2** (Underground Creative) | Low–mid, club-side only | 15–20 min = 1 season | Premium $3.99 + optional IAP; no ads, offline | iOS, Android | Season-as-a-session pacing; institution-building fantasy | Feels rigged; squad has no characters; thin transfers; repeats after ~10 seasons |
| **Top Eleven** (Nordeus) | Mid | 3–6 min, 3–5× daily, forced | F2P: tokens, rewarded ads, offerwall, energy, IAP | iOS, Android | Live-ops and daily-habit engineering; 230M registered users | Energy timers + token wall; "£20/month or the algorithm is against you"; 28-day real-time seasons |
| **OSM** (Gamebasics) | Low–mid | 2–4 min, 1×/day | F2P: Boss Coins, IAP $0.99–$99.99, 30–40s ads, offerwall | iOS, Android | Frictionless onboarding, real leagues, social leagues with friends | 24h between matches, a season takes a real month; "a credit card makes you stronger than someone who has played for years" |
| **Soccer Manager 202x** (Invincibles) | Mid | 5–15 min | F2P + unskippable ads; premium variants | iOS, Android | Real FIFPro-licensed players and squads | Ads mid-flow; iterates yearly with little change; presentation dated |
| **Club Soccer Director / Soccer Club Management 2025** (Go Play Games) | High (for mobile) | 10–30 min | F2P, coins + cash bundles, IAP to $39.99, VIP Pass | iOS, Android | Breadth: 880 clubs / 40 leagues / 30k players; pick your role (Chairman, DoF, Head Coach, Manager); 3D highlights | "Pay-to-win, complicated mess", "everything is tied to coins and cash bundles", "too complicated in a tedious way", board blocks stadium upgrades, mandatory match watching |
| **FM Mobile** (SI/Netflix) | Mid-high squad depth | 10–20 min | Free with Netflix sub; no ads, no IAP | iOS, Android | Real database + genuine tactical/squad depth on a phone | Zero club-building: no stadium, no sponsorship, no ticketing, no ownership; no 3D; gated behind a Netflix account; FM25 was cancelled outright |
| **FM Touch** (Apple Arcade) | High | 30–60 min | Apple Arcade subscription | iOS, Mac, Switch | Full-fat FM streamlined without feeling gutted | Still a "sit down" game; subscription-gated; assumes tablet |
| **We Are Football** (Winning Streak) | High, breadth-first | 30–60 min | Premium PC | PC only | FIFA Manager's breadth reborn — men's *and* women's leagues, deep external editor (leagues, referees, sponsors, fan chants, derbies), adjustable difficulty knobs; superb 2D match screen | PC only, unlicensed generic names, dated UI, German-first — invisible to the mobile audience |
| **FIFA Manager 14** (EA, final entry 2013) | Highest breadth ever shipped | 60+ min | Premium PC | Dead | Everything below in §3 | Dead, unbuyable, unsupported; and it was genuinely bloated |
| **New Star Manager** (Five Aces) | Low, hybrid | 2–5 min | Mobile F2P with ad-gated cards/retries; premium on PC/Switch | Mobile, PC, Switch | Arcade moment inside a management game — you drop in for the shot on goal | "Poor on-field action and poor off-field management"; ads are the core loop on mobile |

---

## 3. What FIFA Manager career mode had that mobile dropped

This is the breadth the owner is nostalgic for. Specifics, from the FIFA Manager 12–14 feature sets:

**Infrastructure.** 25 building types with **289 configuration levels**. Up to **three stadia**, up to 120,000 seats. Buildings **age** and need renovation. A **stadium editor** letting you build separate grounds for first team, reserves and youth. You could **bid to host the European Cup final**.

**Commercial.** A **sponsor pyramid** — one Main Sponsor plus Platinum/Gold/Silver tiers. Sell **ad boards**. Sell **naming rights to the stadium *and to individual stands***. Run **sponsor campaigns** to attract new partners. **Hotels and amenities** attached to the ground as extra income lines. A **stock exchange** with club shares, where sporting success bought you the trust of financial markets.

**People.** Full staff hierarchy incl. a fitness coach from day one. **Player talks** and **press interviews**. **Board cooperation** — the board as a relationship you manage, not a wall you request things from. **Youth camps** you build, expand and manage geographically.

**Squad intelligence.** The **Player Matrix** and **hierarchy pyramid** — a visual read of dressing-room structure and who holds power in the squad. FIFA Manager's player-dynamics model was good enough that Football Manager only shipped its equivalent in **2019, six years after FIFA Manager died.**

**Match.** 3D match on the FIFA engine, a **Match Prognosis Tool**, and the ability to **simulate to a specified minute** then take over — assistants ran your tasks while you watched.

**Life.** The **Private Life** module — house, car, family, personal stock-market investments, manager reputation. Crucially, **toggleable on or off at new-game.** That toggle is the whole lesson: breadth without imposition.

**Calendar texture.** Charity events, lactate tests, friendly-match requests, triallists you could run in a test match before signing.

**What mobile kept:** stadium capacity upgrades, one sponsorship number, ticket prices.
**What mobile dropped:** every one of the italicised nouns above. The board as a character. Naming rights. Staff as individuals. Youth camps as places. Squad hierarchy. Manager life. Trials. Match prognosis. Simulate-to-minute.

---

## 4. The addiction mechanics — what actually works

**1. Emergent narrative is the product.** FM's own community says it plainly: "the storylines that emerge in every save are what keeps fans hooked." Not the sim quality — the *story*. Mobile chairman games give you numbers and never give you a story. This is the largest untaken opportunity in the genre.

**2. The save as sunk cost.** Long saves force generational turnover: your stars age, retire, and must be replaced. That turnover is what converts "a game I play" into "a club I own." Football Chairman's free version capping careers at 30 seasons actively fights this; Pro's "Immortal" mode exists because players demanded it.

**3. The youth-prospect fantasy.** FM's newgen/regen system is the most obsessed-over mechanic in the genre — when a legend retires the engine spawns a young inheritor with his potential and traits, and whole guide industries exist around finding them. It is a **free lottery ticket earned through infrastructure**: build the academy, spin the wheel each intake day, and occasionally a 16-year-old changes your next ten seasons. Variable-ratio reward, earned rather than purchased.

**4. The "next match" hook.** Skip-to-End is a slot-machine pull resolving in under two seconds. The compulsion isn't the match, it's the *resolution of uncertainty*, delivered fast enough to chain.

**5. The underdog arc.** Seven divisions from non-league to Europe is a legible ladder with visible rungs, and every rung changes the economy around you — bigger sponsors, bigger wages, harder fixtures. "Start at the bottom" is the genre default for a reason and should be ours.

**6. What kills addiction — and every game in §2 does at least one of these.** Perceived dishonesty ("rigged"), forced waiting (OSM's 24h/match, Top Eleven's energy refilling 1 per 60 minutes), and a paywall that invalidates skill ("a credit card makes you stronger than someone who has played for years"). Trustpilot has 70-season Top Eleven veterans deleting the app — that is the failure mode of monetising the fantasy itself.

---

## 5. Session design: 3 minutes vs 30

The genre's own numbers: average mobile session is 4–5 minutes; 2–5 minute sessions drive frequency and D1 retention. Football Chairman's season is 15–20 minutes. The best design serves both by making the **season the save-point and the matchweek the session-point**.

**The 3-minute session (target: 60–70% of sessions).** Open → 2–3 pending decisions surfaced as a card stack on the home screen (a contract expiring, a transfer bid received, a sponsor offer, an injury) → resolve each with one tap and a visible consequence → play the next matchweek → read a three-line result summary → close. Never a dead end; never a "come back later." Design rule: **the app must be exitable at any tap with nothing lost.**

**The 30-minute session (the weekend / the evening).** Transfer window, end-of-season review, stadium planning, youth intake day, reading your club's history. These are *pull* content — the player chooses to open them — and must never be *required* to keep the club running. Each needs an "assistant handles it" default.

**The bridge:** an autopilot that is competent but never optimal. The assistant signs an adequate right-back; you would have signed a better one. That gap is the reason to come back for the long session, and it is guilt-free rather than punitive.

**Anti-pattern:** Club Soccer Director's "mandatory match watching" and Top Eleven's fixed live-match times. Time-locking attention is the fastest way to lose a football fan who has an actual match to watch.

---

## 6. Monetisation

**What the audience demonstrably hates** (mined from store and Trustpilot reviews):
- **Hard-currency walls on core progression.** OSM's Boss Coins and Club Soccer Director's coins/cash bundles produce the same verbatim complaint in both games: everything is tied to currency, and money beats time. CSD's reviews literally read "pay-to-win, complicated mess."
- **Energy timers.** Top Eleven refills 1 energy per 60 minutes below a threshold. Rated as the top frustration by long-tenured players.
- **Long forced ads.** OSM's 30–40 second ads; Soccer Manager's unskippable 5-second pre-rolls mid-flow; Top Eleven's minute-plus ads that "often don't pay out."
- **Offerwalls that don't deliver.** OSM: "9 times out of 10 they do not receive the prize, and the issue persists for months." This destroys trust permanently.
- **Suspected monetised RNG.** Even Football Chairman — a *premium* game — gets accused of throttling wins to sell investor packs. If a premium game can attract this accusation, an F2P one is guaranteed to.

**What the audience demonstrably rewards:** Football Chairman Pro 2 is $3.99, offline, ad-free, timer-free, and holds 4.8/5. FM Mobile via Netflix is free with no ads and no IAP and is celebrated for it. Both prove the same thing: **in this genre, the absence of monetisation friction is itself a selling point people talk about in reviews.**

**Recommendation — premium with a free ladder, and zero currency in the sim:**
1. **Free tier**: full game, one country's pyramid, career capped at ~15 seasons, no ads at all (or a single optional rewarded ad for a cosmetic, never for outcomes). It is a demo shaped like a game, exactly as Football Chairman free is.
2. **One-time unlock (~$5–7)**: unlimited seasons, all nations, multi-club careers, challenge scenarios, editor.
3. **Occasional paid content packs** (new nations, new eras, new scenario sets) — content, never advantage.
4. **Hard rule: no currency, no energy, no timers, no simulation outcome ever touched by a purchase.** Say this on the store page in the first three lines. It is a differentiator against every free competitor in §2.
5. If a recurring revenue line is required later, use an **annual data-update subscription** that is genuinely optional (Underground Creative gives updates free; a paid "live squads" tier is the honest version of recurring revenue here).

Expected trade: lower ARPDAU than Top Eleven, dramatically better review sentiment, word-of-mouth in exactly the community that buys this genre, and no accusation of rigging that we cannot immediately rebut.

---

## 7. THE GAP

> **No one has shipped a premium, offline, story-generating club dynasty sim on mobile with FIFA Manager's *breadth of decisions* at Football Chairman's *cost per decision*.**

The field splits cleanly and leaves a hole in the middle:

- **Breadth exists only where it is monetised into a mess** (Club Soccer Director) or **only on PC** (We Are Football, dead FIFA Manager).
- **Speed and cleanliness exist only where the game is thin** (Football Chairman: no tactics, no scouting, no squad characters, no story).
- **Squad depth exists only where the club doesn't** (FM Mobile: no stadium, no board, no sponsorship, no ownership).
- **Nobody on mobile generates narrative at all.** The genre's proven addiction driver — the emergent story of a save — is completely absent from every mobile title in this teardown.

The game that should exist: **you inherit a non-league club and own it for fifty years.** A season is twenty minutes. Every screen FIFA Manager had exists, but each is one tap deep and each has a competent assistant default, so breadth never becomes homework. The match engine is *transparent* — after every result you can see the two or three factors that decided it, which structurally kills the "rigged" complaint that damages every competitor. And the game writes your club's history as you go: a Hall of Fame, a chronicle of promotions and near-misses, the academy graduate who became the club's record scorer — a readable, shareable artefact that makes a 40-hour save feel like something you own rather than something you spent.

---

## STEAL / AVOID / INVENT

| STEAL | AVOID | INVENT |
|---|---|---|
| **Season = 15–20 min** (Football Chairman). The season is the unit of progress and it fits a commute. | **Energy timers and refill clocks** (Top Eleven: 1 energy/60 min). The #1 cited frustration by veterans. | **Transparent results.** After every match, 2–3 named factors that decided it. Structurally eliminates the "rigged" complaint that damages every competitor. |
| **Skip to End on every match** (Football Chairman). Sub-2-second resolution of uncertainty; chainable. | **Real-time match locks** (OSM's 24h between fixtures; a season taking a real month; CSD's mandatory match watching). | **The Club Chronicle.** Auto-written club history: promotions, records, academy graduates, Hall of Fame, rival head-to-heads. The genre's proven addiction driver, absent from all mobile titles. |
| **Seven-division underdog ladder** from non-league to Europe, with the economy changing at every rung. | **Hard currency on core progression** (OSM Boss Coins, CSD coins/cash bundles). Produces identical "pay-to-win" reviews in both. | **Assistant-with-a-gap autopilot.** The AI runs everything competently but never optimally; the delta is the reason to open the 30-minute session, guilt-free. |
| **Premium, offline, ad-free, timer-free** (Pro 2: $3.99, 4.8/5). Reviewers cite the *absence* of monetisation as a feature. | **Long / unskippable / non-paying ads** (OSM 30–40s; Soccer Manager 5s unskippable; Top Eleven ads that don't pay out). | **One-tap breadth.** Every FIFA Manager module present, each one tap deep with a sane default. Breadth as options, not obligations. |
| **Institution-building over squad-building** — the club is the character (Football Chairman's actual insight). | **Offerwalls** (OSM: rewards not delivered "9 times out of 10" for months). Trust damage is permanent. | **Naming rights & sponsor pyramid, mobile-sized** — sell the stadium *and individual stands*, tiered sponsors, ad boards. FIFA Manager had it; no mobile game does. |
| **Youth intake day** as an earned lottery (FM newgens/regens inheriting a retiring legend's potential). | **"Too complicated in a tedious way"** (CSD verbatim). Depth expressed as more screens rather than more meaning. | **Board as a character, not a wall.** FIFA Manager's "board cooperation"; CSD's board that just rejects stadium upgrades is the counter-example. |
| **Manager personalities** with formations, wage demands and happiness (Pro 2) — cheap characterisation with real mechanical bite. | **Career caps** (Football Chairman free stops at 30 seasons) — fights the sunk-cost investment that drives retention. | **Squad hierarchy view** (FIFA Manager's Player Matrix). FM only shipped its equivalent in 2019. Nobody on mobile has it. |
| **Difficulty knobs** (We Are Football: injury probability, budget sliders). Player-set difficulty pre-empts "unfair" reviews. | **Opaque transfer market.** "I'd have a better idea what to bid if I knew their value" — the most-repeated Football Chairman request. | **Toggleable extra modules** at new-game (FIFA Manager's Private Life on/off switch). The mechanism that lets breadth coexist with simplicity. |
| **Free data updates annually** (Underground Creative) — cheap goodwill, high retention. | **Purchase-shaped RNG.** Even *premium* Football Chairman is accused of throttling wins to sell investor packs. Never give this accusation a foothold. | **Store-page promise:** "No energy. No timers. No currency. No ads. Works offline." Position the absence of F2P mechanics as the headline feature. |
