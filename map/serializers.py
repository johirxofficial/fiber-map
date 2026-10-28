import json
import re

from django.db import transaction

from .utility import find_core_paths

from rest_framework import serializers

from .models import (Marker, POP, Client, TJBox, Gpon, Cable, Core, Connection, UserProfile,
                     Reseller, Zone, SubZone, ManagerUser, SiteSettings, NetworkCategory,
                     CustomNetworkPoint)


class UserSerializer(serializers.ModelSerializer):
    confirm_password = serializers.CharField(
        max_length=128, write_only=True, required=False, allow_blank=True,
        style={'input_type': 'password'}
    )

    class Meta:
        model = UserProfile
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'password', 'confirm_password',
                  'role', 'user_type', 'is_manager', 'is_active', 'is_staff', 'is_superuser',
                  'can_add_data', 'can_edit_data', 'can_delete_data', 'can_manage_users',
                  'gender', 'biography', 'contact_number', 'address', 'last_login']

        read_only_fields = ['last_login']

        extra_kwargs = {
            'password': {
                'write_only': True,
                'required': False,
                'style': {'input_type': 'password'}
            },
        }

    RESTRICTED_FIELDS = (
        'role', 'user_type', 'is_manager', 'is_active', 'is_staff', 'is_superuser',
        'can_add_data', 'can_edit_data', 'can_delete_data', 'can_manage_users',
    )

    def _can_manage(self):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        return bool(user and user.is_authenticated and getattr(user, 'has_perm_manage', lambda: False)())

    def _is_admin(self):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        return bool(user and user.is_authenticated and getattr(user, 'is_admin', False))

    def validate(self, attrs):
        password = attrs.get('password')
        confirm_password = attrs.get('confirm_password')

        if self.instance is None and not password:
            raise serializers.ValidationError({'password': 'Password is required'})

        if password is not None or confirm_password:
            if password is None:
                raise serializers.ValidationError(
                    {'password': 'Password is required when confirm password is provided'}
                )
            if confirm_password != password:
                raise serializers.ValidationError(
                    {'confirm_password': 'Password and confirm password not matched'}
                )

        # Only administrators/managers may change roles and permission flags.
        if not self._can_manage():
            for field in self.RESTRICTED_FIELDS:
                attrs.pop(field, None)
        else:
            is_admin = self._is_admin()
            if not is_admin:
                # Managers can manage normal users but cannot promote anyone to
                # a Django superuser or grant themselves more power.
                attrs.pop('is_staff', None)
                attrs.pop('is_superuser', None)
                if attrs.get('role') == 'admin':
                    attrs['role'] = 'manager'

            role = attrs.get('role')
            if role == 'admin':
                attrs.setdefault('is_staff', True)
                attrs.setdefault('is_superuser', True)
                attrs['user_type'] = 'admin'
                for field in ('can_add_data', 'can_edit_data', 'can_delete_data', 'can_manage_users'):
                    attrs[field] = True
            elif role == 'manager':
                attrs['is_manager'] = True
                attrs['user_type'] = 'manager'
                attrs.setdefault('can_manage_users', True)
                attrs.setdefault('can_delete_data', True)
            elif role == 'user' and self.instance is not None:
                attrs['is_manager'] = False
                attrs['user_type'] = 'user'

        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password', None)
        password = validated_data.pop('password')

        site = SiteSettings.objects.order_by('id').first()
        if site:
            validated_data.setdefault('can_add_data', site.default_can_add_data)
            validated_data.setdefault('can_edit_data', site.default_can_edit_data)
            validated_data.setdefault('can_delete_data', site.default_can_delete_data)
            validated_data.setdefault('can_manage_users', site.default_can_manage_users)

        user = self.Meta.model(**validated_data)
        user.set_password(password)
        user.save()

        return user

    def update(self, instance, validated_data):
        validated_data.pop('confirm_password', None)
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)

        return super().update(instance, validated_data)


class MarkerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Marker
        fields = ('id', 'type', 'latitude', 'longitude', 'address', 'notes', 'description')
        # ``Marker.address`` is nullable in the database for imported records,
        # but every marker created through the API needs an address.
        extra_kwargs = {
            'address': {'required': True, 'allow_blank': False, 'allow_null': False},
        }

    def validate_address(self, value):
        if not (value or '').strip():
            raise serializers.ValidationError('Address is required')
        return value.strip()

    def validate_latitude(self, value):
        if value is None:
            raise serializers.ValidationError('Latitude is required')
        if not -90 <= value <= 90:
            raise serializers.ValidationError('Latitude must be between -90 and 90')
        return value

    def validate_longitude(self, value):
        if value is None:
            raise serializers.ValidationError('Longitude is required')
        if not -180 <= value <= 180:
            raise serializers.ValidationError('Longitude must be between -180 and 180')
        return value



class BasicMarkerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Marker
        fields = ('identifier', 'type',)


class MarkerUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Marker
        fields = ['address', 'description', 'notes', 'latitude', 'longitude']
        read_only_fields = ['latitude', 'longitude']


class POPCreateSerializer(serializers.ModelSerializer):
    marker = MarkerSerializer()

    class Meta:
        model = POP
        fields = ('id', 'identifier', 'name', 'marker', 'pop_type', 'zone', 'subzone')

    @transaction.atomic
    def create(self, validated_data):
        marker_data = validated_data.pop('marker')
        marker = Marker.objects.create(**marker_data)
        marker.identifier = validated_data['name']
        marker.save()
        pop = POP.objects.create(marker=marker, **validated_data)
        return pop

    def validate_identifier(self, value):
        if not value:
            raise serializers.ValidationError('Identifier is required')
        return value.strip()

    def validate_pop_type(self, value):
        value = (value or '').strip()
        if not value:
            raise serializers.ValidationError('POP type is required')
        return value


class POPListSerializer(serializers.ModelSerializer):
    latitude = serializers.FloatField(source='marker.latitude')
    longitude = serializers.FloatField(source='marker.longitude')
    address = serializers.CharField(source='marker.address')

    class Meta:
        model = POP
        fields = ('id', 'identifier', 'name', 'pop_type', 'latitude', 'longitude', 'address', 'zone', 'subzone')


class POPUpdateSerializer(serializers.ModelSerializer):
    marker = MarkerUpdateSerializer()

    class Meta:
        model = POP
        fields = ['name', 'pop_type', 'marker', 'zone', 'subzone']

    def validate_pop_type(self, value):
        value = (value or '').strip()
        if not value:
            raise serializers.ValidationError('POP type is required')
        return value

    def update(self, instance, validated_data):
        marker_data = validated_data.pop('marker', {})
        name = validated_data.get('name', instance.name)
        instance.marker.address = marker_data.get('address', instance.marker.address)
        instance.marker.description = marker_data.get('description', instance.marker.description)
        instance.marker.notes = marker_data.get('notes', instance.marker.notes)
        instance.marker.identifier = name
        instance.marker.save()
        instance.name = name
        instance.pop_type = validated_data.get('pop_type', instance.pop_type)
        instance.zone = validated_data.get('zone', instance.zone)
        instance.subzone = validated_data.get('subzone', instance.subzone)
        instance.save()
        return instance


class PopCoreSerializer(serializers.ModelSerializer):
    connected_to = serializers.SerializerMethodField()

    class Meta:
        model = Core
        fields = ['id', 'core_number', 'color', 'assigned', 'connected_to', ]

    def get_connected_to(self, obj):
        connection = Connection.objects.filter(core_from=obj)
        for conn in connection:
            if conn.core_from.cable != conn.core_to.cable:
                return {'id': conn.core_to.id}
        return None


class ClientCreateSerializer(serializers.ModelSerializer):
    marker = MarkerSerializer()

    class Meta:
        model = Client
        fields = ('id', 'identifier', 'name', 'marker', 'mobile_number', 'zone', 'subzone')

    @transaction.atomic
    def create(self, validated_data):
        marker_data = validated_data.pop('marker')
        marker = Marker.objects.create(**marker_data)
        marker.identifier = validated_data['name']
        marker.save()
        client = Client.objects.create(marker=marker, **validated_data)
        return client

    def validate_identifier(self, value):
        if not value:
            raise serializers.ValidationError('Identifier is required')
        return value.strip()


