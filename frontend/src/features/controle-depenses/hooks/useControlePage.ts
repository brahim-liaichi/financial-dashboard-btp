import { useCallback, useState, useMemo } from 'react';
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
    DebugEntry,
    FacturationMetrics as FacturationMetricsType,
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
    const [debugEntries, setDebugEntries] = useState<DebugEntry[]>([]);

    // Add debug entry utility with layer support
    const addDebugEntry = useCallback((entry: Omit<DebugEntry, 'timestamp'> & { layer?: string }) => {
        const newEntry: DebugEntry = {
            timestamp: new Date().toISOString(),
            layer: 'Unspecified', // Default layer
            ...entry
        };
        
        setDebugEntries(prev => [...prev, newEntry]);
        return newEntry;
    }, []);

    const { 
        controles, 
        loading: isLoadingControles, 
        error,
        fetchControles,
        updateControle
    } = useControle({
        onError: (err: Error) => addDebugEntry({
            component: 'useControle',
            action: 'Fetch Controles',
            layer: 'Data Fetching',
            inputData: {},
            outputData: null,
            warnings: [err.message]
        })
    });

    const { 
        projects, 
        isLoading: isLoadingProjects, 
        refetchProjects 
    } = useProjectsFetch(fetchControles, {
        onError: (err: Error) => addDebugEntry({
            component: 'useProjectsFetch',
            action: 'Fetch Projects',
            layer: 'Data Fetching',
            inputData: {},
            outputData: null,
            warnings: [err.message]
        })
    });

    const { 
        filters, 
        handleFilterChange, 
        handleFilterReset 
    } = useControleFilters((filters?: FilterParams) => {
        const debugEntry = addDebugEntry({
            component: 'useControleFilters',
            action: 'Apply Filters',
            layer: 'State Management',
            inputData: filters
        });

        setShowSingleRow(false);
        setSelectedItem(null);
        
        return fetchControles({
            code_projet: filters?.code_projet,
            numero_article: filters?.numero_article,
            type_projet: filters?.type_projet
        }).then(result => {
            debugEntry.outputData = result;
            return result;
        }).catch(error => {
            debugEntry.warnings = [error instanceof Error ? error.message : 'Unknown error'];
            throw error;
        });
    });

    const { 
        controleEvolutionData, 
        facturationEvolutionData,
        isLoading: isLoadingEvolution 
    } = useEvolutionData(filters.selectedProject, {
        onError: (err: Error) => addDebugEntry({
            component: 'useEvolutionData',
            action: 'Fetch Evolution Data',
            layer: 'Data Processing',
            inputData: { projectCode: filters.selectedProject },
            outputData: null,
            warnings: [err.message]
        })
    });

    const { 
        facturationMetrics: selectedProjectMetrics, 
        isLoading: isLoadingSelectedProjectMetrics 
    } = useFacturationMetrics(filters.selectedProject, {
        onError: (err: Error) => addDebugEntry({
            component: 'useFacturationMetrics',
            action: 'Fetch Facturation Metrics',
            layer: 'Data Processing',
            inputData: { projectCode: filters.selectedProject },
            outputData: null,
            warnings: [err.message]
        })
    });

    const { handleUpdate: originalHandleUpdate, isUpdating } = useControleUpdate(
        updateControle, 
        refetchProjects
    );

    const handleUpdate = useCallback(async (data: ControleUpdateInput) => {
        if (!selectedItem) return null;
        
        const debugEntry = addDebugEntry({
            component: 'useControlePage',
            action: 'Update Controle',
            layer: 'State Management',
            inputData: { ...data, selectedItem }
        });

        try {
            const updatedControle = await originalHandleUpdate(selectedItem, data);
            
            if (updatedControle) {
                debugEntry.outputData = updatedControle;
                
                setSelectedItem(updatedControle);
                setShowSingleRow(true);
            }
            
            return updatedControle;
        } catch (error) {
            debugEntry.warnings = [
                error instanceof Error ? error.message : 'Unknown error occurred'
            ];
            
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

    // Compute debug entries for external use
    const allDebugEntries = useMemo(() => {
        const entries: DebugEntry[] = [...debugEntries];

        // Add additional entries based on current state
        if (controleEvolutionData?.controle) {
            entries.push({
                timestamp: new Date().toISOString(),
                component: 'Controle Evolution',
                action: 'Data Transformation',
                layer: 'Data Processing',
                inputData: controleEvolutionData,
                outputData: {
                    dataPoints: controleEvolutionData.controle.length,
                    dateRange: {
                        start: controleEvolutionData.controle[0]?.date,
                        end: controleEvolutionData.controle[controleEvolutionData.controle.length - 1]?.date
                    }
                }
            });
        }

        // Add facturation evolution data if exists
        if (facturationEvolutionData) {
            entries.push({
                timestamp: new Date().toISOString(),
                component: 'Facturation Evolution',
                action: 'Data Transformation',
                layer: 'Data Processing',
                inputData: facturationEvolutionData,
                outputData: {
                    facturationPoints: facturationEvolutionData.facturation?.length || 0,
                    avancementPoints: facturationEvolutionData.avancement?.length || 0
                }
            });
        }

        return entries;
    }, [debugEntries, controleEvolutionData, facturationEvolutionData]);

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
        refetchProjects,
        debugEntries: allDebugEntries,
        clearDebugEntries: () => setDebugEntries([])
    };
};