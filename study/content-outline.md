# Content Outline — Claude Certified Architect: Foundations

Full domain/task-statement breakdown transcribed from `source/Claude_Certified_Architect_-_Foundations_-_Exam_Guide.pdf` (Version 0.2, last updated June 30 2026). This is the ground-truth reference — do not extrapolate exam content beyond what's documented here and in the source PDF.

## Exam details at a glance

| | |
|---|---|
| Credential | Claude Certified Architect – Foundations |
| Questions | 60 |
| Time limit | 120 minutes |
| Response format | Multiple choice, 1 correct + 3 incorrect |
| Exam structure | 4 scenarios drawn at random from a bank of 6 |
| Content domains | 5 (weighted) |
| Delivery | Online proctored or test center |
| Fee | $125 USD |
| Scoring | Scaled 100–1,000, passing = 720 |
| Validity | 12 months from award date |
| Reporting | Pass/fail only |

## Target candidate

A solution architect with 6+ months hands-on experience building with Claude APIs, the Agent SDK, Claude Code, and MCP. Expected hands-on experience:
- Building agentic apps with the Claude Agent SDK (multi-agent orchestration, subagent delegation, tool integration, lifecycle hooks)
- Configuring Claude Code for team workflows (CLAUDE.md, Agent Skills, MCP server integrations, plan mode)
- Designing MCP tool/resource interfaces for backend integration
- Engineering prompts for reliable structured output (JSON schemas, few-shot, extraction patterns)
- Managing context windows across long documents, multi-turn conversations, multi-agent handoffs
- Integrating Claude into CI/CD (automated review, test generation, PR feedback)
- Making escalation/reliability decisions (error handling, human-in-the-loop, self-evaluation)

## Domain weights

| Domain | Weight |
|---|---|
| 1. Agentic Architecture & Orchestration | 27% |
| 2. Tool Design & MCP Integration | 18% |
| 3. Claude Code Configuration & Workflows | 20% |
| 4. Prompt Engineering & Structured Output | 20% |
| 5. Context Management & Reliability | 15% |

Domain 1 and the combined Domain 3/4 pairing dominate the exam (27% + 20% + 20% = 67%). Prioritize study time accordingly — see `study/scope-and-prep.md` for a weighted study plan.

## The 6 exam scenarios (4 of 6 appear per attempt)

Each scenario frames a set of questions from 2–3 "primary domains."

1. **Customer Support Resolution Agent** — Agent SDK agent with MCP tools (`get_customer`, `lookup_order`, `process_refund`, `escalate_to_human`). Target: 80%+ first-contact resolution, correct escalation. *Domains: 1, 2, 5*
2. **Code Generation with Claude Code** — team uses Claude Code for generation/refactor/debug/docs; needs custom slash commands, CLAUDE.md config, plan mode vs direct execution judgment. *Domains: 3, 5*
3. **Multi-Agent Research System** — coordinator delegates to search / document-analysis / synthesis / report-writing subagents; produces cited reports. *Domains: 1, 2, 5*
4. **Developer Productivity with Claude** — Agent SDK agent helps engineers explore codebases, generate boilerplate, automate tasks; uses built-in tools + MCP servers. *Domains: 2, 3, 1*
5. **Claude Code for Continuous Integration** — Claude Code in CI/CD: automated review, test generation, PR feedback; must minimize false positives. *Domains: 3, 4*
6. **Structured Data Extraction** — extracts data from unstructured docs, validates against JSON schema, handles edge cases, feeds downstream systems. *Domains: 4, 5*

---

## Domain 1: Agentic Architecture & Orchestration (27%)

### 1.1 Design and implement agentic loops for autonomous task execution
- The agentic loop lifecycle: send request → inspect `stop_reason` (`tool_use` vs `end_turn`) → execute requested tools → return results for next iteration.
- Tool results get appended to conversation history so the model reasons over them next turn.
- Model-driven decisions (Claude reasons about the next tool call) vs. pre-configured decision trees.
- **Anti-patterns:** parsing natural-language signals to decide loop termination; arbitrary iteration caps as the *primary* stopping mechanism; checking assistant text content as a completion signal. Correct termination check is `stop_reason`.

