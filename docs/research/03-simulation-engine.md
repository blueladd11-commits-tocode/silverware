# 03 — Simulation Engine Design

**Owner:** Simulation Engine agent
**Status:** Design proposal, v1
**Scope:** the maths under the hood. No UI, no application code.

---

## 0. Design principles and calibration targets

Three rules govern every system below.

1. **The engine is honest.** No hidden dice roll ever favours or punishes the human. Difficulty is created by the *situation* (budget, squad, expectations), never by biased maths. See §7.
2. **The player sees a tenth of what the engine tracks.** Depth lives in the model; the surface stays a handful of taps. See the Complexity Budget table (§10).
3. **Everything is calibrated against real football, not vibes.** The engine must reproduce these targets in a 10,000-match soak test:

| Target | Value | Tolerance |
|---|---|---|
| Goals per match (both teams) | 2.75 | ±0.10 |
| Home goals / away goals | 1.52 / 1.23 | ±0.08 |
| Shots per match (both teams) | 26.0 | ±2.5 |
| Mean xG per shot | 0.105 | ±0.015 |
| Home win / draw / away win | 45% / 25% / 30% | ±3pp |
| 0-0 frequency | 7.5% | ±1.5pp |
| Champion points (20-team, 38 gm) | 84 | ±6 |
| Bottom club points | 27 | ±6 |
| Red card ⇒ swing over full match | −1.8 goals | ±0.3 |

These come from Premier League aggregates (27.2 shots/game, 3.13 xG/game in a high-scoring 2023-24; ~10.3% long-run conversion) and the red-card literature (a team reduced to ten concedes ~1.68 and scores ~0.94 across a full match). Any tuning change that breaks the soak test is rejected.

---

## 1. Player model

### 1.1 Visible attributes — seven, no more

Public rating systems solve the same problem three ways: FIFA-style databases use ~35 attributes rolled into a single OVR; WhoScored-style systems use per-event weighted contributions; modern analytics (VAEP, plus-minus) collapse everything to a single possession-value number. For a mobile game, the correct simplification is **seven visible 1–99 attributes plus one derived headline number**.

| # | Outfield | Goalkeeper (same slots, relabelled) |
|---|---|---|
| 1 | Pace | Reflexes |
| 2 | Technical | Handling |
| 3 | Vision | Distribution |
| 4 | Finishing | Command of Area |
| 5 | Defending | Shot Positioning |
| 6 | Physical | Physical |
| 7 | Composure | Composure |

Keeping GKs on the same seven `uint8` slots means one schema, one UI component, one comparison screen.

**Current Ability (CA, 1–99)** is derived, never stored as an independent truth:

```
CA = Σ_i w[role][i] * attr[i]        # w rows sum to 1.0
```

Example weight rows (role → Pace, Tech, Vis, Fin, Def, Phy, Comp):

```
ST  : .16 .18 .10 .28 .02 .16 .10
W   : .26 .24 .16 .14 .04 .08 .08
AM  : .10 .24 .28 .14 .06 .08 .10
CM  : .08 .20 .24 .06 .20 .14 .08
DM  : .06 .16 .14 .02 .34 .20 .08
FB  : .22 .16 .12 .03 .28 .15 .04
CB  : .10 .10 .06 .01 .40 .27 .06
GK  : .20 .22 .10 .16 .14 .10 .08
```

A player's CA therefore *depends on the role you play him in* — for free, without a separate "position familiarity" system. Off-role penalty is a flat multiplier on the resulting CA: same position group 1.00, adjacent 0.93, distant 0.80.

### 1.2 Hidden attributes

Stored, never shown, occasionally *hinted* at through scouting text and staff opinions.

| Field | Range | Use |
|---|---|---|
| `potential` (PA) | 1–99 | ceiling for CA growth |
| `pa_band` | 0–5 | fuzzy value the scout reports (±8 CA noise) |
| `consistency` | 1–99 | variance of per-match performance |
| `injury_prone` | 1–99 | injury hazard multiplier |
| `professionalism` | 1–99 | training gain multiplier, contract behaviour |
| `ambition` | 1–99 | willingness to leave for bigger clubs |
| `adaptability` | 1–99 | settling penalty after a foreign move |
| `big_game` | 1–99 | Composure modifier in cup finals / derbies |

Eight hidden bytes. That is the entire "personality" system, and it is enough to generate every narrative the game needs: the wonderkid who stalls, the pro who plays until 37, the mercenary who agitates every January.

