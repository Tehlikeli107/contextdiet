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

function levelForSeverity(severity) {
  if (severity === 'error') return 'error';
  if (severity === 'warning') return 'warning';
  return 'note';
}

export function formatSarif(scan) {
  const ruleIds = [...new Set(scan.findings.map((finding) => finding.ruleId))].sort();
  return {
    version: '2.1.0',
    $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
    runs: [
      {
        tool: {
          driver: {
            name: 'contextdiet',
            informationUri: 'https://github.com/Tehlikeli107/contextdiet',
            rules: ruleIds.map((ruleId) => ({
              id: ruleId,
              name: ruleId,
              shortDescription: {
                text: ruleId
              }
            }))
          }
        },
        results: scan.findings.map((finding) => ({
          ruleId: finding.ruleId,
          level: levelForSeverity(finding.severity),
          message: {
            text: finding.message
          },
          locations: [
            {
              physicalLocation: {
                artifactLocation: {
                  uri: finding.file
                }
              }
            }
          ]
        }))
      }
    ]
  };
}
