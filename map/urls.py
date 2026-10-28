from django.urls import path, include
from map import views
from map import site_views
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register('users', views.UserViewSets)

urlpatterns = [
    path('', include(router.urls)),

    # Public site information and first-run setup endpoints.
    path('site/', site_views.site_info, name='site-info'),
    path('geocode/', views.geocode_search, name='geocode-search'),
    path('setup/status/', site_views.setup_status, name='setup-status'),
    path('setup/test-db/', site_views.setup_test_database, name='setup-test-db'),

    # Branding/settings and database administration.
    path('site-settings/', site_views.SiteSettingsAPIView.as_view(), name='site-settings'),
    path('database/info/', site_views.DatabaseInfoAPIView.as_view(), name='database-info'),
    path('database/test/', site_views.DatabaseTestAPIView.as_view(), name='database-test'),
    path('database/config/', site_views.DatabaseConfigAPIView.as_view(), name='database-config'),
    path('database/import/', site_views.DatabaseImportAPIView.as_view(), name='database-import'),
    path('database/export/', site_views.ExportDatabaseAPIView.as_view(), name='database-export'),

    path('login/', views.UserLoginApiView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('verify-token/', views.VerifyTokenView.as_view(), name='verify-token'),

    path('dashboard/', views.DashboardView.as_view(), name='dashboard'),

    path('network-category/', views.NetworkCategoryListView.as_view(), name='network-category-list'),
    path('network-category/create/', views.NetworkCategoryCreateView.as_view(), name='network-category-create'),
    path('network-category/restore/', views.NetworkCategoryRestoreView.as_view(), name='network-category-restore'),
    path('network-category/<int:id>/update/', views.NetworkCategoryUpdateView.as_view(), name='network-category-update'),
    path('network-category/<int:pk>/delete/', views.NetworkCategoryDeleteView.as_view(), name='network-category-delete'),

    path('custom-point/', views.CustomPointListView.as_view(), name='custom-point-list'),
    path('custom-point/create/', views.CustomPointCreateView.as_view(), name='custom-point-create'),
    path('custom-point/<int:id>/update/', views.CustomPointUpdateView.as_view(), name='custom-point-update'),
    path('custom-point/<int:pk>/delete/', views.CustomPointDeleteView.as_view(), name='custom-point-delete'),

    path('pop/', views.PopListView.as_view(), name='pop-list'),
    path('pop/create/', views.PopCreateView.as_view(), name='pop-create'),
    path('pop-details/<int:pop_id>/cores/', views.PopCoresDetailsAPIView.as_view(),
         name='pop-core-details'),
    path('pop/<int:pop_id>/paths/', views.PopPathsView.as_view(), name='pop-path'),
    path('pop/<int:id>/update/', views.PopUpdateView.as_view(), name='pop-update'),
    path('pop/<int:pk>/delete/', views.PopDeleteView.as_view(), name='pop-delete'),

    path('client/', views.ClientListView.as_view(), name='client-create'),
    path('client/create/', views.ClientCreateView.as_view(), name='client-list'),
    path('client-details/<int:client_id>/cores/', views.ClientCoresDetailsAPIView.as_view(),
         name='client-core-details'),
    path('client/<int:client_id>/paths/', views.ClientPathsView.as_view(), name='client-path'),
    path('client/<int:id>/update/', views.ClientUpdateView.as_view(), name='client-update'),
    path('client/<int:pk>/delete/', views.ClientDeleteView.as_view(), name='client-delete'),

    path('reseller/', views.ResellerListView.as_view(), name='reseller-create'),
    path('reseller/create/', views.ResellerCreateView.as_view(), name='reseller-list'),
    path('reseller-details/<int:reseller_id>/cores/', views.ResellerCoresDetailsAPIView.as_view(),
         name='reseller-core-details'),
    path('reseller/<int:reseller_id>/paths/', views.ResellerPathsView.as_view(), name='reseller-path'),
    path('reseller/<int:id>/update/', views.ResellerUpdateView.as_view(), name='reseller-update'),
    path('reseller/<int:pk>/delete/', views.ResellerDeleteView.as_view(), name='reseller-delete'),

    path('tjbox/', views.TJBoxListView.as_view(), name='tjbox-list'),
    path('tjbox/create/', views.TJBoxCreateView.as_view(), name='tjbox-create'),
    path('tjbox-details/<int:tj_box_id>/cores/', views.TJBoxCoresDetailsAPIView.as_view(),
         name='tjbox-core-details'),
    path('tjbox/<int:id>/update/', views.TJBoxUpdateView.as_view(), name='tjbox-update'),
    path('tjbox/<int:pk>/delete/', views.TJBoxDeleteView.as_view(), name='tjbox-delete'),


    path('gpon/', views.GponListView.as_view(), name='gpon-create'),
    path('gpon/create/', views.GponCreateView.as_view(), name='gpon-list'),
    path('gpon-details/<int:gpon_id>/cores/', views.GponCoresDetailsAPIView.as_view(),
         name='gpon-core-details'),
    path('gpon/<int:gpon_id>/add-input-cable/', views.AddGponInputCable.as_view(), name='gpon-add-input-cable'),
    path('gpon/<int:gpon_id>/remove-input-cable/', views.RemoveGponInputCable.as_view(),
         name='gpon-remove-input-cable'),
    path('gpon/<int:gpon_id>/assign-core/', views.GponInputCoreAssignView.as_view(), name='gpon-input-assign-core'),
    path('gpon/<int:gpon_id>/withdraw-core/', views.GponInputCoreWithdrawView.as_view(), name='gpon-input-withdraw-core'),
    path('gpon/<int:id>/update/', views.GponUpdateView.as_view(), name='gpon-update'),
    path('gpon/<int:pk>/delete/', views.GponDeleteView.as_view(), name='gpon-delete'),

    path('cable/', views.CableListView.as_view(), name='cable-list'),
    path('cable/create/', views.CableCreateView.as_view(), name='cable-create'),

    path('core/<int:pk>/update-assign-status/', views.CoreAssignView.as_view(), name='core-assign-withdraw'),
    path('cable/<int:id>/update/', views.CableUpdateView.as_view(), name='cable-update'),
    path('cable/<int:pk>/delete/', views.CableDeleteView.as_view(), name='cable-delete'),
    path('cable/<int:cable_id>/cut/', views.CableCutAPIView.as_view(), name='cable-cut'),

    path('connect-cores/', views.ConnectCoresAPIView.as_view(), name='connect-cores'),
    path('disconnect-cores/', views.DisConnectCoresAPIView.as_view(), name='disconnect-cores'),

    # path('dbdump/', views.DumpDatabaseAPIView.as_view(), name='dbdump'),

    path('zone/', views.ZoneListView.as_view(), name='zone-list'),
    path('zone/create/', views.ZoneCreateView.as_view(), name='zone-create'),
    path('zone/<int:id>/update/', views.ZoneUpdateView.as_view(), name='zone-update'),
    path('zone/<int:pk>/delete/', views.ZoneDeleteView.as_view(), name='zone-delete'),

    path('subzone/', views.SubZoneListView.as_view(), name='subzone-list'),
    path('subzone/create/', views.SubZoneCreateView.as_view(), name='subzone-create'),
    path('subzone/<int:id>/update/', views.SubZoneUpdateView.as_view(), name='subzone-update'),
    path('subzone/<int:pk>/delete/', views.SubZoneDeleteView.as_view(), name='subzone-delete'),

    path('manager-user/', views.ManagerUserViewSets.as_view({'get': 'list'}), name='manager-user-list'),
    path('manager-user/create/', views.ManagerUserViewSets.as_view({'post': 'create'}), name='manager-user-create'),
    path('manager-user/<int:pk>/', views.ManagerUserViewSets.as_view({'get': 'retrieve'}), name='manager-user-detail'),
    path('manager-user/<int:pk>/update/', views.ManagerUserViewSets.as_view({'put': 'update', 'patch': 'partial_update'}), name='manager-user-update'),
    path('manager-user/<int:pk>/delete/', views.ManagerUserViewSets.as_view({'delete': 'destroy'}), name='manager-user-delete'),

    # Aliases for common naming variants
    path('manageruser/', views.ManagerUserViewSets.as_view({'get': 'list'}), name='manageruser-list'),
    path('manageruser/create/', views.ManagerUserViewSets.as_view({'post': 'create'}), name='manageruser-create'),
    path('manageruser/<int:pk>/', views.ManagerUserViewSets.as_view({'get': 'retrieve'}), name='manageruser-detail'),
    path('manageruser/<int:pk>/update/', views.ManagerUserViewSets.as_view({'put': 'update', 'patch': 'partial_update'}), name='manageruser-update'),
    path('manageruser/<int:pk>/delete/', views.ManagerUserViewSets.as_view({'delete': 'destroy'}), name='manageruser-delete'),

    path('manager-users/', views.ManagerUserViewSets.as_view({'get': 'list'}), name='manager-users-list'),
    path('manager-users/create/', views.ManagerUserViewSets.as_view({'post': 'create'}), name='manager-users-create'),
    path('manager-users/<int:pk>/', views.ManagerUserViewSets.as_view({'get': 'retrieve'}), name='manager-users-detail'),
    path('manager-users/<int:pk>/update/', views.ManagerUserViewSets.as_view({'put': 'update', 'patch': 'partial_update'}), name='manager-users-update'),
    path('manager-users/<int:pk>/delete/', views.ManagerUserViewSets.as_view({'delete': 'destroy'}), name='manager-users-delete'),

    path('manager/', views.ManagerUserViewSets.as_view({'get': 'list'}), name='manager-list'),
    path('manager/create/', views.ManagerUserViewSets.as_view({'post': 'create'}), name='manager-create'),
    path('manager/<int:pk>/', views.ManagerUserViewSets.as_view({'get': 'retrieve'}), name='manager-detail'),
    path('manager/<int:pk>/update/', views.ManagerUserViewSets.as_view({'put': 'update', 'patch': 'partial_update'}), name='manager-update'),
    path('manager/<int:pk>/delete/', views.ManagerUserViewSets.as_view({'delete': 'destroy'}), name='manager-delete'),

    path('zones/', views.ZoneListView.as_view(), name='zones-list'),
    path('zones/create/', views.ZoneCreateView.as_view(), name='zones-create'),
    path('zones/<int:id>/update/', views.ZoneUpdateView.as_view(), name='zones-update'),
    path('zones/<int:pk>/delete/', views.ZoneDeleteView.as_view(), name='zones-delete'),

    path('subzones/', views.SubZoneListView.as_view(), name='subzones-list'),
    path('subzones/create/', views.SubZoneCreateView.as_view(), name='subzones-create'),
    path('subzones/<int:id>/update/', views.SubZoneUpdateView.as_view(), name='subzones-update'),
    path('subzones/<int:pk>/delete/', views.SubZoneDeleteView.as_view(), name='subzones-delete'),

    path('sub-zone/', views.SubZoneListView.as_view(), name='sub-zone-list'),
    path('sub-zone/create/', views.SubZoneCreateView.as_view(), name='sub-zone-create'),
    path('sub-zone/<int:id>/update/', views.SubZoneUpdateView.as_view(), name='sub-zone-update'),
    path('sub-zone/<int:pk>/delete/', views.SubZoneDeleteView.as_view(), name='sub-zone-delete'),

    path('sub_zone/', views.SubZoneListView.as_view(), name='sub_zone-list'),
    path('sub_zone/create/', views.SubZoneCreateView.as_view(), name='sub_zone-create'),
    path('sub_zone/<int:id>/update/', views.SubZoneUpdateView.as_view(), name='sub_zone-update'),
    path('sub_zone/<int:pk>/delete/', views.SubZoneDeleteView.as_view(), name='sub_zone-delete'),
]
