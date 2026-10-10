# Architecture — {{TOOL_NAME}}

Open this before changing structure, adding a module, or touching an interface.
Keep it current: a structural change is not finished until this file says so.
Mark every statement about the host program **MEASURED** (tried it) or **ASSUMED** (docs/guess).

## Purpose in one paragraph

{{WHAT_THE_TOOL_DOES_AND_FOR_WHOM}}

## Host integration

| Item | Value | Status |
|---|---|---|
| Host program + version | {{HOST}} | ASSUMED |
| Plugin technology | {{e.g. UXP / CEP / native SDK}} | ASSUMED |
| Language / build | {{e.g. TypeScript + bundler}} | ASSUMED |
| How the plugin is loaded for development | {{...}} | ASSUMED |
| Minimum supported host version | {{...}} | ASSUMED |

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
{{user action}} -> {{UI}} -> {{core logic}} -> {{host API}} -> {{result}}
```

## Interfaces that must stay stable

- {{public function / file format / settings schema}} — why it must not change silently

## Decisions (short log)

| Date | Decision | Why | Alternatives rejected |
|---|---|---|---|
| {{DATE}} | {{...}} | {{...}} | {{...}} |

## Known limits of the host program

- {{...}} (MEASURED / ASSUMED)
