"""First-run setup wizard and site/database administration endpoints."""
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from django.conf import settings
from django.contrib.auth.hashers import make_password
from django.core.files.storage import default_storage
from django.http import JsonResponse
from django.shortcuts import redirect, render
from django.utils import timezone
from django.views.decorators.http import require_http_methods
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from . import db_utils
from .models import SiteSettings, UserProfile
from .permissions import CanManageUsers, IsAdmin
from .serializers import SiteSettingsSerializer
from .site_config import read_config, write_config

LOGO_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'}


def _defaults():
    site = SiteSettings.load()
    return site


def _bootstrap_payload(site, admin_username, admin_password_hash, logo_name='', permissions=None):
    if permissions is None:
        permissions = {
            'add': site.default_can_add_data,
            'edit': site.default_can_edit_data,
            'delete': site.default_can_delete_data,
            'manage': site.default_can_manage_users,
        }
    return {
        'site_name': site.site_name,
        'tagline': site.tagline,
        'logo': logo_name or (site.logo.name if site.logo else ''),
        'port': site.port,
        'admin_username': admin_username,
        'admin_password_hash': admin_password_hash,
        'permissions': permissions,
    }


def _save_logo(uploaded, previous=''):
    if not uploaded:
        return previous
    extension = Path(uploaded.name).suffix.lower()
    if extension not in LOGO_EXTENSIONS:
        raise ValueError('Logo must be a png, jpg, jpeg, gif, webp or svg file.')
    stamp = timezone.now().strftime('%Y%m%d%H%M%S')
    return default_storage.save(f'branding/logo-{stamp}{extension}', uploaded)


def _save_pending_sql(uploaded):
    if not uploaded:
        return None
    if not uploaded.name.lower().endswith('.sql'):
        raise ValueError('Only .sql files are supported for SQL import.')
    directory = Path(settings.BASE_DIR) / 'tmp'
    directory.mkdir(parents=True, exist_ok=True)
    path = directory / f'pending-import-{timezone.now().strftime("%Y%m%d%H%M%S")}.sql'
    with open(path, 'wb') as handle:
        for chunk in uploaded.chunks():
            handle.write(chunk)
    return str(path)


def _parse_int(value, default, minimum=1, maximum=65535):
    try:
        value = int(value)
    except (TypeError, ValueError):
        return default
    if value < minimum or value > maximum:
        return default
    return value


def _parse_float(value, default, minimum=None, maximum=None):
    try:
        value = float(value)
    except (TypeError, ValueError):
        return default
    if minimum is not None and value < minimum:
        return default
    if maximum is not None and value > maximum:
        return default
    return value


def _bool(value, default=False):
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    return str(value).strip().lower() in ('1', 'true', 'yes', 'on', 'checked')


def _setup_context(**extra):
    config = read_config()
    context = {
        'site_name': 'fiber-map',
        'tagline': 'Fiber network management map',
        'port': config.get('port') or 5003,
        'db_engine': 'mysql',
        'db_name': config.get('db_name') or 'fiber_map',
        'db_user': config.get('db_user') or 'root',
        'db_password': config.get('db_password') or '',
        'db_host': config.get('db_host') or '127.0.0.1',
        'db_port': config.get('db_port') or '3306',
        'admin_username': 'admin',
        'default_can_add_data': True,
        'default_can_edit_data': True,
        'default_can_delete_data': False,
        'default_can_manage_users': False,
        'error': '',
        'message': '',
        'restart_required': False,
        'restart_command': 'python run.py',
    }
    try:
        site = SiteSettings.objects.order_by('id').first()
        if site:
            context.update({
                'site_name': site.site_name,
                'tagline': site.tagline,
                'port': site.port,
            })
    except Exception:
        pass
    context.update(extra)
    return context


