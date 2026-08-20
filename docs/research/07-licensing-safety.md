# 07 — Licensing & Legal Safety

**Owner:** Licensing & legal-safety workstream
**Question this document answers:** "Minus the licences — how close to reality can we legally get, and how?"

---

## This is not legal advice

I am not a lawyer and this is not legal advice. It is a practical risk map built from public sources — platform policies, reported cases, and how the football-game industry actually behaves — written to keep us out of trouble, not to win an argument in court.

**When to actually pay a lawyer.** Three triggers, and only three. (1) **Before soft launch** — two to four hours of an IP solicitor's time reviewing the finished asset list, the store listing and the build rules below. A few hundred pounds, the cheapest insurance we will ever buy. (2) **The day any letter arrives** from a club, league, federation, players' union or platform holder. Nobody on the team replies, not even to be helpful. (3) **If we ever buy a licence** or accept an approach from a rights holder — those contracts carry audit rights, termination and indemnity terms that can sink a small studio. Everything else we handle by following the rules.

---

## 1. What is actually protected

Football has no single owner. Every element below sits with a different body under a different legal theory, which is why "a football licence" does not exist as one purchasable thing.

**Club names** — registered and unregistered **trade marks**. Trade mark law only bites where use suggests trade origin or endorsement, and this is genuinely contested ground: Manchester United sued Sega and Sports Interactive in 2018 over Football Manager's unlicensed use of the club name. It ran nearly three years and settled on undisclosed terms in 2021. A settlement is not a green light — it means nobody got a ruling. "It's just identification" is an argument that costs six figures to run.

**Club crests** — **copyright** (an artistic work) *and* trade mark. Copying a crest is copying a drawing; near-identical redraws still infringe. The clearest bright line in this document.

**Kit designs and colours** — colours alone are essentially unprotectable; a distinctive pattern can be. Kits may carry copyright or design right, and manufacturer marks are separate. Red-and-white stripes belong to nobody. A specific current shirt does.

**Stadium names** — trade marks, often owned by a *sponsor* rather than the club, so the enforcer may be a third party with its own appetite. Stadium architecture can carry copyright in some jurisdictions.

**Competition names and logos** — the highest-value marks in the sport and the most aggressively policed. "Premier League" has been UK-registered since 2006 alongside the lion and trophy devices, and the League runs a published, resourced enforcement programme using third-party investigators. UEFA and FIFA are comparable. Hard RED.

**Player names** — a name alone is usually not a trade mark unless registered (many stars register their own). The real exposure is image/publicity rights and false endorsement — see §5.

**Player likenesses** — splits sharply by geography:
- **US:** a state-law **right of publicity**, and it is strong. In *Keller v EA* the Ninth Circuit let a college footballer's claim proceed, rejecting EA's First Amendment "transformative use" defence because the game recreated the player *in the very setting where he was famous*. *Hart v EA* agreed in the Third Circuit. A management sim is exactly that setting.
- **UK:** **no standalone image right** (*Rihanna v Topshop*). Claimants route through passing off / false endorsement (*Irvine v Talksport*) — harder to win, but very winnable for a famous player against a commercial game.
- **EU:** most member states protect personality or image rights by statute; several are stricter than the UK.

**Real fixture lists** — better news than people assume. The CJEU held in *Fixtures Marketing* (2004) that fixture lists do not attract the **sui generis database right**, and in *Football Dataco v Yahoo* (2012) that they do not attract database copyright either, because the effort goes into *creating* the data rather than *obtaining* it. The UK kept an equivalent database right post-Brexit; the **US has no database right at all** (*Feist*: facts are not copyrightable). **But** Football DataCo licenses fixtures commercially, so scraping a feed breaches contract even where the data itself is free.

**League tables and historical results** — facts, unprotected on both sides of the Atlantic. A *curated compilation* can attract the EU/UK database right where there was substantial investment in obtaining and verifying it. Take facts from reality, never by lifting someone's dataset.

---

## 2. Risk table

