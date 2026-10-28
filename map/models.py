import json

from django.db import models
from django.utils.text import slugify
from django.utils.translation import gettext_lazy as _
from django.dispatch import receiver
from django.db.models.signals import post_save
from django.conf import settings
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import AbstractUser


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_auth_token(sender, instance=None, created=False, **kwargs):
    """Make sure every user has exactly one API token.

    ``get_or_create`` also repairs users that were imported/created before the
    token app was installed instead of raising an IntegrityError.
    """
    if created:
        Token.objects.get_or_create(user=instance)


class UserProfile(AbstractUser):
    ROLE_TYPE_CHOICES = (
        ('admin', 'Admin'),
        ('manager', 'Manager'),
        ('user', 'User'),
    )
    GENDER_TYPE_CHOICES = (
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
    )
    role = models.CharField(max_length=20, choices=ROLE_TYPE_CHOICES, default='user')
    user_type = models.CharField(max_length=20, choices=ROLE_TYPE_CHOICES, default='user')
    is_manager = models.BooleanField(default=False)
    gender = models.CharField(max_length=10, choices=GENDER_TYPE_CHOICES, null=True, blank=True)
    biography = models.TextField(null=True, blank=True)
    contact_number = models.CharField(max_length=20, null=True, blank=True)
    address = models.CharField(max_length=255, null=True, blank=True)

    # Granular permissions. Admin/staff users bypass these flags.
    can_add_data = models.BooleanField(default=True, verbose_name='Can add data')
    can_edit_data = models.BooleanField(default=True, verbose_name='Can edit data')
    can_delete_data = models.BooleanField(default=False, verbose_name='Can delete data')
    can_manage_users = models.BooleanField(default=False, verbose_name='Can manage users and settings')

    @property
    def is_admin(self):
        return bool(self.is_superuser or self.is_staff or self.role == 'admin')

    def has_perm_add(self):
        return self.is_admin or self.can_add_data

    def has_perm_edit(self):
        return self.is_admin or self.can_edit_data

    def has_perm_delete(self):
        return self.is_admin or self.can_delete_data

    def has_perm_manage(self):
        return self.is_admin or self.can_manage_users

    def save(self, *args, **kwargs):
        if self.is_manager or self.role == 'manager' or self.user_type == 'manager':
            self.is_manager = True
            self.role = 'manager'
            self.user_type = 'manager'
        super().save(*args, **kwargs)


class MarkerType(models.TextChoices):
    POP = 'POP', _('POP')
    CLIENT = 'CLIENT', _('Client')
    TJ_BOX = 'TJ_BOX', _('TJ BOX')
    RESELLER = 'RESELLER', _('Reseller')


