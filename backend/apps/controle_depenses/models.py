# apps/controle_depenses/models.py

from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal
from apps.core.models import BaseModel
from apps.core.constants import MAX_DIGITS, DECIMAL_PLACES
from .choices import (
    FIABILITE_CHOICES,
    PROJECT_TYPE_CHOICES,
    TYPE_FORFAIT,
)


class ControleDepense(BaseModel):
    """
    Model representing expense control data.

    Financial Metrics Nomenclature:
    1. Standard Metrics (Theoretical/Planned):
       - depenses_facturees: Invoiced expenses based on (quantity - ongoing_quantity)
       - fin_chantier: Projected end cost (depenses_engagees + reste_a_depenser)
       - rentabilite: Profitability ratio (fin_chantier / prix_vente)

    2. Real Metrics (Actual/Delivered):
       - depenses_facturees_reel: Based on delivered quantities * price * exchange_rate
       - fin_chantier_reel: Real projected cost (depenses_engagees_reel + reste_a_depenser)
       - rentabilite_reel: Real profitability ratio (fin_chantier_reel / prix_vente)

    3. Project-Specific Values:
       For METRE Projects:
       - prix_vente: Base selling price
       - prix_vente_base: Landing selling price
       - budget_chef_projet: Base project manager budget
       - budget_chef_projet_base: Landing project manager budget
       - rapport_atterrissage: Budget to landing selling price ratio

       For FORFAIT Projects:
       - prix_vente: Standard selling price
       - budget_chef_projet: Standard project manager budget
    """

    numero_article = models.CharField(
        max_length=50,
        db_index=True,
        help_text="Article number (unique identifier)",
    )

    code_projet = models.CharField(
        max_length=50,
        db_index=True,
        help_text="Project code from related commandes",
    )

    type_projet = models.CharField(
        max_length=10,
        choices=PROJECT_TYPE_CHOICES,
        default=TYPE_FORFAIT,
        help_text="Project type (Forfait or Maître d'oeuvre)",
    )

    prix_vente = models.DecimalField(
        max_digits=MAX_DIGITS,
        decimal_places=DECIMAL_PLACES,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal("0.00"))],
        help_text="Base selling price for METRE, standard price for FORFAIT",
    )

    prix_vente_base = models.DecimalField(
        max_digits=MAX_DIGITS,
        decimal_places=DECIMAL_PLACES,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal("0.00"))],
        help_text="Landing selling price (only for METRE projects)",
    )

    budget_chef_projet = models.DecimalField(
        max_digits=MAX_DIGITS,
        decimal_places=DECIMAL_PLACES,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal("0.00"))],
        help_text="Base project manager budget for METRE, standard budget for FORFAIT",
    )

    budget_chef_projet_base = models.DecimalField(
        max_digits=MAX_DIGITS,
        decimal_places=DECIMAL_PLACES,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal("0.00"))],
        help_text="Landing project manager budget (only for METRE projects)",
    )

    reste_a_depenser = models.DecimalField(
        max_digits=MAX_DIGITS,
        decimal_places=DECIMAL_PLACES,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
        help_text="Remaining amount to spend (manual input)",
    )

    fiabilite = models.CharField(
        max_length=1,
        choices=FIABILITE_CHOICES,
        null=True,
        blank=True,
        help_text="Reliability level (Estimé, Chiffré, Marché)",
    )

    class Meta:
        indexes = [
            models.Index(fields=["numero_article"]),
            models.Index(fields=["code_projet"]),
        ]
        unique_together = [("numero_article", "code_projet")]
        verbose_name = "Contrôle des dépenses"
        verbose_name_plural = "Contrôles des dépenses"

    def __str__(self):
        return f"Contrôle {self.numero_article} - {self.code_projet}"

    @property
    def depenses_facturees(self) -> Decimal:
        """
        Get standard invoiced expenses
        Formula: prix * (quantite - quantite_en_cours) * cours_change
        """
        from apps.core.services.calculation_service import CalculationService

        calc_service = CalculationService()
        return calc_service.calculate_depenses_facturees(
            self.numero_article, self.code_projet
        )

    @property
    def depenses_facturees_reel(self) -> Decimal:
        """
        Get real invoiced expenses based on delivered quantities
        Formula: quantite_livree * prix * cours_change
        """
        from apps.core.services.calculation_service import CalculationService

        calc_service = CalculationService()
        return calc_service.calculate_depenses_facturees_reel(
            self.numero_article, self.code_projet
        )

    @property
    def fin_chantier(self) -> Decimal:
        """
        Calculate standard project end cost
        Formula: depenses_engagees + reste_a_depenser
        """
        from apps.core.services.calculation_service import CalculationService

        calc_service = CalculationService()
        depenses_engagees = calc_service.calculate_depenses_engagees(
            self.numero_article, self.code_projet
        )
        return calc_service.calculate_fin_chantier(
            depenses_engagees, self.reste_a_depenser
        )

    @property
    def fin_chantier_reel(self) -> Decimal:
        """
        Calculate real project end cost using delivered quantities
        Formula: depenses_engagees_reel + reste_a_depenser
        """
        from apps.core.services.calculation_service import CalculationService

        calc_service = CalculationService()
        depenses_engagees_reel = calc_service.calculate_depenses_engagees_reel(
            self.numero_article, self.code_projet
        )
        return calc_service.calculate_fin_chantier_reel(
            depenses_engagees_reel, self.reste_a_depenser
        )

    @property
    def rentabilite(self) -> Decimal:
        """
        Calculate standard profitability
        Formula: fin_chantier / prix_vente
        """
        from apps.core.services.calculation_service import CalculationService

        calc_service = CalculationService()
        return calc_service.calculate_rentabilite(self.prix_vente, self.fin_chantier)

    @property
    def rentabilite_reel(self) -> Decimal:
        """
        Calculate real profitability using delivered quantities
        Formula: fin_chantier / prix_vente_reel
        """
        from apps.core.services.calculation_service import CalculationService

        calc_service = CalculationService()
        return calc_service.calculate_rentabilite_reel(
            self.prix_vente, self.fin_chantier_reel
        )

    @property
    def rapport(self) -> Decimal:
        """
        Calculate budget to selling price ratio
        Formula: budget_chef_projet / prix_vente
        """
        try:
            if not self.prix_vente or self.prix_vente == 0:
                return Decimal("0")
            if not self.budget_chef_projet:
                return Decimal("0")
            return self.budget_chef_projet / self.prix_vente
        except (TypeError, ZeroDivisionError):
            return Decimal("0")

    @property
    def rapport_atterrissage(self) -> Decimal:
        """
        Calculate budget to selling price ratio for landing values (METRE projects)

        For METRE projects:
        - Uses budget_chef_projet_base (landing budget)
        - Uses prix_vente_base (landing selling price)

        Formula: budget_chef_projet_base / prix_vente_base

        Returns:
            Decimal: Budget to landing selling price ratio
            0 if either budget or price is not available
        """
        try:
            # For METRE projects, use landing values
            if self.type_projet == "METRE":
                if not self.prix_vente_base or self.prix_vente_base == 0:
                    return Decimal("0")
                if not self.budget_chef_projet_base:
                    return Decimal("0")
                return self.budget_chef_projet_base / self.prix_vente_base

            # For non-METRE projects, return 0 or fallback to standard rapport
            return Decimal("0")
        except (TypeError, ZeroDivisionError):
            return Decimal("0")
