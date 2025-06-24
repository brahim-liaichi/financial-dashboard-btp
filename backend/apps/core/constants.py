# backend/apps/core/constants.py

# Excel file constants
REQUIRED_COLUMNS = [
    "Numéro de document",
    "Code client/fournisseur",
    "Numéro d'article",
    "Code du projet",
]

# Optional columns with default values
OPTIONAL_COLUMNS = [
    "Annulé",
    "Statut document",
    "Date d'enregistrement",
    "Date d'échéance",
    "Nom du client/fournisseur",
    "Description article/service",
    "Quantité",
    "Quantité en cours",
    "Prix",
    "Devise du prix",
    "Cours de change",
    "Total des lignes",
]

# All columns that should be present in the Excel file
ALL_COLUMNS = REQUIRED_COLUMNS + OPTIONAL_COLUMNS

# Financial constants
DEFAULT_CURRENCY = "MAD"
DECIMAL_PLACES = 2
MAX_DIGITS = 15

# Status constants
DOCUMENT_STATUSES = {"O": "Open", "C": "Closed", "P": "Pending"}

# Calculation constants
MIN_RENTABILITE = 0
MAX_RENTABILITE = 1000  # 1000%

FACTURATION_REQUIRED_COLUMNS = ["Code projet"]

AVANCEMENT_REQUIRED_COLUMNS = ["Code du projet"]

# Optional columns for each sheet
FACTURATION_OPTIONAL_COLUMNS = [
    "Numéro de document",
    "Date d'enregistrement",
    "Statut document",
    "Code client/fournisseur",
    "Nom du client/fournisseur",
    "ItemCode",
    "Description",
    "Quantity",
    "Price",
    "LineTotal",
    "Total après remise pied de page",
]

AVANCEMENT_OPTIONAL_COLUMNS = [
    "DocType",
    "DocNum",
    "Date comptable",
    "Payment HT",
    "Payement TTC",
    "Méthode de paiement",
    "Num",
    "Total",
    "Dat",
    "Canceled",
    "Accompte_Flag",
]

# All columns for each new sheet
FACTURATION_ALL_COLUMNS = FACTURATION_REQUIRED_COLUMNS + FACTURATION_OPTIONAL_COLUMNS
AVANCEMENT_ALL_COLUMNS = AVANCEMENT_REQUIRED_COLUMNS + AVANCEMENT_OPTIONAL_COLUMNS

# Column mappings for standardization
FACTURATION_COLUMN_MAPPING = {
    "Code projet": "project_code",
    "Price": "price",
    "LineTotal": "line_total",
    "Total après remise pied de page": "total_after_discount",
}

AVANCEMENT_COLUMN_MAPPING = {
    "Code du projet": "project_code",
    "Payment HT": "payment_ht",
    "Payement TTC": "payment_ttc",
}


# your_app/project_constants.py

PROJECT_NAME_MAP = {
    "PROJ-2024-A": {"name": "PROJA", "type": "FORFAIT"},
    "PROJ-2024-B": {"name": "PROJB", "type": "METRE"},
}


def get_project_name(code: str) -> str:
    """Returns the project name for a given code, or the code itself if not found."""
    return PROJECT_NAME_MAP.get(code, {"name": code})["name"]


def get_project_type(code: str) -> str:
    """Returns the project type for a given code, defaulting to FORFAIT."""
    return PROJECT_NAME_MAP.get(code, {"type": "FORFAIT"})["type"]
