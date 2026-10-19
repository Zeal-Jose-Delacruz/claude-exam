# Claim Extraction Pipeline

Structured-extraction pipeline for Meridian Mutual's scanned auto-insurance
claim forms: a JSON-schema extraction tool, a validation-retry loop that
distinguishes fixable format slips from genuinely illegible fields,
format-targeted few-shot examples, a Message Batches API design for the
weekly backlog with size-aware resubmission, an SLA check, confidence-gated
human review, and an accuracy breakdown by document type and field.

## Layout

```
src/
  schema.js              Step 1: extraction tool JSON schema (V1), + V2 adding confidence (Step 9)
  validate.js            Minimal hand-rolled validator (type/enum/format/required) — just what the schema needs
  data/forms.js          10 sample "scanned" forms (OCR-transcript text) + hand-labeled ground truth
  data/fewShotExamples.js  Step 5: one narrative, one tabular few-shot example
  model/mockClient.js    Deterministic stand-in for the Claude call (see "Why a mock model?" below)
  model/realClient.js    Real @anthropic-ai/sdk wrapper, same interface, forced tool_choice
  model/index.js         Picks real vs mock
  extract.js             Steps 2-4: single-document extraction + bounded validation-retry loop
  retrySummary.js        Step 4: resolved_by_retry vs not_resolvable tally
  batch.js                Steps 6-7: Message Batches API request builder, result parsing, chunk-and-resubmit
  sla.js                  Step 8: wall-clock-vs-SLA scenarios
  confidenceRouting.js    Step 9: confidence-gated routing
  accuracyReport.js        Step 10: accuracy by doc type x field, plus a confidence-calibration check
scripts/step1-...step10-*.js   One runnable script per step (`npm run step1` ... `npm run step10`, or `npm run all`)
test/                     node --test coverage of the validator and the pipeline's key behaviors
```

## Running it

```
npm run step1   # ... through step10
npm run all     # all ten in order
npm test        # node --test
```

## Why a mock model?

This sandbox has no `ANTHROPIC_API_KEY` and no outbound network access, and
Steps 2-5 specifically need *repeatable* edge cases — an illegible field, a
non-ISO date, a mis-cased enum value, a messy narrative vs. a clean one — to
demonstrate the pipeline's logic deterministically. `src/model/mockClient.js`
hand-scripts the exact output a real Claude call would plausibly produce for
each documented scenario (including deliberately imperfect first attempts,
and the few-shot-driven improvement in Step 5). `src/model/realClient.js` is
a complete, ready-to-use wrapper — same tool schema, same message shape,
forced `tool_choice` — for when a key is available:

```
ANTHROPIC_API_KEY=sk-...  USE_REAL_API=true  npm run step2
```

`src/extract.js`, `src/batch.js`, and everything downstream are unaware of
which client they're talking to.

## What each step found (flags, not just results)

- **Step 1**: schema matches the spec exactly — 5 required keys,
  `injury_type_detail`/`policy_number` nullable, `injury_type` a closed enum
  with `other`. Confidence is *not* in this schema; it's added in Step 9 only,
  per the stated step order.
- **Step 4**: `not_resolvable` isn't just "we gave up after one retry" — it's
  specifically the case where a required-and-non-nullable field (claimant
  name, incident date) is genuinely illegible on the form. That's a schema
  tension, not a retry-count tension: no amount of retrying fixes water
  damage. The real fix, if this keeps happening at volume, is schema-level
  (make the field nullable with downstream human-review enforcement) rather
  than looping retries forever.
- **Step 8 — the important flag**: Anthropic's Message Batches API commits to
  "processed within 24 hours," not a tighter guarantee, and the SLA clock in
  this business problem starts at *scan time*, not at *batch-submit time*.
  Submitting once a week (as "a week's backlog in one batch run" literally
  describes) already blows the 24-hour SLA before the batch even finishes
  (see the step 8 output: a Monday scan sitting until a Friday batch run is
  ~96h stale before processing starts at all). Even submitting same-day, a
  storm-spike batch that takes close to Batches' own 24h ceiling leaves zero
  buffer. **Batch processing is the right call for digesting backlog
  cost-effectively, but it cannot be the only path if the SLA is a genuine
  24-hour-from-scan deadline** — either submit in smaller, more frequent
  batches (hourly/every-few-hours, not weekly) so the worst case shrinks, or
  route anything already close to the SLA deadline through the standard
  (non-batch) Messages API instead. This is the same latency/risk-profile
  tradeoff as Batches-for-overnight-reports-vs-wrong-for-blocking-checks —
  here it's one workflow whose own stated SLA doesn't leave room for batch's
  worst case, not two different workflows.
- **Step 9 — flag**: confidence here is the model's *self-reported* score,
  not a calibrated one. It's useful (claim-2026-03-0283 is schema-valid but
  correctly routed to review because a detail-less "other" claim isn't safe
  to auto-commit) but shouldn't be trusted blindly — Step 10's calibration
  check is what actually validates whether 0.85 is a meaningful cutoff for
  this pipeline rather than a plausible-looking number.
- **Step 10 — the point of the exercise**: overall accuracy lands at 98.2%,
  but that one number hides that it's `injury_type_detail` on
  `handwritten-narrative` forms specifically (80% vs. 100% everywhere else)
  that's weak — and the cause (claim-2026-03-0312) is a *different* failure
  mode than Step 5 fixed: a margin note added in a second ink pass, which
  neither existing few-shot example covers. The fix is a third, targeted
  few-shot example (or a schema note about multi-pass annotations), not a
  bigger model or more retries — and the confidence gate from Step 9 already
  caught this one case (confidence 0.78) before it reached the claims system,
  which is why the calibration check comes back clean (no confidently-wrong
  extractions) by the time all of Steps 1-9 are applied together.

## Still needs manual follow-up

- The mock corpus is 10 hand-labeled forms; real calibration of the 0.85
  threshold and the per-field/per-doc-type accuracy numbers needs a much
  larger labeled validation set before those numbers can be trusted at
  production scale.
- Step 6's "week's backlog" batch recycles these 10 forms to reach ~100
  requests rather than 100 unique scans — fine for exercising the
  batch-request/resubmission mechanics, not a substitute for a real volume
  test.
- Step 8's SLA numbers use an illustrative "steady-state" batch-processing
  time; real Batches API latency should be measured against Meridian's
  actual document volume and submission cadence before picking a cadence.
- A third few-shot example for multi-ink-pass/margin-annotation handwriting
  (surfaced by Step 10) hasn't been added yet.
