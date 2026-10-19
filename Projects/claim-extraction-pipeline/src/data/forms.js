// Stand-ins for scanned/OCR'd claim forms. Each `ocrText` is what a vision
// pass over the scanned image would hand to the model as document content;
// `groundTruth` is the hand-labeled correct extraction, used only by our
// test harness (Step 2, Step 5, Step 10) — never seen by the model.
//
// docType buckets mirror the three real layouts Meridian has on file:
// typed-clean, handwritten-narrative, tabular-line-items (see Step 5).

export const FORMS = [
  {
    customId: "claim-2026-03-0001",
    docType: "typed-clean",
    sizeBytes: 42_000,
    ocrText: `MERIDIAN MUTUAL - AUTO CLAIM FORM
Claimant Name: Robert Chen
Date of Incident: 2026-02-14
Incident Type: Collision
Policy Number: MM-88213-A
Notes: Rear-ended at a stoplight, other driver cited.`,
    groundTruth: {
      claimant_name: "Robert Chen",
      incident_date: "2026-02-14",
      injury_type: "collision",
      injury_type_detail: null,
      policy_number: "MM-88213-A",
    },
  },
  {
    customId: "claim-2026-03-0042",
    docType: "handwritten-narrative",
    sizeBytes: 38_000,
    ocrText: `[handwritten]
Name: J. Ferreira
Date: 3/2/26
What happened: my car got hit from behind in the parking lot
Policy #: [illegible — ink smudge over the number block]`,
    groundTruth: {
      claimant_name: "J. Ferreira",
      incident_date: "2026-03-02",
      injury_type: "collision",
      injury_type_detail: null,
      policy_number: null,
    },
  },
  {
    customId: "claim-2026-03-0105",
    docType: "typed-clean",
    sizeBytes: 40_000,
    ocrText: `MERIDIAN MUTUAL - AUTO CLAIM FORM
Claimant Name: Priya Natarajan
Date of Incident: March 2nd, 2026
Incident Type: Collision
Policy Number: MM-55120-C
Notes: Sideswiped while parking.`,
    groundTruth: {
      claimant_name: "Priya Natarajan",
      incident_date: "2026-03-02",
      injury_type: "collision",
      injury_type_detail: null,
      policy_number: "MM-55120-C",
    },
  },
  {
    customId: "claim-2026-03-0118",
    docType: "typed-clean",
    sizeBytes: 41_000,
    ocrText: `MERIDIAN MUTUAL - AUTO CLAIM FORM
Claimant Name: Darnell Osei
Date of Incident: 2026-03-04
Incident Type: Car accident
Policy Number: MM-30944-B
Notes: Multi-vehicle pileup on I-80 during black ice.`,
    groundTruth: {
      claimant_name: "Darnell Osei",
      incident_date: "2026-03-04",
      injury_type: "collision",
      injury_type_detail: null,
      policy_number: "MM-30944-B",
    },
  },
  {
    customId: "claim-2026-03-0231",
    docType: "handwritten-narrative",
    sizeBytes: 36_000,
    ocrText: `[handwritten, water-damaged]
Name/Signature: [illegible — water damage across signature line]
Date: 3/5/26
What happened: someone broke my window and took the stereo
Policy #: MM-71002-D`,
    groundTruth: {
      claimant_name: null, // genuinely unrecoverable — see Step 4
      incident_date: "2026-03-05",
      injury_type: "theft",
      injury_type_detail: null,
      policy_number: "MM-71002-D",
    },
  },
  {
    customId: "claim-2026-03-0240",
    docType: "handwritten-narrative",
    sizeBytes: 36_500,
    ocrText: `[handwritten, water-damaged]
Name: Lauren Ibarra
Date: [illegible — water damage over the date field]
What happened: hail storm cracked my windshield overnight
Policy #: MM-41887-E`,
    groundTruth: {
      claimant_name: "Lauren Ibarra",
      incident_date: null, // genuinely unrecoverable — see Step 4
      injury_type: "weather",
      injury_type_detail: null,
      policy_number: "MM-41887-E",
    },
  },
  {
    customId: "claim-2026-03-0266",
    docType: "tabular-line-items",
    sizeBytes: 55_000,
    ocrText: `MERIDIAN MUTUAL - AUTO CLAIM FORM (multi-item hail damage)
Claimant Name: Soo-ah Kim
Date of Incident: 2026-03-06
Policy Number: MM-19004-F
Damage line items:
  | # | Item              | Panel        | Est. Cost |
  | 1 | Dent - hail       | Hood         | $420      |
  | 2 | Dent - hail       | Roof         | $650      |
  | 3 | Cracked windshield| Windshield   | $380      |
Incident Type: Weather`,
    groundTruth: {
      claimant_name: "Soo-ah Kim",
      incident_date: "2026-03-06",
      injury_type: "weather",
      injury_type_detail: "3 hail-damage line items: hood dent ($420), roof dent ($650), cracked windshield ($380)",
      policy_number: "MM-19004-F",
    },
  },
  {
    customId: "claim-2026-03-0271",
    docType: "handwritten-narrative",
    sizeBytes: 37_000,
    ocrText: `[handwritten, run-on cursive, several cross-outs]
Name: Marcus Webb
Date: 3/7/26
What happened: so I was parked outside my building overnight like always
and when I came out in the morning the drivers side window was smashed in
and my toolbox and the old stereo deck were gone from the back seat someone
must have (crossed out: "jimmied") pried the door and I didnt hear anything
Policy #: MM-60213-G`,
    groundTruth: {
      claimant_name: "Marcus Webb",
      incident_date: "2026-03-07",
      injury_type: "theft",
      injury_type_detail: "Overnight street parking; window smashed, toolbox and stereo deck stolen from back seat, no witnessed break-in",
      policy_number: "MM-60213-G",
    },
  },
  {
    customId: "claim-2026-03-0283",
    docType: "typed-clean",
    sizeBytes: 40_200,
    ocrText: `MERIDIAN MUTUAL - AUTO CLAIM FORM
Claimant Name: Ava Thompson
Date of Incident: 2026-03-08
Incident Type: Other
Policy Number: MM-12990-H
Notes: [smudged toner — detail field unreadable]`,
    groundTruth: {
      claimant_name: "Ava Thompson",
      incident_date: "2026-03-08",
      injury_type: "other",
      injury_type_detail: null, // genuinely unrecoverable — see Step 4
      policy_number: "MM-12990-H",
    },
  },
  {
    customId: "claim-2026-03-0312",
    docType: "handwritten-narrative",
    sizeBytes: 39_000,
    ocrText: `[handwritten, original statement in blue ink, a later margin note added in black ink
overlapping the right edge of the page]
Name: Keisha Brown
Date: 3/11/26
What happened: lost control on black ice on I-80 and spun out
[margin note, black ink, partly overlapping the above]: rear-ended by the car
behind me a few seconds after I stopped spinning, bumper damage
Policy #: MM-50221-K`,
    groundTruth: {
      claimant_name: "Keisha Brown",
      incident_date: "2026-03-11",
      injury_type: "collision",
      injury_type_detail:
        "Lost control on black ice on I-80 and spun out; margin note (added in a second ink pass) describes being rear-ended moments later with bumper damage",
      policy_number: "MM-50221-K",
    },
  },
  {
    customId: "claim-2026-03-0299",
    docType: "tabular-line-items",
    sizeBytes: 54_000,
    ocrText: `MERIDIAN MUTUAL - AUTO CLAIM FORM (multi-item collision)
Claimant Name: Hiroshi Tanaka
Date of Incident: 2026-03-09
Policy Number: MM-77410-J
Damage line items:
  | # | Item           | Panel       | Est. Cost |
  | 1 | Dent           | Rear bumper | $900      |
  | 2 | Scratch        | Trunk       | $150      |
Incident Type: Collision`,
    groundTruth: {
      claimant_name: "Hiroshi Tanaka",
      incident_date: "2026-03-09",
      injury_type: "collision",
      injury_type_detail: "2 line items: rear bumper dent ($900), trunk scratch ($150)",
      policy_number: "MM-77410-J",
    },
  },
];

export function getForm(customId) {
  const form = FORMS.find((f) => f.customId === customId);
  if (!form) throw new Error(`Unknown form ${customId}`);
  return form;
}
