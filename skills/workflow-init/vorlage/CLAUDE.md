# {{WORKSPACE_NAME}} — Arbeitsbereich

Read this first. It is auto-loaded for every project under `projects/`.
{{ONE_SENTENCE_WHAT_IS_BUILT_HERE}}

## Hard rules

0. **Read `_instructions/RETRO.md` at the start of every session, before the first real action.**
   It is the list of mistakes already paid for. Short, and the best-value read in the workspace.
   (Main chat only. Builders skip it: their brief carries what they need.)
1. **Target: {{WHERE_IT_RUNS_AND_VERSION}} on {{OS}}.** If several versions are installed, never
   guess which one — the paths are in `_instructions/toolchain.md`.
2. **Back up before overwriting anything that already works** (an installed build, a release, a
   user file). One-step-back snapshot in `backups/` or next to the file as `*.bak`.
3. **Measure, don't assume.** A number or behaviour written in a notes file is a *claim*. Verify it
   against the real thing before building on it. Label every fact **MEASURED** or **ASSUMED**.
4. **Ask before destructive or outward-facing steps** — deleting data, overwriting a working file,
   publishing, releasing, sending anything to other people. Build and test locally freely.
5. **The build product always lands in `projects/<name>/{{BUILD_DIR}}/`.** Everything else is
   packaging on top. **Delivery targets are not interchangeable: {{DELIVERY_TARGETS}}. If more
   than one exists, ASK which one whenever it is not explicit**, and once a project has started on
   one, stay on it until told otherwise. Read `_instructions/deployment.md` before the first delivery.
6. **Never read base64 / embedded binary data** (images inside HTML, JSON, notebooks). It costs a
   huge amount of tokens and shows nothing. Strip it, read the rest, say what was skipped.
7. **Do not scan these folders:** {{FOLDERS_NEVER_TO_SCAN}}. Large libraries, vendor SDKs and
   self-contained sub-projects (with their own `CLAUDE.md`) are worked on only from a session
   opened *inside* them.
8. **Git:** {{GIT_RULE}}  <!-- e.g. "the user runs git himself - hand him the commands, never commit/push" -->

## Working style

- Replies: {{LANGUAGE_AND_STYLE}}  <!-- e.g. "short, German; to-dos and test steps as numbered lists" -->
- Show results, don't describe them: screenshots/renders/logs go to the user as files.
- One preview per change; ask before producing more (they cost time on the user's machine).
- Second failed attempt at a visual fix: switch to an unmistakable test (garish colour, giant
  value) before tuning further. A parameter that "does nothing" is probed at 0 first.
- Big multi-agent runs only after agreeing on the plan and rough cost. Try the cheap route first.

## Coordinator and builders

Comes with the **builder-hud** plugin: the crab band above the prompt and the `builder` agent type
(listed as `builder-hud:builder`).

- **The main chat coordinates:** talks with the user, plans, keeps `notes/TASKS.md` and
  `notes/STATE.md`, checks results. **Small fixes it does itself** (one file, a few lines,
  nothing to explore).
- **Bigger work goes to a builder:** a fresh background agent per task, empty context. Bigger = several files, a lot of reading, or several steps. Then ask the user:
  *"Soll ich daraus eine Builder-Aufgabe machen?"* The user decides.
- **One task, one brief.** A builder knows nothing of the chat: write the brief from
  `_instructions/templates/task-brief.md`. Description starts with a crew name (`Diddy: ...`).
- **A builder's "done" is a claim.** Verify it (`verification.md`) before `[x]` in TASKS.md.
  Builders never edit TASKS.md or STATE.md; they report, the main chat records.
- **Parallel builders only on different files**, and more than 3 at once only after asking.
- **Dynamic agents** (on by default, `/dynamisch` turns them off): `builder` (Opus),
  `builder-medium` (Sonnet), `builder-light` (Haiku). Pick the smallest that fits; hard or
  unclear = `builder`. When only `builder` is listed, the mode is off.
- **More than ~5 tasks of the same kind** (e.g. "check every file for X"): propose a Workflow
  instead of single builders, with Haiku for the reading stages and Sonnet for the changes.
  Run it only after the user agrees to the plan and rough cost.

## Layout

```
CLAUDE.md             <- this file
_instructions/        <- shared knowledge + reusable scripts. Text only. NEVER copied into a project.
projects/<name>/      <- one folder per project. Self-contained work, no guideline copies.
  notes/TASKS.md      <- milestones + tasks (the band shows them). Main chat ticks them.
  notes/STATE.md      <- facts, solved bugs, lessons, open questions: the handoff.
tools/                <- shared helper scripts/programs (inventory: _instructions/scripts.md)
backups/              <- the user's own backups. Do not touch.
.claude/commands/     <- /handoff, /update-guides
```

## `_instructions/` index — open only what the task needs

| File | Open it when |
|---|---|
| `toolchain.md` | You need a path, version, SDK, or "which install is this" |
| `architecture.md` | Before changing structure, adding a module, or touching an interface |
| `scripts.md` | Before writing ANY new script — the inventory of ready-made tools |
| `verification.md` | Proving something works — controls, checks, test lists |
| `deployment.md` | **Before the first delivery of anything, and whenever "deploy/release" has no named target** |
| `traps.md` | Something silently did nothing, or reported success and changed nothing |
| `RETRO.md` | **Every session, before acting — hard rule 0.** Again when a debugging loop stops converging |

This index is deliberately not auto-loaded. Pull one file, not all of them.

## Project lifecycle

- **Start:** from this root, `.\_instructions\new-project.ps1 -Name <short_name>`
  (what to supply: `_instructions/templates/kickoff.md`).
- **Continue:** open the session in `projects/<name>/`; read `notes/STATE.md` and
  `notes/TASKS.md` before doing anything. End every session with `/handoff`.
- **Lessons:** knowledge flows one way, project → `_instructions/`, never the reverse or sideways.
  Mid-project, lessons go only into the project's `notes/STATE.md` (*Lessons*), at the moment of
  discovery. `_instructions/` changes only on *"project complete, update the guides"* or
  `/update-guides`: then follow `.claude/commands/update-guides.md`. **This file stays short.**
