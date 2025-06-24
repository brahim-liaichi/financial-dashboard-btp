# backend/apps/dashboard/dashboard_serializer.py

from rest_framework import serializers
from ..models import DashboardPreference

class DashboardPreferenceSerializer(serializers.ModelSerializer):
    """
    Serializer for dashboard preferences.
    """
    class Meta:
        model = DashboardPreference
        fields = ['id', 'user', 'layout', 'widgets']
        read_only_fields = ['user']

class DashboardMetricsSerializer(serializers.Serializer):
    """
    Serializer for dashboard metrics data.
    """
    total_commandes = serializers.IntegerField()
    total_amount = serializers.DecimalField(max_digits=15, decimal_places=2)
    avg_rentabilite = serializers.DecimalField(max_digits=5, decimal_places=2)
    expense_distribution = serializers.ListField(child=serializers.DictField())
    profitability_analysis = serializers.ListField(child=serializers.DictField())