# backend/apps/dashboard/models.py

from django.db import models
from apps.core.models import BaseModel

class DashboardPreference(BaseModel):
    """
    Model to store user dashboard preferences.
    """
    user = models.ForeignKey(
        'auth.User',
        on_delete=models.CASCADE,
        related_name='dashboard_preferences'
    )
    layout = models.JSONField(
        default=dict,
        help_text="Dashboard layout configuration"
    )
    widgets = models.JSONField(
        default=dict,
        help_text="Enabled widgets and their settings"
    )

    class Meta:
        unique_together = ['user']