#!/usr/bin/env python
"""Portable supervisor/launcher for the fiber-map application.

The launcher:
* reads ``site_config.json`` (or ``SITE_CONFIG_FILE``);
* applies database migrations and queued setup work;
* starts Waitress in a child process;
* watches the configuration and restarts automatically when the web port or
  database settings change;
* restarts a crashed web process;
* prints the active URL and exits cleanly on Ctrl+C.

Systemd can therefore run this single command with ``Restart=always`` and the
application will come back automatically after a reboot or crash.

Examples::

    python run.py                     # configured port, production defaults
    python run.py --port 8080         # change and persist the port
    python run.py --debug             # local development (debug + finders)
    python run.py --host 127.0.0.1    # behind Nginx
"""
import argparse
import os
import subprocess
import sys
import time
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

from bootstrap_venv import ensure_project_venv  # noqa: E402

ensure_project_venv("django", "waitress")

from map.site_config import get_port, read_config, write_config  # noqa: E402


def build_env(config, debug=False):
    env = os.environ.copy()
    env.setdefault("DJANGO_SETTINGS_MODULE", "fibermap.settings")
    env["DJANGO_DEBUG"] = "1" if debug else os.environ.get("DJANGO_DEBUG", "0")

    env["DB_ENGINE"] = "mysql"
    # Environment variables are documented as the highest priority (useful for
    # Docker, Heroku and hosting panels).  Without them, site_config.json wins.
    env["DB_NAME"] = os.environ.get("DB_NAME") or str(config.get("db_name") or "fiber_map")
    env["DB_USER"] = os.environ.get("DB_USER") or str(config.get("db_user") or "root")
    env["DB_PASSWORD"] = (
        os.environ.get("DB_PASSWORD")
        if "DB_PASSWORD" in os.environ
        else str(config.get("db_password") or "")
    )
    env["DB_HOST"] = os.environ.get("DB_HOST") or str(config.get("db_host") or "127.0.0.1")
    env["DB_PORT"] = os.environ.get("DB_PORT") or str(config.get("db_port") or "3306")
    env["SITE_PORT"] = os.environ.get("SITE_PORT") or str(config.get("port") or 5003)
    return env


def manage(args, env, quiet=False):
    command = [sys.executable, str(BASE_DIR / "manage.py")] + args
    return subprocess.call(
        command,
        cwd=str(BASE_DIR),
        env=env,
        stdout=subprocess.DEVNULL if quiet else None,
    )


def prepare(config, env, debug=False, no_migrate=False):
    """Run migrations, pending SQL/bootstrap work and static collection."""
    if not no_migrate:
        print("Applying MySQL migrations...", flush=True)
        code = manage(["migrate", "--noinput"], env)
        if code != 0:
            print(
                "\n[!] MySQL migration failed.\n"
                "    Check that MySQL/MariaDB is running and that site_config.json\n"
                "    contains the correct database, user and password.",
                flush=True,
            )
            return code

    config = read_config()

    pending_sql = config.get("pending_sql")
    if pending_sql:
        print(f"Importing queued SQL file: {pending_sql}", flush=True)
        code = manage(["import_sql", pending_sql], env)
        if code != 0:
            print("SQL import failed. Fix the error above and restart.", flush=True)
            return code
        config = write_config({"pending_sql": None})

    if config.get("bootstrap"):
        print("Finishing first-run database setup...", flush=True)
        code = manage(["init_site"], env)
        if code != 0:
            print(
                "Could not finish setup bootstrap. The setup page will stay available.",
                flush=True,
            )
        config = read_config()

    if not debug:
        print("Collecting static files...", flush=True)
        code = manage(["collectstatic", "--noinput"], env, quiet=True)
        if code != 0:
            print(
                "Static file collection failed. The app may start but CSS/JS may be missing.",
                flush=True,
            )

    # A port change or DB change is fully applied once this process reaches the
    # start step.  The setup wizard uses this flag to show its restart page.
    if config.get("restart_required"):
        config = write_config({"restart_required": False})

    return 0


