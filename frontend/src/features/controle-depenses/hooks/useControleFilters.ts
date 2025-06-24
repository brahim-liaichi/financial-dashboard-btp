import { useState, useCallback, useRef } from 'react';
import { ControleFilterValues } from '@/features/controle-depenses/components/types';
import type { ControleMetrics, FilterParams, ProjectType } from '@/types';

// Extend ControleFilterValues to include project type
export interface ExtendedControleFilterValues extends ControleFilterValues {
    selectedProjectType?: ProjectType | '';
}

export const useControleFilters = (
    fetchControles: (filters?: FilterParams) => Promise<ControleMetrics[]>
) => {
    // Use useRef for filters to prevent unnecessary rerenders
    const filtersRef = useRef<ExtendedControleFilterValues>({
        articleSearch: '',
        selectedProject: '',
        selectedProjectType: ''
    });

    const [filters, setFilters] = useState<ExtendedControleFilterValues>(filtersRef.current);
    const [filteredControle, setFilteredControle] = useState<ControleMetrics | null>(null);
    const [isFilterLoading, setIsFilterLoading] = useState(false);
    const [filterError, setFilterError] = useState<Error | null>(null);

    // Memoized filter change handler with debounce-like behavior
    const handleFilterChange = useCallback((newFilters: Partial<ExtendedControleFilterValues>) => {
        // Update ref first to minimize rerenders
        const updatedFilters = { ...filtersRef.current, ...newFilters };
        filtersRef.current = updatedFilters;

        // Validate project type before updating
        const validatedFilters = {
            ...updatedFilters,
            selectedProjectType: updatedFilters.selectedProjectType as ProjectType | ''
        };

        // Batch state update to reduce rerenders
        setFilters(validatedFilters);

        // Prepare filters for API call
        const fetchFilters: FilterParams = {
            numero_article: validatedFilters.articleSearch || undefined,
            code_projet: validatedFilters.selectedProject || undefined,
            type_projet: validatedFilters.selectedProjectType || undefined
        };

        // Use a slight delay to prevent rapid successive calls
        const timeoutId = setTimeout(() => {
            fetchControles(fetchFilters);
        }, 300);

        // Cleanup function to cancel timeout if component unmounts
        return () => clearTimeout(timeoutId);
    }, [fetchControles]);

    // Reset handler with optimized rerender prevention
    const handleFilterReset = useCallback(() => {
        const resetFilters: ExtendedControleFilterValues = {
            articleSearch: '',
            selectedProject: '',
            selectedProjectType: ''
        };

        // Update ref
        filtersRef.current = resetFilters;

        // Batch state update
        setFilters(resetFilters);

        // Fetch without filters
        fetchControles({});
    }, [fetchControles]);

    // Memoized filtered fetch with reduced state updates
    const fetchFilteredControle = useCallback(async (filters?: Partial<FilterParams>) => {
        // Prevent multiple simultaneous fetches
        if (isFilterLoading) return null;

        try {
            setIsFilterLoading(true);
            setFilterError(null);

            // Ensure type safety for project type in filters
            const validatedFilters = filters ? {
                ...filters,
                type_projet: filters.type_projet as ProjectType | '' | undefined
            } : undefined;

            const results = await fetchControles(validatedFilters);
            const firstResult = results.length > 0 ? results[0] : null;

            // Only update state if result actually changes
            setFilteredControle(prevResult =>
                JSON.stringify(firstResult) !== JSON.stringify(prevResult)
                    ? firstResult
                    : prevResult
            );

            return firstResult;
        } catch (error) {
            const processedError = error instanceof Error
                ? error
                : new Error('Failed to fetch filtered controle');

            setFilterError(processedError);
            console.error('Filtered Controle Fetch Error:', processedError);

            return null;
        } finally {
            setIsFilterLoading(false);
        }
    }, [fetchControles, isFilterLoading]);

    return {
        filters,
        handleFilterChange,
        handleFilterReset,
        filteredControle,
        fetchFilteredControle,
        isFilterLoading,
        filterError
    };
};