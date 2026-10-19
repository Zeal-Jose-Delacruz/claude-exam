import { FORMS } from "./data/forms.js";

const FIELDS = ["claimant_name", "incident_date", "injury_type", "injury_type_detail", "policy_number"];

function groundTruthFor(customId) {
  const form = FORMS.find((f) => f.customId === customId);
  return form?.groundTruth;
}

// Step 10: never collapse this to one accuracy number. A field is "correct"
// if it exact-matches the hand-labeled ground truth (including both sides
// agreeing a field is genuinely null).
export function buildAccuracyReport(extractions) {
  const byDocType = {};
  const byField = Object.fromEntries(FIELDS.map((f) => [f, { total: 0, correct: 0 }]));
  let totalFields = 0;
  let correctFields = 0;

  for (const ext of extractions) {
    const truth = groundTruthFor(ext.customId);
    if (!truth) continue; // skip synthetic/batch-filler docs with no hand label

    byDocType[ext.docType] ??= { total: 0, correct: 0, fields: Object.fromEntries(FIELDS.map((f) => [f, { total: 0, correct: 0 }])) };

    for (const field of FIELDS) {
      const isCorrect = ext.output[field] === truth[field];
      byDocType[ext.docType].fields[field].total += 1;
      byDocType[ext.docType].fields[field].correct += isCorrect ? 1 : 0;
      byDocType[ext.docType].total += 1;
      byDocType[ext.docType].correct += isCorrect ? 1 : 0;
      byField[field].total += 1;
      byField[field].correct += isCorrect ? 1 : 0;
      totalFields += 1;
      correctFields += isCorrect ? 1 : 0;
    }
  }

  const pct = (c, t) => (t === 0 ? null : Number(((c / t) * 100).toFixed(1)));

  return {
    overallAccuracy: pct(correctFields, totalFields),
    byField: Object.fromEntries(Object.entries(byField).map(([k, v]) => [k, { ...v, accuracy: pct(v.correct, v.total) }])),
    byDocType: Object.fromEntries(
      Object.entries(byDocType).map(([docType, v]) => [
        docType,
        {
          accuracy: pct(v.correct, v.total),
          fields: Object.fromEntries(Object.entries(v.fields).map(([f, fv]) => [f, { ...fv, accuracy: pct(fv.correct, fv.total) }])),
        },
      ])
    ),
  };
}

// Step 9/10 tie-together: is the self-reported confidence actually
// calibrated, or just confidently wrong? Buckets extractions by whether
// every field matched ground truth, and reports mean confidence per bucket —
// if "fully correct" and "has an error" buckets have similar mean
// confidence, the threshold in Step 9 is gating on noise.
export function buildConfidenceCalibrationReport(extractions) {
  let correctCount = 0,
    correctConfidenceSum = 0;
  let incorrectCount = 0,
    incorrectConfidenceSum = 0;
  const miscalibrated = [];

  for (const ext of extractions) {
    const truth = groundTruthFor(ext.customId);
    if (!truth || ext.output.confidence === undefined) continue;

    const allFieldsMatch = FIELDS.every((f) => ext.output[f] === truth[f]);
    if (allFieldsMatch) {
      correctCount += 1;
      correctConfidenceSum += ext.output.confidence;
    } else {
      incorrectCount += 1;
      incorrectConfidenceSum += ext.output.confidence;
      if (ext.output.confidence >= 0.85) {
        miscalibrated.push({ customId: ext.customId, confidence: ext.output.confidence });
      }
    }
  }

  return {
    meanConfidenceWhenCorrect: correctCount ? Number((correctConfidenceSum / correctCount).toFixed(2)) : null,
    meanConfidenceWhenIncorrect: incorrectCount ? Number((incorrectConfidenceSum / incorrectCount).toFixed(2)) : null,
    confidentButWrong: miscalibrated,
  };
}
