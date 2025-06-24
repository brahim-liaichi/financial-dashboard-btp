import logging
from decimal import Decimal
from typing import Optional
from django.db import transaction
from django.core.exceptions import ValidationError
from apps.commandes.models import Commande
from apps.core.services.base_service import BaseService
from ..models import ControleDepense
from apps.core.constants import PROJECT_NAME_MAP, get_project_name, get_project_type

logger = logging.getLogger(__name__)


class ControleBaseService(BaseService[ControleDepense]):
    """
    Base service for managing ControleDepense records.

    Core Functionalities:
    1. Record Validation
       - Validates article numbers
       - Auto-assigns project codes
       - Verifies project types

    2. Data Synchronization
       - Syncs between Commande and ControleDepense
       - Handles project type updates
       - Maintains data consistency

    3. Control Data Management
       - Updates financial metrics
       - Manages project budgets
       - Tracks reliability indicators

    Key Components:
    - Prix Vente: Base and adjusted selling prices
    - Budget Chef Projet: Base and adjusted project manager budgets
    - Reste à Dépenser: Remaining budget
    - Fiabilité: Reliability indicator (A-E scale)
    """

    def __init__(self):
        self.model_class = ControleDepense

    def validate_record(self, controle: ControleDepense) -> bool:
        try:
            logger.debug(f"Validating record: {controle.numero_article}")

            if not controle.numero_article:
                logger.error("Missing required field: numero_article")
                return False

            if not controle.code_projet:
                commande = Commande.objects.filter(
                    numero_article=controle.numero_article
                ).first()
                logger.debug(f"Found commande for validation: {commande}")

                if not commande:
                    logger.error(
                        f"No Commande found for article: {controle.numero_article}"
                    )
                    return False

                controle.code_projet = commande.code_projet
                # Get project type from the new mapping
                project_type = get_project_type(commande.code_projet)
                controle.type_projet = project_type
                controle.save()
                logger.info(
                    f"Updated project code: {controle.code_projet} with type: {project_type}"
                )

            return True

        except Exception as e:
            logger.error(f"Validation error: {str(e)}", exc_info=True)
            return False

    def sync_controle_depense_records(
        self, numero_article: Optional[str] = None, code_projet: Optional[str] = None
    ) -> None:
        logger.info(
            f"Starting sync - Filters: Article={numero_article}, Project={code_projet}"
        )

        try:
            # Build base query
            commande_query = Commande.objects.filter(annule="N")
            logger.debug(f"Base query SQL: {commande_query.query}")

            if numero_article:
                commande_query = commande_query.filter(numero_article=numero_article)
            if code_projet:
                commande_query = commande_query.filter(code_projet=code_projet)

            logger.info(f"Filtered query SQL: {commande_query.query}")
            logger.info(f"Found {commande_query.count()} matching commandes")

            unique_combinations = (
                commande_query.values("numero_article", "code_projet")
                .distinct()
                .order_by("numero_article", "code_projet")
            )

            logger.info(f"Found {len(unique_combinations)} unique combinations")
            created, updated = 0, 0

            for combo in unique_combinations:
                try:
                    logger.debug(f"Processing combination: {combo}")
                    project_type = get_project_type(combo["code_projet"])
                    project_name = get_project_name(combo["code_projet"])
                    logger.debug(f"Project type: {project_type}, name: {project_name}")

                    defaults = {
                        "type_projet": project_type,
                        "prix_vente": Decimal("0"),
                        "prix_vente_base": Decimal("0"),
                        "budget_chef_projet": Decimal("0"),
                        "budget_chef_projet_base": Decimal("0"),
                        "fiabilite": "E",
                    }

                    controle, was_created = self.model_class.objects.get_or_create(
                        numero_article=combo["numero_article"],
                        code_projet=combo["code_projet"],
                        defaults=defaults,
                    )

                    if was_created:
                        logger.info(f"Created new record: {controle.__dict__}")
                        created += 1
                    else:
                        # Update project type if it has changed
                        if controle.type_projet != project_type:
                            controle.type_projet = project_type
                            controle.save()
                            logger.info(f"Updated project type to: {project_type}")
                        logger.debug(f"Record exists: {controle.__dict__}")
                        updated += 1

                except Exception as e:
                    logger.error(
                        f"Error processing combination {combo}: {str(e)}", exc_info=True
                    )

            logger.info(
                f"Sync summary - Created: {created}, Updated: {updated}, Total unique: {len(unique_combinations)}"
            )
            logger.info(f"Total records after sync: {self.model_class.objects.count()}")

        except Exception as e:
            logger.error(f"Sync error: {str(e)}", exc_info=True)
            raise

    @transaction.atomic
    def update_control_data(
        self,
        numero_article: str,
        code_projet: Optional[str] = None,
        type_projet: Optional[str] = None,
        prix_vente: Optional[Decimal] = None,
        prix_vente_base: Optional[Decimal] = None,
        budget_chef_projet: Optional[Decimal] = None,
        budget_chef_projet_base: Optional[Decimal] = None,
        reste_a_depenser: Optional[Decimal] = None,
        fiabilite: Optional[str] = None,
    ) -> ControleDepense:
        logger.info(f"Update parameters received: {locals()}")
        logger.info(f"Fiabilite value: {fiabilite}")
        try:
            logger.info(f"Updating control data for article: {numero_article}")

            if not code_projet:
                commande = Commande.objects.filter(
                    numero_article=numero_article
                ).first()
                code_projet = commande.code_projet if commande else "UNKNOWN"
                logger.debug(f"Found project code: {code_projet}")

            # Get project type from mapping if not provided
            if not type_projet:
                type_projet = get_project_type(code_projet)
                logger.debug(f"Determined project type: {type_projet}")

            controle, created = self.model_class.objects.get_or_create(
                numero_article=numero_article,
                code_projet=code_projet,
                defaults={
                    "type_projet": type_projet,
                    "prix_vente": prix_vente or Decimal("0"),
                    "prix_vente_base": prix_vente_base or Decimal("0"),
                    "budget_chef_projet": budget_chef_projet or Decimal("0"),
                    "budget_chef_projet_base": budget_chef_projet_base or Decimal("0"),
                    "reste_a_depenser": reste_a_depenser or Decimal("0"),
                    "fiabilite": fiabilite or "E",
                },
            )

            if not created:
                if type_projet is not None:
                    controle.type_projet = type_projet
                if prix_vente is not None:
                    controle.prix_vente = prix_vente
                if prix_vente_base is not None:
                    controle.prix_vente_base = prix_vente_base
                if budget_chef_projet is not None:
                    controle.budget_chef_projet = budget_chef_projet
                if budget_chef_projet_base is not None:
                    controle.budget_chef_projet_base = budget_chef_projet_base
                if reste_a_depenser is not None:
                    controle.reste_a_depenser = reste_a_depenser
                if fiabilite is not None:
                    controle.fiabilite = fiabilite
                controle.save()

            logger.info(
                f"Successfully {'created' if created else 'updated'} control data for {numero_article}"
            )
            return controle

        except Exception as e:
            logger.error(f"Error updating control data: {str(e)}")
            raise

    def get_related_commandes(
        self, numero_article: str, code_projet: str
    ) -> list[Commande]:
        """
        Get all commandes related to a specific controle.

        Args:
            numero_article (str): The article number
            code_projet (str): The project code

        Returns:
            list[Commande]: List of related commandes
        """
        try:
            logger.info(
                f"Fetching commandes for Article: {numero_article}, Project: {code_projet}"
            )

            # Get project type for logging
            project_type = get_project_type(code_projet)
            project_name = get_project_name(code_projet)
            logger.debug(f"Project type: {project_type}, name: {project_name}")

            commandes = Commande.objects.filter(
                numero_article=numero_article,
                code_projet=code_projet,
                annule="N",  # Only non-cancelled commandes
            ).order_by("-date_enregistrement")

            logger.info(f"Found {commandes.count()} related commandes")
            return commandes

        except Exception as e:
            logger.error(f"Error fetching related commandes: {str(e)}", exc_info=True)
            raise
