# Traps — when something silently did nothing

Environment traps (shell, build tool, host program) that cost time. Same format as all lessons.
Two inherited ones that bite on Windows in almost every project:

### A path with `[` `]` returns nothing in PowerShell
**Symptom:** `Get-ChildItem` / `Copy-Item` on a folder like `[local]` finds no files, no error.
**Cause:** brackets are wildcard syntax in PowerShell paths.
**Rule:** use `-LiteralPath` for every path that can contain brackets.
**Verified:** inherited from the source workspace.

### Text written by a script has the wrong encoding / line endings
**Symptom:** umlauts broken, or a diff shows every line changed.
**Cause:** PowerShell 5.1 defaults to ANSI/UTF-16 depending on the cmdlet; Python on Windows
writes CRLF in text mode.
**Rule:** write files with explicit UTF-8 (no BOM) and an explicit newline; keep the existing
line endings of a file you edit.
**Verified:** inherited from the source workspace.

---

<!-- Add this project's traps below. -->