### 1.3 Age curves

Peak ages are position-dependent and match published age-curve work (overall peak ≈27.4; wingers earliest ≈26.1; centre-backs and goalkeepers latest).

```
PEAK = { GK: 29.0, CB: 28.0, FB: 26.8, DM: 27.4, CM: 27.2,
         AM: 26.8, W:  26.1, ST: 27.8 }
```

Development is resolved **twice a season** (winter + summer), not per match:

```
youth_factor(age) = clamp((PEAK[role] - age + 2) / 9, 0, 1)

growth = G * ((PA - CA) / PA)
           * youth_factor(age)
           * training_quality        # 0.7 .. 1.3 from facilities + staff
           * (0.6 + 0.008 * professionalism)
           * minutes_factor          # 0.5 .. 1.25, see below
           * N(1.0, 0.18)

phys_share   = (Pace + Physical) / Σ attr      # ~0.286 is neutral
decline_mult = 0.70 + 3.15 * phys_share        # 1.0 at neutral, 1.3 if athletic
decline = D * max(0, age - PEAK[role])^1.55 * decline_mult

ΔCA = growth - decline
G = 4.6, D = 0.85      # tuned so a PA-85 / CA-55 17yo peaks around 24-26
minutes_factor = 0.5 + 0.75 * clamp(league_minutes / 2200, 0, 1)
```

`ΔCA` is then distributed back across the seven attributes, weighted by role and by attribute type: growth favours Technical/Vision/Finishing/Composure; decline hits Pace and Physical ~2.4× harder than the rest. This is why a 33-year-old playmaker stays useful and a 33-year-old winger does not — emergent, not special-cased.

### 1.4 Form, morale, fitness, injury

**Form** is an exponential moving average of match ratings, expressed as a z-score:

```
form = 0.80 * form_prev + 0.20 * (rating - 6.60)   # clipped to [-2.0, +2.0]
match_multiplier = 1 + 0.045 * form
```
Max ±9% on effective ability. Enough to matter, not enough to override quality.

**Consistency** governs per-match noise:
```
sigma = 0.14 - 0.0009 * consistency        # 0.14 down to 0.05
perf_mult = clamp(N(1.0, sigma), 0.70, 1.30)
```

**Morale** is club-level and player-level (−100..+100), driven by results, playing time, contract status, transfer rumours, squad-role promises. Effect is deliberately small and applied to *Composure only*:
```
composure_eff = composure * (1 + 0.0025 * morale)
```
This keeps morale from becoming a god-stat, while still making an unhappy squad worse at holding a 1-0.

**Fitness** (`condition` 0–100 and `sharpness` 0–100). Per-minute in-match drain:
```
drain = 0.36 * (1 + 0.30*tempo_z + 0.35*press_z)
          * (1.55 - 0.0075 * Physical)
          * weather_mult * age_mult
effective_attr = attr * (0.82 + 0.18 * condition/100)
```
Recovery between matches: `+ (14 + 0.09*Physical) per rest day`, reduced by travel and by a 3-days-rest congestion penalty. This makes rotation a real decision without a training-schedule screen.

**Injury hazard** per match:
```
p_injury = 0.0135
          * (0.55 + 0.009 * injury_prone)
          * (1 + 0.9 * max(0, (72 - condition)/72))
          * (1 + 0.4 * press_z)
          * age_mult(age)
```
Base ≈1.35% per player-match → ~0.4 injuries per team per match, in line with real squads. Severity drawn from a fixed table: 62% ≤7 days, 25% 8–28 days, 10% 1–3 months, 3% 3–9 months.

---

## 2. Match engine

### 2.1 The options, and the recommendation

| Approach | Strength | Fatal flaw here |
|---|---|---|
| Poisson / Dixon-Coles marginals | Trivially cheap, provably correct aggregates | Produces a *scoreline*, not a *story*. No minute-by-minute feed, no substitutions, no red cards, no momentum. |
| Full possession-chain / zonal Markov chain | Rich, tactically expressive | 20+ states × ball zones; expensive to tune, and 90% of the fidelity is invisible without a pitch view. |
| xG-driven event sim | Directly produces shots, chances, a commentary feed; calibrates against public data | Needs care or it drifts from realistic scorelines. |

**Recommendation: an xG-driven possession-event simulator, calibrated so that its aggregate output reproduces a Dixon-Coles Poisson model.** This is the only option that gives a watchable feed *and* provably realistic scorelines. It is a Markov chain, but a deliberately shallow one — 6 states, not 40.

