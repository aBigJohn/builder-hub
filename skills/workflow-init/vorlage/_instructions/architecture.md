# Architecture — {{TOOL_NAME}}

Open this before changing structure, adding a module, or touching an interface.
Keep it current: a structural change is not finished until this file says so.
Mark every statement about the target (program, platform, runtime) **MEASURED** (tried it) or **ASSUMED** (docs/guess).

## Purpose in one paragraph

{{WHAT_THE_TOOL_DOES_AND_FOR_WHOM}}

## Target integration

| Item | Value | Status |
|---|---|---|
| Target (program / platform / runtime) + version | {{TARGET}} | ASSUMED |
| Technology | {{e.g. plugin API, framework, engine}} | ASSUMED |
| Language / build | {{e.g. TypeScript + bundler}} | ASSUMED |
| How a dev build is run or loaded | {{...}} | ASSUMED |
| Minimum supported target version | {{...}} | ASSUMED |

## Modules

```
{{project}}/
  src/
    {{module_a}}/      <- responsibility, inputs, outputs
    {{module_b}}/      <- ...
  tests/
  {{BUILD_DIR}}/       <- build product (only place the build writes to)
```

| Module | Responsibility | Talks to |
|---|---|---|
| {{...}} | {{...}} | {{...}} |

## Data flow

```
{{user action}} -> {{UI}} -> {{core logic}} -> {{target API}} -> {{result}}
```

## Interfaces that must stay stable

- {{public function / file format / settings schema}} — why it must not change silently

## Decisions (short log)

| Date | Decision | Why | Alternatives rejected |
|---|---|---|---|
| {{DATE}} | {{...}} | {{...}} | {{...}} |

## Known limits of the target

- {{...}} (MEASURED / ASSUMED)
