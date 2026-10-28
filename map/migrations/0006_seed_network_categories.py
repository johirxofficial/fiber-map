from django.db import migrations


DEFAULT_CATEGORIES = (
    ('POP', 'POP', 'building', '#2563eb', 10),
    ('CLIENT', 'Client', 'user', '#16a34a', 20),
    ('TJ_BOX', 'TJ Box', 'inbox', '#f59e0b', 30),
    ('RESELLER', 'Reseller', 'shop', '#9333ea', 40),
)


def seed_categories(apps, schema_editor):
    NetworkCategory = apps.get_model('map', 'NetworkCategory')
    for key, label, icon, color, sort_order in DEFAULT_CATEGORIES:
        NetworkCategory.objects.get_or_create(
            key=key,
            defaults={
                'label': label,
                'icon': icon,
                'color': color,
                'sort_order': sort_order,
                'is_system': True,
            },
        )


def unseed_categories(apps, schema_editor):
    NetworkCategory = apps.get_model('map', 'NetworkCategory')
    NetworkCategory.objects.filter(key__in=[row[0] for row in DEFAULT_CATEGORIES]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('map', '0005_networkcategory_customnetworkpoint'),
    ]

    operations = [
        migrations.RunPython(seed_categories, unseed_categories),
    ]
