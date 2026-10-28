"""First-run setup guarding middleware."""
import os

from django.http import JsonResponse
from django.shortcuts import redirect

from .site_config import read_config


class SetupWizardMiddleware:
    """Redirect browsers to the setup wizard until installation is complete.

    The check uses ``site_config.json`` first (works even when the database
    cannot be reached yet) and then the ``SiteSettings`` row.  Only the setup
    page, static/media files and the public site-info endpoint are allowed
    through before setup.
    """

    ALLOWED_PREFIXES = (
        '/setup',
        '/static/',
        '/media/',
        '/favicon',
        '/api/setup',
        '/api/site/',
        '/admin/',
        '/health',
    )

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if os.environ.get('SITE_SKIP_SETUP', '').lower() in ('1', 'true', 'yes'):
            return self.get_response(request)

        path = request.path_info or '/'
        if any(path.startswith(prefix) for prefix in self.ALLOWED_PREFIXES):
            return self.get_response(request)

        config = read_config()

        if config.get('restart_required'):
            if path.startswith('/api/'):
                return JsonResponse(
                    {'detail': 'Restart required to finish database configuration.',
                     'restart_required': True, 'setup_url': '/setup?restart=1'},
                    status=503,
                )
            return redirect('/setup?restart=1')

        setup_completed = False
        try:
            from .models import SiteSettings
            site = SiteSettings.objects.order_by('id').first()
            setup_completed = bool(site and site.setup_completed)
        except Exception:
            setup_completed = False

        setup_required = config.get('setup_required')
        if setup_required is True:
            setup_completed = False
        elif setup_required is False:
            setup_completed = True

        if not setup_completed:
            if path.startswith('/api/'):
                return JsonResponse(
                    {'detail': 'First-run setup is not complete.',
                     'setup_required': True, 'setup_url': '/setup'},
                    status=503,
                )
            return redirect('/setup')

        return self.get_response(request)
