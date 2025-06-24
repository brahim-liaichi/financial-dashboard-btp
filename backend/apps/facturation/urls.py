# Path: backend/apps/facturation/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FacturationViewSet

# Create a router and register our viewset
router = DefaultRouter()
router.register(r"", FacturationViewSet, basename="facturation")

# The API URLs are now determined automatically by the router.
urlpatterns = [
    path("", include(router.urls)),
]
