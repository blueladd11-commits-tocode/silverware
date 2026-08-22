# SILVERWARE — Engineering Handbook

**Read this fully before writing a line.** Ten modules are being built in parallel by ten
people. This document is the contract that stops us shipping ten incompatible features.

---

## 1. The product, in one paragraph

A mobile football management game. The simplicity of *Football Chairman*, the breadth of old
*FIFA Manager* career mode. Explicitly **not** Football Manager depth. It is premium, offline,
and unlicensed. Portrait phone, one-handed, thumb-driven. A season takes 15–20 minutes.
Brand voice is **dressing-room blunt** — short, plain, never corporate, never cute.
The tagline is *"Nobody remembers fifth."*

**The UX law that governs everything:** *the game plays itself competently; the player's job is
to disagree with it.* A newcomer never disagrees and still finishes a season happily. A fanatic
disagrees fifty times. **Both use identical screens.** Depth lives in optional overrides on top
of good defaults — never in extra navigation.

---

## 2. Hard rules — breaking any of these breaks the build

1. **Never edit `index.html`.** It is the core. You write exactly one file: `modules/<your-file>.js`.
2. **Never add a sixth bottom tab.** There are five, forever: Home, Squad, Market, Club, World.
   Your screen plugs into one of them as a sub-view, or it is a sheet.
3. **Never redefine a core function.** If you need behaviour the core does not expose, use a hook,
   or state the gap in your final report and I will add it to the core.
4. **Never write global variables.** All your state goes in `SW.state('<your-id>')`, which is
   persisted and restored automatically.
5. **Never call another module directly without guarding.** Always
   `const m = SW.get('morale'); if (m) m.adjust(...)`. Any module may be absent.
6. **No real player names, no real club names, no real competition names.** Legal, non-negotiable.
   Generated names only. Do not name a cup after a real one.
7. **No timers, no energy, no currency, no ads, nothing that buys outcomes.** The game is premium.
8. **Every tap target ≥ 44px tall.** Nothing important more than 2 taps from the hub.
9. **Never show a screen with no pre-selected default.** Every choice arrives already answered,
   with an assistant recommendation the player can accept in one tap or override.
10. **Colour is never the only channel.** Win/draw/loss chips carry their letter; deltas carry a sign.

---

## 3. How to register a module

```js
SW.register({
  id:'contracts',                         // must match your filename's name
  init(){},                               // new career started — seed your state here
  onLoad(){},                             // a save was loaded — rehydrate if needed
  onWeek(week){},                         // after each week advances
  onMatchEnd(m){},                        // m = {R, f, hi, ai, mine}  mine = 0 if you were home
  onSeasonEndBefore(){},                  // before promotion/relegation, squads still intact
  onSeasonEndAfter(info){},               // info = {pos, hit}; new season already set up
  onTransfer(p, seller, buyer, fee){},    // fired by the core after any completed transfer
  hubCards(){ return [ {...} ] },         // "Needs You" cards on the hub
  hubBlocks(){ return [ '<div…>' ] },     // raw HTML blocks under the hub
  squadViews(){ return [ {key,label,render} ] },   // sub-view inside the Squad tab
  marketViews(){ return [ {key,label,render} ] },  // sub-view inside the Market tab
  clubViews(){ return [ {key,label,render} ] },    // sub-view inside the Club tab
  clubBlocks(){ return [ '<div…>' ] },    // blocks on the Club overview
  worldTabs(){ return [ {key,label,render} ] },    // a competition chip in the World tab
  marketRowActions(p, club, ask){ return ['<button…>'] },  // an action under a market card
  playerBlocks(p, club){ return [ '<div…>' ] },    // extra sections in the player sheet
  reportBlocks(last){ return [ '<div…>' ] },       // extra sections in the post-match report
  extraFixtures(week){ return [ fixture ] },       // your competition's fixtures this week
  applyResult(m){ return true },          // claim a result your competition owns; else return null
  matchControls(MT){ return [ '<button…>' ] },     // buttons in the live match footer
  matchInterrupt(MT, ev){ return true },  // pause the match; return true if you took over
  afterReport(){ return true }            // full-screen takeover after the match report
});
```

