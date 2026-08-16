#!/usr/bin/env python3
"""Regenerate the V3DANT-lab visual identity WebP panels."""

from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parent
script = ROOT / "visual_identity.py"
result = subprocess.run([sys.executable, str(script)], cwd=ROOT, check=False)
raise SystemExit(result.returncode)
