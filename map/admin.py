from django.contrib import admin
from .models import (Cable, Marker, Core, POP, TJBox, Client, Gpon, Connection, UserProfile, Reseller,
                     Zone, SubZone, ManagerUser, SiteSettings)


admin.site.register(UserProfile)
admin.site.register(ManagerUser)
admin.site.register(Zone)
admin.site.register(SubZone)
admin.site.register(SiteSettings)

admin.site.register(Marker)
admin.site.register(POP)
admin.site.register(Client)
admin.site.register(Reseller)
admin.site.register(TJBox)
admin.site.register(Gpon)
admin.site.register(Cable)
admin.site.register(Core)
admin.site.register(Connection)