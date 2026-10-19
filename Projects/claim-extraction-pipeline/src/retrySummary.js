// Step 4: the count that actually matters operationally. resolved_by_retry
// tells you to invest in prompt/format fixes; not_resolvable tells you the
// null is real and the field needs a human, not another retry attempt.
export function summarizeRetryOutcomes(results) {
  const summary = {
    first_pass_valid: 0,
    resolved_by_retry: 0,
    not_resolvable: 0,
    resolved_reasons: [],
    not_resolvable_reasons: [],
  };

  for (const r of results) {
    summary[r.outcome] += 1;
    if (r.outcome === "resolved_by_retry") {
      summary.resolved_reasons.push({ customId: r.customId, reason: r.retryLog[0].errorText });
    }
    if (r.outcome === "not_resolvable") {
      summary.not_resolvable_reasons.push({ customId: r.customId, reason: r.retryLog[0].errorText });
    }
  }

  return summary;
}
