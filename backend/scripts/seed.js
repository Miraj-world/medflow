import bcrypt from "bcryptjs";
import crypto from "crypto";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config({ quiet: true });

import { pool, withTransaction } from "../src/config/database.js";
import { createActivityLog } from "../src/models/activityLogModel.js";
import { getPatientRiskContext } from "../src/models/patientModel.js";
import { syncPatientAlerts } from "../src/services/alertService.js";
import { predictNoShowRisk } from "../src/services/noShowPredictor.js";
import { runMigrations } from "./migrate.js";

const firstNames = [
  "Ava",
  "Noah",
  "Olivia",
  "Liam",
  "Sophia",
  "Mason",
  "Mia",
  "James",
  "Isabella",
  "Elijah",
  "Charlotte",
  "Lucas",
  "Amelia",
  "Benjamin",
  "Harper",
];

const lastNames = [
  "Nguyen",
  "Patel",
  "Carter",
  "Ramirez",
  "Brooks",
  "Johnson",
  "Diaz",
  "Walker",
  "Turner",
  "Shah",
  "Campbell",
  "Bennett",
  "Rivera",
  "Adams",
  "Collins",
];

const streets = [
  "Maple Avenue",
  "Cedar Street",
  "Willow Drive",
  "Oak Circle",
  "Lakeview Terrace",
  "Meadow Lane",
  "Sunset Boulevard",
  "Parkside Court",
];

const specialties = [
  "Internal Medicine",
  "Family Medicine",
  "Cardiology",
  "Endocrinology",
  "Geriatrics",
  "Pulmonology",
];

const chronicProfiles = [
  ["diabetes", "hypertension"],
  ["hypertension"],
  ["diabetes"],
  ["asthma"],
  ["copd"],
  ["chronic kidney disease", "hypertension"],
];

const medicationsByCondition = {
  diabetes: ["Metformin 500 mg", "Ozempic 0.5 mg", "Insulin glargine 10 units"],
  hypertension: ["Lisinopril 10 mg", "Losartan 50 mg", "Amlodipine 5 mg"],
  asthma: ["Albuterol inhaler", "Budesonide inhaler"],
  copd: ["Tiotropium inhaler", "Fluticasone/Salmeterol"],
  "chronic kidney disease": ["Furosemide 20 mg", "Calcitriol 0.25 mcg"],
};

const treatmentByCondition = {
  diabetes: "Glucose management plan",
  hypertension: "Blood pressure stabilization",
  asthma: "Pulmonary symptom control",
  copd: "COPD maintenance program",
  "chronic kidney disease": "Renal care monitoring",
};

const pick = (items, index) => items[index % items.length];

const makeEmail = (firstName, lastName, suffix) =>
  `${firstName}.${lastName}${suffix ? `.${suffix}` : ""}@medflow.dev`.toLowerCase();

const createVitals = (index, conditions) => ({
  bloodPressure: conditions.includes("hypertension") ? `${132 + (index % 14)}/${84 + (index % 9)}` : `${118 + (index % 8)}/${74 + (index % 6)}`,
  heartRate: 68 + (index % 18),
  bmi: Number((23 + (index % 9) * 0.6).toFixed(1)),
  a1c: conditions.includes("diabetes") ? Number((6.7 + (index % 4) * 0.4).toFixed(1)) : null,
});

const makeAppointmentSchedule = (patientIndex) => {
  const appointmentCount = 4 + (patientIndex % 3);
  const missedAppointments = patientIndex % 8 === 0 ? 3 : patientIndex % 5 === 0 ? 2 : patientIndex % 3 === 0 ? 1 : 0;
  const records = [];

  for (let i = 0; i < appointmentCount; i += 1) {
    const monthsOffset = appointmentCount - i;
    const appointmentDate = new Date();
    appointmentDate.setMonth(appointmentDate.getMonth() - monthsOffset);
    appointmentDate.setDate(appointmentDate.getDate() + ((patientIndex + i) % 9));

    let status = "completed";
    if (i < missedAppointments) {
      status = "missed";
    }

    if (i === appointmentCount - 1) {
      appointmentDate.setDate(appointmentDate.getDate() + 25);
      status = "scheduled";
    }

    records.push({
      appointmentDate,
      status,
      consultationMinutes: status === "completed" ? 20 + ((patientIndex + i) % 25) : null,
      reason:
        i === appointmentCount - 1
          ? "Quarterly follow-up"
          : status === "missed"
            ? "Missed chronic care follow-up"
            : "Chronic care follow-up",
      notes:
        status === "missed"
          ? "Patient did not attend scheduled visit."
          : "Reviewed medication adherence and updated care plan.",
    });
  }

  return records;
};

const buildSummary = (conditions, patientIndex) => {
  if (conditions.includes("diabetes") && conditions.includes("hypertension")) {
    return `Patient ${patientIndex + 1} has combined cardiometabolic disease requiring tight follow-up.`;
  }

  return `Patient ${patientIndex + 1} is enrolled in longitudinal chronic care management.`;
};

const countByTable = async (client, tableName) => {
  const { rows } = await client.query(`SELECT COUNT(*)::int AS count FROM ${tableName}`);
  return rows[0].count;
};

