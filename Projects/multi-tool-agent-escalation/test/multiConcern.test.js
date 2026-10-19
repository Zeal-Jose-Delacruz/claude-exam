import test from "node:test";
import assert from "node:assert/strict";
import { runScenario, namesOf } from "./helpers.js";

// Step 8: a single message bundling two unrelated concerns. The tool
// surface has nothing for "update my email," so the agent should resolve
// the refund with the right tool AND escalate only the unsupported part,
// then synthesize one reply covering both — not stop after the first thing
// it noticed.
//
// Note: the illustrative prompt says "my last order" with no order id. Our
// tools have no "find the customer's most recent order" capability — only
// lookup_order by an explicit id (or the 'latest' sentinel, see the gap
// noted in README). This test spells out order_id ord_301 so the scenario
// is resolvable; the ambiguity is flagged as a follow-up, not silently
// papered over.

test("decomposes a multi-concern message: refunds via the right tool, escalates the unsupported part, one coherent reply", async () => {
  const { trace, finalText, response } = await runScenario(
    "Hi, I'm jane.doe@example.com. My order ord_301 never arrived and I'd like a refund for it " +
      "— also, can you update the email on my account to my new one?"
  );

  assert.deepEqual(namesOf(trace), [
    "get_customer",
    "lookup_order",
    "process_refund",
    "escalate_to_human",
  ]);

  const refund = trace[2];
  assert.equal(refund.result.refunded, true);
  assert.equal(refund.result.amount, 120);

  const escalation = trace[3];
  assert.equal(escalation.input.reason, "unsupported_request_no_tool");
  assert.match(escalation.input.notes, /email/i);
  assert.deepEqual(escalation.input.attempted_tools, ["get_customer", "lookup_order", "process_refund"]);

  assert.equal(response.stop_reason, "end_turn");
  // One reply, both concerns addressed.
  assert.match(finalText, /refunded \$120/i);
  assert.match(finalText, /update the email/i);
});
