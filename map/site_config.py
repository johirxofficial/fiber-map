"""Persistent, file based configuration for the MySQL database and server port.

The file lives next to ``manage.py`` so the very first request can be served
before the setup wizard has finished. Django settings read this file at
startup. MySQL/MariaDB is the only supported database engine.
"""
import json
import os
import secrets
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent


def load_env_file():
    """Load a simple ``KEY=VALUE`` .env file without an extra dependency.

    Existing process environment variables always win, matching the usual
    deployment-panel behaviour.  This runs before settings read DB/secret
    values, so ``cp .env.example .env`` works as documented.
    """
    env_path = Path(os.environ.get('ENV_FILE', BASE_DIR / '.env'))
    try:
        lines = env_path.read_text(encoding='utf-8-sig').splitlines()
    except OSError:
        return
    for raw in lines:
        line = raw.strip()
        if not line or line.startswith('#'):
            continue
        if line.startswith('export '):
            line = line[7:].lstrip()
        key, separator, value = line.partition('=')
        key = key.strip()
        if not separator or not key or not key.replace('_', '').isalnum():
            continue
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in ('"', "'"):
            value = value[1:-1]
        elif ' #' in value:
            value = value.split(' #', 1)[0].rstrip()
        os.environ.setdefault(key, value)


load_env_file()
CONFIG_PATH = Path(os.environ.get('SITE_CONFIG_FILE', BASE_DIR / 'site_config.json'))

DEFAULTS = {
    'port': 5003,
    'secret_key': '',
    'db_engine': 'mysql',
    'db_name': 'fiber_map',
    'db_user': 'root',
    'db_password': '',
    'db_host': '127.0.0.1',
    'db_port': '3306',
    'setup_required': None,
    'restart_required': False,
    'bootstrap': None,
    'pending_sql': None,
}


def read_config():
    config = dict(DEFAULTS)
    try:
        # utf-8-sig accepts files saved by Windows Notepad/PowerShell with a BOM.
        with open(CONFIG_PATH, 'r', encoding='utf-8-sig') as handle:
            stored = json.load(handle)
        if isinstance(stored, dict):
            config.update(stored)
    except (FileNotFoundError, ValueError, OSError):
        pass
    return config


def write_config(updates):
    config = read_config()
    config.update(updates or {})
    config['db_engine'] = 'mysql'
    CONFIG_PATH.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = CONFIG_PATH.with_suffix('.json.tmp')
    with open(tmp_path, 'w', encoding='utf-8') as handle:
        json.dump(config, handle, indent=2)
    os.replace(tmp_path, CONFIG_PATH)
    return config


def ensure_secret_key():
    """Return a persistent Django secret key, creating one when needed.

    The key is stored in ``site_config.json`` so sessions survive restarts.
    On read-only hosting the write is skipped and the environment variable
    ``DJANGO_SECRET_KEY`` should be used instead.
    """
    config = read_config()
    existing = str(config.get('secret_key') or '').strip()
    if existing:
        return existing
    generated = secrets.token_urlsafe(50)
    try:
        write_config({'secret_key': generated})
    except OSError:
        return generated
    return generated


def get_port():
    try:
        port = int(os.environ.get('SITE_PORT') or read_config().get('port') or 5003)
    except (TypeError, ValueError):
        port = 5003
    if not 1 <= port <= 65535:
        port = 5003
    return port
