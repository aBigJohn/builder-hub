# Toolchain — paths, versions, "which install is this"

Never guess a path or a version. If two installs exist, both are listed here with which one is
the target. Every line: **MEASURED** (checked on this machine, with date) or **ASSUMED**.

| What | Path / version | Used for | Status |
|---|---|---|---|
| Host program | {{...}} | target for testing | ASSUMED |
| SDK / plugin dev tool | {{...}} | loading the dev build | ASSUMED |
| Runtime (Node, Python, compiler) | {{...}} | build | ASSUMED |
| Editor / debugger | {{...}} | | ASSUMED |
| Shell | {{PowerShell / bash}} | scripts | ASSUMED |

## How to check

```
{{commands that print the versions above}}
```
