import logging
from django.db.models import Sum
from typing import Dict
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser
from drf_spectacular.utils import extend_schema, OpenApiParameter
from django.db.models import QuerySet

from .models import Facturation, Avancement
from .serializers.facturation_serializer import (
    FacturationSerializer,
    AvancementSerializer,
    FacturationMetricsSerializer,
    EvolutionDataSerializer,
)
from .services.facturation_import_service import FacturationImportService
from .services.facturation_analytics_service import FacturationAnalyticsService

# Configure logging for the module
logger = logging.getLogger(__name__)


class FacturationViewSet(viewsets.ModelViewSet):
    """
    Comprehensive ViewSet for managing Facturation and Avancement data.

    Provides a set of API endpoints for:
    - Uploading Excel files with financial data
    - Retrieving project metrics
    - Fetching evolution data for charts
    - Accessing detailed tables
    - Deleting project-specific data

    Key Responsibilities:
    1. Data Import: Process Excel files with financial information
    2. Analytics: Generate metrics and evolution data
    3. Data Management: Retrieve and delete project-specific records

    Attributes:
        queryset (QuerySet): All Facturation records
        serializer_class (FacturationSerializer): Default serializer for Facturation
        parser_classes (list): Supports MultiPart file uploads
    """

    # Define the base queryset and serializer
    queryset = Facturation.objects.all()
    serializer_class = FacturationSerializer
    parser_classes = [MultiPartParser]

    def __init__(self, *args, **kwargs):
        """
        Initialize the FacturationViewSet with required services.

        Sets up:
        - Import service for processing Excel files
        - Analytics service for generating metrics and evolution data
        """
        super().__init__(*args, **kwargs)
        self.import_service = FacturationImportService()
        self.analytics_service = FacturationAnalyticsService()

    @extend_schema(
        description="Upload an Excel file containing Facturation and Avancement data",
        responses={
            201: {"description": "Excel file processed successfully"},
            400: {"description": "Invalid file or processing error"},
        },
    )
    @action(detail=False, methods=["POST"], url_path="upload-excel")
    def upload_excel(self, request):
        """
        Handle Excel file upload for Facturation and Avancement data.

        Process steps:
        1. Validate file presence
        2. Log file name
        3. Process the uploaded Excel file
        4. Return processing results

        Returns:
            Response: Processed file details or error information

        Raises:
            Exception: If file processing fails
        """
        try:
            # Retrieve the uploaded file
            excel_file = request.FILES.get("file")

            # Validate file presence
            if not excel_file:
                return Response(
                    {"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST
                )

            # Log file processing
            logger.info(f"Processing excel file: {excel_file.name}")

            # Process the Excel file
            result = self.import_service.process_excel_import(excel_file)

            # Log successful import
            logger.info(f"Excel import completed: {result}")

            return Response(result, status=status.HTTP_201_CREATED)

        except Exception as e:
            # Log and handle any processing errors
            logger.error(f"Error in upload_excel: {str(e)}", exc_info=True)
            return Response(
                {"error": "Failed to process Excel file", "details": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @extend_schema(
        description="Retrieve financial metrics for a specific project",
        parameters=[
            OpenApiParameter(
                name="project_code",
                description="Unique identifier for the project",
                required=True,
                type=str,
            ),
        ],
        responses={
            200: FacturationMetricsSerializer,
            400: {"description": "Invalid project code or retrieval error"},
        },
    )
    @action(detail=False, methods=["GET"], url_path="metrics/(?P<project_code>[^/.]+)")
    def get_metrics(self, request, project_code=None):
        """
        Retrieve comprehensive financial metrics for a specific project.

        Calculates and returns key financial indicators including:
        - Total invoiced amounts
        - Cumulative payments
        - Other project-specific financial metrics

        Args:
            request (Request): HTTP request object
            project_code (str): Unique project identifier

        Returns:
            Response: Serialized project metrics

        Raises:
            Exception: If metrics retrieval fails
        """
        try:
            # Log metrics retrieval attempt
            logger.info(f"Fetching metrics for project: {project_code}")

            # Retrieve project metrics
            metrics = self.analytics_service.get_project_metrics(project_code)

            # Serialize and return metrics
            serializer = FacturationMetricsSerializer(metrics)
            return Response(serializer.data)

        except Exception as e:
            # Log and handle any retrieval errors
            logger.error(f"Error in get_metrics: {str(e)}", exc_info=True)
            return Response(
                {"error": "Failed to retrieve metrics", "details": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @extend_schema(
        description="Retrieve financial evolution data for charting",
        parameters=[
            OpenApiParameter(
                name="project_code",
                description="Unique identifier for the project",
                required=True,
                type=str,
            ),
        ],
        responses={
            200: EvolutionDataSerializer,
            400: {"description": "Invalid project code or retrieval error"},
        },
    )
    @action(
        detail=False, methods=["GET"], url_path="evolution/(?P<project_code>[^/.]+)"
    )
    def get_evolution(self, request, project_code=None):
        """
        Retrieve financial evolution data for generating time-series charts.

        Provides:
        - Monthly cumulative invoicing data
        - Cumulative payment progression
        - Trends in financial performance

        Args:
            request (Request): HTTP request object
            project_code (str): Unique project identifier

        Returns:
            Response: Serialized evolution data for charting

        Raises:
            Exception: If evolution data retrieval fails
        """
        try:
            # Log evolution data retrieval attempt
            logger.info(f"Fetching evolution data for project: {project_code}")

            # Retrieve project evolution data
            evolution_data = self.analytics_service.get_evolution_data(project_code)

            # Serialize and return evolution data
            serializer = EvolutionDataSerializer(evolution_data)
            return Response(serializer.data)

        except Exception as e:
            # Log and handle any retrieval errors
            logger.error(f"Error in get_evolution: {str(e)}", exc_info=True)
            return Response(
                {"error": "Failed to retrieve evolution data", "details": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @extend_schema(
        description="Retrieve detailed Facturation and Avancement tables for a project",
        parameters=[
            OpenApiParameter(
                name="project_code",
                description="Unique identifier for the project",
                required=True,
                type=str,
            ),
        ],
        responses={
            200: {"description": "Detailed tables retrieved successfully"},
            400: {"description": "Error retrieving table data"},
        },
    )
    @action(detail=False, methods=["GET"], url_path="tables/(?P<project_code>[^/.]+)")
    def get_tables(self, request, project_code=None):
        """
        Retrieve comprehensive tables for Facturation and Avancement.

        Fetches:
        - Detailed Facturation records
        - Detailed Avancement records
        - Ordered by most recent date

        Args:
            request (Request): HTTP request object
            project_code (str): Unique project identifier

        Returns:
            Response: Serialized Facturation and Avancement tables

        Raises:
            Exception: If table data retrieval fails
        """
        try:
            # Log tables data retrieval attempt
            logger.info(f"Fetching tables data for project: {project_code}")

            # Retrieve Facturation records, ordered by most recent
            facturation_data = Facturation.objects.filter(
                project_code=project_code
            ).order_by("-registration_date")

            # Retrieve Avancement records, ordered by most recent
            avancement_data = Avancement.objects.filter(
                project_code=project_code
            ).order_by("-accounting_date")

            # Return serialized tables data
            return Response(
                {
                    "facturation": FacturationSerializer(
                        facturation_data, many=True
                    ).data,
                    "avancement": AvancementSerializer(avancement_data, many=True).data,
                }
            )

        except Exception as e:
            # Log and handle any retrieval errors
            logger.error(f"Error in get_tables: {str(e)}", exc_info=True)
            return Response(
                {"error": "Failed to retrieve tables data", "details": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @extend_schema(
        description="Permanently delete all Facturation and Avancement data for a project",
        parameters=[
            OpenApiParameter(
                name="project_code",
                description="Unique identifier for the project to be deleted",
                required=True,
                type=str,
            ),
        ],
        responses={
            200: {"description": "Project data deleted successfully"},
            400: {"description": "Error during project data deletion"},
        },
    )
    @action(
        detail=False, methods=["DELETE"], url_path="delete/(?P<project_code>[^/.]+)"
    )
    def delete_project_data(self, request, project_code=None):
        """
        Permanently remove all Facturation and Avancement records for a specific project.

        Deletion process:
        1. Remove all Facturation records for the project
        2. Remove all Avancement records for the project
        3. Generate and return a deletion summary

        Args:
            request (Request): HTTP request object
            project_code (str): Unique project identifier

        Returns:
            Response: Summary of deletion operation

        Raises:
            Exception: If project data deletion fails
        """
        try:
            # Log project data deletion attempt
            logger.info(f"Deleting data for project: {project_code}")

            # Delete Facturation records
            facturation_deleted = Facturation.objects.filter(
                project_code=project_code
            ).delete()

            # Delete Avancement records
            avancement_deleted = Avancement.objects.filter(
                project_code=project_code
            ).delete()

            # Prepare deletion summary
            deletion_summary = {
                "facturation_count": facturation_deleted[0],
                "avancement_count": avancement_deleted[0],
                "message": f"Successfully deleted data for project {project_code}",
            }

            # Log deletion details
            logger.info(f"Deletion summary: {deletion_summary}")

            return Response(deletion_summary)

        except Exception as e:
            # Log and handle any deletion errors
            logger.error(f"Error deleting project data: {str(e)}", exc_info=True)
            return Response(
                {"error": "Failed to delete project data", "details": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )
