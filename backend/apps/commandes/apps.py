# backend/apps/commandes/apps.py

from django.apps import AppConfig


class CommandesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.commandes"
    verbose_name = "Commandes"

    def ready(self):
        """
        Initialize any app-specific settings or signals.
        """
        try:
            import apps.commandes.signals  # type: ignore # noqa
        except ImportError:
            pass
