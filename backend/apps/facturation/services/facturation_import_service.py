import logging
import pandas as pd
from decimal import Decimal
from typing import Dict, List
from django.db import transaction
from django.db.models import Sum
from apps.core.services.base_service import BaseService
from apps.core.services.excel_service import ExcelService
from apps.core.exceptions import ValidationError
from ..models import Facturation, Avancement

logger = logging.getLogger(__name__)


class FacturationImportService(BaseService):
    """Service for handling Facturation and Avancement data import operations"""

    BATCH_SIZE = 5000

    # Explicit column mappings
    FACTURATION_COLUMNS = {
        "document_number": "Numéro de document",
        "registration_date": "Date d'enregistrement",
        "document_status": "Statut document",
        "client_code": "Code client/fournisseur",
        "client_name": "Nom du client/fournisseur",
        "item_code": "ItemCode",
        "description": "Description",
        "quantity": "Quantity",
        "price": "Price",
        "line_total": "LineTotal",
        "total_after_discount": "Total après remise pied de page",
        "project_code": "Code du projet",
    }

    AVANCEMENT_COLUMNS = {
        "doc_type": "DocType",
        "doc_num": "DocNum",
        "accounting_date": "Date comptable",
        "payment_ht": "Payment HT",
        "payment_ttc": "Payement TTC",
        "payment_method": "Méthode de paiement",
        "project_code": "Code du projet",
        "num": "Num",  # Explicitly separate column
        "total": "Total",  # Explicitly separate column
        "dat": "Dat",
        "canceled": "Canceled",
        "accompte_flag": "Accompte_Flag",
    }

    def __init__(self):
        super().__init__(Facturation)
        self.excel_service = ExcelService()
        self._processed_count = {"facturation": 0, "avancement": 0}

    def _validate_columns(
        self, df: pd.DataFrame, expected_columns: Dict[str, str], sheet_name: str
    ) -> None:
        """Validate that all required columns are present."""
        missing_columns = set(expected_columns.values()) - set(df.columns)
        if missing_columns:
            raise ValidationError(
                f"Missing required columns in {sheet_name} sheet: {', '.join(missing_columns)}"
            )

    def _parse_facturation_batch(self, df: pd.DataFrame) -> List[Facturation]:
        """Parse a batch of Facturation records with enhanced validation."""
        try:
            self._validate_columns(df, self.FACTURATION_COLUMNS, "Facturation")
            records = []

            for index, row in df.iterrows():
                try:
                    record = Facturation(
                        document_number=str(
                            row[self.FACTURATION_COLUMNS["document_number"]]
                        ).strip(),
                        registration_date=(
                            pd.to_datetime(
                                row[self.FACTURATION_COLUMNS["registration_date"]]
                            ).date()
                            if pd.notna(
                                row[self.FACTURATION_COLUMNS["registration_date"]]
                            )
                            else None
                        ),
                        document_status=str(
                            row[self.FACTURATION_COLUMNS["document_status"]]
                        ).strip(),
                        client_code=str(
                            row[self.FACTURATION_COLUMNS["client_code"]]
                        ).strip(),
                        client_name=str(
                            row[self.FACTURATION_COLUMNS["client_name"]]
                        ).strip(),
                        item_code=str(
                            row[self.FACTURATION_COLUMNS["item_code"]]
                        ).strip(),
                        description=str(
                            row[self.FACTURATION_COLUMNS["description"]]
                        ).strip(),
                        quantity=int(
                            float(row[self.FACTURATION_COLUMNS["quantity"]] or 0)
                        ),
                        price=Decimal(str(row[self.FACTURATION_COLUMNS["price"]] or 0)),
                        line_total=Decimal(
                            str(row[self.FACTURATION_COLUMNS["line_total"]] or 0)
                        ),
                        total_after_discount=Decimal(
                            str(
                                row[self.FACTURATION_COLUMNS["total_after_discount"]]
                                or 0
                            )
                        ),
                        project_code=str(
                            row[self.FACTURATION_COLUMNS["project_code"]]
                        ).strip(),
                    )
                    records.append(record)
                except Exception as row_error:
                    logger.warning(
                        f"Error processing Facturation row {index}: {str(row_error)}"
                    )
                    continue
            return records
        except Exception as e:
            logger.error(f"Error parsing Facturation batch: {str(e)}")
            raise ValidationError(f"Failed to parse Facturation batch: {str(e)}")

    def _parse_avancement_batch(self, df: pd.DataFrame) -> List[Avancement]:
        """Parse a batch of Avancement records with enhanced validation."""
        try:
            self._validate_columns(df, self.AVANCEMENT_COLUMNS, "Avancement")
            records = []

            for index, row in df.iterrows():
                try:
                    record = Avancement(
                        doc_type=str(row[self.AVANCEMENT_COLUMNS["doc_type"]]).strip(),
                        doc_num=str(row[self.AVANCEMENT_COLUMNS["doc_num"]]).strip(),
                        accounting_date=(
                            pd.to_datetime(
                                row[self.AVANCEMENT_COLUMNS["accounting_date"]]
                            ).date()
                            if pd.notna(row[self.AVANCEMENT_COLUMNS["accounting_date"]])
                            else None
                        ),
                        payment_ht=Decimal(
                            str(row[self.AVANCEMENT_COLUMNS["payment_ht"]] or 0)
                        ),
                        payment_ttc=Decimal(
                            str(row[self.AVANCEMENT_COLUMNS["payment_ttc"]] or 0)
                        ),
                        payment_method=str(
                            row[self.AVANCEMENT_COLUMNS["payment_method"]]
                        ).strip(),
                        project_code=str(
                            row[self.AVANCEMENT_COLUMNS["project_code"]]
                        ).strip(),
                        num=str(
                            row[self.AVANCEMENT_COLUMNS["num"]]
                        ).strip(),  # Separate column
                        total=str(
                            row[self.AVANCEMENT_COLUMNS["total"]]
                        ).strip(),  # Separate column
                        dat=(
                            pd.to_datetime(row[self.AVANCEMENT_COLUMNS["dat"]]).date()
                            if pd.notna(row[self.AVANCEMENT_COLUMNS["dat"]])
                            else None
                        ),
                        canceled=str(row[self.AVANCEMENT_COLUMNS["canceled"]])[:1],
                        accompte_flag=str(
                            row[self.AVANCEMENT_COLUMNS["accompte_flag"]]
                        )[:1],
                    )
                    records.append(record)
                except Exception as row_error:
                    logger.warning(
                        f"Error processing Avancement row {index}: {str(row_error)}"
                    )
                    continue
            return records
        except Exception as e:
            logger.error(f"Error parsing Avancement batch: {str(e)}")
            raise ValidationError(f"Failed to parse Avancement batch: {str(e)}")

    def process_excel_import(self, excel_file) -> Dict[str, int]:
        """Process Excel file with batch processing and enhanced validation."""
        try:
            logger.info("Starting Excel import process")
            sheets = self.excel_service.process_multi_sheet_excel(excel_file)

            with transaction.atomic():
                facturation_count = 0
                avancement_count = 0

                for sheet_name, df in sheets.items():
                    if sheet_name == "Facturation":
                        for start in range(0, len(df), self.BATCH_SIZE):
                            batch = df.iloc[start : start + self.BATCH_SIZE]
                            records = self._parse_facturation_batch(batch)
                            if records:
                                Facturation.objects.bulk_create(records)
                                facturation_count += len(records)

                    elif sheet_name == "Avancement":
                        for start in range(0, len(df), self.BATCH_SIZE):
                            batch = df.iloc[start : start + self.BATCH_SIZE]
                            records = self._parse_avancement_batch(batch)
                            if records:
                                Avancement.objects.bulk_create(records)
                                avancement_count += len(records)

            return {
                "facturation_count": facturation_count,
                "avancement_count": avancement_count,
            }

        except Exception as e:
            logger.error(f"Error processing Excel file: {str(e)}")
            raise ValidationError(f"Failed to process Excel file: {str(e)}")

    def clean_import_data(self, project_code: str = None):
        """Clean import data with batched deletion."""
        try:
            with transaction.atomic():
                if project_code:
                    Facturation.objects.filter(project_code=project_code).delete()
                    Avancement.objects.filter(project_code=project_code).delete()
                    logger.info(f"Cleaned import data for project {project_code}")
                else:
                    self._batch_delete(Facturation)
                    self._batch_delete(Avancement)
                    logger.info("Cleaned all import data")
        except Exception as e:
            logger.error(f"Error cleaning import data: {str(e)}")
            raise ValidationError(f"Failed to clean import data: {str(e)}")

    def _batch_delete(self, model, batch_size=1000):
        """Delete records in batches to prevent memory issues."""
        while model.objects.exists():
            ids = model.objects.values_list("id", flat=True)[:batch_size]
            model.objects.filter(id__in=list(ids)).delete()
