# backend/config/urls.py

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

# API documentation patterns
api_doc_patterns = [
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]

# Main API patterns
api_patterns = [
    # Orders management
    path("api/commandes/", include("apps.commandes.urls"), name="commandes"),
    # Expense control
    path(
        "api/controle-depenses/",
        include("apps.controle_depenses.urls"),
        name="controle-depenses",
    ),
    # Facturation management - Add this new path
    path(
        "api/facturation/",
        include("apps.facturation.urls"),
        name="facturation",
    ),
    #  user management
    path(
        "api/user-management/",
        include("apps.user_management.urls"),
        name="user-management",
    ),
]

# Main URL patterns
urlpatterns = [
    # Django admin
    path("admin/", admin.site.urls, name="admin"),
    # Include API documentation
    *api_doc_patterns,
    # Include API endpoints
    *api_patterns,
    # Add the auth URLs
    path("api/auth/", include("apps.authentication.urls")),
]

# Debug toolbar (if in debug mode)
if settings.DEBUG:
    try:
        import debug_toolbar

        urlpatterns.append(path("__debug__/", include(debug_toolbar.urls)))
    except ImportError:
        pass
