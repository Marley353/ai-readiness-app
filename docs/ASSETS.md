# Asset conventions (ASSET-REF option B: canonical modern flat vector)
Sources: assets/svg/**.svg (hand-authored) and assets/gen/*.mjs (procedural generators). All rasterised by
`npm run atlas` at 2× (device pixels for DPR 2) into public/atlas/<page>.png + .json (Pixi spritesheet format).
Nearest-neighbour sampling; sprites are displayed at integer multiples (1× = 64 CSS px for a 32-unit viewBox).

Key naming (atlas frame names):
- Units: `unit/<body>/<facing 0-4>/<anim>` where body ∈ xcom-none, xcom-personal, xcom-power, xcom-flying,
  sectoid, floater, snakeman, muton, ethereal, chryssalid, silacoid, celatid, reaper, cyberdisc, sectopod,
  zombie, civilian-m, civilian-f, tank-cannon, tank-rocket, tank-laser, hovertank-plasma, hovertank-launcher.
  Facings 0..4 = N, NE, E, SE, S; facings 5..7 are runtime mirrors of 3,2,1. anim ∈ idle, walk0, walk1, fire,
  hit, fall0, fall1, dead, kneel (kneel only for xcom-* and humanoid aliens). 2×2 units use 48×48 viewBox.
  Rank marks: `mark/<rank>` small overlays for alien ranks; X-COM rank chevrons `rank/<rookie..commander>`.
- Terrain shapes (white/grey masters, tinted at runtime): `shape/floor`, `shape/floor-rough`, `shape/wall-n`,
  `shape/wall-w`, `shape/wall-n-window`, `shape/wall-w-window`, `shape/door-n`, `shape/door-w`, `shape/fence-n`,
  `shape/fence-w`, `shape/half-wall-n`, `shape/half-wall-w`, `shape/pillar`, `shape/crate`, `shape/rock`,
  `shape/bush`, `shape/tree-trunk`, `shape/tree-canopy`, `shape/cactus`, `shape/snowbank`, `shape/table`,
  `shape/chair`, `shape/bed`, `shape/console`, `shape/ufo-wall-n`, `shape/ufo-wall-w`, `shape/ufo-door-n`,
  `shape/ufo-door-w`, `shape/ufo-floor`, `shape/nav-console`, `shape/power-source`, `shape/lift`, `shape/rubble`,
  `shape/crater`, `shape/roof`, `shape/stairs-n`, `shape/stairs-w`, `shape/hedge-n`, `shape/hedge-w`, `shape/car`,
  `shape/lamp`, `shape/road-line`, `shape/alien-wall-n`, `shape/alien-wall-w`, `shape/alien-floor`,
  `shape/alien-door-n`, `shape/alien-door-w`, `shape/alien-pod`, `shape/xcom-wall-n`, `shape/xcom-wall-w`,
  `shape/xcom-floor`, `shape/xcom-door-n`, `shape/xcom-door-w`. Master colour: #ffffff for lit face, #b3b3b3
  for the single shading step; edges #808080. Floors are 64×32 diamonds (source 32×16), walls 64×80 (32×40).
- Items: `item/<item id>` 32×32 viewBox (inventory icon, 64 px). Floor-dropped items reuse the icon at 0.5×.
- Facilities: `facility/<facility id>` 32×32 (size-1) or 64×64 (size-2), plus `facility/construction`.
- Craft & UFOs: `craft/<craft id>` 48×48 nose-up; `ufo/<ufo id>` 48×48; `ufo/<ufo id>-wreck` 48×32.
- Geoscape markers: `geo/base`, `geo/ufo`, `geo/ufo-landed`, `geo/crash`, `geo/terror`, `geo/alien-base`, `geo/craft`, `geo/waypoint`.
- Effects: `fx/bullet`, `fx/laser`, `fx/plasma`, `fx/rocket`, `fx/blaster`, `fx/explosion0-5`, `fx/smoke0-3`,
  `fx/fire0-2`, `fx/stun0-2`, `fx/psi0-2`, `fx/flare`, `fx/hit`, `fx/muzzle`, `fx/impact-wall`.
- UI icons (24×24 viewBox, rendered 48): `icon/<name>` — see src/ui/icons.ts list.
Every asset: flat vector forms, limited palette from tokens only, clean silhouette at 64 px, glow only on energy
(baked as a soft halo polygon or `<filter>`, never CSS drop-shadow). No gradients-heavy 3D look, no photographic
or painterly imagery, nothing derived from any existing game's assets.
