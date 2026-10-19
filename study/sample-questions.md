# Sample Questions — transcribed with explanations

All 12 official sample questions from the exam guide's practice set, verbatim, grouped by scenario. These are drawn from the practice test; the real exam draws 4 of 6 scenarios and 60 total questions, so treat these as *calibration examples* of difficulty and style, not a representative sample of content weighting.

---

## Scenario: Customer Support Resolution Agent

**Q1.** Production data shows that in 12% of cases, your agent skips `get_customer` entirely and calls `lookup_order` using only the customer's stated name, occasionally leading to misidentified accounts and incorrect refunds. What change would most effectively address this reliability issue?

- A) Add a programmatic prerequisite that blocks `lookup_order` and `process_refund` calls until `get_customer` has returned a verified customer ID.
- B) Enhance the system prompt to state that customer verification via `get_customer` is mandatory before any order operations.
- C) Add few-shot examples showing the agent always calling `get_customer` first, even when customers volunteer order details.
- D) Implement a routing classifier that analyzes each request and enables only the subset of tools appropriate for that request type.

**Answer: A.** When a specific tool sequence is required for critical business logic (verifying identity before refunds), programmatic enforcement gives deterministic guarantees that prompt-based approaches can't. B/C rely on probabilistic LLM compliance — insufficient when errors have financial consequences. D addresses tool *availability*, not tool *ordering* — not the actual problem.
→ Maps to Task 1.4 / 1.5 (enforcement vs. guidance, hooks).

**Q2.** Production logs show the agent frequently calls `get_customer` when users ask about orders (e.g., "check my order #12345"), instead of calling `lookup_order`. Both tools have minimal descriptions ("Retrieves customer information" / "Retrieves order details") and accept similar identifier formats. What's the most effective first step to improve tool selection reliability?

- A) Add few-shot examples to the system prompt demonstrating correct tool selection patterns, with 5–8 examples showing order-related queries routing to `lookup_order`.
- B) Expand each tool's description to include input formats it handles, example queries, edge cases, and boundaries explaining when to use it versus similar tools.
- C) Implement a routing layer that parses user input before each turn and pre-selects the appropriate tool based on detected keywords and identifier patterns.
- D) Consolidate both tools into a single `lookup_entity` tool that accepts any identifier and internally determines which backend to query.

**Answer: B.** Tool descriptions are the primary mechanism LLMs use for selection. Minimal descriptions starve the model of the context needed to differentiate. B is the low-effort, high-leverage *first step*. A adds token overhead without fixing the root cause. C is over-engineered and bypasses the LLM's own understanding. D is a valid architectural choice but more effort than a "first step" warrants.
→ Maps to Task 2.1 (tool description quality).

**Q3.** Your agent achieves 55% first-contact resolution, well below the 80% target. Logs show it escalates straightforward cases (standard damage replacements with photo evidence) while attempting to autonomously handle complex situations requiring policy exceptions. What's the most effective way to improve escalation calibration?

- A) Add explicit escalation criteria to your system prompt with few-shot examples demonstrating when to escalate versus resolve autonomously.
- B) Have the agent self-report a confidence score (1–10) before each response and automatically route requests to humans when confidence falls below a threshold.
- C) Deploy a separate classifier model trained on historical tickets to predict which requests need escalation before the main agent begins processing.
- D) Implement sentiment analysis to detect customer frustration levels and automatically escalate when negative sentiment exceeds a threshold.

**Answer: A.** Explicit criteria + few-shot examples directly fix the root cause: unclear decision boundaries. This is the proportionate first response before adding infrastructure. B fails — self-reported confidence is poorly calibrated (the agent is *already* confidently wrong). C is over-engineered, needs labeled data/ML infra before prompt optimization was even tried. D solves a different problem — sentiment doesn't correlate with case complexity.
→ Maps to Task 5.2 (escalation patterns; confidence/sentiment as unreliable proxies).

---

## Scenario: Code Generation with Claude Code

**Q4.** You want to create a custom `/review` slash command that runs your team's standard code review checklist, available to every developer when they clone or pull the repository. Where should you create this command file?

- A) In the `.claude/commands/` directory in the project repository.
- B) In `~/.claude/commands/` in each developer's home directory.
- C) In the `CLAUDE.md` file at the project root.
- D) In a `.claude/config.json` file with a commands array.

**Answer: A.** Project-scoped slash commands live in `.claude/commands/` — version-controlled, automatically available to all developers who clone/pull. B is personal, not shared. C is for project instructions/context, not command definitions. D doesn't exist in Claude Code.
→ Maps to Task 3.2.

