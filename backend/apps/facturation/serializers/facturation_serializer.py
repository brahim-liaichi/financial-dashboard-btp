# Path: backend/apps/facturation/serializers/facturation_serializer.py
from rest_framework import serializers
from ..models import Facturation, Avancement
from decimal import Decimal


class FacturationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Facturation
        fields = [
            "id",
            "document_number",
            "registration_date",
            "document_status",
            "client_code",
            "client_name",
            "item_code",
            "description",
            "quantity",
            "price",
            "line_total",
            "total_after_discount",
            "project_code",
        ]


class AvancementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Avancement
        fields = [
            "id",
            "doc_type",
            "doc_num",
            "accounting_date",
            "payment_ht",
            "payment_ttc",
            "payment_method",
            "project_code",
            "num",  # Changed from num_total
            "total",  # Added this field
            "dat",
            "canceled",
            "accompte_flag",
        ]


class FacturationMetricsSerializer(serializers.Serializer):
    facturation_total = serializers.DecimalField(
        max_digits=20, decimal_places=2, default=Decimal("0.00"), coerce_to_string=False
    )
    avancement_total = serializers.DecimalField(
        max_digits=20, decimal_places=2, default=Decimal("0.00"), coerce_to_string=False
    )

    def to_representation(self, instance):
        # Ensure we always return a dict with zero values if no data
        return {
            "facturation_total": instance.get("facturation_total", Decimal("0.00")),
            "avancement_total": instance.get("avancement_total", Decimal("0.00")),
        }

    def create(self, validated_data):
        # Provide default zero values if not present
        return {
            "facturation_total": validated_data.get(
                "facturation_total", Decimal("0.00")
            ),
            "avancement_total": validated_data.get("avancement_total", Decimal("0.00")),
        }

    def update(self, instance, validated_data):
        # Update method to handle partial updates
        instance["facturation_total"] = validated_data.get(
            "facturation_total", instance.get("facturation_total", Decimal("0.00"))
        )
        instance["avancement_total"] = validated_data.get(
            "avancement_total", instance.get("avancement_total", Decimal("0.00"))
        )
        return instance


class EvolutionDataSerializer(serializers.Serializer):
    facturation = serializers.ListField(child=serializers.DictField(), default=list)
    avancement = serializers.ListField(child=serializers.DictField(), default=list)