class ClientListSerializer(serializers.ModelSerializer):
    latitude = serializers.FloatField(source='marker.latitude')
    longitude = serializers.FloatField(source='marker.longitude')
    address = serializers.CharField(source='marker.address')

    class Meta:
        model = Client
        fields = ('id', 'identifier', 'name', 'latitude', 'longitude', 'address', 'mobile_number', 'zone', 'subzone')


class ClientCoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Core
        fields = ['id', 'core_number', 'color', 'assigned', ]


class ClientUpdateSerializer(serializers.ModelSerializer):
    marker = MarkerUpdateSerializer()

    class Meta:
        model = Client
        fields = ['name', 'mobile_number', 'marker', 'zone', 'subzone']

    def update(self, instance, validated_data):
        marker_data = validated_data.pop('marker', {})
        name = validated_data.get('name', instance.name)
        instance.marker.address = marker_data.get('address', instance.marker.address)
        instance.marker.description = marker_data.get('description', instance.marker.description)
        instance.marker.notes = marker_data.get('notes', instance.marker.notes)
        instance.marker.identifier = name

        instance.marker.save()
        instance.name = name
        instance.mobile_number = validated_data.get('mobile_number', instance.mobile_number)
        instance.zone = validated_data.get('zone', instance.zone)
        instance.subzone = validated_data.get('subzone', instance.subzone)
        instance.save()
        return instance


class ResellerCreateSerializer(serializers.ModelSerializer):
    marker = MarkerSerializer()

    class Meta:
        model = Reseller
        fields = ('id', 'identifier', 'name', 'marker', 'mobile_number', 'zone', 'subzone')

    @transaction.atomic
    def create(self, validated_data):
        marker_data = validated_data.pop('marker')
        marker = Marker.objects.create(**marker_data)
        marker.identifier = validated_data['name']
        marker.save()
        reseller = Reseller.objects.create(marker=marker, **validated_data)
        return reseller

    def validate_identifier(self, value):
        if not value:
            raise serializers.ValidationError('Identifier is required')
        return value.strip()


class ResellerListSerializer(serializers.ModelSerializer):
    latitude = serializers.FloatField(source='marker.latitude')
    longitude = serializers.FloatField(source='marker.longitude')
    address = serializers.CharField(source='marker.address')

    class Meta:
        model = Reseller
        fields = ('id', 'identifier', 'name', 'latitude', 'longitude', 'address', 'mobile_number', 'zone', 'subzone')


class ResellerCoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Core
        fields = ['id', 'core_number', 'color', 'assigned', ]


class ResellerUpdateSerializer(serializers.ModelSerializer):
    marker = MarkerUpdateSerializer()

    class Meta:
        model = Reseller
        fields = ['name', 'mobile_number', 'marker', 'zone', 'subzone']

    def update(self, instance, validated_data):
        marker_data = validated_data.pop('marker', {})
        name = validated_data.get('name', instance.name)
        instance.marker.address = marker_data.get('address', instance.marker.address)
        instance.marker.description = marker_data.get('description', instance.marker.description)
        instance.marker.notes = marker_data.get('notes', instance.marker.notes)
        instance.marker.identifier = name

        instance.marker.save()
        instance.name = name
        instance.mobile_number = validated_data.get('mobile_number', instance.mobile_number)
        instance.zone = validated_data.get('zone', instance.zone)
        instance.subzone = validated_data.get('subzone', instance.subzone)
        instance.save()
        return instance


