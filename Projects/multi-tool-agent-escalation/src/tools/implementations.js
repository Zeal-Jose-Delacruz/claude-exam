import { findCustomerByEmailOrPhone, findOrder } from "../data/db.js";
import { transientError, validationError, permissionError } from "../errors.js";

const REFUND_THRESHOLD = 500;

// These sentinel values simulate a flaky downstream dependency so the
// transient-error path is reachable in tests without real network flakiness.
const SIMULATED_TRANSIENT_TARGETS = new Set(["ord_flaky", "flaky@timeout.test", "555-0000"]);
function isSimulatedTransientTarget(id) {
  return SIMULATED_TRANSIENT_TARGETS.has(id);
}

export function getCustomer({ email, phone } = {}) {
  if (!email && !phone) {
    return validationError("Provide an email or phone number to look up the customer.");
  }
  if (isSimulatedTransientTarget(email) || isSimulatedTransientTarget(phone)) {
    return transientError("Customer lookup service timed out. Please try again.");
  }
  const match = findCustomerByEmailOrPhone({ email, phone });
  if (!match) {
    return validationError("No account found for that email or phone number.");
  }
  if (match.standing === "restricted") {
    return permissionError(
      `Account ${match.customer_id} is restricted at the agent tier; a supervisor must handle this account.`
    );
  }
  return {
    customer_id: match.customer_id,
    name: match.name,
    email: match.email,
    phone: match.phone,
    standing: match.standing,
  };
}

export function lookupOrder({ customer_id, order_id } = {}) {
  if (!customer_id || !order_id) {
    return validationError("customer_id and order_id are both required to look up an order.");
  }
  if (isSimulatedTransientTarget(order_id)) {
    return transientError("Order lookup service timed out. Please try again.");
  }
  const order = findOrder({ customer_id, order_id });
  if (!order) {
    return validationError(`No order found for customer ${customer_id} matching '${order_id}'.`);
  }
  return {
    order_id: order.order_id,
    status: order.status,
    items: order.items,
    amount: order.amount,
    refund_eligible: order.refund_eligible,
  };
}

export function processRefund({ customer_id, order_id, amount, reason } = {}) {
  if (!customer_id || !order_id || amount == null) {
    return validationError("customer_id, order_id, and amount are required to process a refund.");
  }
  // Defense in depth: the PreToolUse hook is expected to block amounts over
  // threshold before this ever runs, but the tool itself refuses too, so the
  // rule holds even if a caller reaches this function directly.
  if (amount > REFUND_THRESHOLD) {
    return permissionError(
      `Refunds over $${REFUND_THRESHOLD} require supervisor sign-off and cannot be processed by this tool.`
    );
  }
  const order = findOrder({ customer_id, order_id });
  if (!order) {
    return validationError(`No order found for customer ${customer_id} matching '${order_id}'.`);
  }
  if (!order.refund_eligible) {
    return validationError(`Order ${order.order_id} is not refund-eligible.`);
  }
  return {
    refunded: true,
    customer_id,
    order_id: order.order_id,
    amount,
    method: "original_payment_method",
    reason,
  };
}

export function issueStoreCredit({ customer_id, order_id, amount, reason } = {}) {
  if (!customer_id || amount == null) {
    return validationError("customer_id and amount are required to issue store credit.");
  }
  if (order_id) {
    const order = findOrder({ customer_id, order_id });
    if (!order) {
      return validationError(`No order found for customer ${customer_id} matching '${order_id}'.`);
    }
  }
  return {
    credit_issued: true,
    customer_id,
    order_id: order_id || null,
    amount,
    method: "account_credit",
    reason,
  };
}

let escalationCounter = 1000;

export function escalateToHuman(input = {}) {
  const { reason, attempted_tools, notes } = input;
  if (!reason || !attempted_tools || !notes) {
    return validationError("reason, attempted_tools, and notes are all required to escalate to a human.");
  }
  escalationCounter += 1;
  return {
    escalated: true,
    ticket_id: `esc_${escalationCounter}`,
    ...input,
  };
}

export const REFUND_THRESHOLD_FOR_HOOK = REFUND_THRESHOLD;
