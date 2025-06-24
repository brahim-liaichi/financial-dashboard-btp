# backend/apps/commandes/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CommandeViewSet

router = DefaultRouter()
router.register(r"", CommandeViewSet, basename="commande")

urlpatterns = [
    path("", include(router.urls)),
]
