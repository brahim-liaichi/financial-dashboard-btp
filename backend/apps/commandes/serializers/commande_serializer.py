from rest_framework import serializers
from ..models import Commande


class CommandeSerializer(serializers.ModelSerializer):
    """
    Serializer for Commande model.
    Handles basic CRUD operations.
    """

    total_lignes_formatted = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()

    class Meta:
        model = Commande
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at")

    def get_total_lignes_formatted(self, obj):
        """Format total_lignes with currency."""
        return f"{obj.total_lignes:,.2f} {obj.devise_prix}"

    def get_status_display(self, obj):
        """Get human-readable status."""
        status_map = {"O": "Open", "C": "Closed", "P": "Pending"}
        return status_map.get(obj.statut_document, obj.statut_document)

    def validate(self, data):
        """
        Custom validation for commande data.
        """
        # Validate dates
        if data.get("date_echeance") and data.get("date_enregistrement"):
            if data["date_echeance"] < data["date_enregistrement"]:
                raise serializers.ValidationError(
                    "Due date cannot be earlier than registration date"
                )

        # Validate quantities
        if data.get("quantite_en_cours") > data.get("quantite", 0):
            raise serializers.ValidationError(
                "Ongoing quantity cannot exceed total quantity"
            )

        # Validate delivered quantity
        if data.get("quantite_livree", 0) > data.get("quantite", 0):
            raise serializers.ValidationError(
                "Delivered quantity cannot exceed total quantity"
            )

        return data


class CommandeBulkSerializer(serializers.Serializer):
    """
    Serializer for bulk command creation.
    Used for importing multiple commands at once.
    """

    commands = CommandeSerializer(many=True)

    def create(self, validated_data):
        commands = validated_data.get("commands", [])
        command_instances = [Commande(**command_data) for command_data in commands]
        return Commande.objects.bulk_create(command_instances)


class UniqueProjectSerializer(serializers.Serializer):
    """
    Serializer for unique project listing.
    """

    code = serializers.CharField(max_length=50)
    name = serializers.CharField(max_length=255)


class CommandeUniqueProjectsSerializer(serializers.Serializer):
    """
    Serializer for the unique projects endpoint response.
    """

    projects = UniqueProjectSerializer(many=True)
    count = serializers.IntegerField()
