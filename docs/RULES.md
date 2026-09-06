# Rules bible — mechanics of the 1994 original as implemented

Confidence tags: [exact] documented values reproduced; [close] reproduced from OpenXcom's reverse-engineering, which
matches the original in play; [approximate] simplified where the original's exact behaviour is undocumented.
Values live in `src/data/*.ts`; formulas in `src/battle/*.ts`, `src/geoscape/sim.ts`, `src/soldiers/roster.ts`.

## Battlescape — time units and movement
- Walking costs the destination tile's TU cost: 4 on open ground, 5–8 on rough ground, fields, mud, rubble. [exact]
- Diagonal steps cost 1.5× the tile cost, rounded down (4 → 6). [exact]
- Turning costs 1 TU per 45°; kneeling 4 TU, standing 8 TU. [exact]
- Energy per step is half the TU cost (rounded down); flying units and HWPs spend none. [approximate]
- TU recovery at turn start is the full maximum, scaled by strength ÷ carried weight when overloaded; each leg
  wound removes 10 % of recovery; energy recovery = initial TU ÷ 3, each torso wound −10 %. [close]
- Doors open when walked through (+2 TU); UFO doors close again at the end of the full turn. [close]
- Level changes need a lift or stairs tile (6 TU); flying units move freely in three dimensions. [approximate]
- Vision: 20 tiles by day, 9 at night unless the tile is lit by a flare or fire; orthogonal facings see the
  half-plane in front, diagonal facings the quadrant; dense smoke blocks sight after three tiles. [close]

## Firing
- TU cost = floor(max TU × mode %). Rifle snap 25 %/60, aimed 80 %/110, auto 35 %/35 ×3; Heavy Plasma auto 35 %/50,
  snap 30 %/75, aimed 60 %/110; all weapon tables in `items.ts`. [exact]
- Accuracy = firing accuracy × mode accuracy ÷ 100, ×1.15 kneeling, ×0.8 firing a two-handed weapon with the other
  hand occupied, −10 % per wounded arm (max −50 %). [exact except the arm penalty, which is approximate]
- Shot deviation follows the original's model (OpenXcom `Projectile::applyAccuracy`): xy/z shifts from the
  voxel distances, deviation = rand(0–100) − accuracy, +50 on a miss / +10 on a hit, scaled by the range shift. [close]
