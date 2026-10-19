import test from "node:test";
import assert from "node:assert/strict";
import { runScenario, namesOf } from "./helpers.js";

// Step 5 test matrix: confirm the agent reacts differently to each of the
// three error categories a tool can return.

test("transient error: retries the same call once, then escalates", async () => {
  const { trace, finalText, response } = await runScenario(
    "Hi, this is flaky@timeout.test, can you check my account?"
  );

  assert.deepEqual(namesOf(trace), ["get_customer", "get_customer", "escalate_to_human"]);
  assert.equal(trace[0].result.errorCategory, "transient");
  assert.equal(trace[0].input.email, trace[1].input.email, "retry must repeat the exact same call");
  assert.equal(trace[2].input.reason, "tool_unavailable_after_retry");
  assert.equal(response.stop_reason, "end_turn");
  assert.match(finalText, /escalated/i);
});

test("validation error: explains the problem to the customer in plain language, no escalation", async () => {
  const { trace, finalText, response } = await runScenario(
    "Hi, can you look up my account? My email is nobody@nowhere.com"
  );

  assert.deepEqual(namesOf(trace), ["get_customer"]);
  assert.equal(trace[0].result.errorCategory, "validation");
  assert.equal(response.stop_reason, "end_turn");
  assert.match(finalText, /wasn't able to find an account/i);
  assert.ok(!finalText.match(/ticket/i), "validation errors should not be escalated");
});

test("permission error: stops immediately and escalates, no retry attempted", async () => {
  const { trace, finalText, response } = await runScenario(
    "Hi, I'm at restricted@example.com, I need some help with my account."
  );

  assert.deepEqual(namesOf(trace), ["get_customer", "escalate_to_human"]);
  assert.equal(trace[0].result.errorCategory, "permission");
  assert.equal(trace[1].input.reason, "account_access_restricted");
  assert.equal(response.stop_reason, "end_turn");
  assert.match(finalText, /escalated/i);
});
