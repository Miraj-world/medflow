const sigmoid = (value) => 1 / (1 + Math.exp(-value));

export const predictNoShowRisk = ({
  conditions,
  missedCount,
  completedCount,
  totalCount,
  dateOfBirth,
}) => {
  const chronicCount = conditions.length;
  const age = dateOfBirth
    ? Math.floor((Date.now() - new Date(dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : 45;
  const missedRatio = totalCount > 0 ? missedCount / totalCount : 0;

  const linearScore =
    -1.25 +
    missedCount * 0.95 +
    missedRatio * 1.4 +
    chronicCount * 0.28 +
    (age < 35 ? 0.25 : 0) -
    completedCount * 0.12;

  const probability = Number(sigmoid(linearScore).toFixed(2));
  const riskBand = probability >= 0.75 ? "high" : probability >= 0.45 ? "medium" : "low";

  return {
    model: "logistic-baseline-v1",
    probability,
    riskBand,
    factors: [
      `missed_appointments:${missedCount}`,
      `missed_ratio:${missedRatio.toFixed(2)}`,
      `chronic_conditions:${chronicCount}`,
      `completed_appointments:${completedCount}`,
    ],
  };
};
