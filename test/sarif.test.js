import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { runCli } from '../src/cli.js';

async function withTempRepo(fn) {
  const root = await mkdtemp(join(tmpdir(), 'contextdiet-sarif-'));
  try {
    return await fn(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test('scan --sarif prints SARIF 2.1.0 output', async () => {
  await withTempRepo(async (root) => {
    await writeFile(join(root, 'AGENTS.md'), '- Run `npm run missing`\n');
    const lines = [];

    const result = await runCli(['scan', '--root', root, '--sarif'], {
      stdout: (line) => lines.push(line),
      stderr: () => {}
    });

    const sarif = JSON.parse(lines.join('\n'));
    assert.equal(result.exitCode, 0);
    assert.equal(sarif.version, '2.1.0');
    assert.equal(sarif.runs[0].tool.driver.name, 'contextdiet');
    assert.equal(sarif.runs[0].results[0].ruleId, 'stale-command');
    assert.equal(sarif.runs[0].results[0].locations[0].physicalLocation.artifactLocation.uri, 'AGENTS.md');
  });
});