**Hook return conventions**
- `hubCards` / `*Views` / `*Blocks` / `extraFixtures` / `matchControls` — return an **array** (or nothing).
- `applyResult` / `matchInterrupt` / `afterReport` — return **truthy to claim**, `null`/nothing to pass.
  Only the first module to claim wins, so claim narrowly.

**hubCard shape**
```js
{ ic:'✚', bg:'#3A1C12', col:'var(--inj)', a:'Headline', b:'One line of detail',
  fn:"someGlobalFn()",      // string, runs on tap
  priority:50 }             // higher sorts first; see the priority table in §7
```

**fixture shape** (for `extraFixtures`)
```js
{ home:<clubId>, away:<clubId>, neutral:false,
  comp:{ name:'The Challenge Cup', key:'cup' },   // key must be unique and not 'league'
  stage:'Third round' }
```

---

## 4. Core API you may use

**State** — `G` is the game state. `me()` your club, `G.clubs` all 140, `G.leagues` the 7 leagues,
`G.euro` the three European competitions, `G.week` (0–37), `G.season`, `G.objective`, `G.inbox`.

**Club** — `{id,name,abbr,nat,tier,rep,primary,secondary,stadium,capacity,squad,xi,formation,
tempo,line,ment,training,P,W,D,L,GF,GA,form,bal,titles}`

**Player** — `{id,name,nat,pos,age,a[7],pa,cons,inj,prof,amb,big,trait,traitKnown,form,cond,
morale,out,apps,goals,assists,ratings,wage,years,listed,youth}`
`a[]` is `[Pace,Technical,Vision,Finishing,Defending,Physical,Composure]`.
`pa` (potential) and the personality bytes are **hidden from the player** — do not print them raw.

**Functions**
`CA(p, asPos)` ability · `value(p)` transfer value · `wageFor(p)` · `squadOf(c)` non-youth squad ·
`wageBill(c)` · `revenue(c)` · `costRatio(c)` % of revenue on wages, cap is 85 ·
`autoXI(c)` · `leagueOf(cid)` · `leagueTable(l)` · `pts(c)` · `gd(c)` · `myPos()` · `myLeague()` ·
`money(n)` → "£4.2m" · `ord(n)` → "3rd" · `esc(s)` **always escape any generated name** ·
`note(title, body, meta?)` inbox message · `chron(text)` one line in the club chronicle ·
`sheet(html)` open a bottom sheet · `closeSheet()` · `render()` redraw · `save()` ·
`crestSVG(club,size)` · `pface(player,size)` portrait · `ramp(v)` colour for an ability value ·
`avatar(voice,size)` speaker · `subAvatar(voice,size)` subject · `lockup(from,about,size)` both ·
`speakerBar(from,about,rel,sub)` the attribution plate at the top of a message sheet ·
`fstrip(formArray)` W/D/L dots · `plrRow(p,slot)` a standard player row ·
`ri(a,b)` random int · `pick(arr)` · `rnd()` · `gauss(m,s)` · `clamp(x,a,b)`
**Always use `rnd()`, never `Math.random()`** — saves must stay reproducible.

**Voices — every line of speech has a speaker.** `note()` takes an optional third argument
`{from, about, rel}`. Build the descriptors with:

```js
vP(player)                     // a player — his own portrait, his own kit, his own mood
vC(club)                       // a club — its crest on a colour wash
vV(kind)                       // an institution: 'press' 'board' 'assist' 'medical'
                               //   'league' 'academy' 'fans' 'staff'
vH(name, role, nat, age)       // a named human who is not a player:
                               //   role = 'agent' | 'pundit' | 'scout' | 'chairman'

note('They have come for '+p.name, body, {from:vC(bidder), about:vP(p), rel:'want'});
```

Descriptors are **snapshots**, not references — they survive a save, a transfer and a
retirement. `rel` is one or two words and appears above the subject ("want", "on", "filed on").
Speakers render as chamfered squares, subjects as circles: the silhouette is the channel, never
the colour. Any `note()` without a `from` falls back to the club-staff mark. **Every message you
write should name who is talking; most should also name who it is about.**

