# Multi-Tool Agent with Escalation Logic

Tier-1 support agent for Northbrook Financial's consumer lending app. Looks up
accounts, resolves billing disputes, processes small refunds automatically,
and hands off anything bigger or more ambiguous to a human — with the $500
refund threshold enforced in code, not just the system prompt.

## Layout

```
src/
  tools/schema.js            Tool definitions (Anthropic `tools` format)
  tools/implementations.js   Tool logic against the mock DB + structured errors
  data/db.js                 In-memory customers/orders
  errors.js                  transient / validation / permission error shapes
  hooks.js                   PreToolUse hook enforcing the $500 refund cap
  agentLoop.js                The loop: call model -> execute tools (via hook) -> append results -> re-call, stop only on end_turn
  systemPrompt.js             Prompt for real Claude usage
  model/realClient.js         Wraps @anthropic-ai/sdk
  model/mockClient.js         Deterministic rule-based stand-in for Claude (see below)
  model/index.js              Picks real vs mock client
test/                         Node's built-in test runner (`node --test`)
scripts/demo.js                Prints a full transcript for both refund paths
```

## Running it

```
npm test     # runs the test matrix (no API key needed)
npm run demo # prints the under-$500 / over-$500 transcripts
```

To run against the real Claude API instead of the mock model, set:

```
ANTHROPIC_API_KEY=sk-...  USE_REAL_API=true  npm run demo
```

(requires `npm install` for `@anthropic-ai/sdk`, not needed for `npm test`).

## Why a mock model?

This environment has outbound network access but no `ANTHROPIC_API_KEY`
configured, and the test matrix (step 5), the multi-concern decomposition
test (step 8), and the pass/fail check (step 9) all need to run
deterministically and repeatably without live API calls or spending the
user's credits. `src/model/mockClient.js` encodes the exact same policy as
`src/systemPrompt.js` — verify identity first, retry once on transient
errors then escalate, explain validation errors, escalate immediately on
permission errors, never bypass the refund threshold, decompose multi-concern
messages — but as plain rules instead of learned judgment. Swap in
`model/realClient.js` (already wired through `model/index.js`) to use the
real thing; the agent loop, hooks, and tool implementations don't change.

## What's enforced in code vs. in the prompt

The $500 refund threshold is checked in `src/hooks.js`, which runs in
`agentLoop.js` *before* `process_refund` executes — a blocked call never
reaches the implementation, so it can't move money regardless of what the
model decided or what the system prompt says. `src/tools/implementations.js`
also independently refuses any `process_refund` call over $500 as a
defense-in-depth backstop (see the test in `refundThreshold.test.js` that
calls the hook and the tool directly, bypassing the agent loop entirely).

## Known gaps / follow-ups

- **"My last order" phrasing.** `lookup_order` requires an explicit
  `order_id` (or the `'latest'` sentinel). There's no tool for "find this
  customer's most recent order" beyond that sentinel, and no tool resolves
  an order from unstructured text. The step 8 test message was adapted to
  name `ord_301` explicitly rather than silently assuming the agent can
  infer "last order" — a real deployment would want either a dedicated
  lookup or the model consistently asking a clarifying question.
- **`issue_store_credit` has no code-enforced cap.** The $500 threshold
  hook only intercepts `process_refund`, per the brief. `issue_store_credit`
  is disambiguated in its description to discourage using credit as a
  threshold workaround, but that's prompt-level guidance only — nothing in
  `hooks.js` stops a large store-credit issuance in code. Worth deciding
  whether store credit should carry its own cap before this goes further
  than a study exercise.
- **Mock model is rule-based, not a judgment test.** It proves the
  surrounding architecture (loop mechanics, hook enforcement, structured
  errors, structured handoffs, multi-concern decomposition) works
  end-to-end, but it does not exercise whether a real Claude call would make
  the same tool-selection and disambiguation decisions on novel phrasing.
  Re-run `npm run demo` with `USE_REAL_API=true` against a real key to
  validate that separately.
- **Single in-memory mock DB**, no persistence, no auth — fine for this
  exercise, not production-ready as-is.
