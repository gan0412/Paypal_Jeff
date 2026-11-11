# Handoff: PayPal AI Hackathon — "Jeff" (APP Scam De-escalation Companion)

**Generated:** 2026-11-11  
**Repository:** `Paypal_Jeff` (`https://github.com/gan0412/Paypal_Jeff`)  
**Active Branch:** `feat/alert-on-next-and-threshold`  
**Open Pull Requests:**
- [PR #6](https://github.com/gan0412/Paypal_Jeff/pull/6) (`feat/stage-ui-integration` -> `main`)
- [PR #7](https://github.com/gan0412/Paypal_Jeff/pull/7) (`feat/alert-on-next-and-threshold` -> `main`)

---

## 1. Project Overview & Mission
- **Project Name:** Jeff
- **Mantra:** *"When the scammers attack, Jeff has your back."*
- **Domain:** Authorized Push Payment (APP) Fraud Prevention & Conversational De-escalation.
- **Problem:** Users experience cognitive tunnel vision under emotional stress and dismiss static fraud warnings. Jeff proactively alerts users in real-time, opens empathetic dialogue, unpacks scam red flags, and respects user agency when transactions are confirmed safe.

---

## 2. What Was Built & Implemented

### A. FastAPI Backend (`backend/`)
- **API Spec & Contract:** Conforms to [`docs/API_CONTRACT.md`](file:///Users/Ganes/Paypal_Jeff/docs/API_CONTRACT.md).
- **Core Endpoints:**
  - `POST /api/session/start`: Evaluates payment draft in real-time, extracts scam risk signals (urgency, unfamiliar recipient, high amount, romance/lottery/crypto patterns), initializes a conversation session, and generates an opening turn with Claude 3.5 Haiku.
  - `POST /api/session/{session_id}/message`: Handles conversational turns, empathetic de-escalation, PII scrubbing (credit cards, SSNs, OTPs), and zero policy leakage protection.
  - `POST /api/session/{session_id}/decision`: Resolves user choice (`continue`, `protected`, `cancel`).
  - `POST /api/evaluate` & `POST /api/chat`: Background transaction evaluator and fallback chat endpoint.
  - `GET /health`: Health status and model readiness (`claude-3-5-haiku-latest`).
- **Core Logic & Modules:**
  - [`backend/app/main.py`](file:///Users/Ganes/Paypal_Jeff/backend/app/main.py): FastAPI application router and session endpoints.
  - [`backend/app/jeff_core.py`](file:///Users/Ganes/Paypal_Jeff/backend/app/jeff_core.py): State management via `SessionStore`, conversation history, and Claude API invocation.
  - [`backend/app/prompts.py`](file:///Users/Ganes/Paypal_Jeff/backend/app/prompts.py): Persona system prompts, risk evaluation prompts, and de-escalation tone guidelines.
  - [`backend/app/guardrails.py`](file:///Users/Ganes/Paypal_Jeff/backend/app/guardrails.py): Automated regex PII scrubber and policy probe interceptor.
  - [`backend/app/models.py`](file:///Users/Ganes/Paypal_Jeff/backend/app/models.py): Pydantic models for transactions, sessions, decisions, and signals.
- **Test Suite:**
  - [`backend/tests/test_session_routes.py`](file:///Users/Ganes/Paypal_Jeff/backend/tests/test_session_routes.py): 20/20 pytest tests passing, verifying session creation, multi-turn chat, agency respect, policy shielding, and decision logging.

### B. React Frontend Integration (`frontend/`)
- **Stack:** React 19, TypeScript, Vite.
- **Wiring to Backend:**
  - Updated [`frontend/.env.development`](file:///Users/Ganes/Paypal_Jeff/frontend/.env.development) with `VITE_USE_MOCK=false` to use live backend (`http://localhost:8000`).
  - Added instant client-side heuristic risk evaluator ([`frontend/src/riskEvaluator.ts`](file:///Users/Ganes/Paypal_Jeff/frontend/src/riskEvaluator.ts)) for 0ms visual responsiveness.
- **UX & Proactive Alert Behavior:**
  - When user fills out a risky transaction and clicks "Next", Jeff's corner avatar immediately displays a glaring red alert badge (warning triangle with exclamation mark) and pulsing halo ring.
  - **No Auto-Open Friction:** The chat modal does NOT force open automatically upon clicking "Next". It displays the glaring visual alert and opens only when the user clicks the avatar/badge.
  - **UI & Docs Polish:** Removed mock caution banners, demo tags ("Connected to backend", "Sample data"), footer disclaimers, and the "New recipient (demo)" checkbox per user request. Comprehensive root [`README.md`](file:///Users/Ganes/Paypal_Jeff/README.md) added with judge overview and teammate quickstart.

### C. Git & Pull Request Status
- **PR #2 & PR #3:** Merged into `main`.
- **PR #5:** Merged into `main` (`6748f71`), adding the Inclusivity layer (avatar customization, 8 languages + RTL, TTS voice picker, and 2-stage red-alert animations).
- **PR #6:** Created for [`feat/stage-ui-integration` -> `main`](https://github.com/gan0412/Paypal_Jeff/pull/6) to adopt `Hero.tsx`, `ResultCard.tsx`, 6-scenario grid, and stage aesthetics.
- **PR #7:** Created for [`feat/alert-on-next-and-threshold` -> `main`](https://github.com/gan0412/Paypal_Jeff/pull/7):
  - Jeff remains calm on the Send/edit page and only raises the red alert badge/face on the Review step (after clicking **Next**).
  - Hardcoded < $100 auto-pass rule in backend and frontend risk evaluators (bypassing LLM calls for amounts under $100).
  - Fixed chat widget layering: elevated `.widget` to `z-index: 10000`, `.launcher` to `z-index: 9990`, and isolated `.paypal-btn-wrap` to `position: relative; z-index: 1` so the chatbox modal is always layered on top of PayPal button iframes.

---

## 3. Discussions & Key Takeaways

### A. Respecting User Agency
- If the user confirms familiarity with the recipient (e.g. "It's my dad", "I verified it"), Jeff must not argue, interrogate, or repeat warnings. Jeff shifts to neutral, remains supportive, and lets the user proceed.

### B. Meaningful PayPal Integration (Crucial Hackathon Requirement)
- **Status: COMPLETED (Official PayPal React SDK):**
  - Integrated `@paypal/react-paypal-js` into the React frontend.
  - Wrapped app in `<PayPalScriptProvider>` with sandbox configuration.
  - Implemented `<PayPalButtons>` in [`frontend/src/components/ReviewStep.tsx`](file:///Users/Ganes/Paypal_Jeff/frontend/src/components/ReviewStep.tsx).
  - **Non-blocking UX & User Agency:** Payments are never blocked by Jeff (`actions.resolve()`). High risk activates the glaring red alert badge on Jeff's avatar, empowering the user to either consult Jeff or proceed directly with PayPal Sandbox checkout.
  - Backend and frontend `decision` endpoints updated to store and display the authentic PayPal Order ID on completion.

---

## 4. Environment & How to Run

### Backend
```bash
# From repository root
PYTHONPATH=backend backend/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- Requires `ANTHROPIC_API_KEY` set in `backend/.env`.

### Frontend
```bash
cd frontend
nvm use          # switches to Node 23 from .nvmrc (supports styleText)
npm run dev
```
*(Or use Homebrew Node 24: `PATH="/opt/homebrew/bin:$PATH" npm run dev`)*
- Running at `http://localhost:5173`.
- Backend proxy configured in [`frontend/vite.config.ts`](file:///Users/Ganes/Paypal_Jeff/frontend/vite.config.ts) forwarding `/api` to `http://localhost:8000`.

### Running Tests
```bash
PYTHONPATH=backend backend/.venv/bin/pytest backend/tests/ -v
```

---

## 5. Next Session Focus & Recommended Action Items
1. **PayPal Developer Integration Completed:** `@paypal/react-paypal-js` is fully integrated with Sandbox support and non-blocking risk alerts.
2. **Review & Merge PR #2:** Check CI or team reviews on GitHub [PR #2](https://github.com/gan0412/Paypal_Jeff/pull/2).
3. **Protected Payment Flow:** Build out the escrow / fraud hold flow for transactions flagged as suspicious.

---

## 6. Suggested Skills
When starting the next session, the agent should consider using:
- **`handoff`**: For continuing session compaction and transferring state between iterations.
- **`agy-customizations`**: For managing Antigravity rules, plugins, and custom agent skills.
- **`chrome-devtools`**: For testing frontend UI responsiveness and verifying network calls between React and FastAPI.
