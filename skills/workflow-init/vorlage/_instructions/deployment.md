# Deployment / delivery — read before the FIRST delivery of anything

## Targets

| # | Target | What it means | Who triggers it |
|---|---|---|---|
| A | {{local dev install}} | {{e.g. copy the build where the target loads it / run the dev server}} | {{Claude may do this freely?}} |
| B | {{testers / shared folder}} | {{...}} | {{user only}} |
| C | {{store / marketplace / git release}} | {{...}} | {{user only}} |

## Rules

1. **Ask which target** whenever the request does not name one and more than one is possible.
   "Mach das mal live" is not an answer once A/B/C exist.
2. **Stay on the target a project started on** until the user says otherwise; write the current
   target at the top of the project's `notes/STATE.md`.
3. **Back up before overwriting** an installed/released version (rolling one-step-back snapshot).
4. **Standing permissions** the user gave (e.g. "lokal darfst du jederzeit neu laden") are written
   into `notes/STATE.md` / memory with date and exact scope. They never extend to other targets.
5. After every delivery: say in the reply what went where, and give a numbered test list.
6. Git: {{who runs git; if the user runs it, hand over ready-to-paste commands with a short commit message}}

## Per-target procedure

### A — {{local}}
```
{{steps / script}}
```

### B — {{...}}

### C — {{...}}