const createUsers = async (client, passwordHash) => {
  const roles = [
    { firstName: "Morgan", lastName: "Lane", role: "admin", specialization: "Operations" },
    { firstName: "Amelia", lastName: "Stone", role: "doctor", specialization: specialties[0] },
    { firstName: "James", lastName: "Harper", role: "doctor", specialization: specialties[1] },
    { firstName: "Priya", lastName: "Shah", role: "doctor", specialization: specialties[2] },
    { firstName: "Marcus", lastName: "Reed", role: "doctor", specialization: specialties[3] },
    { firstName: "Elena", lastName: "Brooks", role: "doctor", specialization: specialties[4] },
    { firstName: "David", lastName: "Kim", role: "doctor", specialization: specialties[5] },
    { firstName: "Nina", lastName: "Lopez", role: "nurse", specialization: "Care Coordination" },
    { firstName: "Jordan", lastName: "Cole", role: "nurse", specialization: "Population Health" },
    { firstName: "Riley", lastName: "Ward", role: "nurse", specialization: "Chronic Care" },
  ];

  const users = [];
  let createdCount = 0;
  let reusedCount = 0;

  for (const person of roles) {
    const email = makeEmail(person.firstName, person.lastName);
    const { rows } = await client.query(
      `
        INSERT INTO users (first_name, last_name, full_name, email, password_hash, role, specialization)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (email) DO UPDATE
        SET first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            full_name = EXCLUDED.full_name,
            password_hash = EXCLUDED.password_hash,
            role = EXCLUDED.role,
            specialization = EXCLUDED.specialization,
            updated_at = NOW()
        RETURNING id, full_name, email, role
      `,
      [
        person.firstName,
        person.lastName,
        `${person.firstName} ${person.lastName}`,
        email,
        passwordHash,
        person.role,
        person.specialization,
      ]
    );

    const existed = await client.query(
      `
        SELECT 1
        FROM activity_logs
        WHERE entity_type = 'user'
          AND action IN ('user_registered', 'demo_user_seeded')
          AND details->>'email' = $1
        LIMIT 1
      `,
      [email]
    );

    if (existed.rowCount > 0) {
      reusedCount += 1;
    } else {
      createdCount += 1;
      await createActivityLog(client, {
        userId: rows[0].id,
        action: "demo_user_seeded",
        entityType: "user",
        entityId: rows[0].id,
        details: { email },
      });
    }

    users.push(rows[0]);
  }

  return {
    users,
    doctors: users.filter((user) => user.role === "doctor"),
    nurses: users.filter((user) => user.role === "nurse"),
    admin: users.find((user) => user.role === "admin"),
    createdCount,
    reusedCount,
  };
};

