export function publicScanResult(scan) {
  return {
    root: scan.root,
    score: scan.score,
    files: scan.files.map((file) => ({
      path: file.relativePath,
      kind: file.kind
    })),
    findings: scan.findings
  };
}

export function formatTextReport(scan) {
  const lines = [
    'Contextdiet report',
    `Score: ${scan.score.score}/${scan.score.maxScore}`,
    `Files scanned: ${scan.files.length}`,
    `Findings: ${scan.findings.length}`
  ];

  if (scan.findings.length > 0) {
    lines.push('', 'Findings:');
    for (const finding of scan.findings) {
      lines.push(`- [${finding.severity}] ${finding.ruleId} ${finding.file}: ${finding.message}`);
    }
  }

  return lines.join('\n');
}

export function formatScore(scan) {
  return [
    `Score: ${scan.score.score}/${scan.score.maxScore}`,
    `Findings: ${scan.score.findings}`
  ].join('\n');
}

export function badgeColor(score) {
  if (score >= 90) return 'brightgreen';
  if (score >= 75) return 'yellow';
  if (score >= 50) return 'orange';
  return 'red';
}

export function formatBadge(scan) {
  const score = scan.score.score;
  const maxScore = scan.score.maxScore;
  const encodedValue = encodeURIComponent(`${score}/${maxScore}`);
  return `![Agent Context Score](https://img.shields.io/badge/agent_context-${encodedValue}-${badgeColor(score)})`;
}
