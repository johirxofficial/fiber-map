import hashlib
import json
import math
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from django.core.cache import cache
from django.db.models import Q
from django.db import transaction
from rest_framework import generics, status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView

from . import permissions
from .models import (POP, Client, TJBox, Gpon, Cable, Core, Connection, UserProfile, Marker, MarkerType,
                     Reseller, Zone, SubZone, ManagerUser, NetworkCategory, CustomNetworkPoint)
from .serializers import (POPCreateSerializer, ClientCreateSerializer, GponCreateSerializer, TJBoxCreateSerializer,
                          POPListSerializer, ClientListSerializer, GponListSerializer,
                          TJBoxListSerializer, TJBoxUpdateSerializer, CableCreateSerializer, CableListSerializer,
                          CableSerializer, ClientCoreSerializer, CoreAssignSerializer, TJBoxCoreSerializer,
                          ConnectCoresSerializer,
                          PopCoreSerializer, GponOutCoreSerializer, GponCableCoreSerializer, POPUpdateSerializer,
                          ClientUpdateSerializer, GponUpdateSerializer, CableUpdateSerializer, UserSerializer,
                          ResellerCoreSerializer, ResellerUpdateSerializer, ResellerListSerializer,
                          ResellerCreateSerializer, ZoneCreateSerializer, ZoneListSerializer, ZoneUpdateSerializer,
                          SubZoneCreateSerializer, SubZoneListSerializer, SubZoneUpdateSerializer,
                          ManagerUserSerializer, NetworkCategorySerializer,
                          CustomNetworkPointSerializer)

from .utility import find_core_paths

from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.settings import api_settings
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.throttling import ScopedRateThrottle

from django.utils import timezone


def _serialize_core_paths(cores):
    """Build the path payload shared by POP/client/reseller path endpoints.

    Cores that have no cable (or no route yet) are skipped instead of raising
    ``IndexError``/``AttributeError``.
    """
    serialized_data = []
    for core in cores:
        path = find_core_paths(core)
        data = {'total_length': 0, 'path_direction': []}
        path_units = data['path_direction']
        for c in path:
            if c is None or c.marker is None or c.cable is None:
                continue
            cable = c.cable
            cable_length = cable.length or 0
            data['total_length'] += cable_length
            path_units.append({
                'model_type': c.marker.type,
                'model_identifier': c.marker.identifier,
                'cable_id': cable.id,
                'cable_line': cable.get_polyline(),
                'cable_identifier': cable.identifier,
                'total_cable_core': cable.number_of_cores,
                'cable_length': cable_length,
                'color': c.color,
            })

        if path_units:
            last_length = path_units[-1]['cable_length']
            data['total_length'] = max(data['total_length'] - last_length, 0)
            path_units[-1]['cable_length'] = 0
            path_units[-1]['cable_identifier'] = '/'
        serialized_data.append(data)
    return serialized_data


def _haversine_km(point_a, point_b):
    """Great-circle distance in kilometres between two ``{'lat', 'lng'}`` points."""
    lat1 = math.radians(float(point_a['lat']))
    lng1 = math.radians(float(point_a['lng']))
    lat2 = math.radians(float(point_b['lat']))
    lng2 = math.radians(float(point_b['lng']))
    value = (
        math.sin((lat2 - lat1) / 2) ** 2
        + math.cos(lat1) * math.cos(lat2) * math.sin((lng2 - lng1) / 2) ** 2
    )
    return 2 * 6371.0088 * math.asin(min(1.0, math.sqrt(value)))


def _polyline_length_km(points):
    total = 0.0
    for previous, current in zip(points, points[1:]):
        try:
            total += _haversine_km(previous, current)
        except (KeyError, TypeError, ValueError):
            continue
    return total


def _split_cable_length(total_length, first_half, second_half):
    """Split the original cable length so the two halves add up to the whole.

    A cut used to copy the full length onto both halves, which doubled the
    distance reported by the path endpoints.  The split is proportional to the
    real geometry of each half, with an even split as a fallback.
    """
    total = float(total_length or 0)
    if total <= 0:
        return 0, 0
    first = _polyline_length_km(first_half)
    second = _polyline_length_km(second_half)
    geometry = first + second
    if geometry <= 0:
        return round(total / 2, 2), round(total / 2, 2)
    first_length = round(total * first / geometry, 2)
    return first_length, round(max(total - first_length, 0), 2)


def _detach_gpon_input_cores(core_ids):
    """Drop ``Gpon.input_core`` links before their cores are deleted.

    ``Gpon.input_core`` uses ``on_delete=CASCADE`` in the legacy schema, so
    deleting a cable (and therefore its cores) used to delete every GPON that
    pointed at one of those cores.  Clearing the link keeps the GPON intact.
    """
    core_ids = [core_id for core_id in core_ids if core_id is not None]
    if core_ids:
        Gpon.objects.filter(input_core_id__in=core_ids).update(input_core=None)


