import logging
import traceback

from django.db.models import Sum, F, Count, DecimalField, ExpressionWrapper

# from django.core.cache import cache
from django.db.models.functions import TruncMonth

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from drf_spectacular.utils import extend_schema, OpenApiParameter

from apps.commandes.models import Commande
from apps.commandes.serializers.commande_serializer import CommandeSerializer
from .models import ControleDepense
from apps.facturation.models import Facturation, Avancement
from .serializers.controle_serializer import (
    ControleDepenseSerializer,
    ControleDepenseMetricsSerializer,
    ControleDepenseUpdateSerializer,
)
from .services import ControleMetricsService
from apps.core.constants import PROJECT_NAME_MAP, get_project_name, get_project_type

logger = logging.getLogger(__name__)


class ControleDepenseViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing ControleDepense records and their associated metrics.

    Financial Metrics Categories:

    1. Standard Metrics (Theoretical/Planned):
        - depenses_engagees: Total committed expenses from commandes
        - depenses_facturees: Invoiced expenses (quantity - ongoing_quantity)
        - fin_chantier: Projected end cost (depenses_engagees + reste_a_depenser)
        - rentabilite: Profitability ratio (fin_chantier / prix_vente)

    2. Real Metrics (Actual/Delivered):
        - depenses_engagees_reel: Real committed expenses
            * Open orders (O): quantity * price * exchange_rate
            * Closed orders (C): delivered_quantity * price * exchange_rate
        - depenses_facturees_reel: Real invoiced expenses
            * Based on delivered_quantity * price * exchange_rate
        - fin_chantier_reel: Real projected end cost
            * depenses_engagees_reel + reste_a_depenser
        - rentabilite_reel: Real profitability ratio
            * fin_chantier_reel / prix_vente

    3. Project Metrics:
        - prix_vente: Selling price (FORFAIT)
        - prix_vente_base: Base selling price (METRE)
        - budget_chef_projet: Project manager budget (FORFAIT)
        - budget_chef_projet_base: Base project manager budget (METRE)
        - reste_a_depenser: Remaining budget
        - fiabilite: Reliability indicator (A-E)
        - rapport: Budget to selling price ratio

    4. Evolution Data:
        - depenses_facturees: Monthly cumulative invoiced expenses
        - depenses_facturees_reel: Monthly cumulative real invoiced expenses
        - controle (depenses_engagees): Monthly cumulative committed expenses
        - controle_reel (depenses_engagees_reel): Monthly cumulative real committed expenses
    """

    queryset = ControleDepense.objects.all().order_by("numero_article", "code_projet")
    serializer_class = ControleDepenseSerializer
    controle_service = ControleMetricsService()

    def get_serializer_class(self):
        if self.action == "get_metrics":
            return ControleDepenseMetricsSerializer
        elif self.action in ["update_control", "partial_update"]:
            return ControleDepenseUpdateSerializer
        return ControleDepenseSerializer

    @extend_schema(
        description="""
       Get metrics for articles with flexible filtering.
       
       Supports filtering by:
       - Article number
       - Project code
       - Project type (FORFAIT/METRE)
       - Metrics type (standard/reel/all)
       
       Returns complete financial metrics including both standard and real calculations
       based on the metrics_type parameter.
       """,
        parameters=[
            OpenApiParameter(
                name="numero_article",
                description="Article number to filter metrics",
                required=False,
                type=str,
            ),
            OpenApiParameter(
                name="code_projet",
                description="Project code to filter metrics",
                required=False,
                type=str,
            ),
            OpenApiParameter(
                name="type_projet",
                description="Project type filter (FORFAIT/METRE)",
                required=False,
                type=str,
            ),
            OpenApiParameter(
                name="metrics_type",
                description="Filter metrics type (standard/reel/all)",
                required=False,
                type=str,
                default="all",
            ),
        ],
        responses={
            200: ControleDepenseMetricsSerializer(many=True),
            400: {"description": "Invalid parameters"},
            404: {"description": "No metrics found"},
            500: {"description": "Internal server error"},
        },
    )
    @action(detail=False, methods=["get"])
    def get_metrics(self, request):
        """
        Get financial metrics with flexible filtering options.

        Parameters:
            numero_article (str, optional): Filter by article number
            code_projet (str, optional): Filter by project code
            type_projet (str, optional): Filter by project type (FORFAIT/METRE)
            metrics_type (str, optional): Filter metrics type (standard/reel/all)

        Returns:
            Response: List of metric dictionaries containing requested financial data
        """
        try:
            numero_article = request.query_params.get("numero_article")
            code_projet = request.query_params.get("code_projet")
            type_projet = request.query_params.get("type_projet")
            metrics_type = request.query_params.get("metrics_type", "all")

            logger.info(
                f"Fetching metrics - Article: {numero_article}, "
                f"Project: {code_projet}, "
                f"Type: {type_projet}, "
                f"Metrics Type: {metrics_type}"
            )

            # Validate project type
            if type_projet and type_projet not in ["FORFAIT", "METRE"]:
                return Response(
                    {"error": "Invalid project type. Must be 'FORFAIT' or 'METRE'"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Validate metrics type
            if metrics_type not in ["standard", "reel", "all"]:
                return Response(
                    {
                        "error": "Invalid metrics_type. Must be 'standard', 'reel', or 'all'"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            metrics = self.controle_service.get_all_metrics(
                numero_article=numero_article,
                code_projet=code_projet,
                type_projet=type_projet,
            )

            # Filter metrics based on metrics_type
            if metrics_type == "standard":
                metrics = [
                    {k: v for k, v in m.items() if not k.endswith("_reel")}
                    for m in metrics
                ]
            elif metrics_type == "reel":
                metrics = [
                    {
                        k: v
                        for k, v in m.items()
                        if k.endswith("_reel")
                        or k
                        in [
                            "numero_article",
                            "code_projet",
                            "project_name",
                            "type_projet",
                        ]
                    }
                    for m in metrics
                ]

            if not metrics:
                return Response(
                    {"message": "No metrics found for the specified criteria"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            return Response(self.get_serializer(metrics, many=True).data)

        except Exception as e:
            logger.error(f"Error in get_metrics: {traceback.format_exc()}")
            return Response(
                {"error": "Failed to retrieve metrics", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @extend_schema(
        description="""
       Get evolution data showing the progression of financial metrics over time.
       
       Returns monthly cumulative totals for:
       - Standard invoiced and committed expenses
       - Real invoiced and committed expenses based on delivered quantities
       """,
        parameters=[
            OpenApiParameter(
                name="code_projet",
                description="Project code to get evolution data",
                required=True,
                type=str,
            )
        ],
        responses={
            200: {"description": "Evolution data with standard and real metrics"},
            400: {"description": "Missing project code"},
            500: {"description": "Internal server error"},
        },
    )
    @action(detail=False, methods=["get"])
    def get_evolution_data(self, request):
        """
        Get monthly evolution data for both standard and real metrics.

        Parameters:
            code_projet (str): Project code to get evolution data for

        Returns:
            Response: Dictionary containing evolution data arrays with monthly metrics
        """
        try:
            code_projet = request.query_params.get("code_projet")
            if not code_projet:
                return Response(
                    {"error": "code_projet is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            project_type = get_project_type(code_projet)
            project_name = get_project_name(code_projet)
            logger.info(
                f"Processing evolution data for project: {code_projet} "
                f"(type: {project_type}, name: {project_name})"
            )

            evolution_data = self.controle_service.get_evolution_data(code_projet)
            return Response(evolution_data)

        except Exception as e:
            logger.error(traceback.format_exc())
            return Response(
                {"error": "Failed to retrieve evolution data", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @extend_schema(
        description="Update control data for an article",
        request=ControleDepenseUpdateSerializer,
        responses={
            200: ControleDepenseMetricsSerializer,
            400: {"description": "Validation error"},
            500: {"description": "Internal server error"},
        },
    )
    @action(detail=False, methods=["post"])
    def update_control(self, request):
        logger.info(f"Update control request: {request.data}")

        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            logger.warning(f"Validation errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Filter out None values from the validated data
            update_params = {
                k: v for k, v in serializer.validated_data.items() if v is not None
            }

            # Get project type if code_projet is provided
            if "code_projet" in update_params:
                code_projet = update_params["code_projet"]
                project_type = get_project_type(code_projet)
                update_params["type_projet"] = project_type
                logger.info(f"Setting project type to: {project_type}")

            control = self.controle_service.update_control_data(**update_params)
            metrics = self.controle_service.get_article_metrics(control)

            return Response(ControleDepenseMetricsSerializer(metrics).data)

        except Exception as e:
            logger.error(f"Error in update_control: {traceback.format_exc()}")
            return Response(
                {"detail": "Failed to update control", "error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @extend_schema(
        description="Get commandes related to a specific controle",
        parameters=[
            OpenApiParameter(
                name="numero_article",
                description="Article number",
                required=True,
                type=str,
            ),
            OpenApiParameter(
                name="code_projet",
                description="Project code",
                required=True,
                type=str,
            ),
        ],
        responses={
            200: CommandeSerializer(many=True),
            400: {"description": "Missing required parameters"},
            404: {"description": "No commandes found"},
            500: {"description": "Internal server error"},
        },
    )
    @action(detail=False, methods=["get"])
    def get_related_commandes(self, request):
        try:
            numero_article = request.query_params.get("numero_article")
            code_projet = request.query_params.get("code_projet")

            if not numero_article or not code_projet:
                return Response(
                    {"detail": "Both numero_article and code_projet are required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Get project info for logging
            project_type = get_project_type(code_projet)
            project_name = get_project_name(code_projet)
            logger.info(
                f"Fetching commandes for Article: {numero_article}, "
                f"Project: {code_projet} (type: {project_type}, name: {project_name})"
            )

            commandes = self.controle_service.get_related_commandes(
                numero_article=numero_article, code_projet=code_projet
            )

            if not commandes:
                return Response(
                    {"detail": "No commandes found for the specified criteria"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            serializer = CommandeSerializer(commandes, many=True)
            logger.info(f"Retrieved {len(commandes)} commandes")

            return Response(serializer.data)

        except Exception as e:
            error_trace = traceback.format_exc()
            logger.error(f"Error in get_related_commandes: {error_trace}")
            return Response(
                {"detail": "Failed to retrieve commandes", "error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
