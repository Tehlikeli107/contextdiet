import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
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
    await writeFile(join(root, 'AGENTS.md'), '# Agent rules\n\n- Run `npm run missing`\n');
    const lines = [];

    const result = await runCli(['scan', '--root', root], {
      stdout: (line) => lines.push(line),
      stderr: () => {}
    });

    assert.equal(result.exitCode, 0);
    assert.match(lines.join('\n'), /Contextdiet report/);
    assert.match(lines.join('\n'), /Score: \d+\/100/);
    assert.match(lines.join('\n'), /stale-command/);
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

test('help exits successfully with usage text', async () => {
  const lines = [];

  const result = await runCli(['--help'], {
    stdout: (line) => lines.push(line),
    stderr: () => {}
  });

  assert.equal(result.exitCode, 0);
  assert.match(lines.join('\n'), /Usage:/);
});

test('version exits successfully with package version', async () => {
  const lines = [];

  const result = await runCli(['--version'], {
    stdout: (line) => lines.push(line),
    stderr: () => {}
  });

  assert.equal(result.exitCode, 0);
  assert.match(lines.join('\n'), /^\d+\.\d+\.\d+$/);
});

test('init writes a default config file', async () => {
  await withTempRepo(async (root) => {
    const lines = [];

    const result = await runCli(['init', '--root', root], {
      stdout: (line) => lines.push(line),
      stderr: () => {}
    });

    const config = JSON.parse(await readFile(join(root, 'contextdiet.config.json'), 'utf8'));
    assert.equal(result.exitCode, 0);
    assert.equal(config.threshold, 90);
    assert.deepEqual(config.ignoredRules, []);
    assert.match(lines.join('\n'), /Created contextdiet.config.json/);
  });
});

test('scan --strict exits with failure when score is below threshold', async () => {
  await withTempRepo(async (root) => {
    await writeFile(join(root, 'AGENTS.md'), '- Run `npm run missing`\n- Read `docs/missing.md`\n');
    const lines = [];

    const result = await runCli(['scan', '--root', root, '--strict', '--threshold', '95'], {
      stdout: (line) => lines.push(line),
      stderr: () => {}
    });

    assert.equal(result.exitCode, 1);
    assert.match(lines.join('\n'), /Score: 84\/100/);
  });
});

test('scan --threshold rejects invalid values', async () => {
  const errors = [];

  const result = await runCli(['scan', '--threshold', 'nope'], {
    stdout: () => {},
    stderr: (line) => errors.push(line)
  });

  assert.equal(result.exitCode, 2);
  assert.match(errors.join('\n'), /threshold must be an integer/);
});

test('badge prints a shields markdown badge', async () => {
  await withTempRepo(async (root) => {
    await writeFile(join(root, 'AGENTS.md'), '# Agent rules\n');
    const lines = [];

    const result = await runCli(['badge', '--root', root], {
      stdout: (line) => lines.push(line),
      stderr: () => {}
    });

    assert.equal(result.exitCode, 0);
    assert.match(lines.join('\n'), /^!\[Agent Context Score\]\(https:\/\/img\.shields\.io\/badge\/agent_context-100%2F100-brightgreen\)$/);
  });
});

test('scan --json prints machine-readable scan output', async () => {
  await withTempRepo(async (root) => {
    await writeFile(join(root, 'AGENTS.md'), '# Agent rules\n');
    const lines = [];

    const result = await runCli(['scan', '--root', root, '--json'], {
      stdout: (line) => lines.push(line),
      stderr: () => {}
    });

    const parsed = JSON.parse(lines.join('\n'));
    assert.equal(result.exitCode, 0);
    assert.equal(parsed.root, root);
    assert.equal(typeof parsed.score.score, 'number');
    assert.equal(Array.isArray(parsed.findings), true);
  });
});

