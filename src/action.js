import { appendFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { runCli } from './cli.js';

export function buildActionArgs(env = process.env) {
  const root = env.INPUT_ROOT || '.';
  const threshold = env.INPUT_THRESHOLD || '90';
  const format = env.INPUT_FORMAT || 'text';
  const args = ['scan', '--root', root, '--strict', '--threshold', threshold];

  if (format === 'sarif') {
    args.push('--sarif');
  } else if (format === 'json') {
    args.push('--json');
  }

  return args;
}

async function writeOutput(name, value, env = process.env) {
  if (!env.GITHUB_OUTPUT) return;
  await appendFile(env.GITHUB_OUTPUT, `${name}=${value}\n`, 'utf8');
}

export async function runAction(env = process.env) {
  const output = [];
  const errors = [];
  const result = await runCli(buildActionArgs(env), {
    stdout: (line) => output.push(line),
    stderr: (line) => errors.push(line)
  });

  for (const line of output) console.log(line);
  for (const line of errors) console.error(line);

  await writeOutput('exit-code', String(result.exitCode), env);
  process.exitCode = result.exitCode;
  return result;
}

export function isDirectRun(metaUrl, argvPath) {
  return fileURLToPath(metaUrl) === fileURLToPath(pathToFileURL(argvPath));
}

if (isDirectRun(import.meta.url, process.argv[1])) {
  await runAction();
}
