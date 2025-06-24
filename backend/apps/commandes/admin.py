# apps/commandes/admin.py
from django.contrib import admin
from django.urls import path
from django.shortcuts import render
from django.http import HttpResponseRedirect
from django import forms
from .models import Commande
from .services.commande_service import CommandeService


class ExcelImportForm(forms.Form):
    """Form for Excel file upload in admin interface"""

    excel_file = forms.FileField(
        label="Select Excel File",
        help_text="Upload SAP Excel file containing Commande data",
    )


class DeleteProjectForm(forms.Form):
    """Form for project deletion"""

    project_code = forms.CharField(
        label="Project Code", help_text="Enter the project code to delete"
    )


@admin.register(Commande)
class CommandeAdmin(admin.ModelAdmin):
    """
    Admin interface configuration for Commande model.

    Features:
    - Excel import functionality
    - Project deletion capability
    - Bulk deletion functionality
    - Read-only view of SAP data
    - Project-based filtering
    - Comprehensive data display
    """

    # Custom template for adding import/delete buttons
    change_list_template = "admin/commandes/commande_changelist.html"

    # Fields to display in the list view
    list_display = [
        "numero_document",
        "code_projet",
        "numero_article",
        "quantite",
        "quantite_livree",
        "quantite_en_cours",
        "prix",
        "cours_change",
        "total_lignes",
        "statut_document",
        "annule",
    ]

    # Fields that can be searched
    search_fields = [
        "numero_document",
        "code_projet",
        "numero_article",
    ]

    # Filters in the right sidebar
    list_filter = [
        "code_projet",
        "statut_document",
        "annule",
    ]

    # Default ordering
    ordering = ["-numero_document"]

    # Make all fields read-only since data comes from SAP
    readonly_fields = [
        "numero_document",
        "code_projet",
        "numero_article",
        "quantite",
        "quantite_livree",
        "quantite_en_cours",
        "prix",
        "cours_change",
        "total_lignes",
        "statut_document",
        "annule",
    ]

    # Number of items to display per page
    list_per_page = 100

    def has_add_permission(self, request):
        """Disable add permission as data comes from SAP"""
        return False

    def has_delete_permission(self, request, obj=None):
        """Disable individual delete permission as deletion is handled through custom views"""
        return False

    def has_change_permission(self, request, obj=None):
        """Disable change permission as data comes from SAP"""
        return False

    def get_urls(self):
        """Add custom URLs for import and delete operations"""
        urls = super().get_urls()
        custom_urls = [
            path(
                "import-excel/",
                self.admin_site.admin_view(self.import_excel),
                name="commande_import_excel",
            ),
            path(
                "delete-project/",
                self.admin_site.admin_view(self.delete_project),
                name="commande_delete_project",
            ),
            path(
                "delete-all/",
                self.admin_site.admin_view(self.delete_all_commands),
                name="commande_delete_all",
            ),
        ]
        return custom_urls + urls

    def import_excel(self, request):
        """
        Handle Excel file import.

        Uses CommandeService for:
        - Excel file processing
        - Data validation
        - Batch import
        """
        if request.method == "POST":
            form = ExcelImportForm(request.POST, request.FILES)
            if form.is_valid():
                try:
                    service = CommandeService()
                    imported_commands = service.import_from_excel(
                        request.FILES["excel_file"]
                    )

                    self.message_user(
                        request,
                        f"Successfully imported {len(imported_commands)} commands",
                    )
                    return HttpResponseRedirect("../")
                except Exception as e:
                    self.message_user(
                        request, f"Error importing file: {str(e)}", level="ERROR"
                    )
        else:
            form = ExcelImportForm()

        return render(
            request,
            "admin/commandes/import_form.html",
            {"form": form, "title": "Import Commandes Excel File"},
        )

    def delete_project(self, request):
        """
        Handle project-specific deletion.

        Allows deletion of all commands for a specific project code.
        Requires confirmation and displays results.
        """
        if request.method == "POST":
            form = DeleteProjectForm(request.POST)
            if form.is_valid():
                try:
                    service = CommandeService()
                    project_code = form.cleaned_data["project_code"]
                    deleted_count = service.delete_project_commands(project_code)

                    self.message_user(
                        request,
                        f"Successfully deleted {deleted_count} commands for project {project_code}",
                    )
                    return HttpResponseRedirect("../")
                except Exception as e:
                    self.message_user(
                        request, f"Error deleting project: {str(e)}", level="ERROR"
                    )
        else:
            form = DeleteProjectForm()

        return render(
            request,
            "admin/commandes/delete_project_form.html",
            {"form": form, "title": "Delete Project Commands"},
        )

    def delete_all_commands(self, request):
        """
        Handle deletion of all commands.

        Provides a confirmation screen and executes bulk deletion.
        Uses CommandeService for the operation.
        """
        if request.method == "POST":
            try:
                service = CommandeService()
                deleted_count = service.clear_all_commands()

                self.message_user(
                    request, f"Successfully deleted all {deleted_count} commands"
                )
                return HttpResponseRedirect("../")
            except Exception as e:
                self.message_user(
                    request, f"Error deleting commands: {str(e)}", level="ERROR"
                )

        return render(
            request,
            "admin/commandes/delete_all_confirmation.html",
            {"title": "Delete All Commands"},
        )