class UserViewSets(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserSerializer
    permission_classes = (permissions.CanManageUsers,)

    def get_queryset(self):
        qs = UserProfile.objects.all().order_by('id')
        role = self.request.query_params.get('role')
        if role:
            qs = qs.filter(role=role)
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(Q(username__icontains=search) | Q(email__icontains=search) |
                           Q(first_name__icontains=search) | Q(last_name__icontains=search))
        return qs

    def _may_modify(self, request, instance):
        """Only administrators may change another administrator account."""
        target_is_admin = getattr(instance, 'is_admin', False)
        actor_is_admin = bool(getattr(request.user, 'is_admin', False))
        return actor_is_admin or not target_is_admin

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if not self._may_modify(request, instance):
            return Response(
                {'detail': 'Only administrators can modify an administrator account.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.pk == request.user.pk:
            return Response({'detail': 'You cannot delete your own account.'},
                            status=status.HTTP_400_BAD_REQUEST)
        if not self._may_modify(request, instance):
            return Response(
                {'detail': 'Only administrators can delete an administrator account.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        self.perform_destroy(instance)
        message = f"User with name {instance.username} has been deleted."
        return Response({'message': message}, status=status.HTTP_200_OK)


class UserLoginApiView(ObtainAuthToken):
    renderer_classes = api_settings.DEFAULT_RENDERER_CLASSES
    permission_classes = (AllowAny,)
    throttle_classes = (ScopedRateThrottle,)
    throttle_scope = 'login'

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        if response.status_code == 200:
            user = Token.objects.get(key=response.data['token']).user
            user.last_login = timezone.now()
            user.save(update_fields=['last_login'])
            response.data.update({
                'user_id': user.pk,
                'username': user.username,
                'is_admin': user.is_admin,
                'role': user.role,
                'permissions': {
                    'add': user.has_perm_add(),
                    'edit': user.has_perm_edit(),
                    'delete': user.has_perm_delete(),
                    'manage': user.has_perm_manage(),
                },
            })

        return response


class LogoutView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        # Deleting an already expired/missing token must not turn logout into
        # a 500 error.  The browser clears its local token either way.
        auth_token = getattr(request, 'auth', None)
        if auth_token is not None:
            try:
                auth_token.delete()
            except Exception:
                pass

        user = getattr(request, 'user', None)
        if user is not None and getattr(user, 'is_authenticated', False):
            Token.objects.filter(user=user).delete()

        return Response({'detail': 'Logged out successfully.'})


class VerifyTokenView(APIView):
    # authentication_classes = [TokenAuthentication]
    # permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        data = {
            'id': user.id,
            'username': user.username,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
            'is_admin': getattr(user, 'is_admin', False),
            'role': getattr(user, 'role', 'user'),
            'permissions': {
                'add': getattr(user, 'has_perm_add', lambda: False)(),
                'edit': getattr(user, 'has_perm_edit', lambda: False)(),
                'delete': getattr(user, 'has_perm_delete', lambda: False)(),
                'manage': getattr(user, 'has_perm_manage', lambda: False)(),
            },
        }
        return Response({'user': data}, status=status.HTTP_200_OK)


class DashboardView(APIView):
    # authentication_classes = [TokenAuthentication]
    # permission_classes = [IsAuthenticated]

    def get(self, request):
        total_clients = Client.objects.count()
        total_resellers = Reseller.objects.count()
        total_gpons = Gpon.objects.count()
        total_tj_boxes = TJBox.objects.count()
        total_pop = POP.objects.count()
        total_cables = Cable.objects.count()
        return Response(data={
            'total_clients': total_clients,
            'total_gpons': total_gpons,
            'total_tj_boxes': total_tj_boxes,
            'total_pop': total_pop,
            'total_cables': total_cables,
            'total_resellers': total_resellers

        }, status=status.HTTP_200_OK)


SYSTEM_CATEGORY_DEFAULTS = (
    ('POP', 'POP', 'building', '#2563eb', 10),
    ('CLIENT', 'Client', 'user', '#16a34a', 20),
    ('TJ_BOX', 'TJ Box', 'inbox', '#f59e0b', 30),
    ('RESELLER', 'Reseller', 'shop', '#9333ea', 40),
)

SYSTEM_CATEGORY_MODELS = {
    'POP': POP,
    'CLIENT': Client,
    'TJ_BOX': TJBox,
    'RESELLER': Reseller,
}


def _system_category_count(category):
    model = SYSTEM_CATEGORY_MODELS.get(category.key)
    return model.objects.count() if model is not None else 0


class NetworkCategoryListView(generics.ListAPIView):
    """List the Network Point categories used by both management and React."""

    queryset = NetworkCategory.objects.all()
    serializer_class = NetworkCategorySerializer
    permission_classes = (IsAuthenticated,)


class NetworkCategoryCreateView(generics.CreateAPIView):
    queryset = NetworkCategory.objects.all()
    serializer_class = NetworkCategorySerializer
    permission_classes = (IsAuthenticated, permissions.CanManageUsers)

    def perform_create(self, serializer):
        # ``sort_order`` has a model default, so ``validated_data`` always
        # contains 100 and a new category would never be appended at the end.
        # Only honour an explicit value supplied by the client.
        supplied = self.request.data.get('sort_order') if hasattr(self.request, 'data') else None
        if supplied in (None, ''):
            last = NetworkCategory.objects.order_by('-sort_order').first()
            serializer.save(sort_order=(last.sort_order + 10) if last else 100)
        else:
            serializer.save()


class NetworkCategoryUpdateView(generics.RetrieveUpdateAPIView):
    lookup_field = 'id'
    queryset = NetworkCategory.objects.all()
    serializer_class = NetworkCategorySerializer
    permission_classes = (IsAuthenticated, permissions.CanManageUsers)


class NetworkCategoryDeleteView(APIView):
    permission_classes = (IsAuthenticated, permissions.CanManageUsers)

    def delete(self, request, pk):
        try:
            category = NetworkCategory.objects.get(pk=pk)
        except NetworkCategory.DoesNotExist:
            return Response({'detail': 'Category not found.'}, status=status.HTTP_404_NOT_FOUND)

        if category.is_system:
            count = _system_category_count(category)
            if count:
                return Response(
                    {'detail': f'{category.label} still has {count} record(s). Delete or move those records first.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        category.delete()
        return Response({'detail': 'Category deleted.'}, status=status.HTTP_200_OK)


class NetworkCategoryRestoreView(APIView):
    permission_classes = (IsAuthenticated, permissions.CanManageUsers)

    def post(self, request):
        created = []
        for key, label, icon, color, order in SYSTEM_CATEGORY_DEFAULTS:
            category, was_created = NetworkCategory.objects.get_or_create(
                key=key,
                defaults={
                    'label': label,
                    'icon': icon,
                    'color': color,
                    'sort_order': order,
                    'is_system': True,
                },
            )
            if was_created:
                created.append(key)
        return Response({'created': created, 'detail': 'Default categories restored.'})


class CustomPointListView(generics.ListAPIView):
    serializer_class = CustomNetworkPointSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        qs = CustomNetworkPoint.objects.select_related('category', 'zone', 'subzone').all()
        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category_id=category)
        return qs


class CustomPointCreateView(generics.CreateAPIView):
    queryset = CustomNetworkPoint.objects.all()
    serializer_class = CustomNetworkPointSerializer
    permission_classes = (IsAuthenticated, permissions.CanAddData)


class CustomPointUpdateView(generics.RetrieveUpdateAPIView):
    lookup_field = 'id'
    queryset = CustomNetworkPoint.objects.all()
    serializer_class = CustomNetworkPointSerializer
    permission_classes = (IsAuthenticated, permissions.CanEditData)


class CustomPointDeleteView(APIView):
    permission_classes = (IsAuthenticated, permissions.CanDeleteData)

    def delete(self, request, pk):
        try:
            point = CustomNetworkPoint.objects.get(pk=pk)
        except CustomNetworkPoint.DoesNotExist:
            return Response({'detail': 'Record not found.'}, status=status.HTTP_404_NOT_FOUND)
        point.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PopCreateView(generics.CreateAPIView):
    serializer_class = POPCreateSerializer
    # authentication_classes = [TokenAuthentication]
    # permission_classes = [IsAuthenticated]


class PopListView(generics.ListAPIView):
    queryset = POP.objects.select_related('marker').all()
    serializer_class = POPListSerializer
    # authentication_classes = [TokenAuthentication]
    # permission_classes = [IsAuthenticated]


class PopUpdateView(generics.RetrieveUpdateAPIView):
    lookup_field = 'id'
    queryset = POP.objects.all()
    serializer_class = POPUpdateSerializer
    # authentication_classes = [TokenAuthentication]
    # permission_classes = [IsAuthenticated]


class PopDeleteView(APIView):
    # authentication_classes = [TokenAuthentication]
    # permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            pop = POP.objects.get(pk=pk)
            pop.marker.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except POP.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)


class ResellerCreateView(generics.CreateAPIView):
    serializer_class = ResellerCreateSerializer
    # authentication_classes = [TokenAuthentication]
    # permission_classes = [IsAuthenticated]


class ResellerListView(generics.ListAPIView):
    queryset = Reseller.objects.select_related('marker').all()
    serializer_class = ResellerListSerializer
    # authentication_classes = [TokenAuthentication]
    # permission_classes = [IsAuthenticated]


class ResellerUpdateView(generics.RetrieveUpdateAPIView):
    lookup_field = 'id'
    queryset = Reseller.objects.all()
    serializer_class = ResellerUpdateSerializer
    # authentication_classes = [TokenAuthentication]
    # permission_classes = [IsAuthenticated]


class ResellerDeleteView(APIView):
    # authentication_classes = [TokenAuthentication]
    # permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            reseller = Reseller.objects.get(pk=pk)
            reseller.marker.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Reseller.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)


class ResellerPathsView(APIView):
    # authentication_classes = [TokenAuthentication]
    # permission_classes = [IsAuthenticated]

    def get(self, request, reseller_id):
        try:
            reseller = Reseller.objects.get(id=reseller_id)
        except Reseller.DoesNotExist:
            return Response({'error': 'Reseller not found'}, status=status.HTTP_404_NOT_FOUND)

        cores = Core.objects.filter(marker=reseller.marker, assigned=True)
        return Response(_serialize_core_paths(cores))


class ResellerCoresDetailsAPIView(APIView):
    # authentication_classes = [TokenAuthentication]
    # permission_classes = [IsAuthenticated]

    def get(self, request, reseller_id):
        try:
            reseller = Reseller.objects.get(id=reseller_id)
        except Reseller.DoesNotExist:
            return Response({'error': 'Reseller not found'}, status=status.HTTP_404_NOT_FOUND)

        cores = Core.objects.filter(marker=reseller.marker)
        cables = set(core.cable for core in cores if core.cable is not None)

        serialized_data = []
        for cable in cables:
            serialized_cable = CableSerializer(cable).data
            serialized_cable['cores'] = ResellerCoreSerializer(cores.filter(cable=cable), many=True).data
            serialized_data.append(serialized_cable)

        return Response(serialized_data)


class ClientCreateView(generics.CreateAPIView):
    serializer_class = ClientCreateSerializer
    # authentication_classes = [TokenAuthentication]
    # permission_classes = [IsAuthenticated]


class ClientListView(generics.ListAPIView):
    queryset = Client.objects.select_related('marker').all()
    serializer_class = ClientListSerializer
    # authentication_classes = [TokenAuthentication]
    # permission_classes = [IsAuthenticated]


class ClientUpdateView(generics.RetrieveUpdateAPIView):
    lookup_field = 'id'
    queryset = Client.objects.all()
    serializer_class = ClientUpdateSerializer
    # authentication_classes = [TokenAuthentication]
    # permission_classes = [IsAuthenticated]


class ClientDeleteView(APIView):
    # authentication_classes = [TokenAuthentication]
    # permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            client = Client.objects.get(pk=pk)
            client.marker.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Client.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)


class ClientPathsView(APIView):
    # authentication_classes = [TokenAuthentication]
    # permission_classes = [IsAuthenticated]

    def get(self, request, client_id):
        try:
            client = Client.objects.get(id=client_id)
        except Client.DoesNotExist:
            return Response({'error': 'Client not found'}, status=status.HTTP_404_NOT_FOUND)

        cores = Core.objects.filter(marker=client.marker, assigned=True)
        return Response(_serialize_core_paths(cores))


class ClientCoresDetailsAPIView(APIView):
    # authentication_classes = [TokenAuthentication]
    # permission_classes = [IsAuthenticated]

    def get(self, request, client_id):
        try:
            client = Client.objects.get(id=client_id)
        except Client.DoesNotExist:
            return Response({'error': 'Client not found'}, status=status.HTTP_404_NOT_FOUND)

        cores = Core.objects.filter(marker=client.marker)
        cables = set(core.cable for core in cores if core.cable is not None)

        serialized_data = []
        for cable in cables:
            serialized_cable = CableSerializer(cable).data
            serialized_cable['cores'] = ClientCoreSerializer(cores.filter(cable=cable), many=True).data
            serialized_data.append(serialized_cable)

        return Response(serialized_data)


class TJBoxCreateView(generics.CreateAPIView):
    serializer_class = TJBoxCreateSerializer
    # authentication_classes = [TokenAuthentication]
    # permission_classes = [IsAuthenticated]


class TJBoxListView(generics.ListAPIView):
    queryset = TJBox.objects.select_related('marker').all()
    serializer_class = TJBoxListSerializer
    # authentication_classes = [TokenAuthentication]
    # permission_classes = [IsAuthenticated]


class TJBoxUpdateView(generics.RetrieveUpdateAPIView):
    lookup_field = 'id'
    queryset = TJBox.objects.all()
    serializer_class = TJBoxUpdateSerializer
    # authentication_classes = [TokenAuthentication]
    # permission_classes = [IsAuthenticated]


class TJBoxDeleteView(APIView):
    # authentication_classes = [TokenAuthentication]
    # permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            tj_box = TJBox.objects.get(pk=pk)
            tj_box.marker.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except TJBox.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)


class GponCreateView(generics.CreateAPIView):
    serializer_class = GponCreateSerializer
    # authentication_classes = [TokenAuthentication]
    # permission_classes = [IsAuthenticated]


class GponListView(generics.ListAPIView):
    queryset = Gpon.objects.all()
    serializer_class = GponListSerializer
    # authentication_classes = [TokenAuthentication]
    # permission_classes = [IsAuthenticated]


class GponUpdateView(generics.RetrieveUpdateAPIView):
    lookup_field = 'id'
    queryset = Gpon.objects.all()
    serializer_class = GponUpdateSerializer
    # authentication_classes = [TokenAuthentication]
    # permission_classes = [IsAuthenticated]


class GponDeleteView(APIView):
    # authentication_classes = [TokenAuthentication]
    # permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            gpon = Gpon.objects.get(pk=pk)
            # The GPON marker is shared with the TJ box, so never delete it.
            # Clearing the FK first avoids the Cable deletion cascade deleting
            # the GPON (input_cable uses CASCADE in the legacy schema).
            with transaction.atomic():
                Gpon.objects.filter(pk=gpon.pk).update(input_cable=None, input_core=None)
                gpon.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Gpon.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)


