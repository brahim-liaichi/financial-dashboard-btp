# Path: backend/apps/facturation/models.py

from django.db import models
from apps.core.models import BaseModel
from apps.core.constants import MAX_DIGITS, DECIMAL_PLACES


class Facturation(BaseModel):
    """Model for facturation data imported from Excel"""

    document_number = models.CharField(max_length=50, verbose_name="Numéro de document")
    registration_date = models.DateField(verbose_name="Date d'enregistrement")
    document_status = models.CharField(max_length=10, verbose_name="Statut document")
    client_code = models.CharField(
        max_length=50, verbose_name="Code client/fournisseur"
    )
    client_name = models.CharField(
        max_length=255, verbose_name="Nom du client/fournisseur"
    )
    item_code = models.CharField(max_length=50, verbose_name="ItemCode")
    description = models.CharField(max_length=255, verbose_name="Description")
    quantity = models.IntegerField(verbose_name="Quantity")
    price = models.DecimalField(
        max_digits=MAX_DIGITS, decimal_places=DECIMAL_PLACES, verbose_name="Price"
    )
    line_total = models.DecimalField(
        max_digits=MAX_DIGITS, decimal_places=DECIMAL_PLACES, verbose_name="LineTotal"
    )
    total_after_discount = models.DecimalField(
        max_digits=MAX_DIGITS,
        decimal_places=DECIMAL_PLACES,
        verbose_name="Total après remise",
    )
    project_code = models.CharField(
        max_length=50, db_index=True, verbose_name="Code projet"
    )

    class Meta:
        indexes = [
            models.Index(fields=["project_code"]),
            models.Index(fields=["registration_date"]),
        ]
        verbose_name = "Facturation"
        verbose_name_plural = "Facturations"

    def __str__(self):
        return f"{self.document_number} - {self.project_code}"


class Avancement(BaseModel):
    """Model for payment advancement data"""

    doc_type = models.CharField(max_length=50, verbose_name="DocType")
    doc_num = models.CharField(max_length=50, verbose_name="DocNum")
    accounting_date = models.DateField(verbose_name="Date comptable")
    payment_ht = models.DecimalField(
        max_digits=MAX_DIGITS, decimal_places=DECIMAL_PLACES, verbose_name="Payment HT"
    )
    payment_ttc = models.DecimalField(
        max_digits=MAX_DIGITS,
        decimal_places=DECIMAL_PLACES,
        verbose_name="Payement TTC",
    )
    payment_method = models.CharField(max_length=50, verbose_name="Méthode de paiement")
    project_code = models.CharField(
        max_length=50, db_index=True, verbose_name="Code projet"
    )
    num = models.CharField(max_length=50, verbose_name="Num", null=True, blank=True)
    total = models.CharField(max_length=50, verbose_name="Total", null=True, blank=True)
    dat = models.DateField(verbose_name="Dat", null=True, blank=True)
    canceled = models.CharField(max_length=1, verbose_name="Canceled")
    accompte_flag = models.CharField(max_length=1, verbose_name="Accompte_Flag")

    class Meta:
        indexes = [
            models.Index(fields=["project_code"]),
            models.Index(fields=["accounting_date"]),
        ]
        verbose_name = "Avancement"
        verbose_name_plural = "Avancements"

    def __str__(self):
        return f"{self.doc_num} - {self.project_code}"