### 1.2 Orchestrate multi-agent systems with coordinator-subagent patterns
- Hub-and-spoke: a coordinator manages all inter-subagent communication, error handling, routing.
- Subagents run with **isolated context** — they do not automatically inherit the coordinator's conversation history.
- Coordinator responsibilities: task decomposition, delegation, result aggregation, deciding which subagents to invoke based on query complexity.
- **Risk:** overly narrow task decomposition by the coordinator → incomplete coverage of broad tasks (see sample Question 7).
- Skill: dynamically selecting which subagents to invoke rather than always routing through the full pipeline; partitioning scope to minimize duplication; iterative refinement loops (coordinator evaluates synthesis output for gaps, re-delegates with targeted queries); routing all subagent comms through the coordinator for observability/error-handling consistency.

### 1.3 Configure subagent invocation, context passing, and spawning
- The `Task` tool spawns subagents; a coordinator's `allowedTools` must include `"Task"`.
- Subagent context must be **explicitly provided in the prompt** — no automatic inheritance or shared memory between invocations.
- `AgentDefinition` configures each subagent type: descriptions, system prompts, tool restrictions.
- `fork_session` for branching independent explorations from a shared analysis baseline.
- Skills: include complete findings from prior agents directly in the next subagent's prompt; use structured formats to separate content from metadata (source URLs, doc names, page numbers) when passing context, to preserve attribution; spawn **parallel** subagents by emitting multiple `Task` calls in a single coordinator response (not across separate turns); design coordinator prompts around goals/quality criteria rather than step-by-step instructions, to let subagents adapt.

### 1.4 Implement multi-step workflows with enforcement and handoff patterns
- **Programmatic enforcement** (hooks, prerequisite gates) vs. **prompt-based guidance** — know when each is appropriate.
- Deterministic compliance (e.g., identity verification before financial operations) requires enforcement; prompt instructions alone have a non-zero failure rate.
- Structured handoff protocols for mid-process escalation: customer details, root cause analysis, recommended actions.
- Skills: implement programmatic prerequisites that block downstream tool calls until prior steps complete (e.g., block `process_refund` until `get_customer` returns a verified ID); decompose multi-concern requests into distinct items investigated in parallel before synthesizing a unified resolution; compile structured handoff summaries for human agents who lack transcript access.

### 1.5 Apply Agent SDK hooks for tool call interception and data normalization
- Hook patterns: `PostToolUse` intercepts tool *results* for transformation before the model sees them; other hooks intercept *outgoing* tool calls to enforce compliance (e.g., block refunds above a threshold).
- Hooks = deterministic guarantees; prompts = probabilistic compliance. Choose hooks when business rules require guaranteed compliance.
- Skills: normalize heterogeneous data formats (Unix timestamps, ISO 8601, numeric status codes) via `PostToolUse`; implement interception hooks that block policy-violating actions and redirect to alternative workflows (e.g., human escalation).

### 1.6 Design task decomposition strategies for complex workflows
- Fixed sequential pipelines (**prompt chaining**) vs. dynamic adaptive decomposition based on intermediate findings.
- Prompt chaining: break reviews into sequential steps (analyze each file, then a cross-file integration pass).
- Adaptive investigation plans generate subtasks based on what's discovered at each step.
- Skills: select decomposition pattern to the workflow (chaining for predictable multi-aspect reviews, dynamic for open-ended investigation); split large code reviews into per-file local-analysis passes + a separate cross-file integration pass to avoid attention dilution; decompose open-ended tasks by first mapping structure, identifying high-impact areas, then building a plan that adapts as dependencies are discovered.