const insertPatientBundle = async (client, doctor, patientIndex) => {
  const firstName = pick(firstNames, patientIndex);
  const lastName = pick(lastNames, patientIndex * 2);
  const conditions = [...new Set(pick(chronicProfiles, patientIndex))];
  const primaryCondition = conditions[0];
  const patientEmail = makeEmail(firstName, lastName, patientIndex + 1);
  const streetNumber = 200 + patientIndex * 3;
  const dateOfBirth = new Date(1958 + (patientIndex % 38), patientIndex % 12, 5 + (patientIndex % 20));

  const existingPatient = await client.query(
    `
      SELECT id
      FROM patients
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
    `,
    [patientEmail]
  );

  if (existingPatient.rowCount > 0) {
    return { patientId: existingPatient.rows[0].id, created: false };
  }

  const { rows: patientRows } = await client.query(
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
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id
    `,
    [
      doctor.id,
      firstName,
      lastName,
      dateOfBirth.toISOString().slice(0, 10),
      patientIndex % 2 === 0 ? "female" : "male",
      `555-01${String(patientIndex).padStart(2, "0")}`,
      patientEmail,
      `${streetNumber} ${pick(streets, patientIndex)}, Chicago, IL`,
      `Case Manager ${pick(lastNames, patientIndex + 4)} - 555-88${String(patientIndex).padStart(2, "0")}`,
      primaryCondition,
      patientIndex % 6 === 0 ? "needs_follow_up" : "stable",
      "Seeded demo patient for dashboard analytics and alert workflows.",
    ]
  );

  const patientId = patientRows[0].id;
  let latestMedicalRecordId = null;

  for (let recordIndex = 0; recordIndex < 2; recordIndex += 1) {
    const recordDate = new Date();
    recordDate.setDate(recordDate.getDate() - (patientIndex + 1) * 6 - recordIndex * 18);

    const { rows: recordRows } = await client.query(
      `
        INSERT INTO medical_records (patient_id, authored_by, diagnosis, symptoms, conditions, vitals, summary, recorded_at)
        VALUES ($1, $2, $3, $4::text[], $5::text[], $6::jsonb, $7, $8)
        RETURNING id
      `,
      [
        patientId,
        doctor.id,
        `${primaryCondition} management review`,
        ["fatigue", "medication follow-up", recordIndex === 0 ? "routine monitoring" : "care-plan adjustment"],
        conditions,
        JSON.stringify(createVitals(patientIndex + recordIndex, conditions)),
        buildSummary(conditions, patientIndex),
        recordDate.toISOString(),
      ]
    );

    latestMedicalRecordId = recordRows[0].id;
  }

  for (const condition of conditions) {
    const treatmentName = treatmentByCondition[condition] ?? "Longitudinal care plan";
    const medication = pick(medicationsByCondition[condition] ?? ["Vitamin D 1000 IU"], patientIndex);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90 - patientIndex);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 120);

    const { rows: treatmentRows } = await client.query(
      `
        INSERT INTO treatments (patient_id, medical_record_id, provider_id, treatment_name, status, start_date, end_date, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `,
      [
        patientId,
        latestMedicalRecordId,
        doctor.id,
        treatmentName,
        "active",
        startDate.toISOString().slice(0, 10),
        endDate.toISOString().slice(0, 10),
        "Seeded treatment linked to chronic disease management.",
      ]
    );

    await client.query(
      `
        INSERT INTO prescriptions (
          patient_id,
          provider_id,
          treatment_id,
          medication_name,
          dosage,
          frequency,
          status,
          start_date,
          end_date,
          instructions
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'active', $7, $8, $9)
      `,
      [
        patientId,
        doctor.id,
        treatmentRows[0].id,
        medication,
        medication.includes("mg") ? medication.split(" ").slice(-2).join(" ") : "1 inhalation",
        condition === "diabetes" ? "twice daily" : "once daily",
        startDate.toISOString().slice(0, 10),
        endDate.toISOString().slice(0, 10),
        "Continue as prescribed and review adherence at next visit.",
      ]
    );
  }

  const schedule = makeAppointmentSchedule(patientIndex);

  for (const appointment of schedule) {
    await client.query(
      `
        INSERT INTO appointments (
          patient_id,
          provider_id,
          appointment_date,
          status,
          consultation_minutes,
          reason,
          notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        patientId,
        doctor.id,
        appointment.appointmentDate.toISOString(),
        appointment.status,
        appointment.consultationMinutes,
        appointment.reason,
        appointment.notes,
      ]
    );
  }

  await createActivityLog(client, {
    userId: doctor.id,
    action: "patient_seeded",
    entityType: "patient",
    entityId: patientId,
    details: {
      conditions,
      appointmentCount: schedule.length,
    },
  });

  const context = await getPatientRiskContext(client, patientId);
  const prediction = await predictNoShowRisk({ client, context, scope: {} });
  await syncPatientAlerts(client, context, prediction);

  return { patientId, created: true };
};

const execute = async () => {
  await runMigrations();

  const demoPassword = process.env.SEED_USER_PASSWORD ?? crypto.randomBytes(9).toString("base64url");
  const passwordHash = await bcrypt.hash(demoPassword, 10);

  const summary = await withTransaction(async (client) => {
    const staff = await createUsers(client, passwordHash);
    const patientIds = [];
    let createdPatients = 0;
    let reusedPatients = 0;

    for (let patientIndex = 0; patientIndex < 60; patientIndex += 1) {
      const doctor = staff.doctors[patientIndex % staff.doctors.length];
      const result = await insertPatientBundle(client, doctor, patientIndex);
      patientIds.push(result.patientId);
      if (result.created) {
        createdPatients += 1;
      } else {
        reusedPatients += 1;
      }
    }

    for (const nurse of staff.nurses) {
      await createActivityLog(client, {
        userId: nurse.id,
        action: "population_review_completed",
        entityType: "dashboard",
        details: { assignedPatients: 20, source: "demo-seed" },
      });
    }

    await createActivityLog(client, {
      userId: staff.admin.id,
      action: "seed_completed",
      entityType: "system",
        details: { patientCount: patientIds.length, createdPatients, reusedPatients },
      });

    const { rows: alertCountRows } = await client.query(
      "SELECT COUNT(*)::int AS count FROM alerts WHERE resolved = FALSE"
    );

    return {
      staff,
      patientCount: patientIds.length,
      createdPatients,
      reusedPatients,
      alertCount: alertCountRows[0].count,
      totalUsers: await countByTable(client, "users"),
      totalPatients: await countByTable(client, "patients"),
    };
  });

  console.log("Seed complete.");
  console.log(`Demo password: ${demoPassword}`);
  console.log(`Demo users created: ${summary.staff.createdCount}`);
  console.log(`Demo users reused: ${summary.staff.reusedCount}`);
  console.log(`Demo patients created: ${summary.createdPatients}`);
  console.log(`Demo patients reused: ${summary.reusedPatients}`);
  console.log(`Total users in database: ${summary.totalUsers}`);
  console.log(`Total patients in database: ${summary.totalPatients}`);
  console.log(`Active alerts currently in database: ${summary.alertCount}`);
  console.log("Login emails:");
  for (const user of summary.staff.users) {
    console.log(`- ${user.role}: ${user.email}`);
  }
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  execute()
    .then(async () => {
      await pool.end();
    })
    .catch(async (error) => {
      console.error(error);
      await pool.end();
      process.exit(1);
    });
}
