# Hidden Patterns — the recurring logic behind correct answers

This is the meta-analysis: cross-referencing all 12 sample questions against the task statements in `content-outline.md` to find the repeated *shape* of reasoning the exam rewards and the repeated *shape* of trap it punishes. The exam is explicitly built from "realistic customer scenarios" judging "practical judgment about architecture, configuration, and tradeoffs" — not rote recall. These are the tradeoff axes it keeps testing along.

Every pattern below is illustrated with its source question(s) so you can verify the pattern against the primary material rather than trusting this summary blindly.

---

## Pattern 1: Deterministic enforcement beats probabilistic compliance, whenever the cost of failure is asymmetric

If a workflow step is "required" for a business-critical reason (identity verification before a refund, blocking a tool call above a dollar threshold), the exam always prefers **programmatic enforcement** — a hook, a prerequisite gate, a forced `tool_choice` — over any prompt-based instruction, however well-written or reinforced with few-shot examples.

- Q1: verified-ID-before-refund → correct answer is a *programmatic prerequisite* (A), not a stronger system prompt (B) or few-shot examples (C).
- Task 1.4: "When deterministic compliance is required… prompt instructions alone have a non-zero failure rate."
- Task 1.5: hooks exist specifically to convert probabilistic prompt-compliance into deterministic guarantees.
- Task 4.3: forced `tool_choice` sequences a specific tool before others — same principle applied to prompt engineering.

**Test-taking rule:** if a question's failure mode has financial/compliance/safety consequences and the current approach is prompt-only, the fix is architectural (hook/gate/forced tool), not "write a better prompt."

## Pattern 2: The proportionate fix beats the over-engineered fix

Across nearly every question, one wrong option builds unnecessary infrastructure — a separate classifier model, a routing layer, a new microservice, a second redundant caching system — when a cheaper, more targeted change (improve a description, add a rule file, add explicit criteria) solves the same root cause.

- Q2: fix minimal tool descriptions (B) beats a custom routing layer (C) or tool consolidation (D).
- Q3: explicit escalation criteria + few-shot (A) beats a separately trained classifier model (C).
- Q9: a scoped `verify_fact` tool for the 85% common case (A) beats giving the agent full web-search access (C) or speculative caching (D).
- Q11: route workloads to the right API by latency tolerance (A) beats adding a "timeout fallback" hybrid (D) when simply choosing correctly up front removes the need for a fallback.

**Test-taking rule:** when an option "sounds thorough" (new model, new classifier, new layer, new fallback system), be suspicious — the exam consistently rewards the option that fixes the stated root cause with the least new machinery.

## Pattern 3: Self-reported confidence, sentiment, and other unreliable proxies are always traps

The exam repeatedly offers an option that substitutes a *plausible-sounding but uncalibrated signal* for the real decision criterion.

- Q3: self-reported confidence score (B) and sentiment analysis (D) are both wrong — "the agent is already confidently wrong," and "sentiment doesn't correlate with case complexity."
- Task 5.2: "sentiment-based escalation and self-reported confidence scores are unreliable proxies for actual case complexity."
- Task 5.5 draws the contrast case: confidence scores *are* legitimate when **calibrated against labeled validation sets** — the trap is specifically *uncalibrated, self-reported* confidence used as a standalone trigger.

**Test-taking rule:** "have the model self-report confidence/sentiment and act on it directly" is wrong unless the question explicitly describes calibration against ground truth.

## Pattern 4: Correctly attribute root cause to the stage that actually misbehaved

Several questions describe a multi-stage pipeline where everything downstream *looks* broken, but logs show the defect is actually upstream (or vice versa). The trap options blame a stage that is provably working correctly within the scope it was given.

- Q7: every subagent "completes successfully" — the coordinator's own decomposition logs show it only generated visual-arts subtasks. Correct answer (B) blames the coordinator, not the (correctly-functioning) downstream subagents (A, C, D).
- Task 1.2: "risks of overly narrow task decomposition by the coordinator, leading to incomplete coverage."

