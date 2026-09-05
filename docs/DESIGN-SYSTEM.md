# Design system (locked)
Modern flat vector, high information density, dark shell. No bevels, no skeuomorphic chrome, no CRT scanlines, no glass.
- Palette: only tokens from src/design/palette.ts / tokens.css. Shell = slate/indigo (shell0–shell3, border).
  Interactive + energy = cyan (accent / techAccent). Warning = amber (warn). Critical = red (critical). OK = xcomVisor green.
  Faction rule: cyan/sky = technology & energy; violet/indigo = alien organic & alien-made; olive green = X-COM personnel;
  slate = structure & metal. Never cyan for X-COM personnel, never green for alien material.
- Type: IBM Plex Sans for UI text, IBM Plex Mono for every numeric readout (tabular by construction).
  Scale (exactly five): 12 caption / 14 body / 16 control / 20 title / 28 display. Baseline on the 8pt grid.
  Register: terse military UI text, upper-case section labels, no exclamation marks.
- Spacing: 8pt grid (S.x1=8 … S.x4=32). Panels: shell1 fill, 1px border, radius 3. Inset padding 8 or 16.
- Touch: minimum hit area 44×44 CSS px on everything. Visible pressed state (accent fill at 20% + border accent).
  No hover states. Long-press = context menu. Two-finger tap = original right-click.
- Battlescape: isometric fixed angle, flat fills with one shading step per face (west faces darker), 1px darker
  edge lines only where silhouettes need separating. Level controls and End Turn as dedicated buttons.
- Geoscape: filled-polygon globe, ocean = water, land = grass/sand family, thin atmospheric rim in accent at 30%.
- Motion: functional only. Transitions ≤150 ms. Battlescape animations must not delay a turn beyond the walk/shot
  itself; `prefers-reduced-motion` disables all non-essential motion; ?test=1 disables all.
- Accessibility: WCAG AA contrast (text ≥4.5:1 vs its panel), state never colour-only (always icon or text too),
  scalable UI mode (1.0 / 1.25) in Options.
