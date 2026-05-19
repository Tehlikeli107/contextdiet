# contextdiet

[![CI](https://github.com/Tehlikeli107/contextdiet/actions/workflows/ci.yml/badge.svg)](https://github.com/Tehlikeli107/contextdiet/actions/workflows/ci.yml)
![Agent Context Score](https://img.shields.io/badge/agent_context-100%2F100-brightgreen)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Your coding agent is only as good as the context you feed it.

`contextdiet` scans `AGENTS.md`, `CLAUDE.md`, Cursor rules, Copilot instructions, Agent Skills, and MCP configs for stale, noisy, contradictory, or risky context.

Think Lighthouse for AI coding-agent context.

```bash
npx github:Tehlikeli107/contextdiet scan --root .
npx github:Tehlikeli107/contextdiet score --root .
npx github:Tehlikeli107/contextdiet fix --safe --root .
```

After the npm package is published, the commands become:

```bash
npx contextdiet scan
npx contextdiet score
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
node ./bin/contextdiet.js scan --root .
```

Fail CI when the score drops below 90:

```bash
node ./bin/contextdiet.js scan --root . --strict --threshold 90
```

Generate a README badge:

```bash
node ./bin/contextdiet.js badge --root .
```

Try the intentionally noisy demo fixture:

```bash
node ./bin/contextdiet.js scan --root examples/noisy-agent-context
```

## Commands

| Command | Purpose |
| --- | --- |
| `scan` | Print a full human-readable report |
| `score` | Print compact score output |
| `badge` | Print a Shields.io markdown badge |
| `fix --safe` | Apply conservative whitespace-only cleanup |

Common options:

| Option | Purpose |
| --- | --- |
| `--root <path>` | Scan a specific repository root |
| `--json` | Print machine-readable JSON for `scan` and `score` |
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

## GitHub Actions

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
      - run: npx github:Tehlikeli107/contextdiet scan --root . --strict --threshold 90
```

## JSON Output

```bash
npx github:Tehlikeli107/contextdiet scan --root . --json
npx github:Tehlikeli107/contextdiet score --root . --json
```

## Safe Fixes

`fix --safe` only applies low-risk formatting cleanup:

- trims trailing whitespace
- collapses more than two consecutive blank lines

It does not delete instructions, rewrite MCP config, change permissions, or invent new agent docs.

## Local Development

```bash
npm test
npm run scan
npm run score
npm run badge
```

## Roadmap

- GitHub Action wrapper with first-class annotations
- SARIF output for code scanning integrations
- configurable rule weights in `contextdiet.config.json`
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