class TJBoxCreateSerializer(serializers.ModelSerializer):
    marker = MarkerSerializer()

    class Meta:
        model = TJBox
        fields = ('id', 'identifier', 'name', 'marker', 'zone', 'subzone')

    @transaction.atomic
    def create(self, validated_data):
        marker_data = validated_data.pop('marker')
        marker = Marker.objects.create(**marker_data)
        marker.identifier = validated_data['name']
        marker.save()
        tj_box = TJBox.objects.create(marker=marker, **validated_data)
        return tj_box

    def validate_identifier(self, value):
        if not value:
            raise serializers.ValidationError('Identifier is required')
        return value.strip()


class TJBoxListSerializer(serializers.ModelSerializer):
    latitude = serializers.FloatField(source='marker.latitude')
    longitude = serializers.FloatField(source='marker.longitude')
    address = serializers.CharField(source='marker.address')

    class Meta:
        model = TJBox
        fields = ('id', 'identifier', 'name', 'latitude', 'longitude', 'address', 'zone', 'subzone')


class TJBoxUpdateSerializer(serializers.ModelSerializer):
    marker = MarkerUpdateSerializer()

    class Meta:
        model = TJBox
        fields = ['name', 'marker', 'zone', 'subzone']

    def update(self, instance, validated_data):
        marker_data = validated_data.pop('marker', {})
        name = validated_data.get('name', instance.name)
        instance.marker.address = marker_data.get('address', instance.marker.address)
        instance.marker.description = marker_data.get('description', instance.marker.description)
        instance.marker.notes = marker_data.get('notes', instance.marker.notes)
        instance.marker.identifier = name
        instance.marker.save()
        instance.name = name
        instance.zone = validated_data.get('zone', instance.zone)
        instance.subzone = validated_data.get('subzone', instance.subzone)
        instance.save()
        return instance


class TJBoxCoreSerializer(serializers.ModelSerializer):
    last_point = serializers.SerializerMethodField()
    connected_to = serializers.SerializerMethodField()

    class Meta:
        model = Core
        fields = ['id', 'core_number', 'color', 'assigned', 'connected_to', 'last_point']

    def get_last_point(self, obj):
        path = find_core_paths(obj)
        if not path:
            return None
        last_core = path[-1]
        if last_core is None or last_core.marker is None:
            return None
        return BasicMarkerSerializer(last_core.marker).data

    def get_connected_to(self, obj):
        connection = Connection.objects.filter(core_from=obj)
        for conn in connection:
            if conn.core_from.cable != conn.core_to.cable:
                return {'id': conn.core_to.id}
        return None


class GponCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Gpon
        fields = ('id', 'identifier', 'name', 'tj_box', 'splitter', 'zone', 'subzone')

    @transaction.atomic
    def create(self, validated_data):
        marker = validated_data['tj_box'].marker
        if not validated_data.get('identifier'):
            validated_data['identifier'] = validated_data['name']
        gpon = Gpon.objects.create(marker=marker, **validated_data)

        splitter = validated_data['splitter']
        input_core = Core.objects.create(marker=marker, splitter=gpon, core_number=0, assigned=False,
                                         color='gpon_color')
        gpon.input_core = input_core
        gpon.save(update_fields=['input_core'])
        for i in range(1, splitter + 1):
            obj = Core.objects.create(marker=marker, splitter=gpon, core_number=i, assigned=False, color='gpon_color')
            Connection.objects.create(core_from=obj, core_to=input_core)
        return gpon

    def validate_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('Name is required')
        return value.strip()

    def validate_splitter(self, value):
        if value not in [2, 4, 8, 12, 16, 32]:
            raise serializers.ValidationError('Splitter must be 2, 4, 8, 12, 16 or 32')
        return value


class GponListSerializer(serializers.ModelSerializer):
    latitude = serializers.FloatField(source='marker.latitude')
    longitude = serializers.FloatField(source='marker.longitude')
    address = serializers.CharField(source='marker.address')

    class Meta:
        model = Gpon
        fields = ('id', 'identifier', 'name', 'splitter', 'tj_box', 'latitude', 'longitude', 'address', 'zone', 'subzone')


class CableCreateSerializer(serializers.ModelSerializer):
    polyline = serializers.JSONField()

    class Meta:
        model = Cable
        fields = (
            'id', 'identifier', 'type', 'start_from', 'starting_point', 'end_to', 'ending_point', 'number_of_cores',
            'length', 'notes', 'description', 'polyline', 'zone', 'subzone',)

    def to_internal_value(self, data):
        choices = {
            'POP': POP,
            'CLIENT': Client,
            'TJ_BOX': TJBox,
            'RESELLER': Reseller
        }

        # Copy first (QueryDict / request data may be immutable) so we can map
        # frontend model ids to marker ids below.
        data = data.copy() if hasattr(data, 'copy') else dict(data)

        start_from = data.get('start_from')
        if start_from in choices and data.get('starting_point') is not None:
            starting_point = choices[start_from].objects.filter(id=data['starting_point']).first()
            if starting_point is None:
                raise serializers.ValidationError({'starting_point': 'Invalid starting point'})
            data['starting_point'] = starting_point.marker_id

        end_to = data.get('end_to')
        if end_to in choices and data.get('ending_point') is not None:
            ending_point = choices[end_to].objects.filter(id=data['ending_point']).first()
            if ending_point is None:
                raise serializers.ValidationError({'ending_point': 'Invalid ending point'})
            data['ending_point'] = ending_point.marker_id

        return super().to_internal_value(data)

    @transaction.atomic
    def create(self, validated_data):
        starting_point = validated_data['starting_point']
        ending_point = validated_data['ending_point']
        validated_data['length'] = validated_data.get('length') or 0

        num_of_core = validated_data['number_of_cores']
        instance = super().create(validated_data)

        colors = [
            "blue",
            "orange",
            "green",
            "brown",
            "grey",
            "white",
            "red",
            "black",
            "yellow",
            "violet",
            "pink",
            "aqua"
        ]
        len_color = len(colors)
        start_list = []
        end_list = []
        for i in range(1, num_of_core + 1):
            color_index = (i - 1) % len_color
            start_marker_side = Core(
                marker=starting_point,
                cable=instance,
                core_number=i,
                color=colors[color_index],
                assigned=False
            )
            end_marker_side = Core(
                marker=ending_point,
                cable=instance,
                core_number=i,
                color=colors[color_index],
                assigned=False
            )
            start_list.append(start_marker_side)
            end_list.append(end_marker_side)

        Core.objects.bulk_create(
            start_list + end_list
        )
        st = Core.objects.filter(cable=instance, marker=starting_point).order_by('core_number')
        en = Core.objects.filter(cable=instance, marker=ending_point).order_by('core_number')

        connections = [
                          Connection(core_from=start, core_to=end)
                          for start, end in zip(st, en)
                      ] + [
                          Connection(core_from=end, core_to=start)
                          for start, end in zip(st, en)
                      ]
        Connection.objects.bulk_create(connections)

        return instance

    def validate_number_of_cores(self, value):
        if value not in [2, 4, 6, 8, 12, 24, 48]:
            raise serializers.ValidationError('Number of cores must be 2, 4, 6, 8, 12, 24, 48')
        return value

    def validate(self, data):
        polyline = data.get('polyline')
        starting_point = data.get('starting_point')
        ending_point = data.get('ending_point')

        if not starting_point or not ending_point:
            raise serializers.ValidationError({'starting_point': 'Starting and ending points are required'})
        if starting_point.pk == ending_point.pk:
            raise serializers.ValidationError({'ending_point': 'Starting and ending points must be different'})
        if not isinstance(polyline, list) or len(polyline) < 2:
            raise serializers.ValidationError({'polyline': 'Polyline must contain at least two points'})
        for point in polyline:
            if not isinstance(point, dict) or 'lat' not in point or 'lng' not in point:
                raise serializers.ValidationError({'polyline': 'Every polyline point needs lat and lng'})
            try:
                lat = float(point['lat'])
                lng = float(point['lng'])
            except (TypeError, ValueError):
                raise serializers.ValidationError({'polyline': 'Polyline coordinates must be numbers'})
            if not (-90 <= lat <= 90 and -180 <= lng <= 180):
                raise serializers.ValidationError({'polyline': 'Polyline coordinates are outside the valid range'})

        # Work on a copy: mutating the validated list in place would corrupt
        # the payload if the same request data were validated twice.
        polyline = [dict(point) for point in polyline]

        start_position = {
            "lat": starting_point.latitude,
            "lng": starting_point.longitude
        }

        end_position = {
            "lat": ending_point.latitude,
            "lng": ending_point.longitude
        }

        first_point = polyline.pop(0)
        lat_error = float(first_point['lat']) - start_position['lat']
        lng_error = float(first_point['lng']) - start_position['lng']
        if abs(lat_error) > 0.001 or abs(lng_error) > 0.001:
            raise serializers.ValidationError("try draw polyline from starting point as close as possible")

        polyline.insert(0, start_position)

        last_point = polyline.pop()
        lat_error = float(last_point['lat']) - end_position['lat']
        lng_error = float(last_point['lng']) - end_position['lng']
        if abs(lat_error) > 0.001 or abs(lng_error) > 0.001:
            raise serializers.ValidationError("try draw polyline from ending point as close as possible")

        polyline.append(end_position)
        data['polyline'] = json.dumps(polyline)

        return data


class CableListSerializer(serializers.ModelSerializer):
    polyline = serializers.SerializerMethodField()
    starting_point = serializers.SerializerMethodField()
    ending_point = serializers.SerializerMethodField()

    class Meta:
        model = Cable
        fields = ('id', 'identifier', 'type', 'number_of_cores', 'length', 'polyline', 'starting_point', 'ending_point')

    def get_polyline(self, obj):
        return obj.get_polyline()

    def get_starting_point(self, obj):
        return obj.starting_point.identifier

    def get_ending_point(self, obj):
        return obj.ending_point.identifier


class CableSerializer(serializers.ModelSerializer):
    cores = ClientCoreSerializer(many=True, read_only=True)

    class Meta:
        model = Cable
        fields = ['id', 'identifier', 'number_of_cores', 'length', 'cores']


class CableUpdateSerializer(serializers.ModelSerializer):
    starting_point = serializers.SerializerMethodField()
    ending_point = serializers.SerializerMethodField()

    class Meta:
        model = Cable
        fields = ['id', 'identifier', 'type', 'start_from', 'starting_point', 'end_to', 'ending_point',
                  'number_of_cores', 'length', 'notes', 'description', 'zone', 'subzone']
        read_only_fields = ['start_from', 'starting_point', 'end_to', 'ending_point', 'number_of_cores']

    def get_starting_point(self, obj):
        return obj.starting_point.identifier

    def get_ending_point(self, obj):
        return obj.ending_point.identifier

    def update(self, instance, validated_data):
        instance.type = validated_data.get('type', instance.type)
        instance.identifier = validated_data.get('identifier', instance.identifier)
        instance.length = validated_data.get('length', instance.length)
        instance.notes = validated_data.get('notes', instance.notes)
        instance.description = validated_data.get('description', instance.description)
        instance.zone = validated_data.get('zone', instance.zone)
        instance.subzone = validated_data.get('subzone', instance.subzone)
        instance.save()

        return instance


class GponOutCoreSerializer(serializers.ModelSerializer):
    connected_to = serializers.SerializerMethodField()

    class Meta:
        model = Core
        fields = ['id', 'core_number', 'color', 'connected_to']

    def get_connected_to(self, obj):
        connection = Connection.objects.filter(core_from=obj)
        for conn in connection:
            if conn.core_from.splitter != conn.core_to.splitter:
                return {'id': conn.core_to.id}
        return None


