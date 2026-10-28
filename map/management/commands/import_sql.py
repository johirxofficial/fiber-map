"""Import a SQL dump into the configured database."""
import os

from django.core.management.base import BaseCommand

from map import db_utils
from map.site_config import CONFIG_PATH, read_config, write_config


class Command(BaseCommand):
    help = 'Import a .sql dump into the configured MySQL database.'

    def add_arguments(self, parser):
        parser.add_argument('file', help='Path to the .sql file')
        parser.add_argument('--config', default=str(CONFIG_PATH))

    def handle(self, *args, **options):
        path = options['file']
        if not os.path.exists(path):
            self.stderr.write(f'File not found: {path}')
            raise SystemExit(1)

        ok, message = db_utils.import_sql_file(path)
        if not ok:
            self.stderr.write(self.style.ERROR(message))
            raise SystemExit(1)

        config = read_config()
        if config.get('pending_sql') == path:
            write_config({'pending_sql': None})
        self.stdout.write(self.style.SUCCESS(message))
