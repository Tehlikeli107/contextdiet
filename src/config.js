import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const DEFAULT_CONFIG = {
  threshold: 90,
  ignoredRules: [],
  rules: {}
};

export function defaultConfigText() {
  return `${JSON.stringify({
    $schema: './schema/contextdiet.schema.json',
    threshold: 90,
    ignoredRules: [],
    rules: {}
  }, null, 2)}\n`;
}

function normalizeConfig(config) {
  return {
    threshold: Number.isInteger(config.threshold) ? config.threshold : DEFAULT_CONFIG.threshold,
    ignoredRules: Array.isArray(config.ignoredRules) ? config.ignoredRules.map(String) : [],
    rules: config.rules && typeof config.rules === 'object' ? config.rules : {}
  };
}

export async function loadConfig(root) {
  try {
    const content = await readFile(join(root, 'contextdiet.config.json'), 'utf8');
    return normalizeConfig(JSON.parse(content));
  } catch (error) {
    if (error.code === 'ENOENT') return { ...DEFAULT_CONFIG };
    throw new Error(`Failed to read contextdiet.config.json: ${error.message}`);
  }
}

export async function writeDefaultConfig(root) {
  const path = join(root, 'contextdiet.config.json');
  try {
    await readFile(path, 'utf8');
    return { path, created: false };
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  await writeFile(path, defaultConfigText(), 'utf8');
  return { path, created: true };
}

export function applyConfigToFindings(findings, config) {
  const ignoredRules = new Set(config.ignoredRules);

  return findings
    .filter((finding) => !ignoredRules.has(finding.ruleId))
    .map((finding) => {
      const ruleConfig = config.rules[finding.ruleId];
      if (!ruleConfig || !Number.isInteger(ruleConfig.weight)) return finding;
      return {
        ...finding,
        weight: ruleConfig.weight
      };
    });
}
