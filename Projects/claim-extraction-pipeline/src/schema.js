// Step 1: the extraction tool's JSON schema, built around the claim form's
// real fields. All five keys are required (the model must always address
// every field) but injury_type_detail and policy_number allow null so a
// genuinely illegible/missing value is representable without inventing one.
export const CLAIM_SCHEMA_V1 = {
  type: "object",
  properties: {
    claimant_name: {
      type: "string",
      description: "Full name of the claimant as printed or signed on the form.",
    },
    incident_date: {
      type: "string",
      format: "date",
      description: "Date of the incident, ISO 8601 (YYYY-MM-DD).",
    },
    injury_type: {
      type: "string",
      enum: ["collision", "theft", "weather", "other"],
      description: "Best-fit category for the claim. Use 'other' when none of the three specific categories apply.",
    },
    injury_type_detail: {
      type: ["string", "null"],
      description: "Free-text description, used when injury_type is 'other' or when extra context is legible. Null if there is nothing to add.",
    },
    policy_number: {
      type: ["string", "null"],
      description: "Null if the policy number is illegible, missing, or not present on the form — never a guessed or reconstructed value.",
    },
  },
  required: ["claimant_name", "incident_date", "injury_type", "injury_type_detail", "policy_number"],
  additionalProperties: false,
};

// Step 9 extends the schema with a self-reported confidence field used for
// human-review routing. Kept as a separate export (not merged into V1) so
// the step-1 schema stays exactly what step 1 asked for.
export const CLAIM_SCHEMA_V2_WITH_CONFIDENCE = {
  ...CLAIM_SCHEMA_V1,
  properties: {
    ...CLAIM_SCHEMA_V1.properties,
    confidence: {
      type: "number",
      minimum: 0,
      maximum: 1,
      description: "Model's own confidence that every field above is correct and complete, 0-1.",
    },
  },
  required: [...CLAIM_SCHEMA_V1.required, "confidence"],
};

function toTool(name, description, schema) {
  return {
    name,
    description,
    input_schema: schema,
  };
}

export const EXTRACT_CLAIM_TOOL_V1 = toTool(
  "extract_claim",
  "Extract structured fields from a scanned auto-insurance claim form. Never invent a value for a field that is not legibly present on the form — return null instead.",
  CLAIM_SCHEMA_V1
);

export const EXTRACT_CLAIM_TOOL_V2 = toTool(
  "extract_claim",
  "Extract structured fields from a scanned auto-insurance claim form, including a self-reported confidence score. Never invent a value for a field that is not legibly present on the form — return null instead.",
  CLAIM_SCHEMA_V2_WITH_CONFIDENCE
);
