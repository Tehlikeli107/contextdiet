import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { runCli } from '../src/cli.js';

async function withTempRepo(fn) {
  const root = await mkdtemp(join(tmpdir(), 'contextdiet-cli-'));
  try {
    return await fn(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test('scan prints a contextdiet report and score', async () => {
  await withTempRepo(async (root) => {
    await writeFile(join(root, 'AGENTS.md'), '# Agent rules\n\n- Run `npm test`\n');
    const lines = [];

    const result = await runCli(['scan', '--root', root], {
      stdout: (line) => lines.push(line),
      stderr: () => {}
    });

    assert.equal(result.exitCode, 0);
    assert.match(lines.join('\n'), /Contextdiet report/);
    assert.match(lines.join('\n'), /Score: \d+\/100/);
  });
});

test('score prints compact score output', async () => {
  await withTempRepo(async (root) => {
    await writeFile(join(root, 'AGENTS.md'), '# Agent rules\n\n- Keep tests green\n');
    const lines = [];

    const result = await runCli(['score', '--root', root], {
      stdout: (line) => lines.push(line),
      stderr: () => {}
    });

    assert.equal(result.exitCode, 0);
    assert.match(lines.join('\n'), /^Score: \d+\/100/m);
    assert.doesNotMatch(lines.join('\n'), /Contextdiet report/);
  });
});

test('unknown command exits with usage error', async () => {
  const errors = [];
  const result = await runCli(['nope'], {
    stdout: () => {},
    stderr: (line) => errors.push(line)
  });

  assert.equal(result.exitCode, 2);
  assert.match(errors.join('\n'), /Usage:/);
});
