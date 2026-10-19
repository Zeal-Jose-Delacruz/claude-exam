import { extractClaim } from "../src/extract.js";
import { FORMS } from "../src/data/forms.js";
import { summarizeRetryOutcomes } from "../src/retrySummary.js";

console.log("=== Step 4: retry-outcome classification ===\n");

const results = [];
for (const form of FORMS) {
  results.push(await extractClaim(form));
}

const summary = summarizeRetryOutcomes(results);

console.log(`first_pass_valid: ${summary.first_pass_valid}`);
console.log(`resolved_by_retry: ${summary.resolved_by_retry}   (${summary.resolved_reasons.map((r) => r.customId).join(", ")})`);
console.log(`not_resolvable: ${summary.not_resolvable}        (${summary.not_resolvable_reasons.map((r) => r.customId).join(", ")})`);
console.log();
console.log("resolved_by_retry detail:");
for (const r of summary.resolved_reasons) console.log(`  - ${r.customId}: ${r.reason}`);
console.log("\nnot_resolvable detail:");
for (const r of summary.not_resolvable_reasons) console.log(`  - ${r.customId}: ${r.reason}`);

console.log(
  "\nReading this: resolved_by_retry is a format/casing problem — a prompt or schema-description fix pays\n" +
    "off across the whole backlog. not_resolvable here is specifically 'the field is required-and-non-nullable\n" +
    "but the form is genuinely illegible there' — retrying again won't change that; what it tells you is the\n" +
    "schema itself is forcing a choice the real world doesn't support (see the Step 4 flag below)."
);
