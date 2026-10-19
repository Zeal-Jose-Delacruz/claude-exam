import { validateAgainstSchema, formatValidationErrors } from "./validate.js";
import { CLAIM_SCHEMA_V1, CLAIM_SCHEMA_V2_WITH_CONFIDENCE, EXTRACT_CLAIM_TOOL_V1, EXTRACT_CLAIM_TOOL_V2 } from "./schema.js";
import { createModelClient } from "./model/index.js";

function buildRetryMessage(errors) {
  // Step 3: the follow-up carries the exact validation error, not a vague
  // "try again" — this is what lets the model fix the *specific* thing it
  // got wrong instead of re-guessing blind.
  const detail = errors[0];
  return `Your previous extraction failed schema validation: ${detail.message}. Here is the original document again — re-extract ${detail.path} correctly. If it is genuinely not legible on the document, return null for it rather than guessing.`;
}

const MAX_RETRIES = 1; // one bounded retry: format/enum slips get fixed, genuine illegibility doesn't improve on the second pass either

export async function extractClaim(form, { withConfidence = false, useFewShot = false } = {}) {
  const schema = withConfidence ? CLAIM_SCHEMA_V2_WITH_CONFIDENCE : CLAIM_SCHEMA_V1;
  const tool = withConfidence ? EXTRACT_CLAIM_TOOL_V2 : EXTRACT_CLAIM_TOOL_V1;
  const client = await createModelClient();

  const retryLog = [];
  let output = await client.extract({ form, tool, useFewShot });
  let validation = validateAgainstSchema(schema, output);

  let attempt = 1;
  while (!validation.valid && attempt <= MAX_RETRIES) {
    const errorText = formatValidationErrors(validation.errors);
    const followUpMessage = buildRetryMessage(validation.errors);
    const failedExtraction = output;

    attempt += 1;
    output = await client.extract({ form, tool, useFewShot, retryContext: { failedExtraction, errorText } });
    const nextValidation = validateAgainstSchema(schema, output);

    retryLog.push({
      attempt,
      errorText,
      followUpMessage,
      failedExtraction,
      correctedExtraction: output,
      fixed: nextValidation.valid,
    });

    validation = nextValidation;
  }

  let outcome;
  if (retryLog.length === 0) outcome = "first_pass_valid";
  else if (validation.valid) outcome = "resolved_by_retry";
  else outcome = "not_resolvable";

  return {
    customId: form.customId,
    docType: form.docType,
    output,
    valid: validation.valid,
    errors: validation.errors,
    attempts: attempt,
    retryLog,
    outcome,
  };
}
