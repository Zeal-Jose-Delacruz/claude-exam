// Step 9: gate on confidence, but confidence here is the model's own
// self-report — per the exam's uncalibrated-proxy pattern, that's only
// trustworthy once checked against real outcomes (Step 10 does that check).
export const DEFAULT_THRESHOLD = 0.85;

export function routeByConfidence(extractions, threshold = DEFAULT_THRESHOLD) {
  const autoCommit = [];
  const humanReview = [];

  for (const extraction of extractions) {
    const confidence = extraction.output.confidence;
    if (confidence === undefined) {
      throw new Error(`${extraction.customId}: confidence routing requires the V2 schema (confidence field missing)`);
    }
    if (confidence < threshold) {
      humanReview.push(extraction);
    } else {
      autoCommit.push(extraction);
    }
  }

  return { autoCommit, humanReview, threshold };
}