class GponCableCoreSerializer(serializers.ModelSerializer):
    last_point = serializers.SerializerMethodField()
    connected_to = serializers.SerializerMethodField()

    class Meta:
        model = Core
        fields = ['id', 'core_number', 'color', 'connected_to', 'last_point']

    def get_last_point(self, obj):
        path = find_core_paths(obj)
        if not path:
            return None
        last_core = path[-1]
        if last_core is None or last_core.marker is None:
            return None
        return BasicMarkerSerializer(last_core.marker).data

    def get_connected_to(self, obj):
        connection = Connection.objects.filter(core_from=obj)
        for conn in connection:
            if conn.core_to.cable is None:
                return {'id': conn.core_to.id}
        return None


class GponUpdateSerializer(serializers.ModelSerializer):
    marker = MarkerUpdateSerializer(required=False)

    class Meta:
        model = Gpon
        fields = ['name', 'marker', 'zone', 'subzone']

    def update(self, instance, validated_data):
        marker_data = validated_data.pop('marker', None) or {}
        name = validated_data.get('name', instance.name)

        if instance.marker_id and marker_data:
            marker = instance.marker
            marker.address = marker_data.get('address', marker.address)
            marker.description = marker_data.get('description', marker.description)
            marker.notes = marker_data.get('notes', marker.notes)

            marker.save(update_fields=['address', 'description', 'notes'])

        instance.name = name
        instance.identifier = name
        instance.zone = validated_data.get('zone', instance.zone)
        instance.subzone = validated_data.get('subzone', instance.subzone)
        instance.save()
        return instance


class CoreAssignSerializer(serializers.ModelSerializer):
    class Meta:
        model = Core
        fields = '__all__'

    def update(self, instance, validated_data):
        # PATCH bodies that omit ``assigned`` used to raise KeyError (HTTP 500).
        assigned = validated_data.get('assigned', instance.assigned)
        instance.assigned = bool(assigned)
        instance.save(update_fields=['assigned'])
        return instance


class ConnectCoresSerializer(serializers.ModelSerializer):
    class Meta:
        model = Connection
        fields = '__all__'

    def validate(self, attrs):
        core_from = attrs.get('core_from')
        core_to = attrs.get('core_to')
        if core_from == core_to:
            raise serializers.ValidationError('Cannot connect a core to itself')
        if (
            core_from is not None
            and core_to is not None
            and core_from.cable_id is not None
            and core_from.cable_id == core_to.cable_id
        ):
            # Both ends of a single cable are already joined internally, so a
            # manual connection would corrupt the routing table.
            raise serializers.ValidationError('Both cores belong to the same cable')
        if Connection.objects.filter(core_from=core_from, core_to=core_to).exists() or \
                Connection.objects.filter(core_from=core_to, core_to=core_from).exists():
            raise serializers.ValidationError('These cores are already connected')
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        core_from = validated_data['core_from']
        core_to = validated_data['core_to']
        Connection.objects.create(core_from=core_to, core_to=core_from)
        return Connection.objects.create(core_from=core_from, core_to=core_to)


class ZoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Zone
        fields = ('id', 'identifier', 'name', 'description', 'notes', 'latitude', 'longitude')


class ZoneCreateSerializer(ZoneSerializer):
    pass


class ZoneListSerializer(ZoneSerializer):
    pass


class ZoneUpdateSerializer(ZoneSerializer):
    pass


class SubZoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubZone
        fields = ('id', 'identifier', 'name', 'zone', 'description', 'notes', 'latitude', 'longitude')


class SubZoneCreateSerializer(SubZoneSerializer):
    pass


class SubZoneListSerializer(SubZoneSerializer):
    pass


class SubZoneUpdateSerializer(SubZoneSerializer):
    pass


# Alternative naming aliases.
SubzoneSerializer = SubZoneSerializer
SubzoneCreateSerializer = SubZoneCreateSerializer
SubzoneListSerializer = SubZoneListSerializer
SubzoneUpdateSerializer = SubZoneUpdateSerializer

# Manager user serializers.
class ManagerUserSerializer(UserSerializer):
    class Meta(UserSerializer.Meta):
        model = ManagerUser


ManagerUserCreateSerializer = ManagerUserSerializer
ManagerUserListSerializer = ManagerUserSerializer
ManagerUserUpdateSerializer = ManagerUserSerializer


