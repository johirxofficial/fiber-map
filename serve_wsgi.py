#!/usr/bin/env python
"""Waitress production server entry point used by run.py and systemd.

Waitress is pure Python, works on Linux and Windows, and does not require a
separate web server for a small deployment.  Put Nginx/Apache in front when you
need HTTPS or a public domain.
"""
import argparse
import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "fibermap.settings")


def main():
    parser = argparse.ArgumentParser(description="Serve fiber-map with Waitress.")
    parser.add_argument("--host", default="0.0.0.0", help="Bind address")
    parser.add_argument("--port", type=int, default=5003, help="TCP port")
    parser.add_argument("--threads", type=int, default=8, help="Worker threads")
    parser.add_argument(
        "--trusted-proxy",
        default=os.environ.get("TRUSTED_PROXY", ""),
        help="Proxy IP allowed to set X-Forwarded-* headers (usually 127.0.0.1)",
    )
    args = parser.parse_args()

    from waitress import serve

    from fibermap.wsgi import application

    trusted_proxy = (args.trusted_proxy or "").strip() or None
    options = {
        "host": args.host,
        "port": args.port,
        "threads": max(1, args.threads),
        "channel_timeout": 120,
        "clear_untrusted_proxy_headers": True,
        "ident": "fiber-map",
    }
    if trusted_proxy:
        options["trusted_proxy"] = trusted_proxy
        options["trusted_proxy_headers"] = {
            "x-forwarded-for",
            "x-forwarded-proto",
            "x-forwarded-host",
        }
    serve(application, **options)


if __name__ == "__main__":
    main()
