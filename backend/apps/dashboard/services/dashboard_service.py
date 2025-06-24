from typing import Dict, List
from decimal import Decimal
from django.db.models import Sum, Count, Avg
from apps.commandes.models import Commande
from apps.controle_depenses.models import ControleDepense


class DashboardService:
    """
    Service for generating dashboard data and analytics.
    """

    @staticmethod
    def get_kpi_summary() -> Dict:
        """
        Get summary of key performance indicators.

        Returns:
            Dict containing KPI metrics
        """
        total_commandes = Commande.objects.count()
        total_amount = Commande.objects.aggregate(total=Sum("total_lignes"))
        avg_rentabilite = ControleDepense.objects.aggregate(avg=Avg("rentabilite"))

        return {
            "total_commandes": total_commandes,
            "total_amount": total_amount["total"] or Decimal("0"),
            "avg_rentabilite": avg_rentabilite["avg"] or Decimal("0"),
        }

    @staticmethod
    def get_expense_distribution() -> List[Dict]:
        """
        Get expense distribution by article type.

        Returns:
            List of expense distributions
        """
        return list(
            Commande.objects.values("numero_article")
            .annotate(total_expense=Sum("total_lignes"), order_count=Count("id"))
            .order_by("-total_expense")
        )

    @staticmethod
    def get_profitability_analysis() -> List[Dict]:
        """
        Get profitability analysis by article.

        Returns:
            List of profitability metrics
        """
        return list(
            ControleDepense.objects.values("numero_article")
            .annotate(
                prix_vente_total=Sum("prix_vente"),
                depenses_total=Sum("commande__total_lignes"),
            )
            .order_by("-prix_vente_total")
        )

    @staticmethod
    def get_project_summary(code_projet: str) -> Dict:
        """
        Get summary for a specific project.

        Args:
            code_projet: Project code

        Returns:
            Dict containing project metrics
        """
        return Commande.objects.filter(code_projet=code_projet).aggregate(
            total_orders=Count("id"),
            total_amount=Sum("total_lignes"),
            total_quantity=Sum("quantite"),
            in_progress_quantity=Sum("quantite_en_cours"),
        )