### 1.7 Manage session state, resumption, and forking
- `--resume <session-name>` continues a specific named prior conversation.
- `fork_session` creates independent branches from a shared baseline to explore divergent approaches.
- Must inform the agent about changes to previously-analyzed files when resuming after code modifications.
- Starting a **new** session with a structured summary is often more reliable than resuming with stale tool results.
- Skills: use `--resume` for named investigation continuity; use `fork_session` to compare divergent approaches (e.g., two refactoring strategies) from one shared codebase analysis; choose resumption (prior context mostly valid) vs. fresh start with injected summary (prior tool results stale); inform a resumed session about specific file changes for targeted re-analysis rather than requiring full re-exploration.

---

## Domain 2: Tool Design & MCP Integration (18%)

### 2.1 Design effective tool interfaces with clear descriptions and boundaries
- Tool **descriptions are the primary mechanism** LLMs use for tool selection; minimal descriptions → unreliable selection among similar tools.
- Include input formats, example queries, edge cases, boundary explanations in descriptions.
- Ambiguous/overlapping descriptions cause misrouting (e.g., `analyze_content` vs `analyze_document`).
- System-prompt wording can create unintended keyword-driven tool associations that override good tool descriptions.
- Skills: write descriptions that differentiate purpose/inputs/outputs/when-to-use-vs-alternatives; rename and re-describe tools to eliminate overlap (e.g., `analyze_content` → `extract_web_results`); split generic tools into purpose-specific tools with defined I/O contracts; audit system prompts for keyword-sensitive instructions that override tool descriptions.

### 2.2 Implement structured error responses for MCP tools
- The `isError` flag pattern communicates tool failures to the agent.
- Error categories: **transient** (timeouts, unavailability), **validation** (invalid input), **business** (policy violations), **permission**.
- Uniform/generic errors ("Operation failed") prevent the agent from making appropriate recovery decisions.
- Distinguish retryable vs. non-retryable; return structured metadata to prevent wasted retries.
- Skills: return `errorCategory`, `isRetryable` boolean, human-readable descriptions; mark business-rule violations `isRetryable: false` with customer-friendly explanations; implement local error recovery within subagents for transient failures, propagating to the coordinator only unrecoverable errors + partial results + what was attempted; distinguish access failures (retry-worthy) from valid empty results (successful query, no matches).

### 2.3 Distribute tools appropriately across agents and configure tool choice
- Too many tools on one agent (e.g., 18 vs 4–5) degrades selection reliability by increasing decision complexity.
- Agents with tools outside their specialization tend to misuse them (e.g., a synthesis agent attempting web search).
- Scoped tool access: give agents only the tools for their role, with limited cross-role tools for high-frequency needs.
- `tool_choice` options: `"auto"`, `"any"`, or forced selection `{"type": "tool", "name": "..."}`.
- Skills: restrict each subagent's tools to its role; replace generic tools with constrained alternatives (e.g., `fetch_url` → `load_document` that validates doc URLs); provide scoped cross-role tools for high-frequency needs (e.g., a `verify_fact` tool on the synthesis agent) while routing complex cases through the coordinator; force tool_choice to guarantee ordering (e.g., force `extract_metadata` before enrichment tools); set `tool_choice: "any"` to guarantee a tool call rather than conversational text.

### 2.4 Integrate MCP servers into Claude Code and agent workflows
- MCP server scoping: project-level `.mcp.json` (shared team tooling) vs. user-level `~/.claude.json` (personal/experimental).
- Environment variable expansion in `.mcp.json` (e.g., `${GITHUB_TOKEN}`) for credentials without committing secrets.
- Tools from all configured MCP servers are discovered at connection time and available simultaneously.
- MCP **resources** expose content catalogs (issue summaries, doc hierarchies, DB schemas) to reduce exploratory tool calls.
- Skills: configure shared servers in project-scoped `.mcp.json` with env-var expansion; configure personal/experimental servers in `~/.claude.json`; enhance MCP tool descriptions so the agent doesn't default to less-capable built-ins (e.g., Grep) over a more capable MCP tool; prefer existing community MCP servers (e.g., Jira) over custom builds for standard integrations, reserving custom servers for team-specific workflows; expose content catalogs as MCP resources to avoid exploratory tool calls.

