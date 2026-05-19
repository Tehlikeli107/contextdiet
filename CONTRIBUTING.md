# Contributing

Thanks for helping make AI-agent context less expensive and less mysterious.

## Development

```bash
npm test
npm run scan
npm run score
```

## Rule Design

Good contextdiet rules are:

- deterministic
- local-first
- explainable in one sentence
- low false-positive enough for CI
- covered by a failing test before implementation

Avoid rules that require network calls, API keys, or model judgment in the default scan path.

## Pull Requests

- Add or update tests for behavior changes.
- Keep the CLI zero-dependency unless there is a strong reason.
- Update `README.md` or `CHANGELOG.md` when user-facing behavior changes.
- Run `npm test` and `node ./bin/contextdiet.js scan --root . --strict --threshold 90` before opening a PR.

## Commit Style

Use short conventional-style messages when possible:

- `feat: add rule`
- `fix: reduce false positive`
- `docs: improve example`
- `chore: update metadata`
