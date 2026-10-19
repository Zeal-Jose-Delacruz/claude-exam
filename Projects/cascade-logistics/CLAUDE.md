# CLAUDE.md

Cascade Logistics monorepo: a Python API service (`services/api`) and a React
frontend (`services/frontend`). These conventions apply to every change,
regardless of which side of the repo you're touching. Area-specific
conventions live in `.claude/rules/` and load only when you're editing the
matching files.

- Run `make test` before considering any change complete.
- Commit messages: `<area>: <imperative summary>` (e.g. `api: fix refund rounding`).
- Never merge with a failing or skipped test.
