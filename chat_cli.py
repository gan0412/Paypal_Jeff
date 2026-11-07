#!/usr/bin/env python3
"""Root CLI shortcut to chat directly with Jeff."""

import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from chat_cli import main

if __name__ == "__main__":
    main()
