const hasCondition = (conditions = [], target) =>
  conditions.some((condition) => condition.toLowerCase() === target.toLowerCase());

const formatPercent = (value) => `${Math.round(value * 100)}%`;

export const buildAiSummary = ({ context, prediction }) => {
  const conditions = context.conditions ?? [];
  const missedCount = Number(context.missed_count ?? 0);
  const totalCount = Number(context.total_count ?? 0);
  const patientMissedRatio = totalCount > 0 ? missedCount / totalCount : 0;
  const baselineRatio = prediction.benchmarks?.clinicBaselineRate ?? 0.2;
  const conditionRatio = prediction.benchmarks?.conditionCohortRate ?? baselineRatio;
  const riskLevel = prediction.riskBand;
  const findings = [];

  if (hasCondition(conditions, "diabetes") && hasCondition(conditions, "hypertension")) {
    findings.push("high cardiometabolic burden");
  }

  if (patientMissedRatio >= baselineRatio + 0.15 && totalCount > 0) {
    findings.push("attendance reliability below clinic baseline");
  }

  if (prediction.probability >= prediction.benchmarks.highThreshold) {
    findings.push("elevated near-term no-show probability");
  }

  if (Number(context.active_alerts ?? 0) > 0) {
    findings.push(`${context.active_alerts} unresolved clinical alert(s)`);
  }

  const summary =
    findings.length > 0
      ? `Risk model flags ${findings.join(", ")} based on patient and cohort appointment behavior in the database.`
      : "Current patient data does not show acute attendance risk signals above clinic baseline.";

  let recommendation =
    "Continue standard follow-up cadence and monitor adherence through scheduled visits.";

  if (riskLevel === "high") {
    recommendation =
      "Schedule proactive outreach within 7 days, confirm reminder channel, and use shorter-interval follow-up until attendance improves.";
  } else if (riskLevel === "medium") {
    recommendation =
      "Reinforce reminders and confirm follow-up logistics at each visit; reassess attendance trend after the next completed appointment.";
  }

  return {
    summary,
    riskLevel,
    recommendation,
    findings: [
      `patient_missed_ratio:${formatPercent(patientMissedRatio)}`,
      `clinic_baseline_ratio:${formatPercent(baselineRatio)}`,
      `condition_cohort_ratio:${formatPercent(conditionRatio)}`,
    ],
  };
};
