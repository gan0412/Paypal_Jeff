# Jeff Backend (PayPal Anti-Scam Guardian API)

The backend service for **Jeff**, an empathetic conversational AI agent powered by **Claude 3.5 Haiku** (`claude-3-5-haiku-latest` / `claude-3-5-haiku-20241022`). Jeff helps everyday PayPal users identify Authorized Push Payment (APP) scams through humanlike conversational de-escalation and real-time transaction risk evaluation.

---

## Architecture & Features

- **FastAPI + Async Python 3.10+**: Ultra-fast asynchronous REST API.
- **Claude 3.5 Haiku**: Low-latency, cost-effective reasoning using structured Tool Use.
- **5-Step De-escalation Framework**:
  1. Empathy & emotional validation
  2. Cognitive grounding & pacing
  3. Socratic non-accusatory inquiry
  4. Transparent red-flag unpacking
  5. Empowered, dignified exit
- **Dynamic Corner Avatar Support**: Outputs face emotion states (`neutral`, `thinking`, `concerned`, `relieved`) for the frontend corner widget.
- **Zero-Leakage Guardrails**: Prevents internal fraud detection heuristics from leaking to potential scammers.
- **PII Scrubbing**: Automatically scrubs credit cards, SSNs, OTP codes, and passwords.

---

## Quickstart

### 1. Set Up Environment

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Configure API Key

Copy `.env.example` to `.env` and set your Anthropic API key:

```bash
cp .env.example .env
```

Edit `.env`:
```env
ANTHROPIC_API_KEY=sk-ant-api03-...
ANTHROPIC_MODEL=claude-3-5-haiku-latest
```

### 3. Start the Server

```bash
python run.py
```
Or with Uvicorn directly:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`.  
Interactive Swagger docs: `http://localhost:8000/docs`.

---

## API Endpoints

### 1. Health Check
`GET /health`

**Response:**
```json
{
  "status": "ok",
  "model": "claude-3-5-haiku-latest",
  "has_api_key": true,
  "version": "0.1.0"
}
```

---

### 2. Interactive Chat with Jeff
`POST /api/chat`

**Request:**
```json
{
  "message": "My friend texted me they are stranded at the hospital and need $500 right now.",
  "history": [],
  "transaction": {
    "recipient": "emergency_help@example.com",
    "amount": 500.0,
    "currency": "USD",
    "memo": "URGENT HOSPITAL BILL"
  }
}
```

**Response:**
```json
{
  "reply": "I completely understand how alarming that sounds—emergencies with friends are really stressful. Before hitting send, can we take 30 seconds? Have you called your friend directly on their regular phone number to confirm it's actually them texting?",
  "emotion": "concerned",
  "risk_level": "high",
  "suggested_actions": [
    "Call friend on known phone",
    "Why is this fishy?",
    "Cancel transaction"
  ]
}
```

---

### 3. Background Transaction Risk Evaluation
`POST /api/evaluate`

Called in the background when the user drafts or updates a payment note.

**Request:**
```json
{
  "transaction": {
    "recipient": "stranger@example.com",
    "amount": 250.0,
    "currency": "USD",
    "memo": "URGENT MEDICAL EMERGENCY - SEND IMMEDIATELY"
  }
}
```

**Response:**
```json
{
  "risk_level": "high",
  "avatar_emotion": "concerned",
  "should_alert": true,
  "proactive_prompt": "Hey! Before you hit send, can we talk for 30 seconds? This memo has a couple of telltale warning signs."
}
```

---

## Running Tests

All unit tests and guardrail verifications are executed via `pytest`:

```bash
pytest -c pytest.ini -v
```