Then run it at **two fidelities**:

- **Full fidelity** (~200 possessions, full event log) for any match involving the human's club, plus its title/relegation rivals in the final 6 rounds. ~0.4 ms/match.
- **Fast fidelity** (Dixon-Coles bivariate draw from the same team-strength numbers, then a synthetic scorer/assist attribution pass) for every other match in the world. ~0.02 ms/match.

Both paths consume identical team-strength inputs and are tuned to the same marginals, so nothing is inconsistent. A 10-league world of ~3,800 matches per round-set simulates in well under a second on a mid-range phone.

### 2.2 Team strength

Compute three phase ratings from the effective XI:

```
ATT = Σ over players ( CA_eff * att_weight[role] * position_zone_factor )
MID = Σ over players ( CA_eff * mid_weight[role] * ... )
DEF = Σ over players ( CA_eff * def_weight[role] * ... )
CA_eff = CA * off_role_mult * match_multiplier(form)
         * perf_mult(consistency) * (0.82 + 0.18*condition/100)
```
Formation shape sets the zone factors (a 4-2-3-1 puts more mass in MID, a 4-4-2 more in ATT). Each phase is then normalised to a ~0–100 scale against league mean.

### 2.3 The loop

```
POSSESSIONS = 196 + round(N(0, 9))
p_A = MID_A^1.5 / (MID_A^1.5 + MID_B^1.5)        # base possession share
p_A = clamp(p_A + tactic_possession_delta, 0.25, 0.75)

for each possession k:
    minute   = floor(k * 94 / POSSESSIONS)
    team     = A with prob p_A else B
    (att, def) = (ATT_team, DEF_opponent)

    # --- chance creation ---
    edge = (att - def) / 100
    shot_rate = 0.068
                * exp(0.55 * edge)
                * tactic_volume[team]
                * momentum_mult[team]
                * urgency_mult[team]
                * red_card_mult[team]
                * weather_volume

    if rand() > shot_rate:  emit non-shot event; continue

    # --- shot quality ---
    Q = 1.0 * exp(0.42 * edge) * tactic_quality[team] * weather_quality
    alpha = 0.62 * Q
    xg = clamp( Beta(alpha, 4.9), 0.02, 0.93 )     # mean ~0.105 at Q=1

    # --- conversion ---
    shooter = pick_shooter(team)                    # weighted by role + Finishing
    fin_z   = (shooter.Finishing_eff - 55) / 20
    gk_z    = (keeper.CA_eff - 55) / 20
    p_goal  = clamp( xg * (1 + 0.22*fin_z) * (1 - 0.19*gk_z), 0.01, 0.96 )

    if rand() < p_goal:  goal(team, shooter, assister)
```

Set-pieces are folded in: 11% of possessions become a foul/corner branch, which draws from a separate, tighter xG distribution (`Beta(0.55, 6.4)`, mean ≈0.079) and weights the shooter selection by Physical for headers.

### 2.4 Modifiers

**Home advantage.** Applied as `edge += 0.11` for the home side and `shot_rate *= 1.06`, plus a small referee tilt (away side +9% foul rate). Reproduces the ~0.29–0.43 goal gap without inflating xG per shot, matching the finding that home advantage shows up more in finishing and volume than in chance quality.

**Fatigue.** `condition` decays per minute (§1.4) and feeds `CA_eff`, which is recomputed every 15 simulated minutes. A tired back four literally degrades, so 85th-minute goals emerge rather than being scripted.

**Red cards.** On a sending-off, for the remainder of the match:
```
red_card_mult[offender]  = 0.60
red_card_mult[opponent]  = 1.35
tactic_quality[opponent] *= 1.12
```
From base 1.52/1.23, a first-minute red gives 0.91 for / 1.66 against — within noise of the published 0.94 / 1.68. This is the calibration anchor for the whole modifier system.

**Weather.** Four states (Clear, Rain, Heavy Rain/Snow, Windy). Heavy rain: `weather_quality = 0.94`, `weather_volume = 1.03`, turnover rate +9%, GK error rate ×1.6, fatigue drain ×1.08. Small effects, big narrative payoff, and it slightly compresses the favourite's edge — which is *why* upsets happen in a cup tie on a wet Tuesday.

