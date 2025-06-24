import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth.models import User
from django.db.models import Count, Q

from .models import Project, ProjectMembership
from .serializers import (
    ProjectSerializer,
    ProjectMembershipSerializer,
    UserProjectsSerializer,
    ProjectEnsureSerializer,
)
from apps.core.constants import PROJECT_NAME_MAP

# Configure logging for the module
logger = logging.getLogger(__name__)


class EnsureProjectExistsView(APIView):
    """
    View to ensure a project exists, creating it if necessary
    """

    def get(self, request, project_code):
        try:
            # Try to get the project, create if not exists
            project, created = Project.objects.get_or_create(
                code=project_code,
                defaults={
                    "name": PROJECT_NAME_MAP.get(project_code, {}).get(
                        "name", project_code
                    ),
                    "type": PROJECT_NAME_MAP.get(project_code, {}).get(
                        "type", "FORFAIT"
                    ),
                    "description": f"Project automatically created for {project_code}",
                },
            )

            # Serialize the project
            serializer = ProjectEnsureSerializer(project)

            return Response(
                {"project": serializer.data, "created": created},
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            logger.error(f"Error ensuring project exists: {str(e)}")
            return Response(
                {"error": "Unable to create or retrieve project", "details": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )


class ProjectViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Project management with advanced filtering and actions
    """

    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    lookup_field = "code"

    def get_queryset(self):
        queryset = Project.objects.all()
        project_type = self.request.query_params.get("type")
        is_active = self.request.query_params.get("active")

        logger.debug(
            f"Filtering projects - Type: {project_type}, Is Active: {is_active}"
        )

        if project_type:
            queryset = queryset.filter(type=project_type)
        if is_active is not None:
            is_active = is_active.lower() in ["true", "1", "yes"]
            queryset = queryset.filter(is_active=is_active)

        logger.debug(f"Filtered queryset count: {queryset.count()}")
        return queryset

    @action(detail=False, methods=["GET"])
    def ensure_project(self, request):
        """
        Endpoint to ensure a project exists
        """
        project_code = request.query_params.get("code")

        if not project_code:
            return Response(
                {"error": "Project code is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            project, created = Project.objects.get_or_create(
                code=project_code,
                defaults={
                    "name": PROJECT_NAME_MAP.get(project_code, {}).get(
                        "name", project_code
                    ),
                    "type": PROJECT_NAME_MAP.get(project_code, {}).get(
                        "type", "FORFAIT"
                    ),
                    "description": f"Project automatically created for {project_code}",
                },
            )

            serializer = self.get_serializer(project)

            return Response(
                {"project": serializer.data, "created": created},
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            logger.error(f"Error in ensure_project action: {str(e)}")
            return Response(
                {"error": "Unable to create or retrieve project", "details": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @action(detail=True, methods=["POST"])
    def add_member(self, request, code=None):
        """
        Add a member to the project with a specific role
        """
        logger.info(f"Adding member to project {code}")
        try:
            project = self.get_object()
            user_id = request.data.get("user_id")
            role = request.data.get("role", "MEMBER")

            logger.debug(f"Adding user {user_id} with role {role} to project {code}")

            user = User.objects.get(id=user_id)
            membership, created = ProjectMembership.objects.get_or_create(
                user=user, project=project, defaults={"role": role}
            )

            if not created:
                membership.role = role
                membership.save()

            logger.info(f"User {user.username} added to project {project.code}")

            serializer = ProjectMembershipSerializer(membership)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except User.DoesNotExist:
            logger.warning(f"Attempted to add non-existent user to project {code}")
            return Response(
                {"error": "User not found"}, status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error adding member to project {code}: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["GET"])
    def members(self, request, code=None):
        """
        Retrieve all members of a project
        """
        logger.info(f"Attempting to fetch members for project code: {code}")
        try:
            project = self.get_object()
            logger.info(f"Project found: {project}")
            memberships = ProjectMembership.objects.filter(project=project)
            logger.info(f"Number of memberships found: {memberships.count()}")
            serializer = ProjectMembershipSerializer(memberships, many=True)
            return Response(serializer.data)
        except Project.DoesNotExist:
            logger.error(f"Project with code {code} does not exist")
            return Response(
                {"detail": "Project not found"}, status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error fetching project members: {str(e)}")
            return Response({"detail": str(e)}, status=status.HTTP_404_NOT_FOUND)


class UserProjectViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for user project metrics and information
    """

    queryset = User.objects.all()
    serializer_class = UserProjectsSerializer

    def get_queryset(self):
        user = self.request.user
        logger.debug(f"Getting queryset for user: {user.username}")
        if user.is_staff:
            queryset = User.objects.all()
        else:
            queryset = User.objects.filter(id=user.id)
        logger.debug(f"Queryset count: {queryset.count()}")
        return queryset

    @action(detail=True, methods=["GET"])
    def project_metrics(self, request, pk=None):
        """
        Calculate and return project-related metrics for a user
        """
        logger.info(f"Calculating project metrics for user ID: {pk}")
        try:
            user = self.get_object()
            project_memberships = ProjectMembership.objects.filter(user=user)

            metrics = {
                "total_projects": project_memberships.count(),
                "roles_breakdown": {},
                "project_types": {},
            }

            for membership in project_memberships:
                metrics["roles_breakdown"][membership.role] = (
                    metrics["roles_breakdown"].get(membership.role, 0) + 1
                )
                project_type = membership.project.type
                metrics["project_types"][project_type] = (
                    metrics["project_types"].get(project_type, 0) + 1
                )

            logger.info(
                f"Generated project metrics for user {user.username}: {metrics}"
            )
            return Response(metrics)
        except Exception as e:
            logger.error(
                f"Error calculating project metrics for user ID {pk}: {str(e)}"
            )
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["GET"])
    def project_memberships(self, request, pk=None):
        """
        Retrieve all project memberships for a specific user.

        Provides comprehensive details about projects a user is associated with,
        including project information and user's role in each project.

        Args:
            request (Request): HTTP request object
            pk (int): User ID

        Returns:
            Response: List of project memberships with project details
        """
        logger.info(f"Retrieving project memberships for user ID: {pk}")
        try:
            user = self.get_object()
            project_memberships = ProjectMembership.objects.filter(user=user)

            logger.debug(f"Found {project_memberships.count()} project memberships")

            # Use ProjectMembershipSerializer to include full project details
            serializer = ProjectMembershipSerializer(project_memberships, many=True)

            logger.info(
                f"Successfully retrieved project memberships for user {user.username}"
            )
            return Response(serializer.data)
        except Exception as e:
            logger.error(
                f"Error retrieving project memberships for user ID {pk}: {str(e)}"
            )
            return Response(
                {"error": "Unable to retrieve project memberships", "details": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )
