import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Upload, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CommandeTable } from '@/features/commandes/components/CommandeTable';
import { CommandeFilters } from '@/features/commandes/components/CommandeFilters';
import { Pagination } from '@/components/ui/Pagination';
import { DeleteProjectModal } from '@/components/DeleteProjectModal';
import { useCommandes } from '@/hooks/useCommandes';
import { useCommandeTable } from '@/features/commandes/hooks/useCommandeTable';
import { useCommandeFilters } from '@/features/commandes/hooks/useCommandeFilters';
import { Toast } from '@/components/ui/Toast';
import type { Project, CommandeFilters as FilterType } from '@/types';

export const CommandesPage: React.FC = () => {
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [projects, setProjects] = useState<Project[]>([]);

    const {
        importExcel,
        clearAllCommandes,
        deleteProjectCommandes,
        getProjects,
        loading: apiLoading,
        error: apiError
    } = useCommandes();

    const { 
        commandes, 
        pagination, 
        loading: tableLoading, 
        error: tableError, 
        loadCommandes 
    } = useCommandeTable({
        projects
    });

    const { filters, updateFilters, resetFilters } = useCommandeFilters({
        onFilterChange: useCallback((newFilters: Partial<FilterType>) => {
            loadCommandes(newFilters);
        }, [loadCommandes])
    });

    // Memoized error handling
    const error = useMemo(() => apiError || tableError, [apiError, tableError]);

    // Memoized loading state
    const loading = useMemo(() => apiLoading || tableLoading, [apiLoading, tableLoading]);

    // Single source of truth for projects (memoized)
    const fetchProjects = useCallback(async () => {
        try {
            const fetchedProjects = await getProjects();
            setProjects(fetchedProjects);
        } catch (error) {
            console.error('Failed to fetch projects:', error);
            setToastMessage('Failed to fetch projects');
        }
    }, [getProjects]);

    // Initial data fetch
    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    // Memoized action handlers with error toast
    const showErrorToast = useCallback((errorMessage: string, originalError?: unknown) => {
        console.error(errorMessage, originalError);
        setToastMessage(errorMessage);
    }, []);

    // Handle excel import (memoized)
    const handleImportClick = useCallback(async () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx,.xls';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                try {
                    await importExcel(file);
                    await loadCommandes(filters);
                    await fetchProjects();
                    setToastMessage('File imported successfully');
                } catch (error) {
                    showErrorToast('Failed to import file', error);
                }
            }
        };
        input.click();
    }, [importExcel, loadCommandes, filters, fetchProjects, showErrorToast]);

    // Handle clear all (memoized)
    const handleClearAll = useCallback(async () => {
        if (window.confirm('Are you sure you want to delete all orders? This action cannot be undone.')) {
            try {
                await clearAllCommandes();
                await loadCommandes(filters);
                await fetchProjects();
                setToastMessage('All orders deleted successfully');
            } catch (error) {
                showErrorToast('Failed to delete all orders', error);
            }
        }
    }, [clearAllCommandes, loadCommandes, filters, fetchProjects, showErrorToast]);

    // Handle project deletion (memoized)
    const handleDeleteProject = useCallback(async (projectCode: string) => {
        try {
            await deleteProjectCommandes(projectCode);
            await loadCommandes(filters);
            await fetchProjects();
            setIsDeleteModalOpen(false);
            setToastMessage(`Project ${projectCode} deleted successfully`);
        } catch (error) {
            showErrorToast(`Failed to delete project ${projectCode}`, error);
        }
    }, [deleteProjectCommandes, loadCommandes, filters, fetchProjects, showErrorToast]);

    // Memoized filter and pagination handlers
    const handleFilterChange = useCallback((newFilters: Partial<FilterType>) => {
        updateFilters(newFilters);
    }, [updateFilters]);

    const handlePageChange = useCallback((page: number) => {
        updateFilters({ page });
    }, [updateFilters]);

    const handlePageSizeChange = useCallback((newPageSize: number) => {
        updateFilters({
            page_size: newPageSize,
            page: 1
        });
    }, [updateFilters]);

    // Effect to load commandes when filters change
    useEffect(() => {
        loadCommandes(filters);
    }, [filters, loadCommandes]);

    // Render error state
    if (error) {
        return (
            <div className="p-4 bg-red-50 text-red-700 rounded-md">
                Error: {error}
            </div>
        );
    }


    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Order management and expense tracking
                    </p>
                </div>
                <div className="flex space-x-3">
                    <Button
                        variant="danger"
                        onClick={handleClearAll}
                        icon={Trash2}
                        disabled={loading}
                    >
                        Delete All
                    </Button>
                    <Button
                        variant="danger"
                        onClick={() => setIsDeleteModalOpen(true)}
                        icon={Trash2}
                        disabled={loading}
                    >
                        Delete Project
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={handleImportClick}
                        icon={Upload}
                        disabled={loading}
                    >
                        Import Excel
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <CommandeFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                onReset={resetFilters}
            />

            {/* Table */}
            <CommandeTable
                commandes={commandes}
                loading={loading}
                projects={projects}
            />

            {/* Pagination */}
            <div className="flex justify-center mt-4">
                <Pagination
                    currentPage={pagination.current_page}
                    totalItems={pagination.total}
                    itemsPerPage={pagination.page_size}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                    pageSizeOptions={[10, 25, 50, 100]}
                />
            </div>

            {/* Modals */}
            <DeleteProjectModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteProject}
                projects={projects}
            />

            {/* Toast */}
            {toastMessage && (
                <Toast message={toastMessage} onClose={() => setToastMessage('')} />
            )}
        </div>
    );
};