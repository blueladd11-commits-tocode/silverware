# 10 — UI Performance Research
### Which interface decisions measurably move install conversion, first-session completion, and retention — and which are decoration

**Project:** SILVERWARE
**Date:** 20 August 2026
**Scope:** The *evidence* half of the UI research pair. This document is about **what works and why, with numbers**. The visual-language teardown of top-grossing apps is a separate document — deliberately not duplicated here.
**Author's brief:** "We can have the best content in the world, but without a hall-of-fame-level UI it just gets deleted."

---

## 0. How to read this document

Most published claims about game UI are folklore repeated between SEO blogs until they acquire the appearance of fact. This document grades every claim.

| Grade | Meaning |
|---|---|
| **A** | Controlled experiment, pre-registered study, or peer-reviewed research with stated N and method. |
| **B** | Large-N platform/benchmark data from a named analytics provider with stated methodology. Observational, not causal. |
| **C** | Vendor case study or single-company A/B test. Real, but selection-biased (nobody publishes their losing tests). |
| **D** | **Folklore.** Widely repeated, no traceable primary source. Listed so you can recognise it when someone quotes it at you. |

Three warnings that apply to everything below:

1. **Almost all retention "benchmarks" are observational.** Games with 31% D1 have longer first sessions *and* better art *and* bigger budgets *and* better UA targeting. Correlation is doing a lot of work. The only way to know if a UI change moved your D1 is to A/B test it in your own game. Section 11 tells you how.
2. **Benchmark methodologies are not comparable to each other.** GameAnalytics measures every install in an SDK-integrated game. AppsFlyer measures attributed (largely paid-UA) cohorts. AppsFlyer numbers are systematically higher because paid installs from targeted campaigns retain better than the long tail of organic and incentivised traffic. Do not mix the two tables.
3. **The industry got worse, not better.** Retention benchmarks have declined every year since 2023 across every provider. Judge yourself against the current year, and against the top quartile, not the median — the median mobile game is a commercial failure.

---

## 1. The numbers you are actually competing against

### 1.1 Platform-wide retention (GameAnalytics, 2026 report — 16,262 mobile games, iOS + Android, min. 1,000 MAU) — **Grade B**

| Percentile | D1 | D7 | D30 |
|---|---|---|---|
| Median | ~20% | just under 4% | 0.69–0.79% |
| Top 25% | just above 30% | 6–7% | 1.6–1.8% |
| Top 10% | 40% | 11–12% | ~2.5%+ |
| Top 1% | 64–68% | up to 28% | 13–15% |

Engagement, same report:

| Percentile | Session length | Sessions/day | Daily playtime |
|---|---|---|---|
| Top 25% | 5.2 min | 5.3–5.7 | 22–24 min |
| Top 10% | 8 min | ~9.6 | 40–42 min |
| Top 1% | ~22 min | ~14 | 94+ min |

The prior year's report (11,600 apps, 1.48bn MAU, 16 genres) adds two facts worth carrying:

- **iOS top-quartile D1 is 31–33% vs Android 25–27%.** A 6-point platform gap. If you ship both, segment your dashboards or you will misread every experiment.
- **Median session length across all games is 3.1–3.5 minutes.** Mid-core titles run the *most* sessions per day (6–7) but not the longest ones. **Grade B**

### 1.2 Retention by genre (AppsFlyer Q3 2022 cohorts, republished by Mistplay) — **Grade B, but note the methodology gap**

| Genre | D1 | D3 | D7 | D14 | D30 |
|---|---|---|---|---|---|
| Match | 32.65% | 19.62% | 13.98% | 10.35% | 7.15% |
| Puzzle | 31.85% | 18.20% | 12.18% | 8.43% | 5.35% |
| Tabletop | 31.30% | 17.66% | 11.90% | 8.39% | 5.51% |
| RPG | 30.54% | 15.58% | 9.85% | 6.23% | 3.48% |
| **Simulation** | **30.10%** | **14.83%** | **8.71%** | **5.39%** | **2.96%** |
| Action | 29.77% | 13.77% | 7.64% | 4.41% | 2.14% |
| Hyper-casual | 29.31% | 12.11% | 5.90% | 3.13% | 1.38% |
| Shooting | 28.54% | 12.16% | 6.45% | 3.58% | 1.79% |
| Casino | 28.16% | 14.78% | 9.85% | 6.65% | 4.10% |
| **Strategy** | **25.39%** | **12.81%** | **8.06%** | **5.26%** | **3.12%** |

**Read this carefully, because it is the single most important table for us.** SILVERWARE sits between Simulation and Strategy. **Strategy has the worst D1 of any genre on the list (25.4%) and yet its D30 (3.12%) beats Simulation, Action, Shooting and Hyper-casual.**

That shape — bad D1, resilient D30 — is the signature of a genre whose *front door is broken and whose living room is excellent*. Strategy games lose a quarter more players on day one than match-3 games do, then retain the survivors better than almost anyone. The D1→D7 decay for Strategy is the shallowest on the table (25.39 → 8.06 = ×0.32; Match is 32.65 → 13.98 = ×0.43, better, but hyper-casual is ×0.20).

**The strategic conclusion for SILVERWARE:** our genre's retention problem is overwhelmingly a *first-session* problem, not a long-term-engagement problem. The interface work with the highest expected value is concentrated in the first 60 seconds and the app store page — not in the depth of the mid-game. This is the thesis the rest of the document supports.

### 1.3 Realistic targets

| Metric | Genre par | Target ("we did the UI work") | Stretch (top decile) |
|---|---|---|---|
| Store CVR (page view → install) | ~8.5% all-category US avg; 10–12% for most game categories | 12% | 15%+ |
| First-session completion (reach first match result) | unknown industry-wide; instrument it | 70% | 85% |
| D1 | 25–30% | 35% | 40% |
| D7 | 8% | 12% | 15% |
| D30 | 3% | 6% | 10% |
| Sessions/day | 4 | 5.5 | 9+ |

---

## 2. The first session

### 2.1 The core finding: first-session length predicts D1, and the threshold is around 9 minutes

deltaDNA analysed **275 comparable games** over Oct 2015 – Feb 2016 (drawn from a platform covering 5,000+ games). **Grade B**

- Mean first-session time across all games: **9 minutes.**
- Games with first sessions **longer than 9 minutes averaged 31% D1 retention.**
- Games with first sessions **shorter than 9 minutes averaged 20% D1 retention.**
- **20% of installs are lost within 2 minutes of first launch.**
- The typical return rate for a *second* attempt at the first session is around **50%**.
- 90% of games have a median first session under 20 minutes.

**Caveats that matter.** This is 2016 data and it is correlational — a game with a 12-minute first session is probably a better game in a dozen ways. The honest reading is not "pad your first session to 10 minutes" (that would be actively harmful); it is **"a first session that a player cannot stay inside for ~10 minutes is a first session with nothing in it."** The failure mode the data captures is *emptiness and friction*, not brevity per se.

**The 2-minute number is the actionable one.** One player in five is gone before the 120-second mark. Whatever happens in those two minutes *is* your retention strategy. If your tutorial is still running at 2:00, you have spent your entire budget of player patience on instruction rather than on the thing they downloaded the game for.

### 2.2 Time-to-first-meaningful-action

There is no rigorous published benchmark for time-to-first-meaningful-action in mobile games. What exists:

- "Get players into core gameplay within a minute"; "if the aha moment takes more than 90 seconds, a significant share of users never return." **Grade D** — repeated widely, no traceable primary study.
- "Optimised onboarding lifts retention by up to 50%"; "personalised onboarding gives a 52% D30 lift." **Grade D** — no primary source; both figures circulate unattributed.
- "Mid-core strategy games introducing 8–10 mechanics in the first session see 35–45% tutorial completion vs 80%+ for one-mechanic-at-a-time." **Grade D** — plausible, directionally consistent with everything else, but I could not trace it to a primary dataset. **Do not put this in a deck.**

**What you can defend instead:** the 2-minute/20% churn figure (Grade B), Nielsen's 10-second attention limit (Grade A, below), and your own instrumented funnel. Set the internal target from first principles: *if 20% of players are gone by 120 seconds, the first genuinely enjoyable moment must happen well inside that window.* We specify 60 seconds in Section 10 and treat it as a design constraint, not a claimed benchmark.

