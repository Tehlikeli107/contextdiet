const DEFAULT_WEIGHT = 5;

const RECOMMENDATIONS = {
  'missing-entrypoint': 'Add an AGENTS.md, CLAUDE.md, Cursor rule, or Copilot instructions file so agents have one clear starting point.',
  'stale-command': 'Restore missing npm scripts or update the instructions that reference them.',
  'stale-path': 'Update or remove local file references that no longer exist.',
  'repeated-instruction': 'Collapse repeated instructions so agents spend less context on duplicate rules.',
  'conflicting-instruction': 'Resolve conflicting instructions so agents do not have to guess which rule wins.',
  'skill-metadata': 'Add name and description frontmatter to SKILL.md files.',
  'risky-mcp-command': 'Review risky MCP command patterns before letting agents run them.',
  'invalid-mcp-json': 'Fix invalid MCP JSON so agent tooling can parse server configuration.'
};

function statusForScore(score) {
  if (score >= 90) return 'healthy';
  if (score >= 75) return 'watch';
  if (score >= 50) return 'needs-work';
  return 'critical';
}

function groupFindings(findings) {
  const groups = new Map();

  for (const finding of findings) {
    const current = groups.get(finding.ruleId) ?? {
      ruleId: finding.ruleId,
      severity: finding.severity,
      count: 0,
      penalty: 0,
      firstFile: finding.file,
      firstMessage: finding.message
    };

    current.count += 1;
    current.penalty += finding.weight ?? DEFAULT_WEIGHT;
    if (current.severity !== 'error' && finding.severity === 'error') {
      current.severity = 'error';
    }
    groups.set(finding.ruleId, current);
  }

  return [...groups.values()].sort((a, b) => (
    b.penalty - a.penalty ||
    b.count - a.count ||
    a.ruleId.localeCompare(b.ruleId)
  ));
}

export function createDoctorReport(scan) {
  const groups = groupFindings(scan.findings);
  const recommendations = groups.length === 0
    ? [{
        ruleId: 'healthy-context',
        recommendation: 'Keep context docs close to code changes and run contextdiet in CI.'
      }]
    : groups.slice(0, 5).map((group) => ({
        ruleId: group.ruleId,
        recommendation: RECOMMENDATIONS[group.ruleId] ?? `Review ${group.ruleId} findings and remove context debt at the source.`
      }));

  return {
    root: scan.root,
    status: statusForScore(scan.score.score),
    score: scan.score,
    threshold: scan.config.threshold,
    filesScanned: scan.files.length,
    groups,
    recommendations
  };
}
