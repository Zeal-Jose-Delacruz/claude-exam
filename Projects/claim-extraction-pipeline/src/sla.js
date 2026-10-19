// Step 8: does batch processing actually fit Meridian's 24-hour SLA?
//
// The SLA clock starts at *scan time*, not at *batch-submit time* — a form
// scanned Monday morning but held until Monday night's batch submission has
// already burned part of its 24 hours before a single API call happens. The
// Message Batches API's own commitment is "processed within 24 hours" with
// no tighter guarantee (it is very often much faster in practice, but that
// is not a contract) — so stacking a same-length batch SLA on top of
// whatever scan-to-submit delay already exists is where a naive "just use
// Batches, it's cheaper" plan breaks.

const BATCH_SLA_CEILING_HOURS = 24; // Anthropic's documented worst case for Message Batches
const MERIDIAN_SLA_HOURS = 24; // scan -> queued for human review

export function evaluateScenario({ label, scanToSubmitHours, observedBatchHours, postProcessMinutes }) {
  const postProcessHours = postProcessMinutes / 60;
  const totalHours = scanToSubmitHours + observedBatchHours + postProcessHours;
  const bufferHours = MERIDIAN_SLA_HOURS - totalHours;

  return {
    label,
    scanToSubmitHours,
    observedBatchHours,
    postProcessHours,
    totalHours,
    bufferHours,
    meetsSla: totalHours <= MERIDIAN_SLA_HOURS,
  };
}

export function runScenarios() {
  return [
    // Submitted promptly, batch finishes near its typical (not worst-case) time.
    evaluateScenario({ label: "steady-state week, submitted every few hours", scanToSubmitHours: 2, observedBatchHours: 2, postProcessMinutes: 20 }),
    // Once-a-week submission: a Monday scan sits until the end-of-week batch run.
    evaluateScenario({ label: "once-a-week batch submission (as literally specified: 'a week's backlog in one batch run')", scanToSubmitHours: 96, observedBatchHours: 2, postProcessMinutes: 20 }),
    // Storm spike: volume surges right when everyone else's batches are also surging,
    // and the batch takes close to Anthropic's documented ceiling.
    evaluateScenario({ label: "storm-spike volume, batch takes close to the 24h ceiling", scanToSubmitHours: 4, observedBatchHours: BATCH_SLA_CEILING_HOURS, postProcessMinutes: 20 }),
  ];
}

export const SLA_CONSTANTS = { BATCH_SLA_CEILING_HOURS, MERIDIAN_SLA_HOURS };