class SiteSettingsSerializer(serializers.ModelSerializer):
    logo_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = SiteSettings
        fields = ('id', 'site_name', 'tagline', 'logo', 'logo_url', 'port',
                  'map_center_lat', 'map_center_lng', 'map_zoom',
                  'gps_max_distance_km', 'setup_completed',
                  'default_can_add_data', 'default_can_edit_data',
                  'default_can_delete_data', 'default_can_manage_users', 'updated_at')
        read_only_fields = ('setup_completed', 'updated_at')

    def get_logo_url(self, obj):
        return obj.logo_url


class NetworkCategorySerializer(serializers.ModelSerializer):
    count = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = NetworkCategory
        fields = ('id', 'key', 'label', 'icon', 'color', 'description',
                  'is_system', 'sort_order', 'count', 'created_at', 'updated_at')
        read_only_fields = ('key', 'is_system', 'created_at', 'updated_at')

    def get_count(self, obj):
        system_counts = {
            'POP': POP,
            'CLIENT': Client,
            'TJ_BOX': TJBox,
            'RESELLER': Reseller,
        }
        model = system_counts.get(obj.key)
        if model is not None:
            return model.objects.count()
        return obj.custom_points.count()

    def validate_label(self, value):
        value = (value or '').strip()
        if not value:
            raise serializers.ValidationError('Category name is required.')
        return value

    def validate_key(self, value):
        if self.instance is not None and self.instance.is_system and value != self.instance.key:
            raise serializers.ValidationError('Built-in category keys cannot be changed.')
        return value

    def validate_icon(self, value):
        value = (value or 'tag').strip()
        if not re.fullmatch(r'[a-z0-9-]+', value):
            raise serializers.ValidationError('Use a Semantic UI icon name such as tag, user or shop.')
        return value

    def validate_color(self, value):
        value = (value or '#2185d0').strip()
        if not re.fullmatch(r'#[0-9a-fA-F]{6}', value):
            raise serializers.ValidationError('Use a six-digit colour such as #2185d0.')
        return value


class CustomNetworkPointSerializer(serializers.ModelSerializer):
    category_label = serializers.CharField(source='category.label', read_only=True)
    category_key = serializers.CharField(source='category.key', read_only=True)
    category_color = serializers.CharField(source='category.color', read_only=True)
    category_icon = serializers.CharField(source='category.icon', read_only=True)
    zone_name = serializers.CharField(source='zone.name', read_only=True, default='')
    subzone_name = serializers.CharField(source='subzone.name', read_only=True, default='')

    class Meta:
        model = CustomNetworkPoint
        fields = ('id', 'category', 'category_label', 'category_key', 'category_color',
                  'category_icon', 'identifier', 'name', 'mobile_number', 'address',
                  'notes', 'description', 'latitude', 'longitude', 'zone', 'subzone',
                  'zone_name', 'subzone_name', 'created_at', 'updated_at')
        read_only_fields = ('created_at', 'updated_at')

    def validate_category(self, value):
        if value.is_system:
            raise serializers.ValidationError(
                'This is a built-in category. Use its own records tab instead.'
            )
        return value

    def validate_latitude(self, value):
        if value is None or not -90 <= value <= 90:
            raise serializers.ValidationError('Latitude must be between -90 and 90')
        return value

    def validate_longitude(self, value):
        if value is None or not -180 <= value <= 180:
            raise serializers.ValidationError('Longitude must be between -180 and 180')
        return value

    def validate(self, attrs):
        category = attrs.get('category') or getattr(self.instance, 'category', None)
        identifier = attrs.get('identifier')
        if identifier is None and self.instance is not None:
            identifier = self.instance.identifier
        if category and identifier:
            duplicate = CustomNetworkPoint.objects.filter(
                category=category, identifier=identifier
            )
            if self.instance is not None:
                duplicate = duplicate.exclude(pk=self.instance.pk)
            if duplicate.exists():
                raise serializers.ValidationError(
                    {'identifier': 'This identifier already exists in this category.'}
                )
        return attrs
