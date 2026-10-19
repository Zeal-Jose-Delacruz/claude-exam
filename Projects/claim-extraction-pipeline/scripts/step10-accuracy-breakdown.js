import { extractClaim } from "../src/extract.js";
import { FORMS } from "../src/data/forms.js";
import { buildAccuracyReport, buildConfidenceCalibrationReport } from "../src/accuracyReport.js";

console.log("=== Step 10: accuracy by document type and by field ===\n");

const extractions = [];
for (const form of FORMS) {
  extractions.push(await extractClaim(form, { withConfidence: true, useFewShot: true }));
}

const report = buildAccuracyReport(extractions);

console.log(`Overall field-level accuracy: ${report.overallAccuracy}%\n`);

console.log("By field:");
for (const [field, v] of Object.entries(report.byField)) {
  console.log(`  ${field.padEnd(18)} ${v.accuracy}%  (${v.correct}/${v.total})`);
}

console.log("\nBy document type:");
for (const [docType, v] of Object.entries(report.byDocType)) {
  console.log(`  ${docType}: ${v.accuracy}% overall`);
  for (const [field, fv] of Object.entries(v.fields)) {
    console.log(`    ${field.padEnd(18)} ${fv.accuracy}%  (${fv.correct}/${fv.total})`);
  }
}

const calibration = buildConfidenceCalibrationReport(extractions);
console.log("\nConfidence calibration check:");
console.log(`  mean confidence when fully correct: ${calibration.meanConfidenceWhenCorrect}`);
console.log(`  mean confidence when it has an error: ${calibration.meanConfidenceWhenIncorrect}`);
console.log(`  confident (>=0.85) but wrong: ${calibration.confidentButWrong.map((c) => `${c.customId} (${c.confidence})`).join(", ") || "none"}`);
