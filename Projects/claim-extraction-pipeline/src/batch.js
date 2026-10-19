import { FORMS } from "./data/forms.js";
import { EXTRACT_CLAIM_TOOL_V2 } from "./schema.js";

// A synthetic oversized scan — a 40-page bundle someone fed through the
// scanner as one multi-incident document instead of one form per claim.
// Used only to exercise the Step 7 size-failure/resubmit path; kept out of
// the main FORMS corpus so it doesn't skew the Step 10 accuracy breakdown.
export const OVERSIZED_FORM = {
  customId: "claim-2026-03-9001",
  docType: "typed-clean",
  sizeBytes: 2_400_000,
  ocrText: Array.from(
    { length: 40 },
    (_, i) => `--- PAGE ${i + 1} ---\nMERIDIAN MUTUAL - AUTO CLAIM FORM\nClaimant Name: [redacted for demo]\nDate of Incident: 2026-03-${String((i % 28) + 1).padStart(2, "0")}\nIncident Type: Collision\nPolicy Number: MM-${90000 + i}-X`
  ).join("\n\n"),
};

const MAX_REQUEST_BYTES = 500_000; // stand-in for the Batches API per-request size ceiling

export function buildRequest(form, { model = "claude-sonnet-5" } = {}) {
  return {
    custom_id: form.customId,
    params: {
      model,
      max_tokens: 1024,
      tools: [EXTRACT_CLAIM_TOOL_V2],
      tool_choice: { type: "tool", name: EXTRACT_CLAIM_TOOL_V2.name },
      messages: [{ role: "user", content: form.ocrText }],
    },
  };
}

// Step 6: a week's backlog (~100 docs) as Message Batches API requests, each
// custom_id mapping straight back to the scanned file it came from. The real
// weekly backlog is thousands of unique scans; here we cycle the 10
// hand-labeled sample forms (plus the one oversized bundle) to fill out a
// representative ~100-request batch without inventing 100 unique documents.
export function buildWeeklyBatch(targetCount = 100) {
  const requests = [];
  const forms = [];
  let i = 0;
  while (requests.length < targetCount - 1) {
    const base = FORMS[i % FORMS.length];
    const suffix = String(Math.floor(i / FORMS.length)).padStart(2, "0");
    const form = { ...base, customId: `${base.customId}-w${suffix}` };
    requests.push(buildRequest(form));
    forms.push(form);
    i += 1;
  }
  requests.push(buildRequest(OVERSIZED_FORM));
  forms.push(OVERSIZED_FORM);
  return { requests, forms };
}

// Step 7: synthetic batch results standing in for what `batches.results()`
// would return — most succeed, a couple fail the way real traffic fails:
// one genuinely oversized request, one transient overload.
export function simulateBatchResults(requests) {
  return requests.map((req, idx) => {
    if (req.custom_id === OVERSIZED_FORM.customId) {
      return {
        custom_id: req.custom_id,
        result: {
          type: "errored",
          error: {
            type: "invalid_request_error",
            message: "prompt is too long: 612,480 tokens > 200,000 token context limit",
          },
        },
      };
    }
    if (idx === 37) {
      // one unlucky transient failure, unrelated to document size
      return {
        custom_id: req.custom_id,
        result: {
          type: "errored",
          error: { type: "overloaded_error", message: "Overloaded: too many requests in flight, try again" },
        },
      };
    }
    return {
      custom_id: req.custom_id,
      result: { type: "succeeded", message: { id: `msg_${idx}`, content: [{ type: "tool_use", name: "extract_claim" }] } },
    };
  });
}

// Splits an oversized document into page-range chunks small enough to fit
// one request each. Each chunk keeps the original custom_id as a prefix so
// results can be re-joined back to the source file.
export function chunkDocument(form, pagesPerChunk = 10) {
  const pages = form.ocrText.split(/(?=--- PAGE \d+ ---)/).filter(Boolean);
  const chunks = [];
  for (let start = 0; start < pages.length; start += pagesPerChunk) {
    const chunkPages = pages.slice(start, start + pagesPerChunk);
    const chunkIndex = chunks.length + 1;
    chunks.push({
      ...form,
      customId: `${form.customId}-chunk${chunkIndex}`,
      ocrText: chunkPages.join("\n"),
    });
  }
  return chunks;
}

// Step 7: pull every failed custom_id out of the results, and only
// size-related failures get chunked-and-resubmitted; everything else is
// resubmitted unchanged (a transient error isn't fixed by cutting the
// document up — the next attempt might just succeed).
export function planResubmission(results, originalsByCustomId) {
  const failed = results.filter((r) => r.result.type === "errored");
  const resubmitRequests = [];
  const log = [];

  for (const r of failed) {
    const original = originalsByCustomId.get(r.custom_id); // { form, request }
    if (r.result.error.type === "invalid_request_error" && /too long|too large|exceeds/i.test(r.result.error.message)) {
      const chunks = chunkDocument(original.form);
      for (const chunk of chunks) resubmitRequests.push(buildRequest(chunk));
      log.push({ custom_id: r.custom_id, action: "chunked_and_resubmitted", chunkCount: chunks.length });
    } else {
      resubmitRequests.push(original.request);
      log.push({ custom_id: r.custom_id, action: "resubmitted_unchanged", reason: r.result.error.type });
    }
  }

  return { resubmitRequests, log };
}
