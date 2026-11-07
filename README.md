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
Romance scam, fake charity, and a normal rent payment (so Jeff isn't just scaring everyone).

## Honest notes
Sample people and amounts only. Mock replies are scripted. No claim is made about reducing real fraud.
