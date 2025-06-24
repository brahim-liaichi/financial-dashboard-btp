# apps/controle_depenses/choices.py

from typing import List, Tuple

# Choices for fiabilité level
FIABILITE_CHOICES: List[Tuple[str, str]] = [
    ("E", "Estimé"),
    ("C", "Chiffré"),
    ("M", "Marché"),
]

# Choices for project type
PROJECT_TYPE_CHOICES: List[Tuple[str, str]] = [
    ("FORFAIT", "Forfait"),
    ("METRE", "Métré"),
]

# Status choices based on profitability calculations
STATUS_CHOICES: List[Tuple[str, str]] = [
    ("Profitable", "Profitable"),
    ("Break-even", "Break-even"),
    ("Loss", "Loss"),
    ("Undefined", "Undefined"),
]

# Constants for project types
TYPE_FORFAIT: str = "FORFAIT"
TYPE_METRE: str = "METRE"

# Default project type
DEFAULT_PROJECT_TYPE: str = TYPE_FORFAIT
