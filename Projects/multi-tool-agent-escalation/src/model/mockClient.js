// Deterministic stand-in for Claude, used so the agent loop / hooks / error
// handling can be tested without live API calls. It encodes the exact same
// policy as src/systemPrompt.js (verify identity first, retry-once on
// transient, explain validation errors, escalate on permission errors,
// never bypass the refund threshold) but as plain rules instead of learned
// judgment. Swap in src/model/realClient.js for the real thing.

let toolUseIdCounter = 0;
function nextId() {
  toolUseIdCounter += 1;
  return `toolu_mock_${toolUseIdCounter}`;
}

function toolUse(name, input) {
  return { type: "tool_use", id: nextId(), name, input };
}

function textBlock(text) {
  return { type: "text", text };
}

function firstUserText(messages) {
  const first = messages.find((m) => m.role === "user" && typeof m.content === "string");
  return first ? first.content : "";
}

// Reconstructs {name, input, result}[] for every tool call so far by walking
// the message history and matching tool_use blocks to their tool_result by id.
function extractCallHistory(messages) {
  const calls = [];
  const pending = new Map(); // tool_use_id -> {name, input}

  for (const message of messages) {
    if (message.role === "assistant" && Array.isArray(message.content)) {
      for (const block of message.content) {
        if (block.type === "tool_use") pending.set(block.id, { name: block.name, input: block.input });
      }
    }
    if (message.role === "user" && Array.isArray(message.content)) {
      for (const block of message.content) {
        if (block.type === "tool_result") {
          const call = pending.get(block.tool_use_id);
          if (call) {
            calls.push({ ...call, result: JSON.parse(block.content) });
          }
        }
      }
    }
  }
  return calls;
}

function extractEmail(text) {
  const m = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  // Strip a trailing sentence period the greedy match can swallow, e.g.
  // "jane.doe@example.com." at the end of a clause.
  return m ? m[0].replace(/\.+$/, "") : undefined;
}

function extractPhone(text) {
  const m = text.match(/\b\d{3}-\d{3,4}(-\d{4})?\b/);
  return m ? m[0] : undefined;
}

function extractOrderId(text) {
  const m = text.match(/\bord_[a-zA-Z0-9]+\b/);
  if (m) return m[0];
  if (/\b(my last order|most recent order)\b/i.test(text)) return "latest";
  return undefined;
}

function lastCallOf(calls, name) {
  const matches = calls.filter((c) => c.name === name);
  return matches[matches.length - 1];
}

function countTransient(calls, name) {
  return calls.filter((c) => c.name === name && c.result?.errorCategory === "transient").length;
}

