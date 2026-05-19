import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative, sep } from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { scanRepository } from '../src/scanner.js';

async function withTempRepo(fn) {
  const root = await mkdtemp(join(tmpdir(), 'contextdiet-scan-'));
  try {
    return await fn(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

function toPortablePath(path) {
  return path.split(sep).join('/');
}

test('discovers supported agent context files', async () => {
  await withTempRepo(async (root) => {
    await mkdir(join(root, '.cursor', 'rules'), { recursive: true });
    await mkdir(join(root, '.github'), { recursive: true });
    await mkdir(join(root, 'skills', 'review'), { recursive: true });
    await writeFile(join(root, 'AGENTS.md'), '# Agent rules\n');
    await writeFile(join(root, 'CLAUDE.md'), '# Claude rules\n');
    await writeFile(join(root, '.cursor', 'rules', 'frontend.mdc'), '# Frontend\n');
    await writeFile(join(root, '.github', 'copilot-instructions.md'), '# Copilot\n');
    await writeFile(join(root, 'skills', 'review', 'SKILL.md'), '---\nname: review\ndescription: Review code\n---\n');
    await writeFile(join(root, '.mcp.json'), '{"mcpServers":{}}\n');

    const result = await scanRepository(root);
    const discovered = result.files
      .map((file) => toPortablePath(relative(root, file.path)))
      .sort();

    assert.deepEqual(discovered, [
      '.cursor/rules/frontend.mdc',
      '.github/copilot-instructions.md',
      '.mcp.json',
      'AGENTS.md',
      'CLAUDE.md',
      'skills/review/SKILL.md'
    ]);
    assert.equal(result.root, root);
    assert.equal(typeof result.score.score, 'number');
  });
});

test('ignores dependency and git directories', async () => {
  await withTempRepo(async (root) => {
    await mkdir(join(root, 'node_modules', 'pkg'), { recursive: true });
    await mkdir(join(root, '.git'), { recursive: true });
    await writeFile(join(root, 'node_modules', 'pkg', 'SKILL.md'), '# Ignore me\n');
    await writeFile(join(root, '.git', 'AGENTS.md'), '# Ignore me\n');
    await writeFile(join(root, 'AGENTS.md'), '# Keep me\n');

    const result = await scanRepository(root);

    assert.deepEqual(result.files.map((file) => toPortablePath(relative(root, file.path))), ['AGENTS.md']);
  });
});
