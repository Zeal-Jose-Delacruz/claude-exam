import test from "node:test";
import assert from "node:assert/strict";
import { runScenario, namesOf } from "./helpers.js";

// Step 6 + Step 9: the $500 threshold is enforced by the PreToolUse hook in
// code, not the prompt — process_refund is never actually invoked with the
// blocked amount; the hook substitutes a blocked/redirect result instead.

test("refund under $500 resolves automatically, no escalation", async () => {
  const { trace, finalText, response } = await runScenario(
    "Hi, I'm jane.doe@example.com and I'd like a refund for order ord_301, it was delivered late."
  );

  assert.deepEqual(namesOf(trace), ["get_customer", "lookup_order", "process_refund"]);
  const refundCall = trace[2];
  assert.equal(refundCall.blocked, false);
  assert.equal(refundCall.result.refunded, true);
  assert.equal(refundCall.result.amount, 120);
  assert.equal(response.stop_reason, "end_turn");
  assert.match(finalText, /refunded \$120/i);
  assert.ok(!finalText.match(/ticket/i), "a refund under threshold must not be escalated");
});

test("refund over $500 is blocked in code and escalated with a structured summary", async () => {
  const { trace, finalText, response } = await runScenario(
    "Hi, I'm jane.doe@example.com, order ord_302 never arrived, I want a refund."
  );

  assert.deepEqual(namesOf(trace), ["get_customer", "lookup_order", "process_refund", "escalate_to_human"]);

  const refundAttempt = trace[2];
  assert.equal(refundAttempt.blocked, true, "process_refund must be blocked, not executed");
  assert.equal(refundAttempt.result.refunded, undefined, "the tool must never report money moved");
  assert.equal(refundAttempt.result.redirectTo, "escalate_to_human");

  const escalation = trace[3];
  assert.equal(escalation.input.reason, "refund_amount_exceeds_threshold");
  assert.equal(escalation.input.amount_requested, 740);
  assert.deepEqual(escalation.input.attempted_tools, ["get_customer", "lookup_order", "process_refund"]);
  assert.ok(escalation.input.notes && escalation.input.notes.length > 0, "handoff must include notes, not just a reason code");
  assert.equal(escalation.result.escalated, true);

  assert.equal(response.stop_reason, "end_turn");
  assert.match(finalText, /escalated/i);
});

test("the hook blocks process_refund even for amounts just over the line", async () => {
  // Defense-in-depth sanity check directly on the hook + tool, independent
  // of the agent loop: the implementation itself also refuses, in case the
  // hook were ever bypassed.
  const { processRefund } = await import("../src/tools/implementations.js");
  const { runPreToolUseHooks } = await import("../src/hooks.js");

  const input = { customer_id: "cus_8841", order_id: "ord_302", amount: 500.01, reason: "test" };
  const hookResult = runPreToolUseHooks("process_refund", input);
  assert.equal(hookResult.block, true);

  const directResult = processRefund(input);
  assert.equal(directResult.error, true);
  assert.equal(directResult.errorCategory, "permission");
});
