from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from decimal import Decimal

from apps.core.models import BaseModel
from apps.controle_depenses.choices import PROJECT_TYPE_CHOICES, TYPE_FORFAIT


class UserProfile(models.Model):
    """
    Extended user profile with additional metadata and metrics
    """

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")

    # User metrics and tracking
    total_projects_created = models.PositiveIntegerField(default=0)
    total_project_value = models.DecimalField(
        max_digits=12, decimal_places=2, default=0
    )
    last_login_at = models.DateTimeField(null=True, blank=True)

    # Additional professional information
    department = models.CharField(
        max_length=100, null=True, blank=True, help_text="User's department"
    )
    job_title = models.CharField(
        max_length=100, null=True, blank=True, help_text="User's job title"
    )
    phone_number = models.CharField(
        max_length=20, null=True, blank=True, help_text="User's contact number"
    )

    def __str__(self):
        return f"Profile for {self.user.username}"


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """
    Automatically create a UserProfile when a new User is created
    """
    if created:
        UserProfile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """
    Ensure UserProfile is saved when User is saved
    """
    try:
        instance.profile.save()
    except UserProfile.DoesNotExist:
        UserProfile.objects.create(user=instance)


class Project(BaseModel):
    """
    Project model to track project details and user associations
    """

    code = models.CharField(
        max_length=50, unique=True, db_index=True, help_text="Unique project code"
    )
    name = models.CharField(max_length=255, help_text="Project name")
    type = models.CharField(
        max_length=10,
        choices=PROJECT_TYPE_CHOICES,
        default=TYPE_FORFAIT,
        help_text="Project type (Forfait or Maître d'oeuvre)",
    )
    description = models.TextField(
        null=True, blank=True, help_text="Project description"
    )

    # Financial metrics
    total_budget = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="Total project budget",
    )

    # Project status
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.code} - {self.name}"


class ProjectMembership(BaseModel):
    """
    Model to manage user-project relationships and roles
    """

    ROLE_CHOICES = [
        ("OWNER", "Project Owner"),
        ("MANAGER", "Project Manager"),
        ("MEMBER", "Team Member"),
        ("VIEWER", "Read-only Access"),
    ]

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="project_memberships"
    )
    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="memberships"
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="MEMBER")

    class Meta:
        unique_together = ("user", "project")
        verbose_name = "Project Membership"
        verbose_name_plural = "Project Memberships"

    def __str__(self):
        return f"{self.user.username} - {self.project.code} ({self.role})"
