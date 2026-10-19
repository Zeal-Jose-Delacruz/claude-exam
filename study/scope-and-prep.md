# Scope, Appendix Concepts, and Preparation Plan

## In-scope topics (explicitly tested)

- Agentic loop implementation: control flow based on `stop_reason`, tool result handling, loop termination conditions
- Multi-agent orchestration: coordinator-subagent patterns, task decomposition, parallel subagent execution, iterative refinement loops
- Subagent context management: explicit context passing, structured state persistence, crash recovery using manifests
- Tool interface design: writing effective tool descriptions, splitting vs. consolidating tools, tool naming to reduce ambiguity
- MCP tool and resource design: resources for content catalogs, tools for actions, description quality for adoption
- MCP server configuration: project vs. user scope, environment variable expansion, multi-server simultaneous access
- Error handling and propagation: structured error responses, transient vs. business vs. permission errors, local recovery before escalation
- Escalation decision-making: explicit criteria, honoring customer preferences, policy gap identification
- CLAUDE.md configuration: hierarchy (user/project/directory), `@import` patterns, `.claude/rules/` with glob patterns
- Custom commands and skills: project vs. user scope, `context: fork`, `allowed-tools`, `argument-hint` frontmatter
- Plan mode vs. direct execution: complexity assessment, architectural decisions, single-file changes
- Iterative refinement: input/output examples, test-driven iteration, interview pattern, sequential vs. parallel issue resolution
- Structured output via `tool_use`: schema design, `tool_choice` configuration, nullable fields to prevent hallucination
- Few-shot prompting: ambiguous scenario targeting, format consistency, false-positive reduction
- Batch processing: Message Batches API appropriateness, latency tolerance assessment, failure handling by `custom_id`
- Context window optimization: trimming verbose tool outputs, structured fact extraction, position-aware input ordering
- Human review workflows: confidence calibration, stratified sampling, accuracy segmentation by document type and field
- Information provenance: claim-source mappings, temporal data handling, conflict annotation, coverage gap reporting

## Out-of-scope topics (will NOT appear on the exam)

- Fine-tuning Claude models or training custom models
- Claude API authentication, billing, or account management
- Detailed implementation of specific programming languages/frameworks (beyond what tool/schema configuration needs)
- Deploying or hosting MCP servers (infrastructure, networking, container orchestration)
- Claude's internal architecture, training process, or model weights
- Constitutional AI, RLHF, or safety training methodologies
- Embedding models or vector database implementation details
- Computer use (browser automation, desktop interaction)
- Vision/image analysis capabilities
- Streaming API implementation or server-sent events
- Rate limiting, quotas, or API pricing calculations
- OAuth, API key rotation, or authentication protocol details
- Specific cloud provider configurations (AWS, GCP, Azure)
- Performance benchmarking or model comparison metrics
- Prompt caching implementation details (beyond knowing it exists)
- Token counting algorithms or tokenization specifics

**Study-time implication:** if a practice resource or tutorial drifts into any out-of-scope item above, deprioritize it — it won't be tested, and the real exam guide is explicit that it's excluded.

## Appendix: technologies/concepts that might appear

