import React, { useMemo } from 'react';
import { ControleTable } from './ControleTable';
import { ControleFilters } from './ControleFilters';
import { ControleSummary } from './ControleSummary';
import { FacturationMetrics } from '@/features/facturation/components/FacturationMetrics';
import { useControlePage } from '@/features/controle-depenses/hooks/useControlePage';
import FinancialEvolutionChart from './FinancialEvolutionChart';
import { UpdateModal } from './UpdateModal';
import {
    FacturationMetrics as FacturationMetricsType,
} from '@/types';

export const ControleDashboard: React.FC = () => {
    const {
        selectedItem,
        setSelectedItem,
        showSingleRow,
        filteredData,
        filters,
        controleEvolutionData,
        facturationEvolutionData,
        projects,
        controles,
        isLoading,
        isLoadingFacturation,
        error,
        facturationMetrics,
        handleFilterChange,
        handleUpdate,
        handleCloseModal,
        handleViewFacturationDetails,
        handleFilterReset,
        handleResetView,
    } = useControlePage();

    // Error handling utility
    const isErrorObject = (error: unknown): error is Error => {
        return error instanceof Error;
    };

    // Memoized summary metrics rendering
    const renderedSummaryMetrics = useMemo(() => {
        return (
            <div className="space-y-6">
                <ControleSummary
                    data={controles}
                    selectedProject={filters.selectedProject}
                />
                {filters.selectedProject && facturationMetrics && (
                    <FacturationMetrics
                        data={facturationMetrics as FacturationMetricsType}
                        isLoading={isLoadingFacturation}
                        error={error}
                        onViewDetailsClick={handleViewFacturationDetails}
                    />
                )}
            </div>
        );
    }, [
        controles,
        filters.selectedProject,
        facturationMetrics,
        isLoadingFacturation,
        error,
        handleViewFacturationDetails
    ]);

    // Memoized chart props
    const chartProps = useMemo(() => ({
        controleEvolutionData,
        facturationEvolutionData,
        isLoading: isLoading || isLoadingFacturation
    }), [controleEvolutionData, facturationEvolutionData, isLoading, isLoadingFacturation]);

    // Error message processing
    const errorMessage = useMemo(() => {
        if (!error) return null;
        return isErrorObject(error) ? error.message : String(error);
    }, [error]);

    // Render error state if there's an error
    if (errorMessage) {
        return (
            <div className="p-4 text-red-700 bg-red-100 rounded-md">
                Error: {errorMessage}
            </div>
        );
    }

    return (
        <div className="min-h-screen h-full space-y-6">
            {/* Page Header */}
            <div className="w-full bg-white px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Contrôle des Dépenses
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Suivi et analyse des dépenses par article
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 px-4 sm:px-6 lg:px-8">
                {/* Summary Metrics */}
                <div className="w-full overflow-x-auto">
                    <div className="min-w-[1024px] pb-4">
                        {renderedSummaryMetrics}
                    </div>
                </div>

                {/* Debug Section */}
                {filters.selectedProject && (
                    <div className="px-4 sm:px-6 lg:px-8 space-y-4">
                        <FinancialEvolutionChart
                            key={filters.selectedProject}
                            {...chartProps}
                        />
                    </div>
                )}

                {/* Filters */}
                <div className="w-full overflow-x-auto bg-white rounded-lg shadow mb-6">
                    <div className="min-w-[1024px]">
                        <ControleFilters
                            projects={projects}
                            selectedProject={filters.selectedProject}
                            onProjectChange={(project) => handleFilterChange({ selectedProject: project })}
                            onReset={handleFilterReset}
                        />
                    </div>
                </div>

                {/* Controle Table */}
                <div className="w-full overflow-x-auto bg-white rounded-lg shadow">
                    <div className="min-w-[1200px]">
                        <ControleTable
                            data={filteredData}
                            loading={isLoading}
                            selectedItem={selectedItem}
                            onEdit={setSelectedItem}
                            showSingleRow={showSingleRow}
                            onResetView={handleResetView}
                            selectedProject={filters.selectedProject}
                            selectedProjectType={filters.selectedProjectType}
                        />
                    </div>
                </div>
            </div>

            {/* Update Modal */}
            <UpdateModal
                isOpen={Boolean(selectedItem)}
                selectedItem={selectedItem}
                onClose={handleCloseModal}
                onUpdate={handleUpdate}
            />
        </div>
    );
};