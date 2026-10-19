import { extractClaim } from "../src/extract.js";
import { getForm } from "../src/data/forms.js";

console.log("=== Step 5: few-shot examples, format-targeted ===\n");

const FIELDS = ["claimant_name", "incident_date", "injury_type", "injury_type_detail", "policy_number"];

function fieldMatches(output, truth) {
  return Object.fromEntries(FIELDS.map((f) => [f, output[f] === truth[f]]));
}

async function compare(customId, label) {
  const form = getForm(customId);
  const zeroShot = await extractClaim(form, { useFewShot: false });
  const fewShot = await extractClaim(form, { useFewShot: true });

  console.log(`--- ${customId} (${form.docType}) — ${label} ---`);
  console.log("zero-shot injury_type_detail: " + JSON.stringify(zeroShot.output.injury_type_detail));
  console.log("few-shot  injury_type_detail: " + JSON.stringify(fewShot.output.injury_type_detail));
  console.log("ground truth               : " + JSON.stringify(form.groundTruth.injury_type_detail));
  console.log("zero-shot field matches: " + JSON.stringify(fieldMatches(zeroShot.output, form.groundTruth)));
  console.log("few-shot  field matches: " + JSON.stringify(fieldMatches(fewShot.output, form.groundTruth)));
  console.log();
}

await compare("claim-2026-03-0271", "handwritten-narrative — the format we added a few-shot example for");
await compare("claim-2026-03-0266", "tabular-line-items — the other format we added a few-shot example for");
await compare("claim-2026-03-0299", "tabular-line-items — second data point, same format");

console.log("--- claim-2026-03-0001 (typed-clean) — control: no few-shot example was added for this format ---");
const control = await extractClaim(getForm("claim-2026-03-0001"), { useFewShot: true });
const controlZero = await extractClaim(getForm("claim-2026-03-0001"), { useFewShot: false });
console.log("identical with/without few-shot: " + (JSON.stringify(control.output) === JSON.stringify(controlZero.output)));
