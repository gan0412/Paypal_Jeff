# 🛡️ Jeff — The Conversational Anti-Scam Guardian for PayPal

> **Mantra:** *"When the scammers attack, Jeff has your back."*  
> **Domain:** Authorized Push Payment (APP) Fraud Prevention & Conversational De-escalation  
> **PayPal AI Hackathon 2026**

---

## 💡 Product Overview (For Judges)

### The Problem: Why Static Warning Banners Fail
In modern **Authorized Push Payment (APP)**, one of the biggest threats is psychological manipulation and social engineering. Scammers emotionally manipulate victims through manufactured urgency, fake family emergencies, romance pretexts, and fake charities into authorizing transactions themselves.

Victims in high-stress emotional states experience **cognitive tunnel vision**: they view static caution banners and generic warning popups as annoying friction and reflexively click past them.

### The Solution: "Jeff"
**Jeff** is an empathetic, humanlike AI security companion built directly into the PayPal checkout experience. Instead of acting as an inflexible blocking mechanism, Jeff acts as a calm, trusted second look:

1. **Real-Time Contextual Scanning:** Analyzes recipient history, transfer amount, payment memo, and transaction type (Friends & Family vs. Goods & Services) in real-time.
2. **Non-Intrusive Visual Alerting:** When high scam risk is detected, Jeff's corner avatar immediately flashes a prominent red alert sign (warning triangle + pulsing halo). Jeff never forcibly hijacks the screen or locks the user out.
3. **Conversational De-escalation:** Powered by **Claude 3.5 Haiku**, Jeff validates emotional stress, gently unpacks common scammer tactics (urgency, secrecy, lack of live video), and helps the user pause and think critically.
4. **Strict Respect for User Agency:** Jeff **advises only and never blocks payments**. If a user confirms familiarity (e.g., *"It's my dad"*, *"I verified them"*), Jeff immediately shifts to calm/neutral without arguing or lecturing. The user always holds the final decision.
5. **Meaningful PayPal Developer Integration:** Uses the official PayPal JavaScript SDK (`@paypal/react-paypal-js`) to render PayPal Smart Payment Buttons. When Jeff guides a user to safety, they can seamlessly switch from unprotected Friends & Family to protected Goods & Services with full PayPal buyer protection.

---

## 🎯 Core Principles

1. **Always Transparently Labeled as AI:** Jeff never impersonates a human, it only acts like a humanlike AI agent.
2. **Advises, Never Blocks:** Jeff provides intelligence and guidance; the sender always retains full authority over their money.
3. **Calm & Non-Judgmental:** Tone is supportive and conversational—no panic, accusatory interrogation, or alarmist friction.
4. **Zero Policy Leakage & PII Protection:** Automated guardrails scrub credit cards, SSNs, and OTPs, and never disclose internal fraud scoring logic to prevent scammers from reverse-engineering defenses.

---

## 🛠️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│             React + TypeScript Frontend (Vite)              │
│  - Send Money Form & Interactive Demo Scenarios             │
│  - Corner Animated Avatar (Neutral / Thinking / Concerned)   │
│  - Non-blocking PayPal Smart Buttons (@paypal/react-paypal-js)│
│  - Collapsible De-escalation Chat Widget                    │
└──────────────────────────────┬──────────────────────────────┘
                               │ (Proxied /api REST calls)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI Backend Service                  │
│  - Session State Manager (docs/API_CONTRACT.md)             │
│  - Security Guardrails (PII Scrubber + Policy Shield)       │
│  - Claude 3.5 Haiku Conversational Reasoner                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Teammate Quickstart Guide

To run the complete application locally, start both the **Backend** and the **Frontend** in two separate terminal windows.

---

### Step 1: Start the Backend (Terminal 1)

1. **Navigate to the backend directory and activate the virtual environment:**
   ```bash
   cd backend
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Configure environment variables:**
   Verify `backend/.env` exists (or copy from `.env.example`). Ensure your Anthropic API key is set:
   ```env
   ANTHROPIC_API_KEY=sk-ant-api03-...
   ANTHROPIC_MODEL=claude-haiku-5-5
   HOST=0.0.0.0
   PORT=8000
   ```

3. **Launch the server:**
   ```bash
   python run.py
   ```
   *(Or run directly: `PYTHONPATH=. uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload`)*

   The backend will start at: **`http://127.0.0.1:8000`**  
   Interactive API docs (Swagger): **`http://127.0.0.1:8000/docs`**

---

### Step 2: Start the Frontend (Terminal 2)

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Select Node >= 20.12 (Node 23 / 24 recommended for Vite 8):**
   ```bash
   nvm use
   ```
   *(If not using NVM, use Homebrew Node 24: `PATH="/opt/homebrew/bin:$PATH"`)*

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Verify backend connection setting:**
   In [`frontend/.env.development`](frontend/.env.development):
   ```ini
   VITE_USE_MOCK=false
   ```
   *(Vite automatically proxies `/api` calls to `http://localhost:8000`)*

5. **Start the development server:**
   ```bash
   npm run dev
   ```

6. **Open in browser:**  
   Navigate to **`http://localhost:5173`**

---

## 🧪 Demo Scenarios (One-Click Testing)

At the top of the Send Money screen, you can click presets to instantly test Jeff's behavior:

| Preset Scenario | Details | Risk Level | Expected Jeff Behavior |
| :--- | :--- | :---: | :--- |
| **Romance Scam** | $2,400 to new recipient "Daniel Reyes" with note *"for your flight, love you"* (Friends & Family) | **HIGH** | Avatar flashes red alert sign; Jeff gently unpacks travel scam patterns and asks if you've met on live video. |
| **Fake Charity** | $120 to "Global Relief Foundation" with note *"urgent medical donation"* | **HIGH** | Avatar flashes red alert sign; Jeff encourages verifying charity registry credentials before sending. |
| **Routine Rent** | $850 to known roommate "Priya Sharma" with note *"November rent"* | **LOW** | Avatar stays calm/neutral; Jeff recognizes recurring history and lets transaction flow smoothly. |

---

## 🚦 Testing & Verification

- **Backend Test Suite (20 tests verifying guardrails, sessions, and agency):**
  ```bash
  PYTHONPATH=backend backend/.venv/bin/pytest backend/tests/ -v
  ```

- **Frontend TypeScript Build & Packaging:**
  ```bash
  cd frontend
  npm run build
  ```