| Asset type | What protects it | Risk | Our rule |
|---|---|---|---|
| Competition names & logos (Premier League, Champions League, World Cup) | Trade mark; heavily enforced | 🔴 RED | Never ship. Invent competition names. |
| Club crests / badges | Copyright + trade mark | 🔴 RED | Never ship, never redraw, never "inspired by". |
| Real player names attached to real clubs | Publicity rights (US), passing off (UK), FIFPro collective licensing | 🔴 RED | Never ship. Zero real players in shipped data. |
| Player photos / faces / likenesses | Copyright in photo + publicity/image rights | 🔴 RED | Never ship. All portraits generated, non-specific. |
| Club names | Trade mark (contested — Man Utd v Sega) | 🔴 RED | Never ship. Fictional clubs only. |
| Kit designs (current season) | Copyright/design right + manufacturer marks | 🟠 AMBER | Generic templates only; no reproduced real kit. |
| Stadium names | Trade mark, often sponsor-owned | 🟠 AMBER | Fictional stadium names. |
| Club colours (as colours) | Essentially unprotectable alone | 🟢 GREEN | Free to use — but not colour + name + city + crest-shape together. |
| Real fixture lists (as data) | No DB right (*Fixtures Marketing*); contractual feeds | 🟠 AMBER | Generate our own fixtures. Never ingest a commercial feed. |
| League tables & historical results | Facts — unprotected | 🟢 GREEN | Fine as reference; never bulk-copy a dataset. |
| League *structure* & competition *formats* | Not protectable | 🟢 GREEN | Copy freely — 20 teams, promotion/relegation, group stages. |
| Real city & region names | Geographic, not exclusive | 🟢 GREEN | Use freely. |
| Real stadium capacities, geography, climate | Facts | 🟢 GREEN | Use freely. |
| Real nationalities & name distributions | Facts | 🟢 GREEN | Use freely. |
| Real financial scales (wages, fees, TV money) | Facts / market data | 🟢 GREEN | Use as calibration, not as quoted figures. |
| AI-generated crests & portraits | Weak/no copyright for us; residual similarity risk | 🟠 AMBER | Human-edit everything; run a similarity check. |

---

## 3. How other games solve it

**Football Manager — the patchwork.** SI buy licences league by league, which is why FM ships real English clubs but "Parthenope" for Napoli and fake German and Brazilian competitions. Expensive, still full of holes, and it did not stop Manchester United suing. Not available to us at any price.

**PES / eFootball — the fake-club approach.** Konami shipped "Man Red", "Man Blue", "Merseyside Blue" — real cities and colours with the club name and crest swapped. EA did the reverse with "Piemonte Calcio" for Juventus when Konami took that licence exclusively. Note what both games still had: **fully licensed real players via FIFPro**. The fake club name protected the *club* mark, not the players. We cannot copy half this model and assume we inherit its safety.

**Community database mods.** FM real-names fixes have existed since 2013 and nobody has been sued over one. But Manchester United's 2018 claim reportedly reached into SI's *support for mods* that restored the crest. That is the lesson: the mod is low-risk for its author; the **developer's relationship to it** is where exposure sits.

---

## 4. The editable-database question

**Clean?** The shipping build is clean. The community pack is not our problem *provided* we keep real distance from it.

**Grey?** At exactly one point: **inducement**. Both stores prohibit apps that "encourage or induce" infringement, not only apps that infringe. A listing saying "download the real names pack!" has advertised its own inducement; a general-purpose editor has not. The difference is entirely in what we say and link to.

**What have platforms done?** Little to editors — but they act hard on *listings and metadata*. Trade marks in the app name, subtitle, keywords, screenshots or description are first-order violations. Google's remedy is suspension plus resubmission under a new package name, which destroys install base, ratings and rank, not just the build.

**Helps or hurts?** Helps. Editability is a real feature, it creates a modding community that markets the game for free, and it converts our biggest weakness into player agency. Ship a first-class editor and an import/export format, and say nothing more.

---

## 5. Real player names — the verdict

**No. Not one.** This is the hardest rule in the document.

The reasons stack. FIFPro exists precisely because thousands of players' rights need collective licensing, and EA pays for it *alongside* separate club and league deals. The Ibrahimović/Bale/Raiola flare-up in 2020 showed even licensed use draws player-side challenges. In the US, *Keller* and *Hart* say a game recreating a real athlete in his own sporting context gets no free pass. In the UK, *Irvine* gives a famous player a workable false-endorsement claim.

**"Name only, no likeness" does not save us.** A name plus the right club, nationality, age, position and attributes *is* the likeness — it identifies one living person. Publicity rights attach to identity, not pixels. The one narrow shelter is factual/editorial reference, which a commercial squad database is not.

**Also excluded:** real managers, real club owners, real referees, real commentators, real agents. Same analysis.

---

## 6. Platform rules

**Apple, Guideline 5.2.1:** "Don't use protected third-party material such as trademarks, copyrighted works, or patented ideas in your app without permission, and don't include misleading, false, or copycat representations, names, or metadata in your app bundle or developer name." Note **metadata** — screenshots and keywords count. Rights holders file via Apple's IP dispute web form.

**Google Play, Intellectual Property policy:** no apps infringing IP, and none that "encourage or induce" infringement. Trade mark use "likely to cause confusion" is grounds for suspension.

**What a takedown actually looks like.** A rights holder files a form. Neither platform adjudicates the merits — they forward and act. Notice → app removed or suspended, often within days and sometimes without warning → templated email → we must produce proof of authorisation or a legal justification. Copyright notices carry a DMCA counter-notice route; **trade mark complaints do not** — only an appeal into a support queue, slower and less predictable. Google's guidance for a suspended app is to resubmit under a **new package name**: new listing, zero reviews, zero rank, broken installs. That is closer to a business-ending event than a legal skirmish — and it can be triggered by one junior brand-protection analyst, no lawsuit required.

