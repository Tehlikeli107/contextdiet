# Contextdiet Launch Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the remaining high-impact v0.1 launch surface: CI thresholds, badge output, contributor docs, GitHub templates, and examples.

**Architecture:** Keep behavior zero-dependency and deterministic. Extend the existing CLI parser and formatter instead of introducing a new framework.

**Tech Stack:** Node.js ESM, built-in `node:test`, GitHub Actions, Markdown/YAML documentation.

---

## File Structure

- Modify: `src/cli.js` for `--strict`, `--threshold`, and `badge`.
- Modify: `src/format.js` for badge markdown and badge color helpers.
- Modify: `test/cli.test.js` for red-green coverage of new CLI behavior.
- Modify: `README.md`, `.github/workflows/ci.yml`, and `package.json` for launch polish.
- Create: `CHANGELOG.md`, `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`.
- Create: `.github/ISSUE_TEMPLATE/*` and `.github/pull_request_template.md`.
- Create: `examples/noisy-agent-context/*` for a small demo repository.

### Task 1: CI Threshold And Badge CLI

- [ ] Write failing tests for `scan --strict --threshold`, invalid threshold usage, and `badge`.
- [ ] Run `npm test -- test/cli.test.js` and verify RED.
- [ ] Implement parser support, strict exit codes, and badge formatting.
- [ ] Run `npm test -- test/cli.test.js` and verify GREEN.

### Task 2: Launch Documentation

- [ ] Add badges, CI usage, GitHub Action example, demo fixture instructions, and roadmap to README.
- [ ] Add changelog, contributing, security, code of conduct, issue templates, and PR template.
- [ ] Update package keywords and CI workflow to run contextdiet itself with a score threshold.

### Task 3: Final Verification

- [ ] Run `npm test`.
- [ ] Run `node ./bin/contextdiet.js scan --root . --strict --threshold 90`.
- [ ] Run `node ./bin/contextdiet.js badge --root .`.
- [ ] Run `node ./bin/contextdiet.js scan --root examples/noisy-agent-context`.
- [ ] Run `npm pack --dry-run`.
- [ ] Commit, push, and verify GitHub repository status.

## Self-Review

Spec coverage: This plan covers the launch-critical items left after the MVP: CI adoption, trust surface, community templates, and an example users can run.

Placeholder scan: No placeholders are present.

Type consistency: New public CLI behaviors are `badge`, `--strict`, and `--threshold`, all scoped to existing scan/score flow.
