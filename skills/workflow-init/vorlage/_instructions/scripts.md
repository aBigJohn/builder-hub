# Scripts — inventory of ready-made tools

**Read before writing any new script.** If a tool already does it, use or extend it.

Every script starts with a header comment: what it does, an example call, and what it checks.
A script that writes files must read its result back and fail loudly if it does not match.

| Script | Where | Does | Example |
|---|---|---|---|
| `new-project.ps1` | `_instructions/` | scaffolds `projects/<name>/` from `templates/` | `.\_instructions\new-project.ps1 -Name my_plugin` |
| {{...}} | {{...}} | {{...}} | {{...}} |
