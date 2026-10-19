import { extractClaim } from "../src/extract.js";
import { getForm } from "../src/data/forms.js";

console.log("=== Step 2: null instead of invented values ===\n");

const customId = "claim-2026-03-0042";
const form = getForm(customId);
const result = await extractClaim(form);

console.log(`--- ${customId} (${form.docType}) ---`);
console.log("OCR text:\n" + form.ocrText);
console.log("\nExtraction:");
console.log(JSON.stringify(result.output, null, 2));
console.log(`schema-valid: ${result.valid}, policy_number is null: ${result.output.policy_number === null}`);
console.log();
console.log(
  "Note: claimant_name/incident_date are required-and-non-nullable in the Step 1 schema, so a form\n" +
    "where ONE OF THOSE is illegible (not just policy_number) fails validation and enters the retry\n" +
    "path instead of returning null on the first pass — that stricter case (claim-2026-03-0231,\n" +
    "claim-2026-03-0240) is covered properly in Step 4."
);

