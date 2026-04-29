const toRate = (missed, total) => (total > 0 ? missed / total : null);

const smoothRate = (missed, total, baselineRate, priorWeight) =>
  (missed + baselineRate * priorWeight) / (total + priorWeight);

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const getDoctorScopeId = (scope = {}) => (scope.role === "doctor" ? scope.userId : null);

const getPatientAge = (dateOfBirth) => {
  if (!dateOfBirth) {
    return 45;
  }

  const age =
    (Date.now() - new Date(dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  return Math.max(0, Math.floor(age));
};

const normaliseConditions = (conditions = []) =>
  [...new Set(conditions.map((condition) => condition.toLowerCase().trim()).filter(Boolean))];

const getObservedStatusStats = async (client, { doctorId = null } = {}) => {
  const { rows } = await client.query(
    `
      SELECT
        COUNT(*) FILTER (WHERE a.status IN ('missed', 'completed'))::int AS observed_total,
        COUNT(*) FILTER (WHERE a.status = 'missed')::int AS observed_missed
      FROM appointments a
      JOIN patients p ON p.id = a.patient_id
      WHERE ($1::uuid IS NULL OR p.doctor_id = $1)
    `,
    [doctorId]
  );

  return rows[0];
};

const getConditionCohortStats = async (client, { doctorId = null, conditions = [] } = {}) => {
  if (!conditions.length) {
    return { observed_total: 0, observed_missed: 0 };
  }

  const { rows } = await client.query(
    `
      WITH latest_conditions AS (
        SELECT DISTINCT ON (mr.patient_id) mr.patient_id, mr.conditions
        FROM medical_records mr
        ORDER BY mr.patient_id, mr.recorded_at DESC
      )
      SELECT
        COUNT(*) FILTER (WHERE a.status IN ('missed', 'completed'))::int AS observed_total,
        COUNT(*) FILTER (WHERE a.status = 'missed')::int AS observed_missed
      FROM appointments a
      JOIN patients p ON p.id = a.patient_id
      JOIN latest_conditions lc ON lc.patient_id = p.id
      WHERE ($1::uuid IS NULL OR p.doctor_id = $1)
        AND EXISTS (
          SELECT 1
          FROM unnest(lc.conditions) AS c
          WHERE LOWER(c) = ANY($2::text[])
        )
    `,
    [doctorId, conditions]
  );

  return rows[0];
};

const getAgeBandStats = async (
  client,
  { doctorId = null, ageBandStart = 0, ageBandEnd = 120 } = {}
) => {
  const { rows } = await client.query(
    `
      SELECT
        COUNT(*) FILTER (WHERE a.status IN ('missed', 'completed'))::int AS observed_total,
        COUNT(*) FILTER (WHERE a.status = 'missed')::int AS observed_missed
      FROM appointments a
      JOIN patients p ON p.id = a.patient_id
      WHERE ($1::uuid IS NULL OR p.doctor_id = $1)
        AND EXTRACT(YEAR FROM AGE(NOW(), p.date_of_birth)) BETWEEN $2 AND $3
    `,
    [doctorId, ageBandStart, ageBandEnd]
  );

  return rows[0];
};

const getRecentPatientStats = async (client, { patientId, windowDays = 180 }) => {
  const { rows } = await client.query(
    `
      SELECT
        COUNT(*) FILTER (WHERE status IN ('missed', 'completed'))::int AS observed_total,
        COUNT(*) FILTER (WHERE status = 'missed')::int AS observed_missed
      FROM appointments
      WHERE patient_id = $1
        AND appointment_date >= NOW() - ($2::text || ' days')::interval
    `,
    [patientId, String(windowDays)]
  );

  return rows[0];
};

export const predictNoShowRisk = async ({ client, context, scope = {} }) => {
  if (!client) {
    throw new Error("A database client is required for no-show prediction.");
  }

  const doctorId = getDoctorScopeId(scope);
  const age = getPatientAge(context.date_of_birth);
  const ageBandStart = Math.floor(age / 10) * 10;
  const ageBandEnd = ageBandStart + 9;
  const conditions = normaliseConditions(context.conditions);

  const [overallStats, conditionStats, ageBandStats, recentStats] = await Promise.all([
    getObservedStatusStats(client, { doctorId }),
    getConditionCohortStats(client, { doctorId, conditions }),
    getAgeBandStats(client, { doctorId, ageBandStart, ageBandEnd }),
    getRecentPatientStats(client, { patientId: context.id, windowDays: 180 }),
  ]);

  const totalCount = Number(context.total_count ?? 0);
  const missedCount = Number(context.missed_count ?? 0);
  const completedCount = Number(context.completed_count ?? 0);

  const overallRate = toRate(overallStats.observed_missed, overallStats.observed_total) ?? 0.2;
  const patientRate = smoothRate(missedCount, totalCount, overallRate, 4);
  const conditionRate =
    conditionStats.observed_total > 0
      ? smoothRate(conditionStats.observed_missed, conditionStats.observed_total, overallRate, 6)
      : overallRate;
  const ageBandRate =
    ageBandStats.observed_total > 0
      ? smoothRate(ageBandStats.observed_missed, ageBandStats.observed_total, overallRate, 6)
      : overallRate;
  const recentRate =
    recentStats.observed_total > 0
      ? smoothRate(recentStats.observed_missed, recentStats.observed_total, patientRate, 3)
      : patientRate;

  const baseWeight = 3;
  const patientWeight = Math.max(2, Math.min(totalCount, 12));
  const conditionWeight = Math.min(conditionStats.observed_total, 24) / 3;
  const ageBandWeight = Math.min(ageBandStats.observed_total, 24) / 4;
  const recentWeight = Math.min(recentStats.observed_total, 12) / 2;

  const weightedScore =
    overallRate * baseWeight +
    patientRate * patientWeight +
    conditionRate * conditionWeight +
    ageBandRate * ageBandWeight +
    recentRate * recentWeight;
  const totalWeight =
    baseWeight + patientWeight + conditionWeight + ageBandWeight + recentWeight;

  const probability = Number(clamp(weightedScore / totalWeight, 0.02, 0.98).toFixed(2));
  const mediumThreshold = clamp(overallRate + 0.08, 0.25, 0.7);
  const highThreshold = clamp(overallRate + 0.2, mediumThreshold + 0.08, 0.9);
  const riskBand = probability >= highThreshold ? "high" : probability >= mediumThreshold ? "medium" : "low";

  return {
    model: "db-cohort-v2",
    probability,
    riskBand,
    factors: [
      `patient_missed_ratio:${(totalCount > 0 ? missedCount / totalCount : overallRate).toFixed(2)}`,
      `clinic_baseline_ratio:${overallRate.toFixed(2)}`,
      `condition_cohort_ratio:${conditionRate.toFixed(2)}`,
      `age_band_ratio:${ageBandRate.toFixed(2)}`,
      `recent_180d_ratio:${recentRate.toFixed(2)}`,
      `completed_appointments:${completedCount}`,
    ],
    benchmarks: {
      clinicBaselineRate: Number(overallRate.toFixed(2)),
      conditionCohortRate: Number(conditionRate.toFixed(2)),
      ageBandRate: Number(ageBandRate.toFixed(2)),
      recentRate: Number(recentRate.toFixed(2)),
      mediumThreshold: Number(mediumThreshold.toFixed(2)),
      highThreshold: Number(highThreshold.toFixed(2)),
      sampleSizes: {
        clinic: overallStats.observed_total,
        conditionCohort: conditionStats.observed_total,
        ageBand: ageBandStats.observed_total,
        recent: recentStats.observed_total,
      },
    },
  };
};
