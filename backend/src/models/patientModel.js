export const listPatients = async (client, { search = "", role, userId }) => {
  const params = [];
  const filters = [];

  if (search) {
    params.push(`%${search}%`);
    filters.push(
      `(p.first_name ILIKE $${params.length} OR p.last_name ILIKE $${params.length} OR COALESCE(p.email, '') ILIKE $${params.length})`
    );
  }

  if (role === "doctor") {
    params.push(userId);
    filters.push(`p.doctor_id = $${params.length}`);
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const { rows } = await client.query(
    `
      SELECT
        p.id,
        p.first_name,
        p.last_name,
        p.gender,
        p.date_of_birth,
        p.phone,
        p.email,
        p.primary_condition,
        p.care_status,
        p.created_at,
        u.full_name AS doctor_name,
        COALESCE(mr.conditions, ARRAY[]::text[]) AS conditions,
        COALESCE(ap.total_appointments, 0)::int AS total_appointments,
        COALESCE(ap.missed_appointments, 0)::int AS missed_appointments,
        COALESCE(al.active_alerts, 0)::int AS active_alerts,
        next_appointment.appointment_date AS next_appointment
      FROM patients p
      JOIN users u ON u.id = p.doctor_id
      LEFT JOIN LATERAL (
        SELECT conditions
        FROM medical_records
        WHERE patient_id = p.id
        ORDER BY recorded_at DESC
        LIMIT 1
      ) mr ON TRUE
      LEFT JOIN LATERAL (
        SELECT
          COUNT(*) AS total_appointments,
          COUNT(*) FILTER (WHERE status = 'missed') AS missed_appointments
        FROM appointments
        WHERE patient_id = p.id
      ) ap ON TRUE
      LEFT JOIN LATERAL (
        SELECT COUNT(*) AS active_alerts
        FROM alerts
        WHERE patient_id = p.id AND resolved = FALSE
      ) al ON TRUE
      LEFT JOIN LATERAL (
        SELECT appointment_date
        FROM appointments
        WHERE patient_id = p.id AND appointment_date >= NOW()
        ORDER BY appointment_date ASC
        LIMIT 1
      ) next_appointment ON TRUE
      ${whereClause}
      ORDER BY p.last_name, p.first_name
    `,
    params
  );

  return rows;
};

export const getPatientDetails = async (client, patientId) => {
  const patientResult = await client.query(
    `
      SELECT
        p.*,
        u.full_name AS doctor_name,
        u.email AS doctor_email
      FROM patients p
      JOIN users u ON u.id = p.doctor_id
      WHERE p.id = $1
    `,
    [patientId]
  );

  if (!patientResult.rows[0]) {
    return null;
  }

  const [appointments, medicalRecords, treatments, prescriptions, alerts] = await Promise.all([
    client.query(
      `
        SELECT id, appointment_date, status, consultation_minutes, reason, notes, created_at
        FROM appointments
        WHERE patient_id = $1
        ORDER BY appointment_date DESC
      `,
      [patientId]
    ),
    client.query(
      `
        SELECT id, diagnosis, symptoms, conditions, vitals, summary, recorded_at
        FROM medical_records
        WHERE patient_id = $1
        ORDER BY recorded_at DESC
      `,
      [patientId]
    ),
    client.query(
      `
        SELECT id, treatment_name, status, start_date, end_date, notes, created_at
        FROM treatments
        WHERE patient_id = $1
        ORDER BY start_date DESC
      `,
      [patientId]
    ),
    client.query(
      `
        SELECT id, medication_name, dosage, frequency, status, start_date, end_date, instructions, prescribed_at
        FROM prescriptions
        WHERE patient_id = $1
        ORDER BY prescribed_at DESC
      `,
      [patientId]
    ),
    client.query(
      `
        SELECT id, type, message, created_at, resolved
        FROM alerts
        WHERE patient_id = $1
        ORDER BY created_at DESC
      `,
      [patientId]
    ),
  ]);

  return {
    patient: patientResult.rows[0],
    appointments: appointments.rows,
    medicalRecords: medicalRecords.rows,
    treatments: treatments.rows,
    prescriptions: prescriptions.rows,
    alerts: alerts.rows,
  };
};

export const getPatientRiskContext = async (client, patientId) => {
  const { rows } = await client.query(
    `
      SELECT
        p.id,
        p.doctor_id,
        p.first_name,
        p.last_name,
        p.primary_condition,
        p.date_of_birth,
        COALESCE(mr.conditions, ARRAY[]::text[]) AS conditions,
        COALESCE(ap.missed_count, 0)::int AS missed_count,
        COALESCE(ap.completed_count, 0)::int AS completed_count,
        COALESCE(ap.total_count, 0)::int AS total_count
      FROM patients p
      LEFT JOIN LATERAL (
        SELECT conditions
        FROM medical_records
        WHERE patient_id = p.id
        ORDER BY recorded_at DESC
        LIMIT 1
      ) mr ON TRUE
      LEFT JOIN LATERAL (
        SELECT
          COUNT(*) FILTER (WHERE status = 'missed') AS missed_count,
          COUNT(*) FILTER (WHERE status = 'completed') AS completed_count,
          COUNT(*) AS total_count
        FROM appointments
        WHERE patient_id = p.id
      ) ap ON TRUE
      WHERE p.id = $1
    `,
    [patientId]
  );

  return rows[0] ?? null;
};

export const createPatientWithInitialRecord = async (
  client,
  {
    doctorId,
    firstName,
    lastName,
    dateOfBirth,
    gender,
    phone,
    email,
    address,
    emergencyContact,
    primaryCondition,
    careStatus,
    notes,
    conditions,
    diagnosis,
    summary,
  }
) => {
  const patientResult = await client.query(
    `
      INSERT INTO patients (
        doctor_id,
        first_name,
        last_name,
        date_of_birth,
        gender,
        phone,
        email,
        address,
        emergency_contact,
        primary_condition,
        care_status,
        notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, LOWER($7), $8, $9, $10, $11, $12)
      RETURNING *
    `,
    [
      doctorId,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      phone,
      email,
      address,
      emergencyContact,
      primaryCondition,
      careStatus,
      notes,
    ]
  );

  const patient = patientResult.rows[0];

  await client.query(
    `
      INSERT INTO medical_records (patient_id, authored_by, diagnosis, conditions, summary)
      VALUES ($1, $2, $3, $4::text[], $5)
    `,
    [patient.id, doctorId, diagnosis, conditions, summary]
  );

  return patient;
};
