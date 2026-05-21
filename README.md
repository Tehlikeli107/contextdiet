# contextdiet

[![CI](https://github.com/Tehlikeli107/contextdiet/actions/workflows/ci.yml/badge.svg)](https://github.com/Tehlikeli107/contextdiet/actions/workflows/ci.yml)
![Agent Context Score](https://img.shields.io/badge/agent_context-100%2F100-brightgreen)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Your coding agent is only as good as the context you feed it.

`contextdiet` scans `AGENTS.md`, `CLAUDE.md`, Cursor rules, Copilot instructions, Agent Skills, and MCP configs for stale, noisy, contradictory, or risky context.

Think Lighthouse for AI coding-agent context.

```bash
npx contextdiet scan
npx contextdiet doctor
npx contextdiet score
npx contextdiet badge
npx contextdiet init
npx contextdiet fix --safe
```

## Why

AI coding agents are moving from demos into real repositories, but repo-level context can quietly make them worse:

- stale commands send agents down dead paths
- missing files waste tool calls
- repeated rules burn context
- conflicting instructions lower trust
- risky MCP commands expand blast radius
- bloated context increases token spend

`contextdiet` starts with deterministic local checks. No API keys, no network calls, no model judgment.

## Quick Start

Scan the current repository:

```bash
npx contextdiet scan --root .
```

Diagnose the highest-impact context debt:

```bash
npx contextdiet doctor --root .
```

Fail CI when the score drops below 90:

```bash
npx contextdiet scan --root . --strict --threshold 90
```

Generate a Markdown report for GitHub comments or issues:

```bash
npx contextdiet scan --root . --format markdown
```

Generate a README badge:

```bash
npx contextdiet badge --root .
```

Create a starter config:

```bash
npx contextdiet init --root .
```

Try the intentionally noisy demo fixture:

```bash
npx contextdiet scan --root examples/noisy-agent-context
```

## Commands

| Command | Purpose |
| --- | --- |
| `scan` | Print a full human-readable report |
| `doctor` | Diagnose top context debt groups and next actions |
| `score` | Print compact score output |
| `badge` | Print a Shields.io markdown badge |
| `init` | Create `contextdiet.config.json` if it does not exist |
| `fix --safe` | Apply conservative whitespace-only cleanup |
| `--help` | Print usage |
| `--version` | Print package version |

Common options:

| Option | Purpose |
| --- | --- |
| `--root <path>` | Scan a specific repository root |
| `--json` | Print machine-readable JSON for `scan`, `doctor`, and `score` |
| `--sarif` | Print SARIF 2.1.0 output for `scan` |
| `--format <text\|json\|sarif\|markdown>` | Select scan output format |
| `--strict` | Exit 1 when score is below threshold |
| `--threshold <0-100>` | Score threshold for strict mode, default `90` |

## What It Checks

| Surface | Files |
| --- | --- |
| Agent instructions | `AGENTS.md`, `CLAUDE.md` |
| IDE rules | `.cursor/rules/*.md`, `.cursor/rules/*.mdc` |
| Copilot | `.github/copilot-instructions.md` |
| Agent Skills | `**/SKILL.md` |
| MCP | `.mcp.json`, `.cursor/mcp.json` |

## Findings

The MVP detects:

- `missing-entrypoint`: no primary agent instruction surface
- `stale-command`: referenced `npm run` script does not exist
- `stale-path`: referenced local path does not exist
- `repeated-instruction`: exact repeated bullet instruction
- `conflicting-instruction`: simple positive/negative instruction conflict
- `skill-metadata`: missing `name` or `description` in `SKILL.md`
- `risky-mcp-command`: suspicious MCP command patterns
- `invalid-mcp-json`: invalid MCP JSON

## Example

```text
Contextdiet report
Score: 84/100
Files scanned: 1
Findings: 2

Findings:
- [warning] stale-command AGENTS.md: Referenced npm script "missing" is not defined in package.json.
- [warning] stale-path AGENTS.md: Referenced path "docs/missing.md" does not exist.
```

Doctor output prioritizes the next useful cleanup:

```text
Contextdiet doctor
Score: 84/100
Status: watch
Threshold: 90
Files scanned: 1

Top problems:
- stale-command: 1 finding, 8 point penalty, first seen in AGENTS.md
- stale-path: 1 finding, 8 point penalty, first seen in AGENTS.md

Next steps:
1. Restore missing npm scripts or update the instructions that reference them.
2. Update or remove local file references that no longer exist.
```

## GitHub Actions

Use contextdiet as a reusable action with pull request comments:

```yaml
name: Agent Context

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read
  issues: write
  pull-requests: write

jobs:
  contextdiet:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: Tehlikeli107/contextdiet@v0.3.0
        with:
          root: .
          threshold: 90
          format: markdown
          comment: true
```

Or run the CLI directly:

```yaml
name: Agent Context

on:
  pull_request:
  push:
    branches: [main]

jobs:
  contextdiet:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version: 24
      - run: npx contextdiet scan --root . --strict --threshold 90
```

## Machine Output

```bash
npx contextdiet scan --root . --json
npx contextdiet score --root . --json
npx contextdiet doctor --root . --json
npx contextdiet scan --root . --format markdown
npx contextdiet scan --root . --sarif > contextdiet.sarif
```

## Configuration

Create `contextdiet.config.json` in the repository root with `contextdiet init`, or write it manually:

```json
{
  "$schema": "./schema/contextdiet.schema.json",
  "threshold": 90,
  "ignoredRules": [],
  "rules": {
    "stale-command": {
      "weight": 8
    },
    "risky-mcp-command": {
      "weight": 10
    }
  }
}
```

CLI `--threshold` overrides the config threshold. `ignoredRules` removes matching findings before scoring.

## Safe Fixes

`fix --safe` only applies low-risk formatting cleanup:

- trims trailing whitespace
- collapses more than two consecutive blank lines

It does not delete instructions, rewrite MCP config, change permissions, or invent new agent docs.

## Local Development

```bash
npm test
npm run scan
npm run doctor
npm run score
npm run badge
```

## Roadmap

- GitHub Action annotations and richer summaries
- SARIF upload workflow examples
- session-log analysis for Claude Code, Codex, Cursor, and Gemini CLI
- before/after context benchmarks
- safer skill and MCP lifecycle checks
- team policies for agent context drift

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Keep rules deterministic, local-first, and covered by tests.

## Security

See [SECURITY.md](SECURITY.md). Please report suspected vulnerabilities privately.

## License

MIT
