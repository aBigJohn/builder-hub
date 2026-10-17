# Builder brief — template

A builder knows nothing of the chat. Everything it needs goes into the brief.

**Agent call:** `subagent_type: "builder-hud:builder-medium"` (Sonnet, the default), or
`builder-hud:builder` (Opus) for an ambiguous bug or a design decision; `run_in_background: true`,
`description: "<Name>: <task in a few words>"`. The name picks the crab costume in the band:
Carlos, Herby, Maurice, Diddy, Jeffrey, Bibi. Mark the task `[~]` in `notes/TASKS.md` when it starts.

**Prompt:** the main chat fills every field itself, from the code. It asks the user only
what the code cannot answer (a wish, a decision).

```
Project: projects/<name>/ — read notes/STATE.md first (Key facts, Bugs already solved).
Task (from TASKS.md): <the line>
Steps: <numbered, in order: what to change where, and why>
Pattern to follow: <an existing file or function that does something similar>
Edge cases: <special cases the change must handle>
Done when: <observable result>
Files you may change: <paths>
Do not touch: <paths / areas>
Facts you need (MEASURED): <values, paths, versions>
Check before reporting: <exact command, test or read-back>
```

**When the report comes back:** verify it yourself (read back / run the check), then `[x]` in
TASKS.md and new facts, bugs and lessons into STATE.md. Not verified = stays `[~]`.
