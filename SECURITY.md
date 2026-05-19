# Security Policy

## Supported Versions

Security fixes target the latest release on the default branch.

## Reporting A Vulnerability

Please do not open a public issue for suspected vulnerabilities.

Report privately through GitHub's private vulnerability reporting when available, or email the maintainer listed on the GitHub profile.

Include:

- affected version or commit
- reproduction steps
- expected and actual behavior
- whether the issue involves file writes, command execution, MCP config, or skill metadata

## Security Principles

- Default scans must not make network calls.
- Default scans must not execute commands from the target repository.
- `fix --safe` must only apply semantic-preserving edits.
- Risky MCP or skill patterns should be reported, not executed.
