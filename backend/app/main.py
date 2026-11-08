import sys
from pathlib import Path

# Automatically inject backend and app directories into sys.path
_app_dir = Path(__file__).resolve().parent
_backend_dir = _app_dir.parent
for _p in [str(_backend_dir), str(_app_dir)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

try:
    from app import __version__
    from app.config import settings
    from app.jeff_core import (
        generate_chat_response,
        generate_evaluation,
        generate_session_message,
        generate_session_start,
        handle_session_decision,
    )
    from app.models import (
        AgentTurnPayload,
        ChatRequest,
        ChatResponse,
        DecisionRequest,
        DecisionResponse,
        EvaluateRequest,
        EvaluateResponse,
        HealthResponse,
        SendMessageRequest,
        StartSessionRequest,
        StartSessionResponse,
    )
except (ImportError, ModuleNotFoundError):
    try:
        from . import __version__
        from .config import settings
        from .jeff_core import (
            generate_chat_response,
            generate_evaluation,
            generate_session_message,
            generate_session_start,
            handle_session_decision,
        )
        from .models import (
            AgentTurnPayload,
            ChatRequest,
            ChatResponse,
            DecisionRequest,
            DecisionResponse,
            EvaluateRequest,
            EvaluateResponse,
            HealthResponse,
            SendMessageRequest,
            StartSessionRequest,
            StartSessionResponse,
        )
    except (ImportError, ValueError):
        __version__ = "0.1.0"
        import config as _config_mod
        settings = _config_mod.settings
        from jeff_core import (
            generate_chat_response,
            generate_evaluation,
            generate_session_message,
            generate_session_start,
            handle_session_decision,
        )
        from models import (
            AgentTurnPayload,
            ChatRequest,
            ChatResponse,
            DecisionRequest,
            DecisionResponse,
            EvaluateRequest,
            EvaluateResponse,
            HealthResponse,
            SendMessageRequest,
            StartSessionRequest,
            StartSessionResponse,
        )

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("jeff_main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle events."""
    has_key = bool(settings.anthropic_api_key and settings.anthropic_api_key != "your_anthropic_api_key_here")
    logger.info(
        f"Starting Jeff Anti-Scam Guardian Backend v{__version__} | "
        f"Model: {settings.anthropic_model} | API Key Set: {has_key}"
    )
    yield
    logger.info("Shutting down Jeff Anti-Scam Guardian Backend")


app = FastAPI(
    title="Jeff - PayPal Anti-Scam Conversational Guardian API",
    description="Backend API powering Jeff, the conversational AI agent protecting users from Authorized Push Payment (APP) scams.",
    version=__version__,
    lifespan=lifespan,
)

# Configure CORS
origins = settings.get_cors_origins_list()
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True if origins != ["*"] else False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check and configuration status",
)
async def health_check():
    """Verify backend health, configured Anthropic model, and API key availability."""
    has_key = bool(
        settings.anthropic_api_key
        and settings.anthropic_api_key.strip() not in ("", "your_anthropic_api_key_here")
    )
    return HealthResponse(
        status="ok",
        model=settings.anthropic_model,
        has_api_key=has_key,
        version=__version__,
    )


@app.post(
    "/api/chat",
    response_model=ChatResponse,
    summary="Interactive conversation with Jeff",
)
async def chat_with_jeff(request: ChatRequest):
    """Engage in humanlike conversational de-escalation with Jeff.

    Processes user message, past dialog history, and active transaction context.
    Returns Jeff's reply, avatar emotion state, scam risk level, and suggested actions.
    """
    return await generate_chat_response(
        user_message=request.message,
        history=request.history,
        transaction=request.transaction,
    )


@app.post(
    "/api/evaluate",
    response_model=EvaluateResponse,
    summary="Real-time transaction risk evaluation",
)
async def evaluate_transaction(request: EvaluateRequest):
    """Proactively evaluates payment draft details (memo, amount, recipient).

    Determines if corner avatar should switch to 'concerned' state and present
    a gentle proactive warning badge before the user authorizes payment.
    """
    return await generate_evaluation(transaction=request.transaction)


# ============================================================================
# Session API (Frontend Contract: docs/API_CONTRACT.md)
# ============================================================================


@app.post(
    "/api/session/start",
    response_model=StartSessionResponse,
    summary="Start an interactive payment review session",
)
async def start_session(request: StartSessionRequest):
    """Initiates a payment review session. Analyzes payment risk and returns Jeff's opening turn."""
    return await generate_session_start(request.payment)


@app.post(
    "/api/session/{session_id}/message",
    response_model=AgentTurnPayload,
    summary="Send a message in an active session",
)
async def send_session_message(session_id: str, request: SendMessageRequest):
    """Processes user response in the review dialog with Claude Haiku."""
    return await generate_session_message(session_id=session_id, text=request.text)


@app.post(
    "/api/session/{session_id}/decision",
    response_model=DecisionResponse,
    summary="Record user decision (continue, protected, or cancel)",
)
async def decide_session(session_id: str, request: DecisionRequest):
    """Finalizes transaction choice: continue as is, convert to protected, or cancel."""
    return handle_session_decision(session_id=session_id, choice=request.choice, order_id=request.order_id)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=settings.host,
        port=settings.port,
    )
