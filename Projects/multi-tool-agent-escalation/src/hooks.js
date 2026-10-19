// PreToolUse hooks run in code, between the model choosing a tool and the
// tool actually executing. This is where the $500 refund threshold is
// enforced — it cannot be talked around by the system prompt or by the model
// deciding process_refund is fine this time, because the tool never runs.

const REFUND_THRESHOLD = 500;

const hooks = {
  process_refund(call) {
    if (call.input.amount > REFUND_THRESHOLD) {
      return {
        block: true,
        redirectTo: "escalate_to_human",
        reason: "refund_amount_exceeds_threshold",
        message: `Refund of $${call.input.amount} exceeds the $${REFUND_THRESHOLD} threshold and requires supervisor sign-off.`,
      };
    }
    return { block: false };
  },
};

export function runPreToolUseHooks(toolName, input) {
  const hook = hooks[toolName];
  if (!hook) return { block: false };
  return hook({ input });
}

export { REFUND_THRESHOLD };
