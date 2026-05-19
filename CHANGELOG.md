# Changelog

All notable changes to contextdiet are documented here.

## 0.1.0 - 2026-05-19

### Added

- Initial `scan`, `score`, `badge`, and `fix --safe` CLI commands.
- Discovery for `AGENTS.md`, `CLAUDE.md`, Cursor rules, Copilot instructions, `SKILL.md`, `.mcp.json`, and `.cursor/mcp.json`.
- Deterministic findings for stale commands, stale paths, repeated instructions, conflicting instructions, skill metadata problems, risky MCP commands, and invalid MCP JSON.
- Strict CI threshold support with `--strict --threshold`.
- JSON output for `scan` and `score`.
- Launch README, CI workflow, docs, and noisy example fixture.
