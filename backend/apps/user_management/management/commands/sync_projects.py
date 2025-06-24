from django.core.management.base import BaseCommand
from apps.commandes.models import Commande
from apps.user_management.models import Project
from apps.core.constants import PROJECT_NAME_MAP
from django.db.models import Count


class Command(BaseCommand):
    help = "Synchronize projects from Commande model and project constants"

    def handle(self, *args, **kwargs):
        # Get project codes with their total count
        project_code_counts = (
            Commande.objects.values("code_projet")
            .annotate(total_count=Count("id"))
            .order_by("-total_count")
        )

        self.stdout.write(self.style.NOTICE("Project Code Breakdown:"))
        for project in project_code_counts:
            code = project["code_projet"]
            count = project["total_count"]
            self.stdout.write(f"{code}: {count} commandes")

        # Combine project codes from Commande and PROJECT_NAME_MAP
        all_project_codes = set(
            list(project["code_projet"] for project in project_code_counts)
            + list(PROJECT_NAME_MAP.keys())
        )

        created_count = 0
        existing_count = 0

        for code in all_project_codes:
            if not code:  # Skip empty codes
                continue

            # Prepare project details
            project_details = PROJECT_NAME_MAP.get(code, {})
            project_name = project_details.get("name", code)
            project_type = project_details.get("type", "FORFAIT")

            # Create project if not exists
            project, created = Project.objects.get_or_create(
                code=code,
                defaults={
                    "name": project_name,
                    "type": project_type,
                    "description": f"Project synchronized for code {code}",
                },
            )

            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f"Created project: {code}"))
            else:
                existing_count += 1

        # Detailed reporting
        self.stdout.write(self.style.SUCCESS("\nSynchronization Summary:"))
        self.stdout.write(f"- Total unique project codes: {len(all_project_codes)}")
        self.stdout.write(f"- Created new projects: {created_count}")
        self.stdout.write(f"- Existing projects: {existing_count}")
