from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware          
from fastapi.responses import JSONResponse

try:
    from . import __version__
    from .config import settings
    from .jeff_core import generate_chat_response, generate_evaluation
    from .models import (
        ChatRequest,
        ChatResponse,
        EvaluateRequest,
        EvaluateResponse,
        HealthResponse,
    )
except ImportError:
    from app import __version__
    from app.config import settings
    from app.jeff_core import generate_chat_response, generate_evaluation
    from app.models import (
        ChatRequest,
        ChatResponse,
        EvaluateRequest,
        EvaluateResponse,
        HealthResponse,
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