### 2.5 Select and apply built-in tools (Read, Write, Edit, Bash, Grep, Glob) effectively
- `Grep` = content search (function names, error messages, imports). `Glob` = path pattern matching (find files by name/extension).
- `Read`/`Write` for full-file ops; `Edit` for targeted modification via unique text matching.
- When `Edit` fails on non-unique anchor text, fall back to `Read` + `Write`.
- Skills: use `Grep` to search code content, find callers, locate error messages; use `Glob` for naming-pattern file discovery (`**/*.test.tsx`); build codebase understanding incrementally — `Grep` to find entry points, then `Read` to trace imports/flows, rather than reading everything upfront; trace function usage across wrapper modules by first identifying exported names, then grepping each across the codebase.

---

## Domain 3: Claude Code Configuration & Workflows (20%)

### 3.1 Configure CLAUDE.md files with appropriate hierarchy, scoping, and modular organization
- Hierarchy: user-level (`~/.claude/CLAUDE.md`), project-level (`.claude/CLAUDE.md` or root `CLAUDE.md`), directory-level (subdirectory `CLAUDE.md`).
- **User-level settings are personal only** — not shared with teammates via version control.
- `@import` syntax references external files to keep CLAUDE.md modular (e.g., import package-specific standards).
- `.claude/rules/` directory organizes topic-specific rule files as an alternative to one monolithic CLAUDE.md.
- Skills: diagnose hierarchy issues (new team member missing instructions because they're in user-level, not project-level config); use `@import` to selectively include relevant standards per package; split large CLAUDE.md into focused files in `.claude/rules/` (e.g., `testing.md`, `api-conventions.md`, `deployment.md`); use `/memory` to verify which memory files are loaded and diagnose inconsistent behavior across sessions.

### 3.2 Create and configure custom slash commands and skills
- Project-scoped commands: `.claude/commands/` (shared via version control) vs. user-scoped `~/.claude/commands/` (personal).
- Skills live in `.claude/skills/` with `SKILL.md` frontmatter supporting `context: fork`, `allowed-tools`, `argument-hint`.
- `context: fork` runs a skill in an isolated sub-agent context, keeping verbose output out of the main conversation.
- Personal skill variants can be created in `~/.claude/skills/` to customize without affecting teammates.
- Skills: create project-scoped commands in `.claude/commands/` for team-wide availability; use `context: fork` to isolate verbose/exploratory skill output; configure `allowed-tools` in skill frontmatter to restrict tool access during execution (e.g., prevent destructive actions); use `argument-hint` to prompt developers for required parameters; choose skills (on-demand, task-specific) vs. CLAUDE.md (always-loaded, universal).

### 3.3 Apply path-specific rules for conditional convention loading
- `.claude/rules/` files use YAML frontmatter `paths` fields with glob patterns for conditional activation.
- Path-scoped rules load only when editing matching files — reduces irrelevant context and token usage.
- Advantage over directory-level CLAUDE.md: applies to conventions spanning multiple directories (e.g., test files scattered throughout a codebase).
- Skills: create `.claude/rules/` files with `paths: ["terraform/**/*"]`-style frontmatter; use glob patterns to apply conventions by file type regardless of location (`**/*.test.tsx`); choose path-specific rules over subdirectory CLAUDE.md when conventions must apply across scattered files.

### 3.4 Determine when to use plan mode vs direct execution
- **Plan mode**: complex tasks — large-scale changes, multiple valid approaches, architectural decisions, multi-file modifications. Enables safe exploration/design before committing, preventing costly rework.
- **Direct execution**: simple, well-scoped changes (e.g., a single validation check in one function).
- The **Explore subagent** isolates verbose discovery output, returning summaries to preserve main-conversation context.
- Skills: choose plan mode for architectural-impact tasks (microservice restructuring, 45+-file migrations, competing integration approaches); choose direct execution for well-understood, clearly-scoped changes; use the Explore subagent during multi-phase discovery to prevent context exhaustion; combine plan mode (investigation) with direct execution (implementation) — e.g., plan a library migration, then execute the planned approach.

### 3.5 Apply iterative refinement techniques for progressive improvement
- Concrete input/output examples communicate expected transformations more reliably than prose when results are inconsistent.
- **Test-driven iteration**: write test suites first, iterate by sharing failures.
- **Interview pattern**: have Claude ask questions to surface considerations the developer hadn't anticipated.
- Decide when to batch all issues into one message (interacting problems) vs. fix sequentially (independent problems).
- Skills: provide 2–3 concrete I/O examples when prose produces inconsistent results; write test suites covering behavior/edge cases/performance before implementation, then iterate from failures; use the interview pattern to surface design considerations (cache invalidation, failure modes) before implementing in unfamiliar domains; provide specific test cases with example input/expected output to fix edge-case handling; address multiple *interacting* issues together, iterate *independent* issues sequentially.

### 3.6 Integrate Claude Code into CI/CD pipelines
- `-p` (or `--print`) flag runs Claude Code non-interactively in automated pipelines (prevents hangs waiting on input).
- `--output-format json` with `--json-schema` enforces structured, machine-parseable output for CI.
- CLAUDE.md provides project context (testing standards, fixture conventions, review criteria) to CI-invoked Claude Code.
- **Session context isolation**: the same session that generated code is less effective at reviewing its own changes than an independent review instance.
- Skills: run Claude Code in CI with `-p` to prevent interactive-input hangs; use `--output-format json` + `--json-schema` for machine-parseable findings postable as inline PR comments; include prior review findings in context on re-runs so Claude reports only new/still-unaddressed issues; provide existing test files in context so generation avoids duplicate scenarios; document testing standards/criteria/fixtures in CLAUDE.md to improve generation quality.

---

## Domain 4: Prompt Engineering & Structured Output (20%)

### 4.1 Design prompts with explicit criteria to improve precision and reduce false positives
- Explicit criteria ("flag comments only when claimed behavior contradicts actual code behavior") beat vague instructions ("check that comments are accurate").
- General instructions like "be conservative" or "only report high-confidence findings" don't improve precision the way specific categorical criteria do.
- High false-positive rates in any one category undermine trust in *all* categories.
- Skills: write specific criteria defining what to report vs. skip, rather than confidence-based filtering; temporarily disable high-false-positive categories to restore trust while improving those prompts; define explicit severity criteria with concrete code examples per level.

### 4.2 Apply few-shot prompting to improve output consistency and quality
- Few-shot examples are the most effective technique for consistently-formatted, actionable output when detailed instructions alone fail.
- Useful for demonstrating ambiguous-case handling (tool selection, branch-level coverage gaps) and generalizing judgment to novel patterns (not just memorizing cases).
- Reduces hallucination in extraction (informal measurements, varied document structures).
- Skills: create 2–4 targeted examples for ambiguous scenarios showing *reasoning* for the chosen action; include examples demonstrating the desired output format (location/issue/severity/fix); include examples distinguishing acceptable patterns from genuine issues (reduces false positives while enabling generalization); demonstrate correct handling of varied document structures (inline citations vs. bibliographies); show correct extraction from docs with varied formats to address empty/null extraction.

### 4.3 Enforce structured output using tool use and JSON schemas
- `tool_use` with JSON schemas is the most reliable approach for guaranteed schema-compliant output — eliminates JSON syntax errors (not semantic errors).
- `tool_choice`: `"auto"` (may return text instead), `"any"` (must call *a* tool), forced named tool (must call *that* tool).
- Semantic errors (line items that don't sum, values in wrong fields) persist even with strict schemas.
- Schema design: required vs. optional fields; enum fields with `"other"` + free-text detail for extensibility.
- Skills: define extraction tools with JSON schemas as input params; set `tool_choice: "any"` when multiple extraction schemas exist and doc type is unknown; force a specific tool via `tool_choice: {"type":"tool","name":"..."}` to sequence extraction before enrichment; design optional/nullable fields so the model doesn't fabricate values to satisfy "required"; add `"other"` + detail-string enum patterns for extensible categorization; include format-normalization rules in prompts alongside strict schemas for inconsistent source formatting.

### 4.4 Implement validation, retry, and feedback loops for extraction quality
- **Retry-with-error-feedback**: append specific validation errors to the retry prompt to guide correction.
- Retries are ineffective when the needed info is simply absent from the source (vs. a format/structural error, where retry works).
- Feedback-loop design: track which code constructs trigger findings (`detected_pattern` field) to analyze dismissal patterns systematically.
- Semantic validation errors (don't-sum, wrong-field) vs. schema syntax errors (eliminated by tool use).
- Skills: implement follow-up requests including the original doc + failed extraction + specific validation errors for self-correction; identify when retries will fail (info absent from an external, unprovided doc) vs. succeed (format mismatch, structural error); add `detected_pattern` fields to findings to enable false-positive-pattern analysis; design self-correction validation flows — extract `calculated_total` alongside `stated_total` to flag discrepancies, add `conflict_detected` booleans for inconsistent source data.

### 4.5 Design efficient batch processing strategies
- **Message Batches API**: 50% cost savings, up to 24-hour processing window, **no guaranteed latency SLA**.
- Appropriate for non-blocking, latency-tolerant workloads (overnight reports, weekly audits, nightly test generation); **inappropriate** for blocking workflows (pre-merge checks).
- Batch API does **not** support multi-turn tool calling within a single request (can't execute tools mid-request and return results).
- `custom_id` fields correlate batch request/response pairs.
- Skills: match API choice to workflow latency requirements (sync for blocking pre-merge checks, batch for overnight/weekly); calculate batch submission frequency against SLA constraints (e.g., 4-hour submission windows to guarantee a 30-hour SLA given 24-hour batch processing); handle batch failures by resubmitting only failed documents (identified via `custom_id`) with modifications (e.g., chunking oversized docs); refine prompts on a sample set before batch-processing large volumes to maximize first-pass success and reduce iterative resubmission costs.

### 4.6 Design multi-instance and multi-pass review architectures
- **Self-review limitation**: a model retains reasoning context from generation, making it less likely to question its own decisions in the same session.
- Independent review instances (no prior reasoning context) catch subtle issues better than self-review instructions or extended thinking within the same session.
- **Multi-pass review**: split large reviews into per-file local-analysis passes + cross-file integration passes, to avoid attention dilution and contradictory findings.
- Skills: use a second independent Claude instance to review generated code without the generator's reasoning context; split large multi-file reviews into focused per-file passes + a separate cross-file data-flow pass; run verification passes where the model self-reports confidence alongside each finding to enable calibrated review routing.

---

## Domain 5: Context Management & Reliability (15%)

### 5.1 Manage conversation context to preserve critical information across long interactions
- **Progressive summarization risk**: condensing numerical values, percentages, dates, customer-stated expectations into vague summaries loses critical facts.
- **"Lost in the middle" effect**: models reliably process info at the start/end of long inputs but may omit findings from middle sections.
- Tool results accumulate in context, consuming tokens disproportionately to relevance (e.g., 40+ fields from an order lookup when only 5 matter).
- Full conversation history must be passed in subsequent API requests to maintain coherence.
- Skills: extract transactional facts (amounts, dates, order numbers, statuses) into a persistent "case facts" block included in every prompt, outside the summarized history; extract/persist structured issue data into a separate context layer for multi-issue sessions; trim verbose tool outputs to only relevant fields before they accumulate; place key-findings summaries at the *start* of aggregated inputs, organize detailed results with explicit section headers (mitigates position effects); require subagents to include metadata (dates, source locations, methodological context) in structured outputs; modify upstream agents to return structured data (key facts, citations, relevance scores) instead of verbose content/reasoning chains when downstream agents have limited context budgets.

### 5.2 Design effective escalation and ambiguity resolution patterns
- Appropriate escalation triggers: explicit customer request for a human, policy exceptions/gaps (not just "complex" cases), inability to make meaningful progress.
- Escalate immediately on explicit customer demand; otherwise offer resolution first if the issue is straightforward.
- **Sentiment-based escalation and self-reported confidence scores are unreliable proxies** for actual case complexity.
- Multiple-match ambiguity → request additional identifiers, don't heuristically pick one.
- Skills: add explicit escalation criteria with few-shot examples to the system prompt; honor explicit human-agent requests immediately without first attempting resolution; acknowledge frustration while offering resolution within capability, escalating only if the customer reiterates; escalate when policy is ambiguous/silent on the specific request (e.g., competitor price-matching when policy only covers own-site adjustments); instruct the agent to request additional identifiers on multiple tool-result matches rather than guessing.

### 5.3 Implement error propagation strategies across multi-agent systems
- Structured error context (failure type, attempted query, partial results, alternative approaches) enables intelligent coordinator recovery.
- Distinguish access failures (need retry decision) from valid empty results (successful query, no matches).
- Generic error statuses ("search unavailable") hide context the coordinator needs.
- **Anti-patterns**: silently suppressing errors (returning empty-as-success), terminating entire workflows on a single subagent failure.
- Skills: return structured error context (failure type, what was attempted, partial results, alternatives) for coordinator recovery; distinguish access failures from valid empty results; implement local recovery for transient failures within subagents, propagating only unresolvable errors; structure synthesis output with coverage annotations marking which findings are well-supported vs. gapped due to unavailable sources.

### 5.4 Manage context effectively in large codebase exploration
- Context degradation in extended sessions: inconsistent answers, references to "typical patterns" instead of specific earlier-discovered classes.
- Scratchpad files persist key findings across context boundaries.
- Subagent delegation isolates verbose exploration output while the main agent keeps high-level coordination.
- Structured state persistence for crash recovery: each agent exports state to a known location; coordinator loads a manifest on resume.
- Skills: spawn subagents for specific investigative questions ("find all test files," "trace refund-flow dependencies") while the main agent coordinates at a high level; maintain scratchpad files recording key findings, referenced on subsequent questions to counteract context degradation; summarize key findings from one exploration phase before spawning subagents for the next, injecting summaries into initial context; design crash recovery via structured agent-state exports (manifests) the coordinator loads and injects into prompts on resume; use `/compact` to reduce context usage during extended exploration when context fills with verbose discovery output.

### 5.5 Design human review workflows and confidence calibration
- Aggregate accuracy metrics (e.g., "97% overall") can mask poor performance on specific document types or fields.
- **Stratified random sampling** of high-confidence extractions measures real error rates and detects novel error patterns.
- Field-level confidence scores calibrated against labeled validation sets, used to route review attention.
- Must validate accuracy by document type/field segment before automating away human review on high-confidence cases.
- Skills: implement stratified random sampling of high-confidence extractions for ongoing error-rate measurement; analyze accuracy by document type and field to verify consistent performance across segments; output field-level confidence scores, calibrate thresholds against labeled validation sets; route low-confidence or ambiguous/contradictory-source extractions to human review, prioritizing limited reviewer capacity.

### 5.6 Preserve information provenance and handle uncertainty in multi-source synthesis
- Source attribution is lost when findings are compressed during summarization without preserving claim-source mappings.
- Structured claim-source mappings must be preserved and merged by the synthesis agent, not discarded.
- Conflicting statistics from credible sources: **annotate the conflict with source attribution** rather than arbitrarily picking one value.
- Temporal data (publication/collection dates) prevents misreading genuine temporal differences as contradictions.
- Skills: require subagents to output structured claim-source mappings (source URL, doc name, excerpt) preserved through synthesis; structure reports with explicit sections distinguishing well-established vs. contested findings, preserving original source characterizations/methodological context; complete document analysis with conflicting values explicitly annotated, letting the coordinator decide reconciliation before synthesis; require publication/collection dates in structured outputs for correct temporal interpretation; render different content types appropriately in synthesis (financial data as tables, news as prose, technical findings as structured lists) rather than forcing a uniform format.
