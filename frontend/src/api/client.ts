import { supabase } from "@/integrations/supabase/client";

const API_URL =
  import.meta.env.VITE_API_URL || "https://inflect-backend-symvnfqjla-uc.a.run.app";

const RATE_LIMIT_HINT =
  /rate\s*limit|too\s+many\s+requests|429|quota\s*(exceeded|reached)|capacity|throttl/i;

export const API_LIMIT_MESSAGE = "API limit hit. Please try again in a moment.";

/** Human-readable failure text; uses a clear message when the provider hit rate limits. */
export async function readApiErrorMessage(response: Response): Promise<string> {
  if (response.status === 429) {
    return API_LIMIT_MESSAGE;
  }

  let text = "";
  try {
    text = await response.text();
  } catch {
    return `API error: ${response.status}`;
  }

  if (RATE_LIMIT_HINT.test(text)) {
    return API_LIMIT_MESSAGE;
  }

  try {
    const j = JSON.parse(text) as { detail?: unknown; message?: string; error?: string };
    const raw = j.detail ?? j.message ?? j.error;
    const flat =
      typeof raw === "string"
        ? raw
        : Array.isArray(raw)
          ? raw
              .map((x) =>
                typeof x === "object" && x !== null && "msg" in x
                  ? String((x as { msg: string }).msg)
                  : ""
              )
              .filter(Boolean)
              .join(" ")
          : raw != null
            ? String(raw)
            : "";
    if (flat && RATE_LIMIT_HINT.test(flat)) {
      return API_LIMIT_MESSAGE;
    }
    if (flat) {
      return flat.length > 220 ? `${flat.slice(0, 220)}…` : flat;
    }
  } catch {
    /* not JSON */
  }

  if (text) {
    return text.length > 220 ? `${text.slice(0, 220)}…` : text;
  }
  return `API error: ${response.status}`;
}

async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response));
  }

  return response.json();
}

export { apiCall, API_URL };