**Test-taking rule:** when a scenario gives you log evidence, trust the log evidence over an instinct to blame "the agent" generically. The exam often names the specific component at fault in the narrative itself.

## Pattern 5: Scoped / least-privilege tool access beats broad or consolidated access

Giving an agent more tools, or merging tools to "simplify," is consistently the wrong answer. The exam rewards narrowing scope to match the agent's actual role and the dominant use case.

- Q2: don't consolidate `get_customer`/`lookup_order` into one `lookup_entity` tool (D) — fix descriptions instead.
- Q9: give synthesis a narrow `verify_fact` tool for the 85% case, not full web-search access.
- Task 2.3: "too many tools… degrades tool selection reliability"; "agents with tools outside their specialization tend to misuse them."

**Test-taking rule:** "give the agent more tools / combine tools so it can do everything" is almost always the wrong answer; "give it exactly the narrow tool for its common case, route the rest through the existing path" is almost always right.

## Pattern 6: Match the architecture/API to the *latency and risk profile* of the workflow, not to a single global optimization

The exam likes to offer a single enticing improvement (cost savings, speed, a bigger model) and ask you to recognize it's wrong for *one* of two workflows with different requirements.

- Q11: Batches API saves 50% cost but has no latency SLA — fine for overnight reports, wrong for blocking pre-merge checks. The trap is applying one global optimization (cost) uniformly across workflows with different constraints.
- Q5 (plan mode) / Task 3.4: match plan-mode-vs-direct-execution to task complexity, not a single default policy.
- Task 4.5: "appropriate for non-blocking, latency-tolerant workloads… inappropriate for blocking workflows."

**Test-taking rule:** when a question presents "we could apply optimization X everywhere," check whether X's tradeoff (latency, determinism, cost) is compatible with *each* workflow mentioned — the correct answer usually splits the workflows rather than treating them uniformly.

## Pattern 7: Decompose/split when a single pass shows attention dilution or inconsistent depth; don't just add more capacity

When a scenario describes inconsistent quality across a large single-pass operation (code review across many files, broad research topic decomposition), the fix is **structural decomposition** (per-file passes + an integration pass; broader subtopic decomposition), not a bigger/better model or voting among repeated full passes.

- Q12: split per-file + cross-file integration pass (A), not a bigger context window (C) or majority-vote across 3 full-PR passes (D — this would actually *suppress* real findings caught intermittently).
- Task 1.6, Task 4.6: "splitting large code reviews into per-file local-analysis passes plus a separate cross-file integration pass to avoid attention dilution."

**Test-taking rule:** "upgrade the model / give it more context window" is a trap when the real problem is attention dilution across too much undifferentiated content in one pass — the fix is restructuring the passes, not adding raw capacity.

## Pattern 8: Structured, categorized signals beat generic/uniform signals, especially for errors

Any time an option returns a generic status ("failed," "unavailable," empty-marked-as-success) versus a structured, categorized one (failure type + attempted action + partial results + alternatives; `isRetryable` + `errorCategory`), the structured option wins — because it's what lets the *next* decision-maker (coordinator, human, retry logic) act intelligently.

- Q8: structured error context (A) beats generic "search unavailable" (B), suppressed-as-success (C), and hard termination (D).
- Task 2.2, Task 5.3: isError flag pattern, errorCategory/isRetryable, "generic error responses prevent the agent from making appropriate recovery decisions," "silently suppressing errors… are anti-patterns."

**Test-taking rule:** generic/uniform error handling and silent suppression are always wrong; the right answer preserves enough structured detail for the next layer to make a real decision.

## Pattern 9: Never silently discard conflicting or uncertain information — annotate it

Parallel to Pattern 8 but specifically for multi-source synthesis: when two credible sources disagree, or when confidence is mixed, the exam always rejects "pick one value / average them / suppress the uncertainty" in favor of preserving and flagging it.

- Task 5.6: "annotating conflicts with source attribution rather than arbitrarily selecting one value."
- Task 5.5: route low-confidence/contradictory extractions to human review rather than silently accepting them.

