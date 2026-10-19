// Deterministic stand-in for the Claude extraction call. This sandbox has no
// ANTHROPIC_API_KEY and no outbound network access, and the whole point of
// Steps 2-5 is to exercise *repeatable* edge cases (illegible fields, format
// drift, enum casing, retry recovery, few-shot improvement) — so instead of
// a live call, each form's attempt-1 / attempt-2 / zero-shot / few-shot
// output is hand-scripted here to the exact behavior a real Claude call
// would plausibly produce for that scenario. `src/model/realClient.js` is
// the real wrapper (same tool schema, same message shape) for when a key is
// available; swapping it in doesn't change extract.js, batch.js, or any
// other caller.
//
// Every scripted "confidence" value is the MODEL'S OWN self-report. Per the
// exam's hidden-pattern on uncalibrated proxies: self-reported confidence is
// not trustworthy on its own — Step 9/10 show cases where it's miscalibrated
// (confidently incomplete) and must be checked against actual accuracy.

const SCRIPTS = {
  "claim-2026-03-0001": {
    attempt1: {
      claimant_name: "Robert Chen",
      incident_date: "2026-02-14",
      injury_type: "collision",
      injury_type_detail: null,
      policy_number: "MM-88213-A",
      confidence: 0.98,
    },
  },
  "claim-2026-03-0042": {
    attempt1: {
      claimant_name: "J. Ferreira",
      incident_date: "2026-03-02",
      injury_type: "collision",
      injury_type_detail: null,
      policy_number: null, // ink smudge — correctly not guessed
      confidence: 0.95,
    },
  },
  "claim-2026-03-0105": {
    attempt1: {
      // wrong: prose date instead of ISO
      claimant_name: "Priya Natarajan",
      incident_date: "March 2nd, 2026",
      injury_type: "collision",
      injury_type_detail: null,
      policy_number: "MM-55120-C",
      confidence: 0.9,
    },
    attempt2: {
      claimant_name: "Priya Natarajan",
      incident_date: "2026-03-02",
      injury_type: "collision",
      injury_type_detail: null,
      policy_number: "MM-55120-C",
      confidence: 0.97,
    },
  },
  "claim-2026-03-0118": {
    attempt1: {
      // wrong: enum value capitalized, doesn't match the lowercase enum
      claimant_name: "Darnell Osei",
      incident_date: "2026-03-04",
      injury_type: "Collision",
      injury_type_detail: null,
      policy_number: "MM-30944-B",
      confidence: 0.92,
    },
    attempt2: {
      claimant_name: "Darnell Osei",
      incident_date: "2026-03-04",
      injury_type: "collision",
      injury_type_detail: null,
      policy_number: "MM-30944-B",
      confidence: 0.96,
    },
  },
  "claim-2026-03-0231": {
    // water damage over the signature line — genuinely unrecoverable
    attempt1: {
      claimant_name: null,
      incident_date: "2026-03-05",
      injury_type: "theft",
      injury_type_detail: null,
      policy_number: "MM-71002-D",
      confidence: 0.4,
    },
    attempt2: {
      claimant_name: null, // re-examined, still illegible
      incident_date: "2026-03-05",
      injury_type: "theft",
      injury_type_detail: null,
      policy_number: "MM-71002-D",
      confidence: 0.35,
    },
  },
  "claim-2026-03-0240": {
    // water damage over the date field — genuinely unrecoverable
    attempt1: {
      claimant_name: "Lauren Ibarra",
      incident_date: null,
      injury_type: "weather",
      injury_type_detail: null,
      policy_number: "MM-41887-E",
      confidence: 0.5,
    },
    attempt2: {
      claimant_name: "Lauren Ibarra",
      incident_date: null, // re-examined, still illegible
      injury_type: "weather",
      injury_type_detail: null,
      policy_number: "MM-41887-E",
      confidence: 0.45,
    },
  },
  "claim-2026-03-0266": {
    zeroShot: {
      // schema-valid, but undercounts the damage table (misses 2 of 3 rows)
      claimant_name: "Soo-ah Kim",
      incident_date: "2026-03-06",
      injury_type: "weather",
      injury_type_detail: "Hail damage to hood.",
      policy_number: "MM-19004-F",
      confidence: 0.93, // miscalibrated: confidently incomplete
    },
    fewShot: {
      claimant_name: "Soo-ah Kim",
      incident_date: "2026-03-06",
      injury_type: "weather",
      injury_type_detail: "3 hail-damage line items: hood dent ($420), roof dent ($650), cracked windshield ($380)",
      policy_number: "MM-19004-F",
      confidence: 0.97,
    },
  },
  "claim-2026-03-0271": {
    zeroShot: {
      // schema-valid, but truncates the run-on narrative
      claimant_name: "Marcus Webb",
      incident_date: "2026-03-07",
      injury_type: "theft",
      injury_type_detail: "Window smashed, items stolen.",
      policy_number: "MM-60213-G",
      confidence: 0.9, // miscalibrated: confidently incomplete
    },
    fewShot: {
      claimant_name: "Marcus Webb",
      incident_date: "2026-03-07",
      injury_type: "theft",
      injury_type_detail: "Overnight street parking; window smashed, toolbox and stereo deck stolen from back seat, no witnessed break-in",
      policy_number: "MM-60213-G",
      confidence: 0.96,
    },
  },
  "claim-2026-03-0283": {
    attempt1: {
      // schema-valid (detail is nullable) but a business-meaningful gap on
      // an "other" claim — this is what confidence routing is for, not validation.
      claimant_name: "Ava Thompson",
      incident_date: "2026-03-08",
      injury_type: "other",
      injury_type_detail: null,
      policy_number: "MM-12990-H",
      confidence: 0.6,
    },
  },
  "claim-2026-03-0312": {
    // Residual gap: a margin note added in a second ink pass, overlapping the
    // page edge — a different confound than either few-shot example covers
    // (run-on single-pass prose, or a clean table). The main clause is
    // captured; the overlapping margin note is dropped, with or without
    // few-shot — this is what Step 10's per-field breakdown is for, and the
    // model appropriately flags its own uncertainty about the overlap this time.
    attempt1: {
      claimant_name: "Keisha Brown",
      incident_date: "2026-03-11",
      injury_type: "collision",
      injury_type_detail: "Lost control on black ice on I-80 and spun out.",
      policy_number: "MM-50221-K",
      confidence: 0.78,
    },
  },
  "claim-2026-03-0299": {
    zeroShot: {
      claimant_name: "Hiroshi Tanaka",
      incident_date: "2026-03-09",
      injury_type: "collision",
      injury_type_detail: "Rear bumper dent.",
      policy_number: "MM-77410-J",
      confidence: 0.91, // miscalibrated: confidently incomplete
    },
    fewShot: {
      claimant_name: "Hiroshi Tanaka",
      incident_date: "2026-03-09",
      injury_type: "collision",
      injury_type_detail: "2 line items: rear bumper dent ($900), trunk scratch ($150)",
      policy_number: "MM-77410-J",
      confidence: 0.95,
    },
  },
};

function stripConfidence({ confidence, ...rest }) {
  return rest;
}

export async function mockExtract({ customId, attempt = 1, useFewShot = false, schemaVersion = "v1" }) {
  const script = SCRIPTS[customId];
  if (!script) throw new Error(`No scripted mock output for ${customId}`);

  let raw;
  if (script.zeroShot || script.fewShot) {
    raw = useFewShot ? script.fewShot : script.zeroShot;
  } else {
    raw = attempt >= 2 && script.attempt2 ? script.attempt2 : script.attempt1;
  }

  const output = schemaVersion === "v2" ? raw : stripConfidence(raw);
  // Return a copy — callers (and the retry loop) must never mutate the script.
  return JSON.parse(JSON.stringify(output));
}

export function createMockClient() {
  return {
    async extract({ form, tool, useFewShot = false, retryContext }) {
      const schemaVersion = tool?.input_schema?.properties?.confidence ? "v2" : "v1";
      const attempt = retryContext ? 2 : 1;
      return mockExtract({ customId: form.customId, attempt, useFewShot, schemaVersion });
    },
  };
}
