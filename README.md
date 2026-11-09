# Jeff: a calm second look before you send money

PayPal AI Hackathon 2026 project. Many scams are *authorized push payments*: the victim is persuaded
(romance, fake charity, fake friend) and clicks past every warning. Banners get ignored when someone is
being coached. Jeff is an **AI assistant** that holds a risky payment and has a short, gentle conversation
with the sender before it goes out. The sender always makes the final decision.

## Principles
1. Jeff is **always labeled as an AI**. It never pretends to be human.
2. Jeff **advises only**. It cannot block or approve a payment.
3. Calm tone and mild expressions. No alarm.
4. No third party is told about the payment (privacy).

## Repo layout
- `frontend/`: React + Vite + TypeScript UI. Runs with a built-in mock Jeff, so no backend is needed.
- `docs/API_CONTRACT.md`: the three API calls between frontend and backend. **Backend: build to this.**
- `backend/`: (teammates) agent + risk engine + PayPal sandbox calls.

## Run the frontend
```bash
cd frontend
npm install
npm run dev        # http://localhost:5173, uses the mock by default
```
To use the real backend, set `VITE_USE_MOCK=false` in `frontend/.env.development` and run the backend on port 8000
(the dev server proxies `/api` to it).

## Demo scenarios (one click each)
Six one-click scenarios on the Send money screen:
- **Romance scam** and **Fake charity**: classic authorized push payments.
- **Coached**: the sender's story doesn't match the account, or someone told them what to say.
- **Won't listen**: the sender is sure an investment is safe and gets defensive. Jeff steps back, stays kind, asks for a 24 hour pause.
- **Worried for Ray**: the sender is trying to protect a relative who is being scammed. Jeff suggests cancelling.
- **Normal payment**: rent to a known person, so Jeff isn't just scaring everyone.

Jeff never accuses anyone and never claims to detect lies. Answers are compared with facts visible on the account.

## When does Jeff appear?
Before any chat, `POST /api/precheck` rates the payment. Small ordinary payments (for example $40 to a known person)
go straight through and Jeff stays out of the way. Moderate ones hold the payment and Jeff opens quietly. Large first
payments or scam-like wording hold it and dim the screen. Try changing the amount on any scenario to see the tiers.

## Notes for the backend
- Free-text replies already go to `POST /api/session/{id}/message`. The mock only matches keywords and falls back to
  gentle open questions; a real model should handle any answer using the same response shape.
- The "worried about someone else" case currently runs inside a payment. A chat not tied to a payment would need a new
  endpoint, so let the frontend know before building it.

## Honest notes
Sample people and amounts only. Mock replies are scripted. No claim is made about reducing real fraud.
