import { createMockClient } from "./mockClient.js";
import { createRealClient } from "./realClient.js";

export async function createModelClient() {
  if (process.env.ANTHROPIC_API_KEY && process.env.USE_REAL_API === "true") {
    return createRealClient();
  }
  return createMockClient();
}
