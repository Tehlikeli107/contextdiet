# Changelog

All notable changes to contextdiet are documented here.

## 0.2.0 - 2026-05-19

### Added

- `init` command for creating a starter `contextdiet.config.json`.
- `--help` and `--version` CLI support.
- `contextdiet.config.json` support for `threshold`, `ignoredRules`, and rule `weight` overrides.
- `scan --sarif` for SARIF 2.1.0 output.
- Reusable GitHub Action with `root`, `threshold`, and `format` inputs.
- JSON schema for contextdiet configuration.

## 0.1.0 - 2026-05-19

### Added

- Initial `scan`, `score`, `badge`, and `fix --safe` CLI commands.
- Discovery for `AGENTS.md`, `CLAUDE.md`, Cursor rules, Copilot instructions, `SKILL.md`, `.mcp.json`, and `.cursor/mcp.json`.
- Deterministic findings for stale commands, stale paths, repeated instructions, conflicting instructions, skill metadata problems, risky MCP commands, and invalid MCP JSON.
- Strict CI threshold support with `--strict --threshold`.
- JSON output for `scan` and `score`.
- Launch README, CI workflow, docs, and noisy example fixture.
