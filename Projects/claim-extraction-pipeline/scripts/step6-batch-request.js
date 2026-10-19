import { buildWeeklyBatch } from "../src/batch.js";

console.log("=== Step 6: Message Batches API request design ===\n");

const { requests } = buildWeeklyBatch(100);

console.log(`Total requests in this batch: ${requests.length}`);
console.log(`Unique custom_ids: ${new Set(requests.map((r) => r.custom_id)).size}`);
console.log("\nOne example request entry:");
console.log(JSON.stringify(requests[2], null, 2).slice(0, 1200) + "\n... (truncated)");
console.log("\nLast request (the oversized bundle we'll see fail in Step 7):");
console.log(JSON.stringify({ custom_id: requests.at(-1).custom_id, params: { ...requests.at(-1).params, messages: "[omitted, 40-page bundle]" } }, null, 2));
