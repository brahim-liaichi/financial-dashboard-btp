# apps/controle_depenses/serializers/controle_serializer.py

from rest_framework import serializers
from ..models import ControleDepense
from ..choices import (
    PROJECT_TYPE_CHOICES,
    TYPE_FORFAIT,
    FIABILITE_CHOICES,  # Import directly from choices
)


class ControleDepenseSerializer(serializers.ModelSerializer):
    fiabilite_display = serializers.SerializerMethodField()
    type_projet_display = serializers.SerializerMethodField()

    class Meta:
        model = ControleDepense
        fields = [
            "numero_article",
            "code_projet",
            "type_projet",
            "type_projet_display",
            "prix_vente",
            "prix_vente_base",
            "budget_chef_projet",
            "budget_chef_projet_base",
            "fiabilite",
            "fiabilite_display",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ("created_at", "updated_at")
        unique_together = (("numero_article", "code_projet"),)

    def get_fiabilite_display(self, obj):
        return obj.get_fiabilite_display() if obj.fiabilite else None

    def get_type_projet_display(self, obj):
        return obj.get_type_projet_display()

    def validate(self, data):
        for field, label in [
            ("prix_vente", "Selling price"),
            ("prix_vente_base", "Base selling price"),
            ("budget_chef_projet", "Project manager budget"),
            ("budget_chef_projet_base", "Base project manager budget"),
        ]:
            if (value := data.get(field)) is not None and value < 0:
                raise serializers.ValidationError(
                    {field: f"{label} cannot be negative"}
                )
        return data


class ControleDepenseMetricsSerializer(serializers.Serializer):
    """
    Serializer for controle metrics including both standard and real calculations.

    Standard Metrics:
    - depenses_engagees: Total committed expenses
    - depenses_facturees: Invoiced expenses
    - fin_chantier: Projected end cost
    - rentabilite: Profitability ratio

    Real Metrics (Based on Delivered Quantities):
    - depenses_engagees_reel: Real committed expenses
    - depenses_facturees_reel: Real invoiced expenses
    - fin_chantier_reel: Real projected end cost
    - rentabilite_reel: Real profitability ratio
    """

    # Project Information
    numero_article = serializers.CharField()
    code_projet = serializers.CharField()
    type_projet = serializers.ChoiceField(
        choices=PROJECT_TYPE_CHOICES, default=TYPE_FORFAIT
    )

    # Standard Metrics
    depenses_engagees = serializers.DecimalField(max_digits=15, decimal_places=2)
    depenses_facturees = serializers.DecimalField(max_digits=15, decimal_places=2)
    fin_chantier = serializers.DecimalField(
        max_digits=15, decimal_places=2, allow_null=True, required=False
    )
    rentabilite = serializers.DecimalField(
        max_digits=15, decimal_places=2, required=False, allow_null=True
    )

    # Real Metrics
    depenses_engagees_reel = serializers.DecimalField(max_digits=15, decimal_places=2)
    depenses_facturees_reel = serializers.DecimalField(max_digits=15, decimal_places=2)
    fin_chantier_reel = serializers.DecimalField(
        max_digits=15, decimal_places=2, allow_null=True, required=False
    )
    rentabilite_reel = serializers.DecimalField(
        max_digits=15, decimal_places=2, required=False, allow_null=True
    )

    # Project Values
    prix_vente = serializers.DecimalField(
        max_digits=15, decimal_places=2, allow_null=True, required=False
    )
    prix_vente_base = serializers.DecimalField(
        max_digits=15, decimal_places=2, allow_null=True, required=False
    )
    budget_chef_projet = serializers.DecimalField(
        max_digits=15, decimal_places=2, allow_null=True, required=False
    )
    budget_chef_projet_base = serializers.DecimalField(
        max_digits=15, decimal_places=2, allow_null=True, required=False
    )
    reste_a_depenser = serializers.DecimalField(
        max_digits=15, decimal_places=2, required=False, allow_null=True
    )

    # Additional Metrics
    fiabilite = serializers.CharField(allow_null=True, required=False)
    rapport = serializers.DecimalField(
        max_digits=15, decimal_places=2, required=False, allow_null=True
    )
    rapport_atterrissage = serializers.DecimalField(
        max_digits=15,
        decimal_places=2,
        required=False,
        allow_null=True,
        help_text="Budget to landing selling price ratio (for METRE projects)",
    )
    status = serializers.CharField(required=False)


class ControleDepenseUpdateSerializer(serializers.Serializer):
    numero_article = serializers.CharField()
    code_projet = serializers.CharField(required=False)
    type_projet = serializers.ChoiceField(
        choices=PROJECT_TYPE_CHOICES, default=TYPE_FORFAIT, required=False
    )
    prix_vente = serializers.DecimalField(
        max_digits=15, decimal_places=2, required=False, allow_null=True
    )
    prix_vente_base = serializers.DecimalField(
        max_digits=15, decimal_places=2, required=False, allow_null=True
    )
    budget_chef_projet = serializers.DecimalField(
        max_digits=15, decimal_places=2, required=False, allow_null=True
    )
    budget_chef_projet_base = serializers.DecimalField(
        max_digits=15, decimal_places=2, required=False, allow_null=True
    )
    reste_a_depenser = serializers.DecimalField(
        max_digits=15, decimal_places=2, required=False, allow_null=True
    )
    fiabilite = serializers.ChoiceField(
        choices=FIABILITE_CHOICES,  # Use imported FIABILITE_CHOICES
        required=False,
        allow_null=True,
    )

    def validate(self, data):
        for field, label in [
            ("prix_vente", "Selling price"),
            ("prix_vente_base", "Base selling price"),
            ("budget_chef_projet", "Project manager budget"),
            ("budget_chef_projet_base", "Base project manager budget"),
            ("reste_a_depenser", "Remaining to spend"),
        ]:
            if (value := data.get(field)) is not None and value < 0:
                raise serializers.ValidationError(
                    {field: f"{label} cannot be negative"}
                )
        return data
