"""Re-run project commands with the local ``.venv`` Python when needed.

A beginner often runs ``python3 manage.py ...`` before activating the virtual
environment.  If Django (or Waitress) is only installed inside ``.venv``, this
helper silently re-executes the same command with the project interpreter.
It is a no-op when the current interpreter already has the packages.
"""
from __future__ import annotations

import importlib.util
import os
import sys
from pathlib import Path

_GUARD = "FIBERMAP_VENV_REEXEC"


def _has_modules(modules: tuple[str, ...]) -> bool:
    return all(importlib.util.find_spec(name) is not None for name in modules)


def ensure_project_venv(*modules: str) -> None:
    """Use ``.venv`` when the current interpreter cannot import *modules*."""
    if _has_modules(modules) or os.environ.get(_GUARD) == "1":
        return

    base = Path(__file__).resolve().parent
    candidates = (
        base / ".venv" / "Scripts" / "python.exe",
        base / ".venv" / "bin" / "python",
        base / "venv" / "Scripts" / "python.exe",
        base / "venv" / "bin" / "python",
    )
    current = Path(sys.executable).resolve()
    for candidate in candidates:
        if candidate.is_file() and candidate.resolve() != current:
            os.environ[_GUARD] = "1"
            os.execv(str(candidate), [str(candidate), *sys.argv])

    if modules:
        names = ", ".join(modules)
        print(f"[fiber-map] Missing Python package(s): {names}", file=sys.stderr)
        print(
            "[fiber-map] Create the environment and install dependencies:",
            file=sys.stderr,
        )
        print(
            "  python3 -m venv .venv && .venv/bin/python -m pip install -r requirements.txt",
            file=sys.stderr,
        )
