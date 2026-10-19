// Tool surface for the Northbrook support agent, in Anthropic Messages API
// `tools` format. Every description states not just WHAT the tool does but
// WHEN to prefer it over a similar one — this is the primary defense against
// tool-selection errors, since the model never sees the implementation.

export const TOOLS = [
  {
    name: "get_customer",
    description:
      "Look up a customer's identity and account standing by email or phone. " +
      "Use this FIRST in any request that references a specific customer or account " +
      "— never infer who the customer is from an order number, a name mentioned in " +
      "passing, or earlier conversation context alone. Every other tool below requires " +
      "the customer_id this returns, so call it before lookup_order, process_refund, or " +
      "issue_store_credit. Returns a validation error (not a generic failure) if no " +
      "account matches, and a permission error if the matched account is restricted.",
    input_schema: {
      type: "object",
      properties: {
        email: { type: "string", description: "Customer's email address." },
        phone: { type: "string", description: "Customer's phone number, any common format." },
      },
    },
  },
  {
    name: "lookup_order",
    description:
      "Look up one order's status, line items, and refund eligibility by order_id. " +
      "Requires a verified customer_id from get_customer — do not call this with a " +
      "customer_id you have not just obtained from get_customer in this conversation, " +
      "and do not guess an order_id the customer didn't explicitly provide. Pass " +
      "order_id: 'latest' only if the customer refers to their most recent order " +
      "without naming an order number. Call this before process_refund or " +
      "issue_store_credit to confirm the order actually qualifies — don't skip " +
      "straight to issuing money or credit on an order you haven't checked.",
    input_schema: {
      type: "object",
      properties: {
        customer_id: { type: "string", description: "Verified customer_id from get_customer." },
        order_id: { type: "string", description: "The order's id, or 'latest' for the customer's most recent order." },
      },
      required: ["customer_id", "order_id"],
    },
  },
  {
    name: "process_refund",
    description:
      "Refund money to the customer's ORIGINAL PAYMENT METHOD for a specific order. " +
      "Use only when the customer explicitly wants their money back (not credit) and " +
      "lookup_order has confirmed the order is refund-eligible. Any amount over $500 " +
      "is intercepted in code before this tool runs and redirected to " +
      "escalate_to_human — that check cannot be bypassed by splitting the amount " +
      "across multiple calls, so don't try. Prefer issue_store_credit instead when " +
      "the customer agrees to credit, or when their original payment method can no " +
      "longer accept a refund (e.g. a closed or expired card).",
    input_schema: {
      type: "object",
      properties: {
        customer_id: { type: "string" },
        order_id: { type: "string" },
        amount: { type: "number", description: "Refund amount in dollars." },
        reason: { type: "string", description: "Short reason code for the refund." },
      },
      required: ["customer_id", "order_id", "amount", "reason"],
    },
  },
  {
    name: "issue_store_credit",
    description:
      "Issue non-cash ACCOUNT CREDIT instead of refunding to the original payment " +
      "method. Use when the customer agrees to credit, when their original payment " +
      "method can no longer accept a refund, or as a goodwill gesture outside a " +
      "refund-eligible order. Do NOT use this as a workaround for the $500 " +
      "process_refund threshold — if the customer wants cash back above $500, the " +
      "right move is still escalate_to_human, not routing them to credit instead. " +
      "Requires a verified customer_id; order_id is optional (omit it for credit " +
      "not tied to a specific order).",
    input_schema: {
      type: "object",
      properties: {
        customer_id: { type: "string" },
        order_id: { type: "string", description: "Optional — omit if not tied to one order." },
        amount: { type: "number", description: "Credit amount in dollars." },
        reason: { type: "string", description: "Short reason code for the credit." },
      },
      required: ["customer_id", "amount", "reason"],
    },
  },
  {
    name: "escalate_to_human",
    description:
      "Hand off the conversation to a human supervisor with a structured summary. " +
      "Use when: a refund was blocked for exceeding the $500 threshold (you'll " +
      "usually be redirected here automatically), a tool returned a permission " +
      "error, a tool failed twice in a row (one retry already attempted), or the " +
      "request needs judgment or a capability no tool here provides. Never hand off " +
      "with just 'needs human review' — always populate reason, attempted_tools, and " +
      "notes/findings so the supervisor doesn't have to re-ask the customer " +
      "everything you already know. This ends your turn; don't call further tools " +
      "after it.",
    input_schema: {
      type: "object",
      properties: {
        reason: { type: "string", description: "Short machine-readable reason code, e.g. 'refund_amount_exceeds_threshold'." },
        customer_id: { type: "string" },
        amount_requested: { type: "number" },
        attempted_tools: {
          type: "array",
          items: { type: "string" },
          description: "Names of tools already called in this conversation, in order.",
        },
        notes: { type: "string", description: "Plain-language findings for the supervisor." },
      },
      required: ["reason", "attempted_tools", "notes"],
    },
  },
];
