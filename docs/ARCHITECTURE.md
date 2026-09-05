# Architecture and contracts

Unaffiliated homage to UFO: Enemy Unknown (1994). Mechanics faithful to the original; presentation modern flat vector.
Stack: TypeScript + Vite + PixiJS 8 (single WebGL renderer for everything incl. UI) + Howler + IndexedDB. No backend.

## Layout and ownership
```
src/design/      palette.ts (Pixi colours), tokens.css, type.ts, spacing.ts  — LOCKED, do not edit
src/data/        types.ts (LOCKED contracts) + rules tables: items.ts aliens.ts ufos.ts craft.ts facilities.ts
                 research.ts manufacture.ts countries.ts regions.ts missions.ts terrain.ts score.ts names.ts
src/core/        rng.ts events.ts state.ts save.ts clock.ts difficulty.ts   — shared runtime
src/app/         App.ts (Pixi boot, DPR cap, safe-area, resize) SceneManager.ts input.ts (gestures) testHooks.ts
src/ui/          kit.ts — Panel, Button, Label, Readout, ListView, Gauge, Modal, Toolbar, TabBar, layout helpers
src/render/      atlas.ts (sprite lookup) iso.ts (iso maths)
src/geoscape/    sim.ts (alien missions, UFOs, detection, craft flight, funding, monthly report) GeoscapeScene.ts globe.ts
src/base/        sim.ts (facilities, build, capacity, purchase/sell/transfer) BaseScene.ts and sub-screens
src/intercept/   sim.ts InterceptScene.ts
src/battle/      types.ts (LOCKED) mapgen.ts units.ts move.ts los.ts turn.ts fire.ts damage.ts explode.ts
                 reaction.ts morale.ts psi.ts ai.ts missions.ts BattleScene.ts (renderer + touch HUD)
src/soldiers/    roster.ts (stats, growth, ranks, memorial) SoldiersScene.ts
src/inventory/   layout.ts (paper doll slots, grid fit, weight, TU costs) InventoryScene.ts
src/research/    sim.ts ResearchScene.ts   src/manufacture/ sim.ts ManufactureScene.ts   src/ufopaedia/ articles.ts UfopaediaScene.ts
src/debrief/     score.ts DebriefScene.ts MonthlyReportScene.ts
src/scenes/      MenuScene.ts NewGameScene.ts SaveLoadScene.ts OptionsScene.ts GameOverScene.ts VictoryScene.ts
src/audio/       sfx.ts (Howler wrapper; keys listed in docs/AUDIO.md)
assets/svg/      hand-authored SVG (reference/ has the five ASSET-REF sprites, ids namespaced)
assets/gen/      *.mjs procedural SVG generators: export default () => Array<{name:string, svg:string, scale?:number}>
tools/atlas/     build-atlas.mjs → public/atlas/<page>.png + .json (Pixi spritesheet). Run: npm run atlas
tools/audio/     build-audio.mjs → public/audio/*.wav (procedural synth). Run: npm run audio
tools/critics/   Playwright critic scripts at iPad viewports → screenshots/ + progress.html
tests/           vitest rule tests (fidelity) — tests/rules/*.test.ts
```
Each builder owns its directory. Shared files (design/, data/types.ts, battle/types.ts, core/state.ts) are locked; if a
contract must change, add optional fields only and note it in docs/CHANGELOG-CONTRACTS.md.

## Runtime contracts
- `App` (src/app/App.ts): `boot(): Promise<void>`, `app.pixi: Application`, `app.root: Container`, `app.w`, `app.h`
  (CSS px), `app.safe: {top,right,bottom,left}`, `app.dpr` (capped at 2). Resize emits `bus.emit('resize')`.
- `Scene` interface: `mount(root: Container, params?: any): void; unmount(): void; update(dt: number): void;
  resize(w: number, h: number): void`. Register with `scenes.register(name, factory)`; navigate with
  `scenes.show(name, params)`; `scenes.back()`; `scenes.current`.
- Gestures (src/app/input.ts): `attachGestures(target: Container, h: GestureHandlers)` where handlers are
  `tap(x,y)`, `longPress(x,y)`, `twoFingerTap(x,y)`, `pinch(scale, cx, cy)`, `pan(dx,dy,fingers)`, `panEnd()`.
  Every interactive control must have a ≥44×44 CSS-px hit area (kit enforces it).
- Kit (src/ui/kit.ts): all UI is built from these. Colours only via `P` from src/design/palette.ts. Sizes only
  via `T` (type scale: 12/14/16/20/28) and `S` (8pt grid) from src/design/type.ts and spacing.ts.
- Atlas (src/render/atlas.ts): `await loadAtlases()`, `tex('key')`, `sprite('key')`, `has('key')`, `frames('prefix')`.
  Sprite keys are documented in docs/ASSETS.md. Never rasterise SVG at runtime.
- State (src/core/state.ts): one serialisable `GameState` object `G` (`getState()`), mutated by sims, saved as
  JSON. No class instances or functions inside state. Dates are ms since epoch (UTC), campaign starts 1 Jan 1999.
- Events (src/core/events.ts): typed `bus.on/emit/off`. Geoscape auto-halts on every event listed in `GeoEvent`.
- RNG (src/core/rng.ts): `rng.int(min,max)` inclusive, `rng.percent(p)`, `rng.pick(arr)`, `rng.float()`.
  Campaign RNG is seeded from state so replays are deterministic; battle uses its own seeded stream.
- Test hooks (src/app/testHooks.ts): with `?test=1` the app exposes `window.__ufo` = `{ state, scenes, bus,
  newCampaign(difficulty, seed), advance(seconds), battle: {...api}, skipAnimations: true }`. Critics rely on it.
- Audio (src/audio/sfx.ts): `sfx.play(key)`, `sfx.music(key)`, keys listed in docs/AUDIO.md; safe to call before
  the first user gesture (queued/ignored).

## Scene flow
Menu → NewGame (difficulty) → Geoscape (place first base by tap) ↔ Base / Research / Manufacture / UFOpaedia /
Soldiers / Inventory. Geoscape → Intercept → (crash/landed site) → Battle → Debrief → Geoscape.
Monthly roll → MonthlyReport. Bankruptcy / council withdrawal → GameOver. Cydonia stage 2 win → Victory.

## Battlescape coordinates
Tiles are `x,y,z`; map sizes 40/50/60 square, 4 levels. Voxel space: 16 voxels per tile edge, 24 per level.
Facing 0 = north (up-left on screen) increasing clockwise to 7. Isometric: TILE_W=64, TILE_H=32, LEVEL_H=48 CSS px.
Screen x = (x - y) * 32, screen y = (x + y) * 16 - z * 48 (see src/render/iso.ts).