def start_child(host, port, env, trusted_proxy=None):
    command = [
        sys.executable,
        str(BASE_DIR / "serve_wsgi.py"),
        "--host",
        host,
        "--port",
        str(port),
    ]
    if trusted_proxy:
        command += ["--trusted-proxy", trusted_proxy]
    return subprocess.Popen(command, cwd=str(BASE_DIR), env=env)


def stop_child(child, timeout=15):
    if child is None or child.poll() is not None:
        return
    child.terminate()
    try:
        child.wait(timeout=timeout)
    except subprocess.TimeoutExpired:
        child.kill()
        try:
            child.wait(timeout=5)
        except subprocess.TimeoutExpired:
            pass


def print_banner(port, config, debug=False, db_name=None):
    mode = "development" if debug else "production"
    print("", flush=True)
    print("=" * 62, flush=True)
    print(f"  fiber-map ({mode})", flush=True)
    print(f"  Web:          http://127.0.0.1:{port}/", flush=True)
    print(f"  Login:        http://127.0.0.1:{port}/login", flush=True)
    print(f"  Management:   http://127.0.0.1:{port}/management/", flush=True)
    print(
        "  Database:     MySQL ({})".format(
            db_name or config.get("db_name") or "fiber_map"
        ),
        flush=True,
    )
    if not debug:
        print("  Server:       Waitress (port changes auto-restart)", flush=True)
    print("=" * 62, flush=True)
    print("", flush=True)


def main():
    parser = argparse.ArgumentParser(description="Run the fiber-map application.")
    parser.add_argument("--port", type=int, default=None, help="Port to listen on")
    parser.add_argument("--host", default="0.0.0.0", help="Bind address (default 0.0.0.0)")
    parser.add_argument(
        "--trusted-proxy",
        default=os.environ.get("TRUSTED_PROXY", ""),
        help="Proxy IP allowed to set X-Forwarded-* headers (usually 127.0.0.1)",
    )
    parser.add_argument("--no-migrate", action="store_true", help="Skip automatic migrations")
    parser.add_argument("--debug", action="store_true", help="Enable Django debug mode")
    parser.add_argument(
        "--once",
        action="store_true",
        help="Run migrations and the server without the auto-restart supervisor",
    )
    args = parser.parse_args()

    if args.port:
        if not 1 <= args.port <= 65535:
            print("Port must be between 1 and 65535.", file=sys.stderr)
            return 2
        write_config({"port": args.port})

    config = read_config()
    env = build_env(config, debug=args.debug)
    code = prepare(config, env, debug=args.debug, no_migrate=args.no_migrate)
    if code != 0:
        return code

    config = read_config()
    env = build_env(config, debug=args.debug)
    port = get_port()
    print_banner(port, config, debug=args.debug, db_name=env.get("DB_NAME"))

    child = start_child(args.host, port, env, args.trusted_proxy)
    if args.once:
        try:
            return child.wait()
        except KeyboardInterrupt:
            stop_child(child)
            return 0

    try:
        while True:
            time.sleep(1.5)
            latest = read_config()
            new_port = get_port()

            restart_requested = bool(latest.get("restart_required"))
            if new_port != port or restart_requested:
                reason = "port changed" if new_port != port else "configuration changed"
                print(f"Configuration update detected ({reason}); restarting...", flush=True)
                stop_child(child)
                env = build_env(latest, debug=args.debug)
                code = prepare(
                    latest,
                    env,
                    debug=args.debug,
                    no_migrate=args.no_migrate,
                )
                if code != 0:
                    print("Prepare step failed. Retrying in 5 seconds...", flush=True)
                    time.sleep(5)
                    continue
                env = build_env(read_config(), debug=args.debug)
                port = get_port()
                print_banner(port, read_config(), debug=args.debug)
                child = start_child(args.host, port, env, args.trusted_proxy)
                continue

            if child.poll() is not None:
                print(
                    f"Web process exited with code {child.returncode}; restarting...",
                    flush=True,
                )
                # Avoid a tight crash loop.
                time.sleep(3)
                env = build_env(read_config(), debug=args.debug)
                port = get_port()
                child = start_child(args.host, port, env, args.trusted_proxy)
    except KeyboardInterrupt:
        print("\nStopping fiber-map...", flush=True)
        stop_child(child)
        return 0


if __name__ == "__main__":
    sys.exit(main())