**Momentum — drama without noise.** An AR(1) process per team, mean-reverting so it cannot run away:
```
M_t = 0.945 * M_{t-1} + N(0, 0.33)          # clipped [-2.6, +2.6]
momentum_mult = exp(0.105 * M_t)             # roughly 0.76x .. 1.32x
```
Event shocks: scoring `M += 0.55`; conceding `M += 0.20` (urgency, not collapse) and `M_opponent += 0.35`; a red card `M -= 1.2`; a missed penalty `M -= 0.7`. Because momentum is autocorrelated, the feed produces *periods of pressure* rather than a uniform drip of chances — which is exactly what makes a text feed watchable.

**Game state / late drama.**
```
deficit = clamp(opp_goals - own_goals, 0, 3)
u = 0.55 * deficit * (minute/94)^2.2
urgency_mult[trailing]  = 1 + u
urgency_mult[leading]   = 1 - 0.22*u          # sits deeper
tactic_quality[leading] *= 1 + 0.30*u         # but counters are better chances
```
This single block produces late equalisers, late sucker-punch counters, and the "throwing bodies forward" feel — all from the score, all symmetric, all explainable.

**Upsets.** No special code. With λ ≈ 1.5 vs 1.1 the underdog already wins ~24% of the time. Adding one-off variance would be exactly the "scripted" feel we are avoiding.

### 2.5 The commentary feed

Every possession emits an event token: `{minute, team, type, actors[], xg?, momentum_band}`. Types: `build`, `turnover`, `chance`, `shot_off`, `shot_saved`, `shot_blocked`, `goal`, `foul`, `corner`, `card`, `sub`, `injury`, `var_check`. The text layer (owned elsewhere) maps token → phrase pool. The engine's only job is to emit tokens with an `importance` score (0–3) so the feed can compress a 200-event match into ~40 displayed lines.

---

## 3. Tactics — one screen, hard limit

**Formation** (8 presets): 4-4-2, 4-2-3-1, 4-3-3, 4-5-1, 3-5-2, 3-4-3, 5-3-2, 4-1-4-1.

**Three sliders** (5 notches each, −2..+2), and nothing else:

| Slider | Low | High |
|---|---|---|
| **Tempo** | Patient build-up | Direct |
| **Line** | Deep block | High line + press |
| **Mentality** | Contain | All-out attack |

**Mapping into the engine:**

```
tempo_z, press_z, ment_z ∈ [-1, +1]   (slider / 2)

tactic_volume  = 1 + 0.16*tempo_z + 0.20*ment_z
tactic_quality = 1 - 0.13*tempo_z + 0.06*press_z - 0.05*ment_z
possession_delta = -0.055*tempo_z + 0.030*press_z
DEF_effective  = DEF * (1 - 0.14*ment_z - 0.07*press_z)
fatigue_drain  = base * (1 + 0.30*tempo_z + 0.35*press_z)
turnover_high  = 0.11 + 0.075*press_z          # chance of winning ball in final third
```

**The rock-paper-scissors** comes from three interaction terms, applied as multipliers on the attacking side's `edge`:

```
High press  vs  Patient build-up   : presser  edge +0.13
Direct      vs  High press         : direct   edge +0.15   (bypasses the press)
Patient     vs  Deep block         : patient  edge +0.10   (block has no outlet)
Deep block  vs  Direct             : block    edge +0.12   (defends its own box)
```

Three counters, each readable in one sentence, each visible to the player because the opponent's shape is scouted pre-match. A manager who reads the opposition gains roughly the equivalent of 4–6 CA points across the XI — meaningful, not decisive. **Explicitly rejected:** player instructions, individual roles beyond the position, set-piece routines, opposition-instruction screens, mentality-per-third. Any of these needs a second screen and buys nothing the three counters don't.

---

## 4. Transfer market and valuation

### 4.1 Valuation

```
V = BASE(CA) * A(age, PA) * C(contract) * F(form) * S(scarcity) * L(league) * IDX(season)

BASE(CA) = 12_000_000 * (CA / 70)^10          # CA50 ≈ £0.41m, CA85 ≈ £85m, CA90 ≈ £148m

A(age, PA):
   gap = clamp(PA - CA, 0, 25)
   if age < 24:  1 + 0.055*(24-age) * (1 + 0.055*gap)
   if 24..27:    1.0
   if age > 27:  exp(-0.16 * (age - 27))       # 30yo 0.62, 33yo 0.38, 36yo 0.24

C(contract) = clamp( (months_left / 48)^0.45, 0.18, 1.0 )
```
`C` reproduces the empirical shape: 4→3 years remaining costs ~12%, 2→1 year costs ~27%. At 0 months the fee is zero and the cost shifts to a signing bonus (§4.3).

