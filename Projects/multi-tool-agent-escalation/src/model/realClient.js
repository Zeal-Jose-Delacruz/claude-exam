// Thin wrapper around the real Anthropic API. Only imported/used when
// ANTHROPIC_API_KEY is set, so the mock-based tests never need the SDK
// installed or a network call.
export async function createRealClient() {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic();

  return {
    async createMessage({ system, messages, tools }) {
      const response = await client.messages.create({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
        max_tokens: 1024,
        system,
        messages,
        tools,
      });
      return response;
    },
  };
}
