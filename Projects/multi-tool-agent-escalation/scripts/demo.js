import { createModelClient } from "../src/model/index.js";
import { runAgent } from "../src/agentLoop.js";
import { SYSTEM_PROMPT } from "../src/systemPrompt.js";

function printTrace(label, userText, { trace, finalText, response }) {
  console.log(`\n=== ${label} ===`);
  console.log(`customer: ${userText}`);
  for (const step of trace) {
    const tag = step.blocked ? "BLOCKED+REDIRECTED" : step.result?.error ? "ERROR" : "ok";
    console.log(`  -> ${step.name}(${JSON.stringify(step.input)}) [${tag}]`);
    console.log(`     ${JSON.stringify(step.result)}`);
  }
  console.log(`agent (${response.stop_reason}): ${finalText}`);
}

async function main() {
  const model = await createModelClient();

  const under = await runAgent({
    model,
    system: SYSTEM_PROMPT,
    messages: [
      { role: "user", content: "Hi, I'm jane.doe@example.com and I'd like a refund for order ord_301, it was delivered late." },
    ],
  });
  printTrace("Refund under $500", "order ord_301 ($120)", under);

  const over = await runAgent({
    model,
    system: SYSTEM_PROMPT,
    messages: [
      { role: "user", content: "Hi, I'm jane.doe@example.com, order ord_302 never arrived, I want a refund." },
    ],
  });
  printTrace("Refund over $500", "order ord_302 ($740)", over);
}

main();
