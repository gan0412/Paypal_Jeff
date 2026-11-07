import { mockApi } from './mock';
import type { AgentTurn, Choice, DecisionResult, Payment, StartResponse } from './types';

// VITE_USE_MOCK=true (default in dev) -> built-in mock. Set to "false" to call the real backend.
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';
const BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? '';

async function call<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Can't reach the server right now. Please try again.");
  }
  if (!res.ok) {
    let detail = 'Something went wrong. Please try again.';
    try {
      const j = await res.json();
      if (typeof j.detail === 'string') detail = j.detail;
    } catch { /* keep default */ }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

const realApi = {
  startSession: (payment: Payment) => call<StartResponse>('/session/start', { payment }),
  sendMessage: (id: string, text: string) => call<AgentTurn>(`/session/${id}/message`, { text }),
  decide: (id: string, choice: Choice) => call<DecisionResult>(`/session/${id}/decision`, { choice }),
};

export const api = USE_MOCK ? mockApi : realApi;
export const usingMock = USE_MOCK;
