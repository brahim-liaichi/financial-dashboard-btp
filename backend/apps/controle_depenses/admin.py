# apps/controle_depenses/admin.py
from django.contrib import admin
from django.utils.html import format_html
from django.db.models import F
from .models import ControleDepense
from .services.controle_metrics_service import ControleMetricsService
from .choices import FIABILITE_CHOICES, PROJECT_TYPE_CHOICES


@admin.register(ControleDepense)
class ControleDepenseAdmin(admin.ModelAdmin):
    """
    Admin interface for ControleDepense model with comprehensive financial metrics display.
    """

    # Basic list display
    list_display = [
        "numero_article",
        "code_projet",
        "type_projet",
        "fiabilite",
        "prix_vente",
        "budget_chef_projet",
        "reste_a_depenser",
    ]

    # Filtering options
    list_filter = [
        "type_projet",
        "fiabilite",
        "code_projet",
    ]

    # Search capabilities
    search_fields = [
        "numero_article",
        "code_projet",
    ]

    # Read-only fields
    readonly_fields = [
        "type_projet",
    ]

    # Field organization
    fieldsets = (
        (
            "Project Information",
            {
                "fields": (
                    "numero_article",
                    "code_projet",
                    "type_projet",
                    "fiabilite",
                )
            },
        ),
        (
            "Financial Values",
            {
                "fields": (
                    "prix_vente",
                    "prix_vente_base",
                    "budget_chef_projet",
                    "budget_chef_projet_base",
                    "reste_a_depenser",
                )
            },
        ),
    )

    def has_add_permission(self, request):
        """Disable manual addition as records are created through sync"""
        return False

    def has_delete_permission(self, request, obj=None):
        """Disable deletion as records are managed through sync"""
        return False

    def get_queryset(self, request):
        """Optimize queryset with calculated fields"""
        return super().get_queryset(request).select_related()
