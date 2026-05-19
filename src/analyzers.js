import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const ENTRYPOINT_KINDS = new Set(['agents', 'claude', 'copilot', 'cursor-rule']);
const PATH_REFERENCE_PATTERN = /`([^`\n]+)`|\[[^\]]+\]\(([^)\n]+)\)/g;
const NPM_RUN_PATTERN = /\bnpm\s+run\s+([A-Za-z0-9:_-]+)/g;
const RISKY_COMMAND_PATTERN = /\b(curl|wget)\b.+\|\s*(sh|bash)|rm\s+-rf|Invoke-WebRequest.+iex|iwr.+iex/i;

function finding(ruleId, severity, file, message, weight) {
  return {
    ruleId,
    severity,
    file: file?.relativePath ?? file?.path ?? '<repository>',
    message,
    weight
  };
}

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function readPackageScripts(root) {
  try {
    const content = await readFile(join(root, 'package.json'), 'utf8');
    const parsed = JSON.parse(content);
    return parsed.scripts && typeof parsed.scripts === 'object' ? parsed.scripts : {};
  } catch {
    return {};
  }
}

function lineInstructions(content) {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^[-*]\s+/.test(line))
    .map((line) => line.replace(/^[-*]\s+/, '').trim())
    .filter(Boolean);
}

function normalizedInstruction(instruction) {
  return instruction
    .toLowerCase()
    .replace(/\b(always|must|should|please|do not|don't|never|avoid)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasNegativeCue(instruction) {
  return /\b(do not|don't|never|avoid)\b/i.test(instruction);
}

function hasPositiveCue(instruction) {
  return /\b(always|must|should)\b/i.test(instruction);
}

function analyzeRepeatedAndConflictingInstructions(file) {
  const findings = [];
  const instructions = lineInstructions(file.content);
  const seen = new Set();
  const polarityByInstruction = new Map();

  for (const instruction of instructions) {
    const exact = instruction.toLowerCase();
    if (seen.has(exact)) {
      findings.push(finding(
        'repeated-instruction',
        'warning',
        file,
        `Repeated instruction: "${instruction}"`,
        4
      ));
    }
    seen.add(exact);

    const normalized = normalizedInstruction(instruction);
    if (!normalized) continue;

    const polarity = hasNegativeCue(instruction) ? 'negative' : hasPositiveCue(instruction) ? 'positive' : 'neutral';
    const previous = polarityByInstruction.get(normalized);
    if (previous && previous !== polarity && polarity !== 'neutral' && previous !== 'neutral') {
      findings.push(finding(
        'conflicting-instruction',
        'warning',
        file,
        `Conflicting instruction about "${normalized}"`,
        7
      ));
    }
    polarityByInstruction.set(normalized, polarity);
  }

  return findings;
}

async function analyzeCommandReferences(root, file) {
  const findings = [];
  const scripts = await readPackageScripts(root);
  const matches = file.content.matchAll(NPM_RUN_PATTERN);

  for (const match of matches) {
    const scriptName = match[1];
    if (!Object.prototype.hasOwnProperty.call(scripts, scriptName)) {
      findings.push(finding(
        'stale-command',
        'warning',
        file,
        `Referenced npm script "${scriptName}" is not defined in package.json.`,
        8
      ));
    }
  }

  return findings;
}

async function analyzePathReferences(root, file) {
  const findings = [];
  const matches = file.content.matchAll(PATH_REFERENCE_PATTERN);

  for (const match of matches) {
    const reference = match[1] ?? match[2];
    if (!reference) continue;
    if (/^(https?:|mailto:|#)/i.test(reference)) continue;
    if (reference.startsWith('npm run ')) continue;
    if (/\s/.test(reference)) continue;
    if (!/[/.]/.test(reference)) continue;

    const cleanReference = reference.replace(/^\.?\//, '');
    const candidate = join(root, cleanReference);
    if (!(await pathExists(candidate))) {
      findings.push(finding(
        'stale-path',
        'warning',
        file,
        `Referenced path "${reference}" does not exist.`,
        8
      ));
    }
  }

  return findings;
}

function analyzeSkillMetadata(file) {
  if (file.kind !== 'skill') return [];
  const match = file.content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const metadata = match?.[1] ?? '';
  const hasName = /^name:\s*\S+/m.test(metadata);
  const hasDescription = /^description:\s*\S+/m.test(metadata);

  if (hasName && hasDescription) return [];

  return [finding(
    'skill-metadata',
    'warning',
    file,
    'SKILL.md frontmatter should include name and description.',
    6
  )];
}

function analyzeMcpConfig(file) {
  if (file.kind !== 'mcp') return [];

  try {
    const parsed = JSON.parse(file.content);
    const servers = parsed.mcpServers && typeof parsed.mcpServers === 'object' ? parsed.mcpServers : {};
    return Object.entries(servers).flatMap(([name, server]) => {
      const command = String(server.command ?? '');
      const args = Array.isArray(server.args) ? server.args.map(String).join(' ') : '';
      const commandLine = `${command} ${args}`.trim();
      if (!RISKY_COMMAND_PATTERN.test(commandLine)) return [];

      return [finding(
        'risky-mcp-command',
        'error',
        file,
        `MCP server "${name}" uses a risky command pattern.`,
        10
      )];
    });
  } catch {
    return [finding(
      'invalid-mcp-json',
      'error',
      file,
      'MCP config is not valid JSON.',
      10
    )];
  }
}

export async function analyzeFiles(root, files) {
  const findings = [];

  if (!files.some((file) => ENTRYPOINT_KINDS.has(file.kind))) {
    findings.push(finding(
      'missing-entrypoint',
      'warning',
      null,
      'No AGENTS.md, CLAUDE.md, Cursor rule, or Copilot instructions file found.',
      10
    ));
  }

  for (const file of files) {
    findings.push(...analyzeRepeatedAndConflictingInstructions(file));
    findings.push(...await analyzeCommandReferences(root, file));
    findings.push(...await analyzePathReferences(root, file));
    findings.push(...analyzeSkillMetadata(file));
    findings.push(...analyzeMcpConfig(file));
  }

  return findings;
}
