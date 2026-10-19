import test from "node:test";
import assert from "node:assert/strict";
import { validateAgainstSchema } from "../src/validate.js";
import { CLAIM_SCHEMA_V1 } from "../src/schema.js";

const valid = {
  claimant_name: "A. Test",
  incident_date: "2026-01-01",
  injury_type: "collision",
  injury_type_detail: null,
  policy_number: null,
};

test("accepts a fully valid extraction", () => {
  const { valid: ok, errors } = validateAgainstSchema(CLAIM_SCHEMA_V1, valid);
  assert.equal(ok, true);
  assert.deepEqual(errors, []);
});

test("rejects a non-ISO date", () => {
  const { valid: ok, errors } = validateAgainstSchema(CLAIM_SCHEMA_V1, { ...valid, incident_date: "March 2nd, 2026" });
  assert.equal(ok, false);
  assert.equal(errors[0].keyword, "format");
});

test("rejects a mis-cased enum value", () => {
  const { valid: ok, errors } = validateAgainstSchema(CLAIM_SCHEMA_V1, { ...valid, injury_type: "Collision" });
  assert.equal(ok, false);
  assert.equal(errors[0].keyword, "enum");
});

test("rejects null for a required non-nullable field", () => {
  const { valid: ok, errors } = validateAgainstSchema(CLAIM_SCHEMA_V1, { ...valid, claimant_name: null });
  assert.equal(ok, false);
  assert.equal(errors[0].keyword, "type");
});

test("accepts null for policy_number", () => {
  const { valid: ok } = validateAgainstSchema(CLAIM_SCHEMA_V1, { ...valid, policy_number: null });
  assert.equal(ok, true);
});
