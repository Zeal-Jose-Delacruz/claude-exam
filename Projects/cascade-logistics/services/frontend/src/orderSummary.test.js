const test = require("node:test");
const assert = require("node:assert/strict");
const { formatOrderSummary } = require("./orderSummary");

test("formats an order with no refund", () => {
  const summary = formatOrderSummary({ orderId: "o1", status: "created" });
  assert.equal(summary.status, "created");
  assert.equal(summary.refundedDisplay, null);
});

test("formats an order with a refund as behavior, not a snapshot", () => {
  const summary = formatOrderSummary({ orderId: "o1", status: "created", refundedCents: 500 });
  assert.equal(summary.refundedDisplay, "$5.00 refunded");
});

test("rejects an order with no orderId", () => {
  assert.throws(() => formatOrderSummary({}));
});
