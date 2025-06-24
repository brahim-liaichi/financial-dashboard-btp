from rest_framework import serializers
from django.contrib.auth.models import User
from ..models import Project, ProjectMembership


class ProjectEnsureSerializer(serializers.ModelSerializer):
    """
    Serializer for ensuring project exists with minimal fields
    """

    class Meta:
        model = Project
        fields = ["code", "name", "type"]


class ProjectSerializer(serializers.ModelSerializer):
    """
    Comprehensive Project Serializer
    """

    class Meta:
        model = Project
        fields = "__all__"


class ProjectMembershipSerializer(serializers.ModelSerializer):
    """
    Serializer for Project Membership
    """

    username = serializers.CharField(source="user.username", read_only=True)
    project_name = serializers.CharField(source="project.name", read_only=True)

    class Meta:
        model = ProjectMembership
        fields = ["id", "user", "username", "project", "project_name", "role"]


class UserProjectsSerializer(serializers.ModelSerializer):
    """
    Serializer for User Projects
    """

    projects = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "projects"]

    def get_projects(self, obj):
        """
        Get all projects for a user
        """
        project_memberships = obj.project_memberships.select_related("project")
        return [
            {
                "code": membership.project.code,
                "name": membership.project.name,
                "type": membership.project.type,
                "role": membership.role,
            }
            for membership in project_memberships
        ]