- Misses continue to the first wall, object or floor they meet and damage it (destroyed when the damage roll
  meets the part's armour); explosive ammunition explodes on impact. [close]

## Damage
- Damage roll is uniform 0–200 % of listed power; multiplied by the target's damage modifier for the type; the
  armour on the hit side is subtracted and worn down by a tenth of the damage that got through. [exact / close]
- Stun weapons and smoke add stun only; other hits add a quarter of their damage as stun. [close]
- A hit that does health damage causes 1–3 fatal wounds when rand(0–10) < damage; each wound bleeds 1 HP per turn;
  the medi-kit's heal setting closes one wound and restores 3 HP. [close]
- Unconscious at stun ≥ health; stun recovers 1 per turn; death at health ≤ 0 drops all items and leaves a corpse.
  Chryssalid victims become zombies; zombies hatch a Chryssalid; Cyberdiscs explode; Silacoids leave fire. [exact]

## Explosions, fire, smoke and grenades
- Blast power falls 10 per tile outward and is reduced by the armour of walls it passes; units in the blast take
  50–150 % of the power at their tile; terrain parts with armour ≤ power are destroyed; power sources chain-explode
  at 180 power. [close]
- HE leaves smoke; incendiary starts fires by flammability; stun bombs leave a stun cloud; smoke chokes units
  standing in it at the end of the turn; fires burn down and spread to flammable neighbours. [close]
- Priming costs 50 % TU, throwing 25 % TU; range = 2.5 × strength ÷ weight; timers count down at the end of each
  X-COM turn and explode at 0; proximity grenades arm on landing and fire when a unit moves adjacent. [exact / close]
- Blaster Launcher: up to eight waypoints, 200 HE at the end of the path (or the first obstacle). [exact]

## Reaction fire
- Reaction score = reactions × current TU ÷ max TU. Every enemy that sees the acting unit and whose score is higher
  fires one snap shot (highest score first) provided it has the TU and a line of fire; the check repeats after each
  shot until nobody qualifies. Reserved TU are respected. [exact]

## Morale, panic and psionics
- Morale starts at 100. Taking damage costs (damage × (110 − bravery) ÷ 10) ÷ 10, divided by the squad's
  leadership modifier (100 + 10/15/25/50 for a surviving sergeant/captain/colonel/commander). [close]
- A death costs every surviving unit on that side rankModifier × 200 × ((110 − bravery) ÷ 10) ÷ leadership ÷ 100,
  where rank modifiers are rookie 100 … commander 300 (aliens soldier 100 … commander 300); the other side gains
  10 × rankModifier ÷ 100; the killer gains 20. [close]
- Turn start: if 100 − 2 × morale > rand(1–100) the unit breaks — one third berserk (fires wildly, spends all TU),
  two thirds panic (TU zeroed, may drop its weapon); passing a check with a real chance gives bravery experience. [exact]
- Psionic attack strength = psi strength × psi skill ÷ 50 − distance ÷ 2 + 45 (panic) or 25 (control) + rand(0–55);
  defence = psi strength + psi skill ÷ 5; success when attack > defence. Control lasts until the victim's side's next
  turn; panic removes 100 − bravery ÷ 2 morale. Aliens may target any soldier an alien has seen. [close]

## Soldiers
- Recruits: TU 50–60, stamina 40–70, health 25–40, bravery 10–60 (steps of 10), reactions 30–60, firing 40–70,
  throwing 50–80, strength 20–40, psi strength 0–100 hidden until a Psionic Laboratory exists, psi skill 0. [exact]
- Growth per mission from experience counters: ≥11 → +2–6, ≥6 → +1–4, ≥3 → +1–3, ≥1 → +0–1; bravery +10 with
  (bravery counter × 10) % chance; TU/stamina/health/strength grow a little whenever any experience was gained;
  caps TU 80, stamina 100, health 60, bravery 100, reactions 100, firing/throwing/melee 120, strength 70. [close]
- Ranks by squad size: Squaddie after a mission; Sergeants per 5, Captains per 11, Colonels per 23, one Commander at
  30+ soldiers; highest-scoring soldiers promoted first. [exact]
- Wound recovery: roughly one to two days per point of health lost. [approximate]
- Salaries: soldier $20,000 (+$5,000 per rank), scientist $30,000, engineer $25,000; hiring $40,000 / $30,000 / $25,000. [exact / close]

## Geoscape
- Compression steps 5 s, 1 min, 5 min, 30 min, 1 h, 1 day; every event halts the clock. [exact]
- Radar: small 1,500 km at 10 % per 30 min, large 2,250 km at 20 %, Hyper-wave Decoder 2,400 km at 100 % with race
  and mission revealed; craft radar 672 km; contact is lost outside all coverage. [exact]
- Craft fly at their maximum speed in knots; conventional craft burn speed ÷ 100 fuel every 10 minutes, Elerium
  craft 1 unit; a craft turns back automatically when the fuel left just covers the return leg. [close]
- Interception: cautious holds at the longest weapon's range, standard at the shortest, aggressive closes to the
  minimum; hit chance = weapon accuracy × UFO size modifier; UFO destroyed at 100 % damage, crashes at 50 %;
  crash sites last 24–72 hours. [close]
- Alien missions run in waves (`missions.ts`); terror ships land at a city and the site lasts 36–72 hours (−500 if
  ignored); infiltration ends in a pact; base missions found alien bases that run supply missions monthly; retaliation
  scouts that pass within 200 km of a base mark it for a battleship assault, met first by base defences. [close]
- Monthly: funding per country moves 5–20 % towards the side winning that region (X-COM score ÷ 10 + local
  activity versus alien score ÷ 20 + local activity), capped at twice the initial range; salaries, maintenance and
  craft rent deducted; two consecutive months at or below the difficulty threshold (−1,000 … −600) or a negative
  balance at month end end the campaign. [close]
- Starting position: $6,000,000, 8 soldiers, 10 scientists, 10 engineers, one Skyranger, two Interceptors
  (Stingray + Cannon), the original's starting stores and base layout. [exact / close]

## Research and manufacturing
- Progress = scientists × days; topics need their prerequisites, the recovered item (consumed for live aliens) and,
  for hidden topics, a lead from an interrogation. Laser Weapons 50 → Laser Pistol 100 → Rifle 300 → Heavy 460 →
  Laser Cannon 500; UFO Construction 450 needs alloys, power source and navigation; New Fighter Craft 600 →
  Fighter-Transporter 700 → Ultimate Craft 900; Alien Origins → The Martian Solution → Cydonia or Bust via leaders
  and commanders. [exact / close]
- Manufacture: hours ÷ engineers per unit; cost and materials paid per unit; workshop space = project space +
  engineers; craft need a free hangar. Laser Cannon $182,000 / 300 h sells for $211,000. [exact]

## Difficulty
- Alien crews per UFO by difficulty (`ufos.ts`); Veteran and above add 10–30 % firing accuracy and 5–15 % armour;
  Genius and Superhuman add health; mission cadence rises with difficulty; the council threshold tightens. [approximate]