**Q5.** You've been assigned to restructure the team's monolithic application into microservices. This involves changes across dozens of files and requires decisions about service boundaries and module dependencies. Which approach should you take?

- A) Enter plan mode to explore the codebase, understand dependencies, and design an implementation approach before making changes.
- B) Start with direct execution and make changes incrementally, letting the implementation reveal the natural service boundaries.
- C) Use direct execution with comprehensive upfront instructions detailing exactly how each service should be structured.
- D) Begin in direct execution mode and only switch to plan mode if you encounter unexpected complexity during implementation.

**Answer: A.** Plan mode exists precisely for large-scale, multi-valid-approach, architectural-decision tasks. B risks costly rework from late-discovered dependencies. C assumes you already know the right structure without having explored. D ignores that the complexity is already known upfront, not something that might emerge later.
→ Maps to Task 3.4 (plan mode vs. direct execution).

**Q6.** Your codebase has distinct areas with different coding conventions: React components use functional style with hooks, API handlers use async/await with specific error handling, and database models follow a repository pattern. Test files are spread throughout the codebase alongside the code they test (e.g., `Button.test.tsx` next to `Button.tsx`), and you want all tests to follow the same conventions regardless of location. What's the most maintainable way to ensure Claude automatically applies the correct conventions when generating code?

- A) Create rule files in `.claude/rules/` with YAML frontmatter specifying glob patterns to conditionally apply conventions based on file paths.
- B) Consolidate all conventions in the root CLAUDE.md file under headers for each area, relying on Claude to infer which section applies.
- C) Create skills in `.claude/skills/` for each code type that include the relevant conventions in their SKILL.md files.
- D) Place a separate CLAUDE.md file in each subdirectory containing that area's specific conventions.

**Answer: A.** `.claude/rules/` with glob patterns (`**/*.test.tsx`) applies conventions automatically based on file path, regardless of directory — essential when test files are scattered. B relies on inference, not explicit matching — unreliable. C requires manual invocation or Claude choosing to load them — contradicts "automatic." D can't handle files spread across many directories since CLAUDE.md is directory-bound.
→ Maps to Task 3.3 (path-specific rules vs. directory CLAUDE.md vs. skills).

---

## Scenario: Multi-Agent Research System

**Q7.** After running the system on "impact of AI on creative industries," each subagent completes successfully — web search finds relevant articles, document analysis summarizes papers correctly, synthesis produces coherent output. But the final report covers only visual arts, completely missing music, writing, and film. The coordinator decomposed the topic into "AI in digital art creation," "AI in graphic design," and "AI in photography." What is the most likely root cause?

- A) The synthesis agent lacks instructions for identifying coverage gaps in the findings it receives from other agents.
- B) The coordinator agent's task decomposition is too narrow, resulting in subagent assignments that don't cover all relevant domains of the topic.
- C) The web search agent's queries are not comprehensive enough and need to be expanded to cover more creative industry sectors.
- D) The document analysis agent is filtering out sources related to non-visual creative industries due to overly restrictive relevance criteria.

**Answer: B.** The coordinator's logs reveal the root cause directly: it decomposed "creative industries" into only visual-arts subtasks. Subagents executed correctly within their *assigned* scope — the problem is what they were assigned. A, C, D incorrectly blame downstream agents working correctly within scope.
→ Maps to Task 1.2 (coordinator decomposition risk) — also a root-cause-diagnosis pattern question.

**Q8.** The web search subagent times out while researching a complex topic. You need to design how this failure information flows back to the coordinator. Which error propagation approach best enables intelligent recovery?

- A) Return structured error context to the coordinator including the failure type, the attempted query, any partial results, and potential alternative approaches.
- B) Implement automatic retry logic with exponential backoff within the subagent, returning a generic "search unavailable" status only after all retries are exhausted.
- C) Catch the timeout within the subagent and return an empty result set marked as successful.
- D) Propagate the timeout exception directly to a top-level handler that terminates the entire research workflow.

**Answer: A.** Structured error context gives the coordinator what it needs for intelligent recovery — retry with a modified query, try an alternative, or proceed with partial results. B's generic status hides valuable context. C suppresses the error by marking failure as success — prevents any recovery and risks incomplete output. D terminates the entire workflow unnecessarily.
→ Maps to Task 5.3 (error propagation).

**Q9.** During testing, the synthesis agent frequently needs to verify specific claims while combining findings. Currently, verification returns control to the coordinator, which invokes the web search agent, then re-invokes synthesis with results — 2–3 round trips per task, +40% latency. 85% of these verifications are simple fact-checks (dates, names, statistics); 15% need deeper investigation. What's the most effective approach to reduce overhead while maintaining reliability?