### 2.3 Forced tutorials vs contextual learning

The academic literature (Heliyon 2022, in-game tutorial study) and the practitioner literature agree on direction but the effect sizes are not well established. What is solidly supported:

- **Progressive disclosure** as a pattern dates to Nielsen (1995) and is one of the most durable ideas in interaction design: defer advanced features to secondary UI, keep the primary UI to essentials. **Grade A as a design principle** — decades of usability evidence that novices learn faster and make fewer errors.
- A specific quantified claim, "interfaces deferring advanced features achieved 30–50% faster initial task completion in a 2006 NN/g study," circulates online. **I could not verify this study exists.** **Grade D — do not cite it.**
- The known cost of progressive disclosure: **it slows down experts.** Power users scan many controls at once; collapsing frequently-used controls behind a tap penalises them. This is the exact trap Football Manager fell into on its touch interface (Section 8).

**The defensible position:** teach one mechanic at a time, in context, at the moment it is needed, and never gate the fun behind instruction. Not because a study proved "contextual beats forced" with an effect size, but because every adjacent evidence stream — reading behaviour, comprehension on small screens, response-time limits, early churn timing — points the same way, and because forced tutorials spend the scarcest resource (the first 120 seconds) on the least valuable activity (reading).

### 2.4 Login walls

NN/g's work on login walls is qualitative but unambiguous: they stop users in their tracks, and the cost is highest when imposed *before* the user has experienced any value. E-commerce comparison point: Baymard finds ~24% of checkout abandoners cite "the site wanted me to create an account." **Grade A/B for the principle, no game-specific number.**

**Ruling for SILVERWARE: no account, no login, no email, no permission prompt before the first match result.** Guest-by-default. Offer account creation *after* the first win, framed as "save your career," which converts the request from a tax into a benefit.

---

## 3. The app store conversion surface

This is the highest-leverage pure-UI work available, because it multiplies everything downstream and costs a few days of design.

### 3.1 What the funnel looks like

- US App Store average conversion rate (page view → install), 2025: **8.56%**. Game categories (Action, Adventure, Arcade, Card) sit around **10–12%**; Board games 18.6%; Casino 7.6%. **Grade B** (Apptweak)
- StoreMaven, sampling **500M+ users**: most visitors spend **3–6 seconds** on the "first impression" — what is visible above the fold — before dropping, installing, or scrolling. Visitors split into **decisive** (decide from the first impression alone) and **exploring** (scroll the gallery). **Grade B**
- Because 100% of visitors see the first-impression assets and only a minority scroll, **the icon, the title, and the first two screenshots carry nearly all the conversion weight.**

### 3.2 Measured lifts

| Change | Reported lift | Grade | Note |
|---|---|---|---|
| Apple Custom Product Pages, referred traffic | **1.6% → 4.1% CVR (+2.5pp, +156%)** | B | Apple's own published figure. Applies to *referred* traffic to a matched page, not to all traffic. |
| CPPs in Apple Ads (1M+ ad groups) | tap-through 9.72% → 10.90%; tap-to-install 63.91% → 70.05% | B | Apple data. |
| Games using CPPs vs not | up to **+8.6%** CVR; only 26% of games use them | B | The cheapest structural win on this list. |
| Icon A/B test (Hobnob) | **+64%** | C | Vendor case study. |
| iOS screenshot A/B test (OLBG) | **+61%** | C | Vendor case study. |
| Screenshot optimisation (StoreMaven, general) | up to **+28%** | C | |
| Screenshot A/B test (Prisma) | **+19.7%** | C | |
| Screenshot A/B test (ŠKODA) | **+15%** | C | |
| Adding a video preview | **inconsistent — sometimes negative** | C | SplitMetrics explicitly reports video losing for some apps. Test it; do not assume it. |

**The vendor-case-study caveat is important.** Grade C numbers are real tests but they are the *published* ones. Nobody blogs their flat results. Treat +60% as the ceiling of what a bad-to-good icon change can do, not the expectation. A realistic planning assumption for a competent redesign of icon + first two screenshots is **+15–25% relative CVR**, with a fat tail in both directions.

### 3.3 The first three lines of the description

There is no credible published experiment isolating description text on install conversion for games, and there is a structural reason: on iOS the description is below the fold and behind a "more" tap, and Apple does not index it for search. The **subtitle** (iOS) and **short description** (Google Play) are the text that actually converts, because they sit in the first impression.

**Grade: no reliable evidence for long descriptions.** Treat the description as SEO surface on Google Play (indexed) and as reassurance-for-explorers on iOS. Spend the effort on the subtitle and screenshot captions instead.

### 3.4 Practical spec

1. **Ship Custom Product Pages.** Up to 70 are allowed (raised from 35 in Oct 2025) and since Jul 2025 they can serve organic search results with assigned keywords. This is a documented +8.6% for games and a documented +156% on referred traffic, and three-quarters of games are leaving it on the table.
2. **Icon:** must read at 60×60px, must be distinguishable from every other football game's crest-on-green. Test at least three genuinely different concepts, not three tints of one.
3. **First two screenshots:** carry the entire proposition. Portrait, one idea each, caption in ≤5 words at a size legible in the gallery thumbnail. Show *the fantasy* (you, the manager, on the touchline; the trophy) — not a table of numbers. See Section 8.
4. **Video:** test it, expect it might lose, and never rely on it — it does not autoplay for everyone and does not appear in every placement.
5. **Ratings are a conversion surface too.** Prompt for review only after a first trophy or a milestone win, never after a defeat.

---

## 4. Retention mechanics that live in the interface

These are structural, not monetisation hooks. Ranked by evidence quality.

### 4.1 Progress visibility and endowed progress — **Grade A, the strongest evidence in this document**

**Nunes & Drèze (2006), *Journal of Consumer Research*, the car-wash field experiment.** Two loyalty cards were given to real car-wash customers:
- Card A: 8 stamps needed, empty.
- Card B: 10 stamps needed, **2 already stamped as a gift.**

Both require exactly 8 purchases. After nine months: **34% completed Card B vs 19% who completed Card A.** A 79% relative increase in completion from a purely presentational change with zero difference in the underlying economics.

**Kivetz, Urminsky & Zheng (2006), *Journal of Marketing Research*** established the goal-gradient effect in real reward programmes: effort accelerates as the visible goal approaches.

**What this means for SILVERWARE, concretely:**
- Never show a player a 0% progress bar. The season, the trophy cabinet, the coaching badge track, the squad-building objective — all should start visibly non-zero on first launch. "You've inherited a club 3 games into the season" is worth more than a lecture about how the season works.
- Every screen with an ongoing objective should show progress *toward the next reward*, not progress *since the start*.
- Distance-to-goal is the display variable that matters. "2 wins from promotion" outperforms "14 wins so far."

This is the single best-evidenced, cheapest, most transferable finding available, and it is entirely a UI decision.

### 4.2 The clear next action / continue button — **Grade B (inferred), high confidence**

There is no single study proving "a prominent continue button raises D1." But the supporting chain is strong: choice overload research (§5), Hick's law, NN/g's work on scent-of-information, and the deltaDNA finding that a fifth of players leave inside two minutes. A player who does not know what to do next is a player deciding whether to keep playing.

**Ruling:** exactly one primary CTA visible at all times, in the thumb zone, phrased as a verb + object ("Play Saturday's match", not "Continue"). Every screen answers "what now?" without the player having to look for it.

### 4.3 Session-end hooks ("one more match") — **Grade C/D**

The Zeigarnik effect (unfinished tasks are remembered better) is routinely invoked for cliffhanger session endings. Its replication record in modern psychology is weak, and I found no game-industry experiment isolating a session-end hook's effect on next-day return.

**What *is* evidenced:** mid-core games run 6–7 sessions/day (GameAnalytics, Grade B), which means the return trigger is doing heavy lifting somewhere. And Kao et al. (CHI 2024, Grade A, §6) found **curiosity was the strongest predictor of enjoyment and the *only* predictor of free-choice playtime.** That is the closest thing to hard evidence for the "leave them wanting to know what happens next" design: uncertainty about the outcome, not amplified feedback, is what kept people voluntarily playing.