## Pattern 10: Isolation and explicit context-passing over implicit inheritance

A recurring *knowledge* trap (less tested via trick-option but heavily tested via direct recall): subagents do **not** automatically inherit the coordinator's conversation history or share memory across invocations — context must be explicitly placed in the prompt. Expect direct questions built on this fact (e.g., "why did the subagent not know about X" → because it wasn't explicitly passed).

- Task 1.2, 1.3: "subagents operate with isolated context," "subagent context must be explicitly provided in the prompt."

## Pattern 11: Structural schema fixes beat more examples, when the ambiguity is irreducible or the contract is rigid

This is Pattern 1 (deterministic beats probabilistic) applied specifically to *output and criteria design*. When a downstream contract can't accept a given value, or when the decision boundary is one even expert humans don't agree on, the fix is a schema-level or criteria-level change — not more few-shot examples, which are still probabilistic steering no matter how good they are.

- An `"unclear"` enum value, routed to human review, beats both a nullable field (which a strict downstream parser may reject) and more few-shot examples (which can't teach a boundary senior reviewers themselves disagree on) — there's no consistent pattern to demonstrate.
- A vague qualifier like "only flag issues you are certain about" has no operational meaning, so it gets interpreted differently every run. The fix is named, checkable criteria (flag X, skip Y), not more format examples and not a self-reported confidence threshold.
- When validating a prompt across many fast iterations, code-based/automated grading on a sample built to mirror the real distribution (including edge cases) beats full hand-grading of every round — hand-grading is accurate but doesn't scale to the iteration pace the task requires.

**Test-taking rule:** if an option says "add more examples" or "add a confidence score" to fix an ambiguity that the scenario itself says is irreducible (experts disagree, or the rule is inherently vague), look for a schema-level option instead — a new enum value, named criteria, or a structural grading/sampling change.

## Pattern 12: Let the model drive control flow when the next step depends on what the last one found

When each tool result determines what to investigate next, a model-driven agentic loop is correct — not a fixed pipeline, a pre-classified sequence, or scripted step-by-step procedures in the prompt. All three fixed-order approaches fail the same way: they commit to a sequence before the agent has seen what the first step actually reveals.

- An open-ended code trace, where a Grep hit might lead to another Grep, a Read, or a Bash command, needs the model choosing each next tool from the prior result — varying tool order across runs is expected behavior here, not a defect to standardize away.
- A fixed pipeline (e.g., always Glob → Grep → Read) is still the right choice when every step actually is known in advance and reproducibility is the goal — the deciding question is whether the problem is predictable, not whether a fixed order would be tidier.

**Test-taking rule:** when a scenario says "each result determines what to inspect next," cross out any option that pins down a tool order in advance (a fixed pipeline, a classifier picking a canned sequence, or numbered prompt procedures) — the correct answer keeps the model deciding, turn by turn. Contrast with Pattern 6: that pattern is about matching architecture to *latency/risk tolerance*; this one is about matching control flow to *predictability of the steps themselves*.

---

## How to use this during study

1. For every practice question you get wrong, ask: *which of the 12 patterns above does the correct answer instantiate, and which pattern-violation does my wrong choice represent?* Tag it. Over time you'll see which 1–2 patterns you personally keep missing.
2. When you don't know a question cold, use these patterns as elimination heuristics: cross out any option that (a) relies on an uncalibrated self-reported signal, (b) adds infrastructure beyond what the stated problem requires, (c) is a generic/suppressed error response, (d) applies one global optimization uniformly across workflows with different constraints, (e) adds more examples to fix an ambiguity the scenario says is irreducible, (f) pins down a fixed tool order when each step's result determines the next.
3. Patterns 1–10 were reverse-engineered from the 12 official sample questions; patterns 11–12 were added after missing them on a full-length practice exam. Treat all of these as strong priors, not guarantees — always reason from the specific scenario details first; use pattern-matching to break ties or sanity-check your reasoning, not to shortcut reading the question.
