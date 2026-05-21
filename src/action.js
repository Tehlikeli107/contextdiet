import { appendFile, readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { runCli } from './cli.js';

const COMMENT_MARKER = '<!-- contextdiet-pr-comment -->';

export function buildActionArgs(env = process.env) {
  const root = env.INPUT_ROOT || '.';
  const threshold = env.INPUT_THRESHOLD || '90';
  const format = env.INPUT_FORMAT || 'text';
  const args = ['scan', '--root', root, '--strict', '--threshold', threshold];

  if (format === 'sarif') {
    args.push('--sarif');
  } else if (format === 'json') {
    args.push('--json');
  } else if (format !== 'text') {
    args.push('--format', format);
  }

  return args;
}

function isTruthy(value) {
  return /^(1|true|yes)$/i.test(String(value ?? '').trim());
}

async function writeOutput(name, value, env = process.env) {
  if (!env.GITHUB_OUTPUT) return;
  await appendFile(env.GITHUB_OUTPUT, `${name}=${value}\n`, 'utf8');
}

export function buildPullRequestCommentBody(scanOutput, exitCode) {
  const output = scanOutput.trim();
  const renderedOutput = /^##\s+Contextdiet/m.test(output)
    ? output
    : ['## Contextdiet report', '', '```text', output, '```'].join('\n');

  return [
    COMMENT_MARKER,
    renderedOutput,
    '',
    `**Exit code:** \`${exitCode}\``
  ].join('\n');
}

async function readGithubEvent(env) {
  if (!env.GITHUB_EVENT_PATH) return null;

  try {
    return JSON.parse(await readFile(env.GITHUB_EVENT_PATH, 'utf8'));
  } catch {
    return null;
  }
}

function githubHeaders(token) {
  return {
    accept: 'application/vnd.github+json',
    authorization: `Bearer ${token}`,
    'content-type': 'application/json',
    'x-github-api-version': '2022-11-28'
  };
}

async function githubJson(fetchImpl, url, options) {
  const response = await fetchImpl(url, options);
  if (!response.ok) {
    const details = await response.text();
    throw new Error(`GitHub API request failed with ${response.status}: ${details}`);
  }
  return response.json();
}

export async function upsertPullRequestComment({ env = process.env, body, fetchImpl = fetch }) {
  const token = env.GITHUB_TOKEN;
  if (!token) return { skipped: true, reason: 'missing GITHUB_TOKEN' };

  const repository = env.GITHUB_REPOSITORY;
  if (!repository) return { skipped: true, reason: 'missing GITHUB_REPOSITORY' };

  const event = await readGithubEvent(env);
  const pullRequestNumber = event?.pull_request?.number;
  if (!pullRequestNumber) return { skipped: true, reason: 'not a pull request event' };

  const headers = githubHeaders(token);
  const commentsUrl = `https://api.github.com/repos/${repository}/issues/${pullRequestNumber}/comments`;
  const comments = await githubJson(fetchImpl, `${commentsUrl}?per_page=100`, {
    method: 'GET',
    headers
  });
  const existing = comments.find((comment) => String(comment.body ?? '').includes(COMMENT_MARKER));

  if (existing) {
    await githubJson(fetchImpl, existing.url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ body })
    });
    return { action: 'updated' };
  }

  await githubJson(fetchImpl, commentsUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ body })
  });
  return { action: 'created' };
}

export async function runAction(env = process.env, deps = {}) {
  const output = [];
  const errors = [];
  const result = await runCli(buildActionArgs(env), {
    stdout: (line) => output.push(line),
    stderr: (line) => errors.push(line)
  });

  for (const line of output) console.log(line);
  for (const line of errors) console.error(line);

  await writeOutput('exit-code', String(result.exitCode), env);
  if (isTruthy(env.INPUT_COMMENT)) {
    try {
      const comment = await upsertPullRequestComment({
        env,
        body: buildPullRequestCommentBody(output.join('\n'), result.exitCode),
        fetchImpl: deps.fetchImpl ?? fetch
      });
      if (comment.skipped) {
        console.warn(`contextdiet comment skipped: ${comment.reason}`);
      } else {
        await writeOutput('comment-action', comment.action, env);
      }
    } catch (error) {
      console.warn(`contextdiet comment failed: ${error.message}`);
    }
  }

  process.exitCode = result.exitCode;
  return result;
}

export function isDirectRun(metaUrl, argvPath) {
  return fileURLToPath(metaUrl) === fileURLToPath(pathToFileURL(argvPath));
}

if (isDirectRun(import.meta.url, process.argv[1])) {
  await runAction();
}
