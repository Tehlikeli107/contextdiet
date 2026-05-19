import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { applySafeFixes, safeFixContent } from '../src/fixes.js';

async function withTempRepo(fn) {
  const root = await mkdtemp(join(tmpdir(), 'contextdiet-fix-'));
  try {
    return await fn(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test('safeFixContent trims trailing whitespace and collapses blank lines', () => {
  const fixed = safeFixContent('- Keep tests green   \n\n\n\n- Ship small\n');

  assert.equal(fixed, '- Keep tests green\n\n- Ship small\n');
});

test('applySafeFixes updates supported files only when content changes', async () => {
  await withTempRepo(async (root) => {
    const file = join(root, 'AGENTS.md');
    await writeFile(file, '- Keep tests green   \n\n\n\n- Ship small\n');

    const result = await applySafeFixes(root);
    const content = await readFile(file, 'utf8');

    assert.equal(result.changedFiles, 1);
    assert.deepEqual(result.files, ['AGENTS.md']);
    assert.equal(content, '- Keep tests green\n\n- Ship small\n');
  });
});

test('applySafeFixes leaves clean files untouched', async () => {
  await withTempRepo(async (root) => {
    await writeFile(join(root, 'AGENTS.md'), '- Keep tests green\n');

    const result = await applySafeFixes(root);

    assert.equal(result.changedFiles, 0);
    assert.deepEqual(result.files, []);
  });
});
