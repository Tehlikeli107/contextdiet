import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { runCli } from '../src/cli.js';
import { scanRepository } from '../src/scanner.js';

async function withTempRepo(fn) {
  const root = await mkdtemp(join(tmpdir(), 'contextdiet-config-'));
  try {
    return await fn(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test('contextdiet.config.json ignoredRules remove matching findings', async () => {
  await withTempRepo(async (root) => {
    await writeFile(join(root, 'contextdiet.config.json'), JSON.stringify({
      ignoredRules: ['stale-command']
    }));
    await writeFile(join(root, 'AGENTS.md'), '- Run `npm run missing`\n');

    const scan = await scanRepository(root);

    assert.equal(scan.findings.some((finding) => finding.ruleId === 'stale-command'), false);
    assert.equal(scan.score.score, 100);
  });
});

test('contextdiet.config.json can override rule weights', async () => {
  await withTempRepo(async (root) => {
    await writeFile(join(root, 'contextdiet.config.json'), JSON.stringify({
      rules: {
        'stale-command': {
          weight: 20
        }
      }
    }));
    await writeFile(join(root, 'AGENTS.md'), '- Run `npm run missing`\n');

    const scan = await scanRepository(root);

    assert.equal(scan.score.score, 80);
  });
});

test('scan --strict uses configured threshold when no CLI threshold is passed', async () => {
  await withTempRepo(async (root) => {
    await writeFile(join(root, 'contextdiet.config.json'), JSON.stringify({
      threshold: 95
    }));
    await writeFile(join(root, 'AGENTS.md'), '- Run `npm run missing`\n');

    const result = await runCli(['scan', '--root', root, '--strict'], {
      stdout: () => {},
      stderr: () => {}
    });

    assert.equal(result.exitCode, 1);
  });
});
