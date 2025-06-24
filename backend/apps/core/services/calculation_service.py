from decimal import Decimal
from django.db.models import Sum, F, Q, Case, When
from django.db import models
import logging
from apps.commandes.models import Commande
from typing import Optional, Tuple

logger = logging.getLogger(__name__)


class CalculationService:
    """
    Service for handling financial calculations.

    This service provides methods for calculating various financial metrics:
    - Committed expenses (standard and real)
    - Invoiced expenses (standard and real)
    - Project completion costs
    - Profitability ratios
    """

    @staticmethod
    def validate_input(numero_article: str, code_projet: str) -> bool:
        """
        Validate input parameters for calculations.

        Args:
            numero_article: Article number to validate
            code_projet: Project code to validate

        Returns:
            bool: True if inputs are valid and records exist, False otherwise
        """
        if not numero_article or not code_projet:
            logger.error(
                f"Invalid input: article={numero_article}, project={code_projet}"
            )
            return False

        exists = Commande.objects.filter(
            numero_article=numero_article, code_projet=code_projet
        ).exists()

        if not exists:
            logger.warning(
                f"No Commande records found for article={numero_article}, project={code_projet}"
            )
            return False

        return True

    @staticmethod
    def calculate_depenses_engagees(
        numero_article: Optional[str] = None, code_projet: Optional[str] = None
    ) -> Decimal:
        """
        Calculate total committed expenses with flexible filtering.

        Args:
            numero_article: Optional article number filter
            code_projet: Optional project code filter

        Returns:
            Decimal: Total committed expenses
        """
        try:
            query = Commande.objects.filter(annule="N")

            if numero_article:
                query = query.filter(numero_article=numero_article)
            if code_projet:
                query = query.filter(code_projet=code_projet)

            result = query.aggregate(total=Sum("total_lignes"))
            total = result["total"] or Decimal("0")

            logger.info(
                f"Depenses engagees calculation: Article: {numero_article or 'ALL'}, "
                f"Project: {code_projet or 'ALL'}, Total: {total}"
            )

            return total
        except Exception as e:
            logger.error(f"Error calculating depenses engagees: {str(e)}")
            return Decimal("0")

    @staticmethod
    def calculate_depenses_facturees(
        numero_article: Optional[str] = None, code_projet: Optional[str] = None
    ) -> Decimal:
        """
        Calculate total invoiced expenses using the formula:
        prix * (quantite - quantite_en_cours) * cours_change
        where cours_change defaults to 1 when it's 0 (MAD currency)

        Args:
            numero_article: Optional article number filter
            code_projet: Optional project code filter

        Returns:
            Decimal: Total invoiced expenses
        """
        try:
            query = Commande.objects.filter(annule="N")

            if numero_article:
                query = query.filter(numero_article=numero_article)
            if code_projet:
                query = query.filter(code_projet=code_projet)

            result = query.aggregate(
                total=Sum(
                    F("prix")
                    * (F("quantite") - F("quantite_en_cours"))
                    * Case(
                        When(cours_change=0, then=1),
                        default=F("cours_change"),
                        output_field=models.DecimalField(),
                    )
                )
            )
            total = result["total"] or Decimal("0")

            logger.info(
                f"Depenses facturees calculation: Article: {numero_article or 'ALL'}, "
                f"Project: {code_projet or 'ALL'}, Total: {total}"
            )

            return total
        except Exception as e:
            logger.error(f"Error calculating depenses facturees: {str(e)}")
            return Decimal("0")

    @staticmethod
    def get_reste_a_depenser() -> Decimal:
        """Get reste_a_depenser value from manual input."""
        return Decimal("0")

    @staticmethod
    def calculate_fin_chantier(
        depenses_engagees: Decimal, reste_a_depenser: Optional[Decimal]
    ) -> Decimal:
        """
        Calculate estimated project completion cost.

        Args:
            depenses_engagees: Total committed expenses
            reste_a_depenser: Remaining amount to spend

        Returns:
            Decimal: Estimated completion cost
        """
        try:
            reste = reste_a_depenser or Decimal("0")
            fin_chantier = depenses_engagees + reste

            logger.info(
                f"Fin chantier calculation: {depenses_engagees} + {reste} = {fin_chantier}"
            )
            return fin_chantier
        except Exception as e:
            logger.error(f"Error calculating fin chantier: {str(e)}")
            return Decimal("0")

    @staticmethod
    def calculate_rentabilite(
        prix_vente: Optional[Decimal], fin_chantier: Decimal
    ) -> Decimal:
        """
        Calculate project profitability.

        Args:
            prix_vente: Selling price
            fin_chantier: Estimated completion cost

        Returns:
            Decimal: Profitability ratio
        """
        try:
            prix = prix_vente or Decimal("0")

            if fin_chantier == Decimal("0") or prix == Decimal("0"):
                return Decimal("0")

            try:
                return fin_chantier / prix
            except ZeroDivisionError:
                logger.warning("Division by zero in rentabilite calculation")
                return Decimal("0")

        except Exception as e:
            logger.error(f"Error calculating rentabilite: {str(e)}")
            return Decimal("0")

    @staticmethod
    def calculate_depenses_facturees_reel(
        numero_article: Optional[str] = None, code_projet: Optional[str] = None
    ) -> Decimal:
        """
        Calculate real invoiced expenses based on delivered quantities.

        Args:
            numero_article: Optional article number filter
            code_projet: Optional project code filter

        Returns:
            Decimal: Total real invoiced expenses
        """
        try:
            query = Commande.objects.filter(annule="N")

            if numero_article:
                query = query.filter(numero_article=numero_article)
            if code_projet:
                query = query.filter(code_projet=code_projet)

            result = query.aggregate(
                total=Sum(
                    F("quantite_livree")
                    * F("prix")
                    * Case(
                        When(cours_change=0, then=1),
                        default=F("cours_change"),
                        output_field=models.DecimalField(),
                    )
                )
            )
            total = result["total"] or Decimal("0")

            logger.info(
                f"Depenses facturees reel calculation: Article: {numero_article or 'ALL'}, "
                f"Project: {code_projet or 'ALL'}, Total: {total}"
            )

            return total
        except Exception as e:
            logger.error(f"Error calculating depenses facturees reel: {str(e)}")
            return Decimal("0")

    @staticmethod
    def calculate_depenses_engagees_reel(
        numero_article: Optional[str] = None, code_projet: Optional[str] = None
    ) -> Decimal:
        """
        Calculate real committed expenses based on order status.

        For open orders ('O'): quantite * prix * cours_change
        For closed orders ('C'): quantite_livree * prix * cours_change

        Args:
            numero_article: Optional article number filter
            code_projet: Optional project code filter

        Returns:
            Decimal: Total real committed expenses
        """
        try:
            query = Commande.objects.filter(annule="N")

            if numero_article:
                query = query.filter(numero_article=numero_article)
            if code_projet:
                query = query.filter(code_projet=code_projet)

            # Calculate for open status ('O')
            open_result = query.filter(statut_document="O").aggregate(
                total=Sum(
                    F("quantite")
                    * F("prix")
                    * Case(
                        When(cours_change=0, then=1),
                        default=F("cours_change"),
                        output_field=models.DecimalField(),
                    )
                )
            )

            # Calculate for closed status ('C')
            closed_result = query.filter(statut_document="C").aggregate(
                total=Sum(
                    F("quantite_livree")
                    * F("prix")
                    * Case(
                        When(cours_change=0, then=1),
                        default=F("cours_change"),
                        output_field=models.DecimalField(),
                    )
                )
            )

            open_total = open_result["total"] or Decimal("0")
            closed_total = closed_result["total"] or Decimal("0")
            total = open_total + closed_total

            logger.info(
                f"Depenses engagees reel calculation: Article: {numero_article or 'ALL'}, "
                f"Project: {code_projet or 'ALL'}, "
                f"Open Total: {open_total}, Closed Total: {closed_total}, "
                f"Final Total: {total}"
            )

            return total
        except Exception as e:
            logger.error(f"Error calculating depenses engagees reel: {str(e)}")
            return Decimal("0")

    @staticmethod
    def calculate_rentabilite_reel(
        prix_vente: Optional[Decimal], fin_chantier_reel: Decimal
    ) -> Decimal:
        """
        Calculate real project profitability.

        Args:
            prix_vente: Selling price
            fin_chantier_reel: Real completion cost

        Returns:
            Decimal: Real profitability ratio
        """
        try:
            prix = prix_vente or Decimal("0")

            if fin_chantier_reel == Decimal("0") or prix == Decimal("0"):
                return Decimal("0")

            try:
                return fin_chantier_reel / prix
            except ZeroDivisionError:
                logger.warning("Division by zero in rentabilite reel calculation")
                return Decimal("0")

        except Exception as e:
            logger.error(f"Error calculating rentabilite reel: {str(e)}")
            return Decimal("0")

    @classmethod
    def get_summary_metrics(
        cls,
        numero_article: str,
        code_projet: Optional[str] = None,
        prix_vente: Optional[Decimal] = None,
    ) -> Tuple[
        Decimal, Decimal, Decimal, Decimal, Decimal, Decimal, Decimal, Decimal, Decimal
    ]:
        """
        Calculate all summary metrics for a specific article and optional project.

        Args:
            numero_article: Article number to calculate metrics for
            code_projet: Optional project code filter

        Returns:
            Tuple containing:
            - depenses_engagees
            - depenses_facturees
            - depenses_engagees_reel
            - depenses_facturees_reel
            - reste_a_depenser
            - fin_chantier
            - fin_chantier_reel
            - rentabilite
            - rentabilite_reel
        """
        try:
            # Calculate base metrics
            depenses_engagees = cls.calculate_depenses_engagees(
                numero_article, code_projet
            )
            depenses_facturees = cls.calculate_depenses_facturees(
                numero_article, code_projet
            )
            depenses_engagees_reel = cls.calculate_depenses_engagees_reel(
                numero_article, code_projet
            )
            depenses_facturees_reel = cls.calculate_depenses_facturees_reel(
                numero_article, code_projet
            )
            reste_a_depenser = cls.get_reste_a_depenser()

            # Calculate fin_chantier metrics
            fin_chantier = cls.calculate_fin_chantier(
                depenses_engagees, reste_a_depenser
            )
            fin_chantier_reel = cls.calculate_fin_chantier(
                depenses_engagees_reel, reste_a_depenser
            )

            # Ensure prix_vente is passed through or default to Decimal("0")
            prix_vente = prix_vente if prix_vente is not None else Decimal("0")
            rentabilite = cls.calculate_rentabilite(prix_vente, fin_chantier)
            rentabilite_reel = cls.calculate_rentabilite_reel(
                prix_vente, fin_chantier_reel
            )

            logger.info(
                f"Summary Metrics - Article: {numero_article}, Project: {code_projet or 'ALL'}, "
                f"Depenses Engagees: {depenses_engagees}, "
                f"Depenses Facturees: {depenses_facturees}, "
                f"Depenses Engagees Reel: {depenses_engagees_reel}, "
                f"Depenses Facturees Reel: {depenses_facturees_reel}, "
                f"Reste a Depenser: {reste_a_depenser}, "
                f"Fin Chantier: {fin_chantier}, "
                f"Fin Chantier Reel: {fin_chantier_reel}, "
                f"Rentabilite: {rentabilite}, "
                f"Rentabilite Reel: {rentabilite_reel}"
            )

            return (
                depenses_engagees,
                depenses_facturees,
                depenses_engagees_reel,
                depenses_facturees_reel,
                reste_a_depenser,
                fin_chantier,
                fin_chantier_reel,
                rentabilite,
                rentabilite_reel,
            )

        except Exception as e:
            logger.error(
                f"Error calculating summary metrics for {numero_article}: {str(e)}"
            )
            return (
                Decimal("0"),
                Decimal("0"),
                Decimal("0"),
                Decimal("0"),
                Decimal("0"),
                Decimal("0"),
                Decimal("0"),
                Decimal("0"),
                Decimal("0"),
            )
