"""URL configuration for the fiber map project."""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import RedirectView, TemplateView
from django.views.static import serve as static_serve

from map import site_views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('map.urls')),

    path('setup/', site_views.setup_wizard, name='setup'),
    path('setup', site_views.setup_wizard),

    path('management/', TemplateView.as_view(template_name='management.html'), name='management'),
    path('management', TemplateView.as_view(template_name='management.html')),
    path('manage/', TemplateView.as_view(template_name='management.html'), name='manage'),
    path('site-settings/', TemplateView.as_view(template_name='management.html'), name='site-settings'),
    path('site-settings', TemplateView.as_view(template_name='management.html')),

    # Branches & Zones now live inside the Management panel.
    path('zones/', RedirectView.as_view(url='/management/?tab=zones', permanent=False), name='zones-page'),
    path('zones', RedirectView.as_view(url='/management/?tab=zones', permanent=False), name='zones-page-plain'),
    path('create-user', RedirectView.as_view(url='/management/?tab=users', permanent=False), name='create-user-page'),
    path('create-user/', RedirectView.as_view(url='/management/?tab=users', permanent=False), name='create-user-page-slash'),

    path('', TemplateView.as_view(template_name='index.html'), name='dashboard-page'),
    path('dashboard', TemplateView.as_view(template_name='index.html'), name='dashboard-page-alt'),
    path('dashboard/', TemplateView.as_view(template_name='index.html'), name='dashboard-page-slash'),
    path('login', TemplateView.as_view(template_name='index.html'), name='login-page'),
]

# Client-side React routes all serve the same entry document.
for _route in ('add', 'backup', 'network-point', 'plan', 'remove', 'removeAll'):
    urlpatterns.append(path(_route, TemplateView.as_view(template_name='index.html')))
    urlpatterns.append(path(f'{_route}/', TemplateView.as_view(template_name='index.html')))

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
else:
    # `run.py` is a complete standalone server (Waitress), so uploaded logos and
    # other media must be served even when DEBUG is off. Nginx can still serve
    # /media/ directly and bypass this route for high-traffic deployments.
    urlpatterns += [
        re_path(r'^media/(?P<path>.*)$', static_serve, {
            'document_root': settings.MEDIA_ROOT,
        }),
    ]