test('scan --format markdown prints a GitHub-friendly report', async () => {
  await withTempRepo(async (root) => {
    await writeFile(join(root, 'AGENTS.md'), '# Agent rules\n\n- Run `npm run missing`\n');
    const lines = [];

    const result = await runCli(['scan', '--root', root, '--format', 'markdown'], {
      stdout: (line) => lines.push(line),
      stderr: () => {}
    });

    const output = lines.join('\n');
    assert.equal(result.exitCode, 0);
    assert.match(output, /^## Contextdiet report/m);
    assert.match(output, /\*\*Score:\*\* \d+\/100/);
    assert.match(output, /\| Severity \| Rule \| File \| Message \|/);
    assert.match(output, /\| warning \| `stale-command` \| `AGENTS\.md` \| Referenced npm script/);
  });
});

test('scan --format rejects unknown output formats', async () => {
  const errors = [];

  const result = await runCli(['scan', '--format', 'banana'], {
    stdout: () => {},
    stderr: (line) => errors.push(line)
  });

  assert.equal(result.exitCode, 2);
  assert.match(errors.join('\n'), /format must be one of/);
});

test('doctor prints prioritized context debt guidance', async () => {
  await withTempRepo(async (root) => {
    await writeFile(join(root, 'AGENTS.md'), '- Run `npm run missing`\n- Read `docs/missing.md`\n');
    const lines = [];

    const result = await runCli(['doctor', '--root', root], {
      stdout: (line) => lines.push(line),
      stderr: () => {}
    });

    const output = lines.join('\n');
    assert.equal(result.exitCode, 0);
    assert.match(output, /Contextdiet doctor/);
    assert.match(output, /Status: watch/);
    assert.match(output, /Top problems:/);
    assert.match(output, /stale-command: 1 finding/);
    assert.match(output, /Next steps:/);
    assert.match(output, /Restore missing npm scripts or update the instructions that reference them/);
  });
});

test('doctor --json prints a machine-readable diagnosis', async () => {
  await withTempRepo(async (root) => {
    await writeFile(join(root, 'AGENTS.md'), '- Run `npm run missing`\n');
    const lines = [];

    const result = await runCli(['doctor', '--root', root, '--json'], {
      stdout: (line) => lines.push(line),
      stderr: () => {}
    });

    const parsed = JSON.parse(lines.join('\n'));
    assert.equal(result.exitCode, 0);
    assert.equal(parsed.status, 'healthy');
    assert.equal(parsed.score.score, 92);
    assert.equal(parsed.groups[0].ruleId, 'stale-command');
    assert.equal(parsed.groups[0].count, 1);
    assert.equal(Array.isArray(parsed.recommendations), true);
  });
});

test('doctor --format markdown prints GitHub-ready guidance', async () => {
  await withTempRepo(async (root) => {
    await writeFile(join(root, 'AGENTS.md'), '- Read `docs/missing.md`\n');
    const lines = [];

    const result = await runCli(['doctor', '--root', root, '--format', 'markdown'], {
      stdout: (line) => lines.push(line),
      stderr: () => {}
    });

    const output = lines.join('\n');
    assert.equal(result.exitCode, 0);
    assert.match(output, /^## Contextdiet doctor/m);
    assert.match(output, /\*\*Status:\*\* healthy/);
    assert.match(output, /\| Rule \| Findings \| Penalty \| First file \|/);
    assert.match(output, /\| `stale-path` \| 1 \| 8 \| `AGENTS\.md` \|/);
  });
});

test('doctor rejects SARIF output because SARIF is scan-only', async () => {
  const errors = [];

  const result = await runCli(['doctor', '--format', 'sarif'], {
    stdout: () => {},
    stderr: (line) => errors.push(line)
  });

  assert.equal(result.exitCode, 2);
  assert.match(errors.join('\n'), /sarif output is only supported for scan/);
});

test('fix --safe applies conservative whitespace fixes', async () => {
  await withTempRepo(async (root) => {
    const file = join(root, 'AGENTS.md');
    await writeFile(file, '- Keep tests green   \n\n\n\n- Ship small\n');
    const lines = [];

    const result = await runCli(['fix', '--safe', '--root', root], {
      stdout: (line) => lines.push(line),
      stderr: () => {}
    });

    assert.equal(result.exitCode, 0);
    assert.match(lines.join('\n'), /Changed files: 1/);
  });
});
