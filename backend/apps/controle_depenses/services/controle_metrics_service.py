from typing import Dict, List, Optional
from decimal import Decimal
import logging
from django.core.exceptions import ValidationError
from django.db.models import Prefetch
from apps.core.services.calculation_service import CalculationService
from .controle_base_service import ControleBaseService
from .evolution_service import EvolutionService
from ..models import ControleDepense
from apps.core.constants import PROJECT_NAME_MAP, get_project_name, get_project_type

logger = logging.getLogger(__name__)


class ControleMetricsService(ControleBaseService):
    """
    Service for handling control metrics calculations and evolution data.
    This service computes and provides access to financial metrics and evolution data
    for ControleDepense records.
    """

    BATCH_SIZE = 100

    def __init__(self):
        super().__init__()
        self.calculation_service = CalculationService()
        self.evolution_service = EvolutionService()

    def _get_project_info(self, code_projet: str) -> tuple:
        """Get project type and name directly from constants."""
        return (get_project_type(code_projet), get_project_name(code_projet))

    def get_article_metrics(self, controle) -> Dict:
        """
        Get metrics for a specific article using core calculation service.
        Computes all financial metrics including standard and real values.

        Args:
            controle: ControleDepense instance to calculate metrics for

        Returns:
            Dict containing all calculated metrics
        """
        try:
            if not self.validate_record(controle):
                raise ValidationError(
                    f"Invalid control record: {controle.numero_article}"
                )

            project_type, project_name = self._get_project_info(controle.code_projet)

            # Get actual values from the controle record
            prix_vente_effectif = (
                controle.prix_vente_base
                if project_type == "METRE"
                else controle.prix_vente
            ) or Decimal("0")

            budget_effectif = (
                controle.budget_chef_projet_base
                if project_type == "METRE"
                else controle.budget_chef_projet
            ) or Decimal("0")

            reste_a_depenser = controle.reste_a_depenser or Decimal("0")

            # Get base metrics
            (
                depenses_engagees,
                depenses_facturees,
                depenses_engagees_reel,
                depenses_facturees_reel,
                _,  # Ignore default reste_a_depenser
                _,  # Will recalculate fin_chantier
                _,  # Will recalculate fin_chantier_reel
                _,  # Will recalculate rentabilite
                _,  # Will recalculate rentabilite_reel
            ) = self.calculation_service.get_summary_metrics(
                controle.numero_article,
                controle.code_projet,
                prix_vente_effectif,  # Pass the effective price
            )

            # Calculate fin_chantier values with actual reste_a_depenser
            fin_chantier = self.calculation_service.calculate_fin_chantier(
                depenses_engagees, reste_a_depenser
            )
            fin_chantier_reel = self.calculation_service.calculate_fin_chantier(
                depenses_engagees_reel, reste_a_depenser
            )

            # Calculate rentabilite with actual prix_vente
            rentabilite = self.calculation_service.calculate_rentabilite(
                prix_vente_effectif, fin_chantier
            )
            rentabilite_reel = self.calculation_service.calculate_rentabilite_reel(
                prix_vente_effectif, fin_chantier_reel
            )

            metrics = {
                # Project Information
                "numero_article": controle.numero_article,
                "code_projet": controle.code_projet,
                "project_name": project_name,
                "type_projet": project_type,
                # Project Values
                "prix_vente": controle.prix_vente or Decimal("0"),
                "prix_vente_base": controle.prix_vente_base or Decimal("0"),
                "budget_chef_projet": controle.budget_chef_projet or Decimal("0"),
                "budget_chef_projet_base": controle.budget_chef_projet_base
                or Decimal("0"),
                # Standard Metrics
                "depenses_engagees": depenses_engagees,
                "depenses_facturees": depenses_facturees,
                "fin_chantier": fin_chantier,
                "rentabilite": rentabilite,
                # Real Metrics
                "depenses_engagees_reel": depenses_engagees_reel,
                "depenses_facturees_reel": depenses_facturees_reel,
                "fin_chantier_reel": fin_chantier_reel,
                "rentabilite_reel": rentabilite_reel,
                # Additional Metrics
                "reste_a_depenser": reste_a_depenser,
                "fiabilite": controle.get_fiabilite_display() or "Non défini",
                "rapport": (
                    controle.budget_chef_projet / controle.prix_vente
                    if controle.prix_vente != 0
                    else Decimal("0")
                ),
                "rapport_atterrissage": (
                    budget_effectif / prix_vente_effectif
                    if prix_vente_effectif != 0
                    else Decimal("0")
                ),
                "status": self._calculate_status(rentabilite_reel),
            }

            logger.info(
                f"Calculated metrics for {controle.numero_article} with "
                f"prix_vente: {prix_vente_effectif}, "
                f"reste_a_depenser: {reste_a_depenser}, "
                f"fin_chantier: {fin_chantier}, "
                f"rentabilite: {rentabilite}"
            )

            return metrics

        except Exception as e:
            logger.error(
                f"Error calculating metrics for {controle.numero_article}: {str(e)}",
                exc_info=True,
            )
            raise

    def _calculate_status(self, rentabilite: Decimal) -> str:
        """Calculate project status based on real profitability."""
        if rentabilite > 1:
            return "Profitable"
        elif rentabilite == 1:
            return "Break-even"
        return "Loss"

    def get_all_metrics(
        self,
        numero_article: Optional[str] = None,
        code_projet: Optional[str] = None,
        type_projet: Optional[str] = None,
    ) -> List[Dict]:
        """
        Get metrics for all matching articles with batched processing.

        Args:
            numero_article: Optional filter by article number
            code_projet: Optional filter by project code
            type_projet: Optional filter by project type

        Returns:
            List of dictionaries containing metrics for each matching record
        """
        try:
            self.sync_controle_depense_records(numero_article, code_projet)

            # Build optimized query
            queryset = self.model_class.objects.all()
            if numero_article:
                queryset = queryset.filter(numero_article__icontains=numero_article)
            if code_projet:
                queryset = queryset.filter(code_projet=code_projet)
            if type_projet:
                matching_codes = [
                    code
                    for code, data in PROJECT_NAME_MAP.items()
                    if data["type"] == type_projet
                ]
                queryset = queryset.filter(code_projet__in=matching_codes)

            # Process in batches
            metrics = []
            total_records = queryset.count()
            for i in range(0, total_records, self.BATCH_SIZE):
                batch = queryset[i : i + self.BATCH_SIZE]
                metrics.extend(
                    [self.get_article_metrics(controle) for controle in batch]
                )
                logger.info(
                    f"Processed {min(i + self.BATCH_SIZE, total_records)} of {total_records} records"
                )

            return metrics

        except Exception as e:
            logger.error(f"Error getting all metrics: {str(e)}", exc_info=True)
            raise

    def get_evolution_data(self, code_projet: str) -> dict:
        """
        Get evolution data for a project through the evolution service.

        Args:
            code_projet: Project code to get evolution data for

        Returns:
            Dictionary containing evolution data arrays with monthly metrics
        """
        try:
            result = self.evolution_service.calculate_evolution_data(code_projet)

            if not result or not isinstance(result, dict):
                return {"controle": []}

            return {"controle": result.get("controle", []) or []}

        except Exception as e:
            logger.error(
                f"Error getting evolution data for {code_projet}: {str(e)}",
                exc_info=True,
            )
            return {"controle": []}
