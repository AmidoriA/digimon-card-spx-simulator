# Time Stranger themed decks

The owner's theme rebuild on 2026-10-14 supersedes the initial TS-301 exact-replacement
composition rules. The current machine-readable deck source is
`tools/time_stranger_theme_decks.json`. The original candidate audit and base selection
remain archived in `tools/time_stranger_decks.json`; they explain provenance, not the
current 30-card lists.

All fifteen decks contain **R 9 / C 6 / U 3 / Options 12**. Every featured themed group has
**Rookie ×4, Champion ×3 and Ultimate ×3**. No card exceeds four copies. Only the requested
Digimon Specialties appear; Options are colorless and include evolution Options in this
ratio. Original disc decks #0–158 and Black Fire Again #159 stay unchanged.

All seven Sevens cards (#285–291) and Download Digivolve (#293, the requested “Downloader”
ban) are absent. Ordinary effects with a seven-card resource cost are allowed. The new
lists also avoid vanilla support and Option conditions that require a particular own
active Specialty. The deliberate exception is the Wingdramon group's powerful support
for an active Specialty **different from Rare**, supporting its Ice/Nature partners.

## Owners, themes and composition

Each deck retains its existing name, featured-Ultimate owner and prepared illustration.
Its original base provides rank, armor, music and source provenance. These are project
custom decks and effects chosen by the owner, not disc-derived competitive deck designs.

| Deck ID | Featured Ultimate | Digimon Specialties | Copies by Specialty | Base deck ID | Evolution Options |
|---:|---|---|---|---:|---|
| 160 | WarGrowlmon | Fire | Fire 18 | 6 | Speed Digivolve ×3 |
| 161 | Flaremon | Fire | Fire 18 | 42 | Speed Digivolve ×3 |
| 162 | SaviorHuckmon | Fire + Nature | Fire 12, Nature 6 | 27 | Special Digivolve ×3 |
| 163 | MachGaogamon | Ice | Ice 18 | 88 | Speed Digivolve ×3 |
| 164 | Crescemon | Ice + Rare | Ice 12, Rare 6 | 13 | Special Digivolve ×3 |
| 165 | Dragomon | Ice | Ice 18 | 91 | Speed Digivolve ×3; Warp Digivolve ×2 |
| 166 | Taomon | Nature + Rare | Nature 10, Rare 8 | 74 | Special Digivolve ×3 |
| 167 | Rapidmon | Nature | Nature 18 | 73 | Speed Digivolve ×3 |
| 168 | Lilamon | Nature | Nature 18 | 85 | Speed Digivolve ×3 |
| 169 | MetalTyrannomon | Fire + Darkness | Darkness 12, Fire 6 | 6 | Special Digivolve ×3; Speed Digivolve ×2 |
| 170 | Cyberdramon | Darkness + Rare | Darkness 12, Rare 6 | 100 | Special Digivolve ×3; Mutant Digivolve ×1; Speed Digivolve ×2 |
| 171 | Matadormon | Darkness | Darkness 18 | 52 | Speed Digivolve ×3 |
| 172 | Wingdramon | Ice + Rare + Nature | Rare 10, Ice 4, Nature 4 | 38 | Special Digivolve ×4; Mutant Digivolve ×2 |
| 173 | GrapLeomon | Rare + Nature | Rare 10, Nature 8 | 51 | Special Digivolve ×3 |
| 174 | Chirinmon | Rare | Rare 18 | 51 | Speed Digivolve ×3 |

## Evolution access

Evolution follows the existing `web/js/engine.js` `evoLegal` port of disc routine
`0x801e9f5c`. No engine evolution rule changes are needed.

