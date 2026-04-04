import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";

type ChatResponse = {
  answer: string;
  data?: Record<string, any> | null;
  intent?: string | null;
  confidence?: number | null;
};

type RecommendationItem = {
  text: string;
  confidence?: number | null;
  explanation?: string | null;
};

export default function AskMedflowPanel() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<ChatResponse | null>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadSummary() {
    setLoading(true);
    setError("");
    try {
      const [insightsRes, recsRes] = await Promise.all([
        apiFetch("/ai/insights"),
        apiFetch("/ai/recommendations"),
      ]);
      setInsights((insightsRes as { insights: string[] })?.insights ?? []);
      setRecommendations(
        (recsRes as { recommendations: RecommendationItem[] })?.recommendations ?? []
      );
    } catch (e: any) {
      setError(e?.message || "Failed to load AI summaries.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSummary();
  }, []);

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!message.trim()) return;
    try {
      const res = (await apiFetch("/ai/chat", {
        method: "POST",
        body: JSON.stringify({ message: message.trim() }),
      })) as ChatResponse;
      setChat(res);
    } catch (e: any) {
      setError(e?.message || "Failed to contact AI service.");
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-sky-900/40">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">Ask Medflow</h2>
        <button
          type="button"
          onClick={loadSummary}
          className="rounded-xl border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-sky-800"
        >
          Refresh Insights
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleAsk} className="mt-4 flex flex-col gap-3 md:flex-row">
        <input
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-sky-950"
          placeholder="Ask: What is the readmission rate?"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button
          type="submit"
          className="rounded-xl bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800"
        >
          Ask
        </button>
      </form>

      {chat && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-sky-950/40 dark:text-slate-200">
          <p className="font-semibold">Answer</p>
          <div className="mt-1 max-h-48 overflow-auto whitespace-pre">
            {chat.answer}
          </div>
          {chat.intent && (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Intent: {chat.intent} {chat.confidence ? `(${chat.confidence.toFixed(2)})` : ""}
            </p>
          )}
        </div>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-sky-950/30">
          <p className="font-semibold">Insights</p>
          {loading && <p className="mt-2 text-slate-500">Loading...</p>}
          {!loading && insights.length === 0 && <p className="mt-2 text-slate-500">No insights yet.</p>}
          <div className="mt-2 max-h-48 overflow-auto whitespace-pre">
            <ul className="list-disc pl-5 text-slate-700 dark:text-slate-200">
              {insights.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-sky-950/30">
          <p className="font-semibold">Recommendations</p>
          {loading && <p className="mt-2 text-slate-500">Loading...</p>}
          {!loading && recommendations.length === 0 && (
            <p className="mt-2 text-slate-500">No recommendations yet.</p>
          )}
          <div className="mt-2 max-h-48 overflow-auto whitespace-pre">
            <ul className="space-y-2 text-slate-700 dark:text-slate-200">
              {recommendations.map((rec, idx) => (
                <li
                  key={idx}
                  className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700"
                >
                  <p>{rec.text}</p>
                  {rec.explanation && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{rec.explanation}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
