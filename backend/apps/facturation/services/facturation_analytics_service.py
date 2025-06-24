import logging
import traceback
from decimal import Decimal
from typing import Dict, List, Optional, Any
from django.db.models import Sum
from ..models import Facturation, Avancement

logger = logging.getLogger(__name__)


class FacturationAnalyticsService:
    """
    Comprehensive service for calculating project metrics and evolution data.

    Provides advanced analytics capabilities for facturation and avancement,
    including project-level metrics and cumulative evolution data.

    Key Features:
    - Calculates total facturation and avancement amounts
    - Generates monthly cumulative evolution data
    - Direct database querying without caching
    """

    def __init__(self, facturation_model=Facturation, avancement_model=Avancement):
        """
        Initialize the FacturationAnalyticsService.

        Args:
            facturation_model (Model, optional): Facturation model to use
            avancement_model (Model, optional): Avancement model to use
        """
        self.facturation_model = facturation_model
        self.avancement_model = avancement_model

    def get_project_metrics(
        self, project_code: Optional[str] = None
    ) -> Dict[str, Decimal]:
        """
        Retrieve total Facturation and Avancement amounts for a specific project.

        Args:
            project_code (str, optional): Project code to retrieve metrics for

        Returns:
            Dict[str, Decimal]: Dictionary containing facturation and avancement totals
        """
        if not project_code:
            return {
                "facturation_total": Decimal("0.00"),
                "avancement_total": Decimal("0.00"),
            }

        try:
            # Parallel aggregation of facturation and avancement totals
            facturation_query = self.facturation_model.objects.filter(
                project_code=project_code
            ).aggregate(total=Sum("total_after_discount"))

            avancement_query = self.avancement_model.objects.filter(
                project_code=project_code
            ).aggregate(total=Sum("payment_ht"))

            return {
                "facturation_total": facturation_query["total"] or Decimal("0.00"),
                "avancement_total": avancement_query["total"] or Decimal("0.00"),
            }

        except Exception as e:
            logger.error(f"Error retrieving project metrics for {project_code}: {e}")
            return {
                "facturation_total": Decimal("0.00"),
                "avancement_total": Decimal("0.00"),
            }

    def _get_facturation_evolution(self, project_code: str) -> List[Dict]:
        """
        Calculate cumulative facturation evolution data grouped by month.

        Args:
            project_code (str): Project code to retrieve evolution data for

        Returns:
            List[Dict]: List of monthly cumulative facturation totals
        """
        try:
            # Get all records for the project, ordered by date
            records = self.facturation_model.objects.filter(
                project_code=project_code
            ).order_by("registration_date")

            # Initialize variables for tracking
            evolution_data = []
            cumulative_total = Decimal("0.00")

            # Group records by month
            monthly_groups = {}
            for record in records:
                month_key = record.registration_date.replace(day=1)
                if month_key not in monthly_groups:
                    monthly_groups[month_key] = []
                monthly_groups[month_key].append(record)

            # Sort month keys
            sorted_months = sorted(monthly_groups.keys())

            # Calculate cumulative totals for each month
            for month in sorted_months:
                month_total = sum(
                    record.total_after_discount for record in monthly_groups[month]
                )
                cumulative_total += month_total

                evolution_data.append(
                    {
                        "date": month.isoformat(),
                        "total_after_discount": float(cumulative_total),
                    }
                )

            logger.info(
                f"Facturation Evolution for {project_code}: {len(evolution_data)} records"
            )
            return evolution_data

        except Exception as e:
            logger.error(
                f"Error calculating facturation evolution for {project_code}: {e}"
            )
            logger.error(traceback.format_exc())
            return []

    def _get_avancement_evolution(self, project_code: str) -> List[Dict]:
        """
        Calculate cumulative avancement evolution data grouped by month.

        Args:
            project_code (str): Project code to retrieve evolution data for

        Returns:
            List[Dict]: List of monthly cumulative avancement totals
        """
        try:
            # Get all records for the project, ordered by date
            records = self.avancement_model.objects.filter(
                project_code=project_code
            ).order_by("accounting_date")

            # Initialize variables for tracking
            evolution_data = []
            cumulative_total = Decimal("0.00")

            # Group records by month
            monthly_groups = {}
            for record in records:
                month_key = record.accounting_date.replace(day=1)
                if month_key not in monthly_groups:
                    monthly_groups[month_key] = []
                monthly_groups[month_key].append(record)

            # Sort month keys
            sorted_months = sorted(monthly_groups.keys())

            # Calculate cumulative totals for each month
            for month in sorted_months:
                month_total = sum(record.payment_ht for record in monthly_groups[month])
                cumulative_total += month_total

                evolution_data.append(
                    {
                        "date": month.isoformat(),
                        "total_payment": float(cumulative_total),
                    }
                )

            logger.info(
                f"Avancement Evolution for {project_code}: {len(evolution_data)} records"
            )
            return evolution_data

        except Exception as e:
            logger.error(
                f"Error calculating avancement evolution for {project_code}: {e}"
            )
            logger.error(traceback.format_exc())
            return []

    def get_evolution_data(self, project_code: Optional[str] = None) -> Dict[str, Any]:
        """
        Retrieve cumulative evolution data for both facturation and avancement.

        Args:
            project_code (str, optional): Project code to retrieve evolution data for

        Returns:
            Dict[str, Any]: Dictionary containing facturation and avancement evolution data
        """
        if not project_code:
            return {"facturation": [], "avancement": []}

        try:
            return {
                "facturation": self._get_facturation_evolution(project_code),
                "avancement": self._get_avancement_evolution(project_code),
            }

        except Exception as e:
            logger.error(f"Error retrieving evolution data for {project_code}: {e}")
            return {"facturation": [], "avancement": []}