**Match state** (for the matchday module) — `matchInit`, `matchRun(S, untilMinute)`,
`matchSub(S, side, outPlayerId, inPlayer)`, `matchResume()`, `MT` the live takeover object
(`MT.S` state, `MT.mine` 0/1 which side you are, `MT.paused`).

---

## 5. Design tokens — use these, never raw hex

Backgrounds `--bg --s1 --s2 --s3` · borders `--hair --strong` · text `--t1 --t2 --t3` ·
accent `--acc` (amber `#FFC53D`) and `--accw` (its wash) · semantic `--win --draw --loss
--inj --trf --loan` · European `--ucl --uel --uecl` · ability ramp `--r1`…`--r5`.

**CSS classes already available:** `.card .sechead .btn .btn.ghost .btn.sm .btn.xs .pill .pill.acc
.row .spacer .muted .dim .mono .act .plr .pos .nmw .nm2 .meta .ca .form .flag .segmented .chips
.kv .k2 .v2 .bars .bl .slab .drv .opt .opt.rec .sheet .grab .fixcard .zone .tname`

`.slab` is the broadcast moment — amber block, diagonal cut. Use it **sparingly**: a trophy, a
sacking, a season verdict. Not for routine information.

**Typography:** Archivo for display/scorelines, Inter for everything else. All numerals are
tabular already — do not override.

---

## 6. The roster — who is building what, and where you touch each other

| # | id | Owns | Plugs into |
|---|----|------|-----------|
| 1 | `contracts` | Contract renewals, wage demands, agents, expiries, free agents, release clauses | Squad sub-view "Contracts", hub cards |
| 2 | `cup` | The domestic knockout cup | World tab chip, `extraFixtures`, `applyResult` |
| 3 | `board` | Board confidence, the sack, job offers from other clubs | Club blocks, hub cards, `afterReport` takeover |
| 4 | `media` | Press conferences, headlines, pundit reaction | `afterReport` sheet, hub cards |
| 5 | `morale` | Player morale, dressing-room harmony, unhappy players | Squad sub-view "Dressing room", player blocks |
| 6 | `facilities` | Stadium expansion, training ground, academy investment | Club sub-view "Facilities" |
| 7 | `history` | Club chronicle, records, hall of fame, season review | Club sub-view "History" |
| 8 | `matchday` | In-match substitutions and tactical changes | `matchControls`, `matchInterrupt` |
| 9 | `scouting` | Scout network, reports, revealing hidden potential and traits | Market sub-view "Scouts" |
| 10 | `onboarding` | First-run experience, the tutorial that is not a tutorial | `afterReport`, hub cards, first-run |

### Published interfaces — the exact calls between modules

Each module **must** expose these on its registered object so others can call them.
Every caller **must** guard with `SW.get(...)` first.

```js
SW.get('morale').adjust(playerId, delta, reason)   // delta -100..+100
SW.get('morale').harmony()                          // -100..100 dressing-room state
SW.get('morale').unhappy()                          // array of players agitating

SW.get('board').confidence()                        // 0..100
SW.get('board').adjust(delta, reason)               // e.g. -8 'lost at home to bottom club'
SW.get('board').isSacked()                          // bool

SW.get('history').record(type, text)                // type: 'trophy'|'record'|'milestone'|'era'
SW.get('history').stat(key)                         // read a tracked career stat

SW.get('scouting').knowledge(playerId)              // 0..1 how much we know
SW.get('scouting').reveal(playerId, what)           // 'potential' | 'trait'
SW.get('scouting').reportFor(playerId)              // text or null

SW.get('contracts').expiring(club, months)          // array of players
SW.get('contracts').renew(playerId, terms)          // bool

SW.get('facilities').level(kind)                    // 'stadium'|'training'|'academy'|'medical' -> 1..5
SW.get('cup').status()                              // {round, alive:bool, name} or null

SW.get('culture').role(pid)                         // 'key'|'rot'|'back'|'surp'|null
SW.get('culture').standing(pid)                     // -100..100, what his teammates make of him
SW.get('culture').grievance(pid)                    // {j:0..1, why:[...]} how much of a case he has
SW.get('culture').policing()                        // 0..1 how much the room handles itself

SW.get('market').interest(playerId)                 // {clubs, level:0-3, label}
SW.get('market').offers()                           // [{id, player, club, fee, stage}]
SW.get('market').wageCeiling()                      // % of revenue agreed with the board
SW.get('market').listed(playerId, on)               // set/toggle the transfer list
```

