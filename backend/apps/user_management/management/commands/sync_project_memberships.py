# In backend/apps/user_management/management/commands/sync_project_memberships.py
from django.core.management.base import BaseCommand
from apps.commandes.models import Commande
from apps.user_management.models import Project, ProjectMembership
from django.contrib.auth.models import User


class Command(BaseCommand):
    help = "Synchronize project memberships based on Commande data"

    def handle(self, *args, **kwargs):
        # Get all projects
        projects = Project.objects.all()

        # Tracking metrics
        total_memberships_created = 0
        skipped_memberships = 0

        # Iterate through projects
        for project in projects:
            # Get unique supplier codes for this project
            unique_suppliers = (
                Commande.objects.filter(code_projet=project.code)
                .values_list("code_fournisseur", flat=True)
                .distinct()
            )

            self.stdout.write(f"\nProcessing Project: {project.code}")
            self.stdout.write(f"Unique suppliers: {len(unique_suppliers)}")

            # Create memberships
            for supplier_code in unique_suppliers:
                if not supplier_code:
                    skipped_memberships += 1
                    continue

                # Try to find or create a user
                user, created = User.objects.get_or_create(
                    username=supplier_code,
                    defaults={
                        "first_name": f"Supplier {supplier_code}",
                        "is_active": False,  # Mark as inactive by default
                    },
                )

                # Create project membership
                membership, created = ProjectMembership.objects.get_or_create(
                    user=user,
                    project=project,
                    defaults={"role": "VIEWER"},  # Default role
                )

                if created:
                    total_memberships_created += 1
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"Created membership for {user.username} in project {project.code}"
                        )
                    )

        # Final report
        self.stdout.write(self.style.SUCCESS("\nSynchronization Summary:"))
        self.stdout.write(
            f"Total project memberships created: {total_memberships_created}"
        )
        self.stdout.write(
            f"Skipped memberships (empty supplier code): {skipped_memberships}"
        )
