# Claude Certified Architect – Foundations: Study Repo

Personal study materials for Anthropic's **Claude Certified Architect – Foundations** certification: 60 questions, 120 minutes, 4 of 6 scenarios drawn at random, passing score 720/1000.

This is not a software project — there's no build or test step. The source of truth is the official exam guide PDF; everything else here is derived from it or built as hands-on practice.

## Where to start

- **[study/site.html](study/site.html)** — the interactive study site (also published live as a [Claude Artifact](https://claude.ai/artifact/RBR6kkXudNxRAMKdEpka8i)). Domain browser, pattern gallery, and a shuffled 12-question quiz drill with a per-principle understanding dashboard, all tracked per-browser via `localStorage`. Easiest way to actually study this material — open it in a browser rather than reading the markdown below.
- **[study/hidden-patterns.md](study/hidden-patterns.md)** — read this before the others. The exam is scenario-based and judgment-based, not recall-based: it rewards the same ~10 tradeoff shapes over and over (deterministic enforcement over probabilistic compliance, scoped least-privilege tool access, structured error signals, root-cause attribution from logs, etc.). This file names each pattern and ties it back to the sample questions that test it.

## Repo layout

```
source/            the official exam guide PDF (v0.2) — ground truth, re-derive from here, don't extrapolate
study/
  content-outline.md        full domain + task-statement breakdown (5 domains, 27 task statements, weighted)
  hidden-patterns.md         meta-analysis: the 10 recurring tradeoff axes behind every correct answer
  sample-questions.md        all 12 official sample questions, transcribed verbatim with explanations
  scope-and-prep.md          in-scope/out-of-scope topic lists, appendix concepts, 27 prep exercises
  practice-exam-sources.md   vetted external practice-exam sources (official program info + an avoid-list)
  site.html                  the interactive study site described above
Projects/          hands-on exercises built while studying — small agentic systems that exercise
                   the patterns in hidden-patterns.md against a concrete scenario (see below)
```

## Exam domains, by weight

Study time should track these weights — Domains 1, 3, and 4 are two-thirds of the exam.

| Domain | Weight |
|---|---|
| 1. Agentic Architecture & Orchestration | 27% |
| 3. Claude Code Configuration & Workflows | 20% |
| 4. Prompt Engineering & Structured Output | 20% |
| 2. Tool Design & MCP Integration | 18% |
| 5. Context Management & Reliability | 15% |

Full task-statement breakdown for each domain is in `study/content-outline.md`.

## Projects/ — hands-on practice

Small, self-contained systems built to practice specific patterns rather than just read about them:

- **cascade-logistics** — Python API + React frontend monorepo; practices CLAUDE.md hierarchy and area-scoped conventions (`.claude/rules/`).
- **claim-extraction-pipeline** — structured-extraction pipeline over scanned insurance forms; practices JSON-schema tool design, validation-retry loops, the Message Batches API, and confidence-gated human review.
- **multi-tool-agent-escalation** — tier-1 support agent with a dollar-threshold refund policy enforced in code (not just the system prompt); practices structured tool errors and escalation logic.

Each has its own README with more detail. `Projects/*/node_modules` and Python `__pycache__` are gitignored — run each project's own install step if you want to execute it.

## A note on trust levels

Everything under `study/` except `practice-exam-sources.md` has been independently transcribed or derived from the official exam guide PDF. `practice-exam-sources.md` is different: it catalogs external, unofficial, community-built practice material and has *not* been independently verified — spot-check anything from it against `content-outline.md` before trusting it, using the rubric at the bottom of that file.

## Keeping things in sync

If you correct a transcription error or find an updated exam guide version, update the relevant `study/*.md` file first (it's the readable source of record), then mirror the change into `site.html`'s `DOMAINS`/`PATTERNS`/`QUIZ` JS arrays, and republish the artifact. See `CLAUDE.md` for the full set of conventions this repo follows.