```
F(form)      = 1 + 0.09 * clamp(form_z, -1.5, 1.5)
S(scarcity)  = 0.90 .. 1.25, recomputed each window as
               (league demand at position) / (supply of CA≥threshold players)
L(league)    = selling league's reputation factor, 0.75 .. 1.15
IDX(season)  = global index, see §4.4
```

Asking price is `V × (1.15 + 0.45 × squad_importance)`. A club will not sell a key player below that no matter the bid — the classic "not for sale" without a scripted flag.

### 4.2 AI club behaviour

Each AI club runs the same five-step routine per window. It is *the same code the human's assistant offers as suggestions* — a fairness guarantee.

```
1. NEEDS:   for each position, need = starter_gap + depth_gap + age_risk
            starter_gap = max(0, league_par_CA[pos] - best_CA[pos])
            age_risk    = 1 if best player at pos is >30 with no successor
2. BUDGET:  spend_cap = transfer_budget + expected_sales
            wage_cap  = (revenue * ffp_ratio) - committed_wages
3. SHORTLIST: score = (CA_gain * 1.0 + PA_gain * 0.45) / (V/1e6)^0.8
            filtered by wage affordability, league pull, player ambition
4. BID:     opening = V * (0.80 + 0.25*urgency)
            max_bid = min(spend_cap, V * (1.05 + 0.30*urgency + 0.15*rivalry))
            escalate in 3 rounds max; walk away past max_bid — always
5. SELL:    list players where squad_role = surplus, or age>30 & CA<par,
            or contract < 12 months & renewal refused
```

`urgency` rises through the window and spikes after a bad run or a long-term injury. **Critical rule:** `max_bid` is derived only from `V`, never from another club's bid or a previous sale. This is the single most important line in the whole market design — it is what stops the price ratchet that breaks these games by season 5.

### 4.3 Agents, wages, clauses, loans

- **Wage demand:** `wage_pw = 0.0068 * V^0.86 * (1 + 0.004*ambition) * league_wage_index`. A £30m player asks roughly £62k/week — right for a mid-table Premier League signing.
- **Agent fee:** 6–12% of fee (scaled by agent greed, a per-agent hidden stat), paid from the transfer budget. A pure sink.
- **Release clause:** offered by the *player* during negotiation to accept lower wages; set at 1.6–2.6× V. Triggers automatically for AI clubs that can afford it — a real risk, disclosed up front.
- **Loans:** wage split 0–100%, optional loan fee (`0.08 × V`), optional obligation/option to buy. AI clubs loan out any player with `age < 22 AND minutes_projected < 900`.
- **Frees:** Bosman applies from 6 months out. Signing bonus `= 0.28 × V`, wage demand ×1.30.

### 4.4 Keeping the market stable for 15 seasons

Five mechanisms, all cheap:

1. **Global index.** One number, `IDX(season)`, grows at 3.5%/season and multiplies *both* all revenues and `BASE(CA)`. Real prices stay flat; the world just looks more expensive over time. No compounding drift.
2. **Valuation is never derived from transactions.** Prices anchor to CA/age/contract only. Fees cannot bootstrap themselves upward.
3. **Hard wage-to-revenue cap.** See §5.
4. **Sinks.** Agent fees, a 4% solidarity levy on every fee, stadium/facility maintenance, and loan wage subsidies all remove money permanently.
5. **CA conservation.** Youth intake generates a *fixed budget* of CA/PA per league tier each season (§6.1). The world's total talent is stationary, so scarcity — and therefore price — is stationary too.

A drift monitor runs each season end: if median league squad value moves more than ±12% relative to `IDX`, the intake budget and `S(scarcity)` self-correct. This is world-level homeostasis, not per-match cheating.

---

## 5. Club economy

**Revenue (per season):**
```
gate        = matches_home * attendance * avg_ticket_price
              attendance = min(capacity, capacity * demand)
              demand     = 0.55 + 0.30*form_index + 0.20*reputation_z - 0.35*price_z
tv          = league_pool * (0.50/n_clubs + 0.30*position_share + 0.20*broadcast_picks)
prize       = league_position_prize + cup_progress + continental_progress
sponsorship = base_sponsor(reputation) * (1 + 0.30*continental_qualified)
commercial  = 0.40 * sponsorship * (1 + 0.12*star_player_count)
sales       = transfer income
```
Continental qualification is typically worth 35–60% of a mid-table club's revenue — the correct source of stakes.

