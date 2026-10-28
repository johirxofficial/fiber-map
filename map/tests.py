"""Regression tests for the fiber-map API.

Run with the SQLite test settings so no MySQL server is required::

    python manage.py test --settings=fibermap.test_settings
"""
from django.test import TestCase
from rest_framework.test import APIClient

from .models import (Cable, Client, Connection, Core, Gpon, Marker, MarkerType,
                     NetworkCategory, POP, SiteSettings, TJBox, UserProfile, Zone)
from .utility import find_core_paths


class ApiTestCase(TestCase):
    """Shared fixtures: an administrator, a normal user and map markers."""

    def setUp(self):
        self.admin = UserProfile.objects.create_user(
            username='admin', password='admin-pass-123', is_staff=True, is_superuser=True,
        )
        self.admin.role = 'admin'
        self.admin.user_type = 'admin'
        self.admin.save()

        self.user = UserProfile.objects.create_user(
            username='operator', password='operator-pass-123',
        )

        self.api = APIClient()
        self.api.force_authenticate(user=self.admin)

        self.zone = Zone.objects.create(name='Zone A', identifier='ZA')
        self.pop = self.make_pop('POP-1', 23.8103, 90.4125)
        self.client_model = self.make_client('Client-1', 23.8203, 90.4225)

    # -- helpers ---------------------------------------------------------
    def make_marker(self, latitude, longitude, marker_type=MarkerType.POP, identifier=''):
        return Marker.objects.create(
            identifier=identifier,
            type=marker_type,
            latitude=latitude,
            longitude=longitude,
            address='Test address',
        )

    def make_pop(self, name, latitude, longitude):
        marker = self.make_marker(latitude, longitude, MarkerType.POP, name)
        return POP.objects.create(
            identifier=name, name=name, marker=marker, pop_type='OLT', zone=self.zone,
        )

    def make_client(self, name, latitude, longitude):
        marker = self.make_marker(latitude, longitude, MarkerType.CLIENT, name)
        return Client.objects.create(
            identifier=name, name=name, marker=marker, mobile_number='01700000000', zone=self.zone,
        )

    def make_tj_box(self, name, latitude, longitude):
        marker = self.make_marker(latitude, longitude, MarkerType.TJ_BOX, name)
        return TJBox.objects.create(
            identifier=name, name=name, marker=marker, zone=self.zone,
        )

    def make_cable(self, start_model, end_model, core_count=2, length=100.0, polyline=None):
        if polyline is None:
            polyline = [
                {'lat': start_model.marker.latitude, 'lng': start_model.marker.longitude},
                {'lat': end_model.marker.latitude, 'lng': end_model.marker.longitude},
            ]
        response = self.api.post('/api/cable/create/', {
            'identifier': 'CABLE-1',
            'type': 'Fiber',
            'start_from': 'POP' if isinstance(start_model, POP) else 'CLIENT',
            'starting_point': start_model.id,
            'end_to': 'CLIENT' if isinstance(end_model, Client) else 'TJ_BOX',
            'ending_point': end_model.id,
            'number_of_cores': core_count,
            'length': length,
            'polyline': polyline,
            'zone': self.zone.id,
        }, format='json')
        self.assertEqual(response.status_code, 201, response.content)
        return Cable.objects.get(pk=response.data['id'])


