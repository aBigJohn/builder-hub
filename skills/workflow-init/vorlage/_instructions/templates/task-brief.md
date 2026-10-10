# Builder brief — template

A builder knows nothing of the chat. Everything it needs goes into the brief.

**Agent call:** the builder-hud plugin's builder (`subagent_type: "builder-hud:builder"`), `run_in_background: true`,
`description: "<Name>: <task in a few words>"`. The name picks the crab costume in the band:
Carlos, Herby, Maurice, Diddy, Jeffrey, Bibi. Mark the task `[~]` in `notes/TASKS.md` when it starts.

**Prompt:**

```
Project: projects/<name>/ — read notes/STATE.md first (Key facts, Bugs already solved).
Task (from TASKS.md): <the line>
Done when: <observable result>
Files you may change: <paths>
Do not touch: <paths / areas>
Facts you need (MEASURED): <values, paths, versions>
Check before reporting: <exact command, test or read-back>
```

**When the report comes back:** verify it yourself (read back / run the check), then `[x]` in
TASKS.md and new facts, bugs and lessons into STATE.md. Not verified = stays `[~]`.