- **Claude Agent SDK** — agent definitions, agentic loops, `stop_reason` handling, hooks (`PostToolUse`, tool call interception), subagent spawning via the `Task` tool, `allowedTools` configuration
- **Model Context Protocol (MCP)** — MCP servers, MCP tools, MCP resources, `isError` flag, tool descriptions, tool distribution, `.mcp.json` configuration, environment variable expansion
- **Claude Code** — CLAUDE.md hierarchy (user/project/directory), `.claude/rules/` with YAML frontmatter path-scoping, `.claude/commands/` for slash commands, `.claude/skills/` with SKILL.md frontmatter (`context: fork`, `allowed-tools`, `argument-hint`), plan mode, direct execution, `/memory` command, `/compact`, `--resume`, `fork_session`, Explore subagent
- **Claude Code CLI** — `-p`/`--print` flag for non-interactive mode, `--output-format json`, `--json-schema` for structured CI output
- **Claude API** — `tool_use` with JSON schemas, `tool_choice` options (`"auto"`, `"any"`, forced selection), `stop_reason` values (`"tool_use"`, `"end_turn"`), `max_tokens`, system prompts
- **Message Batches API** — 50% cost savings, up to 24-hour processing window, `custom_id` for request/response correlation, polling for completion, no multi-turn tool-calling support
- **JSON Schema** — required vs. optional fields, enum types, nullable fields, `"other"` + detail string patterns, strict mode for syntax-error elimination
- **Pydantic** — schema validation, semantic validation errors, validation-retry loops
- **Built-in tools** — Read, Write, Edit, Bash, Grep, Glob — their purposes and selection criteria
- **Few-shot prompting** — targeted examples for ambiguous scenarios, format demonstration, generalization to novel patterns
- **Prompt chaining** — sequential task decomposition into focused passes
- **Context window management** — token budgets, progressive summarization, lost-in-the-middle effects, context extraction, scratchpad files
- **Session management** — session resumption, `fork_session`, named sessions, session context isolation
- **Confidence scoring** — field-level confidence, calibration with labeled validation sets, stratified sampling for error-rate measurement

## API & mechanics cheat sheet — facts to know cold

These are concrete mechanism-level facts, not tradeoff judgment calls (see `hidden-patterns.md` for those) — the kind of thing a question can turn on even when you understand the underlying principle, because the trap option is a plausible-sounding mechanism that doesn't actually exist or doesn't apply here.

- **`tool_choice` forcing prefills the assistant turn.** `{"type": "any"}` or a named tool forces Claude's turn to start directly with the `tool_use` block — no prompt wording can get prose written first, because the API itself prefills the message. If a workflow needs both a guaranteed tool call *and* an explanation, put the explanation in a field on the tool's own input schema and keep the forced choice; switching to `{"type": "auto"}` restores text output but gives up the call guarantee.
- **`@file` references bypass hooks entirely.** An `@path` reference inserts the file's content straight into the prompt without any tool call, so neither `PreToolUse` nor `PostToolUse` ever fires on it. The only enforcement surface that reaches `@`-pulled content is a `Read` deny permission rule — hooks guard the tool-call lifecycle, permission rules guard access more broadly.
- **`PreToolUse` vs. `PostToolUse` act on opposite sides of a call.** `PreToolUse` can return `updatedInput` to rewrite what goes *into* a tool call before it executes. `PostToolUse` can return `hookSpecificOutput.updatedToolOutput` to replace what the model sees coming *out* of a completed call (e.g., normalizing heterogeneous timestamp formats). Reaching for the wrong one means the hook either has no output to rewrite yet, or never sees the normalized-or-not result at all.
- **MCP catalog-membership vs. content-change notifications are different capabilities.** `resources.listChanged` + `notifications/resources/list_changed` cover resources appearing or disappearing from the catalog. `resources.subscribe` + `notifications/resources/updated` cover a known URI's *content* changing. A stale-catalog problem (entries that no longer exist) needs `listChanged`, not `subscribe`.
- **`@import` paths in CLAUDE.md resolve relative to the file that contains them, never the launch directory.** A package-level `services/api/CLAUDE.md` importing a repo-root standards file needs `@../../standards/...` — the path is relative to `services/api/CLAUDE.md` itself, regardless of where `claude` was invoked from.
- **`"strict": true` guarantees input shape, not tool selection or truth.** Strict tool use turns on constrained sampling so `tool_use.input` is guaranteed to match the `input_schema` (correct types, required fields present). It fixes malformed input from the *right* tool; it does nothing for wrong-tool selection, and a schema-conformant finding can still be substantively wrong. `input_examples` and prompt guidance only improve the odds of a well-formed input — they don't guarantee it the way strict mode does.
- **Wrong-tool-selection is almost always a system-prompt-keyword or tool-description problem, not a hook/routing problem.** A generic instruction like "always search for X" can pull Claude toward any tool whose name or description matches that word, even when that tool's own description states a clear boundary — the keyword in the *system prompt* is the stronger signal. Separately, two tools confused for each other (e.g., one that checks eligibility, one that executes an action) usually need their descriptions rewritten to state when to use each one versus the other, since the description is the primary signal the model reads at tool-selection time. Fix whichever of the two is actually driving the mismatch before reaching for a hook, a routing layer, or removing a tool the agent is also using correctly elsewhere.

