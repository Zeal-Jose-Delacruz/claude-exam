import { extractClaim } from "../src/extract.js";
import { getForm } from "../src/data/forms.js";

console.log("=== Step 3: validation-retry loop ===\n");

for (const customId of ["claim-2026-03-0105", "claim-2026-03-0118"]) {
  const form = getForm(customId);
  const result = await extractClaim(form);

  console.log(`--- ${customId} (${form.docType}) ---`);
  console.log("Attempt 1 (failed validation):");
  console.log(JSON.stringify(result.retryLog[0].failedExtraction, null, 2));
  console.log("\nValidation error sent back:\n" + result.retryLog[0].errorText);
  console.log("\nFollow-up message sent to the model:\n" + result.retryLog[0].followUpMessage);
  console.log("\nAttempt 2 (after retry):");
  console.log(JSON.stringify(result.retryLog[0].correctedExtraction, null, 2));
  console.log(`\noutcome: ${result.outcome}, schema-valid: ${result.valid}`);
  console.log();
}
