#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys

from bootstrap_venv import ensure_project_venv


def main():
    """Run administrative tasks."""
    # Make ``python3 manage.py ...`` work even when the user forgot to
    # activate .venv.  If .venv does not exist, keep the normal Django error.
    ensure_project_venv("django")
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fibermap.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment? Use "
            ".venv/bin/python manage.py ... (Linux/macOS) or "
            ".venv\\Scripts\\python.exe manage.py ... (Windows)."
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