**Ruling:** end sessions on an *unresolved question* with a known resolution time ("your scout reports back after Saturday"), not on a spinner or a paywall. Label it as a reasoned bet, not a proven mechanic.

### 4.4 Notifications — **Grade B, with a large correlational asterisk**

- iOS opt-in rate is now **~54%** (up after Apple's revised prompts in iOS 18.2); Android **~97%**. Historically iOS median was ~51%, Android ~81%. (Airship) **Grade B**
- "Retention is ~3× higher for users who received ≥1 push in their first 90 days vs zero." (Airship) **Grade B for the correlation, Grade D as a causal claim** — users who opt in are already more engaged. Do not present this as "push triples retention."
- **The frequency finding is the useful one, and it points the other way:** a 2026 Leanplum/AppFollow study found users receiving **more than 6 pushes per week from one brand were 3.4× more likely to uninstall within 30 days** than users receiving 1–2. **Grade B**
- Rich media push: **+22%** direct open rate. Personalised/tailored messages: **+37%** open rate. **Grade B/C**

**Ruling:**
- Never fire the iOS permission prompt on first launch. Ask after the first match result, pre-framed by an in-game explanation of what notifications will be used for ("we'll tell you when your match kicks off"). This is the standard soft-prompt pattern and it is why opt-in rates vary from 29% to 73% between apps.
- Hard cap at **4 per week.** The uninstall cliff is above 6.
- Every notification must be **game-state news** ("Hargreaves is fit for Saturday"), never marketing. A notification that is a fact about the player's own club is a reason to open. A notification that is an offer is a reason to uninstall.

### 4.5 Perceived responsiveness — see §6.

---

## 5. Cognitive load and drop-off

### 5.1 Reading burden — **Grade A, and the most damning section for a text-heavy game**

Nielsen Norman Group's eyetracking research:

- **On an average page visit, users have time to read at most 28% of the words. 20% is more likely.** **Grade A**
- **79% of users scan any new page; only 16% read word-by-word.** **Grade A**
- **Comprehension on a phone-sized screen scores 48% of the desktop level on Cloze tests — it is roughly twice as hard to understand complex content on a small screen.** **Grade A**

Read the last one again in the context of a football management game. Football management is *the* genre of dense information: attribute tables, scout reports, tactical instruction lists, financial summaries. We are asking players to do the hardest possible comprehension task on the worst possible display, in the two minutes when a fifth of them are already leaving.

**Direct consequences:**
- Assume any body text longer than ~15 words is *not read*. Design so the screen still works if it isn't.
- Every number that matters must also be encoded non-textually — colour, length, position, icon. A player who reads 20% of your words will still read 100% of your bar lengths.
- Tutorial copy is the worst offender: it is long, it is mandatory, it arrives before any motivation exists, and it is on a phone.

### 5.2 Choice overload — **Grade C, and the folklore here is worse than the science**

This is where most design decks get it wrong, so it is worth being precise.

- **Hick's Law** (decision time rises logarithmically with the number of choices) is genuine and robust — but note *logarithmically*. Going from 2 to 4 options costs about as much as going from 4 to 8. The penalty for adding options decelerates. **Grade A for the law; frequently over-applied.**
- **The famous jam study** (Iyengar & Lepper, 2000): a supermarket tasting booth with 24 jams attracted more passers-by than one with 6, but produced roughly **a tenth of the purchases** (commonly cited as ~3% vs ~30%). This is the study everyone quotes.
- **The meta-analysis nobody quotes:** Scheibehenne, Greifeneder & Todd (2010), *Journal of Consumer Research* — **63 conditions, 50 studies, 5,036 participants. Mean choice-overload effect ≈ d = 0.02. Statistically indistinguishable from zero.**
- **Chernev, Böckenholt & Goodman (2015)** re-analysed and found the effect is real *under specific moderators*: high choice-set complexity, no clear preferences, difficult trade-offs, time pressure, and no dominant option.

**The honest synthesis, and it is genuinely useful:** "fewer options is always better" is folklore. **Choice overload is real specifically when the user has no basis for preferring one option over another and the trade-offs are hard to evaluate.** That describes a new SILVERWARE player looking at 11 players with 20 attributes each *exactly*. It does not describe an experienced player picking a formation.

**So the rule is not "reduce options." It is "never present a choice the player has no basis to make."** Either give them the basis (a recommendation, a comparison, a visible consequence, a default) or defer the choice until they have it. A screen with 8 options and a clearly-marked recommended pick is easier than a screen with 3 options and no way to tell them apart.

**Practical numbers, offered as design heuristics rather than findings:**
- First-session decision screens: **≤3 options**, all visibly different, one recommended.
- Any decision in the first 5 minutes: must show its consequence before commitment.
- Beyond the first session: option count is not the constraint — *evaluability* is. Add a "recommended" flag and a sort-by-what-matters default before you consider cutting options.

### 5.3 Where users abandon

Combining the sources: **20% of installs gone within 2 minutes** (deltaDNA, Grade B); **10 seconds is the limit of held attention** for an unresponsive system (Nielsen, Grade A); **3–6 seconds** on the store page first impression (StoreMaven, Grade B).

Three cliffs: 6 seconds on the store page, 10 seconds of any unexplained wait, 120 seconds in the first session. Everything in Section 10 is built around those three numbers.

---

## 6. Visual feedback and perceived quality

### 6.1 Response-time limits — **Grade A, the oldest and most reliable finding in the field**

Nielsen's three limits, unchanged since 1993 because they are properties of human cognition, not of technology:

| Limit | Effect |
|---|---|
| **0.1 s** | Feels instantaneous. The user perceives *themselves* as the cause of the outcome. Required for the feeling of direct manipulation. |
| **1.0 s** | The flow of thought stays unbroken. The user notices a delay but stays in control. |
| **10 s** | The outer limit of held attention. Beyond it, users switch to thinking about other things and it is hard to get them back. |

Anything over 10 seconds needs a percent-done indicator and an obvious way to interrupt.

**This is the specification for every tap in SILVERWARE.** Tap feedback under 100ms, non-negotiable. Screen transitions under 1 second. Match simulation must never present an unexplained wait over 10 seconds without progress.

### 6.2 The cost of slowness — **Grade B, from an adjacent domain**

Deloitte Digital's *Milliseconds Make Millions*: mobile site data from **37 retail, travel, luxury and lead-gen brands** across Europe and the US over 4 weeks. A **0.1 second** improvement in load time produced:

- Retail: **conversions +8.4%**, average order value **+9.2%**
- Travel: **conversions +10.1%**
- Luxury: **page views per session +8.6%**
- Lead gen: bounce rate improved **8.3%**

**Caveat: this is mobile web commerce, not games, and it is observational.** Do not claim "0.1s = +8% D1." What it establishes rigorously is that **at the 100ms scale, speed changes behaviour measurably in every vertical tested** — the sensitivity is far higher than intuition suggests. There is no reason to believe game UI is exempt, and the general claims about jank hurting game conversion (e.g. "users who experienced jank during onboarding converted 40% lower") are **Grade D** — plausible, untraceable.

### 6.3 Juice and game feel — **Grade A, and the finding is not what you expect**

This is the most valuable evidence in the document because it contradicts the received wisdom.

**Hicks et al., "Juicy Game Design: Understanding the Impact of Visual Embellishments on Player Experience" (CHI PLAY 2019).** Two experiments: N=40 across two research games (a Frogger clone and an FPS), then N=32 using Quake 3 Arena.

Findings: **a positive effect of visual juiciness on aesthetic appeal; no effect on usability; no effect on performance; effects on curiosity, competence and immersion in only one of the games.** The authors' conclusion: the effects of juiciness are nuanced and highly dependent on implementation and context.

**Kao et al., "How does Juicy Game Feedback Motivate? Testing Curiosity, Competence, and Effectance" (CHI 2024).** A **pre-registered online experiment with N = 1,699 participants**, a purpose-built action RPG, 2×2+control design varying feedback **amplification**, **success-dependence**, and **variability**. Measured self-reported effectance, competence, curiosity and enjoyment, plus **free-choice playtime** (a behavioural measure, not a survey answer).

Results:
- **Curiosity was the strongest predictor of enjoyment and the only predictor of playtime.**
- **Success-dependent feedback enhanced all three motives.** Feedback that *tells you whether and how well you succeeded* is what works.
- **Amplification — simply making the feedback bigger, louder, shakier — unexpectedly *reduced* all three motives.** The authors suggest it impeded the player's sense of agency.

**The synthesis, and it should be the studio's line on juice:**

> **Juice does not mean "more effects." It means the interface makes the link between the player's action and its outcome legible and graded.** Feedback proportional to how well you did is motivating. Feedback that is merely loud is demotivating. Screen shake and particles buy aesthetic appeal — which is real and worth having — but they do not buy engagement, and over-applied they cost it.

For a management game this is liberating. We cannot out-particle a match-3. We do not need to. What we need is for **every decision to produce a visible, proportional, immediate consequence** — the tactic you changed visibly altering the next passage of play, the player you signed visibly changing a team-strength bar, the substitution visibly shifting momentum. That is the evidenced form of juice, and it is squarely in our reach.

### 6.4 Animation duration — **Grade A/B**

- ~**100ms** is perceived as instant. The Model Human Processor puts average visual perception at ~230ms.
- Standard UI transitions: **200–300ms**, ease-out.
- **Over ~500ms feels sluggish on a phone.** Under ~80ms is imperceptible and reads as broken/janky.
- Small elements go to the short end; large or full-screen transitions to the long end.

**Spec: 100ms for tap feedback, 200–300ms for view transitions, 400–500ms maximum for anything full-screen, and skippable for anything longer.** Every celebration animation must be interruptible by a tap — a player on their 40th match does not want your 3-second trophy flourish.

### 6.5 Perceived performance: skeletons, not spinners — **Grade B**

- Published research (the effect of skeleton screens on perceived speed and ease of navigation) found pages using skeleton screens scored higher on **both perceived speed and ease of navigation** than spinner-based pages.
- NN/g's position: skeleton screens are about as effective as progress bars for standard content loads; the choice is about *what* you communicate. **Progress bars** when the user needs to know *how long*; **skeleton screens** when the user needs to know *what is coming*.
- The widely repeated "progress indicators reduce abandonment by up to 30%" is **Grade D** — untraceable.

**Ruling:** no spinners anywhere in SILVERWARE. Match loading shows the fixture card materialising. Squad screens show the roster skeleton. The player should always be able to see the shape of what is arriving.

---

## 7. Onboarding depth for complex games

### 7.1 The structural problem

A management sim has to teach: a squad, an attribute system, a tactical system, a fixture calendar, a transfer economy, a training loop, and a progression meta. That is 7+ systems. Every piece of evidence in Sections 2 and 5 says you cannot teach 7 systems on a phone in 120 seconds and you should not try.

### 7.2 The pattern that works: one loop, then widen

Progressive disclosure (Nielsen, 1995) is the governing principle: primary UI carries essentials, everything else is one tap away. **Grade A as principle.** The genre-specific application, consistently observable across successful complex mobile games (Grade C — pattern observation, not experiment):

1. **Session 1 teaches exactly one loop, end to end**, and that loop must contain the win. For us: *look at team → make one decision → watch the consequence → get a result.* Nothing else exists yet.
2. **Systems unlock on a schedule tied to progress, not time.** Transfers appear when the player needs a player. Training appears when someone is out of form. Finances appear when there is money to spend. The game reveals a system at the moment the player has a *problem it solves* — which converts a tutorial into an answer.
3. **Teach in the doing, not before it.** A contextual prompt attached to the control it describes, dismissed by using the control. No modal that must be read before the screen is usable.
4. **Never gate the fun.** The match must be reachable without completing anything.
5. **Defaults are the real tutorial.** Every system should ship with a working default so the player can ignore it indefinitely and still succeed. A player who never opens the tactics screen should still win games. The tactics screen then becomes an *opportunity* rather than an *obligation* — which is the difference between depth and homework.

### 7.3 The expert-cost warning

Progressive disclosure penalises power users: they scan many controls at once, and burying frequently-used controls behind taps slows them down. **Football Manager 26 is the live case study** — reviewers describe the touch-first interface as "floundering in an interface labyrinth," with the compact overview screen replaced by tabbed pop-ups that provide "less information per glance and require more searches." (Grade C — critical reception, not measured retention.)

**The resolution is not to pick a side. It is to make disclosure state persist.** A player who has opened the detailed attribute view keeps it. Depth revealed once stays revealed. Novices get the simple surface, returning experts do not get re-simplified. This is a data-model decision as much as a UI one, and it needs to be designed in now, not retrofitted.

---

## 8. Our specific failure mode: text-heavy, list-heavy, table-driven

This section is the reason the document exists.

### 8.1 Why the genre defaults to tables, and why that is fatal on a phone

Football management is data. The desktop tradition (Championship Manager → Football Manager) evolved on a large monitor with a mouse, where a 20-column sortable table is genuinely the best interface. Every one of those affordances is absent on a phone:

| Desktop affordance | Phone reality |
|---|---|
| 20 columns visible at once | 3–4 columns before the text is unreadable |
| Hover for detail | No hover |
| Precise mouse targeting | 44pt minimum touch target |
| Comfortable reading of dense text | **Comprehension at 48% of desktop level** (NN/g, Grade A) |
| User is seated, focused, committed | User is on a bus, 20% will leave inside 2 minutes |

Porting the table is not a compromise, it is a category error. The information a table conveys — *comparison* — must be conveyed by a form the phone is good at.

### 8.2 What the evidence says to do instead

The chain is: users read ≤20–28% of words (Grade A) → comprehension halves on small screens (Grade A) → choice overload bites precisely when options are hard to evaluate (Grade C, with moderators) → therefore **the job of our UI is not to display data, it is to make comparison pre-attentive.**

Concrete translations:

| Instead of | Use | Why |
|---|---|---|
| A column of numbers 1–20 | Bar length, arc, or radial | Length is judged pre-attentively; digits must be read |
| "Pace 16, Passing 11, Tackling 14" | A shape (radar/silhouette) the player learns to recognise | One glance replaces three reads |
| A sortable 15-column squad table | A pitch view with players positioned, sized or coloured by fitness/form | Uses spatial memory the player already has from watching football |
| "Morale: Poor" text | A face, a colour, a slumped posture | Encodes without reading |
| A scout report paragraph | One verdict line + one comparison ("better than Doyle, worse than Reid") | Comparison is what the paragraph was for |
| A financial statement | One runway number + trend arrow, detail behind a tap | Progressive disclosure |
| A league table (20 rows) | The 5 rows around you, with distance-to-goal emphasised | Goal-gradient (Grade A): distance-to-goal is the motivating variable |

Two of these deserve emphasis because they are backed rather than merely sensible:

- **Distance-to-goal framing over absolute standings** is a direct application of Nunes & Drèze / Kivetz (Grade A). "3 points from the play-offs" is a motivational display; "9th place, 41 points" is a report.
- **Every number that matters gets a non-textual encoding.** This follows directly from the reading and comprehension findings (Grade A) and it is the highest-confidence structural recommendation in this document.

### 8.3 Games that solved data-heavy football on a phone

**Grade C throughout — commercial outcomes and design analysis, not controlled experiments. Presented as existence proofs, not causal evidence.**

- **Retro Bowl / Retro Goal (New Star Games).** Retro Bowl has passed **40M+ downloads** and hit **#1 on the US App Store**; the Poki web version drew close to a million upvotes. The design move is exact: keep the management *fantasy* (you are the coach and GM, you build a roster across seasons) and delete the management *interface*. Rosters are short, attributes are few, the numbers are large and legible, and every session ends in a playable, visual, 2-minute match. It demonstrates that the audience wants the **fantasy of authority**, not the spreadsheet.
- **New Star Soccer** established the same pattern a decade earlier: a career sim whose interface is almost entirely icons, bars and one-tap decisions.
- **Top Eleven** is the closest structural comparison to SILVERWARE — a genuine football management sim, mobile-first since 2015, with a deliberate UI modernisation programme (visual style developed with an external studio) and retention mechanics embedded in each game loop: a cyclically refreshing transfer market, sponsorship deals requiring daily logins, and a club-building layer. It shows that a *real* management sim can sustain mobile retention — but note the mechanisms it leans on are all interface-level structural hooks, not depth of simulation.
- **Football Manager Mobile / Touch** is the counter-example. Sports Interactive's own touch interface is criticised for delivering *less information per glance* while requiring *more navigation* — the worst of both worlds: simplified for novices in a way that still fails them, and slowed down for experts. The lesson is that **simplification that only removes information is not simplification; simplification is re-encoding information into a form that is faster to read.**

### 8.4 The design principle to adopt

> **SILVERWARE's interface should be readable at a glance by someone who has never played a management game, and denser-per-glance than Football Manager for someone who has played 400 hours of one.**

Those are compatible goals only through encoding, not through hiding. A radar shape is instantly gestalt-readable by a novice *and* carries more comparative information per glance than a row of digits does for an expert. Get the encoding right and the novice/expert trade-off largely dissolves.

---

## 9. UI factors ranked by evidence strength × impact

Impact is scored against *our* funnel (install conversion → first-session completion → D1 → D7/D30), given that our genre's weakness is specifically the front door.

| # | UI factor | What the evidence actually shows | Evidence | Expected impact | Build cost |
|---|---|---|---|---|---|
| 1 | **Store icon + first two screenshots** | 3–6s decision window, 100% of visitors exposed; measured lifts +15% to +64% in published tests; category CVR 10–12% | B (behaviour) / C (lifts) | **Very high** — multiplies every downstream number | Low |
| 2 | **Custom Product Pages** | Apple: 1.6%→4.1% CVR on referred traffic (+156%); +8.6% for games; only 26% of games use them | B | **Very high** | Low |
| 3 | **Time-to-first-fun < 120s** | 20% of installs lost within 2 min of first launch; games with >9-min first sessions average 31% D1 vs 20% | B | **Very high** | Medium |
| 4 | **No login/permission wall before first value** | Login walls stop users cold; ~24% of e-commerce abandoners cite forced account creation | A (principle) / B | **High** | Low |
| 5 | **Endowed progress — never show 0%** | Car-wash field experiment: 34% vs 19% completion from presentation alone | **A** | **High** | Low |
| 6 | **Response time: 100ms tap, <1s transition, <10s any wait** | Nielsen's three limits; 0.1s Deloitte lift of +8–10% conversion in adjacent verticals | **A** / B | **High** | Medium–High |
| 7 | **Non-textual encoding of every number that matters** | Users read ≤20–28% of words; phone comprehension is 48% of desktop | **A** | **High** (our specific failure mode) | Medium |
| 8 | **Success-dependent, proportional feedback ("real juice")** | CHI 2024, N=1,699 pre-registered: success-dependence raised all motives; **amplification lowered them**; curiosity was the only playtime predictor | **A** | **High** | Medium |
| 9 | **One primary action per screen, always visible** | Inferred from Hick's law + early-churn timing; no direct game experiment | B (inferred) | **High** | Low |
| 10 | **Progressive disclosure with persistent state** | Nielsen 1995, decades of usability evidence; expert-slowdown cost is documented (FM26 reception) | A (principle) / C (cost) | **Medium–High** | Medium |
| 11 | **Skeleton screens instead of spinners** | Higher perceived speed *and* ease of navigation vs spinners; NN/g: ≈ progress bars for standard loads | B | **Medium** | Low |
| 12 | **Push: soft-prompt after first win, ≤4/week, game-state only** | Opt-in 54% iOS / 97% Android; >6/week → 3.4× uninstall risk; the "3× retention" figure is correlational | B | **Medium** | Low |
| 13 | **Animation 200–300ms, everything skippable** | 100ms = instant; >500ms sluggish; <80ms imperceptible | A/B | **Medium** | Low |
| 14 | **Distance-to-goal framing over absolute standings** | Goal-gradient effect (Kivetz 2006) + endowed progress | **A** | **Medium** | Low |
| 15 | **Evaluability aids (recommended option, visible consequence) over cutting options** | Choice overload meta-analysis: overall d ≈ 0.02; effect appears only under moderators — hard evaluability being the main one | C (nuanced) | **Medium** | Medium |
| 16 | **Session-end open loop ("one more match")** | Zeigarnik is weakly replicated; but curiosity was the only predictor of free-choice playtime (CHI 2024) | C/D | **Medium, speculative** | Low |
| 17 | **App preview video** | Explicitly inconsistent — loses for some apps in vendor tests | C | **Unknown — must be tested** | High |
| 18 | **Long store description** | No credible isolating experiment; below the fold on iOS, not indexed by Apple | — | **Low** | Low |
| 19 | **Screen shake / particle amplification** | Raises aesthetic appeal; **no effect on usability or performance; reduced motivation when amplified** | **A** | **Low / possibly negative** | Medium |
| 20 | **Theme/dark-mode, icon polish beyond legibility, custom fonts** | No retention evidence in any source reviewed | D | **Decoration** | Varies |

**The one-line summary of the table:** everything above line 9 is worth doing before anything below it, and items 19–20 are where studios habitually spend their UI budget.

---

## 10. The first 60 seconds — specification

Derived from: the 3–6s store decision window (StoreMaven, B); the 2-minute/20% churn cliff (deltaDNA, B); Nielsen's 0.1/1/10s limits (A); ≤20–28% reading and 48% mobile comprehension (A); endowed progress (A); success-dependent feedback (A).

**The governing constraint: the player must have made a decision that visibly changed a football match, and seen a result, before the 60-second mark — without having created an account, granted a permission, or read more than 60 words in total.**

### T+0.0s to T+2.0s — Cold start
- App is **interactive within 2 seconds** on our minimum-spec device. This is a hard gate, treated like a crash bug.
- No splash video. Logo appears for a maximum of **1.5s** and is skippable by tap from frame one.
- If anything must load, **skeleton, never spinner** — the player sees the shape of the club screen assembling.
- **No permission prompts. No login. No age gate beyond what is legally required. No "rate us." No consent interstitial.**

### T+2s to T+12s — Identity, in one screen
- One screen: **"Which club?"**
- **Between 4 and 6 options**, presented as crests/kits, not a list of names. Visual, tappable, thumb-zone.
- Each option carries **one line of ≤6 words** stating the challenge ("Relegation favourites. Prove them wrong.") — this is the only text on the screen.
- A **recommended** option is flagged. (Evaluability, §5.2 — a new player has no basis for preferring one club over another, which is precisely the condition under which choice overload is real.)
- Tapping a crest commits immediately. **No confirm dialog.**
- Budget: **1 tap.**

### T+12s to T+25s — The world, already in motion
- The player lands on their club. **Nothing is at zero.**
  - The season is **already 3 matches old.** They have inherited a position, a form line, a squad.
  - The trophy cabinet has a shape with empty slots.
  - The progression bar toward the first milestone is **visibly non-zero.**
- This is the endowed-progress finding (Grade A, 34% vs 19%) applied literally. A player handed a live situation is a player already invested; a player handed an empty save file is a player being asked to start work.
- The squad is shown as **a pitch with players on it**, not a table. Form and fitness are colour, not digits.
- **One primary CTA, thumb-zone, verb + object: "Pick your team for Saturday."**
- Budget: **0 mandatory taps** (the player may look around; nothing punishes them for not doing so).

### T+25s to T+45s — The first real decision
- **Exactly one decision, exactly three options.** Example: your star striker is carrying a knock — *start him / bench him / start him and play safe*.
- Each option shows its **consequence before commitment** — a visible shift in an attack/defence/risk bar, animated in 200–300ms as the player's finger hovers or on tap-preview.
- Total instructional text on this screen: **≤20 words.**
- **No tutorial modal. No hand pointer. No "tap here."** The screen has one interactive region and one CTA; there is nothing to explain.
- Budget: **1–2 taps.**

### T+45s to T+60s — The match, and the payoff
- Match begins **within 1 second** of confirming. No loading screen.
- The first match presentation is **short (a highlights-only key-moments format), visual, and unskippable-but-brief** — under 45 seconds of real time for the first one.
- **The decision the player just made visibly matters.** If they started the striker, he is in the highlight. This is the success-dependent feedback that Kao et al. (N=1,699, Grade A) found raises all three motivational pathways — as opposed to amplification, which lowered them. Legibility of cause and effect, not spectacle.
- The result screen shows: the score, **one line** on why it happened, and progress on the season bar visibly advancing.
- **One CTA: the next fixture.** The open loop for session 2 is set here.
- Budget: **1 tap.**

### Cumulative budget for the first 60 seconds

| Constraint | Limit | Source |
|---|---|---|
| Taps to first match result | **≤ 5** (hard cap 12 including optional exploration) | Design constraint from the 120s cliff |
| Total read-required words | **≤ 60** | ≤20–28% reading rate; 48% mobile comprehension (A) |
| Words on any single screen | **≤ 20** | as above |
| Modal dialogs | **0** | — |
| Permission prompts | **0** | Login-wall evidence (A/B) |
| Screens before a football decision | **≤ 2** | — |
| Any unexplained wait | **0 over 10s; target <1s** | Nielsen (A) |
| Tap→visual feedback | **<100ms** | Nielsen (A) |
| Progress bars starting at zero | **0** | Endowed progress (A) |

### What happens after 60 seconds
- Minutes 1–10 continue the same loop, **widening by one system per cycle** and only when the player has a problem that system solves.
- Target: a player *can* comfortably stay engaged for **9–12 minutes** in session 1 without ever being required to. The deltaDNA finding is about there being enough there, not about detaining anyone.
- Account creation offered **once**, after the first win, framed as "save your career."
- Push permission requested **once**, after the account offer, pre-framed in-game ("we'll tell you when you're playing").

---

## 11. Measurement plan

You cannot tell whether a UI change worked from D1 alone — it is slow, noisy, and confounded by every UA change. Instrument the funnel so that each step is independently readable, then use D1 as the confirming metric rather than the steering metric.

### 11.1 The funnel

```
STORE                    impression → page_view → install
  ↓
COLD START               install → app_open_first → app_interactive
  ↓
FTUE                     ftue_start → club_selected → squad_viewed
                         → first_decision_shown → first_decision_made
                         → first_match_started → first_match_completed
                         → first_result_seen
  ↓
SESSION 1 DEPTH          second_match_started → system_unlocked(n)
                         → session_1_end
  ↓
RETURN                   d1_return → d7_return → d30_return
```

### 11.2 Events to instrument

Every event carries: `session_id`, `install_id`, `platform`, `device_tier`, `app_version`, `experiment_arm`, `seconds_since_install`, `seconds_since_session_start`, `tap_index_in_session`.

**Store / acquisition (from App Store Connect + Google Play Console + MMP)**
| Event | Key properties |
|---|---|
| `store_page_view` | source (search / browse / ad / referral), CPP variant |
| `install` | source, CPP variant |

**Cold start**
| Event | Key properties |
|---|---|
| `app_open` | is_first_open, cold_or_warm |
| `app_interactive` | **`ms_to_interactive`** ← the gate metric for the 2s spec |
| `first_frame_rendered` | ms |

**FTUE — the critical section**
| Event | Key properties |
|---|---|
| `ftue_start` | |
| `club_select_shown` | option_count |
| `club_selected` | club_id, was_recommended, **`ms_on_screen`**, taps_before_selection |
| `squad_first_viewed` | ms_on_screen, scroll_depth |
| `first_decision_shown` | decision_id, option_count |
| `first_decision_made` | option_chosen, **`ms_to_decide`**, previews_opened |
| `first_match_started` | |
| `first_match_completed` | result, ms_watched, was_skipped |
| `first_result_seen` | |
| `ftue_complete` | **`total_seconds`**, **`total_taps`**, **`words_displayed`** |
| `ftue_abandon` | **`last_step`**, `seconds_since_install` ← *the single most valuable event in the game* |

**Ongoing UI-quality events**
| Event | Key properties |
|---|---|
| `screen_view` | screen_id, ms_on_screen, exit_action |
| `dead_tap` | screen_id, coordinates — taps on non-interactive elements = comprehension failures |
| `rage_tap` | 3+ taps in <1s on the same element = responsiveness failure |
| `back_navigation` | from_screen, to_screen — high rates = wrong information architecture |
| `slow_frame` | screen_id, ms — anything over 33ms (sub-30fps) |
| `slow_transition` | from, to, ms — flag anything >1s (Nielsen limit) |
| `wait_shown` | context, ms, had_progress_indicator — flag anything >10s |
| `system_unlocked` | system_id, seconds_since_install, session_number |
| `tooltip_shown` / `tooltip_dismissed` | id, ms_visible — <1s visible = not read |
| `session_end` | duration, matches_played, ended_on_open_loop (bool) |
| `permission_prompt_shown` / `_result` | type, trigger_context |

**Retention**
`d1_return`, `d3_return`, `d7_return`, `d14_return`, `d30_return`, `sessions_per_day`, `days_since_last_session`.

### 11.3 The five headline metrics

Everything above rolls up to five numbers on one dashboard, split by platform and device tier:

1. **Store CVR** (page view → install)
2. **Time-to-first-result** — median seconds from `app_open` to `first_result_seen`. **Target: ≤60s at p50, ≤120s at p90.**
3. **FTUE completion rate** — `ftue_complete` / `ftue_start`. **Target ≥70%, stretch 85%.**
4. **D1 retention**, segmented by whether FTUE was completed.
5. **Session-1 depth** — median matches played in session 1.

### 11.4 The drop-off report

The report to run every week is a single one: **`ftue_abandon` grouped by `last_step`, with median `seconds_since_install` per step.** deltaDNA's Song of Pan case — losing 20% during the tutorial, fixed by changing tutorial visual direction and reducing menu choices — was found and fixed with exactly this report. It will tell you which screen is killing the game within a week of launch.

### 11.5 Experiment design and sample sizes

Two-sided α = 0.05, 80% power, per arm:

| Test | Baseline | Detectable lift | **N per arm** |
|---|---|---|---|
| D1 retention | 20% | +5pp (→25%) | ~1,100 installs |
| D1 retention | 20% | +3pp (→23%) | ~2,900 installs |
| D1 retention | 20% | +1pp (→21%) | ~25,600 installs |
| FTUE completion | 60% | +5pp (→65%) | ~1,500 installs |
| Store CVR | 10% | +1pp (→11%) | ~14,700 page views |

**Practical implications:**
- **Do not attempt to A/B test D1 for changes worth less than ~3pp** until you have real volume. You will burn weeks proving nothing.
- **Steer on the FTUE funnel instead.** FTUE completion has a higher baseline and shorter feedback loop, so it needs roughly half the sample for the same relative sensitivity and reads in hours rather than days.
- **Ship the Grade-A changes without testing them.** Endowed progress, sub-100ms tap feedback, no login wall, skeleton screens, non-textual encoding — the prior is strong enough and the cost of testing exceeds the cost of doing. Reserve experimentation for the genuinely uncertain: video preview, tutorial structure, first-decision framing, notification cadence.
- **Guardrail metrics on every experiment:** crash-free sessions, `ms_to_interactive` at p90, D7, and store rating trend. A change that lifts D1 and tanks D7 is a change that moved the churn rather than preventing it.
- **Always segment by device tier.** Low-end Android is where responsiveness failures live, and it is where the 6-point iOS/Android D1 gap comes from.

---

## 12. Folklore watch list

Claims encountered repeatedly during this research that have **no traceable primary source**. Recognise them; do not repeat them in decks; do not plan against them.

| Claim | Status |
|---|---|
| "Good onboarding lifts retention by up to 50%" | **D** — untraceable |
| "Personalised onboarding gives a 52% D30 lift" | **D** — untraceable |
| "If the aha moment takes more than 90 seconds, users never return" | **D** — no study, though directionally consistent with the Grade-B 2-minute finding |
| "Mid-core games teaching 8–10 mechanics see 35–45% tutorial completion vs 80%+" | **D** — plausible, unsourced |
| "A 2006 NN/g study found progressive disclosure gave 30–50% faster task completion" | **D** — I could not establish this study exists |
| "Progress indicators reduce abandonment by up to 30%" | **D** — untraceable |
| "Users experiencing jank during onboarding convert 40% lower" | **D** — untraceable |
| "Push notifications triple retention" | **D as causal** — the 3× figure is a real correlation with massive selection bias |
| "Fewer options is always better" | **D** — contradicted by a 50-study, 5,036-participant meta-analysis (d ≈ 0.02). The effect is real only under specific moderators |
| "More juice always improves engagement" | **Contradicted by Grade-A evidence** — amplification *reduced* motivation in a pre-registered N=1,699 experiment |

---

## 13. THE TEN THINGS THAT ACTUALLY MATTER

Ordered by expected impact on SILVERWARE's numbers. Each states the evidence and its grade.

---

### 1. The first two screenshots and the icon decide whether anyone ever sees your game
Nothing downstream matters if the store page does not convert, and it is the cheapest surface to fix. StoreMaven's sample of 500M+ users shows visitors spend **3–6 seconds** on the first impression before deciding, and 100% of visitors are exposed to the first-impression assets while only a minority scroll (**Grade B**). Published A/B tests of icons and screenshots show lifts from **+15% to +64%** (**Grade C** — selection-biased, so plan for +15–25%). Category CVR for games runs **10–12%** against a US all-category average of **8.56%** (**Grade B**).
**Do:** three genuinely different icon concepts tested at 60×60px; first two screenshots each carrying one idea, portrait, ≤5-word captions, showing the *fantasy of authority* rather than a table of numbers.

---

### 2. Ship Custom Product Pages — three-quarters of games don't
Apple's own published data: referred traffic to a matched Custom Product Page converts at **4.1% vs 1.6%** on the default page — a **+156%** lift (**Grade B**). Across 1M+ Apple Ads ad groups, CPPs lifted tap-through from 9.72% to 10.90% and tap-to-install from 63.91% to 70.05%. Games using CPPs see up to **+8.6%** CVR, and **only 26% of games use them**. The limit was doubled to 70 in Oct 2025, and since Jul 2025 they can serve organic search results.
**Do:** one CPP per acquisition intent — "manage your boyhood club," "rebuild a fallen giant," "the tactics sim in your pocket." Days of work, best documented ROI in this document.

---

### 3. Get the player to a match result inside 60 seconds, with no account and no tutorial
**20% of installs are lost within 2 minutes of first launch** (deltaDNA, 275 games, **Grade B**). Nielsen's **10-second** attention limit (**Grade A**) sets the ceiling on any unexplained wait. Login walls stop users cold, and ~24% of e-commerce abandoners cite forced account creation (**Grade A/B**).
This is the highest-leverage in-game decision available to us, because Strategy's genre profile — **worst D1 of any genre at 25.4%, but a D30 (3.12%) that beats Simulation, Action and Shooting** (**Grade B**) — proves the problem is the front door, not the game.
**Do:** the Section 10 spec. ≤5 taps, ≤60 read-required words, zero modals, zero permission prompts, zero login, before the first result.

---

### 4. Never show a player a zero
Nunes & Drèze (2006, *JCR*) ran a real field experiment on car-wash loyalty cards: an 8-stamp empty card versus a 10-stamp card with 2 stamps pre-filled — **identical required effort**. Completion was **34% vs 19%** (**Grade A**). Kivetz, Urminsky & Zheng (2006, *JMR*) established the goal-gradient effect in real reward programmes (**Grade A**).
This is the best-evidenced finding in this document and it is pure presentation.
**Do:** the player inherits a club **3 matches into a season**, not an empty save. Every progress bar starts non-zero. Every objective displays **distance-to-goal** ("2 wins from the play-offs"), never cumulative total ("14 wins"). The league table shows the five rows around you, not all twenty.

---

### 5. Encode every number that matters as something other than a number
Users read **at most 28% of the words on a page, and 20% is more likely**; **79% scan, only 16% read word-by-word** (NN/g eyetracking, **Grade A**). Comprehension on a phone-sized screen is **48% of the desktop level** — complex content is *twice as hard* to understand (**Grade A**).
This is our specific failure mode. A management sim on a phone is the hardest comprehension task on the worst display, delivered to a player who is already 20% likely to leave within two minutes.
**Do:** bars for attributes, shapes for player profiles, colour for form and fitness, a pitch view instead of a squad table, faces for morale, one verdict line plus one comparison instead of a scout paragraph. Assume any text over 15 words is unread and design so the screen still works.

---

### 6. 100 milliseconds, 1 second, 10 seconds
Nielsen's response-time limits are properties of human cognition and have not changed since 1993 (**Grade A**): **0.1s** feels instantaneous and produces the sense of direct manipulation; **1s** preserves the flow of thought; **10s** is the outer limit of held attention. Deloitte Digital, across 37 brands over 4 weeks, found a **0.1 second** load-time improvement raised retail conversions **+8.4%** and travel conversions **+10.1%** (**Grade B**, adjacent domain — do not claim it transfers to D1, do note that behaviour is measurably sensitive at the 100ms scale).
**Do:** tap→visual response under **100ms**, no exceptions; view transitions **200–300ms** ease-out; nothing over **500ms** on a phone; interactive within **2 seconds** of cold start; **skeleton screens, never spinners** (skeletons score higher than spinners on both perceived speed and ease of navigation, **Grade B**); instrument `slow_frame`, `rage_tap` and `ms_to_interactive` from day one.

---

### 7. Juice means legible, proportional consequence — not screen shake
The best experimental evidence in game UX contradicts the received wisdom. Kao et al. (CHI 2024): **pre-registered, N = 1,699**, purpose-built action RPG, 2×2+control varying feedback amplification, success-dependence and variability, with **free-choice playtime** as a behavioural outcome (**Grade A**). Findings: **curiosity was the strongest predictor of enjoyment and the only predictor of playtime; success-dependent feedback enhanced all three motives; amplification unexpectedly *reduced* them**, apparently by undermining the sense of agency. Hicks et al. (CHI PLAY 2019, N=40 and N=32) found juiciness raised **aesthetic appeal** but had **no effect on usability or performance** (**Grade A**).
**Do:** make every decision produce a visible, proportional, immediate consequence — the substitution shifts a momentum bar, the signing visibly moves team strength, the tactic changes what happens in the next highlight. Keep uncertainty in outcomes, because curiosity is what predicts voluntary playtime. Spend on cause-and-effect legibility, not on particles.

---

### 8. One primary action, always, phrased as a verb
There is no single experiment proving this for games, so it is **Grade B by inference** — but it sits at the intersection of Hick's law (**Grade A**), the 2-minute churn cliff (**Grade B**), and the finding that a fifth of players leave before anything has been established. A player who does not know what to do next is a player deciding whether to keep playing.
The nuance that matters, and that most decks get wrong: **"fewer options" is folklore.** Scheibehenne et al. (2010) meta-analysed **50 studies, 63 conditions, 5,036 participants** and found the average choice-overload effect **≈ d 0.02 — indistinguishable from zero** (**Grade C for the phenomenon overall**). Chernev et al. (2015) showed it appears only under moderators — chiefly **when the user has no basis for evaluating the options**. That describes a new player looking at 11 players with 20 attributes each; it does not describe an experienced player picking a formation.
**Do:** one thumb-zone CTA per screen, verb + object ("Pick your team for Saturday"). In the first session, cap decisions at three options with a flagged recommendation and a visible consequence. Later, **don't cut options — add evaluability**: recommended flags, smart default sorts, side-by-side comparison.

---

### 9. Teach one loop, then widen — and make disclosure stick
Progressive disclosure (Nielsen, 1995) has decades of usability evidence behind it: novices learn faster and make fewer errors when advanced features are deferred (**Grade A as principle**; note that the widely-quoted "30–50% faster, 2006 study" is **unverifiable — Grade D**). Its documented cost is that it **slows experts down**, and Football Manager 26 is the live cautionary tale — reviewers describe an interface that gives "less information per glance" while "requiring more searches" (**Grade C**).
**Do:** session 1 teaches exactly one loop, end to end, containing the win. Systems unlock when the player has a *problem they solve*, not on a timer. Every system ships with a working default so a player who never opens it still succeeds — depth as opportunity, not homework. And **persist disclosure state**: once a player opens the detailed attribute view, they keep it forever. Novices get the simple surface; returning experts are never re-simplified.

---

### 10. Notifications as club news, capped at four a week, asked for after the first win
Opt-in is **~54% on iOS** (post-iOS 18.2 prompt changes) and **~97% on Android**, but app-to-app variance is enormous (historically 29–73% on iOS) — which is entirely a function of *when and how you ask* (**Grade B**). The often-quoted "3× retention for users who receive push" is a **correlation with heavy selection bias — Grade D as a causal claim**. The genuinely actionable number points the other way: users receiving **more than 6 notifications per week were 3.4× more likely to uninstall within 30 days** than those receiving 1–2 (Leanplum/AppFollow, **Grade B**). Rich media adds **+22%** to open rates and tailored content **+37%** (**Grade B/C**).
**Do:** never prompt on first launch; soft-prompt after the first match win, pre-framed in-game. Hard cap **4 per week**. Every notification is a **fact about the player's own club** ("Hargreaves is fit for Saturday"), never an offer. A notification that is news is a reason to open; a notification that is marketing is a reason to uninstall.

---

## Sources

**Benchmarks and platform data**
- GameAnalytics, *2026 Mobile & PC Gaming Benchmarks* — https://www.gameanalytics.com/reports/2026-mobile-pc-gaming-benchmarks (summary figures via https://gamedevreports.substack.com/p/gameanalytics-mobile-and-pc-game)
- GameAnalytics, *2025 Mobile Gaming Benchmarks* — https://www.gameanalytics.com/reports/2025-mobile-gaming-benchmarks (summary via https://gamedevreports.substack.com/p/gameanalytics-mobile-gaming-benchmarks)
- Mistplay, *The big list of mobile game retention benchmarks* (AppsFlyer Q3 2022 genre tables) — https://business.mistplay.com/resources/mobile-game-retention-benchmarks/
- Segwise, *Mobile Game Retention Benchmarks 2026* — https://segwise.ai/blog/mobile-gaming-app-user-retention-strategies
- AppAgent, *Mobile Game Retention Benchmarks* — https://appagent.com/blog/mobile-game-retention-benchmarks/

**First session**
- deltaDNA / Mark Robinson, *How first session length impacts game performance*, Game Developer — https://www.gamedeveloper.com/business/how-first-session-length-impacts-game-performance
- deltaDNA, *Thumbspire case study* — https://deltadna.com/blog/thumbspire-case-study/
- *Learning to play: understanding in-game tutorials with a pilot study on implicit tutorials*, Heliyon (2022) — https://www.cell.com/heliyon/fulltext/S2405-8440(22)02770-0

**App store conversion**
- Apple, *Custom product pages on the App Store* — https://developer.apple.com/app-store/custom-product-pages
- Apptweak, *Average App Conversion Rate per Category (2025)* — https://www.apptweak.com/en/aso-blog/average-app-conversion-rate-per-category
- Apptweak, *ASO Trends & Benchmarks Report 2025* — https://www.apptweak.com/en/aso-blog/aso-app-store-trends-benchmarks-report
- StoreMaven, *App Store Screenshots Best Practices* — https://www.storemaven.com/academy/how-to-design-better-screenshot-tests/
- SplitMetrics case studies: Hobnob (+64%) — https://splitmetrics.com/cases/hobnob-app-optimizing-with-splitmetrics/ ; OLBG (+61%) — https://splitmetrics.com/cases/olbg-ios-screenshots-optimization/ ; Prisma (+19.7%) — https://splitmetrics.com/cases/prisma-optimizes-app-store-images/ ; ŠKODA (+15%) — https://splitmetrics.com/cases/skoda-a-b-tests-ios-screenshots/

**Usability and cognition**
- Nielsen, *Response Times: The 3 Important Limits*, NN/g — https://www.nngroup.com/articles/response-times-3-important-limits/
- NN/g, *How Little Do Users Read?* — https://www.nngroup.com/articles/how-little-do-users-read/
- NN/g, *Login Walls Stop Users in Their Tracks* — https://www.nngroup.com/articles/login-walls/
- NN/g, *Skeleton Screens 101* — https://www.nngroup.com/articles/skeleton-screens/
- NN/g, *Executing UX Animations: Duration and Motion Characteristics* — https://www.nngroup.com/articles/animation-duration/
- NN/g, *Hick's Law: Designing Long Menu Lists* — https://www.nngroup.com/videos/hicks-law-long-menus/
- Nielsen, *Progressive Disclosure* — https://www.nngroup.com/videos/progressive-disclosure/

**Behavioural science**
- Nunes & Drèze, *The Endowed Progress Effect: How Artificial Advancement Increases Effort*, JCR (2006) — https://www.researchgate.net/publication/23547282_The_Endowed_Progress_Effect_How_Artificial_Advancement_Increases_Effort
- Kivetz, Urminsky & Zheng, *The Goal-Gradient Hypothesis Resurrected*, JMR (2006) — summary: https://yukaichou.com/behavioral-analysis/goal-gradient-hypothesis-hull-kivetz-motivation-acceleration/
- Scheibehenne, Greifeneder & Todd, *Can There Ever Be Too Many Options? A Meta-Analytic Review of Choice Overload*, JCR (2010) — https://academic.oup.com/jcr/article-abstract/37/3/409/1827647
- Chernev, Böckenholt & Goodman, *Choice overload: A conceptual review and meta-analysis*, JCP (2015) — https://chernev.com/wp-content/uploads/2017/02/ChoiceOverload_JCP_2015.pdf

**Game feel / juice**
- Kao, Ballou et al., *How does Juicy Game Feedback Motivate? Testing Curiosity, Competence, and Effectance*, CHI 2024 (pre-registered, N=1,699) — https://dl.acm.org/doi/10.1145/3613904.3642656 ; PDF: https://people.csail.mit.edu/dkao/pdf/3613904.3642656.pdf
- Hicks, Gerling et al., *Juicy Game Design: Understanding the Impact of Visual Embellishments on Player Experience*, CHI PLAY 2019 — https://dl.acm.org/doi/abs/10.1145/3311350.3347171
- Hicks, *Juicy Game Design: Exploring the Impact of Juiciness on the Player Experience* (thesis) — https://repository.lincoln.ac.uk/articles/thesis/Juicy_Game_Design_Exploring_the_Impact_of_Juiciness_on_the_Player_Experience/24326740

**Performance and speed**
- Deloitte Digital, *Milliseconds Make Millions* — https://deloitte.com/ie/en/services/consulting/research/milliseconds-make-millions.html ; case study: https://web.dev/case-studies/milliseconds-make-millions
- *The effect of skeleton screens: Users' perception of speed and ease of navigation* — https://www.researchgate.net/publication/326858669

**Notifications**
- Airship, *Mobile App Push Notification Benchmarks 2026* — https://www.airship.com/resources/mobile-app-push-notification-benchmarks-2026/
- Airship, *Mobile App Push Notification Benchmarks for 2025* (PDF) — https://growth.airship.com/rs/313-QPJ-195/images/Airship-2025-Push-Notification-Benchmarks-EN.pdf
- Business of Apps, *Push Notifications Statistics (2026)* — https://www.businessofapps.com/marketplace/push-notifications/research/push-notifications-statistics/

**Genre comparables**
- New Star Games — https://www.newstargames.com/
- *A deconstruction of Top Eleven — Mobile Football Manager* — https://arpubrothers.com/blog/deconstruction-of-top-eleven-football-manager/
- Jovan Marinković, *Top Eleven Football Manager — Game UX Case Study* — http://www.jovanmarinkovic.com/topeleven
- *Football Manager 26 is floundering in an interface labyrinth*, Galaxus — https://www.galaxus.at/en/page/football-manager-26-is-floundering-in-an-interface-labyrinth-40507