## Official exam preparation recommendations

1. Build an agent with the Claude Agent SDK: implement a complete agentic loop with tool calling, error handling, and session management. Practice spawning subagents and passing context between them.
2. Configure Claude Code for a real project: set up CLAUDE.md with a configuration hierarchy, create path-specific rules in `.claude/rules/`, build custom skills with frontmatter options (`context: fork`, `allowed-tools`), and integrate at least one MCP server.
3. Design and test MCP tools: write tool descriptions that clearly differentiate similar tools. Implement structured error responses with error categories and retryable flags. Test tool selection reliability with ambiguous requests.
4. Build a structured data extraction pipeline: use `tool_use` with JSON schemas, implement validation-retry loops, design schemas with optional/nullable fields, and practice batch processing with the Message Batches API.
5. Practice prompt engineering techniques: write few-shot examples for ambiguous scenarios. Define explicit review criteria to reduce false positives. Design multi-pass review architectures for large code reviews.
6. Study context management patterns: practice extracting structured facts from verbose tool outputs, implementing scratchpad files for long sessions, and designing subagent delegation to manage context limits.
7. Review escalation and human-in-the-loop patterns: understand when to escalate (policy gaps, customer requests, inability to progress) versus resolve autonomously. Practice designing human review workflows with confidence-based routing.

## Preparation exercises (27 total, as numbered in the official guide)

### Exercise 1 — Build a Multi-Tool Agent with Escalation Logic
*Reinforces: Domain 1, Domain 2, Domain 5*
1. Define 3–4 MCP tools with detailed descriptions that clearly differentiate purpose, expected inputs, and boundary conditions. Include at least two tools with similar functionality requiring careful description to avoid selection confusion.
2. Implement an agentic loop that checks `stop_reason` to decide whether to continue tool execution or present the final response. Handle both `"tool_use"` and `"end_turn"` correctly.
3. Add structured error responses to your tools: `errorCategory` (transient/validation/permission), `isRetryable` boolean, human-readable descriptions. Test that the agent handles each error type appropriately (retrying transient errors, explaining business errors to the user).
4. Implement a programmatic hook that intercepts tool calls to enforce a business rule (e.g., blocking operations above a threshold amount), redirecting to an escalation workflow when triggered.
5. Test with multi-concern messages (requests involving multiple issues) and verify the agent decomposes the request, handles each concern, and synthesizes a unified response.

### Exercise 2 — Configure Claude Code for a Team Development Workflow
*Reinforces: Domain 3, Domain 2*
6. Create a project-level CLAUDE.md with universal coding standards and testing conventions. Verify instructions placed at the project level are consistently applied across all team members.
7. Create `.claude/rules/` files with YAML frontmatter glob patterns for different code areas (e.g., `paths: ["src/api/**/*"]` for API conventions, `paths: ["**/*.test.*"]` for testing conventions). Test that rules load only when editing matching files.
8. Create a project-scoped skill in `.claude/skills/` with `context: fork` and `allowed-tools` restrictions. Verify the skill runs in isolation without polluting the main conversation context.
9. Configure an MCP server in `.mcp.json` with environment variable expansion for credentials. Add a personal experimental MCP server in `~/.claude.json` and verify both are available simultaneously.
10. Test plan mode versus direct execution on tasks of varying complexity: a single-file bug fix, a multi-file library migration, and a new feature with multiple valid implementation approaches. Observe when plan mode provides value.

