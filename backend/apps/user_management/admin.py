from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import UserChangeForm, UserCreationForm

from .models import UserProfile, Project, ProjectMembership


class CustomUserChangeForm(UserChangeForm):
    """
    Custom user change form to remove any additional fields
    """

    class Meta:
        model = User
        fields = "__all__"
        exclude = ("usable_password",)  # Remove the problematic field


class CustomUserCreationForm(UserCreationForm):
    """
    Custom user creation form
    """

    class Meta:
        model = User
        fields = ("username", "email", "first_name", "last_name")


class UserProfileInline(admin.StackedInline):
    """
    Inline admin interface for UserProfile
    """

    model = UserProfile
    can_delete = False
    verbose_name_plural = "Profile"
    fk_name = "user"
    extra = 0  # Disable adding multiple profiles


class ProjectMembershipInline(admin.TabularInline):
    """
    Inline admin interface for Project Memberships
    """

    model = ProjectMembership
    extra = 1
    autocomplete_fields = ["project"]


class CustomUserAdmin(BaseUserAdmin):
    """
    Customized admin interface for Users
    """

    # Forms for creating and updating users
    form = CustomUserChangeForm
    add_form = CustomUserCreationForm

    # Columns displayed in the user list
    list_display = (
        "username",
        "email",
        "first_name",
        "last_name",
        "is_staff",
        "is_active",
    )

    # Filtering options
    list_filter = ("is_staff", "is_superuser", "is_active", "groups")

    # Search fields
    search_fields = ("username", "first_name", "last_name", "email")

    # Fieldsets for user editing
    fieldsets = (
        (None, {"fields": ("username", "password")}),
        ("Personal Info", {"fields": ("first_name", "last_name", "email")}),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )

    # Inlines to show with the user
    inlines = [UserProfileInline, ProjectMembershipInline]


class ProjectAdmin(admin.ModelAdmin):
    """
    Customized admin interface for Projects
    """

    list_display = ("code", "name", "type", "is_active", "total_budget")

    list_filter = ("type", "is_active")

    search_fields = ("code", "name")

    inlines = [ProjectMembershipInline]


class ProjectMembershipAdmin(admin.ModelAdmin):
    """
    Dedicated admin interface for Project Memberships
    """

    list_display = ("user", "project", "role")

    list_filter = ("project", "role")

    search_fields = ("user__username", "project__name", "project__code")

    autocomplete_fields = ["user", "project"]


class UserProfileAdmin(admin.ModelAdmin):
    """
    Admin interface for UserProfile
    """

    list_display = ("user", "department", "job_title", "total_projects_created")

    search_fields = ("user__username", "department", "job_title")

    list_filter = ("department",)


# Unregister the default UserAdmin
admin.site.unregister(User)

# Register our custom admins
admin.site.register(User, CustomUserAdmin)
admin.site.register(Project, ProjectAdmin)
admin.site.register(ProjectMembership, ProjectMembershipAdmin)
admin.site.register(UserProfile, UserProfileAdmin)
