import { runScenarios, SLA_CONSTANTS } from "../src/sla.js";

console.log("=== Step 8: wall-clock vs the 24-hour SLA ===\n");
console.log(`Meridian SLA: queued for review within ${SLA_CONSTANTS.MERIDIAN_SLA_HOURS}h of scanning`);
console.log(`Batches API documented ceiling: ${SLA_CONSTANTS.BATCH_SLA_CEILING_HOURS}h (often much faster, but not guaranteed tighter)\n`);

for (const s of runScenarios()) {
  console.log(`--- ${s.label} ---`);
  console.log(`  scan -> batch submit: ${s.scanToSubmitHours}h`);
  console.log(`  batch processing:     ${s.observedBatchHours}h`);
  console.log(`  validation/routing:   ${s.postProcessHours.toFixed(2)}h`);
  console.log(`  total:                ${s.totalHours.toFixed(2)}h`);
  console.log(`  buffer vs SLA:        ${s.bufferHours.toFixed(2)}h`);
  console.log(`  meets SLA:            ${s.meetsSla}`);
  console.log();
}