class CableCreateView(generics.CreateAPIView):
    serializer_class = CableCreateSerializer
    # authentication_classes = [TokenAuthentication]
    # permission_classes = [IsAuthenticated]


class CableListView(generics.ListAPIView):
    queryset = Cable.objects.all()
    serializer_class = CableListSerializer
    # authentication_classes = [TokenAuthentication]
    # permission_classes = [IsAuthenticated]


class CableUpdateView(generics.RetrieveUpdateAPIView):
    lookup_field = 'id'
    queryset = Cable.objects.all()
    serializer_class = CableUpdateSerializer
    # authentication_classes = [TokenAuthentication]
    # permission_classes = [IsAuthenticated]


class CableDeleteView(APIView):
    # authentication_classes = [TokenAuthentication]
    # permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            cable = Cable.objects.get(pk=pk)
            with transaction.atomic():
                Gpon.objects.filter(input_cable=cable).update(input_cable=None)
                _detach_gpon_input_cores(
                    Core.objects.filter(cable=cable).values_list('id', flat=True)
                )
                cable.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Cable.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)


class CoreAssignView(generics.UpdateAPIView):
    queryset = Core.objects.all()
    serializer_class = CoreAssignSerializer
    # authentication_classes = [TokenAuthentication]
    # permission_classes = [IsAuthenticated]


