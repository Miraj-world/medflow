import { ensureAlert, resolveAlertType } from "../models/alertModel.js";
import { buildAiSummary } from "./aiSummary.js";

export const syncPatientAlerts = async (client, patientContext) => {
  const summary = buildAiSummary({
    conditions: patientContext.conditions,
    missedAppointments: patientContext.missed_count,
  });

  const cardiovascularMessage =
    "High cardiovascular risk detected from combined diabetes and hypertension history.";
  const noShowMessage = "High no-show risk detected from repeated missed appointments.";

  if (summary.findings.includes("high cardiovascular risk")) {
    await ensureAlert(client, {
      patientId: patientContext.id,
      type: "high-cardiovascular-risk",
      message: cardiovascularMessage,
    });
  } else {
    await resolveAlertType(client, {
      patientId: patientContext.id,
      type: "high-cardiovascular-risk",
    });
  }

  if (summary.findings.includes("high no-show risk")) {
    await ensureAlert(client, {
      patientId: patientContext.id,
      type: "high-no-show-risk",
      message: noShowMessage,
    });
  } else {
    await resolveAlertType(client, {
      patientId: patientContext.id,
      type: "high-no-show-risk",
    });
  }

  return summary;
};
