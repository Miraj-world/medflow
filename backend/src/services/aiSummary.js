const hasCondition = (conditions, target) =>
  conditions.some((condition) => condition.toLowerCase() === target.toLowerCase());

export const buildAiSummary = ({ conditions, missedAppointments }) => {
  const findings = [];
  let riskLevel = "low";
  let recommendation =
    "Continue routine follow-up, reinforce medication adherence, and maintain preventive care.";

  if (hasCondition(conditions, "diabetes") && hasCondition(conditions, "hypertension")) {
    findings.push("high cardiovascular risk");
    riskLevel = "high";
    recommendation =
      "Schedule cardiometabolic follow-up, review blood pressure and glucose trends, and intensify coaching on lifestyle adherence.";
  }

  if (missedAppointments > 2) {
    findings.push("high no-show risk");
    riskLevel = "high";
    recommendation =
      "Activate outreach reminders, confirm transportation support, and consider shorter-interval follow-up scheduling.";
  }

  if (!findings.length && (conditions.length > 0 || missedAppointments > 0)) {
    riskLevel = "medium";
    recommendation =
      "Monitor adherence closely, review upcoming appointments, and reinforce chronic-care follow-up.";
  }

  const summary =
    findings.length > 0
      ? `Patient profile indicates ${findings.join(" and ")}.`
      : "Patient profile is currently stable with manageable chronic-care needs.";

  return {
    summary,
    riskLevel,
    recommendation,
    findings,
  };
};
