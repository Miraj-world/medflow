export const createAppointment = async (
  client,
  { patientId, providerId, appointmentDate, status = "scheduled", reason, notes = null, consultationMinutes = null }
) => {
  const { rows } = await client.query(
    `
      INSERT INTO appointments (
        patient_id,
        provider_id,
        appointment_date,
        status,
        reason,
        notes,
        consultation_minutes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, patient_id, provider_id, appointment_date, status, reason, notes, consultation_minutes, created_at
    `,
    [patientId, providerId, appointmentDate, status, reason, notes, consultationMinutes]
  );

  return rows[0];
};

export const getAppointmentById = async (client, appointmentId) => {
  const { rows } = await client.query(
    `
      SELECT id, patient_id, provider_id, appointment_date, status, reason, notes, consultation_minutes, created_at
      FROM appointments
      WHERE id = $1
    `,
    [appointmentId]
  );

  return rows[0] ?? null;
};

export const updateAppointmentStatus = async (client, appointmentId, status, consultationMinutes = null) => {
  const { rows } = await client.query(
    `
      UPDATE appointments
      SET status = $2,
          consultation_minutes = $3
      WHERE id = $1
      RETURNING id, patient_id, provider_id, appointment_date, status, reason, notes, consultation_minutes, created_at
    `,
    [appointmentId, status, consultationMinutes]
  );

  return rows[0] ?? null;
};

export const updateAppointment = async (
  client,
  appointmentId,
  { appointmentDate, status, reason, notes, consultationMinutes }
) => {
  const updates = [];
  const values = [appointmentId];
  let paramCount = 2;

  if (appointmentDate !== undefined) {
    updates.push(`appointment_date = $${paramCount++}`);
    values.push(appointmentDate);
  }
  if (status !== undefined) {
    updates.push(`status = $${paramCount++}`);
    values.push(status);
  }
  if (reason !== undefined) {
    updates.push(`reason = $${paramCount++}`);
    values.push(reason);
  }
  if (notes !== undefined) {
    updates.push(`notes = $${paramCount++}`);
    values.push(notes);
  }
  if (consultationMinutes !== undefined) {
    updates.push(`consultation_minutes = $${paramCount++}`);
    values.push(consultationMinutes);
  }

  if (updates.length === 0) {
    return await getAppointmentById(client, appointmentId);
  }

  const { rows } = await client.query(
    `
      UPDATE appointments
      SET ${updates.join(", ")}
      WHERE id = $1
      RETURNING id, patient_id, provider_id, appointment_date, status, reason, notes, consultation_minutes, created_at
    `,
    values
  );

  return rows[0] ?? null;
};

export const deleteAppointment = async (client, appointmentId) => {
  const { rows } = await client.query(
    `
      DELETE FROM appointments
      WHERE id = $1
      RETURNING id
    `,
    [appointmentId]
  );

  return rows.length > 0;
};

export const getPatientAppointments = async (client, patientId) => {
  const { rows } = await client.query(
    `
      SELECT id, patient_id, provider_id, appointment_date, status, reason, notes, consultation_minutes, created_at
      FROM appointments
      WHERE patient_id = $1
      ORDER BY appointment_date DESC
    `,
    [patientId]
  );

  return rows;
};