**Costs:** wages (~55–65% of revenue for a healthy club), transfer amortisation (fee spread over contract length — this matters for FFP), staff, facility maintenance, matchday ops, agent fees.

**Levers the player actually controls — five:**

| Lever | Range | Effect |
|---|---|---|
| Ticket price | −25% .. +40% of league norm | gate revenue vs attendance vs fan morale |
| Wage / transfer split | slider | reallocates the same board-set budget |
| Youth academy investment | 5 levels | intake quality (§6.1), 18-month lag |
| Training facilities | 5 levels | `training_quality` 0.7–1.3 |
| Scouting network | 5 levels | shrinks PA reporting error from ±20 to ±4 |

**FFP-style constraint** (one rule, always visible):
```
wage_ratio = wage_bill / revenue_3yr_avg
  < 0.60  : green,  full transfer budget
  0.60-0.70: amber, budget halved, no wage increases above +10%
  > 0.70  : red,   transfer embargo until compliant; forced sales at 0.85*V
3-season cumulative loss cap: 25% of avg revenue → points deduction (−6)
```
AI clubs obey the identical rule. Players must be able to verify that.

---

## 6. World simulation and longevity

### 6.1 Youth intake and regens

Once a season, each club generates 3–6 youths on **1 March**:

```
n_youth     = 3 + round(academy_level * 0.6)
intake_seed = hash(save_seed, club_id, season)     # fixed before it is revealed

pa_base = league_tier_par + 4.5*academy_level + 3.0*nation_youth_rating
PA      = clamp( round(N(pa_base, 11.5)), 30, 99 )
CA      = clamp( PA * uniform(0.30, 0.55), 15, 70 )
age     = 15..17
```
A **national CA/PA budget** caps the total talent generated per season per nation, so the world neither inflates nor decays. One "gem" (PA ≥ 88) appears roughly once per 45 club-seasons at academy level 3, scaling to once per 12 at level 5 — a real, felt return on the investment.

Regens are not clones of retirees. They are drawn from nation/position demographic distributions, which drift slowly: a nation's `youth_rating` moves ±0.4/season based on its clubs' continental results and national-team performance. Over 15 seasons this produces genuine footballing power shifts — the single strongest longevity lever in the design.

### 6.2 AI managers

Each club has a manager entity with `reputation`, `preferred_formation`, `tactical_bias (tempo/press/mentality)`, `youth_preference`, `transfer_aggression`, `loyalty`. Managers are sacked on `board_confidence < 25` (driven by results vs. expectation, not by a fixed points threshold) and hired by reputation match with noise. A big-club manager sacked in October reappears at a mid-table club in June, changes its formation, and its transfer profile shifts — recurring narrative from ~40 bytes per manager.

### 6.3 Reputation drift

Club reputation (0–10000) drifts toward a target set by 5-season rolling results, revenue, and continental record, at 8%/season. League reputation is the mean of its top 8 clubs, also 8%/season. Consequences: TV pools shift, continental slot allocation shifts, player willingness to join shifts. A well-run save can drag a whole league up the coefficient table over 15 seasons.

### 6.4 Rivalries

