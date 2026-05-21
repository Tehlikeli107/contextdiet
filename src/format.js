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

function markdownCell(value) {
  return String(value).replace(/\|/g, '\\|');
}

export function formatMarkdownReport(scan) {
  const lines = [
    '## Contextdiet report',
    '',
    `**Score:** ${scan.score.score}/${scan.score.maxScore}`,
    `**Files scanned:** ${scan.files.length}`,
    `**Findings:** ${scan.findings.length}`
  ];

  if (scan.findings.length === 0) {
    lines.push('', 'No findings.');
    return lines.join('\n');
  }

  lines.push('', '| Severity | Rule | File | Message |');
  lines.push('| --- | --- | --- | --- |');
  for (const finding of scan.findings) {
    lines.push([
      '',
      markdownCell(finding.severity),
      `\`${markdownCell(finding.ruleId)}\``,
      `\`${markdownCell(finding.file)}\``,
      markdownCell(finding.message),
      ''
    ].join(' | '));
  }

  return lines.join('\n');
}

function pluralize(count, singular, plural = `${singular}s`) {
  return count === 1 ? singular : plural;
}

export function formatDoctorText(report) {
  const lines = [
    'Contextdiet doctor',
    `Score: ${report.score.score}/${report.score.maxScore}`,
    `Status: ${report.status}`,
    `Threshold: ${report.threshold}`,
    `Files scanned: ${report.filesScanned}`
  ];

  if (report.groups.length > 0) {
    lines.push('', 'Top problems:');
    for (const group of report.groups) {
      lines.push(`- ${group.ruleId}: ${group.count} ${pluralize(group.count, 'finding')}, ${group.penalty} point penalty, first seen in ${group.firstFile}`);
    }
  } else {
    lines.push('', 'Top problems:', '- none');
  }

  lines.push('', 'Next steps:');
  report.recommendations.forEach((item, index) => {
    lines.push(`${index + 1}. ${item.recommendation}`);
  });

  return lines.join('\n');
}

export function formatDoctorMarkdown(report) {
  const lines = [
    '## Contextdiet doctor',
    '',
    `**Status:** ${report.status}`,
    `**Score:** ${report.score.score}/${report.score.maxScore}`,
    `**Threshold:** ${report.threshold}`,
    `**Files scanned:** ${report.filesScanned}`,
    '',
    '| Rule | Findings | Penalty | First file |',
    '| --- | ---: | ---: | --- |'
  ];

  if (report.groups.length === 0) {
    lines.push('| none | 0 | 0 | - |');
  } else {
    for (const group of report.groups) {
      lines.push(`| \`${markdownCell(group.ruleId)}\` | ${group.count} | ${group.penalty} | \`${markdownCell(group.firstFile)}\` |`);
    }
  }

  lines.push('', '### Next steps');
  report.recommendations.forEach((item, index) => {
    lines.push(`${index + 1}. ${markdownCell(item.recommendation)}`);
  });

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