class TJBoxCoresDetailsAPIView(APIView):
    # authentication_classes = [TokenAuthentication]
    # permission_classes = [IsAuthenticated]

    def get(self, request, tj_box_id):
        try:
            tj_box = TJBox.objects.get(id=tj_box_id)
        except TJBox.DoesNotExist:
            return Response({'error': 'TJ Box not found'}, status=status.HTTP_404_NOT_FOUND)

        cores = Core.objects.filter(marker=tj_box.marker).exclude(cable=None)
        cables = set(core.cable for core in cores)

        serialized_data = []
        for cable in cables:
            serialized_cable = CableSerializer(cable).data
            serialized_cable['cores'] = TJBoxCoreSerializer(cores.filter(cable=cable), many=True).data
            serialized_data.append(serialized_cable)

        splitters = []
        for gpon in Gpon.objects.filter(tj_box=tj_box):
            gpon_out_details = {
                'number_of_splitter': gpon.splitter,
                'input_core_id': gpon.input_core.id if gpon.input_core else None,
                'splitter_type': gpon.name,
                'output_cores': []
            }

            gpon_cores = Core.objects.filter(marker=gpon.marker, splitter=gpon)
            # core_number 0 is the GPON input core, not a splitter output.
            gpon_out_cores = gpon_cores.filter(cable=None).exclude(core_number=0).order_by('core_number')
            for core in gpon_out_cores:
                gpon_out_details['output_cores'].append(GponOutCoreSerializer(core).data)
            splitters.append(gpon_out_details)

        data = {
            'splitters': splitters,
            'cables': serialized_data
        }
        return Response(data)


