# API contract (frontend <-> backend)

The frontend talks to the backend only through these three calls. Until the backend exists, the frontend
uses a built-in mock that follows this exact shape, so both sides can build in parallel.

All JSON uses **snake_case**. Base path: `/api`. Backend suggestion: FastAPI on port 8000
(the Vite dev server proxies `/api` to `http://localhost:8000`).

## Shared shapes

```jsonc
// Payment (what the user is about to send)
{ "amount": 2400.0, "currency": "USD",
  "recipient_name": "Daniel Reyes", "recipient_email": "daniel.r@example.com",
  "recipient_is_new": true, "note": "for your flight, love you" }

// Risk (the engine's current view; the frontend only displays it)
{ "score": 0-100, "level": "low" | "elevated" | "high",
  "signals": [ { "code": "new_recipient", "label": "First payment to this person", "detail": "optional" } ] }
// level guide: score < 35 low, < 65 elevated, otherwise high

// AgentTurn (what Jeff says next)
{ "message": "text shown in the chat",
  "mood": "calm" | "listening" | "thinking" | "concerned" | "relieved",
  "risk": Risk,
  "quick_replies": ["optional", "suggested answers"],
  "recommended": "continue" | "protected" | "cancel" | null,
  "done": false }   // true when Jeff has nothing more to ask
```

## 1. Start a session

`POST /api/session/start`  body: `{ "payment": Payment }`

Response: `AgentTurn` plus `"session_id": "abc123"`.
Called when the user presses Send. The payment must be **held** (not sent) until step 3.

## 2. Send a chat message

`POST /api/session/{session_id}/message`  body: `{ "text": "We met online" }`

Response: `AgentTurn`.

## 3. User's decision

`POST /api/session/{session_id}/decision`  body: `{ "choice": "continue" | "protected" | "cancel" }`

Response:
```json
{ "status": "sent" | "protected" | "cancelled",
  "message": "text shown to the user",
  "order_id": "optional, for protected",
  "approve_url": "optional, PayPal sandbox approval link" }
```

## Rules both sides keep (product principles)

1. **Jeff is always labeled as an AI** in the UI and in his first message. Never pose as a human.
2. **Jeff can advise, never block or approve.** Only the user's decision call moves money.
3. **Tone stays calm.** `mood` never goes beyond `concerned`; no alarm language.
4. **Errors:** non-2xx responses return `{ "detail": "human-readable message" }`. The UI shows it and lets the user retry.
5. Privacy: nothing about the payment is sent to anyone other than the user.