class Zone(models.Model):
    identifier = models.CharField(max_length=100, null=True, blank=True)
    name = models.CharField(max_length=100)
    description = models.TextField(null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    def __str__(self):
        return self.name


class SubZone(models.Model):
    identifier = models.CharField(max_length=100, null=True, blank=True)
    name = models.CharField(max_length=100)
    zone = models.ForeignKey(Zone, on_delete=models.CASCADE, related_name='subzones')
    description = models.TextField(null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    def __str__(self):
        return self.name


Subzone = SubZone


class NetworkCategory(models.Model):
    """A Network Point category/model shown in Management and Network Point.

    The four original categories (POP, Client, TJ Box and Reseller) keep using
    their dedicated tables.  Administrators can rename them and can add or
    remove additional service categories; custom categories store their records
    in :class:`CustomNetworkPoint`.
    """

    key = models.SlugField(
        max_length=64,
        unique=True,
        help_text='Stable identifier. Built-in keys use POP, CLIENT, TJ_BOX or RESELLER.',
    )
    label = models.CharField(max_length=80)
    icon = models.CharField(max_length=40, default='tag')
    color = models.CharField(max_length=20, default='#2185d0')
    description = models.CharField(max_length=255, null=True, blank=True)
    is_system = models.BooleanField(default=False)
    sort_order = models.PositiveIntegerField(default=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ('sort_order', 'id')
        verbose_name = 'Network category'
        verbose_name_plural = 'Network categories'

    def __str__(self):
        return self.label

    def save(self, *args, **kwargs):
        if not self.key:
            base = slugify(self.label) or 'category'
            key = base
            counter = 2
            while NetworkCategory.objects.filter(key=key).exclude(pk=self.pk).exists():
                key = f'{base}-{counter}'
                counter += 1
            self.key = key
        super().save(*args, **kwargs)


class CustomNetworkPoint(models.Model):
    """Record type used by categories created from Management → Categories."""

    category = models.ForeignKey(
        NetworkCategory,
        on_delete=models.CASCADE,
        related_name='custom_points',
    )
    identifier = models.CharField(max_length=100, null=True, blank=True)
    name = models.CharField(max_length=100)
    mobile_number = models.CharField(max_length=100, null=True, blank=True)
    address = models.CharField(max_length=200, null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    latitude = models.FloatField()
    longitude = models.FloatField()
    zone = models.ForeignKey(Zone, on_delete=models.SET_NULL, null=True, blank=True, related_name='custom_points')
    subzone = models.ForeignKey(SubZone, on_delete=models.SET_NULL, null=True, blank=True, related_name='custom_points')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ('id',)
        verbose_name = 'Custom network point'
        verbose_name_plural = 'Custom network points'

    def __str__(self):
        return f'{self.category.label}: {self.name}'


class Marker(models.Model):
    identifier = models.CharField(max_length=100, null=True, blank=True)
    type = models.CharField(max_length=100, choices=MarkerType.choices)
    latitude = models.FloatField()
    longitude = models.FloatField()
    address = models.CharField(max_length=200, null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    description = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.type


class PopType(models.TextChoices):
    """Suggested legacy values.

    POP type is intentionally free text: operators use OLT, Switch, ONU, BOX
    and many other equipment names.  These choices are kept for backwards
    compatibility with code that imports PopType, but the POP field below no
    longer restricts manual input.
    """

    OLT = 'OLT', _('Olt')
    SWITCH = 'Switch', _('Switch')


class POP(models.Model):
    identifier = models.CharField(max_length=100, null=True, blank=True)
    name = models.CharField(max_length=100)
    marker = models.OneToOneField(Marker, on_delete=models.CASCADE)
    pop_type = models.CharField(max_length=100)
    zone = models.ForeignKey(Zone, on_delete=models.SET_NULL, null=True, blank=True, related_name='pops')
    subzone = models.ForeignKey(SubZone, on_delete=models.SET_NULL, null=True, blank=True, related_name='pops')

    def __str__(self):
        return self.name


class TJBox(models.Model):
    identifier = models.CharField(max_length=100, null=True, blank=True)
    name = models.CharField(max_length=100)
    marker = models.OneToOneField(Marker, on_delete=models.CASCADE)
    zone = models.ForeignKey(Zone, on_delete=models.SET_NULL, null=True, blank=True, related_name='tj_boxes')
    subzone = models.ForeignKey(SubZone, on_delete=models.SET_NULL, null=True, blank=True, related_name='tj_boxes')

    def __str__(self):
        return self.name


class Client(models.Model):
    identifier = models.CharField(max_length=100, null=True, blank=True)
    name = models.CharField(max_length=100)
    marker = models.OneToOneField(Marker, on_delete=models.CASCADE)
    mobile_number = models.CharField(max_length=100, null=True, blank=True)
    zone = models.ForeignKey(Zone, on_delete=models.SET_NULL, null=True, blank=True, related_name='clients')
    subzone = models.ForeignKey(SubZone, on_delete=models.SET_NULL, null=True, blank=True, related_name='clients')

    def __str__(self):
        return self.name


class Reseller(models.Model):
    identifier = models.CharField(max_length=100, null=True, blank=True)
    name = models.CharField(max_length=100)
    marker = models.OneToOneField(Marker, on_delete=models.CASCADE)
    mobile_number = models.CharField(max_length=100, null=True, blank=True)
    zone = models.ForeignKey(Zone, on_delete=models.SET_NULL, null=True, blank=True, related_name='resellers')
    subzone = models.ForeignKey(SubZone, on_delete=models.SET_NULL, null=True, blank=True, related_name='resellers')

    def __str__(self):
        return self.name


class Cable(models.Model):
    identifier = models.CharField(max_length=100)
    type = models.CharField(max_length=100, null=True, blank=True)
    start_from = models.CharField(max_length=100, choices=MarkerType.choices)
    starting_point = models.ForeignKey(Marker, on_delete=models.CASCADE, related_name='starting_point')
    end_to = models.CharField(max_length=100, choices=MarkerType.choices)
    ending_point = models.ForeignKey(Marker, on_delete=models.CASCADE, related_name='ending_point')
    number_of_cores = models.IntegerField()
    length = models.FloatField(null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    polyline = models.TextField(null=True, blank=True)
    zone = models.ForeignKey(Zone, on_delete=models.SET_NULL, null=True, blank=True, related_name='cables')
    subzone = models.ForeignKey(SubZone, on_delete=models.SET_NULL, null=True, blank=True, related_name='cables')

    def set_polyline(self, data):
        self.polyline = json.dumps(data)

    def get_polyline(self):
        if not self.polyline:
            return []
        try:
            return json.loads(self.polyline)
        except (TypeError, ValueError):
            return []

    def __str__(self):
        return f'{self.identifier}'


class Core(models.Model):
    marker = models.ForeignKey(Marker, on_delete=models.CASCADE)
    cable = models.ForeignKey(Cable, on_delete=models.CASCADE, null=True, blank=True)
    core_number = models.IntegerField()
    color = models.CharField(max_length=100)
    assigned = models.BooleanField()
    splitter = models.ForeignKey("Gpon", on_delete=models.CASCADE, null=True, blank=True)

    def __str__(self):
        return f"{self.marker.type} {self.cable} - {self.core_number}"


class Gpon(models.Model):
    tj_box = models.ForeignKey(TJBox, on_delete=models.CASCADE, null=True, blank=True)
    identifier = models.CharField(max_length=100, null=True, blank=True)
    name = models.CharField(max_length=100)
    marker = models.ForeignKey(Marker, on_delete=models.CASCADE)
    input_cable = models.ForeignKey(Cable, on_delete=models.CASCADE, null=True, blank=True)
    input_core = models.ForeignKey(Core, on_delete=models.CASCADE, related_name='input_core', null=True, blank=True)
    splitter = models.IntegerField()
    zone = models.ForeignKey(Zone, on_delete=models.SET_NULL, null=True, blank=True, related_name='gpons')
    subzone = models.ForeignKey(SubZone, on_delete=models.SET_NULL, null=True, blank=True, related_name='gpons')

    def __str__(self):
        return self.name


class Connection(models.Model):
    core_from = models.ForeignKey(Core, on_delete=models.CASCADE, related_name='core_from')
    core_to = models.ForeignKey(Core, on_delete=models.CASCADE, related_name='core_to')

    def __str__(self):
        return f"{self.core_from} - {self.core_to}"


# Backwards/alternative naming aliases.

class ManagerUserManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(role='manager')


class ManagerUser(UserProfile):
    objects = ManagerUserManager()

    class Meta:
        proxy = True
        verbose_name = 'Manager User'

    def save(self, *args, **kwargs):
        self.role = 'manager'
        self.user_type = 'manager'
        self.is_manager = True
        super().save(*args, **kwargs)


# Alias for alternative naming.
Manager = ManagerUser


class SiteSettings(models.Model):
    """Singleton row with branding and installation wide defaults."""

    site_name = models.CharField(max_length=120, default='fiber-map')
    tagline = models.CharField(max_length=200, default='Fiber network management map')
    logo = models.FileField(upload_to='branding/', null=True, blank=True)
    port = models.PositiveIntegerField(default=5003)

    # Default map view and the radius used to reject obviously wrong browser
    # GPS fixes.  Set gps_max_distance_km=0 to disable the distance guard.
    map_center_lat = models.FloatField(default=23.8103)
    map_center_lng = models.FloatField(default=90.4125)
    map_zoom = models.PositiveSmallIntegerField(default=13)
    gps_max_distance_km = models.PositiveIntegerField(default=500)

    setup_completed = models.BooleanField(default=False)

    default_can_add_data = models.BooleanField(default=True)
    default_can_edit_data = models.BooleanField(default=True)
    default_can_delete_data = models.BooleanField(default=False)
    default_can_manage_users = models.BooleanField(default=False)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Site settings'
        verbose_name_plural = 'Site settings'

    def __str__(self):
        return self.site_name

    @classmethod
    def load(cls):
        settings_obj = cls.objects.order_by('id').first()
        if settings_obj is None:
            settings_obj = cls.objects.create()
        return settings_obj

    @property
    def logo_url(self):
        if not self.logo:
            return ''
        try:
            return self.logo.url
        except ValueError:
            return ''


