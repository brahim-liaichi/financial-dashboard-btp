# apps/facturation/admin.py

from django.contrib import admin
from django.utils.html import format_html
from django.urls import path
from django.shortcuts import render
from django.http import HttpResponseRedirect
from django import forms
from .models import Facturation, Avancement
from .services.facturation_import_service import FacturationImportService
from .services.facturation_analytics_service import FacturationAnalyticsService


class ExcelImportForm(forms.Form):
    """Form for Excel file upload in admin interface"""

    excel_file = forms.FileField(
        label="Select Excel File",
        help_text="Upload SAP Excel file containing Facturation and Avancement sheets",
    )


class DeleteProjectForm(forms.Form):
    """Form for project deletion"""

    project_code = forms.CharField(
        label="Project Code", help_text="Enter the project code to delete"
    )


@admin.register(Facturation)
class FacturationAdmin(admin.ModelAdmin):
    """
    Admin interface configuration for Facturation model.

    Provides:
    - List display with key fields
    - Search and filtering capabilities
    - Excel import functionality
    - Read-only field protection
    - Project deletion capability
    - Bulk deletion functionality
    """

    # Custom template for adding import button
    change_list_template = "admin/facturation/facturation_changelist.html"

    # Fields to display in list view
    list_display = [
        "document_number",
        "project_code",
        "registration_date",
        "client_name",
        "total_after_discount",
        "document_status",
    ]

    # Fields that can be searched
    search_fields = [
        "document_number",
        "project_code",
        "client_name",
        "client_code",
    ]

    # Filters shown in the right sidebar
    list_filter = [
        "project_code",
        "document_status",
        "registration_date",
    ]

    # Fields that cannot be modified (calculated or imported)
    readonly_fields = ["line_total", "total_after_discount"]

    # Logical grouping of fields in detail view
    fieldsets = (
        (
            "Document Information",
            {
                "fields": (
                    "document_number",
                    "project_code",
                    "registration_date",
                    "document_status",
                )
            },
        ),
        (
            "Client Information",
            {
                "fields": (
                    "client_code",
                    "client_name",
                )
            },
        ),
        (
            "Item Details",
            {
                "fields": (
                    "item_code",
                    "description",
                    "quantity",
                    "price",
                )
            },
        ),
        (
            "Financial Information",
            {
                "fields": (
                    "line_total",
                    "total_after_discount",
                )
            },
        ),
    )

    def has_add_permission(self, request):
        """Disable manual record addition since data comes from Excel"""
        return False

    def has_change_permission(self, request, obj=None):
        """Disable editing since data comes from SAP"""
        return False

    def get_urls(self):
        """Add custom URLs for import and delete operations"""
        urls = super().get_urls()
        custom_urls = [
            path(
                "import-excel/",
                self.admin_site.admin_view(self.import_excel),
                name="facturation_import_excel",
            ),
            path(
                "delete-project/",
                self.admin_site.admin_view(self.delete_project),
                name="facturation_delete_project",
            ),
            path(
                "delete-all/",
                self.admin_site.admin_view(self.delete_all_data),
                name="facturation_delete_all",
            ),
        ]
        return custom_urls + urls

    def import_excel(self, request):
        """
        Handle Excel file import functionality.

        Process:
        1. Display upload form on GET request
        2. Process uploaded file on POST request
        3. Use FacturationImportService to handle the import
        4. Show success/error messages
        5. Redirect back to list view
        """
        if request.method == "POST":
            form = ExcelImportForm(request.POST, request.FILES)
            if form.is_valid():
                import_service = FacturationImportService()
                try:
                    # Process the uploaded Excel file
                    result = import_service.process_excel_import(
                        request.FILES["excel_file"]
                    )

                    # Show success message with import counts
                    self.message_user(
                        request,
                        f"Successfully imported {result['facturation_count']} facturation records "
                        f"and {result['avancement_count']} avancement records",
                    )
                    return HttpResponseRedirect("../")
                except Exception as e:
                    # Show error message if import fails
                    self.message_user(
                        request, f"Error importing file: {str(e)}", level="ERROR"
                    )
        else:
            form = ExcelImportForm()

        # Render the import form
        return render(
            request,
            "admin/facturation/import_form.html",
            {"form": form, "title": "Import Excel File"},
        )

    def delete_project(self, request):
        """
        Handle project-specific deletion.
        Deletes both Facturation and Avancement records for the specified project.
        """
        if request.method == "POST":
            form = DeleteProjectForm(request.POST)
            if form.is_valid():
                try:
                    import_service = FacturationImportService()
                    project_code = form.cleaned_data["project_code"]
                    import_service.clean_import_data(project_code)

                    self.message_user(
                        request,
                        f"Successfully deleted all data for project {project_code}",
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
            "admin/facturation/delete_project_form.html",
            {"form": form, "title": "Delete Project Data"},
        )

    def delete_all_data(self, request):
        """
        Handle deletion of all Facturation and Avancement data.
        """
        if request.method == "POST":
            try:
                import_service = FacturationImportService()
                import_service.clean_import_data()

                self.message_user(
                    request, "Successfully deleted all Facturation and Avancement data"
                )
                return HttpResponseRedirect("../")
            except Exception as e:
                self.message_user(
                    request, f"Error deleting data: {str(e)}", level="ERROR"
                )

        return render(
            request,
            "admin/facturation/delete_all_confirmation.html",
            {"title": "Delete All Data"},
        )


@admin.register(Avancement)
class AvancementAdmin(admin.ModelAdmin):
    """
    Admin interface configuration for Avancement model.

    Provides:
    - List display of payment tracking
    - Search and filtering capabilities
    - Read-only access to imported data
    """

    list_display = [
        "doc_num",
        "project_code",
        "accounting_date",
        "payment_ht",
        "payment_ttc",
        "payment_method",
        "canceled",
    ]

    search_fields = [
        "doc_num",
        "project_code",
    ]

    list_filter = [
        "project_code",
        "payment_method",
        "canceled",
        "accompte_flag",
        "accounting_date",
    ]

    fieldsets = (
        (
            "Document Information",
            {
                "fields": (
                    "doc_type",
                    "doc_num",
                    "project_code",
                    "accounting_date",
                )
            },
        ),
        (
            "Payment Details",
            {
                "fields": (
                    "payment_ht",
                    "payment_ttc",
                    "payment_method",
                )
            },
        ),
        (
            "Status Information",
            {
                "fields": (
                    "canceled",
                    "accompte_flag",
                )
            },
        ),
        (
            "Additional Information",
            {
                "fields": (
                    "num",
                    "total",
                    "dat",
                ),
                "classes": ("collapse",),
            },
        ),
    )

    def has_add_permission(self, request):
        """Disable manual addition since data comes from Excel"""
        return False

    def has_change_permission(self, request, obj=None):
        """Disable editing since data comes from SAP"""
        return False
