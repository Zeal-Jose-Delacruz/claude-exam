import { buildWeeklyBatch, simulateBatchResults, planResubmission } from "../src/batch.js";

console.log("=== Step 7: failed custom_ids, size-aware resubmission ===\n");

const { requests, forms } = buildWeeklyBatch(100);
const results = simulateBatchResults(requests);

const originalsByCustomId = new Map(requests.map((req, i) => [req.custom_id, { form: forms[i], request: req }]));

const failed = results.filter((r) => r.result.type === "errored");
console.log(`Failed custom_ids: ${failed.length}`);
for (const f of failed) console.log(`  - ${f.custom_id}: ${f.result.error.type} — ${f.result.error.message}`);

const { resubmitRequests, log } = planResubmission(results, originalsByCustomId);

console.log("\nResubmission plan:");
for (const entry of log) console.log(`  - ${JSON.stringify(entry)}`);

console.log(`\nTotal requests in the resubmission batch: ${resubmitRequests.length}`);
console.log("Resubmission custom_ids: " + resubmitRequests.map((r) => r.custom_id).join(", "));
