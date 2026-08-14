/* Wellora ML Risk Calculation Utility */

export function calculateHeartRisk(params) {
  let score = 0;

  if (params.age > 65) score += 15;
  else if (params.age > 50) score += 10;
  else if (params.age > 40) score += 5;

  if (params.sex === 1) score += 8;

  if (params.cp === 3) score += 20;
  else if (params.cp === 2) score += 14;
  else if (params.cp === 1) score += 8;

  if (params.trestbps >= 160) score += 15;
  else if (params.trestbps >= 140) score += 10;
  else if (params.trestbps >= 130) score += 5;

  if (params.chol >= 260) score += 14;
  else if (params.chol >= 220) score += 8;

  if (params.fbs === 1) score += 8;

  if (params.oldpeak >= 2.0) score += 20;
  else if (params.oldpeak >= 1.0) score += 12;
  else if (params.oldpeak > 0.4) score += 6;

  if (params.exang === 1) score += 12;
  if (params.slope === 2) score += 10;

  const finalScore = Math.min(Math.max(Math.round(score), 8), 99);

  let category = "Low Risk";
  let hexColor = "#059669";
  
  if (finalScore >= 75) {
    category = "High Ischemic Risk";
    hexColor = "#E11D48";
  } else if (finalScore >= 45) {
    category = "Moderate Risk";
    hexColor = "#D97706";
  }

  const keyFactors = [];
  if (params.oldpeak >= 1.0) keyFactors.push(`Significant ST Depression (${params.oldpeak}mm) on ECG`);
  if (params.chol >= 240) keyFactors.push(`Hypercholesterolemia (${params.chol} mg/dL)`);
  if (params.trestbps >= 140) keyFactors.push(`Systolic Hypertension (${params.trestbps} mmHg)`);
  if (params.exang === 1) keyFactors.push(`Positive Exercise-Induced Angina`);

  return {
    riskScore: finalScore,
    riskCategory: category,
    hexColor: hexColor,
    // NOTE: no confidence figure is reported. A deterministic rule-based
    // scorer has no meaningful confidence interval — the previous
    // `92 + (score % 6)` value was cosmetic. A real confidence value can
    // only come from the trained model once it is wired in.
    modelVersion: "rule-based-v0.1",
    keyFactors: keyFactors.length ? keyFactors : ["No immediate critical ischemic markers detected."],
    recommendation: finalScore >= 75
      ? "URGENT: STAT Cardiology consult, 12-lead ECG telemetry monitoring, and Troponin I assay."
      : finalScore >= 45
      ? "MODERATE: Schedule Echocardiogram and initiate Statin/ACEi therapy review."
      : "LOW: Routine cardiovascular health maintenance."
  };
}
