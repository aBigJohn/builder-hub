# Kickoff — what to supply when starting a project

Open a session in the **workspace root** and paste something like:

> Neues Projekt: **<was es ist>**.
> Läuft auf/in **<Programm, Plattform oder Umgebung + Version>**, Technik **<z. B. TypeScript, Python, C++>**.
> Umfang für den Anfang: **<erste Funktion>**, später **<…>**.
> Vorbilder / Material: <Links, Screenshots, Ordner>.
> Leg es an und mach einen Architektur-Entwurf.

## What happens next

1. Scaffold `projects/<name>/` (`new-project.ps1`)
2. **Survey before building:** run a minimal "hello world" on the real target and
   write down what was MEASURED (versions, API limits, how reload works). RETRO lesson 1.
3. Architecture draft in `_instructions/architecture.md` → **show the user, then commit to it**
4. Break the work into tasks in `notes/TASKS.md` (milestones as `##` groups). Each task small
   enough for one builder, big enough to be worth one (see root CLAUDE.md)
5. First feature end-to-end (smallest useful slice), with a numbered user test list
6. Iterate: one change per test round; `/handoff` at the end of every session
7. Milestone done → user says *"update the guides"* → lessons promoted

Backups are routine, not on request: a rolling one-step-back snapshot before every delivery, and
**offer** a milestone backup when a major goal is reached.
