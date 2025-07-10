# backend/config/urls.py

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.http import JsonResponse
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)


# Root view for API status
def root_view(request):
    """Simple root endpoint to show API status and available endpoints"""
    return JsonResponse(
        {
            "message": "Financial Dashboard Backend API",
            "status": "running",
            "version": "1.0.0",
            "endpoints": {
                "admin": "/admin/",
                "api_docs": "/docs/",
                "api_schema": "/api/schema/",
                "commandes": "/api/commandes/",
                "controle_depenses": "/api/controle-depenses/",
                "facturation": "/api/facturation/",
                "user_management": "/api/user-management/",
                "auth": "/api/auth/",
            },
        }
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
    # Root endpoint
    path("", root_view, name="root"),
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