---

## 7. The safe zone — what we CAN do

Everything that makes football *feel* like football, minus the branding:

- **Fictional clubs with real-feeling identities** — invented names, invented crests, invented nicknames, invented rivalries and histories.
- **Real cities, towns and regions** — Manchester, Liverpool, Munich, São Paulo. Geographic names are not exclusive. Multiple fictional clubs per real city is realistic *and* protective.
- **Real stadium capacities, geography, altitude, climate and travel distances** — all facts.
- **Real league structures and formats** — 20-team top flights, three up three down, playoffs, group stages into knockouts, two-legged ties, seeding pots, transfer windows, squad registration and homegrown quotas. Formats are not protectable, and copying them exactly is the single largest realism win available to us.
- **Real nationalities and football cultures** — youth-development strengths by country, typical playing styles, work-permit and quota mechanics.
- **Real financial scales** — wage bands, transfer-fee curves, TV-money distribution shapes, FFP-style profitability rules. Calibrate to reality; never quote a named club's accounts as a data feed.
- **Real calendar rhythm** — August-to-May seasons, midweek continental nights, international breaks, January window.

Done properly, that is 90% of the realism at 0% of the licence cost.

---

## 8. Generated player names

Build a name generator from **frequency tables of forenames and surnames per nationality**, sourced from public civil-registry and census-style name-frequency data — not from squad lists. Scraping a squad list is how a real player accidentally enters the database.

Guard against collisions:

1. Maintain a **blocklist of full-name collisions** — every player in the top ~40 leagues plus retired greats plus current managers, held internally *only* as a rejection filter, never as game data.
2. Reject on **full name**, not on components. "Marcus" and "Rashford" are both common; "Marcus Rashford" is one person.
3. Add a **weighted-collision rule**: reject if the generated name matches a blocklisted name *and* nationality *and* position *and* a birth year within ±3. That combination is what makes a name identify a person.
4. Accept that **ordinary-name collisions will happen** and are fine. There are many real people called Ryan Murphy. Risk arrives only with fame plus context.
5. **Ship a rename button** on every player, so a user-reported collision is fixable by the user immediately.
6. **When it happens by chance** — and it will, and someone will screenshot it — treat it as a content bug, not a legal event. Blocklist the name, ship a patch that regenerates that player in existing saves, respond once and factually ("procedurally generated, coincidental, fixed"), and never joke about it. A documented, fast collision-fix process is the best evidence of good faith we can have.

---

## 9. AI-generated art

Two separate risks, often confused.

**We may not own it.** The US Copyright Office's 2025 report reaffirms that human authorship is required, that purely AI-generated output is not copyrightable, and that prompting alone — however detailed — does not create authorship. Only human contributions are protectable. A raw generated crest is therefore effectively unprotected in the US: anyone could clone our club identities with limited recourse for us. The fix is real human authorship — an artist redraws, recomposes and finishes every shipped asset, with layered source files kept as evidence.

**We may generate someone else's mark.** Image models trained on the web can reproduce recognisable crests, sponsor logos, kit patterns and real faces. An AI-generated crest that happens to look like a real club's badge infringes exactly as much as if we had traced it — intent is irrelevant. Same for portraits: a generated face that resembles a specific living footballer creates likeness exposure in the US and false-endorsement exposure in the UK.

**Mitigations:** never prompt with a real club, competition, brand or player name; reverse-image-search every crest before it ships; have a human sign off each asset against a "does this look like anything real?" test; no sponsor-style text on kits; keep prompt logs and edit history for everything shipped.

---

## 10. BUILD RULES

*The one page engineers, designers and artists work from. If a rule below is broken, the build does not ship.*