class GponCoresDetailsAPIView(APIView):
    # authentication_classes = [TokenAuthentication]
    # permission_classes = [IsAuthenticated]

    def get(self, request, gpon_id):
        try:
            gpon = Gpon.objects.get(id=gpon_id)
        except Gpon.DoesNotExist:
            return Response({'error': 'Gpon not found'}, status=status.HTTP_404_NOT_FOUND)

        cores = Core.objects.filter(marker=gpon.marker)
        cables = set(core.cable for core in cores if core.cable is not None)

        input_cable = gpon.input_cable
        gpon_input_cable_data = None
        if input_cable is not None:
            # ``discard`` instead of ``remove``: a cable can be linked as the
            # input cable even when no core at this marker references it (for
            # example after importing an older dump), and ``set.remove`` used to
            # raise KeyError (HTTP 500) in that case.
            cables.discard(input_cable)
            serialized_cable = CableSerializer(input_cable).data
            serialized_cable['cores'] = GponCableCoreSerializer(cores.filter(cable=input_cable), many=True).data
            gpon_input_cable_data = serialized_cable

        gpon_out_details = {
            'number_of_splitter': gpon.splitter,
            'input_core_id': gpon.input_core.id if gpon.input_core else None,
            'output_cores': []
        }
        gpon_out_cores = cores.filter(cable=None).exclude(core_number=0)
        for core in gpon_out_cores:
            gpon_out_details['output_cores'].append(GponOutCoreSerializer(core).data)

        gpon_output_cable_data = []

        for cable in cables:
            serialized_cable = CableSerializer(cable).data
            serialized_cable['cores'] = GponCableCoreSerializer(cores.filter(cable=cable), many=True).data
            gpon_output_cable_data.append(serialized_cable)

        data = {
            'type': gpon.name,
            'input_cable': gpon_input_cable_data,
            'out': gpon_out_details,
            'output_cables': gpon_output_cable_data
        }
        return Response(data)


