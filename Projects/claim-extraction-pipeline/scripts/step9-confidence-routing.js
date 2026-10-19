import { extractClaim } from "../src/extract.js";
import { FORMS } from "../src/data/forms.js";
import { routeByConfidence, DEFAULT_THRESHOLD } from "../src/confidenceRouting.js";

console.log("=== Step 9: confidence-gated routing ===\n");

const extractions = [];
for (const form of FORMS) {
  extractions.push(await extractClaim(form, { withConfidence: true, useFewShot: true }));
}

const { autoCommit, humanReview, threshold } = routeByConfidence(extractions, DEFAULT_THRESHOLD);

console.log(`threshold: ${threshold}\n`);
console.log(`auto-commit to claims system (${autoCommit.length}):`);
for (const e of autoCommit) console.log(`  - ${e.customId}: confidence ${e.output.confidence}`);

console.log(`\nhuman review queue (${humanReview.length}):`);
for (const e of humanReview) console.log(`  - ${e.customId}: confidence ${e.output.confidence}`);

console.log(
  "\nFlag: confidence is the model's own self-report, not a calibrated metric. claim-2026-03-0283\n" +
    "lands in human review even though it passed schema validation cleanly — the field is legitimately\n" +
    "null (smudged toner) but a detail-less 'other' claim isn't safe to auto-commit. See Step 10 for\n" +
    "whether 0.85 is actually a *calibrated* cutoff or just a plausible-looking number."
);