@require_http_methods(['GET', 'POST'])
def setup_wizard(request):
    config = read_config()
    restart_required = bool(config.get('restart_required'))
    if request.method == 'GET' and config.get('restart_required'):
        return render(request, 'setup_restart.html', {
            'port': config.get('port') or 5003,
            'restart_command': 'python run.py',
            'db_engine': config.get('db_engine'),
        })

    if request.method == 'GET':
        # Already configured? Send people to the login screen.
        try:
            site = SiteSettings.objects.order_by('id').first()
            if site and site.setup_completed and not restart_required:
                return redirect('/login?setup=done')
        except Exception:
            pass
        return render(request, 'setup.html', _setup_context())

    # ----------------------------- POST -----------------------------
    form = request.POST
    site_name = (form.get('site_name') or '').strip()
    tagline = (form.get('tagline') or '').strip()
    admin_username = (form.get('admin_username') or '').strip()
    admin_password = form.get('admin_password') or ''
    admin_confirm = form.get('admin_confirm') or ''
    port = _parse_int(form.get('port'), 5003)
    db_engine = 'mysql'

    context = _setup_context(
        site_name=site_name or 'fiber-map',
        tagline=tagline or 'Fiber network management map',
        port=port,
        db_engine=db_engine,
        db_name=(form.get('db_name') or '').strip(),
        db_user=(form.get('db_user') or '').strip(),
        db_password=form.get('db_password') or '',
        db_host=(form.get('db_host') or 'localhost').strip(),
        db_port=(form.get('db_port') or '3306').strip(),
        admin_username=admin_username or 'admin',
        default_can_add_data=_bool(form.get('default_can_add_data'), True),
        default_can_edit_data=_bool(form.get('default_can_edit_data'), True),
        default_can_delete_data=_bool(form.get('default_can_delete_data'), False),
        default_can_manage_users=_bool(form.get('default_can_manage_users'), False),
    )

    if not site_name:
        context['error'] = 'Site name is required.'
        return render(request, 'setup.html', context)
    if not admin_username or not re.fullmatch(r'[\w.@+-]{3,150}', admin_username):
        context['error'] = 'Enter a valid admin username (3-150 characters).'
        return render(request, 'setup.html', context)
    if len(admin_password) < 4:
        context['error'] = 'Admin password must be at least 4 characters.'
        return render(request, 'setup.html', context)
    if admin_password != admin_confirm:
        context['error'] = 'Admin password and confirmation do not match.'
        return render(request, 'setup.html', context)

    try:
        logo_name = _save_logo(request.FILES.get('logo'))
    except ValueError as exc:
        context['error'] = str(exc)
        return render(request, 'setup.html', context)

    try:
        sql_path = _save_pending_sql(request.FILES.get('sql_file'))
    except ValueError as exc:
        context['error'] = str(exc)
        return render(request, 'setup.html', context)

    # MySQL/MariaDB is the only supported database engine.
    db_name = context['db_name']
    db_user = context['db_user']
    db_password = context['db_password']
    db_host = context['db_host'] or '127.0.0.1'
    db_port = context['db_port'] or '3306'
    if not db_name or not db_user:
        context['error'] = 'MySQL database name and user are required.'
        return render(request, 'setup.html', context)
    ok, message = db_utils.test_mysql_connection(
        db_host, db_port, db_user, db_password, db_name, create=True
    )
    if not ok:
        context['error'] = message
        return render(request, 'setup.html', context)

    bootstrap = {
        'site_name': site_name,
        'tagline': tagline or 'Fiber network management map',
        'logo': logo_name,
        'port': port,
        'admin_username': admin_username,
        'admin_password_hash': make_password(admin_password),
        'permissions': {
            'default_can_add_data': context['default_can_add_data'],
            'default_can_edit_data': context['default_can_edit_data'],
            'default_can_delete_data': context['default_can_delete_data'],
            'default_can_manage_users': context['default_can_manage_users'],
        },
    }
    write_config({
        'port': port,
        'db_engine': 'mysql',
        'db_name': db_name,
        'db_user': db_user,
        'db_password': db_password,
        'db_host': db_host,
        'db_port': str(db_port),
        'setup_required': True,
        'restart_required': True,
        'bootstrap': bootstrap,
        'pending_sql': sql_path,
    })
    return render(request, 'setup_restart.html', {
        'port': port,
        'db_engine': 'mysql',
        'restart_command': 'python run.py',
        'message': 'MySQL settings verified. Restart the server to run migrations and finish setup.',
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def setup_status(request):
    config = read_config()
    completed = False
    site_name = 'fiber-map'
    try:
        site = SiteSettings.objects.order_by('id').first()
        completed = bool(site and site.setup_completed) and not config.get('restart_required')
        if site:
            site_name = site.site_name
    except Exception:
        completed = False
    return Response({
        'setup_completed': completed,
        'restart_required': bool(config.get('restart_required')),
        'setup_required': config.get('setup_required'),
        'site_name': site_name,
        'port': config.get('port') or 5003,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def setup_test_database(request):
    data = request.data
    ok, message = db_utils.test_mysql_connection(
        data.get('db_host') or 'localhost',
        data.get('db_port') or 3306,
        data.get('db_user') or '',
        data.get('db_password') or '',
        data.get('db_name') or '',
        create=True,
    )
    return Response({'ok': ok, 'message': message}, status=200 if ok else 400)


@api_view(['GET'])
@permission_classes([AllowAny])
def site_info(request):
    config = read_config()
    data = {
        'site_name': 'fiber-map',
        'tagline': 'Fiber network management map',
        'logo_url': '',
        'port': getattr(settings, 'SITE_PORT', None) or config.get('port') or 5003,
        'map_center_lat': 23.8103,
        'map_center_lng': 90.4125,
        'map_zoom': 13,
        'gps_max_distance_km': 500,
        'setup_completed': False,
        'primary_color': '#2563eb',
    }
    try:
        site = SiteSettings.objects.order_by('id').first()
        if site:
            data.update({
                'site_name': site.site_name,
                'tagline': site.tagline,
                'logo_url': site.logo_url,
                'map_center_lat': site.map_center_lat,
                'map_center_lng': site.map_center_lng,
                'map_zoom': site.map_zoom,
                'gps_max_distance_km': site.gps_max_distance_km,
                'setup_completed': bool(site.setup_completed),
            })
    except Exception:
        pass
    return Response(data)


class SiteSettingsAPIView(APIView):
    permission_classes = (IsAuthenticated, CanManageUsers)

    def get(self, request):
        site = SiteSettings.load()
        return Response(SiteSettingsSerializer(site, context={'request': request}).data)

    def patch(self, request):
        return self._update(request)

    def put(self, request):
        return self._update(request)

    def post(self, request):
        return self._update(request)

    def _update(self, request):
        site = SiteSettings.load()
        data = request.data
        previous_port = site.port
        if 'site_name' in data:
            name = (data.get('site_name') or '').strip()
            if not name:
                return Response({'detail': 'Site name is required.'}, status=400)
            site.site_name = name
        if 'tagline' in data:
            site.tagline = (data.get('tagline') or '').strip()
        if 'port' in data:
            site.port = _parse_int(data.get('port'), site.port)
        if 'map_center_lat' in data:
            site.map_center_lat = _parse_float(
                data.get('map_center_lat'), site.map_center_lat, -90, 90
            )
        if 'map_center_lng' in data:
            site.map_center_lng = _parse_float(
                data.get('map_center_lng'), site.map_center_lng, -180, 180
            )
        if 'map_zoom' in data:
            site.map_zoom = _parse_int(data.get('map_zoom'), site.map_zoom, 1, 22)
        if 'gps_max_distance_km' in data:
            site.gps_max_distance_km = _parse_int(
                data.get('gps_max_distance_km'), site.gps_max_distance_km, 0, 20000
            )
        for field in ('default_can_add_data', 'default_can_edit_data',
                      'default_can_delete_data', 'default_can_manage_users'):
            if field in data:
                setattr(site, field, _bool(data.get(field), getattr(site, field)))
        upload = request.FILES.get('logo')
        if upload:
            try:
                site.logo = _save_logo(upload, site.logo.name if site.logo else '')
            except ValueError as exc:
                return Response({'detail': str(exc)}, status=400)
        site.setup_completed = True
        site.save()
        port_changed = site.port != previous_port
        write_config({
            'port': site.port,
            'setup_required': False,
            'restart_required': port_changed,
        })
        if port_changed:
            message = (
                'Settings saved. The built-in Waitress server will restart automatically '
                'when it is running under run.py or systemd. On Passenger/shared hosting, '
                'restart the application from the hosting panel.'
            )
        else:
            message = 'Settings saved.'
        return Response({
            'settings': SiteSettingsSerializer(site, context={'request': request}).data,
            'restart_required': port_changed,
            'message': message,
        })


class DatabaseInfoAPIView(APIView):
    permission_classes = (IsAuthenticated, IsAdmin)

    def get(self, request):
        config = read_config()
        db = settings.DATABASES['default']
        data = {
            'engine': 'mysql',
            'name': str(db.get('NAME') or ''),
            'host': db.get('HOST') or '',
            'port': db.get('PORT') or '',
            'user': db.get('USER') or '',
            'configured_engine': 'mysql',
            'config_path': settings.SITE_CONFIG_PATH,
            'restart_required': bool(config.get('restart_required')),
        }
        return Response(data)


class DatabaseTestAPIView(APIView):
    permission_classes = (IsAuthenticated, IsAdmin)

    def post(self, request):
        data = request.data
        ok, message = db_utils.test_mysql_connection(
            data.get('db_host') or 'localhost',
            data.get('db_port') or 3306,
            data.get('db_user') or '',
            data.get('db_password') or '',
            data.get('db_name') or '',
            create=True,
        )
        return Response({'ok': ok, 'message': message}, status=200 if ok else 400)


class DatabaseConfigAPIView(APIView):
    permission_classes = (IsAuthenticated, IsAdmin)

    def post(self, request):
        data = request.data
        engine = (data.get('db_engine') or data.get('engine') or 'mysql').lower()
        if engine != 'mysql':
            return Response({'detail': 'Engine must be mysql.'}, status=400)

        site = SiteSettings.load()
        sql_path = None
        upload = request.FILES.get('sql_file')
        if upload:
            try:
                sql_path = _save_pending_sql(upload)
            except ValueError as exc:
                return Response({'detail': str(exc)}, status=400)

        db_name = (data.get('db_name') or '').strip()
        db_user = (data.get('db_user') or '').strip()
        db_password = data.get('db_password') or ''
        db_host = (data.get('db_host') or '127.0.0.1').strip()
        db_port = str(data.get('db_port') or '3306')
        if not db_name or not db_user:
            return Response({'detail': 'MySQL database name and user are required.'}, status=400)

        ok, message = db_utils.test_mysql_connection(
            db_host, db_port, db_user, db_password, db_name, create=True
        )
        if not ok:
            return Response({'detail': message}, status=400)

        bootstrap = _bootstrap_payload(
            site, request.user.username, request.user.password,
            site.logo.name if site.logo else '',
        )
        write_config({
            'port': _parse_int(data.get('port'), site.port),
            'db_engine': 'mysql',
            'db_name': db_name,
            'db_user': db_user,
            'db_password': db_password,
            'db_host': db_host,
            'db_port': db_port,
            'setup_required': True,
            'restart_required': True,
            'bootstrap': bootstrap,
            'pending_sql': sql_path,
        })
        return Response({
            'ok': True,
            'restart_required': True,
            'message': (
                'MySQL configured. The built-in Waitress server will restart and run '
                'migrations automatically when it is running under run.py/systemd. '
                'On Passenger/shared hosting, restart the application from the hosting panel.'
            ),
        })


class DatabaseImportAPIView(APIView):
    permission_classes = (IsAuthenticated, IsAdmin)

    def post(self, request):
        upload = request.FILES.get('sql_file')
        if not upload:
            return Response({'detail': 'Choose a .sql file to import.'}, status=400)
        try:
            path = _save_pending_sql(upload)
        except ValueError as exc:
            return Response({'detail': str(exc)}, status=400)
        ok, message = db_utils.import_sql_file(path)
        try:
            os.remove(path)
        except OSError:
            pass
        return Response({'ok': ok, 'message': message}, status=200 if ok else 400)


class ExportDatabaseAPIView(APIView):
    permission_classes = (IsAuthenticated, IsAdmin)

    def get(self, request):
        ok, payload = db_utils.dump_database()
        if not ok:
            return Response({'detail': payload}, status=400)
        from django.http import HttpResponse
        stamp = timezone.localtime().strftime('%Y%m%d-%H%M%S')
        database = settings.DATABASES.get('default', {}).get('NAME') or 'database'
        response = HttpResponse(payload, content_type='application/sql; charset=utf-8')
        response['Content-Disposition'] = f'attachment; filename="{database}-{stamp}.sql"'
        response['Cache-Control'] = 'no-store'
        return response
