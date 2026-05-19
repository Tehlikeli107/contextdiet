import { writeFile } from 'node:fs/promises';

import { discoverContextFiles } from './scanner.js';

export function safeFixContent(content) {
  return content
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/g, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');
}

export async function applySafeFixes(root) {
  const files = await discoverContextFiles(root);
  const changed = [];

  for (const file of files) {
    const fixed = safeFixContent(file.content);
    if (fixed === file.content) continue;

    await writeFile(file.path, fixed, 'utf8');
    changed.push(file.relativePath);
  }

  return {
    changedFiles: changed.length,
    files: changed
  };
}
