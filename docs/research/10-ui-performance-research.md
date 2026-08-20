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