class AuthenticationTests(ApiTestCase):
    def test_anonymous_access_is_rejected(self):
        anonymous = APIClient()
        for url in ('/api/pop/', '/api/client/', '/api/cable/', '/api/dashboard/', '/api/users/'):
            with self.subTest(url=url):
                self.assertEqual(anonymous.get(url).status_code, 401)

    def test_login_returns_token_and_permissions(self):
        response = APIClient().post(
            '/api/login/', {'username': 'admin', 'password': 'admin-pass-123'}, format='json',
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn('token', response.data)
        self.assertTrue(response.data['is_admin'])
        self.assertTrue(response.data['permissions']['delete'])

    def test_login_with_wrong_password_is_rejected(self):
        response = APIClient().post(
            '/api/login/', {'username': 'admin', 'password': 'wrong'}, format='json',
        )
        self.assertEqual(response.status_code, 400)

    def test_verify_token_returns_current_user(self):
        response = self.api.get('/api/verify-token/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['user']['username'], 'admin')

    def test_logout_invalidates_the_token(self):
        token = self.admin.auth_token.key
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        self.assertEqual(client.post('/api/logout/').status_code, 200)
        self.assertEqual(APIClient().get('/api/verify-token/').status_code, 401)


class LoginThrottleTests(ApiTestCase):
    def test_repeated_failed_logins_are_throttled(self):
        from django.core.cache import cache

        cache.clear()
        self.addCleanup(cache.clear)
        client = APIClient()
        statuses = [
            client.post('/api/login/', {'username': 'admin', 'password': 'nope'},
                        format='json').status_code
            for _ in range(31)
        ]
        self.assertEqual(statuses[-1], 429)
        self.assertNotIn(200, statuses)


class PermissionTests(ApiTestCase):
    def test_user_without_add_permission_cannot_create(self):
        self.user.can_add_data = False
        self.user.save()
        api = APIClient()
        api.force_authenticate(user=self.user)
        response = api.post('/api/pop/create/', {}, format='json')
        self.assertEqual(response.status_code, 403)

    def test_user_without_manage_permission_cannot_list_users(self):
        api = APIClient()
        api.force_authenticate(user=self.user)
        self.assertEqual(api.get('/api/users/').status_code, 403)

    def test_user_cannot_delete_map_data_without_permission(self):
        api = APIClient()
        api.force_authenticate(user=self.user)
        response = api.delete(f'/api/pop/{self.pop.pk}/delete/')
        self.assertEqual(response.status_code, 403)

    def test_user_cannot_promote_themselves_to_admin(self):
        api = APIClient()
        api.force_authenticate(user=self.user)
        response = api.patch(f'/api/users/{self.user.pk}/', {'role': 'admin'}, format='json')
        self.assertEqual(response.status_code, 403)

    def test_cannot_delete_own_account(self):
        response = self.api.delete(f'/api/users/{self.admin.pk}/')
        self.assertEqual(response.status_code, 400)


class UserApiTests(ApiTestCase):
    def test_create_user_hashes_password_and_grants_token(self):
        response = self.api.post('/api/users/', {
            'username': 'newuser',
            'password': 'a-strong-password',
            'confirm_password': 'a-strong-password',
            'email': 'new@example.com',
        }, format='json')
        self.assertEqual(response.status_code, 201, response.content)
        created = UserProfile.objects.get(username='newuser')
        self.assertNotEqual(created.password, 'a-strong-password')
        self.assertTrue(created.check_password('a-strong-password'))
        self.assertTrue(hasattr(created, 'auth_token'))

    def test_password_mismatch_is_rejected(self):
        response = self.api.post('/api/users/', {
            'username': 'mismatch',
            'password': 'one-password',
            'confirm_password': 'another-password',
        }, format='json')
        self.assertEqual(response.status_code, 400)

    def test_delete_other_user_returns_message(self):
        response = self.api.delete(f'/api/users/{self.user.pk}/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('message', response.data)
        self.assertFalse(UserProfile.objects.filter(pk=self.user.pk).exists())

    def make_manager(self):
        manager = UserProfile.objects.create_user(
            username='manager', password='manager-pass-123', can_manage_users=True,
        )
        manager.role = 'manager'
        manager.save()
        return manager

    def test_manager_cannot_change_an_administrator_password(self):
        api = APIClient()
        api.force_authenticate(user=self.make_manager())

        response = api.patch(
            f'/api/users/{self.admin.pk}/',
            {'password': 'taken-over', 'confirm_password': 'taken-over'},
            format='json',
        )
        self.assertEqual(response.status_code, 403)
        self.admin.refresh_from_db()
        self.assertTrue(self.admin.check_password('admin-pass-123'))

        response = api.patch(f'/api/users/{self.admin.pk}/', {'is_active': False}, format='json')
        self.assertEqual(response.status_code, 403)
        self.admin.refresh_from_db()
        self.assertTrue(self.admin.is_active)

        response = api.delete(f'/api/users/{self.admin.pk}/')
        self.assertEqual(response.status_code, 403)
        self.assertTrue(UserProfile.objects.filter(pk=self.admin.pk).exists())

    def test_manager_can_still_manage_normal_users(self):
        api = APIClient()
        api.force_authenticate(user=self.make_manager())

        response = api.patch(f'/api/users/{self.user.pk}/', {'can_add_data': False}, format='json')
        self.assertEqual(response.status_code, 200, response.content)
        self.user.refresh_from_db()
        self.assertFalse(self.user.can_add_data)


class MapCrudTests(ApiTestCase):
    def test_create_pop_creates_marker_and_requires_address(self):
        response = self.api.post('/api/pop/create/', {
            'identifier': 'POP-2',
            'name': 'POP-2',
            'pop_type': 'Switch',
            'marker': {'type': 'POP', 'latitude': 23.9, 'longitude': 90.5, 'address': 'Road 1'},
            'zone': self.zone.id,
        }, format='json')
        self.assertEqual(response.status_code, 201, response.content)
        pop = POP.objects.get(identifier='POP-2')
        self.assertEqual(pop.marker.identifier, 'POP-2')

        missing_address = self.api.post('/api/pop/create/', {
            'identifier': 'POP-3',
            'name': 'POP-3',
            'pop_type': 'Switch',
            'marker': {'type': 'POP', 'latitude': 23.9, 'longitude': 90.5},
        }, format='json')
        self.assertEqual(missing_address.status_code, 400)

    def test_out_of_range_coordinates_are_rejected(self):
        response = self.api.post('/api/pop/create/', {
            'identifier': 'POP-BAD',
            'name': 'POP-BAD',
            'pop_type': 'Switch',
            'marker': {'type': 'POP', 'latitude': 123.0, 'longitude': 90.5, 'address': 'x'},
        }, format='json')
        self.assertEqual(response.status_code, 400)

    def test_update_pop_keeps_marker(self):
        response = self.api.put(f'/api/pop/{self.pop.pk}/update/', {
            'name': 'POP-1 renamed',
            'pop_type': 'ONU',
            'marker': {'address': 'New address'},
        }, format='json')
        self.assertEqual(response.status_code, 200, response.content)
        self.pop.refresh_from_db()
        self.assertEqual(self.pop.name, 'POP-1 renamed')
        self.assertEqual(self.pop.marker.address, 'New address')

    def test_pop_paths_and_core_details(self):
        cable = self.make_cable(self.pop, self.client_model)
        self.assertEqual(self.api.get(f'/api/pop/{self.pop.pk}/paths/').status_code, 200)
        details = self.api.get(f'/api/pop-details/{self.pop.pk}/cores/')
        self.assertEqual(details.status_code, 200)
        self.assertEqual(len(details.data), 1)
        self.assertEqual(len(details.data[0]['cores']), cable.number_of_cores)

    def test_delete_pop_removes_marker(self):
        marker_id = self.pop.marker_id
        self.assertEqual(self.api.delete(f'/api/pop/{self.pop.pk}/delete/').status_code, 204)
        self.assertFalse(Marker.objects.filter(pk=marker_id).exists())

    def test_dashboard_counts_records(self):
        response = self.api.get('/api/dashboard/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['total_pop'], 1)
        self.assertEqual(response.data['total_clients'], 1)

    def test_client_mobile_number_can_be_cleared(self):
        # The management panel sends an empty string to remove a stored number.
        response = self.api.put(f'/api/client/{self.client_model.pk}/update/', {
            'name': self.client_model.name,
            'mobile_number': '',
            'marker': {'address': 'Test address'},
        }, format='json')
        self.assertEqual(response.status_code, 200, response.content)
        self.client_model.refresh_from_db()
        self.assertEqual(self.client_model.mobile_number, '')


class CableTests(ApiTestCase):
    def test_create_cable_builds_cores_and_connections(self):
        cable = self.make_cable(self.pop, self.client_model, core_count=4)
        self.assertEqual(Core.objects.filter(cable=cable).count(), 8)
        self.assertEqual(Connection.objects.count(), 8)

    def test_invalid_core_count_is_rejected(self):
        response = self.api.post('/api/cable/create/', {
            'identifier': 'CABLE-BAD',
            'start_from': 'POP',
            'starting_point': self.pop.id,
            'end_to': 'CLIENT',
            'ending_point': self.client_model.id,
            'number_of_cores': 3,
            'polyline': [
                {'lat': 23.8103, 'lng': 90.4125},
                {'lat': 23.8203, 'lng': 90.4225},
            ],
        }, format='json')
        self.assertEqual(response.status_code, 400)

    def test_polyline_must_start_and_end_at_the_markers(self):
        response = self.api.post('/api/cable/create/', {
            'identifier': 'CABLE-FAR',
            'start_from': 'POP',
            'starting_point': self.pop.id,
            'end_to': 'CLIENT',
            'ending_point': self.client_model.id,
            'number_of_cores': 2,
            'polyline': [
                {'lat': 10.0, 'lng': 10.0},
                {'lat': 23.8203, 'lng': 90.4225},
            ],
        }, format='json')
        self.assertEqual(response.status_code, 400)

    def test_same_core_cannot_be_connected_by_hand(self):
        cable = self.make_cable(self.pop, self.client_model)
        cores = list(Core.objects.filter(cable=cable).order_by('id'))
        response = self.api.post('/api/connect-cores/', {
            'core_from': cores[0].id,
            'core_to': cores[1].id,
        }, format='json')
        self.assertEqual(response.status_code, 400)

    def test_connect_and_disconnect_cores(self):
        cable_a = self.make_cable(self.pop, self.client_model)
        other_pop = self.make_pop('POP-B', 23.8303, 90.4325)
        other_client = self.make_client('Client-B', 23.8403, 90.4425)
        cable_b = self.make_cable(other_pop, other_client)

        core_a = Core.objects.filter(cable=cable_a, marker=self.pop.marker).first()
        core_b = Core.objects.filter(cable=cable_b, marker=other_pop.marker).first()

        connected = self.api.post('/api/connect-cores/', {
            'core_from': core_a.id,
            'core_to': core_b.id,
        }, format='json')
        self.assertEqual(connected.status_code, 201, connected.content)
        self.assertTrue(Connection.objects.filter(core_from=core_a, core_to=core_b).exists())

        duplicate = self.api.post('/api/connect-cores/', {
            'core_from': core_a.id,
            'core_to': core_b.id,
        }, format='json')
        self.assertEqual(duplicate.status_code, 400)

        disconnected = self.api.post('/api/disconnect-cores/', {
            'core_from': core_a.id,
            'core_to': core_b.id,
        }, format='json')
        self.assertEqual(disconnected.status_code, 204)
        self.assertFalse(Connection.objects.filter(core_from=core_a, core_to=core_b).exists())

    def test_core_assign_patch_without_payload_does_not_crash(self):
        cable = self.make_cable(self.pop, self.client_model)
        core = Core.objects.filter(cable=cable).first()
        response = self.api.patch(f'/api/core/{core.pk}/update-assign-status/', {}, format='json')
        self.assertEqual(response.status_code, 200, response.content)

        response = self.api.patch(
            f'/api/core/{core.pk}/update-assign-status/', {'assigned': True}, format='json',
        )
        self.assertEqual(response.status_code, 200)
        core.refresh_from_db()
        self.assertTrue(core.assigned)


    def test_deleting_cable_keeps_gpon_using_one_of_its_cores(self):
        tj_box = self.make_tj_box('TJ-KEEP', 23.8603, 90.4625)
        gpon = Gpon.objects.create(
            marker=tj_box.marker, name='OLT-KEEP', identifier='GPON-KEEP', splitter=2,
        )
        cable = self.make_cable(self.pop, tj_box)
        core = Core.objects.filter(cable=cable, marker=tj_box.marker).first()
        gpon.input_core = core
        gpon.save(update_fields=['input_core'])

        self.assertEqual(self.api.delete(f'/api/cable/{cable.pk}/delete/').status_code, 204)
        self.assertTrue(Gpon.objects.filter(pk=gpon.pk).exists())
        gpon.refresh_from_db()
        self.assertIsNone(gpon.input_core)


class CableCutTests(ApiTestCase):
    def setUp(self):
        super().setUp()
        self.cable = self.make_cable(
            self.pop, self.client_model, core_count=2, length=100.0,
            polyline=[
                {'lat': 23.8103, 'lng': 90.4125},
                {'lat': 23.8153, 'lng': 90.4175},
                {'lat': 23.8203, 'lng': 90.4225},
            ],
        )
        self.cable.zone = self.zone
        self.cable.save(update_fields=['zone'])

    def cut(self, **overrides):
        payload = {
            'push_index': 1,
            'divider_point': [23.8153, 90.4175],
            'tjbox_id': 'TJ-CUT',
            'tjbox_name': 'TJ after cut',
        }
        payload.update(overrides)
        return self.api.post(f'/api/cable/{self.cable.pk}/cut/', payload, format='json')

    def test_cut_splits_cable_and_keeps_zone(self):
        response = self.cut()
        self.assertEqual(response.status_code, 200, response.content)

        self.assertFalse(Cable.objects.filter(pk=self.cable.pk).exists())
        halves = list(Cable.objects.filter(identifier='CABLE-1'))
        self.assertEqual(len(halves), 2)
        for half in halves:
            self.assertEqual(half.zone_id, self.zone.id)
            self.assertGreater(len(half.get_polyline()), 1)

        total = sum(half.length for half in halves)
        self.assertAlmostEqual(total, 100.0, places=1)

        tj_box = TJBox.objects.get(identifier='TJ-CUT')
        self.assertEqual(tj_box.zone_id, self.zone.id)
        self.assertEqual(tj_box.marker.type, MarkerType.TJ_BOX)

        # Both cable ends now own cores again.
        for half in halves:
            self.assertEqual(Core.objects.filter(cable=half).count(), 4)

    def test_cut_rejects_out_of_range_index(self):
        response = self.cut(push_index=99)
        self.assertEqual(response.status_code, 400)
        self.assertTrue(Cable.objects.filter(pk=self.cable.pk).exists())

    def test_cut_rejects_bad_divider_point(self):
        for divider in ([23.8], 'not-a-point', [999, 999], ['a', 'b']):
            with self.subTest(divider=divider):
                response = self.cut(divider_point=divider)
                self.assertEqual(response.status_code, 400)
        self.assertTrue(Cable.objects.filter(pk=self.cable.pk).exists())

    def test_cut_rejects_empty_tjbox_name(self):
        response = self.cut(tjbox_name='  ')
        self.assertEqual(response.status_code, 400)
        self.assertTrue(Cable.objects.filter(pk=self.cable.pk).exists())

    def test_cut_keeps_gpon_using_one_of_the_cut_cores(self):
        tj_box = self.make_tj_box('TJ-GPON', 23.8703, 90.4725)
        gpon = Gpon.objects.create(
            marker=tj_box.marker, name='OLT-CUT', identifier='GPON-CUT', splitter=2,
        )
        core = Core.objects.filter(cable=self.cable, marker=self.client_model.marker).first()
        gpon.input_core = core
        gpon.save(update_fields=['input_core'])

        self.assertEqual(self.cut().status_code, 200)
        self.assertTrue(Gpon.objects.filter(pk=gpon.pk).exists())
        gpon.refresh_from_db()
        # The core survives on one of the new halves, so the link stays valid.
        self.assertIsNotNone(gpon.input_core)
        self.assertIn(gpon.input_core.cable, Cable.objects.filter(identifier='CABLE-1'))


class GponTests(ApiTestCase):
    def setUp(self):
        super().setUp()
        self.tj_box = self.make_tj_box('TJ-1', 23.8303, 90.4325)
        response = self.api.post('/api/gpon/create/', {
            'identifier': 'GPON-1',
            'name': 'OLT-1',
            'tj_box': self.tj_box.id,
            'splitter': 4,
            'zone': self.zone.id,
        }, format='json')
        self.assertEqual(response.status_code, 201, response.content)
        self.gpon = Gpon.objects.get(identifier='GPON-1')

    def test_splitter_cores_are_created(self):
        cores = Core.objects.filter(splitter=self.gpon)
        self.assertEqual(cores.count(), 5)
        self.assertIsNotNone(self.gpon.input_core)
        self.assertEqual(self.gpon.input_core.core_number, 0)

    def test_invalid_splitter_size_is_rejected(self):
        response = self.api.post('/api/gpon/create/', {
            'identifier': 'GPON-BAD',
            'name': 'OLT-BAD',
            'tj_box': self.tj_box.id,
            'splitter': 7,
        }, format='json')
        self.assertEqual(response.status_code, 400)

    def test_input_cable_assign_and_withdraw_flow(self):
        cable = self.make_cable(self.pop, self.tj_box)

        added = self.api.post(f'/api/gpon/{self.gpon.pk}/add-input-cable/',
                              {'cable_id': cable.id}, format='json')
        self.assertEqual(added.status_code, 200, added.content)

        duplicate = self.api.post(f'/api/gpon/{self.gpon.pk}/add-input-cable/',
                                  {'cable_id': cable.id}, format='json')
        self.assertEqual(duplicate.status_code, 400)

        core = Core.objects.filter(marker=self.tj_box.marker, cable=cable).first()
        assigned = self.api.post(f'/api/gpon/{self.gpon.pk}/assign-core/',
                                 {'core_id': core.id}, format='json')
        self.assertEqual(assigned.status_code, 200, assigned.content)

        blocked = self.api.post(f'/api/gpon/{self.gpon.pk}/remove-input-cable/')
        self.assertEqual(blocked.status_code, 400)

        withdrawn = self.api.post(f'/api/gpon/{self.gpon.pk}/withdraw-core/',
                                  {'core_id': core.id}, format='json')
        self.assertEqual(withdrawn.status_code, 200, withdrawn.content)

        removed = self.api.post(f'/api/gpon/{self.gpon.pk}/remove-input-cable/')
        self.assertEqual(removed.status_code, 200, removed.content)
        self.gpon.refresh_from_db()
        self.assertIsNone(self.gpon.input_cable)

    def test_gpon_details_endpoint(self):
        response = self.api.get(f'/api/gpon-details/{self.gpon.pk}/cores/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['out']['output_cores']), 4)

    def test_tjbox_details_lists_splitter_outputs_without_input_core(self):
        response = self.api.get(f'/api/tjbox-details/{self.tj_box.pk}/cores/')
        self.assertEqual(response.status_code, 200)
        splitter = response.data['splitters'][0]
        self.assertEqual(len(splitter['output_cores']), 4)
        self.assertTrue(all(core['core_number'] != 0 for core in splitter['output_cores']))

    def test_gpon_details_survives_input_cable_without_local_cores(self):
        # A cable that does not touch the GPON marker, linked as input cable:
        # the response used to crash with KeyError on set.remove().
        other_pop = self.make_pop('POP-X', 23.8503, 90.4525)
        other_client = self.make_client('Client-X', 23.8603, 90.4625)
        stray_cable = self.make_cable(other_pop, other_client)
        Gpon.objects.filter(pk=self.gpon.pk).update(input_cable=stray_cable)

        response = self.api.get(f'/api/gpon-details/{self.gpon.pk}/cores/')
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.data['input_cable']['id'], stray_cable.id)


class NetworkCategoryTests(ApiTestCase):
    def test_new_category_is_appended(self):
        before = NetworkCategory.objects.order_by('-sort_order').first().sort_order
        response = self.api.post('/api/network-category/create/', {
            'label': 'Splitter',
            'icon': 'tag',
            'color': '#123456',
        }, format='json')
        self.assertEqual(response.status_code, 201, response.content)
        category = NetworkCategory.objects.get(key='splitter')
        self.assertEqual(category.sort_order, before + 10)

    def test_invalid_color_is_rejected(self):
        response = self.api.post('/api/network-category/create/', {
            'label': 'Bad colour', 'color': 'red',
        }, format='json')
        self.assertEqual(response.status_code, 400)

    def test_system_category_with_records_cannot_be_deleted(self):
        pop_category = NetworkCategory.objects.get(key='POP')
        response = self.api.delete(f'/api/network-category/{pop_category.pk}/delete/')
        self.assertEqual(response.status_code, 400)
        self.assertTrue(NetworkCategory.objects.filter(key='POP').exists())

    def test_restore_recreates_missing_system_categories(self):
        NetworkCategory.objects.filter(key='RESELLER').delete()
        response = self.api.post('/api/network-category/restore/')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(NetworkCategory.objects.filter(key='RESELLER').exists())

    def test_custom_point_rejects_system_category(self):
        pop_category = NetworkCategory.objects.get(key='POP')
        response = self.api.post('/api/custom-point/create/', {
            'category': pop_category.id,
            'identifier': 'CP-1',
            'name': 'Custom point',
            'latitude': 23.8,
            'longitude': 90.4,
        }, format='json')
        self.assertEqual(response.status_code, 400)

    def test_custom_point_roundtrip(self):
        category = NetworkCategory.objects.create(label='Splitter', key='splitter-x')
        created = self.api.post('/api/custom-point/create/', {
            'category': category.id,
            'identifier': 'CP-1',
            'name': 'Custom point',
            'latitude': 23.8,
            'longitude': 90.4,
        }, format='json')
        self.assertEqual(created.status_code, 201, created.content)

        duplicate = self.api.post('/api/custom-point/create/', {
            'category': category.id,
            'identifier': 'CP-1',
            'name': 'Duplicate',
            'latitude': 23.8,
            'longitude': 90.4,
        }, format='json')
        self.assertEqual(duplicate.status_code, 400)

        listed = self.api.get('/api/custom-point/', {'category': category.id})
        self.assertEqual(listed.status_code, 200)
        self.assertEqual(len(listed.data), 1)


class ZoneTests(ApiTestCase):
    def test_regular_user_can_manage_zones(self):
        api = APIClient()
        api.force_authenticate(user=self.user)
        created = api.post('/api/zone/create/', {'name': 'Zone B'}, format='json')
        self.assertEqual(created.status_code, 201, created.content)
        zone_id = created.data['id']

        updated = api.put(f'/api/zone/{zone_id}/update/', {'name': 'Zone B2'}, format='json')
        self.assertEqual(updated.status_code, 200)

        zones = api.get('/api/zone/')
        self.assertEqual(zones.status_code, 200)
        self.assertEqual(len(zones.data), 2)

        self.assertEqual(api.delete(f'/api/zone/{zone_id}/delete/').status_code, 204)

    def test_subzone_requires_parent_zone(self):
        response = self.api.post('/api/subzone/create/', {'name': 'Sub'}, format='json')
        self.assertEqual(response.status_code, 400)

        response = self.api.post('/api/subzone/create/', {
            'name': 'Sub', 'zone': self.zone.id,
        }, format='json')
        self.assertEqual(response.status_code, 201, response.content)


class SiteSettingsTests(ApiTestCase):
    def test_admin_can_update_settings(self):
        response = self.api.patch('/api/site-settings/', {
            'site_name': 'My Fiber',
            'map_zoom': 9,
            'gps_max_distance_km': 50,
        }, format='json')
        self.assertEqual(response.status_code, 200, response.content)
        settings_obj = SiteSettings.load()
        self.assertEqual(settings_obj.site_name, 'My Fiber')
        self.assertEqual(settings_obj.map_zoom, 9)

    def test_invalid_settings_fall_back_to_previous_values(self):
        response = self.api.patch('/api/site-settings/', {
            'map_zoom': 999,
            'gps_max_distance_km': -5,
        }, format='json')
        self.assertEqual(response.status_code, 200)
        settings_obj = SiteSettings.load()
        self.assertEqual(settings_obj.map_zoom, 13)
        self.assertEqual(settings_obj.gps_max_distance_km, 500)

    def test_regular_user_cannot_update_settings(self):
        api = APIClient()
        api.force_authenticate(user=self.user)
        response = api.patch('/api/site-settings/', {'site_name': 'Hacked'}, format='json')
        self.assertEqual(response.status_code, 403)

    def test_site_info_is_public(self):
        response = APIClient().get('/api/site/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('site_name', response.data)

    def test_database_probe_is_closed_once_setup_is_complete(self):
        SiteSettings.objects.all().delete()
        SiteSettings.objects.create(setup_completed=True)
        response = APIClient().post('/api/setup/test-db/', {
            'db_host': 'example.com', 'db_name': 'x', 'db_user': 'x',
        }, format='json')
        self.assertEqual(response.status_code, 403)


class GeocodeTests(ApiTestCase):
    def test_short_query_is_rejected(self):
        response = self.api.get('/api/geocode/', {'q': 'a'})
        self.assertEqual(response.status_code, 400)

    def test_geocode_requires_authentication(self):
        self.assertEqual(APIClient().get('/api/geocode/', {'q': 'dhaka'}).status_code, 401)


class CorePathTests(ApiTestCase):
    def test_isolated_core_does_not_crash(self):
        marker = self.make_marker(23.9, 90.5)
        core = Core.objects.create(marker=marker, core_number=1, color='blue', assigned=False)
        self.assertEqual(find_core_paths(core), [core])

    def test_route_follows_the_cable(self):
        cable = self.make_cable(self.pop, self.client_model)
        start_core = Core.objects.filter(cable=cable, marker=self.pop.marker).first()
        path = find_core_paths(start_core)
        self.assertEqual(path[0], start_core)
        self.assertEqual(path[-1].marker_id, self.client_model.marker_id)

    def test_path_payload_has_no_negative_length(self):
        cable = self.make_cable(self.pop, self.client_model, length=250.0)
        core = Core.objects.filter(cable=cable, marker=self.pop.marker, assigned=True).first()
        if core is None:
            core = Core.objects.filter(cable=cable, marker=self.pop.marker).first()
            core.assigned = True
            core.save(update_fields=['assigned'])
        response = self.api.get(f'/api/pop/{self.pop.pk}/paths/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertGreaterEqual(response.data[0]['total_length'], 0)
        self.assertEqual(response.data[0]['path_direction'][-1]['cable_identifier'], '/')
