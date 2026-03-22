import { apiCall, API_URL, readApiErrorMessage } from "./client";
import { supabase } from "@/integrations/supabase/client";

export interface AnalyzeResult {
  intent_type: string;
  ticker: string | null;
  metric: string | null;
  timeframe: string | null;
  confidence: number;
  answer: string;
  source: string;
  citation: string | null;
  confidence_level: "HIGH" | "MEDIUM" | "LOW";
  /** Research path: pipeline validation warnings. */
  validation?: { ok: boolean; warnings: string[] };
}

export async function analyzeQuery(
  text: string,
  sessionContext: { ticker: string | null; timeframe: string | null }
): Promise<AnalyzeResult> {
  return apiCall<AnalyzeResult>("/api/v1/query/analyze", {
    method: "POST",
    body: JSON.stringify({ text, session_context: sessionContext }),
  });
}

export interface TranscribeResult {
  transcript: string;
  confidence: number;
  error?: string;
}

export async function transcribeAudio(audioBlob: Blob): Promise<TranscribeResult> {
  if (!audioBlob || audioBlob.size < 32) {
    throw new Error("Recording too short or empty");
  }

  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.webm");

  const { data: { session } } = await supabase.auth.getSession();

  const response = await fetch(`${API_URL}/api/v1/voice/transcribe`, {
    method: "POST",
    headers: { Authorization: `Bearer ${session?.access_token}` },
    body: formData,
  });

  if (!response.ok) throw new Error(await readApiErrorMessage(response));
  const data = (await response.json()) as TranscribeResult;
  const t = (data.transcript || "").trim();
  if (!t) {
    throw new Error(data.error || "No speech recognized — check GROQ_API_KEY / ELEVENLABS_API_KEY on the backend");
  }
  return { ...data, transcript: t };
}
