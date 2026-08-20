# 12 — Football Manager: Market, Search & Scouting — and the Radical Cut

Owner: FM market research agent. Scope: how Football Manager's transfer market, player search and scouting actually work, and the much smaller system we should build instead. **Not** FIFA 10/11/12 — a parallel agent owns that, and the owner has named FIFA as the model he wants. This document treats FM as the *depth reference*: it is the best player-search tool ever shipped in a football game, and roughly 90% of it must not come near our phone.

**The one-paragraph answer.** FM's market is great because of one idea and one idea only: **it shows you what you don't know, in a shape you can act on.** The attribute range ("Passing 8–16") and the ghost-star potential bar turn ignorance into a playable object. Everything else — 30-plus filter fields, saved views, knowledge percentages, six-tier scouting packages, ten clause types, the agent loop — is administrative overhead that FM's own audience routes around, automates, or turns off. Steal the uncertainty display. Steal FM26's "post a want-ad and clubs come to you". Steal FM Mobile's ranked top-N list. Cut the rest to four filters, four sort options and an eight-field player row.

---

## 1. Player search

### 1.1 How it actually works

FM's search lives in two places that do the same job with different framings: **Player Search** (a database query tool) and, since FM26, the **Recruitment hub** (a tile dashboard that consolidates what used to be five separate screens). The FM26 rebuild is itself the most useful evidence in this document — SI shipped it explicitly because recruitment was spread across "multiple different areas of the game" and needed to be "simpler to use and more intuitive to navigate." *Football Manager's own developers concluded their market UI was too fragmented and rebuilt it around a single hub.* We should not re-derive that lesson the slow way.

Search has two modes:

- **Quick Search** — a dropdown of one-criterion presets (free agents, transfer-listed, players interested in joining, expiring contracts). This is the mode most players actually use most of the time.
- **Advanced Search** — a filter builder. You add conditions, each with a field, an operator and a value; conditions AND together; the result set is a table whose **columns are separately configurable via Views**. Filters and Views are two different customisation systems stacked on each other, and both are saveable, shareable as files, and swappable between saves.

That last fact is the tell. There is a **large third-party economy of downloadable filters and custom-view "megapacks"** (FM Scout, Passion4FM, FM-Arena, Steam Workshop, plus external tools like GenieScout and save-scrapers that load 45k players and re-implement the search entirely). A thriving aftermarket in *filter presets* is not a sign of a beloved tool. It is a sign that the built-in tool is too laborious for its own audience to operate from scratch, so they trade config files instead.

### 1.2 The filter inventory, and what people actually use

The full field list, as close to complete as public documentation gets, with a verdict for us.