1. **No real club names** anywhere in shipped data, code, comments, asset filenames, test fixtures, or seed scripts.
2. **No real club crests** — not copied, not traced, not redrawn, not "in the style of".
3. **No real competition names or logos.** No "Premier League", "Champions League", "World Cup", "UEFA", "FIFA", or their marks, in any language.
4. **No real player names.** Zero. Including retired players, legends, and one-off easter eggs.
5. **No real managers, owners, referees, commentators or agents.**
6. **No real player photographs or likenesses**, and no generated portrait that resembles a specific person.
7. **No real kit designs or manufacturer marks.** Generic templates, generic patterns, no swooshes, no sponsors.
8. **No real stadium names.** Fictional names on fictional grounds.
9. **Real cities, real geography, real capacities, real climate — always allowed.** Use them heavily; this is where realism is free.
10. **Real competition formats — always allowed.** Copy structures, calendars, promotion/relegation, group stages, squad rules and windows exactly.
11. **Generate our own fixture lists** from our own format rules. Never ingest, scrape or bundle a commercial fixture or stats feed.
12. **Name generation runs off public name-frequency data by nationality**, never off squad lists.
13. **Every generated name passes the collision filter** (full name + nationality + position + birth year ±3) before it can enter a save.
14. **Every AI-generated asset is human-finished** by an artist, with layered source files retained.
15. **Every AI-generated crest is reverse-image-searched** and human-signed-off before shipping.
16. **Never prompt an image model with a real club, competition, brand or player name.** Prompt logs are kept.
17. **Store listing metadata is sacred.** No real club, league, competition or player names in the app name, subtitle, keywords, description, screenshots, or promo video. Apple 5.2.1 covers metadata explicitly.
18. **Ship a first-class editor, say nothing about real names.** No links to, hosting of, promotion of, or bundling of third-party "real names" packs. No official partnership with a modding site. Never mention real names in marketing, support macros, or social replies.
19. **Community moderation:** we do not host renaming packs on our servers, in our Discord file channels, or in any in-game download hub.
20. **Trade mark sweep before every release.** Automated grep of the shipped database, string tables and asset names against the blocklist, run in CI. A hit fails the build.
21. **Any letter from a club, league, federation, union or platform goes straight to the founder and to a solicitor.** Nobody on the team replies directly, not even informally.
22. **Name collisions are content bugs.** Blocklist, patch, regenerate, respond once, factually. Document the fix.

---

## Sources

- [Apple App Store Review Guidelines — §5.2 Intellectual Property](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play — Intellectual Property policy](https://support.google.com/googleplay/android-developer/answer/9888072?hl=en)
- [LawInSport — Sega's battle against Man Utd in Football Manager trade mark case ends in settlement](https://www.lawinsport.com/topics/item/sega-s-battle-against-man-utd-in-football-manager-trade-mark-case-ends-in-settlement)
- [Mishcon de Reya — Brands in sports video games: why Football Manager might be the exception](https://www.mishcon.com/news/brands-in-sports-video-games-whyfootball-managermight-be-the-exception)
- [PC Gamer — Manchester United sues Football Manager over trademark infringement and mod support](https://www.pcgamer.com/manchester-united-sues-football-manager-over-trademark-infringement-and-mod-support/)
- [CMS — Football fixture lists: has the final whistle been blown for database copyright?](https://cms.law/en/gbr/legal-updates/football-fixture-lists-has-the-final-whistle-been-blown-for-database-copyright)
- [SCL — Football Dataco: no database copyright protection for fixture lists](https://www.scl.org/2407-football-dataco-no-database-copyright-protection-for-fixture-lists/)
- [Crowell & Moring — Ninth Circuit on Keller v Electronic Arts](https://www.crowell.com/en/insights/client-alerts/the-ninth-circuit-court-of-appeals-finds-that-the-use-of-college-football-player-s-likeness-in-a-video-game-is-not-protected-by-the-first-amendment-as-a-matter-of-law)
- [ABA — The Right of Publicity in Video Games Plays Hardball with the First Amendment](http://apps.americanbar.org/litigation/committees/intellectual/articles/winter2014-1213-right-of-publicity-video-games-first-amendment.html)
- [Keystone Law — Passing off: no carte blanche for celebrity image rights (Rihanna v Topshop)](https://keystonelaw.com/keynotes/passing-off-no-carte-blanche-for-celebrity-image-rights/)
- [5RB — Irvine v Talksport Ltd](https://www.5rb.com/case/irvine-v-talksport-ltd/)
- [FIFPro — Commercial / collective licensing](https://www.fifpro.org/en/who-we-are/commercial)
- [Fordham IPLJ — FIFA: How does the most successful sports video game obtain player image rights?](http://www.fordhamiplj.org/2021/11/11/fifa-how-does-the-most-successful-sports-video-game-obtain-player-i-rights/)
- [SportsPro — Ibrahimović's EA Sports tweets fuel player image rights dispute](https://www.sportspro.com/news/ibrahimovic-bale-fifa-ea-sports-player-image-rights/)
- [Premier League — IP Enforcement Policy](https://www.premierleague.com/en/ip-enforcement-policy)
- [Sports Illustrated — Piemonte Calcio: 7 of the worst team names in unlicensed football video games](https://www.si.com/soccer/2019/07/17/piemonte-calcio-7-worst-team-names-unlicensed-football-video-games)
- [Jones Day — Copyrightability of AI outputs: US Copyright Office analyzes human authorship requirement (2025)](https://www.jonesday.com/en/insights/2025/02/copyrightability-of-ai-outputs-us-copyright-office-analyzes-human-authorship-requirement)
- [US Copyright Office — Copyright and Artificial Intelligence](https://www.copyright.gov/ai/)
