#!/usr/bin/env python3
"""Runner script to launch the Jeff Anti-Scam backend server."""

import uvicorn
from app.config import settings

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.environment == "development",
    )
