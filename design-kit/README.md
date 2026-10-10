# Crew design kit

The six crab costumes are designed as JSON specs in `designs/` (rules: `RULES.md`) and generated
into `hooks/crabs.ts` between the `// <designs: ...>` marker lines. Never edit those lines by hand.

Run from the mod folder (Python 3, stdlib only; on Windows `py -3` instead of `python`):

1. Preview one spec: `python design-kit/render_crab.py design-kit/designs/4-diddy.json out.png`
   (grid view, dark/light, prompt-band and crew-pane size). Lineup: `--lineup design-kit/designs out.png`.
2. Generate the TS: `python design-kit/build_designs_ts.py design-kit/designs hooks/crabs.ts`
3. Check: `claude plugin validate .` and `claude plugin test .` (`tests/crabs.test.ts` checks row
   widths, palette keys, held props and the scene layer).
4. Gallery as the app draws it: copy `gallery-dump.test.ts.txt` to `tests/gallery.test.ts`, run
   `claude plugin test . > dump.txt` (the dump test fails on purpose and prints the SVGs), move the
   file out of `tests/` again, then `python design-kit/build_gallery.py dump.txt gallery.html`.
5. README-Bilder (`docs/`): copy `docs-dump.test.ts.txt` to `tests/docs.test.ts`, run
   `claude plugin test . > dump.txt` (fails on purpose, prints what the mod draws for demo data),
   move the file out of `tests/` again, then `python design-kit/build_docs.py dump.txt docs`
   (needs Pillow and Microsoft Edge for the headless screenshots).
