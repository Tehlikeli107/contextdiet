# Agent Instructions

## Project Overview

contextdiet is a zero-dependency Node.js CLI for measuring AI coding-agent context quality.

## Commands

- Run `npm test` before claiming changes pass.
- Run `node ./bin/contextdiet.js scan --root .` to inspect this repository with the local CLI.

## Code Style

- Keep modules focused and dependency-free.
- Prefer deterministic local analysis over model-based judgment.
- Add tests with Node's built-in `node:test` runner for behavior changes.

## Safety

- `fix --safe` must only perform semantic-preserving cleanup.
- Do not add network calls to scan behavior.
- Do not rewrite user instructions automatically without an explicit future flag.
