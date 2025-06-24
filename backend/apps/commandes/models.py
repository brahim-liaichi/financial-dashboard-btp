from django.db import models
from decimal import Decimal
from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.core.models import BaseModel
from apps.core.constants import (
    DEFAULT_CURRENCY,
    DECIMAL_PLACES,
    MAX_DIGITS,
    PROJECT_NAME_MAP,
)


class Commande(BaseModel):
    """
    Model representing a purchase order or command.
    """

    numero_document = models.IntegerField(
        db_index=True, help_text="Unique document number"
    )
    annule = models.CharField(max_length=1, help_text="Cancellation status (Y/N)")
    statut_document = models.CharField(max_length=50, help_text="Document status")
    date_enregistrement = models.DateTimeField(help_text="Registration date")
    date_echeance = models.DateTimeField(help_text="Due date")
    code_fournisseur = models.CharField(max_length=50, help_text="Supplier code")
    nom_fournisseur = models.CharField(max_length=255, help_text="Supplier name")
    numero_article = models.CharField(
        max_length=50, db_index=True, help_text="Article number"
    )
    description_article = models.TextField(help_text="Article description")
    quantite = models.DecimalField(
        max_digits=MAX_DIGITS,
        decimal_places=DECIMAL_PLACES,
        help_text="Quantity ordered",
    )
    quantite_livree = models.DecimalField(
        max_digits=MAX_DIGITS,
        decimal_places=DECIMAL_PLACES,
        default=Decimal("0.0"),
        help_text="Quantity delivered",
    )
    quantite_en_cours = models.DecimalField(
        max_digits=MAX_DIGITS,
        decimal_places=DECIMAL_PLACES,
        help_text="Quantity in progress",
    )
    prix = models.DecimalField(
        max_digits=MAX_DIGITS, decimal_places=DECIMAL_PLACES, help_text="Unit price"
    )
    devise_prix = models.CharField(
        max_length=3, default=DEFAULT_CURRENCY, help_text="Price currency"
    )
    cours_change = models.DecimalField(
        max_digits=10,
        decimal_places=4,
        default=Decimal("1.0000"),
        help_text="Exchange rate",
    )
    total_lignes = models.DecimalField(
        max_digits=MAX_DIGITS,
        decimal_places=DECIMAL_PLACES,
        help_text="Total line amount",
    )
    code_projet = models.CharField(
        max_length=50, db_index=True, help_text="Project code"
    )

    class Meta:
        indexes = [
            models.Index(fields=["numero_document"]),
            models.Index(fields=["code_projet"]),
            models.Index(fields=["numero_article"]),
        ]
        ordering = ["-date_enregistrement"]

        constraints = [
            models.CheckConstraint(
                check=models.Q(quantite__gte=0), name="check_quantite_positive"
            ),
            models.CheckConstraint(
                check=models.Q(quantite_livree__gte=0),
                name="check_quantite_livree_positive",
            ),
            models.CheckConstraint(
                check=models.Q(quantite_en_cours__gte=0),
                name="check_quantite_en_cours_positive",
            ),
            models.CheckConstraint(
                check=models.Q(prix__gte=0), name="check_prix_positive"
            ),
        ]

    def __str__(self):
        return f"Command {self.numero_document} - {self.numero_article} ({self.code_projet})"

    def save(self, *args, **kwargs):
        """Override save to enforce business rules"""
        if self.quantite_en_cours > self.quantite:
            raise ValueError("Ongoing quantity cannot exceed total quantity")
        if self.quantite_livree > self.quantite:
            raise ValueError("Delivered quantity cannot exceed total quantity")
        super().save(*args, **kwargs)


@receiver(post_save, sender=Commande)
def create_project_from_commande(sender, instance, created, **kwargs):
    """
    Automatically create a Project entry when a new Commande is saved
    if the project doesn't already exist.
    """
    from apps.user_management.models import Project

    # Only attempt to create if the project code exists
    if instance.code_projet:
        # Check if project already exists
        project, created = Project.objects.get_or_create(
            code=instance.code_projet,
            defaults={
                "name": PROJECT_NAME_MAP.get(instance.code_projet, {}).get(
                    "name", instance.code_projet
                ),
                "type": PROJECT_NAME_MAP.get(instance.code_projet, {}).get(
                    "type", "FORFAIT"
                ),
                "description": f"Project created from Commande {instance.numero_document}",
            },
        )
