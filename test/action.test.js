import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

import { buildActionArgs, isDirectRun } from '../src/action.js';

test('buildActionArgs creates strict scan arguments from action inputs', () => {
  const args = buildActionArgs({
    INPUT_ROOT: 'repo',
    INPUT_THRESHOLD: '92',
    INPUT_FORMAT: 'sarif'
  });

  assert.deepEqual(args, ['scan', '--root', 'repo', '--strict', '--threshold', '92', '--sarif']);
});

test('buildActionArgs defaults to strict text scan at root', () => {
  const args = buildActionArgs({});

  assert.deepEqual(args, ['scan', '--root', '.', '--strict', '--threshold', '90']);
});

test('isDirectRun compares file URLs with argv paths', () => {
  const url = new URL('../src/action.js', import.meta.url);
  assert.equal(isDirectRun(url.href, fileURLToPath(url)), true);
});
