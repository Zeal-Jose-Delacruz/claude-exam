// Step 5: few-shot examples covering the two layouts that give a zero-shot
// prompt the most trouble — messy run-on handwriting, and a tabular
// line-items layout that a naive read collapses into one row.

export const FEW_SHOT_NARRATIVE = {
  docType: "handwritten-narrative",
  ocrText: `[handwritten, run-on cursive]
Name: Teresa Alvarez
Date: 1/9/26
What happened: I was driving home from my sisters and a deer ran out
into the road right near the Route 9 overpass I swerved and clipped
the guardrail before I could stop the front bumper and headlight got
smashed up pretty bad
Policy #: MM-20011-Z`,
  expectedExtraction: {
    claimant_name: "Teresa Alvarez",
    incident_date: "2026-01-09",
    injury_type: "collision",
    injury_type_detail: "Swerved to avoid a deer near the Route 9 overpass, clipped the guardrail; front bumper and headlight damaged",
    policy_number: "MM-20011-Z",
  },
  why: "Shows how to compress a run-on, unpunctuated narrative into one coherent injury_type_detail sentence instead of truncating at the first clause or dropping the guardrail detail.",
};

export const FEW_SHOT_TABULAR = {
  docType: "tabular-line-items",
  ocrText: `MERIDIAN MUTUAL - AUTO CLAIM FORM (multi-item collision)
Claimant Name: Bo Lindqvist
Date of Incident: 2026-01-11
Policy Number: MM-33440-Y
Damage line items:
  | # | Item            | Panel        | Est. Cost |
  | 1 | Dent            | Front fender | $500      |
  | 2 | Broken mirror   | Driver side  | $180      |
Incident Type: Collision`,
  expectedExtraction: {
    claimant_name: "Bo Lindqvist",
    incident_date: "2026-01-11",
    injury_type: "collision",
    injury_type_detail: "2 line items: front fender dent ($500), driver-side mirror broken ($180)",
    policy_number: "MM-33440-Y",
  },
  why: "Shows that every row in the damage table must be summarized into injury_type_detail, not just the claimant/date/policy header fields — a naive read treats the table as a decorative block and only captures the header.",
};

export const FEW_SHOT_EXAMPLES = [FEW_SHOT_NARRATIVE, FEW_SHOT_TABULAR];
