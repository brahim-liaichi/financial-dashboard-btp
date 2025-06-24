# In backend/apps/user_management/management/commands/diagnose_projects.py
from django.core.management.base import BaseCommand
from apps.commandes.models import Commande
from apps.user_management.models import Project, ProjectMembership
from django.contrib.auth.models import User


class Command(BaseCommand):
    help = "Diagnose project membership synchronization"

    def handle(self, *args, **kwargs):
        # Get unique users from Commande
        unique_users = Commande.objects.values_list(
            "code_fournisseur", flat=True
        ).distinct()

        self.stdout.write(self.style.NOTICE("Diagnostic Information:"))
        self.stdout.write(f"Total unique supplier codes: {len(unique_users)}")

        # Print first few unique users
        self.stdout.write("\nSample Supplier Codes:")
        for code in list(unique_users)[:10]:
            self.stdout.write(code)

        # Check existing users
        self.stdout.write("\nExisting Users:")
        existing_users = User.objects.all()
        for user in existing_users:
            self.stdout.write(f"Username: {user.username}, ID: {user.id}")
