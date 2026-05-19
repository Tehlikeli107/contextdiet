# contextdiet

Your coding agent is only as good as the context you feed it.

`contextdiet` scans `AGENTS.md`, `CLAUDE.md`, Cursor rules, Copilot instructions, Agent Skills, and MCP configs for stale, noisy, contradictory, or risky context.

Think Lighthouse for AI coding-agent context.

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
Score: 82/100
Files scanned: 2
Findings: 2

Findings:
- [warning] stale-command AGENTS.md: Referenced npm script "missing" is not defined in package.json.
- [warning] stale-path AGENTS.md: Referenced path "docs/missing.md" does not exist.
```

## JSON Output

```bash
npx contextdiet scan --json
npx contextdiet score --json
```

## Safe Fixes

`fix --safe` only applies low-risk formatting cleanup:

- trims trailing whitespace
- collapses more than two consecutive blank lines

It does not delete instructions, rewrite MCP config, change permissions, or invent new agent docs.

## Local Development

```bash
npm test
node ./bin/contextdiet.js scan --root .
node ./bin/contextdiet.js score --root .
```

## Vision

The long-term goal is an open, local-first quality standard for AI-agent context:

- CI badge for agent context quality
- session-log analysis for Claude Code, Codex, Cursor, and Gemini CLI
- before/after context benchmarks
- safer skill and MCP lifecycle checks
- team policies for agent context drift

The first release stays small on purpose: scan, score, and safe cleanup.
