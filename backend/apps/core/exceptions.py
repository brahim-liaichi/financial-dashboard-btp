# backend/apps/core/exceptions.py

class FinancialDashboardException(Exception):
    """Base exception class for all custom exceptions in the application."""
    pass

class ExcelProcessingError(FinancialDashboardException):
    """Raised when there's an error processing Excel files."""
    pass

class ValidationError(FinancialDashboardException):
    """Raised when data validation fails."""
    pass

class CalculationError(FinancialDashboardException):
    """Raised when there's an error in financial calculations."""
    pass