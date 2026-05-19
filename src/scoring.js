const DEFAULT_WEIGHT = 5;

export function calculateScore(findings) {
  const totalPenalty = findings.reduce((sum, finding) => sum + (finding.weight ?? DEFAULT_WEIGHT), 0);
  const score = Math.max(0, 100 - totalPenalty);
  const bySeverity = findings.reduce((counts, finding) => {
    counts[finding.severity] = (counts[finding.severity] ?? 0) + 1;
    return counts;
  }, {});

  return {
    score,
    maxScore: 100,
    findings: findings.length,
    bySeverity
  };
}
