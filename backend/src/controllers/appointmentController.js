import { withTransaction } from "../config/database.js";
import { createActivityLog } from "../models/activityLogModel.js";
import {
  createAppointment,
  getAppointmentById,
  updateAppointmentStatus,
  updateAppointment,
  deleteAppointment,
  getPatientAppointments,
} from "../models/appointmentModel.js";
import { getPatientRiskContext } from "../models/patientModel.js";
import { AppError } from "../utils/AppError.js";
import { syncPatientAlerts } from "../services/alertService.js";

export const createAppointmentHandler = async (req, res) => {
  const { patientId, providerId, appointmentDate, reason, notes = null, consultationMinutes = null } = req.body;

  if (!patientId || !providerId || !appointmentDate || !reason) {
    throw new AppError("patientId, providerId, appointmentDate, and reason are required.", 400);
  }

  const appointment = await withTransaction(async (client) => {
    // Verify the patient exists and user has access
    const context = await getPatientRiskContext(client, patientId);
    if (!context) {
      throw new AppError("Patient not found.", 404);
    }

    if (req.user.role === "doctor" && context.doctor_id !== req.user.sub) {
      throw new AppError("You do not have access to this patient.", 403);
    }

    const created = await createAppointment(client, {
      patientId,
      providerId,
      appointmentDate,
      reason,
      notes,
      consultationMinutes,
    });

    await syncPatientAlerts(client, context);

    await createActivityLog(client, {
      userId: req.user.sub,
      action: "appointment_created",
      entityType: "appointment",
      entityId: created.id,
      details: { patientId, appointmentDate },
    });

    return created;
  });

  res.status(201).json(appointment);
};

export const getAppointmentHandler = async (req, res) => {
  const appointment = await withTransaction(async (client) => {
    const appt = await getAppointmentById(client, req.params.appointmentId);

    if (!appt) {
      throw new AppError("Appointment not found.", 404);
    }

    const context = await getPatientRiskContext(client, appt.patient_id);
    if (req.user.role === "doctor" && context.doctor_id !== req.user.sub) {
      throw new AppError("You do not have access to this appointment.", 403);
    }

    return appt;
  });

  res.json(appointment);
};

export const updateAppointmentStatusHandler = async (req, res) => {
  const { status, consultationMinutes = null } = req.body;

  if (!status || !["scheduled", "completed", "missed", "cancelled"].includes(status)) {
    throw new AppError("Valid status (scheduled, completed, missed, cancelled) is required.", 400);
  }

  const appointment = await withTransaction(async (client) => {
    const appt = await getAppointmentById(client, req.params.appointmentId);

    if (!appt) {
      throw new AppError("Appointment not found.", 404);
    }

    const context = await getPatientRiskContext(client, appt.patient_id);
    if (req.user.role === "doctor" && context.doctor_id !== req.user.sub) {
      throw new AppError("You do not have access to this appointment.", 403);
    }

    const updated = await updateAppointmentStatus(client, req.params.appointmentId, status, consultationMinutes);

    await syncPatientAlerts(client, context);

    await createActivityLog(client, {
      userId: req.user.sub,
      action: "appointment_updated",
      entityType: "appointment",
      entityId: updated.id,
      details: { status, consultationMinutes },
    });

    return updated;
  });

  res.json(appointment);
};

export const updateAppointmentHandler = async (req, res) => {
  const { appointmentDate, status, reason, notes, consultationMinutes } = req.body;

  const appointment = await withTransaction(async (client) => {
    const appt = await getAppointmentById(client, req.params.appointmentId);

    if (!appt) {
      throw new AppError("Appointment not found.", 404);
    }

    const context = await getPatientRiskContext(client, appt.patient_id);
    if (req.user.role === "doctor" && context.doctor_id !== req.user.sub) {
      throw new AppError("You do not have access to this appointment.", 403);
    }

    const updated = await updateAppointment(client, req.params.appointmentId, {
      appointmentDate,
      status,
      reason,
      notes,
      consultationMinutes,
    });

    await syncPatientAlerts(client, context);

    await createActivityLog(client, {
      userId: req.user.sub,
      action: "appointment_updated",
      entityType: "appointment",
      entityId: updated.id,
      details: { appointmentDate, status, reason },
    });

    return updated;
  });

  res.json(appointment);
};

export const deleteAppointmentHandler = async (req, res) => {
  await withTransaction(async (client) => {
    const appt = await getAppointmentById(client, req.params.appointmentId);

    if (!appt) {
      throw new AppError("Appointment not found.", 404);
    }

    const context = await getPatientRiskContext(client, appt.patient_id);
    if (req.user.role === "doctor" && context.doctor_id !== req.user.sub) {
      throw new AppError("You do not have access to this appointment.", 403);
    }

    await deleteAppointment(client, req.params.appointmentId);

    await syncPatientAlerts(client, context);

    await createActivityLog(client, {
      userId: req.user.sub,
      action: "appointment_deleted",
      entityType: "appointment",
      entityId: req.params.appointmentId,
      details: { patientId: appt.patient_id },
    });
  });

  res.json({ message: "Appointment deleted successfully." });
};

export const getPatientAppointmentsHandler = async (req, res) => {
  const appointments = await withTransaction(async (client) => {
    const context = await getPatientRiskContext(client, req.params.patientId);

    if (!context) {
      throw new AppError("Patient not found.", 404);
    }

    if (req.user.role === "doctor" && context.doctor_id !== req.user.sub) {
      throw new AppError("You do not have access to this patient.", 403);
    }

    return await getPatientAppointments(client, req.params.patientId);
  });

  res.json(appointments);
};
