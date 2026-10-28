from rest_framework import permissions


def _user_has(request, method_name):
    user = getattr(request, 'user', None)
    if not user or not user.is_authenticated:
        return False
    if getattr(user, 'is_admin', False):
        return True
    checker = getattr(user, method_name, None)
    return bool(checker()) if callable(checker) else False


class UpdateOwnProfile(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        return obj.id == request.user.id or getattr(request.user, 'is_admin', False)


class CanAddData(permissions.BasePermission):
    message = 'You do not have permission to add data.'

    def has_permission(self, request, view):
        return _user_has(request, 'has_perm_add')


class CanEditData(permissions.BasePermission):
    message = 'You do not have permission to edit data.'

    def has_permission(self, request, view):
        return _user_has(request, 'has_perm_edit')


class CanDeleteData(permissions.BasePermission):
    message = 'You do not have permission to delete data.'

    def has_permission(self, request, view):
        return _user_has(request, 'has_perm_delete')


class CanManageUsers(permissions.BasePermission):
    message = 'Only administrators or managers can manage users and settings.'

    def has_permission(self, request, view):
        return _user_has(request, 'has_perm_manage')


class IsAdmin(permissions.BasePermission):
    message = 'Only administrators can perform this action.'

    def has_permission(self, request, view):
        user = getattr(request, 'user', None)
        return bool(user and user.is_authenticated and getattr(user, 'is_admin', False))
