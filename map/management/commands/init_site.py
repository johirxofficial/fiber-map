"""Create the first administrator and site settings from a bootstrap config."""
import json

from django.core.management.base import BaseCommand
from django.db import transaction

from map.models import SiteSettings, UserProfile
from map.site_config import CONFIG_PATH, write_config


class Command(BaseCommand):
    help = 'Finish first-run setup using the bootstrap section of site_config.json.'

    def add_arguments(self, parser):
        parser.add_argument('--config', default=str(CONFIG_PATH))

    def handle(self, *args, **options):
        config_path = options['config']
        try:
            with open(config_path, 'r', encoding='utf-8-sig') as handle:
                config = json.load(handle)
        except (OSError, ValueError) as exc:
            self.stderr.write(f'Cannot read config: {exc}')
            return

        bootstrap = config.get('bootstrap')
        if not bootstrap:
            self.stdout.write('No pending bootstrap data; nothing to do.')
            return

        permissions = bootstrap.get('permissions') or {}
        defaults = {
            'default_can_add_data': permissions.get(
                'default_can_add_data', permissions.get('add', True)),
            'default_can_edit_data': permissions.get(
                'default_can_edit_data', permissions.get('edit', True)),
            'default_can_delete_data': permissions.get(
                'default_can_delete_data', permissions.get('delete', False)),
            'default_can_manage_users': permissions.get(
                'default_can_manage_users', permissions.get('manage', False)),
        }

        with transaction.atomic():
            site = SiteSettings.objects.order_by('id').first() or SiteSettings()
            site.site_name = bootstrap.get('site_name') or 'fiber-map'
            site.tagline = bootstrap.get('tagline') or 'Fiber network management map'
            if bootstrap.get('logo'):
                site.logo = bootstrap['logo']
            site.port = int(bootstrap.get('port') or 5003)
            site.setup_completed = True
            for key, value in defaults.items():
                setattr(site, key, value)
            site.save()

            username = (bootstrap.get('admin_username') or '').strip()
            password_hash = bootstrap.get('admin_password_hash') or ''
            password = bootstrap.get('admin_password') or ''
            if not username:
                raise SystemExit('Bootstrap config has no admin username.')

            user, created = UserProfile.objects.get_or_create(username=username)
            if password_hash:
                user.password = password_hash
            elif password:
                user.set_password(password)
            user.is_active = True
            user.is_staff = True
            user.is_superuser = True
            user.role = 'admin'
            user.user_type = 'admin'
            user.is_manager = False
            user.can_add_data = True
            user.can_edit_data = True
            user.can_delete_data = True
            user.can_manage_users = True
            user.save()

        write_config({
            'setup_required': False,
            'restart_required': False,
            'bootstrap': None,
            'pending_sql': None,
        })
        self.stdout.write(self.style.SUCCESS(
            f'Site setup complete. Administrator "{username}" is ready.'
        ))
