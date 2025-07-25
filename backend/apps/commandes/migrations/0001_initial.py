# Generated by Django 5.1.4 on 2025-02-13 11:04

from decimal import Decimal
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Commande",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "numero_document",
                    models.IntegerField(
                        db_index=True, help_text="Unique document number"
                    ),
                ),
                (
                    "annule",
                    models.CharField(
                        help_text="Cancellation status (Y/N)", max_length=1
                    ),
                ),
                (
                    "statut_document",
                    models.CharField(help_text="Document status", max_length=50),
                ),
                (
                    "date_enregistrement",
                    models.DateTimeField(help_text="Registration date"),
                ),
                ("date_echeance", models.DateTimeField(help_text="Due date")),
                (
                    "code_fournisseur",
                    models.CharField(help_text="Supplier code", max_length=50),
                ),
                (
                    "nom_fournisseur",
                    models.CharField(help_text="Supplier name", max_length=255),
                ),
                (
                    "numero_article",
                    models.CharField(
                        db_index=True, help_text="Article number", max_length=50
                    ),
                ),
                (
                    "description_article",
                    models.TextField(help_text="Article description"),
                ),
                (
                    "quantite",
                    models.DecimalField(
                        decimal_places=2, help_text="Quantity ordered", max_digits=15
                    ),
                ),
                (
                    "quantite_livree",
                    models.DecimalField(
                        decimal_places=2,
                        default=Decimal("0.0"),
                        help_text="Quantity delivered",
                        max_digits=15,
                    ),
                ),
                (
                    "quantite_en_cours",
                    models.DecimalField(
                        decimal_places=2,
                        help_text="Quantity in progress",
                        max_digits=15,
                    ),
                ),
                (
                    "prix",
                    models.DecimalField(
                        decimal_places=2, help_text="Unit price", max_digits=15
                    ),
                ),
                (
                    "devise_prix",
                    models.CharField(
                        default="MAD", help_text="Price currency", max_length=3
                    ),
                ),
                (
                    "cours_change",
                    models.DecimalField(
                        decimal_places=4,
                        default=Decimal("1.0000"),
                        help_text="Exchange rate",
                        max_digits=10,
                    ),
                ),
                (
                    "total_lignes",
                    models.DecimalField(
                        decimal_places=2, help_text="Total line amount", max_digits=15
                    ),
                ),
                (
                    "code_projet",
                    models.CharField(
                        db_index=True, help_text="Project code", max_length=50
                    ),
                ),
            ],
            options={
                "ordering": ["-date_enregistrement"],
                "indexes": [
                    models.Index(
                        fields=["numero_document"],
                        name="commandes_c_numero__f4d164_idx",
                    ),
                    models.Index(
                        fields=["code_projet"], name="commandes_c_code_pr_c6bd10_idx"
                    ),
                    models.Index(
                        fields=["numero_article"], name="commandes_c_numero__cdd1ce_idx"
                    ),
                ],
                "constraints": [
                    models.CheckConstraint(
                        condition=models.Q(("quantite__gte", 0)),
                        name="check_quantite_positive",
                    ),
                    models.CheckConstraint(
                        condition=models.Q(("quantite_livree__gte", 0)),
                        name="check_quantite_livree_positive",
                    ),
                    models.CheckConstraint(
                        condition=models.Q(("quantite_en_cours__gte", 0)),
                        name="check_quantite_en_cours_positive",
                    ),
                    models.CheckConstraint(
                        condition=models.Q(("prix__gte", 0)), name="check_prix_positive"
                    ),
                ],
            },
        ),
    ]
