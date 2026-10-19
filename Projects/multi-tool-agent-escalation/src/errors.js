// Structured error shape every tool returns instead of throwing or returning
// a bare string. errorCategory drives how the agent (and the test matrix)
// reacts: transient -> retry, validation -> explain to the customer,
// permission -> escalate immediately.

export function transientError(message) {
  return { error: true, errorCategory: "transient", isRetryable: true, message };
}

export function validationError(message) {
  return { error: true, errorCategory: "validation", isRetryable: false, message };
}

export function permissionError(message) {
  return { error: true, errorCategory: "permission", isRetryable: false, message };
}