export function createMockClient() {
  return {
    async createMessage({ messages }) {
      const userText = firstUserText(messages);
      const calls = extractCallHistory(messages);

      const wantsRefund = /refund/i.test(userText);
      const wantsCredit = /\bcredit\b/i.test(userText) && !/refund/i.test(userText);
      const wantsEmailUpdate = /(update|change).{0,20}email/i.test(userText);
      const orderId = extractOrderId(userText);

      // 1. Always verify identity first.
      const customerCalls = calls.filter((c) => c.name === "get_customer");
      const lastCustomerCall = customerCalls[customerCalls.length - 1];

      if (!lastCustomerCall) {
        const input = { email: extractEmail(userText), phone: extractPhone(userText) };
        return respondToolUse([toolUse("get_customer", input)]);
      }

      if (lastCustomerCall.result.error) {
        const cat = lastCustomerCall.result.errorCategory;

        if (cat === "validation") {
          return respondEndTurn(
            `I wasn't able to find an account matching that information — could you double-check the email or phone number on file? (${lastCustomerCall.result.message})`
          );
        }

        if (cat === "permission") {
          const escalated = lastCallOf(calls, "escalate_to_human");
          if (escalated) {
            return respondEndTurn(
              `I've escalated this to a supervisor (ticket ${escalated.result.ticket_id}) — they'll follow up on this account directly.`
            );
          }
          return respondToolUse([
            toolUse("escalate_to_human", {
              reason: "account_access_restricted",
              customer_id: undefined,
              attempted_tools: calls.map((c) => c.name),
              notes: lastCustomerCall.result.message,
            }),
          ]);
        }

        if (cat === "transient") {
          if (countTransient(calls, "get_customer") < 2) {
            return respondToolUse([toolUse("get_customer", lastCustomerCall.input)]);
          }
          const escalated = lastCallOf(calls, "escalate_to_human");
          if (escalated) {
            return respondEndTurn(
              `I'm having trouble reaching the account lookup service after a couple of tries, so I've escalated this (ticket ${escalated.result.ticket_id}) to a supervisor.`
            );
          }
          return respondToolUse([
            toolUse("escalate_to_human", {
              reason: "tool_unavailable_after_retry",
              attempted_tools: calls.map((c) => c.name),
              notes: "get_customer timed out twice in a row; escalating rather than retrying further.",
            }),
          ]);
        }
      }

      const customer_id = lastCustomerCall.result.customer_id;

      // 2. Order-related concern (refund or credit).
      const lastOrderCall = lastCallOf(calls, "lookup_order");
      if ((wantsRefund || wantsCredit) && orderId && !lastOrderCall) {
        return respondToolUse([toolUse("lookup_order", { customer_id, order_id: orderId })]);
      }

      if (lastOrderCall) {
        if (lastOrderCall.result.error) {
          const cat = lastOrderCall.result.errorCategory;
          if (cat === "validation") {
            return respondEndTurn(
              `I looked into your order, but: ${lastOrderCall.result.message} Could you confirm the order number?`
            );
          }
          if (cat === "permission") {
            return respondToolUse([
              toolUse("escalate_to_human", {
                reason: "permission_error_on_order_lookup",
                customer_id,
                attempted_tools: calls.map((c) => c.name),
                notes: lastOrderCall.result.message,
              }),
            ]);
          }
          if (cat === "transient") {
            if (countTransient(calls, "lookup_order") < 2) {
              return respondToolUse([toolUse("lookup_order", lastOrderCall.input)]);
            }
            const escalated = lastCallOf(calls, "escalate_to_human");
            if (escalated) {
              return respondEndTurn(
                `The order lookup service timed out twice, so I've escalated this (ticket ${escalated.result.ticket_id}) to a supervisor rather than keep retrying.`
              );
            }
            return respondToolUse([
              toolUse("escalate_to_human", {
                reason: "tool_unavailable_after_retry",
                customer_id,
                attempted_tools: calls.map((c) => c.name),
                notes: "lookup_order timed out twice in a row; escalating rather than retrying further.",
              }),
            ]);
          }
        } else {
          const order = lastOrderCall.result;
          const refundCall = lastCallOf(calls, "process_refund");
          const creditCall = lastCallOf(calls, "issue_store_credit");

          if (wantsRefund && !refundCall) {
            return respondToolUse([
              toolUse("process_refund", {
                customer_id,
                order_id: order.order_id,
                amount: order.amount,
                reason: "customer_requested_refund",
              }),
            ]);
          }
          if (wantsCredit && !creditCall) {
            return respondToolUse([
              toolUse("issue_store_credit", {
                customer_id,
                order_id: order.order_id,
                amount: order.amount,
                reason: "customer_agreed_to_credit",
              }),
            ]);
          }
          if (refundCall && refundCall.result.blocked) {
            const alreadyEscalatedForRefund = calls.some(
              (c) => c.name === "escalate_to_human" && c.input.reason === "refund_amount_exceeds_threshold"
            );
            if (!alreadyEscalatedForRefund) {
              return respondToolUse([
                toolUse("escalate_to_human", {
                  reason: "refund_amount_exceeds_threshold",
                  customer_id,
                  amount_requested: refundCall.input.amount,
                  attempted_tools: calls.map((c) => c.name),
                  notes: "Order confirmed eligible; blocked only by the $500 threshold.",
                }),
              ]);
            }
          }
        }
      }

      // 3. Secondary concern this tool surface can't handle: escalate just
      // that part, then synthesize one reply covering everything.
      if (wantsEmailUpdate) {
        const alreadyEscalatedForEmail = calls.some(
          (c) => c.name === "escalate_to_human" && c.input.reason === "unsupported_request_no_tool"
        );
        if (!alreadyEscalatedForEmail) {
          return respondToolUse([
            toolUse("escalate_to_human", {
              reason: "unsupported_request_no_tool",
              customer_id,
              attempted_tools: calls.map((c) => c.name),
              notes: "Customer asked to update the email on file; no tool at the agent tier can do this.",
            }),
          ]);
        }
      }

      return respondEndTurn(composeFinalReply({ calls, wantsRefund, wantsCredit, wantsEmailUpdate }));
    },
  };
}

function respondToolUse(contentBlocks) {
  return { stop_reason: "tool_use", content: contentBlocks };
}

function respondEndTurn(text) {
  return { stop_reason: "end_turn", content: [textBlock(text)] };
}

function composeFinalReply({ calls, wantsRefund, wantsCredit, wantsEmailUpdate }) {
  const parts = [];
  const refundCall = lastCallOf(calls, "process_refund");
  const creditCall = lastCallOf(calls, "issue_store_credit");
  const emailEscalation = calls.find(
    (c) => c.name === "escalate_to_human" && c.input.reason === "unsupported_request_no_tool"
  );
  const thresholdEscalation = calls.find(
    (c) => c.name === "escalate_to_human" && c.input.reason === "refund_amount_exceeds_threshold"
  );

  if (wantsRefund && refundCall && refundCall.result.refunded) {
    parts.push(`I've refunded $${refundCall.result.amount} to your original payment method.`);
  } else if (wantsRefund && thresholdEscalation) {
    parts.push(
      `Your refund request of $${thresholdEscalation.input.amount_requested} is above what I can approve myself, so I've escalated it to a supervisor (ticket ${thresholdEscalation.result.ticket_id}) — they'll follow up shortly.`
    );
  }

  if (wantsCredit && creditCall && creditCall.result.credit_issued) {
    parts.push(`I've added $${creditCall.result.amount} in account credit.`);
  }

  if (wantsEmailUpdate) {
    if (emailEscalation) {
      parts.push(
        `I'm not able to update the email on your account myself, so I've flagged that for a specialist (ticket ${emailEscalation.result.ticket_id}) who will follow up.`
      );
    }
  }

  if (parts.length === 0) {
    parts.push("I've looked into your request — let me know if there's anything else I can help with.");
  }

  return parts.join(" ");
}
