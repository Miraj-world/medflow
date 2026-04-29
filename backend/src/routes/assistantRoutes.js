import express from "express";
import jwt from "jsonwebtoken";

import { env } from "../config/env.js";
import { withTransaction } from "../config/database.js";
import { createActivityLog } from "../models/activityLogModel.js";
import { getHighRiskPatients, getOverviewAnalytics } from "../models/analyticsModel.js";
import { createAppointment, getPatientAppointments } from "../models/appointmentModel.js";
import { listAlerts } from "../models/alertModel.js";
import { getPatientRiskContext, listPatients } from "../models/patientModel.js";
import { listDoctors } from "../models/userModel.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

const parseAuthUser = (req) => {
  const authHeader = req.headers.authorization ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) {
    return null;
  }

  try {
    return jwt.verify(token, env.jwtSecret);
  } catch {
    return null;
  }
};

const normalize = (value) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const extractSearchQuery = (message) => {
  const text = String(message ?? "");
  const patterns = [
    /(?:find|search|look up|show|list)\s+(?:for\s+)?patients?\b\s*(?:named\s+|called\s+)?(.+)$/i,
    /patients?\b\s*(?:named|called)\s+(.+)$/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return "";
};

const extractAppointmentIntent = (message) => {
  const text = String(message ?? "").trim();
  const pattern =
    /(?:schedule|book|create)\s+(?:an?\s+)?appointment(?:\s+for)?\s+(.+?)\s+(?:on|at)\s+(.+?)(?:\s+for\s+(.+))?$/i;
  const match = text.match(pattern);

  if (!match) {
    return null;
  }

  return {
    patientQuery: match[1]?.trim() ?? "",
    dateText: match[2]?.trim() ?? "",
    reason: match[3]?.trim() ?? "Assistant-scheduled follow-up",
  };
};

const findBestPatientMatches = async ({ client, user, query }) => {
  const patients = await listPatients(client, {
    search: query,
    role: user?.role ?? "admin",
    userId: user?.sub ?? "",
  });

  if (patients.length > 0) {
    return patients.slice(0, 5);
  }

  const tokens = normalize(query).split(" ").filter(Boolean);
  if (tokens.length < 2) {
    return [];
  }

  const broadMatches = await listPatients(client, {
    search: tokens[0],
    role: user?.role ?? "admin",
    userId: user?.sub ?? "",
  });

  const fullQuery = normalize(query);
  return broadMatches
    .filter((patient) => {
      const fullName = normalize(`${patient.first_name} ${patient.last_name}`);
      return fullName.includes(fullQuery);
    })
    .slice(0, 5);
};

const resolveProviderId = async ({ client, user, patientContext }) => {
  if (user?.role === "doctor") {
    return user.sub;
  }

  if (patientContext?.doctor_id) {
    return patientContext.doctor_id;
  }

  const doctors = await listDoctors(client);
  return doctors[0]?.id ?? null;
};

const parseFutureDate = (dateText) => {
  const parsed = new Date(dateText);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  if (parsed.getTime() <= Date.now()) {
    return null;
  }

  return parsed;
};

const createClinicalFallbackReply = ({ message, patientContext }) => {
  const safeMessage = String(message ?? "").trim();
  const lower = safeMessage.toLowerCase();

  if (patientContext) {
    const name = `${patientContext.first_name} ${patientContext.last_name}`.trim();
    const conditionList =
      patientContext.conditions?.length > 0
        ? patientContext.conditions.join(", ")
        : patientContext.primary_condition || "no chronic condition listed";
    const missed = Number(patientContext.missed_count ?? 0);
    const total = Number(patientContext.total_count ?? 0);
    const ratio = total > 0 ? Math.round((missed / total) * 100) : 0;

    return [
      `I could not reach the cloud AI model, so here is a database-grounded summary for ${name}.`,
      `Conditions on record: ${conditionList}.`,
      `Attendance profile: ${missed} missed out of ${total} observed completed/missed appointments (${ratio}% missed).`,
      "Suggested next step: confirm reminder channel and book near-term follow-up if adherence is declining.",
      "For diagnosis or treatment decisions, please confirm with a licensed clinician.",
    ].join(" ");
  }

  if (lower.includes("patient") || lower.includes("appointment") || lower.includes("risk")) {
    return "I could not reach the cloud AI model right now. I can still help with MedFlow workflow questions and database-backed patient risk details if you include a patient context.";
  }

  return "I could not reach the cloud AI model right now. Please try again in a moment. For urgent medical symptoms, seek professional care immediately.";
};

const buildSystemPrompt = ({ patientContext, workspaceContext }) => {
  let prompt = `You are the MedFlow clinical operations assistant.
Use only provided context and user prompt.
Be concise, factual, and safety-aware.
Never provide definitive diagnosis.
Always include a short clinical safety reminder when discussing symptoms or treatment.`;

  if (workspaceContext) {
    prompt += `\n\nDatabase workspace context:
- Total patients: ${workspaceContext.totalPatients}
- Active doctors: ${workspaceContext.activeDoctors}
- Missed appointments: ${workspaceContext.missedAppointments}
- Active alerts: ${workspaceContext.activeAlerts}
- Average consultation minutes: ${workspaceContext.avgConsultationMinutes}
- Top high-risk patients: ${workspaceContext.highRiskPatientNames || "none"}
- Recent alert headlines: ${workspaceContext.alertHeadlines || "none"}`;
  }

  if (patientContext) {
    const patientName = `${patientContext.first_name} ${patientContext.last_name}`.trim();
    prompt += `\n\nDatabase patient context:
- Name: ${patientName}
- Primary condition: ${patientContext.primary_condition}
- Conditions: ${patientContext.conditions?.join(", ") || "none"}
- Missed appointments: ${patientContext.missed_count}
- Completed appointments: ${patientContext.completed_count}
- Total observed appointments: ${patientContext.total_count}
- Active alerts: ${patientContext.active_alerts}`;
  }

  return prompt;
};

const callOpenAiAssistant = async ({ message, patientContext, workspaceContext }) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.openAiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: buildSystemPrompt({ patientContext, workspaceContext }) },
          { role: "user", content: message },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`OpenAI request failed with status ${response.status}: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim();
  } finally {
    clearTimeout(timeout);
  }
};

const buildWorkspaceContext = async ({ client, user }) => {
  if (!user) {
    return null;
  }

  const [analytics, highRiskPatients, alerts] = await Promise.all([
    getOverviewAnalytics(client, { role: user.role, userId: user.sub }),
    getHighRiskPatients(client, { role: user.role, userId: user.sub, limit: 3 }),
    listAlerts(client, { role: user.role, userId: user.sub, limit: 3 }),
  ]);

  return {
    totalPatients: Number(analytics.overview?.total_patients ?? 0),
    activeDoctors: Number(analytics.overview?.active_doctors ?? 0),
    missedAppointments: Number(analytics.overview?.missed_appointments ?? 0),
    activeAlerts: Number(analytics.overview?.active_alerts ?? 0),
    avgConsultationMinutes: Number(analytics.overview?.avg_consultation_minutes ?? 0).toFixed(1),
    highRiskPatientNames:
      highRiskPatients.map((patient) => `${patient.patientName} (${patient.primary_condition})`).join(", ") || "none",
    alertHeadlines: alerts.map((alert) => `${alert.type} for ${alert.patientName}`).join(", ") || "none",
  };
};

const handleDataQuestionIntent = async ({ client, user, message }) => {
  const normalizedMessage = normalize(message);
  const needsStats =
    /(how many|count|total|number of|stats|summary|overview)/i.test(normalizedMessage) ||
    /(patients|doctors|alerts|missed appointments|appointments)/i.test(normalizedMessage);

  if (!needsStats) {
    return null;
  }

  if (!user) {
    return {
      reply: "Please log in so I can answer with real seeded database statistics.",
      source: "assistant-data",
      action: "workspace-summary",
    };
  }

  const workspace = await buildWorkspaceContext({ client, user });
  if (!workspace) {
    return null;
  }

  if (/high risk patient|high risk/i.test(normalizedMessage)) {
    return {
      reply: `Top high-risk patients in your current scope: ${workspace.highRiskPatientNames}.`,
      source: "assistant-data",
      action: "workspace-summary",
      payload: workspace,
    };
  }

  if (/alert/i.test(normalizedMessage)) {
    return {
      reply: `There are ${workspace.activeAlerts} active alerts. Recent alert headlines: ${workspace.alertHeadlines}.`,
      source: "assistant-data",
      action: "workspace-summary",
      payload: workspace,
    };
  }

  if (/doctor/i.test(normalizedMessage) && /list|who|which|show/i.test(normalizedMessage)) {
    const doctors = await listDoctors(client);
    const names = doctors.slice(0, 8).map((doctor) => doctor.full_name).join(", ");
    return {
      reply: `Doctors in the system: ${names || "none found"}.`,
      source: "assistant-data",
      action: "workspace-summary",
      payload: workspace,
    };
  }

  return {
    reply: `Current seeded-data overview: ${workspace.totalPatients} patients, ${workspace.activeDoctors} active doctors, ${workspace.missedAppointments} missed appointments, ${workspace.activeAlerts} active alerts, and ${workspace.avgConsultationMinutes} average consultation minutes.`,
    source: "assistant-data",
    action: "workspace-summary",
    payload: workspace,
  };
};

const handlePatientSearchIntent = async ({ client, user, message }) => {
  const query = extractSearchQuery(message);
  if (!query) {
    return null;
  }

  if (!user) {
    return {
      reply: "Please log in so I can search patients in the database.",
      source: "assistant-action",
      action: "search-patients",
    };
  }

  const matches = await findBestPatientMatches({ client, user, query });
  if (matches.length === 0) {
    return {
      reply: `I could not find patients matching "${query}". Try part of first name, last name, or email.`,
      source: "assistant-action",
      action: "search-patients",
    };
  }

  const lines = matches.map(
    (patient) =>
      `- ${patient.first_name} ${patient.last_name} (id: ${patient.id}, condition: ${patient.primary_condition}, doctor: ${patient.doctor_name})`
  );

  return {
    reply: `I found ${matches.length} patient match(es):\n${lines.join("\n")}`,
    source: "assistant-action",
    action: "search-patients",
    payload: {
      results: matches.map((patient) => ({
        id: patient.id,
        fullName: `${patient.first_name} ${patient.last_name}`,
        primaryCondition: patient.primary_condition,
        doctorName: patient.doctor_name,
      })),
    },
  };
};

const handleScheduleAppointmentIntent = async ({ client, user, message }) => {
  const intent = extractAppointmentIntent(message);
  if (!intent) {
    return null;
  }

  if (!user) {
    return {
      reply: "Please log in so I can schedule appointments from the database.",
      source: "assistant-action",
      action: "schedule-appointment",
    };
  }

  if (!["doctor", "admin"].includes(user.role)) {
    return {
      reply: "Only doctor or admin accounts can schedule appointments.",
      source: "assistant-action",
      action: "schedule-appointment",
    };
  }

  const matches = await findBestPatientMatches({ client, user, query: intent.patientQuery });
  if (matches.length === 0) {
    return {
      reply: `I could not find a patient matching "${intent.patientQuery}" to schedule the appointment.`,
      source: "assistant-action",
      action: "schedule-appointment",
    };
  }

  let patient = matches[0];
  if (matches.length > 1) {
    const queryName = normalize(intent.patientQuery);
    const exactNameMatches = matches.filter(
      (item) => normalize(`${item.first_name} ${item.last_name}`) === queryName
    );

    if (exactNameMatches.length === 1) {
      patient = exactNameMatches[0];
    } else if (exactNameMatches.length > 1) {
      patient = exactNameMatches[0];
    } else {
      const shortList = matches
        .slice(0, 3)
        .map((item) => `${item.first_name} ${item.last_name} (${item.id})`)
        .join(", ");
      return {
        reply: `I found multiple patients for "${intent.patientQuery}". Please be more specific. Matches: ${shortList}`,
        source: "assistant-action",
        action: "schedule-appointment",
      };
    }
  }

  const appointmentDate = parseFutureDate(intent.dateText);
  if (!appointmentDate) {
    return {
      reply: `I could not parse a valid future date/time from "${intent.dateText}". Try like: schedule appointment for ${patient.first_name} ${patient.last_name} on 2026-05-20 2:30 PM for follow up.`,
      source: "assistant-action",
      action: "schedule-appointment",
    };
  }

  const patientContext = await getPatientRiskContext(client, patient.id);
  const providerId = await resolveProviderId({ client, user, patientContext });
  if (!providerId) {
    throw new AppError("No provider available to schedule this appointment.", 400);
  }

  const created = await createAppointment(client, {
    patientId: patient.id,
    providerId,
    appointmentDate: appointmentDate.toISOString(),
    reason: intent.reason,
    notes: "Scheduled by AI assistant",
    status: "scheduled",
  });

  await createActivityLog(client, {
    userId: user.sub,
    action: "assistant_scheduled_appointment",
    entityType: "appointment",
    entityId: created.id,
    details: {
      patientId: patient.id,
      appointmentDate: created.appointment_date,
      reason: created.reason,
    },
  });

  const updatedAppointments = await getPatientAppointments(client, patient.id);
  return {
    reply: `Appointment scheduled for ${patient.first_name} ${patient.last_name} on ${new Date(
      created.appointment_date
    ).toLocaleString()} for "${created.reason}".`,
    source: "assistant-action",
    action: "schedule-appointment",
    payload: {
      appointmentId: created.id,
      patientId: patient.id,
      appointmentCount: updatedAppointments.length,
    },
  };
};

router.post(
  "/chat",
  asyncHandler(async (req, res) => {
    const { message, context } = req.body;

    if (!message || !String(message).trim()) {
      throw new AppError("Message is required.", 400);
    }

    const user = parseAuthUser(req);

    const actionReply = await withTransaction(async (client) => {
      const normalizedMessage = normalize(message);
      if (/(find|search|look up|show|list).*(patient)/i.test(normalizedMessage)) {
        return handlePatientSearchIntent({ client, user, message });
      }

      if (/(schedule|book|create).*(appointment)/i.test(normalizedMessage)) {
        return handleScheduleAppointmentIntent({ client, user, message });
      }

      return null;
    });

    if (actionReply) {
      return res.json(actionReply);
    }

    const dataReply = await withTransaction((client) =>
      handleDataQuestionIntent({ client, user, message })
    );
    if (dataReply) {
      return res.json(dataReply);
    }

    let patientContext = null;
    const contextPatientId = context?.patientId ?? context?.patient?.id ?? null;

    if (contextPatientId) {
      patientContext = await withTransaction((client) =>
        getPatientRiskContext(client, contextPatientId)
      );
    }

    if (!patientContext && context?.patient) {
      patientContext = {
        first_name: context.patient.fullName ?? "Patient",
        last_name: "",
        primary_condition: context.patient.primaryCondition ?? "unknown",
        conditions: context.patient.conditions ?? [],
        missed_count: context.patient.missedAppointments ?? 0,
        completed_count: context.patient.completedAppointments ?? 0,
        total_count: context.patient.totalAppointments ?? 0,
        active_alerts: context.patient.activeAlerts ?? 0,
      };
    }

    const workspaceContext = await withTransaction((client) =>
      buildWorkspaceContext({ client, user })
    );

    if (!env.openAiApiKey) {
      return res.json({
        reply: createClinicalFallbackReply({ message, patientContext }),
        source: "local-fallback",
      });
    }

    try {
      const reply = await callOpenAiAssistant({
        message,
        patientContext,
        workspaceContext,
      });
      if (!reply) {
        throw new Error("Empty response from assistant model.");
      }

      return res.json({ reply, source: "openai" });
    } catch (error) {
      console.error("Assistant model fallback triggered:", error);
      return res.json({
        reply: createClinicalFallbackReply({ message, patientContext }),
        source: "local-fallback",
      });
    }
  })
);

export default router;