| # | FM filter | What it does | Community reality | Verdict |
|---|---|---|---|---|
| 1 | **Position** (natural / accomplished / competent) | Filter by playable position, with a proficiency threshold | Universal. Filter #1 in every guide. | **KEEP** — as 5 chips (ANY/GK/DEF/MID/FWD) |
| 2 | Role suitability (In/Out of possession roles, FM26) | Score vs a tactical role | Newer, growing use; community reports it over-filters and hides good U18s | **CUT** — we have no roles at this depth |
| 3 | **Age min/max** | Numeric age range | Universal. Filter #2. Every wonderkid guide opens with ≤18 or ≤20. | **SIMPLIFY** — 3 named bands, not a slider (see §7) |
| 4 | Nationality / second nationality | Passport filter | Long tail. Used for homegrown/quota edge cases and "sign my own nation" role-play | **CUT** — flag as decoration only |
| 5 | Continent / region / division | Geographic and league-level scope | Moderate use, mostly to *widen* to lower leagues for bargains | **CUT** — replace with a sort ("BEST VALUE") |
| 6 | Work permit / EU / homegrown status | Eligibility | Real friction in FM; pure admin | **CUT** entirely. No eligibility system. |
| 7 | **Transfer status** (listed / loan-listed / unavailable) | Availability | Heavy use via Quick Search | **SIMPLIFY** — fold into one "AVAILABLE" state; never show unavailable players |
| 8 | **Contract expiring / free agent** | Bosman hunting | Heavy use. One of the genuinely fun filters. | **SIMPLIFY** — a `FREE` badge on the row, not a filter |
| 9 | Release clause / minimum-fee clause present | Finds forced-sale prices | Niche but loved; guides call it a hidden-gem source | **CUT** at launch (see §3.4 — we should not ship clauses) |
| 10 | **Value min/max** | Market value band | Heavy use, but as a proxy for "can I afford this" | **SIMPLIFY** — one `IN BUDGET` toggle, default ON |
| 11 | Asking price | The club's actual number | Used by experienced players; often unknown | **CUT** as a filter; show as *the* price on the row |
| 12 | Wage / wage expectation | Affordability of terms | Moderate; matters most at small clubs | **SIMPLIFY** — folded into the affordability verdict |
| 13 | Reputation (world / national / home) | Proxy for "would he come" | Recommended by SI's own guidance; opaque to newcomers | **CUT** — replace with a plain-English "would join us" verdict |
| 14 | Star rating: current / potential | Scout-relative quality | Very heavy use — and very heavily misunderstood (§2.4) | **REPLACE** with an absolute overall + ghost potential |
| 15 | **Individual attribute min/max** (×~36) | The power tool | Used by maybe the top decile; everyone else downloads someone's preset | **CUT.** This is the single biggest complexity sink in FM search. |
| 16 | Attribute-group averages / custom role score | Composite scoring | Advanced/third-party territory | **CUT** |
| 17 | Personality / media handling | Hidden-attribute proxy | Genuinely used by good players ("Model Citizen", "Professional") | **SIMPLIFY** — one scout-revealed trait word, not a filter |
| 18 | Player traits (PPMs) | Behavioural quirks | Long tail | **CUT** |
| 19 | Preferred foot | Left/right/either | Narrow: wing-backs and inverted wingers | **CUT as filter**, see §8 |
| 20 | Height / weight | Physicality | Set-piece and target-man builds | **CUT.** See §8. |
| 21 | Injury status / injury history | Risk screen | Moderate | **SIMPLIFY** — an icon on the row |
| 22 | Condition / match fitness | Current sharpness | Rarely used in search | **CUT** |
| 23 | Morale / "wants to leave" | Unhappiness sniffing | Moderate; a real bargain source | **CUT as filter**, keep as a `WANTS OUT` badge |
| 24 | **Interest in joining your club** | Filters to realistic targets | Heavy use; one of the best filters FM has | **KEEP** — but as an always-on rule, not a filter (never show players who'd refuse) |
| 25 | Statistics (apps, mins, goals, assists, avg rating, xG, per-90s, pass %, tackles) | Data scouting | Growing, enthusiast-only | **CUT** at launch |
| 26 | International caps / U21 caps | Talent proxy | Recommended by SI as a wonderkid tell | **CUT** — we have no international football at this fidelity |
| 27 | Squad status / playing time | "Is he starting?" | Moderate | **CUT** |
| 28 | Knowledge level / scouted-only | Show only players you know | Used by purists | **CUT as filter** — confidence is shown per-row instead (§2.5) |
| 29 | Agent / intermediary | Deal-broker filter | Vanishingly rare | **CUT** |
| 30 | Loan availability / loan-back | Loan market | Moderate | **CUT** at launch |
| 31 | **Saved searches / saved filters** | Persist a query | Used, and traded as files | **CUT.** Four filters do not need saving. |
| 32 | **Custom Views** (column configuration) | Choose which columns display | Heavy among enthusiasts; huge third-party market | **CUT.** The row is fixed. One row design, forever. |
| 33 | **Shortlist** | Persistent watch list, itself searchable | Universal. The most-used feature in the whole system. | **KEEP** — as a 10-slot Watchlist |
| 34 | Comparison view (2-player, squad-relative) | Side-by-side attributes | Moderate; the squad-relative version is the useful one | **SIMPLIFY** — show the delta vs the man he'd replace, on the row |
| 35 | Quick Search presets | One-tap common queries | The most-used *search* affordance | **KEEP in spirit** — our four chips *are* the quick searches |

**Score: 4 KEEP, 8 SIMPLIFY, 23 CUT.**

### 1.3 The handful that do the real work

Strip the guides and forum threads down and the same six recur, in this order:

1. **Position** — non-negotiable, first, always.
2. **Age** — as a ceiling ("under 21"), almost never as a floor.
3. **Affordability** — expressed as value, asking price or wage depending on which the player trusts, but always answering one question: *can I have him?*
4. **Availability / interest** — "would this club sell and would he come."
5. **Contract expiry** — the Bosman/bargain hunt.
6. **Three to six attribute minimums** for the role — and this last one is where the complexity lives, where the third-party presets exist, and where a newcomer drowns.

Everything else in the table above is long-tail. That is our whole brief in one observation: **five of the six real filters compress to four chips; the sixth compresses to a sort order.**

---

## 2. Scouting

### 2.1 The machinery

- **Knowledge** is a per-player, per-nation, per-competition quantity. Your club has default knowledge derived from your division and your staff's career history; scouts accumulate more by being assigned somewhere and staying there. Manager profile attributes ("Player Knowledge", "Youngster Knowledge") set your baseline for senior and U23 players respectively.
- **Scouting range** is bought, tiered from **Divisional → Surrounding Division → National → Regional → Continental → World**, each level costing more per month out of a **scouting budget**. This is a literal pay-to-see-more-of-the-map mechanic.
- **Assignments** are jobs given to named scouts: watch a player, watch a competition, watch a region, watch youth. Each has a duration and a priority; the Assignments screen shows past, current and queued work. A separate **Scout Priorities** list tracks individual-player watches.
- **Recruitment Focus** is the standing-order version: a parameter set (position, role, age bracket, contract situation, nation) that the recruitment team works continuously and reports against. FM26 added colour-coded tags for active focuses and tactical-fit advice from your backroom.
- **Reports** take time. Community consensus and SI guidance both land on roughly **three to four full matches watched** before a report reaches 100% knowledge. The report itself carries: current and potential star ratings, a knowledge-completion percentage, **Pros and Cons** in prose, tactical fit, wage and injury-risk notes, and a **Scout Recommendation grade (A–E with +/−)**.
- **Hidden attributes** (professionalism, ambition, consistency, big-match temperament, injury proneness — thirteen of them) are *never* numeric. They leak only as report prose and via the visible **Personality** label. Good players read scout adjectives — "professional", "consistent performer", "enjoys the big occasion" — as a code for the hidden bytes.
- **Recommendations** arrive unsolicited from scouts, agents, affiliate clubs and players approaching you directly, and land in the Scouting Centre as cards or a list, each dismissible or actionable (dismiss / acknowledge / scout fully / offer / shortlist).

### 2.2 The attribute-range display — exactly how it works

This is the part worth copying, so here it is precisely.

With **attribute masking on** (the default), a player outside your club whom you barely know does not show numbers. He shows one of three states:

1. **Nothing.** Zero knowledge: the attribute grid is blank or greyed. You know he exists and roughly where he plays.
2. **A range.** Partial knowledge: the attribute reads `8-16`, or `11-16`, in the same slot where a number would normally sit. The *width* of that range is your ignorance made visible. A 1–20 attribute shown as `8-16` tells you almost nothing; the same attribute shown as `13-15` tells you nearly everything.
3. **A number.** Full knowledge: `14`. The range collapses to a point.

The same logic applies to the star ratings, and this is the more elegant half. Potential ability displays as a **solid star portion plus a translucent "range" portion**: the solid stars are the floor you can rely on, the ghosted stars are the ceiling you might get. A prospect might read as "three solid stars, ghosting to five" — one glance says *he is already useful and he might become excellent, and we don't know which yet.*

Ranges narrow through exactly three routes: scout time on the player, general knowledge of his nation/competition rising, or playing against him. There is no way to buy certainty instantly. And the narrowing is **not free of bias**: the range is drawn by *your scout*, and its accuracy depends on his Judging Player Ability and Judging Player Potential. A bad scout gives you a confident, wrong number.

### 2.3 Why it feels good

Four reasons, and each is portable:

1. **The shape of the unknown is itself information.** A wide band and a narrow band demand different decisions. You are never told "unknown"; you are told *how* unknown, which is playable.
2. **Narrowing is a visible reward.** The range shrinking is the payoff for a resource you spent (scout weeks, money, attention). It is a progress bar attached to a person.
3. **It creates a currency.** Because certainty costs something, information becomes tradeable against money and time. That is the entire scouting economy in one mechanic.
4. **It licenses gambling.** A `9-18` player is an explicit invitation to take a punt. Players tell stories about those punts. Nobody tells a story about a `14`.

### 2.4 The part of FM's uncertainty display that is broken

**Star ratings are relative to your squad, and scout-subjective, and this confuses everybody.** A 5-star potential at a fifth-tier club is not a 5-star potential at Real Madrid; the stars measure "better than what you currently have", not "good". Every guide site has to write a paragraph explaining this, which is a design failure. Players routinely misread a striker as world-class because their own strikers are poor, sign him, and feel cheated. Compounding it: the rating shifts when your squad improves, so the same player silently loses a star between seasons.

**Verdict: copy the range, refuse the relativity.** Our overall must be absolute and stable — 78 means 78 at every club in the world, forever. Show squad-relativity separately and explicitly as a *delta against the man he'd replace* (`+6 on your current ST`), which is the useful half of the idea without the instability.

### 2.5 How we adapt it

We already have a scouting module returning uncertainty labels. Bind it to a display, and make the display do all the work.

**Three confidence tiers, not a percentage.** Percentages invite arithmetic; tiers invite decisions.

| Tier | Glyph | Overall shown as | Attribute bars | How you get here |
|---|---|---|---|---|
| **RUMOUR** | `?` hollow circle | `72–81` (band, no point value) | wide lit band, ±8 | default for anyone outside your league |
| **WATCHED** | `◑` half circle | `76–79` | narrow lit band, ±4 | one scout report, or you've played them |
| **KNOWN** | `●` filled circle | `78` | solid fill + number | full report, or he's your player |

**Make the band width a pure function of the tier** (±8 / ±4 / 0). Do not model per-attribute uncertainty. It is invisible to the player, costs bytes, costs CPU, and buys nothing on a 7-attribute model.

**The attribute bar.** Each of the seven attributes renders as a track of fixed length. The *lit segment* spans the possible range; at KNOWN it collapses to a filled bar with a number at the end. Potential renders as a **ghost extension of the overall bar only** — never a separate number, never stars. One bar, two zones: what he is, what he might become.

```
RUMOUR      Pace       ░░░░░████████░░░░  ?
            Finishing  ░░░████████░░░░░░  ?
            OVERALL    ▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒▒   72–81   (▒ = possible ceiling)

KNOWN       Pace       ████████████░░░░  81
            Finishing  ██████████░░░░░░  74
            OVERALL    ▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒   78 → 84
```

**Rules that must hold:**

- **Never show a number you don't have.** No greyed-out "estimated 78". The band *is* the answer at that tier.
- **Animate the narrowing.** When a report arrives, the band visibly contracts. This is the single most rewarding 400ms in the scouting system and it costs almost nothing to build. It should also be the content of the hub action card: "Report in: **T. Okoro** — 74–81 → **79**."
- **Encode uncertainty by width and glyph, not colour** (per the accessibility rules in doc 04 §7).
- **Bad scouts should be wrong, but only mildly.** Off-centre the band rather than widening it, and never by more than a few points. FM's version — a confident wrong number — is realistic and infuriating. A newcomer who signs a player and finds the number outside the band he was shown will conclude the game lied to him. Keep the true value inside the displayed band, always. Bias the *midpoint*, not the *containment*.

---

## 3. Valuation and negotiation

### 3.1 How FM values a player

There is no published formula, but the consistent account across SI staff comments and community testing is that value is a function of:

- **Current ability**, weighted by **age** — peak value at roughly 24–28, falling steeply from 30.
- **Potential ability**, which dominates for teenagers (a 17-year-old's value is nearly all option premium).
- **Contract**: length remaining and, crucially, **current wage**. Community consensus is that wages make up the *majority* of a player's book value — a player on a huge salary is expensive to buy out, so his value rises. Value falls off a cliff after 1 July when contract time shortens.
- **Reputation** — of the player, his club and his league. The same player is worth several times more in the Premier League than in Poland; Ajax extract more than PSV for equivalent players.
- **Form and consistency**, as a modifier rather than a driver. Best time to sell is May/June after a trophy.

Note the loop hiding in there: wage → value → fee → next club's wage. That is one of the engines behind long-save inflation (§4.3).

### 3.2 How AI clubs decide to bid and accept

Reported behaviour, largely from player observation rather than documentation:

- The AI weighs **age and improvement potential, reputation, contract time remaining, division, recent trophies, and current playing time/form.** A player not playing attracts almost no interest regardless of ability.
- **Asymmetric pricing.** The most-repeated complaint in the genre: AI clubs open at roughly *half* value when buying from you, and demand around *four times* value when selling to you. They move 10–20% from an opening position, then hard-stop; push past an invisible threshold and they withdraw entirely.
- **Auction pressure works.** Rival interest measurably improves your position; so does the selling club's financial distress.
- FM26 added **FFP awareness, squad-vision alignment and better loan/recall logic**, an implicit admission that prior AI transfer decisions were, in the community's words, often illogical.

### 3.3 The clause menu

FM's offer screen exposes, at minimum:

| Clause / term | What it does |
|---|---|
| Fee | The headline number |
| **Instalments** | Fee spread over months/years. Widely used as an exploit: AI clubs will accept ~double the price if half of it is deferred. |
| Transfer date | Immediate or end of season |
| Appearance fees | Per-match / per-N-appearances add-ons |
| Goal / assist bonuses | Performance add-ons |
| Promotion / competition-qualification bonuses | e.g. Champions League qualification |
| International recognition bonus | Pays out on caps |
| **Sell-on clause** | % of a future fee (or of profit) to the selling club |
| **Buy-back clause** | Right to repurchase at a preset price |
| **Minimum fee release clause** | A bid at this figure cannot be blocked; the player must be allowed to talk |
| Exchange / part-exchange | Include your players in the deal |
| Loan: playing/non-playing monthly fee, wage contribution, future-fee option, recall, playing-time guarantee | The loan sub-menu |
| Lock icons | Mark a term non-negotiable (once) or semi-negotiable (twice) |

Plus **agent/intermediary fees**, **signing-on fees**, **loyalty bonuses**, **wage rises on promotion**, **appearance/goal bonuses in the contract**, and **release clauses in the contract** on the *player* side of the deal.

That is somewhere north of twenty independent levers on a single signing.

### 3.4 The negotiation loop, and why it is hated

The contract loop is the most complained-about part of the FM market, and the complaints are specific and consistent:

- **Agents renege.** An agent states a player would accept a given wage; the moment you negotiate anything, demands on wage, bonuses and clauses jump above the original ask. Logged as a bug across versions; still cited.
- **Ratchet, not meeting in the middle.** Any counter-offer resets or raises demands rather than converging. Players describe agents as having "the patience of a toddler and the financial demands of an ex-wife."
- **The community's workaround is an algorithm, not a negotiation.** The widely shared recipe: strip every clause and bonus, zero the loyalty bonus and agent fee, keep only a 5% sell-on, set wage to ~80% of the ask, "Suggest Terms", and repeat with small increments until acceptance. When the optimal play is a deterministic loop you run by hand, you do not have a negotiation system — you have a data-entry chore with a random seed.
- Verdict from the threads: "a joke", "tedious".

**This is the clearest possible instruction for us: do not ship a negotiation loop.** Ship a *decision*.

---

## 4. The market as a living system

### 4.1 What FM does to stay credible

- **Budgets are downstream of the world model.** Transfer and wage budgets derive from club revenue, which derives from league position, reputation, attendance and competition income, and are re-set by the board each season. Budgets are also fungible: you can convert transfer money into wage money and vice versa at a penalty.
- **Wage structure is a real constraint.** One overpaid signing ripples through the dressing room and raises everyone else's demands at renewal, which caps runaway squad-building even for rich clubs.
- **Supply is conserved.** Ageing, decline, retirement and annual youth intake keep the population and its quality distribution roughly stationary. Newgen quality is pegged to nation/club reputation and facilities, so the world doesn't drift.
- **Reputation is the master price index.** Because value keys off league and club reputation rather than off recent transactions, the model has a stabilising anchor.

### 4.2 The AI squad-building logic

The AI evaluates squad needs by position and depth, weighted by its tactical setup, board vision and (from FM26) FFP headroom. It buys to fill its worst slots, sells surplus, and behaves differently by club size — big clubs hoard reputation, small clubs chase value.

### 4.3 Where it fails: inflation

Long saves inflate. Community reports are consistent and severe: wages roughly tripling within a decade of in-game time (top earner £95k/wk → £240k/wk inside one save-year in one reported case); FM23 saves reaching 2043 describe a "massive spike in transfer fees and wages" that then "continues to skyrocket", with insufficient income growth to match. The mechanism is the wage→value→fee→wage loop of §3.1 running open-loop, plus AI clubs bidding against each other over a fixed elite supply.

Also documented: **AI squad quality decays over long saves.** Players simulating 20+ seasons report Real Madrid, Barcelona, Juventus and Bayern failing to spend budgets sensibly, repeatedly buying £10–20m mediocrities and fielding average squads. The market stays *busy* but stops being *smart*.

### 4.4 What we take from this

Four rules, and they are cheap:

1. **Value is computed, never observed.** `value = f(overall, potential, age, contract years, club reputation) × league index`. **Prices paid must never feed back into valuations.** This alone kills the inflation spiral that eats long FM saves.
2. **Budgets are a fixed share of a modelled revenue**, and revenue is a function of league tier, finishing position and reputation — with a hard cap on year-on-year growth (say +15%). An economy that cannot compound cannot explode.
3. **Wage bill is a hard cap with a visible bar**, not a soft consequence. One number, always on screen in the market. Signing someone who breaks it is refused, with a plain sentence, before the offer screen opens.
4. **Every AI club re-evaluates two squad slots per season** — its weakest starting slot and its weakest depth slot — and shops for those. That is the whole AI. It produces credible-looking movement, it is trivially debuggable, and it never spends £20m on a mediocrity because it only ever buys for a named hole.

And one behavioural rule that matters more than all the economics: **AI clubs must bid for your good players, unprompted, at or above value.** The strongest emotional beat in a management game is an unsolicited bid for a player you love. FM's asymmetric lowballing sabotages this. Ours should not: surplus players attract fair offers, stars attract silly ones, and both arrive as hub cards.

---

## 5. Where FM is wrong, or simply too much

Be blunt. This list is the design brief in negative form.

1. **The negotiation loop is a chore with a known-optimal manual algorithm** (§3.4). Devoted players describe it as a joke and share a step-by-step workaround.
2. **Asymmetric AI pricing** — half-value bids in, quadruple-value asks out — is the single most-cited market complaint across every version.
3. **Selling is disproportionately hard.** Widespread reports of no worldwide interest in perfectly good players, plus boards blocking sales after a fee is agreed. The market is one-directional in a way real football is not.
4. **Star ratings are relative and unstable** and require an explanatory essay (§2.4).
5. **Scouting competes with search and often loses.** A large slice of the audience turns attribute masking *off* and just queries the database, which deletes the entire scouting layer. When a system's most engaged users disable your best mechanic to save time, the mechanic is priced wrong.
6. **Knowledge is a grind**: three to four full matches watched per player for a complete report, multiplied across a shortlist, funded from a monthly budget you must also manage.
7. **Long-save inflation and AI squad decay** (§4.3).
8. **Opacity.** Value has no published model; asking price is "if known"; the accept/reject threshold is invisible and punishes you by withdrawing rather than countering.
9. **Fragmentation** — SI rebuilt the whole thing into a hub in FM26 because their own recruitment flow was spread across too many screens.
10. **The filter builder is a power tool that most players never learn**, evidenced by the size of the downloadable-preset economy and the existence of external scouting apps that re-implement search from the save file.
11. **FM26's smarter recruitment focuses over-filter** — community reports of promising U18s being excluded by the new role-based filters. Cleverer filtering hid the exciting players. A warning for anyone tempted to make the search "intelligent".
12. **Deadline day** is a themed UI over the same slow negotiation loop.

---

## 6. What FM Touch and FM Mobile cut — our closest precedent

### 6.1 Touch

Touch's philosophy: "simpler than full-fat FM, deeper than mobile", finishing seasons in a fraction of the time. What it dropped: **team talks during matches, most press interaction, player-morale conversations, tactical familiarity, detailed training and set-piece routines**, and a big slice of the database (fewer leagues, fewer players).

**The instructive part is what it did *not* cut: the transfer market.** Touch kept full search, scouting, negotiation and clauses essentially intact. Across multiple simplification passes SI concluded the market was the part worth keeping at depth — because the market *is* the game for a large share of the audience. (Touch was subsequently discontinued everywhere except Switch, on a cost-benefit basis, and folded into the Console/Xbox edition.)

### 6.2 Mobile

FM Mobile is the genuine reduction, and it maps closely to our constraints:

- **A Scouting Agency instead of a scouting department.** Its core surface is a **ranked list of the top 50 players in the world for current ability and for potential, filterable to your own nation.** No filter builder. A curated, always-interesting list you can just *read*.
- **Scouts assigned to a region, or to youth.** Two options, not six tiers.
- **Scout one player from his profile**, one tap, report shortly.
- **Four saved shortlists.**
- **Offers reduced to a fee-centric screen** with an explicit rule of thumb surfaced to the player: *start at 100% of his valuation.* FM's full game hides that number behind "unless he's transfer-listed, you generally need to bid at least his value."
- **FM26 Mobile replaced the menu maze with a single tile-based Recruitment hub** — objectives, scouting focuses and contract situations all visible on open — and improved the scout's pre-match opponent report to include a per-player rating.

**Did it work?** FM26 Mobile drew the best reception of the FM26 family, in a year when the desktop rebuild was mauled. The mobile-first simplification of recruitment is the one part of recent FM that unambiguously landed. Note also that FM26's *desktop* headline feature was TransferRoom **Requirements** — broadcast a profile (position, role, playing time, age, transfer type) and let clubs bring you players — and **Pitch Opportunities**, the inverse for selling. That is a search-to-inbox inversion: it converts a filter-building task into a short form plus a stream of results. **On a phone that inversion is worth more than the search screen itself.**

---

## 7. The age problem

The owner's observation — *"nobody likes old players"* — is correct, and it is half a presentation problem and half an economics problem. Fixing only the presentation will not work.

### 7.1 Why it happens

In FM, peak CA lands around 23–28 (as low as ~26 for strikers, far later for goalkeepers); physicals decline first and hardest, mentals keep rising, and CA cannot be held past ~35. A 33-year-old is therefore a **depreciating asset with no option value**. In a game whose whole pleasure is accumulation, an asset that only shrinks is unattractive by construction. No amount of UI makes a player *want* one — unless the old player does a job the young one cannot.

### 7.2 Give old players a job (economics first)

Three levers, all cheap:

1. **Price collapse must be dramatic and visible.** A 33-year-old at 80 overall should cost a fraction of a 24-year-old at 80 — not 30% less, but 80% less. The bargain has to be *shocking* on the row.
2. **Ready now, at a price a small club can pay.** For a struggling side, a 33-year-old 80 is a bigger immediate XI upgrade than anything else affordable. That is a real, legible strategic choice: *win now vs build.*
3. **One mechanical perk, not a system.** Veterans (30+) give a small development bonus to the youngest player sharing their position, surfaced as a single line on the player sheet: `Mentors your 18-year-old.` One sentence, one effect, no submenu. This is the smallest possible version of FM's mentoring and it gives the veteran a reason to exist beyond nostalgia.

### 7.3 Presentation: the age chip

**The requirement: a 33-year-old must read as a different *kind* of thing from a 21-year-old without the player reading anything.** So encode age as a **trajectory**, not a number, and put the number inside the trajectory.

The age chip is a single fixed-position element on every player row containing three co-encoded signals:

| Band | Chip | Arrow | Shape / weight | Means |
|---|---|---|---|---|
| **≤21** | `21 ↑` | up | tall chip, upward notch | will improve |
| **22–29** | `26 →` | level | plain rectangle | as good as he'll get |
| **30+** | `33 ↓` | down | flattened chip, downward notch | declining, cheap, ready |

Colour reinforces but never carries the meaning alone (doc 04 §7): the **arrow glyph and the chip silhouette** are the primary channel, so it survives greyscale and deuteranopia. The three chips are distinguishable at thumbnail size, at a glance, pre-literacy. That is the bar the owner set and it is met by shape alone.

**Supporting rules:**

- **Never show a date of birth. Never show the word "peak".** Never write "declining".
- **Contract years sit next to the chip** (`33 ↓ · 2 yrs`) — for an old player, contract length *is* the product description.
- The three bands are also the **only age filter**, as chips labelled by what they mean to a manager, not by number: **PROSPECTS · PRIME · EXPERIENCE**. A newcomer picking "PROSPECTS" has just learned the game's entire theory of age without reading a tutorial.
- **Default sort is need-weighted, not age-weighted.** Do not bury old players — that teaches nothing and removes a legitimate strategy. Let the chip and the price do the arguing.
- On the player sheet, potential renders as the ghost extension of the overall bar (§2.5). A 33-year-old simply has **no ghost** — the bar ends where he is. That absence is the most eloquent thing on the screen and it needs no label.

---

## 8. Height, weight, foot, work rate — should we add them?

| Trait | Verdict | Reasoning |
|---|---|---|
| **Height** | **No** — as a stat. Maybe as a derived tag. | Only earns its place if aerial duels and set pieces are separately modelled. If we want "tall target man", derive a `TALL` tag from high Physical and use it in commentary and set-piece resolution. A number the player cannot act on is noise. |
| **Weight** | **No.** Never. | Zero decision value in any football game ever shipped. It exists in FM for database fidelity. |
| **Preferred foot** | **Add as a displayed trait. Do NOT add as a filter.** | Cheap (2 bits), adds real texture — it makes two otherwise identical 76-rated wingers feel like different players, which is exactly what a generated world needs. But it is a narrow filter even in FM. Better use: let the **squad screen** raise it as a need ("no left-footed defender") and let the market's default sort quietly honour it. The player gets the benefit without operating a control. |
| **Work rate** | **No** — as a number. **Yes** — as a scout-revealed trait word. | We already have hidden personality bytes; work rate is the same class of thing. Surface it as one word from a small closed vocabulary (`Workhorse`, `Coasts`, `Model Pro`, `Hothead`, `Big-game player`, `Glass`, `Leader`, `Loyal`), revealed only at WATCHED/KNOWN confidence. This gives the scouting module something to *reveal* other than numbers, which is worth far more than a filterable stat. Cap it at **one trait per player**, and keep the vocabulary under ten words so players learn all of them within a season. |

**General principle:** a new attribute is only worth adding if (a) the player can act on it in under one tap, or (b) it is a *reward for scouting*. Foot and work-rate-as-a-word pass under (b). Height and weight fail both.

---

## 9. THE SIMPLEST MARKET THAT STILL FEELS GOOD

### 9.1 The time budget, which decides everything

A season is 15–20 minutes. Two transfer windows. **The entire summer window must be resolvable in 60–90 seconds**, or the market eats the season. At roughly 4 seconds per tap including reading time, that is ~20 taps. Three signings at six taps each. **Six taps, from opening the tab to a bid being sent.** Every decision below is derived from that number.

### 9.2 The screen

One screen — `TRANSFERS → [Market]`, the default segment of the tab. No sub-navigation. Everything below is on it.

```
┌────────────────────────────────────────────────┐
│  £12.4m to spend      ▓▓▓▓▓▓▓▓▓▓▓░░░  wages 82%│  ← sticky budget strip
├────────────────────────────────────────────────┤
│  ANY   GK   DEF  ▣MID▣  FWD                    │  ← row 1: position (5 chips)
│  ▣PROSPECTS▣  PRIME  EXPERIENCE   ▣IN BUDGET▣  │  ← row 2: age bands + budget
├────────────────────────────────────────────────┤
│  Sort:  ⌄ BEST                                 │  ← 4 options
├────────────────────────────────────────────────┤
│                                                │
│   ▸ player rows ...                            │
│                                                │
├────────────────────────────────────────────────┤
│           ✎  ASK MY SCOUT TO FIND ONE          │  ← sticky, thumb zone
└────────────────────────────────────────────────┘
```

**Two filter rows. One sort. One escape hatch. Nothing else.**

### 9.3 The filters — four, and that is the complete list

| Filter | Values | Default | Why it survived |
|---|---|---|---|
| **Position** | ANY · GK · DEF · MID · FWD | pre-set to your **weakest squad slot** | The universal first filter. Pre-setting it means the common case is zero taps. |
| **Age band** | PROSPECTS (≤21) · PRIME (22–29) · EXPERIENCE (30+), multi-select | none = all | Teaches the age model by existing (§7.3). |
| **In budget** | on / off | **on** | Replaces value, asking price, wage and reputation filters with one honest question. |
| *(implicit)* **Would join us** | — | always on, not a control | FM's best filter. Never show a player who would refuse us; a market full of impossible targets is a market full of dead ends. |

**Everything else is cut.** No nationality, no league, no attribute minimums, no contract filter, no saved searches, no custom columns, no comparison view, no stats, no traits filter, no foot, no reputation, no work permit. If a filter combination returns fewer than five players, **auto-widen and say so in one line** ("Not many prospects in midfield — showing prime players too"). **The market never shows an empty state.**

### 9.4 The sort — four options

| Sort | Orders by | The player it serves |
|---|---|---|
| **BEST** *(default)* | overall, weighted by how badly you need that slot | the newcomer who wants the obvious answer |
| **CHEAPEST** | price ascending | the broke club |
| **YOUNGEST** | age ascending, then overall | the project builder |
| **BEST VALUE** | overall per £, with potential counted | the min-maxer — this is the sort that makes bargain-hunting a *sport* |

Four is the maximum a segmented control holds without a dropdown. BEST VALUE is the one that creates stories; do not cut it to three.

### 9.5 The player row — eight fields, fixed positions, forever

```
┌──────────────────────────────────────────────────┐
│ ┌────┐                                    ●      │
│ │ ST │  D. MARCHETTI                    78       │
│ └────┘  24 ↑ · 2 yrs · 🏴                        │
│         "Ready to start"              £4.2m  ✓   │
└──────────────────────────────────────────────────┘
```

| # | Field | Rendering | Rule |
|---|---|---|---|
| 1 | **Position badge** | 2–3 letters, tinted by line (GK/DEF/MID/FWD) | Fixed left. The eye's anchor. |
| 2 | **Name** | Generated, 1 initial + surname | Never a full first name — surnames scan faster and read as football. |
| 3 | **Overall** | Largest type on the row; a **band** (`72–81`) at RUMOUR, a **number** (`78`) at KNOWN | The only number that gets visual weight. |
| 4 | **Confidence glyph** | `?` / `◑` / `●` | Adjacent to the overall, small. Encodes §2.5. |
| 5 | **Age chip** | `24 ↑` — number + arrow + silhouette | Per §7.3. Shape carries the meaning. |
| 6 | **Contract years** | `2 yrs`, or the badge `FREE` | Replaces the entire contract-expiry filter. |
| 7 | **Price** | Rounded hard: `£4.2m`, `£850k`, `Free` | Never a range, never "asking price unknown". One honest number we will honour. |
| 8 | **Affordability mark** | `✓` / `✗` + the whole row dims at 40% when unaffordable | Icon *and* dimming — two channels, colourblind-safe. |
| 9 | *(decorative)* | Nationality flag | Texture only. Never filterable at launch. |
| 10 | **Verdict phrase** | ≤4 words from a closed set of ~12 | `Ready to start` · `One for later` · `Bargain` · `Wants out` · `Injury risk` · `Better than your ST` · `Big earner` · `Won't come cheap`. A closed vocabulary is learnable; free prose is not. |

**Row height ~88pt.** Roughly six rows visible. That is the correct number: enough to compare, few enough to decide.

**Explicitly not on the row:** attributes, stars, wage, club reputation, form, morale, stats, height, foot, personality, scout grade, league name, current club's league position. All available one tap deeper; none earn the pixels here.

### 9.6 The two screens behind it

**Player sheet (depth 2).** Seven attribute bars with uncertainty bands, overall bar with ghost potential, one scout sentence, trait word if known, contract line, mentoring line if 30+. Two buttons: **WATCH** (adds to the 10-slot Watchlist) and **MAKE OFFER**.

**Make Offer sheet (depth 3, one tap deep, closes the loop).**

```
   Asking price £4.2m
   ▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░  your offer £4.2m
   
   [ LOW £3.2m ]  [▣ FAIR £4.2m ▣]  [ STRONG £5.0m ]
   
   "They'll probably say yes."          ← live verdict, plain English
   
   ☐ Pay over 2 seasons                 ← the ONE clause we ship
   
              ▸  SEND OFFER  ◂
```

- **Three preset bids, never a stepper.** A stepper is an invitation to bisect the accept threshold; three buttons is a decision.
- **A live verdict sentence** from a closed set: *"They'll say yes." / "They'll probably say yes." / "They might think about it." / "They'll laugh."* This is FM's hidden accept-threshold made visible, which fixes complaint #8 in §5.
- **One clause, ever: instalments.** It is the only clause in FM with a genuine, legible strategic trade — more total money for less money now — and it is one tap. Sell-on gets a mirrored single toggle on the *selling* side only. Appearance fees, goal bonuses, buy-backs, release clauses, exchange deals, loan-back, international bonuses: **all cut.**
- **No agent fee as a separate number. Ever.** Fold it into the displayed price. The player sees one figure and pays that figure.
- **No contract negotiation loop.** After a fee is accepted, one sheet with **three wage/length presets** (`Modest · Standard · Generous`, each showing the weekly figure and the wage-bar impact) and a single accept/refuse response. No counter-offers, no agent haggling, no bonus grid. Doc 04 already reserves Contract Negotiation as a takeover screen — this is its content.

### 9.7 The escape hatch: "Ask my scout to find one"

The FM26 Requirements steal, and the highest-value single feature in this document after the uncertainty band.

Three taps: **position → age band → budget slider**. Confirm. Over the next in-game weeks, **scout reports arrive as hub action cards** (doc 04 §1), each one a single player with a narrowing band and two buttons: `MAKE OFFER` / `NOT INTERESTED`.

This matters because it converts the market from a *place you must visit* into a *stream that comes to you* — which is exactly the shape of our hub. A player who never opens the Transfers tab still signs players, still experiences scouting, still feels the band narrow. **It is the whole market in the core loop, at zero navigation cost.** It is also the natural home for FM Mobile's ranked-top-N idea: the scout's cards are, in effect, a curated list of the best available players for your need.

### 9.8 The complete cut list

**Cut without replacement:** attribute min/max filters · saved searches · custom views/columns · nationality, region, league and division filters · work-permit and eligibility rules · reputation filter · wage filter · stats filters · traits filter · personality filter · foot filter · height/weight entirely · scouting knowledge percentages · scouting range packages and scouting budget · scout assignment micro-management · named individual scouts · Judging-Player-Ability staff attributes · the clause menu (all but instalments and sell-on) · agent fees as a visible number · contract negotiation rounds · loyalty bonuses, signing-on fees, appearance and goal bonuses · release clauses · exchange deals · the loan market at launch · transfer deadline day · squad-relative star ratings · comparison view · unavailable players appearing in results · empty search states.

**Keep, reshaped:** position filter (5 chips) · age (3 named bands) · affordability (1 toggle) · would-join (silent, always on) · shortlist → 10-slot Watchlist · scouting → the uncertainty band and its narrowing · offer → 3 presets + 1 clause · squad-relative comparison → a single `Better than your ST` verdict phrase.

**Steal outright from FM:** the attribute range and the ghost-potential bar (§2.2) · the narrowing-as-reward moment (§2.5) · FM26's want-ad inversion (§9.7) · FM Mobile's "start at 100% of valuation" plain-language pricing rule (§6.2).

---

## 10. Build order

1. **The age chip and the player row.** Cheapest change, biggest immediate effect on the owner's stated complaint. Ship it before anything else.
2. **The uncertainty band**, bound to the existing scouting module's labels, collapsed to three tiers. Including the narrowing animation — it is 400ms of work and it is the whole feeling.
3. **Filter reduction to four**, sort to four, everything else deleted from the screen.
4. **Offer sheet: three presets + live verdict sentence.** Delete any stepper.
5. **"Ask my scout to find one"** → hub action cards.
6. **Valuation hardening**: computed value, no transaction feedback, capped revenue growth, wage-bill hard cap (§4.4). Do this before the first long-save playtest or the economy will be wrong in ways that are expensive to unpick later.
7. Veteran mentoring line, trait words, unsolicited AI bids for your players.

---

## Sourcing note

Reddit was not directly accessible to automated fetch, and several primary sources (Sports Interactive's own community manual and forums, Passion4FM, FM Scout, VideoGamer, TouchArcade, guidetofm) returned HTTP 403 to automated requests. **Community sentiment in §1.2, §3.2, §3.4, §4.3 and §5 is therefore second-hand** — drawn from search-result summaries of those SI forum and Steam Community threads, plus directly fetched blog and guide sources. Every specific complaint cited above was corroborated across at least two independent surfaces before being included. Mechanical descriptions (§1.1, §2.1, §3.3, §6) come from directly fetched guide and developer pages and are firmer.

## Sources

- [Football Manager 2024: Transfers, Recruitment & Scouting — FIFAUTeam](https://fifauteam.com/football-manager-2024-transfers-guide/) — scouting centre, range tiers, shortlists, offer screen, clauses
- [Powered by TransferRoom: FM26's Recruitment Revamp — Football Manager](https://www.footballmanager.com/fm26/features/powered-transferroom-fm26s-recruitment-revamp) — recruitment hub, Requirements, Pitch Opportunities
- [FM26 Recruitment Revamp vs FM24 — Football Manager Blog](https://www.footballmanagerblog.org/2025/10/fm26-recruitment-revamp-vs-fm24.html) — what changed, over-filtering criticism
- [Transfer Market Top Tips in FM26 — The Dugout](https://www.footballmanager.com/the-dugout/transfer-market-top-tips-fm26) — budgets, clause-selling, recruitment focuses
- [Football Manager 26: How To Set Up Scouting — Operation Sports](https://www.operationsports.com/football-manager-26-how-to-set-up-scouting/) — assignments, JPA/JPP, report contents
- [FM Wunderkinds 2026: Scout Filters, Hidden Attributes — The Higher Tempo Press](https://www.thehighertempopress.com/2025/09/fm-wunderkinds-2026-scout-filters-hidden-attributes-and-a-5-season-plan/) — the filters experienced players actually build
- [Football Manager 2023 Player Search Filters — Outsider Gaming](https://outsidergaming.com/football-manager-2023-player-search-filters/) — filter categories, saved filters
- [How to Search for Players in Football Manager 2023 — GameSpew](https://www.gamespew.com/2022/11/how-to-search-for-players-in-football-manager-2023/) — quick vs advanced search
- [Football Manager Attributes Explained — FM Dossier](https://fmdossier.dev/guides/player-attributes-explained) — 1–20 scale, decimal precision, thirteen hidden attributes
- [Major Changes for FM22 Touch and Beyond — Football Manager](https://www.footballmanager.com/news/major-changes-fm22-touch-and-beyond) — Touch discontinuation and reasoning
- [FM21 Mobile vs Touch vs PC — FOOTY.COM](https://www.footy.com/blog/culture/fm21-mobile-vs-touch-vs-pc/) — what Touch cut
- [When do players peak in Football Manager? — sortitoutsi](https://sortitoutsi.net/content/67377/when-do-players-peak-in-football-manager-the-advise-from-si-is-a-lie) — peak-age and decline data
- [Football Manager Current and Potential Ability Guide — FM Scout](https://www.fmscout.com/a-football-manager-current-and-potential-ability-guide.html) — CA/PA, range stars, squad-relative ratings
- [Transfer Add-Ons — Football Manager Wiki (Neoseeker)](https://footballmanager.neoseeker.com/wiki/Transfer_Add-Ons) and [Minimum fee release clause — FM Wiki](https://footballmanager.fandom.com/wiki/Minimum_fee_release_clause) — clause definitions
- [Inflation in the football players' transfer market — CIES Football Observatory](https://football-observatory.com/Inflation-in-the-football-players-transfer-market) — real-world inflation baseline
- Steam Community FM24 discussion threads on [contract negotiations](https://steamcommunity.com/app/2252570/discussions/0/599639424473575229/), [unrealistic wage demands](https://steamcommunity.com/app/2252570/discussions/0/3879347492856315761/), [negotiating with agents](https://steamcommunity.com/app/2252570/discussions/0/4344355079685821321/), [AI refusing offers](https://steamcommunity.com/app/2252570/discussions/0/603020257754360005/) and [transfer values](https://steamcommunity.com/app/2252570/discussions/0/603020878754650313/) — the complaint corpus and the community workaround algorithm
- [Football Manager Mobile 2026 Discussion — FM Scout](https://www.fmscout.com/q-34158-Football-Manager-Mobile-2026-Discussion.html) and [FMM Vibe](https://fmmvibe.com/forums/topic/50589-bargain-transfers/) — FM Mobile recruitment hub reception
- [FMSuperScout — GitHub](https://github.com/mavarobli/FMSuperScout) — evidence of the external-search-tool economy
