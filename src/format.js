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
