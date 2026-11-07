"""Jeff Anti-Scam Guardian Backend Root Package."""

import sys
from pathlib import Path

# Add backend directory to sys.path so 'import app' always works
_backend_dir = Path(__file__).resolve().parent
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))
