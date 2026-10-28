"""Keep a single administrator and demote every other admin account.

The project has one main administrator in the demo.  Accounts imported from
older dumps may still have ``is_staff``/``is_superuser``/``role='admin'`` set.
Running this command makes the requested account the only administrator while
keeping the other user accounts (and their data) intact.
"""
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db.models import Q


class Command(BaseCommand):
    help = (
        'Demote every administrator except one main admin. Use --apply to '
        'write changes; without it the command only lists what would change.'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--username',
            default='admin',
            help='Username of the administrator to keep (default: admin).',
        )
        parser.add_argument(
            '--apply',
            action='store_true',
            help='Actually save the demotions. Without this flag it is a dry run.',
        )

    def handle(self, *args, **options):
        User = get_user_model()
        username = (options.get('username') or '').strip()

        main_admin = User.objects.filter(username=username).first()
        if main_admin is None:
            raise CommandError(
                f'Main administrator "{username}" was not found in this database.'
            )
        if not getattr(main_admin, 'is_admin', False):
            raise CommandError(
                f'User "{username}" is not an administrator. '
                'Set its password/role first or choose another --username.'
            )

        extras = (
            User.objects.exclude(pk=main_admin.pk)
            .filter(
                Q(is_superuser=True) | Q(is_staff=True) | Q(role='admin')
            )
            .order_by('id')
        )

        rows = list(
            extras.values_list('id', 'username', 'is_superuser', 'is_staff', 'role')
        )
        if not rows:
            self.stdout.write(
                self.style.SUCCESS(
                    f'Only "{username}" is an administrator. Nothing to change.'
                )
            )
            return

        for user_id, other_username, is_superuser, is_staff, role in rows:
            self.stdout.write(
                f'  id={user_id} username={other_username!r} '
                f'is_superuser={is_superuser} is_staff={is_staff} role={role!r}'
            )

        if not options['apply']:
            self.stdout.write(
                self.style.WARNING(
                    'Dry run only. Re-run with --apply to demote these accounts.'
                )
            )
            return

        changed = 0
        for user in extras:
            user.is_superuser = False
            user.is_staff = False
            user.role = 'user'
            user.user_type = 'user'
            user.is_manager = False
            user.can_manage_users = False
            user.save(
                update_fields=[
                    'is_superuser',
                    'is_staff',
                    'role',
                    'user_type',
                    'is_manager',
                    'can_manage_users',
                ]
            )
            changed += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'Demoted {changed} extra administrator(s). '
                f'"{username}" is now the only administrator.'
            )
        )
