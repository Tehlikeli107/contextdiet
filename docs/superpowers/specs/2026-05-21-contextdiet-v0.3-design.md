# Contextdiet v0.3 Design

## Purpose

Contextdiet v0.3 turns the CLI from a scanner into a shareable diagnosis tool. The release should make it easier for maintainers to understand context debt, paste reports into issues, and get pull request feedback without leaving GitHub.

## Approved Scope

This release adds three connected features:

- `scan --format markdown`: a copy-ready Markdown report for README snippets, issue comments, and CI summaries.
- `doctor`: a higher-level diagnosis command that groups findings by impact and recommends the next actions.
- GitHub Action PR comments: an opt-in `comment: true` mode that posts or updates one Contextdiet pull request comment.

## CLI Design

`scan` keeps the current text output by default. Existing `--json` and `--sarif` flags continue to work. A new `--format <text|json|sarif|markdown>` option is added so CI and the Action can request Markdown without adding more one-off flags.

`doctor` scans the same repository surfaces as `scan`, then derives a diagnosis object:

- status: `healthy`, `watch`, `needs-work`, or `critical`
- score and threshold
- top problem groups sorted by total score penalty
- deterministic next steps based on rule ids

`doctor --json` returns the diagnosis object for automation. `doctor --format markdown` prints a Markdown version for GitHub surfaces.

## GitHub Action Design

The Action keeps its current strict scan behavior. New inputs are:

- `format`: now accepts `text`, `json`, `sarif`, or `markdown`
- `comment`: when `true`, post or update a pull request comment

The comment body includes a stable marker so repeated CI runs update the existing comment instead of creating duplicates. Comment publishing uses the standard `GITHUB_TOKEN`, `GITHUB_REPOSITORY`, and pull request event payload. If comment mode is enabled outside a pull request or without a token, the Action prints a warning and keeps the scan result as the source of truth.

## Error Handling

Invalid formats exit with usage code 2. PR comment failures are non-blocking because the scan result should decide pass/fail. The Action logs a warning when a comment cannot be written.

## Testing

Tests cover:

- Markdown scan formatting.
- Invalid `--format` handling.
- `doctor` text, Markdown, and JSON outputs.
- Action argument generation for Markdown.
- PR comment body generation.
- PR comment create and update flows using a fake fetch implementation.

No network calls are made in tests.
