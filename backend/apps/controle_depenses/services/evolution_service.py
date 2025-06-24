import logging
import traceback
from decimal import Decimal
from django.db.models import (
    F,
    Sum,
    ExpressionWrapper,
    DecimalField,
    Case,
    When,
    Count,
    Q,
    Window,
    Subquery,
)
from django.db.models.functions import TruncMonth, Coalesce
from django.db import models
from apps.core.constants import MAX_DIGITS, DECIMAL_PLACES
from apps.commandes.models import Commande
from apps.core.services.base_service import BaseService

logger = logging.getLogger(__name__)


class EvolutionService(BaseService):
    """
    Service for handling evolution data calculations with cumulative totals.

    This service provides monthly aggregated financial data with running totals,
    specifically:
    - Cumulative invoiced expenses (depenses_facturees)
    - Cumulative committed expenses (controle)

    All calculations use Window functions for efficient database-level aggregation.
    """

    def __init__(self):
        super().__init__(Commande)

    def calculate_evolution_data(self, code_projet: str) -> dict:
        """
        Calculate cumulative financial evolution data for a project.

        Uses window functions to compute running totals at the database level,
        ensuring efficient processing of large datasets.

        Args:
            code_projet (str): Project code to calculate evolution for

        Returns:
            dict: Contains 'controle' key with list of monthly evolution data points,
                 each having date, depenses_facturees, and controle values

        Example:
            {
                'controle': [
                    {
                        'date': '2024-01-01T00:00:00',
                        'depenses_facturees': 1000.0,
                        'controle': 1500.0
                    },
                    ...
                ]
            }
        """
        try:
            logger.info(f"Calculating evolution for project: {code_projet}")

            # Base query for valid commandes with distinct months
            monthly_data = (
                Commande.objects.filter(code_projet=code_projet, annule="N")
                .annotate(
                    month=TruncMonth("date_enregistrement"),
                    cours_change_adjusted=Case(
                        When(cours_change=0, then=Decimal("1")),
                        default=F("cours_change"),
                        output_field=DecimalField(max_digits=10, decimal_places=4),
                    ),
                    depenses=F("prix")
                    * F("cours_change_adjusted")
                    * (F("quantite") - F("quantite_en_cours")),
                    depenses_eng=F("total_lignes"),
                )
                .values("month")
                .distinct()
                .annotate(
                    depenses_facturees=Window(
                        expression=Sum("depenses"),
                        order_by=F("month").asc(),
                        frame=None,
                    ),
                    controle=Window(
                        expression=Sum("depenses_eng"),
                        order_by=F("month").asc(),
                        frame=None,
                    ),
                )
                .order_by("month")
            )

            # Process data and remove duplicates
            evolution_data = []
            seen_months = set()

            for item in monthly_data:
                if item["month"] and item["month"].isoformat() not in seen_months:
                    seen_months.add(item["month"].isoformat())
                    evolution_data.append(
                        {
                            "date": item["month"].isoformat(),
                            "depenses_facturees": float(
                                item["depenses_facturees"] or 0
                            ),
                            "controle": float(item["controle"] or 0),
                        }
                    )

            logger.info(
                f"Evolution data calculated for {code_projet}: "
                f"{len(evolution_data)} months processed"
            )

            return {"controle": evolution_data}

        except Exception as e:
            logger.error(
                f"Error calculating evolution data for {code_projet}: {str(e)}"
            )
            logger.error(traceback.format_exc())
            return {"controle": []}
