# backend/apps/commandes/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser
from drf_spectacular.utils import extend_schema
from django_filters import rest_framework as filters

from .models import Commande
from .serializers.commande_serializer import CommandeSerializer, CommandeBulkSerializer
from .services.commande_service import CommandeService
from apps.core.exceptions import ExcelProcessingError
from apps.core.constants import get_project_name
from apps.core.pagination import FlexiblePageNumberPagination


class CommandeFilter(filters.FilterSet):
    code_projet = filters.CharFilter(field_name="code_projet", lookup_expr="exact")
    numero_document = filters.CharFilter(
        field_name="numero_document", lookup_expr="icontains"
    )

    class Meta:
        model = Commande
        fields = ["code_projet", "numero_document"]


class CommandeViewSet(viewsets.ModelViewSet):
    pagination_class = FlexiblePageNumberPagination
    queryset = Commande.objects.all().order_by("-id")
    serializer_class = CommandeSerializer
    commande_service = CommandeService()
    filterset_class = CommandeFilter

    def get_paginated_response(self, data):
        page_size = int(
            self.request.query_params.get("page_size", self.pagination_class.page_size)
        )

        # Update pagination class page size
        if hasattr(self, "paginator"):
            self.paginator.page_size = page_size

        # Log pagination details
        print(
            f"Pagination Details - Page Size: {page_size}, "
            f"Total Records: {self.paginator.page.paginator.count}"
        )

        response = super().get_paginated_response(data)
        response.data["page_size"] = page_size
        return response

    def list(self, request, *args, **kwargs):
        # Log incoming request parameters
        print(f"Request Method: {request.method}")
        print(f"Request Parameters: {request.query_params}")
        print(f"Page Size Parameter: {request.query_params.get('page_size')}")
        print(f"Project Filter: {request.query_params.get('code_projet')}")
        print(f"Document Number Filter: {request.query_params.get('numero_document')}")

        queryset = self.filter_queryset(self.get_queryset())
        print(f"Filtered Queryset Count: {queryset.count()}")

        # Apply pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            response = self.get_paginated_response(serializer.data)
            print(f"Response Data Length: {len(response.data['results'])}")
            return response

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def get_serializer_class(self):
        """Select appropriate serializer based on action."""
        if self.action == "bulk_create":
            return CommandeBulkSerializer
        return CommandeSerializer

    @extend_schema(
        description="Import commands from an Excel file",
        request={
            "multipart/form-data": {
                "type": "object",
                "properties": {
                    "file": {
                        "type": "string",
                        "format": "binary",
                        "description": "Excel file to import",
                    }
                },
            }
        },
        responses={
            201: CommandeSerializer(many=True),
            400: {
                "description": "Bad Request",
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "object",
                            "properties": {"error": {"type": "string"}},
                        }
                    }
                },
            },
        },
    )
    @action(detail=False, methods=["post"], parser_classes=[MultiPartParser])
    def import_excel(self, request):
        """
        Import commands from Excel file.
        POST /api/commandes/import_excel/
        """
        try:
            file = request.FILES.get("file")
            if not file:
                return Response(
                    {"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST
                )

            commands = self.commande_service.import_from_excel(file)
            serializer = self.get_serializer(commands, many=True)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except ExcelProcessingError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {"error": f"Unexpected error: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @extend_schema(
        description="Delete all commands from the database",
        responses={
            200: {
                "description": "Success",
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "object",
                            "properties": {
                                "message": {"type": "string"},
                                "count": {"type": "integer"},
                            },
                        }
                    }
                },
            },
            500: {
                "description": "Internal Server Error",
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "object",
                            "properties": {"error": {"type": "string"}},
                        }
                    }
                },
            },
        },
    )
    @action(detail=False, methods=["delete"])
    def clear_all(self, request):
        """
        Delete all commands from the database.
        DELETE /api/commandes/clear_all/
        """
        try:
            count, _ = Commande.objects.all().delete()
            return Response(
                {"message": f"Successfully deleted all commands", "count": count},
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to delete commands: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @extend_schema(
        description="Delete all commands for a specific project",
        responses={
            200: {
                "description": "Success",
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "object",
                            "properties": {
                                "message": {"type": "string"},
                                "count": {"type": "integer"},
                            },
                        }
                    }
                },
            },
            400: {"description": "Bad Request"},
            500: {"description": "Internal Server Error"},
        },
    )
    @action(detail=False, methods=["delete"])
    def delete_project(self, request):
        """
        Delete all commands for a specific project.
        DELETE /api/commandes/delete_project/?code_projet=<project_code>
        """
        project_code = request.query_params.get("code_projet")
        if not project_code:
            return Response(
                {"error": "Project code is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            count = Commande.objects.filter(code_projet=project_code).delete()[0]
            return Response(
                {
                    "message": f"Successfully deleted all commands for project {project_code}",
                    "count": count,
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to delete project commands: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @extend_schema(
        description="Get unique projects with their details",
        responses={
            200: {
                "description": "List of unique projects",
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "object",
                            "properties": {
                                "projects": {
                                    "type": "array",
                                    "items": {
                                        "type": "object",
                                        "properties": {
                                            "code": {"type": "string"},
                                            "name": {"type": "string"},
                                        },
                                    },
                                },
                                "count": {"type": "integer"},
                            },
                        }
                    }
                },
            }
        },
    )
    @action(detail=False, methods=["GET"])
    def unique_projects(self, request):
        try:
            unique_projects = Commande.objects.values("code_projet").distinct()
            projects_data = [
                {
                    "code": project["code_projet"],
                    "name": get_project_name(project["code_projet"]),
                }
                for project in unique_projects
            ]

            print(f"Unique projects count: {len(projects_data)}")
            print(f"Unique projects data: {projects_data}")

            return Response(
                {"projects": projects_data, "count": len(projects_data)},
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            print(f"Error in unique_projects: {str(e)}")
            return Response(
                {"error": f"Failed to retrieve unique projects: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        print(f"Filtered queryset count: {queryset.count()}")
        print(f"Filter parameters: {request.query_params}")

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
