# QUIZ entry schema (study/site.html)

Exact shape to draft new entries in. Copy this structure field-for-field — don't improvise field names or nesting.

```js
{scenario:"<one of the 6 canonical scenario names>",
 q:"<question text, scenario-grounded>",
 opts:["<option A>","<option B>","<option C>","<option D>"],
 correct:<index 0-3 of the correct option>,
 explain:"<explanation addressing why the correct option is right and why each distractor fails>",
 pattern:"Practice Exam <N> (Udemy) Q<id> — Task <domainNum>.<taskNum> (<task heading text>)",
 ref:{type:'task', domainIdx:<0-4>, taskIdx:<0-6>}}
```

Add `relatedTask:{domainIdx,taskIdx}` only when the question is instead primarily a **pattern** match — in that case use `ref:{type:'pattern', idx:<0-11>}` as the primary ref and put the task cross-reference in `relatedTask`. Default to the task-type `ref` with no `relatedTask` for the common case — that's how the 65 prior community-import questions are structured, and pattern-type refs are the minority (9 of 104 current items).

## The two `ref` shapes

- `ref:{type:'task', domainIdx, taskIdx}` — points at `DOMAINS[domainIdx].tasks[taskIdx]`. Use this whenever the question is best explained as testing one specific task statement's skill.
- `ref:{type:'pattern', idx}` — points at `PATTERNS[idx]`. Use only when the question's correct-vs-distractor reasoning clearly instantiates one of the 12 recurring tradeoff patterns in `study/hidden-patterns.md`, not just loosely relates to one.

`relatedTask` is **display/navigation only** — it drives a clickable cross-reference in the UI but does **not** count toward coverage stats or scoring (per the project's own CLAUDE.md). Don't treat it as a coverage signal when computing gap analysis; keep primary `ref` counts and `relatedTask` counts in separate columns.

## Provenance label convention

The `pattern:` field doubles as a free-text provenance tag for imported items. Real examples already in the file:

- `"Community practice Q13 — Task 1.1 (Design and implement agentic loops for autonomous task execution)"` (prior GitHub community import)
- `"Pattern 1 — deterministic enforcement beats probabilistic compliance"` (original pattern-mapped item, not an import)

For Udemy imports, use: `"Practice Exam <N> (Udemy) Q<id> — Task <domainNum>.<taskNum> (<heading>)"`, where:
- `<N>` is the exam number (1, 2, or 3 of the user's 3 purchased practice exams) — ask if not inferable from context.
- `<id>` is the real Udemy question id/number (from the URL or the page), for traceability back to the raw extraction transcript.

## domainIdx / taskIdx cheat sheet

`DOMAINS` is ordered by exam weight, **not** by real domain number — never assume `domainIdx === num - 1`. Confirmed live mapping:

| domainIdx | real domain `num` | domain name | weight | taskIdx range |
|---|---|---|---|---|
| 0 | 1 | Agentic Architecture & Orchestration | 27% | 0–6 (tasks 1.1–1.7) |
| 1 | 3 | Claude Code Configuration & Workflows | 20% | 0–5 (tasks 3.1–3.6) |
| 2 | 4 | Prompt Engineering & Structured Output | 20% | 0–5 (tasks 4.1–4.6) |
| 3 | 2 | Tool Design & MCP Integration | 18% | 0–4 (tasks 2.1–2.5) |
| 4 | 5 | Context Management & Reliability | 15% | 0–5 (tasks 5.1–5.6) |

Always double-check against `grep -n 'name:".*", num:[0-9]*, pct:' study/site.html` if this table ever looks stale (e.g. after a future domain reweighting) — don't trust it blindly forever.

## qstats append-only rule — why it matters

```js
function loadQstats(){
  try{
    const raw = localStorage.getItem('acf-quiz-qstats');
    if(raw){
      const arr = JSON.parse(raw);
      if(Array.isArray(arr) && arr.length===QUIZ.length){
        return arr.map(e=>({...}));
      }
    }
  }catch(e){}
  return QUIZ.map(freshQstat);
}
```

`qstats` is a plain array **positionally parallel** to `QUIZ` — `qstats[i]` is the spaced-repetition history for `QUIZ[i]`. The reload check is `arr.length===QUIZ.length`, nothing fancier — no IDs, no content hashing.

- **Appending** new entries to the end of `QUIZ` changes its length, so on next load `loadQstats()` falls through to `QUIZ.map(freshQstat)` — every question's cumulative stats reset to zero, visibly, all at once. This is a known, acceptable tradeoff: clean and obvious.
- **Inserting or reordering** existing entries would (if it happened to keep the same length, e.g. swapping two items) silently misattribute old stats to the wrong question — worse, because nothing would look wrong on the surface.

Always propose new entries as additions at the literal end of the `QUIZ` array, and always tell the user explicitly that pasting them in will reset all cumulative stats on next load, so it's a conscious choice each time, not a surprise.