`rivalry_score(A,B)` = derby flag + recent title-race proximity + recent transfer disputes + head-to-head record. Feeds: fixture importance (crowd, morale swing, `big_game` attribute usage), AI transfer aggression (`+0.15` on `max_bid` to hijack a rival's target), and headline generation.

---

## 7. Difficulty and fairness

**Why "scripted" AI is hated:** players detect it when outcomes stop tracking inputs. A 1-0 lead that always evaporates, a favourite that always concedes in the 89th, a transfer target that always chooses a rival — these read as the game *deciding* rather than *resolving*. The tell is always an effect the player cannot influence.

**The rules:**

1. **One engine, no flags.** The match function never receives `is_human_club`. Assert this in a unit test that simulates the same fixture with the flag on both sides and compares distributions.
2. **No rubber-banding.** No dynamic difficulty adjustment of any kind. Ever.
3. **Difficulty is situational.** The three difficulty levels change only *starting conditions and board patience*:

| | Easy | Realistic | Ruthless |
|---|---|---|---|
| Starting budget | 1.25× | 1.0× | 0.80× |
| Board patience (matches) | 18 | 11 | 7 |
| AI transfer competence tier | 2 | 3 | 4 (best shortlist logic) |
| Player-interest bias toward you | +8% | 0 | −8% |
| Injury/fatigue realism | 0.85× | 1.0× | 1.0× |

The AI never gets better *maths* — it gets a better *search* over the same maths, which is defensible and explainable.

4. **Every outcome is explainable.** Post-match, the engine can dump the actual drivers: "Your press advantage +0.13 was cancelled by their direct tempo counter (+0.15); you created 1.9 xG to their 1.1 and lost 1-2." A player who can see *why* accepts a loss. This is the single highest-leverage anti-frustration feature in the entire game.
5. **Losing is common and survivable.** Target: a well-managed mid-table club wins its league in roughly 1 of 6 seasons. Expectations are set in achievable steps ("finish top 10"), not "win everything".

---

## 8. Determinism and saves

**Seeded RNG.** One `save_seed` (64-bit) at career creation. Every stochastic event derives its own stream:

```
stream_key = xxhash64(save_seed, entity_type, entity_id, season, event_ordinal)
rng        = PCG32(stream_key)
```
Split streams mean adding a feature never shifts existing outcomes, and a bug report reproduces exactly from `save_seed` + a match id.

**Save-scumming.** A match's seed is `hash(save_seed, match_id)` and `match_id` is fixed at fixture generation. Reloading and re-simulating the same fixture with the same XI and tactics produces the **identical result**. Changing the XI or tactics legitimately changes it — which is the decision we want players to make anyway. No punitive autosave lock needed; the maths handles it.

**Save size.** Target: **< 8 MB at season 15**.

| Data | Encoding | Size |
|---|---|---|
| Active player | 7 attrs + 8 hidden + 12 state fields, bit-packed | ~72 B |
| ~6,500 active players | | ~470 KB |
| Retired/legacy player | name, dates, career totals | 28 B |
| Match (historical) | ids, score, xG, 4 flags | 24 B |
| ~3,900 matches × 15 seasons | | ~1.4 MB |
| Full event log | **only for the last 5 matches** | ~40 KB |
| Clubs, staff, managers, competitions | | ~300 KB |

Rules: event logs are transient; seasons older than 3 collapse to per-player season aggregates (apps, goals, assists, avg rating — 10 B/row); anything reconstructible from `save_seed` is not stored. Persist as a single binary blob with delta-append + periodic compaction, not JSON.

---

## 9. Core schema sketch

```
Player   { id u32, name_id u32, nation u16, dob u32, pos_primary u8, pos_alt u8,
           attrs u8[7], pa u8, consistency u8, injury_prone u8, professionalism u8,
           ambition u8, adaptability u8, big_game u8, pa_band u8,
           club u32, contract_end u32, wage u32, release_clause u32,
           condition u8, sharpness u8, morale i8, form_ema i16,
           squad_role u8, injury_until u32, value_cache u32 }

Club     { id u32, name_id u32, league u16, reputation u16, capacity u32,
           balance i64, wage_bill u32, revenue_hist u32[3],
           academy u8, training u8, scouting u8, ticket_price u16,
           manager u32, board_confidence u8, expectation u8, ffp_state u8 }

Manager  { id u32, name_id u32, club u32, reputation u16,
           formation u8, tempo i8, press i8, mentality i8,
           youth_pref u8, transfer_aggression u8, loyalty u8 }

Competition { id u16, type u8, tier u8, nation u16, reputation u16,
              n_clubs u8, tv_pool u64, prize_curve_id u8, slots u8[4] }

Match    { id u32, comp u16, season u16, round u8, date u32,
           home u32, away u32, hg u8, ag u8, xg_h u16, xg_a u16,
           attendance u32, flags u16 }        # flags: reds, weather, neutral, etc.

Season   { year u16, comp_tables[], top_scorers[], award_ids[],
           idx_multiplier u16, transfer_log_ref u32 }
```

---

## 10. Complexity budget

| System | What the player SEES | What the engine TRACKS |
|---|---|---|
| Player | 7 attributes, 1 overall star rating, age, position, form arrow, fitness bar, morale face | 7 attrs + 8 hidden + role-weighted CA per position + PA + development curve + 12 state fields + season history |
| Match | Score, a ~40-line commentary feed, possession %, shots, xG, 3 sub slots | ~200 possession events, momentum AR(1), per-player per-15-min fatigue, per-shot xG, injury hazard rolls, urgency curve |
| Tactics | Formation + 3 sliders (one screen) | 6 derived multipliers, 4 counter-interaction terms, fatigue and turnover coupling |
| Transfers | Asking price, "interested / not for sale", wage demand, 3 negotiation rounds | 7-factor valuation, per-club needs matrix, urgency curve, rivalry hijacks, agent greed, scarcity index |
| Economy | Balance, transfer budget, wage budget, 5 investment levers, one FFP traffic light | Full 7-stream revenue model, amortisation schedule, 3-year rolling FFP, attendance elasticity |
| World | League tables, news headlines, transfer rumours, youth intake day | 10 leagues, reputation drift, national talent budgets, manager carousel, coefficient tables, rivalry scores |
| Difficulty | 3 named presets | Starting-condition deltas only; identical match maths on both sides |

---

## 11. Build order

1. Player model + CA derivation + age curves → validate a 20-year single-player simulation looks sane.
2. Match engine full-fidelity + soak test against §0 targets. **Do not proceed until the table is green.**
3. Dixon-Coles fast path, tuned to match the event engine's marginals.
4. Season loop, tables, fixtures, injuries, development.
5. Valuation + AI transfer routine → run a 15-season headless soak; check the drift monitor.
6. Economy + FFP.
7. World simulation: intakes, manager carousel, reputation drift.
8. Tactics counters last — they are a multiplier on a working engine, not a foundation.

---

## Sources

- [Predicting Football Match Results Using a Poisson Regression Model (MDPI)](https://www.mdpi.com/2076-3417/14/16/7230)
- [Predicting Football Results With Statistical Modelling: Dixon-Coles and Time-Weighting](https://dashee87.github.io/football/python/predicting-football-results-with-statistical-modelling-dixon-coles-and-time-weighting/)
- [Better Predictions for Football Matches: How Does the Dixon-Coles Model Work?](https://urazakgul.github.io/datafc-blog/posts/en/post3/better-predictions-for-football-matches-how-does-the-dixon-coles-model-work.html)
- [Predicting goal probabilities with improved xG models using event sequences (PMC)](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11524524/)
- [A Markovian model for association football possession and its outcomes (arXiv)](https://arxiv.org/pdf/1403.7993)
- [Attacking Contributions: Markov Models for Football (StatsBomb)](https://blogarchive.statsbomb.com/articles/soccer/attacking-contributions-markov-models-for-football/)
- [The Numbers Behind the Premier League Goal Explosion (Opta Analyst)](https://theanalyst.com/2024/03/numbers-behind-premier-league-goal-explosion)
- [Season trends: Clinical finishing key to record goals total (Premier League)](https://www.premierleague.com/en/news/4027257)
- [Position can dictate age when players decline (ESPN)](https://www.espn.com/soccer/story/_/id/37467220/soccer-age-curves-show-goalkeepers-central-defenders-peak-latest)
- [The Aging Curve: How Age Affects Physical Performance in Elite Football (PMC)](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12551122/)
- [Building Marcel, Part II: Age Curves (Michael Caley)](https://www.expectinggoals.com/p/building-marcel-part-ii-age-curves)
- [Effects of a red card on goal-scoring in World Cup football matches (Empirical Economics)](https://link.springer.com/article/10.1007/s00181-017-1287-5)
- [How Do Red Cards Impact Team Performance?](https://databetweenthelines.substack.com/p/how-do-red-cards-impact-team-performance)
- [How much does Home Field Advantage matter in Soccer Games? (arXiv)](https://arxiv.org/html/2205.07193v2)
- [Home Advantage in Football: Exploring Its Effect on Individual Performance (MDPI)](https://www.mdpi.com/2076-3417/15/4/2242)
- [Player Valuation Methodology (Football Benchmark)](https://footballbenchmark.com/player-valuation-methodology)
- [Statistical Modeling of Football Players' Transfer Fees Worldwide (MDPI)](https://www.mdpi.com/2227-7072/12/3/93)
- [Econometric Approach to Assessing the Transfer Fees and Values of Professional Football Players (MDPI)](https://www.mdpi.com/2227-7099/10/1/4)
- [Match AI and Animation (Football Manager 26)](https://www.footballmanager.com/features/match-ai-and-animation)
- [openengine — open-source football match engine (GitHub)](https://github.com/atas76/openengine)
