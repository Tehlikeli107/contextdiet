# Contextdiet MVP Design

## Purpose

Contextdiet is an open-source CLI that measures and improves AI coding-agent context quality. It targets repositories that use `AGENTS.md`, `CLAUDE.md`, Cursor rules, Copilot instructions, Agent Skills, and MCP configuration files.

The first public promise is:

> Your coding agent is only as good as the context you feed it. Measure, trim, and prove it.

## Problem

Agent configuration is becoming common, but more context is not always better. Public research on repository context files shows that generic context can reduce task success and increase inference cost. At the same time, developer adoption of AI coding agents is high while trust is low. Teams need a simple local check that tells them whether their agent context is useful, stale, noisy, risky, or contradictory.

## MVP Scope

The MVP ships as a Node CLI with three commands:

- `contextdiet scan`: analyze the current repository and print a human-readable report.
- `contextdiet score`: print only the numeric score and summary counts.
- `contextdiet fix --safe`: apply conservative fixes that cannot change project behavior.

The MVP scans these surfaces:

- `AGENTS.md`
- `CLAUDE.md`
- `.cursor/rules/*.md` and `.cursor/rules/*.mdc`
- `.github/copilot-instructions.md`
- `**/SKILL.md`
- `.mcp.json` and `.cursor/mcp.json`

## Scoring Model

The score starts at 100 and subtracts points for findings:

- Missing agent entrypoint: 10
- Stale path reference: 8
- Stale command reference: 8
- Conflicting instruction: 7
- Repeated instruction: 4
- Context bloat: 6
- Risky MCP permission or command: 10
- Skill metadata problem: 6

The minimum score is 0. Findings include severity, rule id, file path, message, and optional safe fix.

## Safe Fixes

The MVP only applies reversible, low-risk text cleanup:

- Trim trailing whitespace.
- Collapse more than two consecutive blank lines.
- Remove exact duplicate adjacent bullet lines.

It does not delete semantic content, rewrite instructions, change MCP permissions, or generate new context files in the first release.

## Architecture

The CLI is split into focused modules:

- `src/cli.js`: command parsing, output, exit codes.
- `src/scanner.js`: file discovery and orchestration.
- `src/analyzers.js`: deterministic rules for markdown, skills, commands, paths, and MCP config.
- `src/scoring.js`: score calculation and summary.
- `src/fixes.js`: safe fix planning and application.
- `src/format.js`: human and JSON output.

No external runtime dependencies are required for the MVP. Tests use Node's built-in `node:test` runner.

## Data Flow

1. The CLI resolves the repository root from the current directory or `--root`.
2. The scanner discovers known context files.
3. Analyzers emit normalized findings.
4. Scoring converts findings into a single score and category counts.
5. Formatters render the report.
6. `fix --safe` asks `fixes.js` for safe edits and writes only files with changed content.

## Error Handling

Invalid command usage exits with code 2. Scanner/runtime errors exit with code 1. A scan with findings exits with code 0 in local mode, because findings are advisory. A future `--strict` flag can fail CI when score falls below a threshold.

## Testing

Tests cover:

- Discovery of supported context files.
- Detection of stale path and command references.
- Detection of repeated and conflicting instructions.
- Detection of risky MCP config.
- Score calculation.
- Safe fix behavior.
- CLI smoke behavior for `scan`, `score`, and `fix --safe`.

## Out of Scope For MVP

- Hosted service.
- VS Code extension.
- Session log ingestion.
- LLM-based semantic judgment.
- Running real coding agents for benchmarks.
- Network calls.

These are future layers once the deterministic CLI is useful and trusted.
