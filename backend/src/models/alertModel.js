export const listAlerts = async (client, { limit = 10, role, userId }) => {
  const params = [limit];
  let scopeClause = "";

  if (role === "doctor") {
    params.push(userId);
    scopeClause = "AND p.doctor_id = $2";
  }

  const { rows } = await client.query(
    `
      SELECT
        a.id,
        a.patient_id,
        a.type,
        a.message,
        a.created_at,
        a.resolved,
        p.first_name,
        p.last_name
      FROM alerts a
      JOIN patients p ON p.id = a.patient_id
      WHERE a.resolved = FALSE
      ${scopeClause}
      ORDER BY a.created_at DESC
      LIMIT $1
    `,
    params
  );

  return rows.map((row) => ({
    ...row,
    patientName: `${row.first_name} ${row.last_name}`,
  }));
};

export const ensureAlert = async (client, { patientId, type, message }) => {
  await client.query(
    `
      INSERT INTO alerts (patient_id, type, message)
      SELECT $1, $2, $3
      WHERE NOT EXISTS (
        SELECT 1
        FROM alerts
        WHERE patient_id = $1
          AND type = $2
          AND message = $3
          AND resolved = FALSE
      )
    `,
    [patientId, type, message]
  );
};

export const resolveAlertType = async (client, { patientId, type }) => {
  await client.query(
    `
      UPDATE alerts
      SET resolved = TRUE
      WHERE patient_id = $1
        AND type = $2
        AND resolved = FALSE
    `,
    [patientId, type]
  );
};