### Who fires what at whom

- **media** and **morale**: a bad press conference calls `morale.adjust(...)`; a title-race
  headline calls `board.adjust(+small)`. Media never writes morale state directly.
- **board** reads `cup.status()` and the player's European progress when judging a season.
  A cup run should soften a bad league finish.
- **matchday** calls `morale.adjust()` when a player is hooked at half-time (he will not like it).
- **scouting** is the *only* module allowed to set `player.traitKnown = true` or reveal potential.
  Everyone else asks `scouting.knowledge(id)` and shows a vaguer label when it is low.
- **history** listens rather than asks: it records trophies, records and milestones from
  `onSeasonEndAfter` and `onMatchEnd`. Other modules may also push via `history.record(...)`.
- **contracts** and **facilities** both spend `me().bal`. Never let a balance go negative —
  check first and refuse with a plain message.
- **onboarding** must degrade gracefully: if a module is missing, skip that step silently.

### Calendar ownership — do not collide

Weeks run 0–37. European weeks are **taken**: `2, 4, 6, 9, 11, 13, 19, 21, 26, 28, 35`.
The transfer windows are weeks **0 (summer, pre-season)** and **19–21 (January)**.

- `cup` may use **only** weeks `7, 15, 23, 30, 33, 36` for its rounds. Six rounds: 64 → 32 → 16 →
  QF → SF → Final. Use as many English clubs as make sense across all three tiers.
- No other module may add fixtures.

---

## 7. Hub card priority — so ten modules do not fight for the top slot

The hub shows a **maximum of three** cards. Use these priorities:

| Priority | Kind |
|---|---|
| 100 | You are about to be sacked / a job offer expires today |
| 90 | Onboarding step (first career only) |
| 80 | Board objective not yet agreed |
| 70 | Contract expiring inside 3 months on a first-team player |
| 60 | An unhappy player is agitating to leave |
| 50 | Transfer window open, budget available |
| 40 | Injuries, fatigue, academy prospect ready |
| 30 | Scout report ready |
| 20 | Facilities upgrade affordable |
| 10 | Informational |

If your card is not time-limited **and** outcome-changing, it is an inbox `note()`, not a card.

---

## 8. Voice — write copy like this

> "He wants a new deal and he wants it now. Sort it or he walks in June."
> "The board have seen enough. Clear your desk."
> "Three defeats. The pundits have started saying your name in that tone."

Not: "Contract renewal opportunity available", "Board confidence has decreased", "Congratulations!"

Short. Concrete. Consequence first. Never exclamation marks except for a goal or a trophy.

---

## 9. How to test before you report done

```bash
cd /Users/abdulrehmanahmed/football-manager-game/prototype
python3 build.py          # assembles core + all modules into silverware.html
```

Then load `silverware.html` in a browser (a server is already running on
`http://127.0.0.1:8899/silverware.html`) and check the console is clean. In the console:

```js
newGame(G.leagues[0].clubs[5]); G.objective.accepted=true; G.speed='instant';
for(let i=0;i<40;i++){ if(weekFixtures().length) startMatch(); else advanceWeek(); }
```

Then exercise **your** screens and confirm: no console errors, your state survives
`save(); load();`, and a full season runs without your module throwing.

**Your module must not break the build if another module is missing.** Test with your file
as the only one in `modules/`.

---

## 10. What to write in your final report

- What you built, in five lines.
- The exact interface you published for other modules.
- Anything you needed from the core that did not exist.
- Anything you deliberately left out and why.
