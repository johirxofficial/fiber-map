"""MySQL helpers used by the setup wizard and management commands."""
import os
import re
import shutil
import subprocess
from pathlib import Path

from django.conf import settings
from django.db import connection


def current_engine():
    return settings.DATABASES['default']['ENGINE']


def _read_sql(path):
    with open(path, 'r', encoding='utf-8-sig', errors='replace') as handle:
        return handle.read()


def _mysql_client():
    """Locate the mysql command-line client (best for importing dumps)."""
    candidates = [
        os.environ.get('MYSQL_CLIENT'),
        r'C:\xampp\mysql\bin\mysql.exe',
        shutil.which('mysql'),
    ]
    for candidate in candidates:
        if candidate and Path(candidate).is_file():
            return candidate
    return None


def _mysqldump_client():
    """Locate the mysqldump command-line client."""
    candidates = [
        os.environ.get('MYSQLDUMP_CLIENT'),
        r'C:\xampp\mysql\bin\mysqldump.exe',
        shutil.which('mysqldump'),
    ]
    mysql_client = _mysql_client()
    if mysql_client:
        sibling = Path(mysql_client).with_name('mysqldump.exe')
        candidates.append(str(sibling))
    for candidate in candidates:
        if candidate and Path(candidate).is_file():
            return candidate
    return None


def dump_database():
    """Return ``(ok, sql_or_error_message)`` for the active MySQL database."""
    config = settings.DATABASES.get('default', {})
    if 'mysql' not in (config.get('ENGINE') or ''):
        return False, 'SQL export is only available for MySQL/MariaDB.'
    dump_client = _mysqldump_client()
    if not dump_client:
        return False, 'Could not find mysqldump.exe. Install the MySQL client tools or set MYSQLDUMP_CLIENT.'
    database = config.get('NAME') or ''
    if not database:
        return False, 'No database is configured.'
    command = [
        dump_client,
        '--host=' + str(config.get('HOST') or '127.0.0.1'),
        '--port=' + str(config.get('PORT') or '3306'),
        '--user=' + str(config.get('USER') or 'root'),
        '--single-transaction',
        '--skip-lock-tables',
        '--no-tablespaces',
        '--routines',
        '--events',
        '--default-character-set=utf8mb4',
        database,
    ]
    # The password is passed through MYSQL_PWD instead of --password so it does
    # not show up in the process list (`ps aux`) while the dump runs.
    child_env = os.environ.copy()
    if config.get('PASSWORD'):
        child_env['MYSQL_PWD'] = str(config['PASSWORD'])
    try:
        result = subprocess.run(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=180,
            check=False,
            env=child_env,
        )
    except Exception as exc:
        return False, f'MySQL export failed: {exc}'
    if result.returncode != 0:
        detail = (result.stderr or b'').decode('utf-8', errors='replace').strip()
        return False, f'MySQL export failed: {detail or "mysqldump exited with an error."}'
    sql = result.stdout or b''
    if not sql.strip():
        return False, 'MySQL export returned an empty file.'
    return True, sql


def _sanitize_sql(sql):
    """Remove phpMyAdmin client-only DELIMITER commands."""
    sql = re.sub(r'^\s*DELIMITER\s+\S+\s*$', '', sql, flags=re.MULTILINE | re.IGNORECASE)
    sql = re.sub(r'^\s*\$\$\s*$', '', sql, flags=re.MULTILINE)
    return sql


def _drop_legacy_sync_triggers():
    """The source dump references a missing stored procedure.

    Those triggers are not used by this Django application, so remove them
    after importing the dump to keep user/cable/marker inserts working.
    """
    names = (
        'client_inc_sync',
        'client_ins_sync',
        'client_inu_sync',
        'client_ind_sync',
        'client_ini_sync',
    )
    try:
        with connection.cursor() as cursor:
            for name in names:
                cursor.execute(f'DROP TRIGGER IF EXISTS `{name}`')
    except Exception:
        pass


def import_sql_file(path):
    """Import a .sql dump into the configured MySQL database.

    Returns ``(ok, message)`` so callers can surface a helpful error without
    crashing a one-time setup request.
    """
    path = str(path)
    if not os.path.exists(path):
        return False, 'SQL file not found.'

    db = settings.DATABASES['default']
    host = db.get('HOST') or '127.0.0.1'
    port = str(db.get('PORT') or '3306')
    user = db.get('USER') or 'root'
    password = db.get('PASSWORD') or ''
    database = db.get('NAME') or ''

    client = _mysql_client()
    if client:
        command = [client, '-h', host, '-P', port, '-u', user]
        child_env = os.environ.copy()
        if password:
            # Avoid exposing the password in the process list.
            child_env['MYSQL_PWD'] = password
        command.append(database)
        try:
            with open(path, 'rb') as handle:
                result = subprocess.run(
                    command,
                    stdin=handle,
                    capture_output=True,
                    timeout=600,
                    env=child_env,
                )
            if result.returncode != 0:
                detail = (result.stderr or b'').decode('utf-8', 'replace').strip()
                return False, f'MySQL import failed: {detail or "mysql client error"}'
            _drop_legacy_sync_triggers()
            return True, 'SQL imported into MySQL successfully.'
        except Exception as exc:
            return False, f'MySQL import failed: {exc}'

    # Fallback for machines without the mysql CLI: use mysql-connector with
    # multi-statement support after removing client-only commands.
    sql = _sanitize_sql(_read_sql(path))
    try:
        import mysql.connector
        cnx = mysql.connector.connect(
            host=host,
            port=int(port),
            user=user,
            password=password,
            database=database,
            charset='utf8mb4',
            connection_timeout=10,
            autocommit=True,
        )
        try:
            cursor = cnx.cursor()
            try:
                cursor.execute(sql, multi=True)
                for _ in cursor:
                    pass
            finally:
                cursor.close()
        finally:
            cnx.close()
        _drop_legacy_sync_triggers()
        return True, 'SQL imported into MySQL successfully.'
    except Exception as exc:
        return False, f'MySQL import failed: {exc}'


def test_mysql_connection(host, port, user, password, database, create=False):
    """Connect to MySQL and optionally create the database."""
    database = (database or '').strip()
    if not re.fullmatch(r'[A-Za-z0-9_\-]+', database):
        return False, 'Database name may only contain letters, numbers, _ and -.'
    try:
        import mysql.connector
        cnx = mysql.connector.connect(
            host=host or '127.0.0.1',
            port=int(port or 3306),
            user=user or '',
            password=password or '',
            connection_timeout=8,
        )
        try:
            cursor = cnx.cursor()
            if create:
                cursor.execute(
                    f"CREATE DATABASE IF NOT EXISTS `{database}` "
                    "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
                )
            cursor.execute(f"USE `{database}`")
            cursor.close()
        finally:
            cnx.close()
        return True, 'MySQL connection successful.'
    except Exception as exc:
        return False, f'MySQL connection failed: {exc}'
