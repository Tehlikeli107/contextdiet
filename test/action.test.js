import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  buildActionArgs,
  buildPullRequestCommentBody,
  isDirectRun,
  upsertPullRequestComment
} from '../src/action.js';

async function withTempEvent(payload, fn) {
  const root = await mkdtemp(join(tmpdir(), 'contextdiet-action-'));
  const eventPath = join(root, 'event.json');
  await writeFile(eventPath, JSON.stringify(payload), 'utf8');

  try {
    return await fn(eventPath);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body)
  };
}

test('buildActionArgs creates strict scan arguments from action inputs', () => {
  const args = buildActionArgs({
    INPUT_ROOT: 'repo',
    INPUT_THRESHOLD: '92',
    INPUT_FORMAT: 'sarif'
  });

  assert.deepEqual(args, ['scan', '--root', 'repo', '--strict', '--threshold', '92', '--sarif']);
});

test('buildActionArgs supports markdown action output', () => {
  const args = buildActionArgs({
    INPUT_ROOT: 'repo',
    INPUT_THRESHOLD: '91',
    INPUT_FORMAT: 'markdown'
  });

  assert.deepEqual(args, ['scan', '--root', 'repo', '--strict', '--threshold', '91', '--format', 'markdown']);
});

test('buildActionArgs passes unknown formats through for CLI validation', () => {
  const args = buildActionArgs({
    INPUT_FORMAT: 'banana'
  });

  assert.deepEqual(args, ['scan', '--root', '.', '--strict', '--threshold', '90', '--format', 'banana']);
});

test('buildActionArgs defaults to strict text scan at root', () => {
  const args = buildActionArgs({});

  assert.deepEqual(args, ['scan', '--root', '.', '--strict', '--threshold', '90']);
});

test('isDirectRun compares file URLs with argv paths', () => {
  const url = new URL('../src/action.js', import.meta.url);
  assert.equal(isDirectRun(url.href, fileURLToPath(url)), true);
});

test('buildPullRequestCommentBody adds a stable marker and scan output', () => {
  const body = buildPullRequestCommentBody('## Contextdiet report\n\n**Score:** 92/100', 1);

  assert.match(body, /^<!-- contextdiet-pr-comment -->/);
  assert.match(body, /## Contextdiet report/);
  assert.equal(body.match(/## Contextdiet report/g).length, 1);
  assert.match(body, /\*\*Exit code:\*\* `1`/);
});

test('upsertPullRequestComment creates a new comment when no marker exists', async () => {
  await withTempEvent({ pull_request: { number: 42 } }, async (eventPath) => {
    const calls = [];
    const fetchImpl = async (url, options = {}) => {
      calls.push({ url, options });
      if (options.method === 'GET') return jsonResponse([]);
      return jsonResponse({ id: 123 });
    };

    const result = await upsertPullRequestComment({
      env: {
        GITHUB_TOKEN: 'token',
        GITHUB_REPOSITORY: 'owner/repo',
        GITHUB_EVENT_PATH: eventPath
      },
      body: 'body',
      fetchImpl
    });

    assert.equal(result.action, 'created');
    assert.equal(calls[0].options.method, 'GET');
    assert.match(calls[0].url, /\/repos\/owner\/repo\/issues\/42\/comments\?per_page=100$/);
    assert.equal(calls[1].options.method, 'POST');
    assert.match(calls[1].url, /\/repos\/owner\/repo\/issues\/42\/comments$/);
    assert.deepEqual(JSON.parse(calls[1].options.body), { body: 'body' });
  });
});

test('upsertPullRequestComment updates an existing contextdiet comment', async () => {
  await withTempEvent({ pull_request: { number: 42 } }, async (eventPath) => {
    const calls = [];
    const fetchImpl = async (url, options = {}) => {
      calls.push({ url, options });
      if (options.method === 'GET') {
        return jsonResponse([{
          body: '<!-- contextdiet-pr-comment -->\nold',
          url: 'https://api.github.com/repos/owner/repo/issues/comments/99'
        }]);
      }
      return jsonResponse({ id: 99 });
    };

    const result = await upsertPullRequestComment({
      env: {
        GITHUB_TOKEN: 'token',
        GITHUB_REPOSITORY: 'owner/repo',
        GITHUB_EVENT_PATH: eventPath
      },
      body: 'new body',
      fetchImpl
    });

    assert.equal(result.action, 'updated');
    assert.equal(calls[1].options.method, 'PATCH');
    assert.equal(calls[1].url, 'https://api.github.com/repos/owner/repo/issues/comments/99');
    assert.deepEqual(JSON.parse(calls[1].options.body), { body: 'new body' });
  });
});

test('upsertPullRequestComment skips when the event is not a pull request', async () => {
  await withTempEvent({ push: { ref: 'refs/heads/main' } }, async (eventPath) => {
    const calls = [];

    const result = await upsertPullRequestComment({
      env: {
        GITHUB_TOKEN: 'token',
        GITHUB_REPOSITORY: 'owner/repo',
        GITHUB_EVENT_PATH: eventPath
      },
      body: 'body',
      fetchImpl: async (url, options = {}) => {
        calls.push({ url, options });
        return jsonResponse({});
      }
    });

    assert.equal(result.skipped, true);
    assert.equal(result.reason, 'not a pull request event');
    assert.equal(calls.length, 0);
  });
});
