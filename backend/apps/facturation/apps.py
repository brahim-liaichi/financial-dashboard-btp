# Path: backend/apps/facturation/apps.py

from django.apps import AppConfig


class FacturationConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.facturation"
    verbose_name = "Facturation"
