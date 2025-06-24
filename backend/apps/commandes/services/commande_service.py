from typing import List
import pandas as pd
from decimal import Decimal
from django.db import transaction
import logging
from apps.core.services.base_service import BaseService
from apps.core.services.excel_service import ExcelService
from apps.core.exceptions import ExcelProcessingError
from ..models import Commande

# Configure logging
logger = logging.getLogger(__name__)


class CommandeService(BaseService[Commande]):
    """
    Service for handling Commande-related CRUD operations and Excel imports.
    """

    def __init__(self):
        super().__init__(Commande)

    def _parse_date(self, date_value, default_format="%d/%m/%Y"):
        """
        Enhanced date parsing with multiple fallback strategies

        Args:
            date_value: Date value to parse
            default_format: Primary date format to attempt

        Returns:
            Parsed date string or current timestamp
        """
        try:
            if pd.isna(date_value):
                return None

            parsed_date = pd.to_datetime(
                date_value, format=default_format, errors="raise"
            )
            return parsed_date.strftime("%Y-%m-%d %H:%M:%S")
        except (ValueError, TypeError):
            logger.warning(f"Date parsing failed for {date_value}")
            return None

    def _safe_numeric_convert(self, value, default=0):
        if pd.isna(value):
            return default

        try:
            value_str = str(value).strip()
            logger.debug(f"Converting numeric value: {value_str}")

            if not value_str:
                return default

            value_str = value_str.replace(" ", "")
            if "e" in value_str.lower():
                return float(value_str)

            if "." in value_str and "," in value_str:
                logger.debug(f"Found both . and ,: {value_str}")
                original = value_str
                value_str = value_str.replace(".", "").replace(",", ".")
                logger.debug(f"Converted {original} to {value_str}")
            elif "," in value_str:
                logger.debug(f"Found ,: {value_str}")
                original = value_str
                value_str = value_str.replace(",", ".")
                logger.debug(f"Converted {original} to {value_str}")

            result = float(Decimal(value_str))
            logger.debug(f"Final converted value: {result}")
            return result
        except (ValueError, TypeError, Decimal.InvalidOperation) as e:
            logger.error(f"Numeric conversion failed for '{value}': {str(e)}")
            return default

    def import_from_excel(self, file) -> List[Commande]:
        """
        Import orders from Excel file without skipping duplicates.

        Args:
            file: Uploaded Excel file

        Returns:
            List[Commande]: List of created Commande instances

        Raises:
            ExcelProcessingError: If file processing fails
        """
        try:
            # Log start of import process
            logger.info(f"Starting Excel import process")

            excel_service = ExcelService()
            df = excel_service.process_excel_file(file)

            # Log number of rows in the DataFrame
            logger.info(f"Loaded DataFrame with {len(df)} rows")

            # Validate required fields
            required_fields = [
                "Numéro de document",
                "Code client/fournisseur",
                "Numéro d'article",
                "Code du projet",
            ]

            for field in required_fields:
                missing = df[field].isnull().sum()
                if missing > 0:
                    raise ExcelProcessingError(
                        f"Required field '{field}' has {missing} empty values"
                    )

            commands = []
            created_count = 0
            errors = []

            for index, row in df.iterrows():
                try:
                    # Create command data dictionary with proper type conversion
                    command_data = {
                        "numero_document": int(row["Numéro de document"]),
                        "annule": (
                            row["Annulé"].strip() if pd.notna(row["Annulé"]) else "N"
                        ),
                        "statut_document": (
                            row["Statut document"].strip()
                            if pd.notna(row["Statut document"])
                            else "O"
                        ),
                        "date_enregistrement": self._parse_date(
                            row["Date d'enregistrement"]
                        ),
                        "date_echeance": self._parse_date(row["Date d'échéance"]),
                        "code_fournisseur": row["Code client/fournisseur"].strip(),
                        "nom_fournisseur": (
                            row["Nom du client/fournisseur"].strip()
                            if pd.notna(row["Nom du client/fournisseur"])
                            else ""
                        ),
                        "numero_article": row["Numéro d'article"].strip(),
                        "description_article": (
                            row["Description article/service"].strip()
                            if pd.notna(row["Description article/service"])
                            else ""
                        ),
                        "quantite": (
                            self._safe_numeric_convert(row["Quantité"])
                            if pd.notna(row["Quantité"])
                            else 0
                        ),
                        "quantite_livree": (
                            self._safe_numeric_convert(row["Quantité livrée"])
                            if pd.notna(row["Quantité livrée"])
                            else 0
                        ),
                        "quantite_en_cours": (
                            self._safe_numeric_convert(row["Quantité en cours"])
                            if pd.notna(row["Quantité en cours"])
                            else 0
                        ),
                        "prix": (
                            self._safe_numeric_convert(row["Prix"])
                            if pd.notna(row["Prix"])
                            else 0
                        ),
                        "devise_prix": (
                            row["Devise du prix"].strip()
                            if pd.notna(row["Devise du prix"])
                            else "MAD"
                        ),
                        "cours_change": (
                            self._safe_numeric_convert(row["Cours de change"])
                            if pd.notna(row["Cours de change"])
                            else 1
                        ),
                        "total_lignes": (
                            self._safe_numeric_convert(row["Total des lignes"])
                            if pd.notna(row["Total des lignes"])
                            else 0
                        ),
                        "code_projet": row["Code du projet"].strip(),
                    }

                    # Log the processed data for debugging
                    logger.debug(f"Processing row {index + 2}: {command_data}")

                    # Validate required values
                    if not all(
                        [
                            command_data["numero_document"],
                            command_data["code_fournisseur"],
                            command_data["numero_article"],
                            command_data["code_projet"],
                        ]
                    ):
                        raise ExcelProcessingError(
                            f"Row {index + 2} has missing required values"
                        )

                    # Create new command
                    logger.info(
                        f"Attempting to create command with quantities: total={command_data['quantite']}, ongoing={command_data['quantite_en_cours']}"
                    )
                    logger.info(
                        f"Creating new command: Document {command_data['numero_document']}, "
                        f"Article {command_data['numero_article']}, "
                        f"Project {command_data['code_projet']}"
                    )

                    try:
                        command = self.model_class.objects.create(**command_data)
                        commands.append(command)
                        created_count += 1
                    except Exception as e:
                        logger.error(
                            f"Error creating command in row {index + 2}: {str(e)}"
                        )
                        raise ExcelProcessingError(
                            f"Failed to create command: {str(e)}"
                        )

                except Exception as e:
                    logger.error(f"Error processing row {index + 2}: {str(e)}")
                    errors.append(f"Row {index + 2}: {str(e)}")

            # Log final import statistics
            logger.info(
                f"Import completed successfully. "
                f"Created: {created_count}, "
                f"Total processed: {len(commands)}"
            )

            if errors:
                logger.error(f"Import completed with errors: {errors}")
                raise ExcelProcessingError(f"Errors occurred during import: {errors}")

            return commands

        except Exception as e:
            # Log the full exception
            logger.error(f"Excel import failed: {str(e)}", exc_info=True)

            # Re-raise if it's already a processing error
            if isinstance(e, ExcelProcessingError):
                raise e

            # Wrap other exceptions
            raise ExcelProcessingError(f"Failed to process Excel file: {str(e)}")

    @transaction.atomic
    def clear_all_commands(self) -> int:
        """
        Clear all commands from the database.

        Returns:
            int: Number of deleted commands

        Raises:
            Exception: If deletion fails
        """
        try:
            count = self.model_class.objects.count()
            self.model_class.objects.all().delete()
            logger.info(f"Successfully deleted {count} commands")
            return count
        except Exception as e:
            logger.error(f"Error clearing commands: {str(e)}")
            raise

    @transaction.atomic
    def delete_project_commands(self, project_code: str) -> int:
        """
        Delete all commands for a specific project.

        Args:
            project_code: The project code to delete commands for

        Returns:
            int: Number of deleted commands

        Raises:
            Exception: If deletion fails
        """
        try:
            count = self.model_class.objects.filter(code_projet=project_code).count()
            self.model_class.objects.filter(code_projet=project_code).delete()
            logger.info(
                f"Successfully deleted {count} commands for project {project_code}"
            )
            return count
        except Exception as e:
            logger.error(
                f"Error deleting commands for project {project_code}: {str(e)}"
            )
            raise
