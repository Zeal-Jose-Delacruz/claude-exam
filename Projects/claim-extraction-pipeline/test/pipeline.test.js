import test from "node:test";
import assert from "node:assert/strict";
import { extractClaim } from "../src/extract.js";
import { FORMS, getForm } from "../src/data/forms.js";
import { summarizeRetryOutcomes } from "../src/retrySummary.js";
import { buildWeeklyBatch, simulateBatchResults, planResubmission } from "../src/batch.js";
import { routeByConfidence } from "../src/confidenceRouting.js";

test("illegible policy_number comes back null, not invented", async () => {
  const result = await extractClaim(getForm("claim-2026-03-0042"));
  assert.equal(result.output.policy_number, null);
  assert.equal(result.valid, true);
});

test("retry classification matches the known corpus outcome", async () => {
  const results = await Promise.all(FORMS.map((f) => extractClaim(f)));
  const summary = summarizeRetryOutcomes(results);
  assert.equal(summary.resolved_by_retry, 2);
  assert.equal(summary.not_resolvable, 2);
});

test("few-shot fixes the tabular and narrative formats it targets, not an unrelated one", async () => {
  const withFewShot = await extractClaim(getForm("claim-2026-03-0266"), { useFewShot: true });
  const without = await extractClaim(getForm("claim-2026-03-0266"), { useFewShot: false });
  assert.notEqual(withFewShot.output.injury_type_detail, without.output.injury_type_detail);

  const control = await extractClaim(getForm("claim-2026-03-0001"), { useFewShot: true });
  const controlZero = await extractClaim(getForm("claim-2026-03-0001"), { useFewShot: false });
  assert.deepEqual(control.output, controlZero.output);
});

test("oversized batch failure gets chunked, transient failure gets resubmitted unchanged", () => {
  const { requests, forms } = buildWeeklyBatch(100);
  const results = simulateBatchResults(requests);
  const originalsByCustomId = new Map(requests.map((req, i) => [req.custom_id, { form: forms[i], request: req }]));
  const { resubmitRequests, log } = planResubmission(results, originalsByCustomId);

  const oversizedAction = log.find((l) => l.custom_id === "claim-2026-03-9001");
  assert.equal(oversizedAction.action, "chunked_and_resubmitted");
  assert.ok(resubmitRequests.length > log.length); // chunking expands the oversized entry into several requests
});

test("confidence routing sends low-confidence extractions to human review even when schema-valid", async () => {
  const extraction = await extractClaim(getForm("claim-2026-03-0283"), { withConfidence: true });
  const { humanReview } = routeByConfidence([extraction], 0.85);
  assert.equal(humanReview.length, 1);
});