### Exercise 3 — Build a Structured Data Extraction Pipeline
*Reinforces: Domain 4, Domain 5*
11. Define an extraction tool with a JSON schema containing required and optional fields, an enum with an `"other"` + detail string pattern, and nullable fields for information that may not exist in source documents. Process documents where some fields are absent and verify the model returns null rather than fabricating values.
12. Implement a validation-retry loop: when Pydantic/JSON schema validation fails, send a follow-up request including the document, the failed extraction, and the specific validation error. Track which errors are resolvable via retry (format mismatches) versus which are not (information absent from source).
13. Add few-shot examples demonstrating extraction from documents with varied formats (inline citations vs. bibliographies, narrative descriptions vs. structured tables) and verify improved handling of structural variety.
14. Design a batch processing strategy: submit a batch of 100 documents using the Message Batches API, handle failures by `custom_id`, resubmit failed documents with modifications (e.g., chunking oversized documents), and calculate total processing time relative to SLA constraints.
15. Implement a human review routing strategy: have the model output field-level confidence scores, route low-confidence extractions to human review, and analyze accuracy by document type and field to verify consistent performance.

### Exercise 4 — Design and Debug a Multi-Agent Research Pipeline
*Reinforces: Domain 1, Domain 2, Domain 5*
16. Build a coordinator agent that delegates to at least two subagents (e.g., web search and document analysis). Ensure the coordinator's `allowedTools` includes `"Task"` and that each subagent receives its research findings directly in its prompt rather than relying on automatic context inheritance.
17. Implement parallel subagent execution by having the coordinator emit multiple `Task` tool calls in a single response. Measure the latency improvement compared to sequential execution.
18. Design structured output for subagents that separates content from metadata: each finding should include a claim, evidence excerpt, source URL/document name, and publication date. Verify the synthesis subagent preserves source attribution when combining findings.
19. Implement error propagation: simulate a subagent timeout and verify the coordinator receives structured error context (failure type, attempted query, partial results). Test that the coordinator can proceed with partial results and annotate the final output with coverage gaps.
20. Test with conflicting source data (two credible sources with different statistics) and verify the synthesis output preserves both values with source attribution rather than arbitrarily selecting one, and structures the report to distinguish well-established from contested findings.

### Exercises 21–27 — Broader integration practice
21. Build an agent with the Claude Agent SDK: implement a complete agentic loop with tool calling, error handling, and session management. Practice spawning subagents and passing context between them.
22. Configure Claude Code for a real project: set up CLAUDE.md with a configuration hierarchy, create path-specific rules in `.claude/rules/`, build custom skills with frontmatter options (`context: fork`, `allowed-tools`), and integrate at least one MCP server.
23. Design and test MCP tools: write tool descriptions that clearly differentiate similar tools. Implement structured error responses with error categories and retryable flags. Test tool selection reliability with ambiguous requests.
24. Build a structured data extraction pipeline: use `tool_use` with JSON schemas, implement validation-retry loops, design schemas with optional/nullable fields, and practice batch processing with the Message Batches API.
25. Practice prompt engineering techniques: write few-shot examples for ambiguous scenarios. Define explicit review criteria to reduce false positives. Design multi-pass review architectures for large code reviews.
26. Study context management patterns: practice extracting structured facts from verbose tool outputs, implementing scratchpad files for long sessions, and designing subagent delegation to manage context limits.
27. Review escalation and human-in-the-loop patterns: understand when to escalate (policy gaps, customer requests, inability to progress) versus resolve autonomously. Practice designing human review workflows with confidence-based routing.

*(21–27 restate the 7 official "Exam Preparation Recommendations" verbatim as the guide numbers them — they are not distinct from items 1–20 above but are listed as the guide's closing checklist.)*
