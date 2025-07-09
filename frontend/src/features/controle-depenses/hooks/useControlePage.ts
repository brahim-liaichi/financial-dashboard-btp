import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useControle } from '@/hooks/useControle';
import { useControleFilters } from './useControleFilters';
import { useProjectsFetch } from './useProjectsFetch';
import { useEvolutionData } from './useEvolutionData';
import { useFacturationMetrics } from './useFacturationMetrics';
import { useControleUpdate } from './useControleUpdate';
import type { 
    ControleMetrics, 
    ControleUpdateInput, 
    FilterParams, 
    ProjectType
} from '@/types';

export interface PageFilters {
    selectedProject: string;
    selectedProjectType: ProjectType | '';
}

export const useControlePage = () => {
    const navigate = useNavigate();
    const [selectedItem, setSelectedItem] = useState<ControleMetrics | null>(null);
    const [showSingleRow, setShowSingleRow] = useState(false);

    const { 
        controles, 
        loading: isLoadingControles, 
        error,
        fetchControles,
        updateControle
    } = useControle();

    const { 
        projects, 
        isLoading: isLoadingProjects, 
        refetchProjects 
    } = useProjectsFetch(fetchControles);

    const { 
        filters, 
        handleFilterChange, 
        handleFilterReset 
    } = useControleFilters((filters?: FilterParams) => {
        setShowSingleRow(false);
        setSelectedItem(null);
        
        return fetchControles({
            code_projet: filters?.code_projet,
            numero_article: filters?.numero_article,
            type_projet: filters?.type_projet
        });
    });

    const { 
        controleEvolutionData, 
        facturationEvolutionData,
        isLoading: isLoadingEvolution 
    } = useEvolutionData(filters.selectedProject);

    const { 
        facturationMetrics: selectedProjectMetrics, 
        isLoading: isLoadingSelectedProjectMetrics 
    } = useFacturationMetrics(filters.selectedProject);

    const { handleUpdate: originalHandleUpdate, isUpdating } = useControleUpdate(
        updateControle, 
        refetchProjects
    );

    const handleUpdate = useCallback(async (data: ControleUpdateInput) => {
        if (!selectedItem) return null;
        
        try {
            const updatedControle = await originalHandleUpdate(selectedItem, data);
            
            if (updatedControle) {
                setSelectedItem(updatedControle);
                setShowSingleRow(true);
            }
            
            return updatedControle;
        } catch (error) {
            console.error('Update failed:', error);
            throw error;
        }
    }, [selectedItem, originalHandleUpdate]);

    const handleCloseModal = useCallback(() => {
        setSelectedItem(null);
        setShowSingleRow(false);
    }, []);

    const handleSelectItem = useCallback((item: ControleMetrics | null) => {
        setSelectedItem(item);
        setShowSingleRow(true);
    }, []);

    const handleResetView = useCallback(() => {
        setShowSingleRow(false);
        setSelectedItem(null);
    }, []);

    const handleViewFacturationDetails = useCallback(() => {
        if (filters.selectedProject) {
            navigate(`/facturation/${encodeURIComponent(filters.selectedProject)}`);
        }
    }, [filters.selectedProject, navigate]);

    const filteredData = showSingleRow && selectedItem
        ? controles.filter(item => 
            item.numero_article === selectedItem.numero_article && 
            item.code_projet === selectedItem.code_projet
          )
        : controles;

    const isLoading = isLoadingControles || 
                     isLoadingProjects || 
                     isLoadingEvolution ||
                     isLoadingSelectedProjectMetrics;

    return {
        selectedItem,
        setSelectedItem: handleSelectItem,
        showSingleRow,
        filteredData,
        filters,
        projects,
        controles,
        facturationMetrics: selectedProjectMetrics,
        error,
        controleEvolutionData,
        facturationEvolutionData,
        isLoading,
        isLoadingControles,
        isLoadingFacturation: isLoadingSelectedProjectMetrics,
        isUpdating,
        handleFilterChange,
        handleFilterReset,
        handleUpdate,
        handleCloseModal,
        handleResetView,
        handleViewFacturationDetails,
        refetchProjects
    };
};