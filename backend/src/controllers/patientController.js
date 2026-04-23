import { withTransaction } from "../config/database.js";
import { createActivityLog } from "../models/activityLogModel.js";
import {
  createPatientWithInitialRecord,
  getPatientDetails,
  getPatientRiskContext,
  listPatients,
  updatePatient,
  deletePatient,
} from "../models/patientModel.js";
import { AppError } from "../utils/AppError.js";
import { buildAiSummary } from "../services/aiSummary.js";
import { predictNoShowRisk } from "../services/noShowPredictor.js";
import { syncPatientAlerts } from "../services/alertService.js";

export const getPatients = async (req, res) => {
  const patients = await withTransaction(async (client) =>
    listPatients(client, {
      search: req.query.search?.trim() ?? "",
      role: req.user.role,
      userId: req.user.sub,
    })
  );

  res.json(patients);
};

export const getPatientById = async (req, res) => {
  const payload = await withTransaction(async (client) => {
    const context = await getPatientRiskContext(client, req.params.patientId);

    if (!context) {
      throw new AppError("Patient not found.", 404);
    }

    if (req.user.role === "doctor" && context.doctor_id !== req.user.sub) {
      throw new AppError("You do not have access to this patient.", 403);
    }

    const aiSummary = await syncPatientAlerts(client, context);
    const prediction = predictNoShowRisk({
      conditions: context.conditions,
      missedCount: context.missed_count,
      completedCount: context.completed_count,
      totalCount: context.total_count,
      dateOfBirth: context.date_of_birth,
    });

    const details = await getPatientDetails(client, req.params.patientId);

    return {
      ...details,
      aiSummary,
      noShowPrediction: prediction,
    };
  });

  res.json(payload);
};

export const createPatient = async (req, res) => {
  const {
    firstName,
    lastName,
    dateOfBirth,
    gender,
    phone = null,
    email = null,
    address = null,
    emergencyContact = null,
    primaryCondition,
    careStatus,
    notes = null,
    conditions = [],
    diagnosis,
    summary,
    doctorId,
  } = req.body;

  if (!firstName || !lastName || !dateOfBirth || !gender || !doctorId || !diagnosis) {
    throw new AppError(
      "firstName, lastName, dateOfBirth, gender, doctorId, and diagnosis are required.",
      400
    );
  }

  const patient = await withTransaction(async (client) => {
    if (req.user.role === "doctor" && doctorId !== req.user.sub) {
      throw new AppError("Doctors can only create patients within their own panel.", 403);
    }

    const createdPatient = await createPatientWithInitialRecord(client, {
      doctorId,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      phone,
      email,
      address,
      emergencyContact,
      primaryCondition: primaryCondition ?? diagnosis,
      careStatus: careStatus ?? "stable",
      notes,
      conditions,
      diagnosis,
      summary: summary ?? "Initial intake assessment completed.",
    });

    const context = await getPatientRiskContext(client, createdPatient.id);
    await syncPatientAlerts(client, context);

    await createActivityLog(client, {
      userId: req.user.sub,
      action: "patient_created",
      entityType: "patient",
      entityId: createdPatient.id,
      details: { doctorId, conditionCount: conditions.length },
    });

    return createdPatient;
  });

  res.status(201).json(patient);
};

export const getPatientPrediction = async (req, res) => {
  const payload = await withTransaction(async (client) => {
    const context = await getPatientRiskContext(client, req.params.patientId);

    if (!context) {
      throw new AppError("Patient not found.", 404);
    }

    if (req.user.role === "doctor" && context.doctor_id !== req.user.sub) {
      throw new AppError("You do not have access to this patient.", 403);
    }

    const aiSummary = buildAiSummary({
      conditions: context.conditions,
      missedAppointments: context.missed_count,
    });

    return {
      aiSummary,
      prediction: predictNoShowRisk({
        conditions: context.conditions,
        missedCount: context.missed_count,
        completedCount: context.completed_count,
        totalCount: context.total_count,
        dateOfBirth: context.date_of_birth,
      }),
    };
  });

  res.json(payload);
};

export const updatePatientHandler = async (req, res) => {
  const { firstName, lastName, phone, email, address, emergencyContact, primaryCondition, careStatus, notes } = req.body;

  const patient = await withTransaction(async (client) => {
    const context = await getPatientRiskContext(client, req.params.patientId);

    if (!context) {
      throw new AppError("Patient not found.", 404);
    }

    if (req.user.role === "doctor" && context.doctor_id !== req.user.sub) {
      throw new AppError("You do not have access to this patient.", 403);
    }

    const updated = await updatePatient(client, req.params.patientId, {
      firstName,
      lastName,
      phone,
      email,
      address,
      emergencyContact,
      primaryCondition,
      careStatus,
      notes,
    });

    await createActivityLog(client, {
      userId: req.user.sub,
      action: "patient_updated",
      entityType: "patient",
      entityId: req.params.patientId,
      details: { updatedFields: Object.keys(req.body) },
    });

    return updated;
  });

  res.json(patient);
};

export const deletePatientHandler = async (req, res) => {
  await withTransaction(async (client) => {
    const context = await getPatientRiskContext(client, req.params.patientId);

    if (!context) {
      throw new AppError("Patient not found.", 404);
    }

    if (req.user.role === "doctor" && context.doctor_id !== req.user.sub) {
      throw new AppError("You do not have access to this patient.", 403);
    }

    await deletePatient(client, req.params.patientId);

    await createActivityLog(client, {
      userId: req.user.sub,
      action: "patient_deleted",
      entityType: "patient",
      entityId: req.params.patientId,
      details: {},
    });
  });

  res.json({ message: "Patient deleted successfully." });
};