- **Every mixed deck:** at least three Special Digivolve (#295). This genuinely ignores
  Specialty for R→C and C→U, adding 20 to current DP. It does not remove the stage rule.
  The JSON records a legal cross-Specialty route to every Champion and Ultimate, with
  explicit DP cards and costs. Wingdramon has four copies, plus two Mutant Digivolve.
- **Cyberdramon and Wingdramon:** Mutant Digivolve (#296) also changes Specialty at the
  same level while paying the target DP. It is an additional bridge rather than a
  replacement for their Special Digivolve copies.
- **MetalTyrannomon and Cyberdramon:** two Speed Digivolve copies supplement their
  cross-Specialty bridges. These advance the same-color featured group without spending
  DP, improving natural Ultimate access while attack supports compete for resources.
- **Every pure deck:** three Speed Digivolve (#299), which ignores DP when Specialty
  matches and the active stack entered as a Rookie (`abn === 0`). All Champions and
  Ultimates have a matching Rookie-based route recorded in the JSON.
- **Dragomon:** two Warp Digivolve (#297) provide additional same-Specialty R→U access,
  paying the Ultimate DP. Its total of five evolution Options distinguishes fast
  evolution from the other pure decks.

The JSON paths are constructive legality examples, not claims that every opening hand
contains the required cards. Ratio checks, actual evolution execution and match
simulations validate accessibility separately from matchup balance.

## WarGrowlmon — Crimson Fire Again

Spend HP, cards and deck resources for large attack boosts. Tankmon and Chain Saw are deliberate high-risk finishers.

- **Rookie:** Guilmon ×4; Agumon ×3; Biyomon ×2.
- **Champion:** Growlmon ×3; Tankmon ×3.
- **Ultimate:** WarGrowlmon ×3.
- **Options:** Speed Digivolve ×3; Devil's Chip ×3; Mega Hand ×2; Chain Saw ×2; Training Manual ×2.

Owner/portrait: **WarGrowlmon**, card #308. Base provenance:
**Go Go Dinosaur** (#6; original owner Veemon).

## Flaremon — Solar Flame Again

Repeated attack boosts plus draw effects keep the hand stocked; Veemon and the Flaremon group supply both pressure and cards.

- **Rookie:** Coronamon ×4; Veemon ×3; Biyomon ×2.
- **Champion:** Firamon ×3; Akatorimon ×3.
- **Ultimate:** Flaremon ×3.
- **Options:** Speed Digivolve ×3; Attack Chip ×3; Training Manual ×3; Digi-Diamond ×3.

Owner/portrait: **Flaremon**, card #309. Base provenance:
**First Attack** (#42; original owner Birdramon).

## SaviorHuckmon — Brave Fire Revived

Red core with green draw and healing; choose Circle or Triangle and amplify it through the whole Huckmon group.

- **Rookie:** Huckmon ×4; Hawkmon ×3; Muchomon ×2.
- **Champion:** BaoHuckmon ×3; Airdramon ×3.
- **Ultimate:** SaviorHuckmon ×3.
- **Options:** Special Digivolve ×3; Attack Disk ○ ×3; Attack Disk △ ×3; Training Manual ×3.

Owner/portrait: **SaviorHuckmon**, card #310. Base provenance:
**Fire Heart** (#27; original owner Davis).

## MachGaogamon — Lunar Howl Again

Gain HP to unlock favorable own-versus-enemy HP comparisons; recover while behind and gain attack while ahead.

- **Rookie:** Gaomon ×4; Gomamon ×3; Betamon ×2.
- **Champion:** Gaogamon ×3; Frigimon ×3.
- **Ultimate:** MachGaogamon ×3.
- **Options:** Speed Digivolve ×3; Sup. Rec. Floppy ×3; Dark Lord's Cape ×3; Recovery Floppy ×3.

Owner/portrait: **MachGaogamon**, card #317. Base provenance:
**Shoot Everything!** (#88; original owner MetalGarurumon).

## Crescemon — Moonlight Revived

Stall by lowering enemy attack, mill the enemy deck, and recycle the offline pile. Armadillomon and Rockmon reinforce milling.

- **Rookie:** Lunamon ×4; Armadillomon ×3; Gomamon ×2.
- **Champion:** Lekismon ×3; Rockmon ×3.
- **Ultimate:** Crescemon ×3.
- **Options:** Special Digivolve ×3; Digimon Grave ×3; Digimon Analyzer ×3; High Speed Disk ×3.

Owner/portrait: **Crescemon**, card #318. Base provenance:
**Fightback** (#13; original owner Garurumon).

## Dragomon — Deep Sea Revived

Pure Ice fast evolution through five evolution Options, with draw, recycling and attack reduction to keep the engine moving.

- **Rookie:** Syakomon ×4; Gomamon ×3; Betamon ×2.
- **Champion:** Octomon ×3; Seadramon ×3.
- **Ultimate:** Dragomon ×3.
- **Options:** Speed Digivolve ×3; Warp Digivolve ×2; Training Manual ×3; Attack Chip ×2; Recovery Floppy ×2.

Owner/portrait: **Dragomon**, card #319. Base provenance:
**First Aid** (#91; original owner Joe).

## Taomon — Divine Fox Again

Change the enemy Specialty and discard enemy DP to disrupt evolution. Rare partners add DP removal, draw and milling.

- **Rookie:** Renamon ×4; Armadillomon ×3; ClearAgumon ×2.
- **Champion:** Kyubimon ×3; Numemon ×3.
- **Ultimate:** Taomon ×3.
- **Options:** Special Digivolve ×3; Evil Program ×3; Rare Altar ×3; Digimon Grave ×3.

Owner/portrait: **Taomon**, card #326. Base provenance:
**Divine Monster** (#74; original owner Nefertimon).

## Rapidmon — Rapid Hope Again

Force enemy Triangle for zero-power Triangle Counter, and answer enemy Circle with effects that reduce it to zero. Kuwagamon provides another native Triangle Counter.

- **Rookie:** Terriermon ×4; Tentomon ×3; Hawkmon ×2.
- **Champion:** Gargomon ×3; Kuwagamon ×3.
- **Ultimate:** Rapidmon ×3.
- **Options:** Speed Digivolve ×3; Defense Disk ○ ×3; Disrupt Ray ×3; Triangle Hitter ×3.

Owner/portrait: **Rapidmon**, card #327. Base provenance:
**Call of Destiny** (#73; original owner Gatomon).

## Lilamon — Flower Bloom Again

Heal repeatedly and eat enemy HP through attacks. Palmon adds another Eat-up HP attacker, while Gotsumon rewards the HP lead.

- **Rookie:** Lalamon ×4; Palmon ×3; Gotsumon ×2.
- **Champion:** Sunflowmon ×3; Airdramon ×3.
- **Ultimate:** Lilamon ×3.
- **Options:** Speed Digivolve ×3; Dark Bone ×3; Recovery Floppy ×3; Beetle Diamond ×3.

Owner/portrait: **Lilamon**, card #328. Base provenance:
**Flower Fairies** (#85; original owner Lillymon).

## MetalTyrannomon — Dark Steel Again

Dinosaur and machine partners convert HP, hand and DP resources into attack gains. Fire Tyrannomon and Agumon pair with the Darkness machine group.

- **Rookie:** Keramon ×4; Agumon ×3; Kokuwamon ×2.
- **Champion:** Kurisarimon ×3; Tyrannomon ×3.
- **Ultimate:** MetalTyrannomon ×3.
- **Options:** Special Digivolve ×3; Attack Chip ×3; Metal Parts ×2; Speed Digivolve ×2; Training Manual ×2.

Owner/portrait: **MetalTyrannomon**, card #335. Base provenance:
**Go Go Dinosaur** (#6; original owner Veemon).

## Cyberdramon — Machine Fang Again

Balanced Dark/Rare suppression and attack pressure. ClearAgumon voids supports, Starmon complements enemy-Darkness disruption, and Wormmon draws.

- **Rookie:** Monodramon ×4; ClearAgumon ×3; Wormmon ×2.
- **Champion:** Strikedramon ×3; Starmon ×3.
- **Ultimate:** Cyberdramon ×3.
- **Options:** Special Digivolve ×3; Mutant Digivolve ×1; Attack Chip ×2; Training Manual ×3; Silver Ball ×1; Speed Digivolve ×2.

Owner/portrait: **Cyberdramon**, card #336. Base provenance:
**Machine Empire** (#100; original owner Machinedramon).

## Matadormon — Night Dance Again

Explosive effects while behind on HP, backed by repeated revival. Guardromon and the risky Options deliberately lower HP.

- **Rookie:** Dracmon ×4; Sharmamon ×3; Kokuwamon ×2.
- **Champion:** Sangloupmon ×3; Guardromon ×3.
- **Ultimate:** Matadormon ×3.
- **Options:** Speed Digivolve ×3; Miracle Ruby ×3; Chain Saw ×2; Metallic Banana ×2; Recovery Floppy ×2.

Owner/portrait: **Matadormon**, card #337. Base provenance:
**Dark Revival** (#52; original owner Myotismon).

## Wingdramon — Sky Dragon Again

Rare dragon support gives powerful bonuses to active Ice or Nature Digimon; all three Specialties have live evolution targets.

- **Rookie:** Dracomon ×4; Gomamon ×3; Hawkmon ×2.
- **Champion:** Coredramon (Blue) ×3; Airdramon ×2; Seadramon ×1.
- **Ultimate:** Wingdramon ×3.
- **Options:** Special Digivolve ×4; Mutant Digivolve ×2; Attack Chip ×2; Training Manual ×2; Short Lance ×2.

Owner/portrait: **Wingdramon**, card #344. Base provenance:
**Mega Giga** (#38; original owner Gigadramon).

## GrapLeomon — Beast Fist Again

Counterattack with zero-base-power Cross attacks, or use GrapLeomon group supports to turn a selected zero-power attack into a direct attack. Nature partners provide both Circle and Triangle Counter.

- **Rookie:** Bearmon ×4; Salamon ×3; Hawkmon ×2.
- **Champion:** Grizzlymon ×3; Kuwagamon ×3.
- **Ultimate:** GrapLeomon ×3.
- **Options:** Special Digivolve ×3; Golden Banana ×3; Beam Gun ×2; Recovery Floppy ×2; Attack Chip ×2.

Owner/portrait: **GrapLeomon**, card #345. Base provenance:
**Steel Gate** (#51; original owner MetalEtemon).

## Chirinmon — Holy Beast Revived

Attack first and stack attack gains. SandYanmamon adds native first strike, while ClearAgumon protects the attack plan from enemy supports.

- **Rookie:** Kudamon ×4; ClearAgumon ×3; Vi-Elecmon ×2.
- **Champion:** Reppamon ×3; SandYanmamon ×3.
- **Ultimate:** Chirinmon ×3.
- **Options:** Speed Digivolve ×3; Beetle Diamond ×3; Attack Chip ×3; Triangle Hitter ×3.

Owner/portrait: **Chirinmon**, card #346. Base provenance:
**Steel Gate** (#51; original owner MetalEtemon).

## Dependency order and validation

1. Lock the 45 custom card effects in `tools/custom_cards.json` and
   [card-design.md](card-design.md). Names, IDs and Specialties remain stable.
2. Apply the explicit named deck counts from `tools/time_stranger_theme_decks.json`.
   Preserve deck IDs, displayed owners, portraits and base metadata.
3. Regenerate `web/js/data/cards.js` through the normal custom-data exporter. Do not edit
   generated card data by hand.
4. Validate the new lists, copy limits, exact Specialty sets, bans, effect themes and
   evolution routes. Confirm the original 159 decks and Black Fire Again remain intact.
5. Run the repository checks and themed matchup simulations, then inspect the updated
   deck selector, deck preview and a started game in the browser.

Card theme encoding and any required support variable must land before behavioral
checks and deck simulations. Decklist construction itself depends only on stable IDs,
levels, Specialties, PP/DP and the traced evolution rules. The deck changes introduce
no new engine rule and retain no requirement to keep the old Options or exchange counts.
