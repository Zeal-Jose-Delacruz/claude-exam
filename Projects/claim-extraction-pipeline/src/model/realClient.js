import { FEW_SHOT_EXAMPLES } from "../data/fewShotExamples.js";

function fewShotMessagesFor(docType) {
  return FEW_SHOT_EXAMPLES.filter((ex) => ex.docType === docType).flatMap((ex) => [
    { role: "user", content: ex.ocrText },
    { role: "assistant", content: [{ type: "tool_use", id: `fewshot-${ex.docType}`, name: "extract_claim", input: ex.expectedExtraction }] },
  ]);
}

// Thin wrapper around the real Anthropic API, forcing the extraction tool
// via tool_choice so the response is always the structured call (never
// prose). Only imported when ANTHROPIC_API_KEY + USE_REAL_API=true are set.
export async function createRealClient() {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic();

  return {
    async extract({ form, tool, useFewShot = false, retryContext }) {
      const messages = useFewShot ? fewShotMessagesFor(form.docType) : [];

      if (retryContext) {
        messages.push({ role: "user", content: form.ocrText });
        messages.push({ role: "assistant", content: [{ type: "tool_use", id: "prev", name: tool.name, input: retryContext.failedExtraction }] });
        messages.push({
          role: "user",
          content: `Your previous extraction failed schema validation:\n${retryContext.errorText}\n\nHere is the original document again — re-extract using the ${tool.name} tool with corrected values. If a field is genuinely not legible on the document, return null for it rather than guessing.`,
        });
      } else {
        messages.push({ role: "user", content: form.ocrText });
      }

      const response = await client.messages.create({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
        max_tokens: 1024,
        tools: [tool],
        tool_choice: { type: "tool", name: tool.name },
        messages,
      });

      const toolUse = response.content.find((b) => b.type === "tool_use");
      return toolUse?.input;
    },
  };
}
