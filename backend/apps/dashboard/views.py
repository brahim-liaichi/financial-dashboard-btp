from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, OpenApiParameter

from .models import DashboardPreference
from .serializers import (
    DashboardPreferenceSerializer,
    DashboardMetricsSerializer
)
from .services.dashboard_service import DashboardService

class DashboardViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing dashboard data and preferences.
    """
    queryset = DashboardPreference.objects.all()
    serializer_class = DashboardPreferenceSerializer
    permission_classes = [IsAuthenticated]
    dashboard_service = DashboardService()

    def get_queryset(self):
        """Filter queryset to current user."""
        return self.queryset.filter(user=self.request.user)

    @extend_schema(
        description="Get comprehensive dashboard metrics",
        responses={
            200: DashboardMetricsSerializer,
            400: {
                'description': 'Bad Request',
                'content': {
                    'application/json': {
                        'schema': {
                            'type': 'object',
                            'properties': {
                                'error': {'type': 'string'}
                            }
                        }
                    }
                }
            }
        }
    )
    @action(detail=False, methods=['get'])
    def metrics(self, request):
        """
        Get dashboard metrics.
        
        GET /api/dashboard/metrics/
        """
        # Change from await to sync method
        kpi_summary = self.dashboard_service.get_kpi_summary()
        expense_distribution = self.dashboard_service.get_expense_distribution()
        profitability_analysis = self.dashboard_service.get_profitability_analysis()

        data = {
            **kpi_summary,
            'expense_distribution': expense_distribution,
            'profitability_analysis': profitability_analysis
        }

        serializer = DashboardMetricsSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data)

    @extend_schema(
        description="Get project summary",
        parameters=[
            OpenApiParameter(
                name='code_projet', 
                description='Project code for summary', 
                required=True, 
                type=str
            )
        ],
        responses={
            200: dict,
            400: {
                'description': 'Bad Request',
                'content': {
                    'application/json': {
                        'schema': {
                            'type': 'object',
                            'properties': {
                                'error': {'type': 'string'}
                            }
                        }
                    }
                }
            }
        }
    )
    @action(detail=False, methods=['get'])
    def project_summary(self, request):
        """
        Get project summary.
        
        GET /api/dashboard/project_summary/?code_projet=<project_code>
        """
        code_projet = request.query_params.get('code_projet')
        if not code_projet:
            return Response(
                {'error': 'Project code is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Change from await to sync method
        summary = self.dashboard_service.get_project_summary(code_projet)
        return Response(summary)