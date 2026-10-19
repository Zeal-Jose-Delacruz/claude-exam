import { createMockClient } from "../src/model/mockClient.js";
import { runAgent } from "../src/agentLoop.js";
import { SYSTEM_PROMPT } from "../src/systemPrompt.js";

export async function runScenario(userText) {
  const model = createMockClient();
  const messages = [{ role: "user", content: userText }];
  return runAgent({ model, system: SYSTEM_PROMPT, messages });
}

export function namesOf(trace) {
  return trace.map((t) => t.name);
}
