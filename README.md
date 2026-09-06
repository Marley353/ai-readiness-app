# Enemy Unknown — an unaffiliated homage

A browser-playable recreation of the 1994 turn-based strategy classic, built for iPad (Safari, landscape, installable
as a PWA). Mechanics follow the original's rules and numbers; presentation is a modern flat-vector design system.
No assets, text or code from the original or any remake are used — every sprite, sound and article is generated here.

## Run
```
npm install
npm run atlas     # rasterise the SVG generators into public/atlas (Chromium at /opt/pw-browsers/chromium or Playwright's)
npm run audio     # synthesise every sound into public/audio
npm run dev       # http://localhost:5173
npm run build     # static site in dist/
npm test          # rules tests (vitest), including the 20-rule fidelity sample
```
Critics (Playwright at iPad viewports): `npx vite preview --port 4173` then `node tools/critics/run-all.mjs <n> "<note>"`.
Results and screenshots accumulate in `progress.html`.

## Layout
See `docs/ARCHITECTURE.md` (contracts), `docs/DESIGN-SYSTEM.md` (locked tokens), `docs/ASSETS.md` (sprite keys),
`docs/RULES.md` (mechanics with confidence tags) and `docs/CHANGELOG-CONTRACTS.md`.

## Touch
Tap selects; tap a tile to preview the route and TU cost, tap again to move; tap a visible alien to fire; long-press a
tile for the action menu; two-finger tap is the original's right-click (turn to face / open a soldier's kit);
pinch zooms (1× / 2×), drag pans; dedicated buttons for level up/down, kneel, reserve TU, end turn and abort.
Backgrounding pauses the campaign and writes an autosave.
