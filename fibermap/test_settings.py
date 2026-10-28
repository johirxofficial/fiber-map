"""Settings used by ``manage.py test``.

MySQL is the production database, but the test suite must run without a MySQL
server (and without the ``CREATE DATABASE`` privilege the application user
normally does not have).  Run the tests with::

    python manage.py test --settings=fibermap.test_settings
"""
import os
import tempfile
from pathlib import Path

# Must be set before ``fibermap.settings`` imports ``map.site_config`` so the
# tests never read or rewrite the real site_config.json.
os.environ.setdefault(
    'SITE_CONFIG_FILE',
    str(Path(tempfile.gettempdir()) / 'fibermap-test-site_config.json'),
)

from .settings import *  # noqa: E402,F401,F403
from .settings import BASE_DIR, MIDDLEWARE as _MIDDLEWARE  # noqa: E402

DEBUG = False
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
        'OPTIONS': {},
    }
}

# Fast hashing keeps the suite quick; production keeps PBKDF2.
PASSWORD_HASHERS = ['django.contrib.auth.hashers.MD5PasswordHasher']

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}

# The first-run wizard middleware would answer every API call with 503 because
# the in-memory test database starts empty, and WhiteNoise warns about a
# missing static root that is irrelevant for API tests.
_SKIP_MIDDLEWARE = {
    'map.middleware.SetupWizardMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
}
MIDDLEWARE = [entry for entry in _MIDDLEWARE if entry not in _SKIP_MIDDLEWARE]

MEDIA_ROOT = BASE_DIR / 'test-media'
STATIC_ROOT = BASE_DIR / 'test-staticfiles'
