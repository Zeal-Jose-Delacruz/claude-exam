# Practice Exam Sources — vetted

Researched 2026-10-05. The Claude Certified Architect – Foundations exam is a very new, partner-gated certification (launched March 2026), so this landscape will keep shifting — re-verify anything here before trusting it at face value, using the rubric at the bottom.

## Official program (for context — no practice exam here)

- **Program overview**: Anthropic officially runs four role-based certifications — Claude Certified Associate: Foundations ($99), Claude Certified Developer: Foundations ($125), **Claude Certified Architect: Foundations ($125)**, and Claude Certified Architect: Professional ($175). Announced on Anthropic's own blog ("Four role-based Claude certifications," claude.com/blog, July 23 2026), building on the Claude Partner Network launched March 2026.
- **Registration / training**: `anthropic-partners.skilljar.com/claude-certified-architect-foundations-certification` — Anthropic's own Skilljar-hosted Partner Academy page. This is where the exam guide and exam policy PDFs are officially published.
- **Access**: gated to members of the **Claude Partner Network** (free to join at `claude.com/partners`) — not a fully open public exam at this time.
- **Proctoring & badging**: delivered through **Pearson Professional Assessments** (identity-verified, supervised); passing credentials issue a digital badge via **Credly by Pearson**.
- **No official practice exam or sample question bank exists** beyond the 12 sample questions already embedded in the official exam guide PDF (already transcribed in `study/sample-questions.md`). Any source claiming to be an "official" Anthropic practice test is misrepresenting itself.

## Vetted community sources (recommended)

Both of these independently reproduce the exact domain weighting from the official guide (27% / 18% / 20% / 20% / 15% across the same five domain names) — strong evidence they were genuinely built from the real exam guide rather than fabricated, unlike the dump sites below.

### 1. `github.com/OlivierAlter/Claude-Certified-Architect-Foundations-Certification-Exam`
- **77 scenario-based multiple-choice questions** across all 5 domains (19 / 13 / 14 / 14 / 11 split matching the official weights), each with 4 options and an explanation.
- Includes `cert-exam.skill` — an interactive Claude Code skill for running a terminal-based practice session.
- **240 stars, 66 forks** — real community traction, not a ghost repo.
- Explicit disclaimer: *"not part of the Claude Ambassador program. Anthropic is not involved in any form with this project."*
- **Imported 2026-10-05:** Its own `Claude Certification Exam.md` embeds the 12 official sample questions verbatim at Q1–Q12 (confirmed by diffing against `study/sample-questions.md`), interleaved with 65 original questions at Q13–Q77. Its own Domain-Task Index exactly matches `study/content-outline.md`'s 27 task statements by name — strong evidence of faithful derivation. The 65 non-duplicate questions (Q13–Q77) were pulled into `study/site.html`'s `QUIZ` array (tagged `ref:{type:'task',...}` with a `pattern:"Community practice Q#..."` label distinguishing them from the 12 official/pattern-mapped ones), bringing the drill to 77 total questions. Not independently re-verified beyond the structural cross-check above — re-vet per the rubric below if accuracy concerns surface.

### 2. `github.com/hamzafarooq/claude-certified-architect`
- **64-question interactive HTML practice test** (`practice-exam.html`) plus a `cheat-sheet/` folder with per-domain study guides and a `sample-questions.md` analysis of the official samples.
- **159 stars, 60 forks**, **MIT licensed**, openly identifies itself as independent community material (by Hamza Farooq) separate from official Skilljar registration/training.

### 3. Connectry `architect-cert-mcp` (secondary — larger bank, less independently verified)
- Open-source MCP server (listed on glama.ai) that turns Claude into an adaptive tutor: **390 scenario-based questions** across the 5 domains and 30 task statements, spaced-repetition (SM-2) scheduling, 30 concept handouts, full mock exams (60 Q, 100–1000 scaled score, 720 pass line matching the real format).
- MIT licensed, local SQLite storage, no telemetry.
- **Caveat:** glama.ai marks this "Official" — that means *verified publisher on glama's own registry*, **not** an Anthropic endorsement. No star/fork/download metrics were visible to corroborate real-world usage the way the two GitHub repos have, so treat its 390 questions as unverified in quality/accuracy until you've sampled some yourself.

## Avoid — brain-dump / commercial "exam dump" sites

These already have pages claiming "CCA-F" (Claude Certified Architect – Foundations) content despite the certification being about two months old and gated behind free Partner Network membership at the time of writing. That speed is itself the tell: these operations typically auto-generate or scrape placeholder pages for any exam code with search demand, regardless of whether they have real material.

- **ExamTopics** (`examtopics.com/exams/anthropic/cca-f/`)
- **Dumpsbase** (`dumpsbase.com/freedumps/anthropic/claude-certified-architect`)
- **Dumpspedia** (`dumpspedia.com/CCAR-P-dumps-questions.html`)
- **SkillCertPro** (paid "exam questions" product)
- **Preporato** (paid "practice tests 2026")
- **CertSafari** (`certsafari.com/anthropic/claude-certified-architect-foundations`) — checked 2026-10-05. This one is trickier than the others above: it's free (not paywalled), names an individual author with an explicit Anthropic non-affiliation disclaimer, and its 35 free sample questions (embedded as clean `schema.org/Quiz` JSON-LD, not garbled scrape output) are genuinely well-written and technically specific — correct-reading detail on `stop_reason` values including the less-common `"max_tokens"` case, `PreToolUse` hook `permissionDecision`/`updatedInput` semantics, `--output-format json --json-schema`, `total_cost_usd` in CLI JSON output, etc. It still belongs on this list because of one decisive, falsifiable fact: the overview page's own JSON-LD metadata claims `datePublished: "2025-11-03"` — over 8 months before Anthropic announced this certification (July 23, 2026). A page cannot be genuinely published before its subject exists; this is templated/fabricated metadata from a platform that advertises "67,720 exam-style practice questions" across 30+ unrelated vendor certs (AWS, Azure, Cisco, Salesforce, Oracle, etc.) — a mass-production mill, not a curated single-cert resource like the two vetted GitHub repos above. It also states no domain weighting to check against `study/content-outline.md`, and claims "exam guide version 1.0" vs. the real v0.2. Net: don't import from it, but don't assume its surface quality generalizes to the other sites on this list either — if re-checking, verify the specific evidence above still applies rather than re-deciding on vibes.

Beyond likely being fabricated or low-quality, using braindump-style material is commonly a violation of Pearson VUE / Anthropic's exam candidate agreement (most certification bodies explicitly prohibit using leaked or dump-site content to prepare). Don't use these even if they look convincing.

## How to vet a new source yourself

Good signal (use it):
- Open-source / publicly inspectable, with an explicit disclaimer of non-affiliation with Anthropic
- Real community engagement (GitHub stars/forks, active issues, discussion) — not just a landing page
- Domain names and weightings match `study/content-outline.md` exactly — proof it was actually derived from the real exam guide

Red flag (skip it):
- Sells itself as "official," "verified," or "guaranteed pass" dumps
- Appeared suspiciously fast relative to how new/gated the certification is
- No visible authorship, no disclaimer, paywall before you can see any sample content
- Claims from a "verified" badge on a third-party registry (like glama.ai) — that verifies the *publisher's identity on that platform*, not Anthropic's endorsement of the content
