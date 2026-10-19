import { TOOLS } from "./tools/schema.js";
import { getCustomer, lookupOrder, processRefund, issueStoreCredit, escalateToHuman } from "./tools/implementations.js";
import { runPreToolUseHooks } from "./hooks.js";

const TOOL_IMPLS = {
  get_customer: getCustomer,
  lookup_order: lookupOrder,
  process_refund: processRefund,
  issue_store_credit: issueStoreCredit,
  escalate_to_human: escalateToHuman,
};

async function executeTool(name, input) {
  const impl = TOOL_IMPLS[name];
  if (!impl) {
    return { error: true, errorCategory: "validation", isRetryable: false, message: `Unknown tool '${name}'.` };
  }
  return impl(input);
}

/**
 * Runs the agentic loop: call the model, and for as long as it asks for
 * tool_use, execute the tools (through the PreToolUse hook gate), append the
 * results, and re-call. Stops ONLY when stop_reason is not 'tool_use' —
 * never by scanning assistant text for phrases like "I'm done".
 */
export async function runAgent({ model, system, messages, tools = TOOLS, maxTurns = 10 }) {
  const trace = []; // {name, input, result, blocked} for every tool call, in order
  let turns = 0;
  let response = await model.createMessage({ system, messages, tools });

  while (response.stop_reason === "tool_use") {
    turns += 1;
    if (turns > maxTurns) {
      throw new Error(`Exceeded maxTurns (${maxTurns}) without reaching end_turn.`);
    }

    const toolUseBlocks = response.content.filter((b) => b.type === "tool_use");
    const toolResults = [];

    for (const block of toolUseBlocks) {
      const hookResult = runPreToolUseHooks(block.name, block.input);
      let resultPayload;

      if (hookResult.block) {
        resultPayload = {
          error: true,
          errorCategory: "policy_block",
          isRetryable: false,
          blocked: true,
          redirectTo: hookResult.redirectTo,
          reason: hookResult.reason,
          message: hookResult.message,
        };
      } else {
        resultPayload = await executeTool(block.name, block.input);
      }

      trace.push({ name: block.name, input: block.input, result: resultPayload, blocked: !!hookResult.block });
      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: JSON.stringify(resultPayload),
      });
    }

    messages.push({ role: "assistant", content: response.content });
    messages.push({ role: "user", content: toolResults });

    response = await model.createMessage({ system, messages, tools });
  }

  messages.push({ role: "assistant", content: response.content });

  const finalText = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  return { response, messages, trace, finalText };
}
