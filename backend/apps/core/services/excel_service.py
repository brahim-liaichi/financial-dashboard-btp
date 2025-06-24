import logging
import pandas as pd
from typing import Dict, Any, List, Generator, Optional
from django.core.files.uploadedfile import InMemoryUploadedFile
from ..exceptions import ExcelProcessingError
from ..utils.validators import validate_excel_columns
from ..constants import (
    REQUIRED_COLUMNS,
    FACTURATION_REQUIRED_COLUMNS,
    AVANCEMENT_REQUIRED_COLUMNS,
)

logger = logging.getLogger(__name__)


class ExcelService:
    """Service for handling Excel file processing and validation."""

    CHUNK_SIZE = 5000

    # Column name variations mapping
    COLUMN_VARIATIONS = {
        "project_code": ["Code du projet"],
        "document_number": ["Numéro de document"],
        "registration_date": ["Date d'enregistrement"],
        "document_status": ["Statut document"],
        "client_code": ["Code client/fournisseur"],
        "client_name": ["Nom du client/fournisseur"],
        "item_code": ["ItemCode"],
        "description": ["Description"],
        "quantity": ["Quantity"],
        "price": ["Price"],
        "line_total": ["LineTotal"],
        "total_after_discount": ["Total après remise"],
    }

    @classmethod
    def _normalize_column_name(cls, column: str) -> str:
        """Normalize column names for consistent matching."""
        if not isinstance(column, str):
            return ""
        return column.strip().lower().replace("'", "'").replace(" ", "")

    @classmethod
    def _find_matching_column(
        cls, df: pd.DataFrame, variations: List[str]
    ) -> Optional[str]:
        """Find actual column name from variations."""
        df_columns = {cls._normalize_column_name(col): col for col in df.columns}
        logger.debug(f"Normalized columns: {df_columns}")

        for variation in variations:
            normalized_var = cls._normalize_column_name(variation)
            if normalized_var in df_columns:
                return df_columns[normalized_var]
        return None

    @classmethod
    def read_excel_in_chunks(
        cls, file: InMemoryUploadedFile, sheet_name: str = None
    ) -> Generator[pd.DataFrame, None, None]:
        """Read large Excel files in chunks to manage memory."""
        try:
            excel_file = pd.ExcelFile(file)

            # If no sheet name specified, use the first sheet
            if sheet_name is None:
                sheet_name = excel_file.sheet_names[0]

            for chunk_start in range(0, cls.CHUNK_SIZE, cls.CHUNK_SIZE):
                try:
                    df_chunk = pd.read_excel(
                        excel_file,
                        sheet_name=sheet_name,
                        skiprows=chunk_start,
                        nrows=cls.CHUNK_SIZE,
                    )
                    if not df_chunk.empty:
                        yield df_chunk
                except:
                    break

        except Exception as e:
            logger.error(f"Error reading Excel file in chunks: {str(e)}")
            raise ExcelProcessingError(f"Failed to read Excel file: {str(e)}")

    @classmethod
    def read_excel(cls, file: InMemoryUploadedFile) -> pd.DataFrame:
        """Read Excel file with standard validation."""
        try:
            chunks = []
            for chunk in cls.read_excel_in_chunks(file):
                chunks.append(chunk)

            df = pd.concat(chunks, ignore_index=True)
            validate_excel_columns(df.columns.tolist())
            return df.dropna(how="all")

        except Exception as e:
            logger.error(f"Excel read error: {str(e)}", exc_info=True)
            raise ExcelProcessingError(f"Failed to read Excel file: {str(e)}")

    @classmethod
    def read_multi_sheet_excel(
        cls, file: InMemoryUploadedFile
    ) -> Dict[str, pd.DataFrame]:
        """Read Excel file with multiple sheets."""
        try:
            excel_file = pd.ExcelFile(file)
            sheets = {}

            for sheet_name in ["Facturation", "Avancement"]:
                chunks = []
                for chunk_start in range(0, cls.CHUNK_SIZE, cls.CHUNK_SIZE):
                    try:
                        df_chunk = pd.read_excel(
                            excel_file,
                            sheet_name=sheet_name,
                            skiprows=chunk_start,
                            nrows=cls.CHUNK_SIZE,
                        )
                        if not df_chunk.empty:
                            chunks.append(df_chunk)
                    except:
                        break

                if chunks:
                    sheets[sheet_name] = pd.concat(chunks, ignore_index=True)
                    logger.info(
                        f"Successfully read {sheet_name} sheet. Columns: {sheets[sheet_name].columns.tolist()}"
                    )

            return sheets

        except Exception as e:
            logger.error(f"Multi-sheet Excel read error: {str(e)}")
            raise ExcelProcessingError(
                f"Failed to process multi-sheet Excel file: {str(e)}"
            )

    @classmethod
    def clean_data(cls, df: pd.DataFrame) -> pd.DataFrame:
        """Clean and prepare DataFrame for processing."""
        try:
            # Create a copy to avoid modifying the original
            cleaned_df = df.copy()

            # Convert date columns
            date_columns = ["Date d'enregistrement", "Date comptable", "Dat"]
            for col in date_columns:
                if col in cleaned_df.columns:
                    cleaned_df[col] = pd.to_datetime(cleaned_df[col], errors="coerce")

            # Convert numeric columns
            numeric_columns = [
                "Quantity",
                "Price",
                "LineTotal",
                "Payment HT",
                "Payement TTC",
            ]
            for col in numeric_columns:
                if col in cleaned_df.columns:
                    cleaned_df[col] = pd.to_numeric(cleaned_df[col], errors="coerce")

            # Strip whitespace from string columns
            string_columns = cleaned_df.select_dtypes(include=["object"]).columns
            for col in string_columns:
                cleaned_df[col] = cleaned_df[col].astype(str).str.strip()

            return cleaned_df

        except Exception as e:
            logger.error(f"Error cleaning data: {str(e)}")
            raise ExcelProcessingError(f"Failed to clean data: {str(e)}")

    @classmethod
    def validate_data(cls, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Validate data consistency and integrity."""
        errors = []

        # Check for missing required columns
        for req_col in REQUIRED_COLUMNS:
            if req_col not in df.columns:
                errors.append(
                    {
                        "column": req_col,
                        "error": f"Required column '{req_col}' is missing",
                    }
                )

        # Validate numeric constraints
        numeric_constraints = {"Quantity": lambda x: x >= 0, "Price": lambda x: x >= 0}

        for col, constraint in numeric_constraints.items():
            if col in df.columns:
                invalid_values = df[
                    df[col].apply(
                        lambda x: not constraint(float(x)) if pd.notna(x) else False
                    )
                ]
                if not invalid_values.empty:
                    errors.append(
                        {
                            "column": col,
                            "error": f"Invalid values found in column '{col}'",
                        }
                    )

        return errors

    @classmethod
    def process_excel_file(
        cls, file: InMemoryUploadedFile, validate: bool = True
    ) -> pd.DataFrame:
        """Process single Excel file with validation."""
        df = cls.read_excel(file)
        df = cls.clean_data(df)

        if validate:
            errors = cls.validate_data(df)
            if errors:
                raise ExcelProcessingError(f"Validation errors found: {errors}")

        return df

    @classmethod
    def process_multi_sheet_excel(
        cls, file: InMemoryUploadedFile, validate: bool = True
    ) -> Dict[str, pd.DataFrame]:
        """Process multi-sheet Excel file."""
        try:
            sheets = cls.read_multi_sheet_excel(file)

            # Clean data in each sheet
            cleaned_sheets = {}
            for sheet_name, df in sheets.items():
                cleaned_df = cls.clean_data(df)
                cleaned_sheets[sheet_name] = cleaned_df
                logger.info(
                    f"Cleaned {sheet_name} sheet. Columns: {cleaned_df.columns.tolist()}"
                )

            if validate:
                # Validate project code existence and non-emptiness
                for sheet_name, df in cleaned_sheets.items():
                    project_col = "Code du projet"  # Use exact column name
                    if project_col not in df.columns:
                        raise ExcelProcessingError(
                            f"Missing project code column '{project_col}' in {sheet_name} sheet. "
                            f"Available columns: {df.columns.tolist()}"
                        )

                    if df[project_col].isnull().any() or df[project_col].eq("").any():
                        raise ExcelProcessingError(
                            f"Empty project code found in {sheet_name} sheet"
                        )

            return cleaned_sheets

        except Exception as e:
            logger.error(f"Multi-sheet Excel processing error: {str(e)}", exc_info=True)
            raise ExcelProcessingError(
                f"Failed to process multi-sheet Excel file: {str(e)}"
            )

    @classmethod
    def validate_sheet_columns(cls, df: pd.DataFrame, sheet_name: str) -> None:
        """Validate required columns for each sheet type."""
        required_columns = (
            FACTURATION_REQUIRED_COLUMNS
            if sheet_name == "Facturation"
            else AVANCEMENT_REQUIRED_COLUMNS
        )

        missing_columns = set(required_columns) - set(df.columns)
        if missing_columns:
            raise ExcelProcessingError(
                f"Missing required columns in {sheet_name} sheet: {', '.join(missing_columns)}"
            )
