# Contextdiet v0.3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Markdown reporting, the `doctor` diagnosis command, and opt-in GitHub Action pull request comments.

**Architecture:** Keep scanning and scoring unchanged. Add diagnosis derivation in a focused `src/doctor.js` module, render new outputs through `src/format.js`, and keep GitHub API behavior inside `src/action.js` helper functions that are easy to test with fake fetch.

**Tech Stack:** Node.js 20 ESM, built-in `node:test`, existing no-dependency CLI and GitHub Action.

---

### Task 1: Markdown Scan Output

**Files:**
- Modify: `test/cli.test.js`
- Modify: `src/cli.js`
- Modify: `src/format.js`

- [ ] **Step 1: Write the failing test**

Add a CLI test that runs `scan --format markdown` and expects `## Contextdiet report`, score text, and a findings table row with a rule id.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/cli.test.js`

Expected: FAIL because `--format` is ignored and Markdown is not implemented.

- [ ] **Step 3: Implement minimal code**

Add `formatMarkdownReport(scan)` to `src/format.js`, parse `--format`, validate allowed values, and route `scan` output through the selected formatter.

- [ ] **Step 4: Verify**

Run: `node --test test/cli.test.js`

Expected: PASS.

### Task 2: Doctor Command

**Files:**
- Create: `src/doctor.js`
- Modify: `test/cli.test.js`
- Modify: `src/cli.js`
- Modify: `src/format.js`

- [ ] **Step 1: Write failing tests**

Add tests for `doctor`, `doctor --json`, and `doctor --format markdown`.

- [ ] **Step 2: Run test to verify failure**

Run: `node --test test/cli.test.js`

Expected: FAIL because `doctor` is not recognized.

- [ ] **Step 3: Implement minimal code**

Create a diagnosis object with status, grouped findings, and recommendations. Add text and Markdown formatters.

- [ ] **Step 4: Verify**

Run: `node --test test/cli.test.js`

Expected: PASS.

### Task 3: GitHub Action PR Comments

**Files:**
- Modify: `test/action.test.js`
- Modify: `src/action.js`
- Modify: `action.yml`

- [ ] **Step 1: Write failing tests**

Add tests for Markdown action args, PR comment body generation, new comment creation, existing comment update, and skip behavior when no pull request payload exists.

- [ ] **Step 2: Run test to verify failure**

Run: `node --test test/action.test.js`

Expected: FAIL because helpers and inputs do not exist.

- [ ] **Step 3: Implement minimal code**

Add `comment` input, build stable comment bodies, read pull request event payloads, and upsert comments with injected `fetch`.

- [ ] **Step 4: Verify**

Run: `node --test test/action.test.js`

Expected: PASS.

### Task 4: Docs and Release Prep

**Files:**
- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Modify: `package.json`
- Add: `docs/release-notes/v0.3.0.md`

- [ ] **Step 1: Update docs**

Document `scan --format markdown`, `doctor`, and Action `comment: true`.

- [ ] **Step 2: Bump version**

Set package version to `0.3.0`.

- [ ] **Step 3: Full verification**

Run:

```bash
npm test
node ./bin/contextdiet.js scan --root . --strict --threshold 90
node ./bin/contextdiet.js doctor --root examples/noisy-agent-context --format markdown
npm publish --access public --dry-run
```

Expected: all commands exit 0 except strict scans only fail when intentionally below threshold.
