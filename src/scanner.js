import { readdir, readFile } from 'node:fs/promises';
import { basename, join, relative, sep } from 'node:path';

import { analyzeFiles } from './analyzers.js';
import { calculateScore } from './scoring.js';

const IGNORED_DIRECTORIES = new Set(['.git', 'node_modules', 'dist', 'coverage']);

function toPortablePath(path) {
  return path.split(sep).join('/');
}

function kindForPath(path) {
  const portable = toPortablePath(path);
  if (portable === 'AGENTS.md') return 'agents';
  if (portable === 'CLAUDE.md') return 'claude';
  if (portable === '.github/copilot-instructions.md') return 'copilot';
  if (portable === '.mcp.json' || portable === '.cursor/mcp.json') return 'mcp';
  if (portable.startsWith('.cursor/rules/') && (portable.endsWith('.md') || portable.endsWith('.mdc'))) return 'cursor-rule';
  if (basename(portable) === 'SKILL.md') return 'skill';
  return null;
}

async function walk(root, directory, files) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!IGNORED_DIRECTORIES.has(entry.name)) {
        await walk(root, join(directory, entry.name), files);
      }
      continue;
    }

    if (!entry.isFile()) continue;

    const path = join(directory, entry.name);
    const relativePath = relative(root, path);
    const kind = kindForPath(relativePath);
    if (!kind) continue;

    files.push({
      path,
      relativePath: toPortablePath(relativePath),
      kind,
      content: await readFile(path, 'utf8')
    });
  }
}

export async function discoverContextFiles(root) {
  const files = [];
  await walk(root, root, files);
  return files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

export async function scanRepository(root) {
  const files = await discoverContextFiles(root);
  const findings = await analyzeFiles(root, files);
  const score = calculateScore(findings);

  return {
    root,
    files,
    findings,
    score
  };
}
