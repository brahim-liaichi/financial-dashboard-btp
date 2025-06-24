# backend/apps/core/utils/validators.py

from decimal import Decimal
from typing import List, Dict, Any
from ..exceptions import ValidationError
from ..constants import REQUIRED_COLUMNS

def validate_excel_columns(headers: List[str]) -> bool:
    """
    Validates that all required columns are present in the Excel file.
    
    Args:
        headers: List of column headers from the Excel file
        
    Returns:
        bool: True if all required columns are present
        
    Raises:
        ValidationError: If any required columns are missing
    """
    missing_columns = [col for col in REQUIRED_COLUMNS if col not in headers]
    if missing_columns:
        raise ValidationError(
            f"Missing required columns: {', '.join(missing_columns)}"
        )
    return True

def validate_decimal_value(value: Any, field_name: str) -> Decimal:
    """
    Validates and converts a value to Decimal.
    
    Args:
        value: Value to validate
        field_name: Name of the field being validated
        
    Returns:
        Decimal: Validated decimal value
        
    Raises:
        ValidationError: If value cannot be converted to Decimal
    """
    try:
        decimal_value = Decimal(str(value))
        return decimal_value
    except (TypeError, ValueError, ArithmeticError):
        raise ValidationError(
            f"Invalid decimal value for {field_name}: {value}"
        )