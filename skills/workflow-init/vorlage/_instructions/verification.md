# Verification — proving something works

"It compiled" and "the tool said OK" are not proof. Proof is a check that would have failed if the
change were wrong.

## The ladder (cheapest first)

1. **Read back** what was written (file exists, size, hash, the changed value is really there).
2. **Diff against the last good state** — only the intended lines/bytes changed.
3. **Automated check / test** — and run it once against a known-bad input (control) so you know
   it can fail.
4. **Run it on the real target** — {{how: load the dev build, open the page, run the script, ...}}.
5. **User test** — a numbered list of exactly what to look at, one change per round.

## Rules

- Mark results MEASURED with date and method in `notes/STATE.md`.
- Visual problem not moving after one attempt → garish test (red, huge, obvious) to prove the
  change reaches the screen.
- A parameter with "no effect" → probe 0 / the extreme first.
- Never sample/test exactly on a grid, boundary or default value only; offset the test input.
- Approved output: prove it is unchanged after a rebuild (hash or diff), don't assume it.

## Test documents / fixtures

| Fixture | What it tests | Where |
|---|---|---|
| {{...}} | {{...}} | {{...}} |

## User test list template

```
Bitte testen:
1. <exact action> → expected: <result>
2. ...
```
