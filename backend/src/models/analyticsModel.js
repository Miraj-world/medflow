export const getOverviewAnalytics = async (client, { role, userId }) => {
  const params = [];
  let patientScopeClause = "";
  let appointmentScopeClause = "";

  if (role === "doctor") {
    params.push(userId);
    patientScopeClause = `WHERE p.doctor_id = $${params.length}`;
    appointmentScopeClause = `WHERE a.provider_id = $${params.length}`;
  }

  const [overviewResult, doctorLoadResult, conditionBreakdownResult, missedTrendResult] =
    await Promise.all([
      client.query(
        `
          SELECT
            COUNT(DISTINCT p.id)::int AS total_patients,
            COUNT(DISTINCT p.doctor_id)::int AS active_doctors,
            COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'missed')::int AS missed_appointments,
            COALESCE(AVG(a.consultation_minutes) FILTER (WHERE a.status = 'completed'), 0)::numeric(10,2) AS avg_consultation_minutes,
            COUNT(DISTINCT al.id) FILTER (WHERE al.resolved = FALSE)::int AS active_alerts
          FROM patients p
          LEFT JOIN appointments a ON a.patient_id = p.id
          LEFT JOIN alerts al ON al.patient_id = p.id
          ${patientScopeClause}
        `,
        params
      ),
      client.query(
        `
          SELECT
            u.id,
            u.full_name AS doctor_name,
            COUNT(p.id)::int AS patient_count
          FROM users u
          LEFT JOIN patients p ON p.doctor_id = u.id
          WHERE u.role = 'doctor'
          ${role === "doctor" ? `AND u.id = $${params.length}` : ""}
          GROUP BY u.id, u.full_name
          ORDER BY patient_count DESC, doctor_name ASC
        `,
        params
      ),
      client.query(
        `
          SELECT
            condition,
            COUNT(*)::int AS total
          FROM (
            SELECT UNNEST(conditions) AS condition
            FROM medical_records mr
            JOIN patients p ON p.id = mr.patient_id
            ${patientScopeClause}
          ) conditions
          GROUP BY condition
          ORDER BY total DESC, condition ASC
        `,
        params
      ),
      client.query(
        `
          SELECT
            DATE_TRUNC('month', appointment_date) AS month,
            COUNT(*) FILTER (WHERE status = 'missed')::int AS missed,
            COUNT(*)::int AS total
          FROM appointments a
          ${appointmentScopeClause}
          GROUP BY DATE_TRUNC('month', appointment_date)
          ORDER BY month ASC
        `,
        params
      ),
    ]);

  return {
    overview: overviewResult.rows[0],
    doctorLoad: doctorLoadResult.rows,
    conditionBreakdown: conditionBreakdownResult.rows,
    missedTrend: missedTrendResult.rows,
  };
};

export const getHighRiskPatients = async (client, { role, userId, limit = 5 }) => {
  const params = [limit];
  let scopeClause = "";

  if (role === "doctor") {
    params.push(userId);
    scopeClause = `WHERE p.doctor_id = $2`;
  }

  const { rows } = await client.query(
    `
      SELECT
        p.id,
        p.first_name,
        p.last_name,
        p.primary_condition,
        COALESCE(ap.missed_count, 0)::int AS missed_count,
        COALESCE(al.alert_count, 0)::int AS alert_count
      FROM patients p
      LEFT JOIN LATERAL (
        SELECT COUNT(*) FILTER (WHERE status = 'missed') AS missed_count
        FROM appointments
        WHERE patient_id = p.id
      ) ap ON TRUE
      LEFT JOIN LATERAL (
        SELECT COUNT(*) FILTER (WHERE resolved = FALSE) AS alert_count
        FROM alerts
        WHERE patient_id = p.id
      ) al ON TRUE
      ${scopeClause}
      ORDER BY alert_count DESC, missed_count DESC, p.last_name ASC
      LIMIT $1
    `,
    params
  );

  return rows.map((row) => ({
    ...row,
    patientName: `${row.first_name} ${row.last_name}`,
  }));
};
