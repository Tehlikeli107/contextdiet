# Contextdiet MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working zero-dependency Node CLI that scans AI coding-agent context files and reports context quality findings, score, and safe fixes.

**Architecture:** The CLI delegates repository discovery to a scanner, deterministic rules to analyzers, score math to scoring, output to formatters, and conservative file edits to fixes. Each module exposes small pure functions so behavior is easy to test with temporary fixture repositories.

**Tech Stack:** Node.js ESM, built-in `node:test`, built-in `assert`, no runtime dependencies.

---

## File Structure

- Create: `package.json` with bin, scripts, and ESM settings.
- Create: `bin/contextdiet.js` as the executable entrypoint.
- Create: `src/cli.js` for command parsing and process-facing behavior.
- Create: `src/scanner.js` for file discovery and scan orchestration.
- Create: `src/analyzers.js` for deterministic context rules.
- Create: `src/scoring.js` for weighted score calculation.
- Create: `src/fixes.js` for safe fix planning and application.
- Create: `src/format.js` for text and JSON reports.
- Create: `test/*.test.js` for TDD coverage.
- Create: `README.md` for launch positioning and usage.
- Create: `.github/workflows/ci.yml` for test automation.

### Task 1: Project Skeleton

**Files:**
- Create: `package.json`
- Create: `bin/contextdiet.js`
- Create: `src/cli.js`
- Create: `test/cli.test.js`

- [ ] **Step 1: Write the failing CLI smoke test**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runCli } from '../src/cli.js';

test('scan reports an empty repository with a score', async () => {
  const writes = [];
  const result = await runCli(['scan', '--root', fixtureRoot], {
    stdout: (line) => writes.push(line),
    stderr: () => {}
  });
  assert.equal(result.exitCode, 0);
  assert.match(writes.join('\n'), /Contextdiet report/);
  assert.match(writes.join('\n'), /Score:/);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- test/cli.test.js`

Expected: fail because `src/cli.js` does not exist.

- [ ] **Step 3: Add minimal package and CLI code**

```js
export async function runCli(argv, io = {}) {
  const stdout = io.stdout ?? console.log;
  stdout('Contextdiet report');
  stdout('Score: 100/100');
  return { exitCode: 0 };
}
```

- [ ] **Step 4: Run the test and verify GREEN**

Run: `npm test -- test/cli.test.js`

Expected: pass.

### Task 2: Scanner And Findings

**Files:**
- Create: `src/scanner.js`
- Create: `src/analyzers.js`
- Create: `src/scoring.js`
- Create: `test/scanner.test.js`
- Create: `test/analyzers.test.js`

- [ ] **Step 1: Write failing scanner tests**

```js
test('discovers root agent context files and skills', async () => {
  await writeFile(join(root, 'AGENTS.md'), '# Agent rules');
  await mkdir(join(root, 'skills', 'review'), { recursive: true });
  await writeFile(join(root, 'skills', 'review', 'SKILL.md'), '---\nname: review\ndescription: Review code\n---\n');
  const result = await scanRepository(root);
  assert.deepEqual(result.files.map((file) => relative(root, file.path)).sort(), [
    'AGENTS.md',
    'skills/review/SKILL.md'
  ]);
});
```

- [ ] **Step 2: Run scanner tests and verify RED**

Run: `npm test -- test/scanner.test.js`

Expected: fail because `scanRepository` is not implemented.

- [ ] **Step 3: Implement discovery and scan orchestration**

Implement recursive discovery that ignores `.git`, `node_modules`, and `dist`, reads supported files as UTF-8, calls `analyzeFiles`, and returns `{ root, files, findings, score }`.

- [ ] **Step 4: Run scanner tests and verify GREEN**

Run: `npm test -- test/scanner.test.js`

Expected: pass.

### Task 3: Deterministic Rules

**Files:**
- Modify: `src/analyzers.js`
- Modify: `src/scoring.js`
- Modify: `test/analyzers.test.js`

- [ ] **Step 1: Write failing analyzer tests**

```js
test('flags missing referenced paths and commands', async () => {
  const files = [{ path: join(root, 'AGENTS.md'), kind: 'agents', content: '- Run `npm run missing`\n- See `docs/missing.md`\n' }];
  const findings = await analyzeFiles(root, files);
  assert.equal(findings.some((finding) => finding.ruleId === 'stale-command'), true);
  assert.equal(findings.some((finding) => finding.ruleId === 'stale-path'), true);
});
```

- [ ] **Step 2: Run analyzer tests and verify RED**

Run: `npm test -- test/analyzers.test.js`

Expected: fail because rules are missing.

- [ ] **Step 3: Implement markdown, skill, command, path, and MCP rules**

Rules emit normalized findings with `{ ruleId, severity, file, message, weight }`.

- [ ] **Step 4: Run analyzer tests and verify GREEN**

Run: `npm test -- test/analyzers.test.js`

Expected: pass.

### Task 4: Safe Fixes

**Files:**
- Create: `src/fixes.js`
- Create: `test/fixes.test.js`
- Modify: `src/cli.js`

- [ ] **Step 1: Write failing safe-fix tests**

```js
test('safe fixes trim whitespace and collapse blank lines', async () => {
  const file = join(root, 'AGENTS.md');
  await writeFile(file, '- Keep tests green   \n\n\n\n- Keep tests green\n');
  const result = await applySafeFixes(root);
  const content = await readFile(file, 'utf8');
  assert.equal(result.changedFiles, 1);
  assert.equal(content, '- Keep tests green\n\n- Keep tests green\n');
});
```

- [ ] **Step 2: Run fix tests and verify RED**

Run: `npm test -- test/fixes.test.js`

Expected: fail because `applySafeFixes` is not implemented.

- [ ] **Step 3: Implement safe fixes**

Implement line-ending normalization, trailing whitespace trimming, and blank-line collapse only.

- [ ] **Step 4: Run fix tests and verify GREEN**

Run: `npm test -- test/fixes.test.js`

Expected: pass.

### Task 5: Output And Docs

**Files:**
- Create: `src/format.js`
- Modify: `src/cli.js`
- Create: `README.md`
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Write failing CLI output tests**

```js
test('score command prints compact score output', async () => {
  const lines = [];
  const result = await runCli(['score', '--root', root], { stdout: (line) => lines.push(line), stderr: () => {} });
  assert.equal(result.exitCode, 0);
  assert.match(lines.join('\n'), /^Score: \d+\/100/m);
});
```

- [ ] **Step 2: Run CLI tests and verify RED**

Run: `npm test -- test/cli.test.js`

Expected: fail because `score` formatting is not implemented.

- [ ] **Step 3: Implement text output, JSON output, help, and docs**

Add `--json`, clear help text, launch-grade README, and CI workflow running `npm test`.

- [ ] **Step 4: Run all tests and verify GREEN**

Run: `npm test`

Expected: all tests pass.

## Self-Review

Spec coverage: The plan covers scan, score, fix, supported file discovery, deterministic findings, scoring, safe fixes, docs, and CI.

Placeholder scan: No implementation step relies on a placeholder. The rules, commands, and file paths are explicit.

Type consistency: The plan consistently uses `runCli`, `scanRepository`, `analyzeFiles`, `calculateScore`, and `applySafeFixes` as the public module functions.
