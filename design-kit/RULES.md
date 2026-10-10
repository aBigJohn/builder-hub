# Crew costume rules (pixel art for the builder-hud crabs)

Six builder crabs share one look: Clawd, the orange Claude Code mascot, in a costume with props.
You design one costume as a JSON spec. Everything you need is in this folder (`design-kit`).

## Canvas

- 26 columns (x 0-25) by 11 rows (y 0-10). A pixel is drawn 1 wide and 1.25 tall.
- Clawd is fixed and drawn by the renderer; do not draw him yourself:
  - rows 4, 5 and 7: body x 7-18
  - row 6: x 5-20 (left claw x 5-6, right claw x 19-20)
  - row 8: legs at x 8, 10, 15, 17 (his feet stand on row 8)
  - eyes at (9, 5) and (16, 5)
- Free space: rows 0-3 above him; columns 0-4 left of him and 21-25 right of him (on row 6
  only 0-4 and 21-25, the claws take 5-6 and 19-20).
- Rows 9-10 are only for something he stands ON (an island). Otherwise leave them empty.
- Things standing on the ground beside him have their lowest pixel on row 8, like his feet.

## Layers (fields of the spec)

- `sprite`: worn and held things, drawn OVER Clawd. While he works, the sprite bobs with him.
  You may paint over his body for costume parts (headband on row 4, eye patch, hair on row 4),
  but keep him recognisable: both eyes visible (an eye patch may cover one), all four legs,
  and both claws (a held grip may cover part of one claw).
- `scene`: things that stand on the ground or that he stands on, drawn BEHIND Clawd. They never
  move. Use it for barrels, animals sitting beside him, islands, trees, piles of coins.
- `held`: a string of palette keys whose pixels move with the nearest claw while he works
  (x < 13 = left claw, else right), one unit up and back, twice a second. Use it for things he
  holds (pistol, flag on a pole, sword, pickaxe). Give held things their own palette keys and do
  not reuse those keys for anything else.
- `palette`: single-character keys to hex colours. `.` means empty. At most about 8 colours.
- `label` (only where the brief asks for written text): `{ "text", "x", "y", "w", "h", "color" }`,
  a box in canvas units (x, y = top-left cell, w, h in cells). The app writes the text there as
  real SVG text; the preview draws it with a block font. Reserve a flat area for it.
- Every row string is exactly 26 characters. `sprite` and `scene` have at most 11 rows (fewer is
  fine; missing rows are empty).

## Look

- Bold, simple pixel shapes that still read at the real size: 31 px wide in the prompt band and
  47 px in the crew pane (the bottom row of the preview shows both). One highlight colour per
  prop at most; no dithering, no single stray pixels.
- The app runs on dark (#1a1b26 / #262624) and light (#faf9f5) backgrounds. Black or very dark
  things need a lighter edge or highlight (#71717A to #9CA3AF) to show on dark; white things need
  a contrasting neighbour to show on light. Check both previews every time.
- Saturated, clean colours that fit the crew. Props stay in proportion: Clawd's body is 12-16
  wide and 5 rows tall; a prop beside him is at most about 5 wide and 6 rows tall.
- `accent` is the costume's signature colour (name colour in the crew list): readable on dark,
  not near-black, not near-white.
- No text drawn with pixels; use `label`.

## Tools

- Render: `python render_crab.py <spec.json> <out.png>` (Python 3, stdlib only) then look at the
  PNG. Top left has a grid with column numbers on top and row numbers on the left.
- Lineup of all designs: `python render_crab.py --lineup designs <out.png>`.
