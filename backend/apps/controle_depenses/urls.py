# Path: backend/apps/controle_depenses/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ControleDepenseViewSet

router = DefaultRouter()
router.register(r"", ControleDepenseViewSet, basename="controle-depense")

urlpatterns = [
    path("", include(router.urls)),
]