class AddGponInputCable(APIView):
    # authentication_classes = [TokenAuthentication]
    # permission_classes = [IsAuthenticated]

    def post(self, request, gpon_id):
        data = request.data
        try:
            gpon = Gpon.objects.get(id=gpon_id)
            cable_id = data['cable_id']

        except Gpon.DoesNotExist:
            return Response({'error': 'Gpon not found'}, status=status.HTTP_404_NOT_FOUND)
        except KeyError:
            return Response({'error': 'cable_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        if gpon.input_cable is not None:
            return Response({'error': 'Gpon already has an input cable'}, status=status.HTTP_400_BAD_REQUEST)

        cables = Cable.objects.filter(Q(starting_point=gpon.marker) | Q(ending_point=gpon.marker))
        cable = cables.filter(id=cable_id).first()

        if cable is None:
            return Response({'error': 'Invalid cable'}, status=status.HTTP_400_BAD_REQUEST)

        cores = Core.objects.filter(marker=gpon.marker, cable=cable)
        for core in cores:
            connected_to = self.get_connected_to(core)
            if connected_to is not None:
                return Response({'error': 'Disconnect connected cores first to add as input cable'},
                                status=status.HTTP_400_BAD_REQUEST)

        gpon.input_cable = cable
        gpon.save()
        return Response({'success': 'Gpon input cable added'}, status=status.HTTP_200_OK)

    def get_connected_to(self, obj):
        connection = Connection.objects.filter(core_from=obj)
        for conn in connection:
            if conn.core_to.cable is None:
                return {'id': conn.core_to.id}
        return None


class RemoveGponInputCable(APIView):
    # authentication_classes = [TokenAuthentication]
    # permission_classes = [IsAuthenticated]

    def post(self, request, gpon_id):
        return self._remove(gpon_id)

    def get(self, request, gpon_id):
        # Kept for backwards compatibility with older builds that used GET.
        return self._remove(gpon_id)

    def _remove(self, gpon_id):
        try:
            gpon = Gpon.objects.get(id=gpon_id)
        except Gpon.DoesNotExist:
            return Response({'error': 'Gpon not found'}, status=status.HTTP_404_NOT_FOUND)

        if gpon.input_cable is None:
            return Response({'error': 'Gpon does not have an input cable'}, status=status.HTTP_400_BAD_REQUEST)

        input_cores = Core.objects.filter(marker=gpon.marker, cable=gpon.input_cable)
        for cr in input_cores:
            connected_to = self.get_connected_to(cr)
            if connected_to is not None:
                return Response({'error': 'Disconnect assigned core first to remove input cable'},
                                status=status.HTTP_400_BAD_REQUEST)

        gpon.input_cable = None
        gpon.save()
        return Response({'success': 'Gpon input cable removed'}, status=status.HTTP_200_OK)

    def get_connected_to(self, core):
        connection = Connection.objects.filter(core_from=core)
        for conn in connection:
            if conn.core_to.cable is None:
                return {'id': conn.core_to.id}
        return None


class GponInputCoreAssignView(APIView):
    # authentication_classes = [TokenAuthentication]
    # permission_classes = [IsAuthenticated]

    def post(self, request, gpon_id):
        data = request.data

        try:
            gpon = Gpon.objects.get(id=gpon_id)
            core_id = data['core_id']
        except Gpon.DoesNotExist:
            return Response({'error': 'Gpon not found'}, status=status.HTTP_404_NOT_FOUND)
        except KeyError:
            return Response({'error': 'core_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        if gpon.input_cable is None:
            return Response({'error': 'Gpon does not have an input cable'}, status=status.HTTP_400_BAD_REQUEST)
        if gpon.input_core is None:
            return Response({'error': 'Gpon does not have an input core'}, status=status.HTTP_400_BAD_REQUEST)

        input_cores = Core.objects.filter(marker=gpon.marker, cable=gpon.input_cable)
        core = input_cores.filter(id=core_id).first()
        if core is None:
            return Response({'error': 'Invalid Core to assign'}, status=status.HTTP_400_BAD_REQUEST)

        for cr in input_cores:
            connected_to = self.get_connected_to(cr)
            if connected_to is not None:
                return Response({'error': 'Core already connected'}, status=status.HTTP_400_BAD_REQUEST)

        Connection.objects.create(
            core_from=gpon.input_core,
            core_to=core
        )
        Connection.objects.create(
            core_from=core,
            core_to=gpon.input_core
        )
        return Response({'success': 'Core assigned'}, status=status.HTTP_200_OK)

    def get_connected_to(self, core):
        connection = Connection.objects.filter(core_from=core)
        for conn in connection:
            if conn.core_to.cable is None:
                return {'id': conn.core_to.id}
        return None


class GponInputCoreWithdrawView(APIView):
    # authentication_classes = [TokenAuthentication]
    # permission_classes = [IsAuthenticated]

    def post(self, request, gpon_id):
        try:
            gpon = Gpon.objects.get(id=gpon_id)
        except Gpon.DoesNotExist:
            return Response({'error': 'Gpon not found'}, status=status.HTTP_404_NOT_FOUND)

        if gpon.input_cable is None:
            return Response({'error': 'Gpon does not have an input cable'}, status=status.HTTP_400_BAD_REQUEST)

        data = request.data

        try:
            core_id = data['core_id']
            core = Core.objects.get(id=core_id)
        except KeyError:
            return Response({'error': 'core_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        except Core.DoesNotExist:
            return Response({'error': 'Core not found'}, status=status.HTTP_404_NOT_FOUND)

        left = Connection.objects.filter(core_from=core, core_to=gpon.input_core).first()
        right = Connection.objects.filter(core_from=gpon.input_core, core_to=core).first()

        if left:
            left.delete()
        if right:
            right.delete()

        return Response({'success': 'Core assigned'}, status=status.HTTP_200_OK)


class PopCoresDetailsAPIView(APIView):
    # authentication_classes = [TokenAuthentication]
    # permission_classes = [IsAuthenticated]

    def get(self, request, pop_id):
        try:
            pop = POP.objects.get(id=pop_id)
        except POP.DoesNotExist:
            return Response({'error': 'POP not found'}, status=status.HTTP_404_NOT_FOUND)

        cores = Core.objects.filter(marker=pop.marker)
        cables = set(core.cable for core in cores if core.cable is not None)

        serialized_data = []
        for cable in cables:
            serialized_cable = CableSerializer(cable).data
            serialized_cable['cores'] = PopCoreSerializer(cores.filter(cable=cable), many=True).data
            serialized_data.append(serialized_cable)

        return Response(serialized_data)


class PopPathsView(APIView):
    # authentication_classes = [TokenAuthentication]
    # permission_classes = [IsAuthenticated]

    def get(self, request, pop_id):
        try:
            pop = POP.objects.get(id=pop_id)
        except POP.DoesNotExist:
            return Response({'error': 'Pop not found'}, status=status.HTTP_404_NOT_FOUND)

        cores = Core.objects.filter(marker=pop.marker, assigned=True)
        return Response(_serialize_core_paths(cores))


class ConnectCoresAPIView(generics.CreateAPIView):
    serializer_class = ConnectCoresSerializer
    # authentication_classes = [TokenAuthentication]
    # permission_classes = [IsAuthenticated]


class DisConnectCoresAPIView(APIView):
    # authentication_classes = [TokenAuthentication]
    # permission_classes = [IsAuthenticated]

    def post(self, request, format=None):
        data = request.data

        try:
            core_from_id = data['core_from']
            core_to_id = data['core_to']
            core_from = Core.objects.get(id=core_from_id)
            core_to = Core.objects.get(id=core_to_id)
        except KeyError:
            return Response({'error': 'core_from and core_to is required'}, status=status.HTTP_400_BAD_REQUEST)
        except Core.DoesNotExist:
            return Response({'error': 'Core not found'}, status=status.HTTP_404_NOT_FOUND)

        left = Connection.objects.filter(core_from=core_from, core_to=core_to).first()
        right = Connection.objects.filter(core_from=core_to, core_to=core_from).first()

        if left:
            left.delete()
        if right:
            right.delete()

        return Response({"status": "delete success"}, status=status.HTTP_204_NO_CONTENT)


class CableCutAPIView(APIView):
    # authentication_classes = [TokenAuthentication]
    # permission_classes = [IsAuthenticated]

    def post(self, request, cable_id):
        data = request.data
        try:
            cable = Cable.objects.get(id=cable_id)
        except Cable.DoesNotExist:
            return Response({'error': 'Cable not found'}, status=status.HTTP_404_NOT_FOUND)

        divider_point = data.get('divider_point')
        push_index = data.get('push_index')
        tjbox_id = str(data.get('tjbox_id') or '').strip()
        tjbox_name = str(data.get('tjbox_name') or '').strip()

        if not tjbox_id or not tjbox_name:
            return Response({'error': 'tjbox_id and tjbox_name are required'},
                            status=status.HTTP_400_BAD_REQUEST)
        if not isinstance(divider_point, (list, tuple)) or len(divider_point) != 2:
            return Response({'error': 'divider_point must be [latitude, longitude]'},
                            status=status.HTTP_400_BAD_REQUEST)
        try:
            divider_lat = float(divider_point[0])
            divider_lng = float(divider_point[1])
        except (TypeError, ValueError):
            return Response({'error': 'divider_point must contain numbers'},
                            status=status.HTTP_400_BAD_REQUEST)
        if not (-90 <= divider_lat <= 90 and -180 <= divider_lng <= 180):
            return Response({'error': 'divider_point is outside the valid coordinate range'},
                            status=status.HTTP_400_BAD_REQUEST)

        polyline = cable.get_polyline()
        if len(polyline) < 2:
            return Response({'error': 'Cable has no polyline to cut'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            push_index = int(push_index)
        except (TypeError, ValueError):
            return Response({'error': 'push_index must be an integer'}, status=status.HTTP_400_BAD_REQUEST)
        # The cut point must leave at least one segment on each side.
        if push_index < 0 or push_index >= len(polyline) - 1:
            return Response({'error': 'push_index is outside the cable polyline'},
                            status=status.HTTP_400_BAD_REQUEST)

        divider = {'lat': divider_lat, 'lng': divider_lng}
        first_half = polyline[:push_index + 1] + [divider]
        second_half = [divider] + polyline[push_index + 1:]
        left_length, right_length = _split_cable_length(cable.length, first_half, second_half)

        with transaction.atomic():
            marker = Marker.objects.create(
                identifier=tjbox_id,
                type=MarkerType.TJ_BOX,
                latitude=divider_lat,
                longitude=divider_lng,
            )
            TJBox.objects.create(
                identifier=tjbox_id,
                name=tjbox_name,
                marker=marker,
                zone=cable.zone,
                subzone=cable.subzone,
            )

            left_cable = Cable.objects.create(
                identifier=cable.identifier,
                type=cable.type,
                start_from=cable.start_from,
                starting_point=cable.starting_point,
                end_to=MarkerType.TJ_BOX,
                ending_point=marker,
                number_of_cores=cable.number_of_cores,
                length=left_length,
                notes=cable.notes,
                description=cable.description,
                polyline=json.dumps(first_half),
                zone=cable.zone,
                subzone=cable.subzone,
            )
            right_cable = Cable.objects.create(
                identifier=cable.identifier,
                type=cable.type,
                start_from=MarkerType.TJ_BOX,
                starting_point=marker,
                end_to=cable.end_to,
                ending_point=cable.ending_point,
                number_of_cores=cable.number_of_cores,
                length=right_length,
                notes=cable.notes,
                description=cable.description,
                polyline=json.dumps(second_half),
                zone=cable.zone,
                subzone=cable.subzone,
            )

            starting_point_cores = list(
                Core.objects.filter(cable=cable, marker=cable.starting_point).order_by('core_number')
            )
            ending_point_cores = list(
                Core.objects.filter(cable=cable, marker=cable.ending_point).order_by('core_number')
            )

            for core in starting_point_cores:
                core.cable = left_cable
                core.save(update_fields=['cable'])
            for core in ending_point_cores:
                core.cable = right_cable
                core.save(update_fields=['cable'])

            for starting_core, ending_core in zip(starting_point_cores, ending_point_cores):
                conn_left_to_right = Connection.objects.filter(core_from=starting_core,
                                                               core_to=ending_core).first()
                if conn_left_to_right is not None:
                    left_cable_core_for_tj = Core.objects.create(
                        marker=marker,
                        cable=left_cable,
                        core_number=conn_left_to_right.core_from.core_number,
                        color=conn_left_to_right.core_from.color,
                        assigned=False
                    )

                    conn_left_to_right.core_to = left_cable_core_for_tj
                    conn_left_to_right.save(update_fields=['core_to'])

                    Connection.objects.create(core_from=left_cable_core_for_tj, core_to=conn_left_to_right.core_from)

                conn_right_to_left = Connection.objects.filter(core_from=ending_core,
                                                               core_to=starting_core).first()

                if conn_right_to_left is not None:
                    right_cable_core_for_tj = Core.objects.create(
                        marker=marker,
                        cable=right_cable,
                        core_number=conn_right_to_left.core_from.core_number,
                        color=conn_right_to_left.core_from.color,
                        assigned=False
                    )

                    conn_right_to_left.core_to = right_cable_core_for_tj
                    conn_right_to_left.save(update_fields=['core_to'])

                    Connection.objects.create(core_from=right_cable_core_for_tj, core_to=conn_right_to_left.core_from)

            # Keep GPON input cable links pointing at the correct side after the cut.
            for gpon in Gpon.objects.filter(input_cable=cable):
                if gpon.marker_id == cable.ending_point_id:
                    gpon.input_cable = right_cable
                else:
                    gpon.input_cable = left_cable
                gpon.save(update_fields=['input_cable'])

            # Cores of the original cable are about to disappear with it.
            _detach_gpon_input_cores(
                Core.objects.filter(cable=cable).values_list('id', flat=True)
            )
            cable.delete()

        return Response({"status": "cable cut success"}, status=status.HTTP_200_OK)


class ZoneCreateView(generics.CreateAPIView):
    serializer_class = ZoneCreateSerializer


class ZoneListView(generics.ListAPIView):
    queryset = Zone.objects.all()
    serializer_class = ZoneListSerializer


class ZoneUpdateView(generics.RetrieveUpdateAPIView):
    lookup_field = 'id'
    queryset = Zone.objects.all()
    serializer_class = ZoneUpdateSerializer


class ZoneDeleteView(APIView):
    def delete(self, request, pk):
        try:
            zone = Zone.objects.get(pk=pk)
            zone.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Zone.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)


class SubZoneCreateView(generics.CreateAPIView):
    serializer_class = SubZoneCreateSerializer


class SubZoneListView(generics.ListAPIView):
    queryset = SubZone.objects.all()
    serializer_class = SubZoneListSerializer


class SubZoneUpdateView(generics.RetrieveUpdateAPIView):
    lookup_field = 'id'
    queryset = SubZone.objects.all()
    serializer_class = SubZoneUpdateSerializer


class SubZoneDeleteView(APIView):
    def delete(self, request, pk):
        try:
            subzone = SubZone.objects.get(pk=pk)
            subzone.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except SubZone.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)


class ManagerUserViewSets(viewsets.ModelViewSet):
    queryset = ManagerUser.objects.all()
    serializer_class = ManagerUserSerializer
    permission_classes = (permissions.CanManageUsers,)

    def perform_create(self, serializer):
        serializer.save(role='manager', user_type='manager', is_manager=True,
                        can_manage_users=True, can_delete_data=True)


# ---------------------------------------------------------------------------
# Permission wiring
#
# DRF's default is IsAuthenticated.  Create/update/delete endpoints add the
# granular permissions from UserProfile so administrators only have to untick a
# box to reduce a user's rights.  Staff/superusers (and role=admin) always pass.
# ---------------------------------------------------------------------------

ADD_DATA_VIEWS = (
    PopCreateView, ResellerCreateView, ClientCreateView, TJBoxCreateView,
    GponCreateView, CableCreateView,
)

EDIT_DATA_VIEWS = (
    PopUpdateView, ResellerUpdateView, ClientUpdateView, TJBoxUpdateView,
    GponUpdateView, CableUpdateView, CoreAssignView, ConnectCoresAPIView,
    DisConnectCoresAPIView, AddGponInputCable, RemoveGponInputCable,
    GponInputCoreAssignView, GponInputCoreWithdrawView, CableCutAPIView,
)

DELETE_DATA_VIEWS = (
    PopDeleteView, ResellerDeleteView, ClientDeleteView, TJBoxDeleteView,
    GponDeleteView, CableDeleteView,
)

for _view in ADD_DATA_VIEWS:
    _view.permission_classes = (IsAuthenticated, permissions.CanAddData)

for _view in EDIT_DATA_VIEWS:
    _view.permission_classes = (IsAuthenticated, permissions.CanEditData)

for _view in DELETE_DATA_VIEWS:
    _view.permission_classes = (IsAuthenticated, permissions.CanDeleteData)

# Zones and sub-zones are shared reference data. Every authenticated portal user
# may add or edit them so they can organise clients, resellers and TJ boxes even
# when their data permissions are limited.
for _view in (
    ZoneListView, ZoneCreateView, ZoneUpdateView, ZoneDeleteView,
    SubZoneListView, SubZoneCreateView, SubZoneUpdateView, SubZoneDeleteView,
):
    _view.permission_classes = (IsAuthenticated,)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def geocode_search(request):
    """Proxy OpenStreetMap Nominatim searches for the map search box.

    Keeping this request on the server avoids browser CORS restrictions and
    lets every query carry a proper identifying User-Agent.  Results near the
    current map centre are preferred; Bangladesh results are ranked first by
    the frontend.
    """
    query = (request.query_params.get("q") or "").strip()
    if len(query) < 2:
        return Response(
            {"detail": "Enter at least two characters to search."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if len(query) > 200:
        query = query[:200]

    try:
        latitude = float(request.query_params.get("lat"))
        longitude = float(request.query_params.get("lng"))
    except (TypeError, ValueError):
        latitude, longitude = 23.8103, 90.4125
    if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
        latitude, longitude = 23.8103, 90.4125

    query_hash = hashlib.sha256(query.lower().encode("utf-8")).hexdigest()
    cache_key = f"nominatim:{latitude:.3f}:{longitude:.3f}:{query_hash}"
    cached = cache.get(cache_key)
    if cached is not None:
        return Response(cached)

    delta = 2.5
    viewbox = (
        f"{longitude - delta},{latitude - delta},"
        f"{longitude + delta},{latitude + delta}"
    )
    params = urlencode(
        {
            "q": query,
            "format": "jsonv2",
            "addressdetails": "1",
            "limit": "10",
            "viewbox": viewbox,
            "bounded": "0",
            "accept-language": "en",
        }
    )
    request_headers = {
        "User-Agent": "fiber-map/1.0 (+https://github.com/johirxofficial/fiber-map)",
        "Accept": "application/json",
        "Accept-Language": "en",
    }
    try:
        nominatim_request = Request(
            f"https://nominatim.openstreetmap.org/search?{params}",
            headers=request_headers,
        )
        with urlopen(nominatim_request, timeout=8) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except (HTTPError, URLError, TimeoutError, ValueError):
        return Response(
            {"detail": "Location search is temporarily unavailable."},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    if not isinstance(payload, list):
        return Response([])

    fields = ("place_id", "lat", "lon", "display_name", "name", "type", "class", "address")
    results = [
        {field: item.get(field) for field in fields}
        for item in payload
        if isinstance(item, dict)
    ]
    cache.set(cache_key, results, 3600)
    return Response(results)
