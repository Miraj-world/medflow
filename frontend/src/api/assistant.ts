import { fetchJson } from "./client";

type AssistantContext = {
  patientId?: string;
  patient?: {
    id?: string;
    fullName?: string;
    primaryCondition?: string;
    conditions?: string[];
    missedAppointments?: number;
    completedAppointments?: number;
    totalAppointments?: number;
    activeAlerts?: number;
  };
};

interface AssistantResponse {
  reply: string;
  source?: "openai" | "local-fallback";
}

export async function getAssistantReplyFromApi(
  message: string,
  context?: AssistantContext
): Promise<string> {
  try {
    const response = await fetchJson<AssistantResponse>("/assistant/chat", {
      method: "POST",
      body: JSON.stringify({ message, context }),
    });
    return response.reply;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Assistant request failed.";
    return `Assistant is temporarily unavailable: ${errorMessage}`;
  }
}
