<div align="center">

# SILVERWARE

**Nobody remembers fifth.**

A mobile football management game — the simplicity of *Football Chairman*,
the breadth of old *FIFA Manager* career mode.

</div>

---

## What it is

A premium, offline, unlicensed football management sim for phones. Portrait, one-handed,
thumb-driven. A season takes 15–20 minutes; a career takes 40–50 hours.

The design rests on one idea: **the game plays itself competently, and your job is to
disagree with it.** A newcomer never disagrees and still finishes a season happily. A
fanatic disagrees fifty times. Both use identical screens — depth lives in optional
overrides on top of good defaults, never in extra navigation.

## Play it

No build step, no toolchain, no dependencies.

```bash
python3 -m http.server 8899 --bind 127.0.0.1
```

Then open `http://127.0.0.1:8899/prototype/silverware.html` — or just open that file
directly in a browser. It is one self-contained page.

## What's in the game

**World** — 140 clubs across five nations. Three English tiers with promotion and
relegation. Three European competitions, entered from the top nine of the top flight.
A domestic knockout cup across all sixty English clubs.

**Squad** — seven visible attributes, eight hidden ones. Ability is *derived* from the
role you play someone in, so position familiarity comes for free. Ageing curves by
position, so a 33-year-old playmaker stays useful and a 33-year-old winger does not.

**Management** — formation and three sliders, one screen, hard limit. Transfers with
valuation-only bid ceilings. Contracts, agents and release clauses. Training focus.
An academy. Scouting that is sometimes wrong on purpose. In-match substitutions.
Board confidence and the sack. Press conferences. A dressing room. Facilities to build.
A club history that writes itself.

## The match engine

An xG-driven possession-event simulator, deliberately shallow — six states, not forty —
calibrated so its aggregate output reproduces a Dixon-Coles model. It produces a
watchable minute-by-minute feed *and* provably realistic scorelines.

Measured against the shipped code, not estimated:

| Measure | Engine | Real football |
|---|---:|---:|
| Goals per match | 2.86 | 2.75–2.90 |
| Home / away goals | 1.53 / 1.33 | 1.52 / 1.23 |
| Home win rate | 40.8% | ~44% |
| Shots home / away | 13.4 / 11.4 | ~13 / ~11 |
| Set-piece share of goals | 18% | 20–25% |
| Champion's points | 68–88 | ~80–90 |
| Best beats worst, at home | 77% | 75–80% |

**Fairness is a build artefact, not a promise.** The match function is never told which
club is yours. Difficulty changes your budget, the board's patience, and how well rival
clubs search the market — never the maths. Every result comes with a driver dump naming
the two or three factors that decided it, because players forgive losses they can explain.

## Architecture

`prototype/index.html` is the core: world generation, the match engine, the five tabs,
save/load. Every feature beyond that is a **module** in `prototype/modules/`, registered
through the `SW` registry and plugged in via lifecycle and UI hooks. Modules never edit
the core and never touch each other's state — they talk through published interfaces.

```bash
python3 prototype/build.py     # core + modules -> prototype/silverware.html
```

`prototype/silverware.html` is **generated**. Never edit it by hand.

To add a feature, write one file in `prototype/modules/` and read
[`docs/ENGINEERING-HANDBOOK.md`](docs/ENGINEERING-HANDBOOK.md) first — it is the contract
every module codes against.

## Documentation

| Document | What's in it |
|---|---|
| [Engineering handbook](docs/ENGINEERING-HANDBOOK.md) | The module contract: hooks, published interfaces, design tokens, calendar ownership |
| [Design bible](docs/design-bible.html) | Thesis, core loop, simulation, legal build rules, build order |
| [`docs/research/`](docs/research/) | Eight research streams: the manager's job, genre teardown, simulation design, UX architecture, art direction, naming, licensing, logo |

## Licensing and the law

The game is deliberately unlicensed and **must stay that way**. Club names, crests and
competitions are generated. Real player names are never used — "name only, no likeness"
is not a defence when name plus club plus age plus position plus attributes *is* the
likeness.

What is safe and used freely: real cities and districts, real stadium capacities and
geography, league formats copied exactly, real financial scales, real calendar rhythm.

The full risk map and the twenty-two build rules are in
[`docs/research/07-licensing-safety.md`](docs/research/07-licensing-safety.md).
None of it is legal advice; commission a Class 9/41 clearance search before any spend
on the identity.

## Status

Playable vertical slice. Ten feature modules integrated. Verified over ten seasons and
420 matches with no runtime errors; a season-15 save reloads intact.

Next: a native shell, once the loop is proven addictive on the web build.