- A) Give the synthesis agent a scoped `verify_fact` tool for simple lookups, while complex verifications continue delegating to the web search agent through the coordinator.
- B) Have the synthesis agent accumulate all verification needs and return them as a batch to the coordinator at the end of its pass.
- C) Give the synthesis agent access to all web search tools so it can handle any verification need directly without round-trips through the coordinator.
- D) Have the web search agent proactively cache extra context around each source during initial research, anticipating what synthesis might need.

**Answer: A.** Applies least privilege — give synthesis only what it needs for the 85% common case, while preserving the existing coordination pattern for the 15% complex cases. B creates blocking dependencies (synthesis steps may depend on earlier verified facts). C over-provisions synthesis, violating separation of concerns. D relies on unreliable speculative caching.
→ Maps to Task 2.3 (scoped tool distribution) — a "proportionate, minimal fix beats over-engineering" pattern question.

---

## Scenario: Claude Code for Continuous Integration

**Q10.** Your pipeline script runs `claude "Analyze this pull request for security issues"` but the job hangs indefinitely. Logs indicate Claude Code is waiting for interactive input. What's the correct approach to run Claude Code in an automated pipeline?

- A) Add the `-p` flag: `claude -p "Analyze this pull request for security issues"`.
- B) Set the environment variable `CLAUDE_HEADLESS=true` before running the command.
- C) Redirect stdin from `/dev/null`: `claude "Analyze this pull request for security issues" < /dev/null`.
- D) Add the `--batch` flag: `claude --batch "Analyze this pull request for security issues"`.

**Answer: A.** `-p` (`--print`) is the documented non-interactive flag — processes the prompt, writes to stdout, exits without waiting on input. B and D reference features that don't exist. C is a Unix workaround that doesn't properly address Claude Code's command syntax.
→ Maps to Task 3.6 (CI integration).

**Q11.** Your team wants to reduce API costs for automated analysis. Currently two workflows run on real-time Claude calls: (1) a blocking pre-merge check developers wait on, and (2) an overnight technical-debt report. Your manager proposes switching both to the Message Batches API for its 50% cost savings. How should you evaluate this proposal?

- A) Use batch processing for the technical debt reports only; keep real-time calls for pre-merge checks.
- B) Switch both workflows to batch processing with status polling to check for completion.
- C) Keep real-time calls for both workflows to avoid batch result ordering issues.
- D) Switch both to batch processing with a timeout fallback to real-time if batches take too long.

**Answer: A.** The Message Batches API offers 50% savings but has processing times up to 24 hours with no guaranteed latency SLA — unsuitable for blocking pre-merge checks, but ideal for overnight jobs. B is wrong because relying on "often faster" completion isn't acceptable for a blocking workflow. C reflects a misconception — batch results *can* be correlated via `custom_id`. D adds unnecessary complexity when simply matching each API to its appropriate use case is the simpler, correct solution.
→ Maps to Task 4.5 (batch vs. sync API selection by latency tolerance).

**Q12.** A pull request modifies 14 files across the stock tracking module. Your single-pass review analyzing all files together produces inconsistent results: detailed feedback for some files but superficial comments for others, obvious bugs missed, and contradictory feedback — flagging a pattern as problematic in one file while approving identical code elsewhere in the same PR. How should you restructure the review?

- A) Split into focused passes: analyze each file individually for local issues, then run a separate integration-focused pass examining cross-file data flow.
- B) Require developers to split large PRs into smaller submissions of 3–4 files before the automated review runs.
- C) Switch to a higher-tier model with a larger context window to give all 14 files adequate attention in one pass.
- D) Run three independent review passes on the full PR and only flag issues that appear in at least two of the three runs.

**Answer: A.** Splitting into focused passes directly addresses the root cause: attention dilution when processing many files at once. File-by-file analysis ensures consistent depth, while a separate integration pass catches cross-file issues. B shifts the burden to developers without improving the system itself. C misunderstands that larger context windows don't solve attention-*quality* issues. D would actually suppress detection of real bugs that are only caught intermittently, by requiring consensus.
→ Maps to Task 4.6 / 1.6 (multi-pass review architecture; attention dilution).

---

## Score pattern note

Of these 12 official sample questions, **10 have correct answer A and 2 have correct answer B** — an artifact of this small sample, not a rule to bank on for the real 60-question exam (answer position is very likely randomized at scale). Don't use letter position as a test-taking strategy. What *is* a reliable signal is the **shape** of option A across most of these questions: it is consistently the proportionate, root-cause-targeting, mechanism-appropriate fix — see `study/hidden-patterns.md`.
