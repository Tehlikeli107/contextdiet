import { applySafeFixes } from './fixes.js';
import { formatBadge, formatScore, formatTextReport, publicScanResult } from './format.js';
import { scanRepository } from './scanner.js';

const USAGE = `Usage:
  contextdiet scan [--root <path>] [--json]
  contextdiet score [--root <path>] [--json]
  contextdiet badge [--root <path>]
  contextdiet fix --safe [--root <path>]

Options:
  --strict              Exit 1 when score is below threshold
  --threshold <0-100>   Score threshold for --strict (default: 90)
`;

function parseArgs(argv) {
  const command = argv[0] ?? 'scan';
  const options = {
    root: process.cwd(),
    json: false,
    safe: false,
    strict: false,
    threshold: 90
  };

  for (let index = 1; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--root') {
      options.root = argv[index + 1];
      index += 1;
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg === '--safe') {
      options.safe = true;
    } else if (arg === '--strict') {
      options.strict = true;
    } else if (arg === '--threshold') {
      options.threshold = Number.parseInt(argv[index + 1], 10);
      index += 1;
    }
  }

  return { command, options };
}

export async function runCli(argv, io = {}) {
  const stdout = io.stdout ?? console.log;
  const stderr = io.stderr ?? console.error;
  const { command, options } = parseArgs(argv);

  if (!Number.isInteger(options.threshold) || options.threshold < 0 || options.threshold > 100) {
    stderr('Error: threshold must be an integer from 0 to 100.');
    stderr(USAGE.trimEnd());
    return { exitCode: 2 };
  }

  if (command === 'scan') {
    const scan = await scanRepository(options.root);
    stdout(options.json ? JSON.stringify(publicScanResult(scan), null, 2) : formatTextReport(scan));
    return { exitCode: options.strict && scan.score.score < options.threshold ? 1 : 0 };
  }

  if (command === 'score') {
    const scan = await scanRepository(options.root);
    stdout(options.json ? JSON.stringify(scan.score, null, 2) : formatScore(scan));
    return { exitCode: options.strict && scan.score.score < options.threshold ? 1 : 0 };
  }

  if (command === 'badge') {
    const scan = await scanRepository(options.root);
    stdout(formatBadge(scan));
    return { exitCode: 0 };
  }

  if (command === 'fix' && options.safe) {
    const result = await applySafeFixes(options.root);
    stdout(`Changed files: ${result.changedFiles}`);
    for (const file of result.files) {
      stdout(`- ${file}`);
    }
    return { exitCode: 0 };
  }

  stderr(USAGE.trimEnd());
  return { exitCode: 2 };
}
