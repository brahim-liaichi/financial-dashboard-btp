# backend/apps/core/utils/helpers.py

from typing import Dict, Any
from decimal import Decimal
from datetime import datetime

def format_currency(
    amount: Decimal,
    currency: str = "MAD",
    decimal_places: int = 2
) -> str:
    """
    Formats a decimal amount as currency string.
    
    Args:
        amount: Decimal amount to format
        currency: Currency code (default: MAD)
        decimal_places: Number of decimal places to show
        
    Returns:
        str: Formatted currency string
    """
    return f"{amount:.{decimal_places}f} {currency}"

def parse_date(date_str: str) -> datetime:
    """
    Parses a date string into datetime object.
    
    Args:
        date_str: Date string to parse
        
    Returns:
        datetime: Parsed datetime object
        
    Raises:
        ValueError: If date string cannot be parsed
    """
    try:
        return datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        try:
            return datetime.strptime(date_str, "%d/%m/%Y")
        except ValueError:
            raise ValueError(f"Unable to parse date: {date_str}")

def clean_dict_values(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Cleans dictionary values by removing whitespace and converting empty strings to None.
    
    Args:
        data: Dictionary to clean
        
    Returns:
        Dict: Cleaned dictionary
    """
    cleaned = {}
    for key, value in data.items():
        if isinstance(value, str):
            cleaned[key] = value.strip() or None
        else:
            cleaned[key] = value
    return cleaned