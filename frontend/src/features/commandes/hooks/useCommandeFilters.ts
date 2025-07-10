import { useState, useCallback, useRef } from 'react';
import { debounce } from 'lodash';

// Define allowed filter keys for type safety
const FILTER_KEYS = ['code_projet', 'numero_document', 'page', 'page_size'] as const;
type FilterKey = typeof FILTER_KEYS[number];

// Define filter state type with explicit index signature
type CommandeFilterState = {
    [K in FilterKey]?: K extends 'page' | 'page_size' ? number : string;
};

interface UseCommandeFiltersProps {
    initialFilters?: CommandeFilterState;
    onFilterChange?: (filters: CommandeFilterState) => void;
    debounceDelay?: number;
}

export const useCommandeFilters = ({ 
    initialFilters = {}, 
    onFilterChange,
    debounceDelay = 300 
}: UseCommandeFiltersProps = {}) => {
    const [filters, setFilters] = useState<CommandeFilterState>(initialFilters);
    const previousFiltersRef = useRef<CommandeFilterState>(initialFilters);

    // Create a memoized debounced filter change handler
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedFilterChange = useCallback(
        debounce((cleanedFilters: CommandeFilterState) => {
            // Only trigger if filters have actually changed
            if (onFilterChange && !isEqual(previousFiltersRef.current, cleanedFilters)) {
                onFilterChange(cleanedFilters);
                previousFiltersRef.current = cleanedFilters;
            }
        }, debounceDelay),
        [onFilterChange, debounceDelay]
    );

    const updateFilters = useCallback((newFilters: Partial<CommandeFilterState>) => {
        setFilters(prev => {
            // Clean up undefined values in a type-safe way
            const cleanedFilters = { ...prev, ...newFilters };
            FILTER_KEYS.forEach(key => {
                if (cleanedFilters[key] === undefined) {
                    delete cleanedFilters[key];
                }
            });

            // Trigger debounced filter change
            debouncedFilterChange(cleanedFilters);

            return cleanedFilters;
        });
    }, [debouncedFilterChange]);

    const resetFilters = useCallback(() => {
        const resetFilters = {} as CommandeFilterState;
        setFilters(resetFilters);
        debouncedFilterChange(resetFilters);
    }, [debouncedFilterChange]);

    return {
        filters,
        updateFilters,
        resetFilters
    };
};

// Utility function for deep comparison
function isEqual(obj1: CommandeFilterState, obj2: CommandeFilterState): boolean {
    const keys1 = Object.keys(obj1) as FilterKey[];
    const keys2 = Object.keys(obj2) as FilterKey[];

    if (keys1.length !== keys2.length) {
        return false;
    }

    // Use type-safe iteration over FILTER_KEYS
    return FILTER_KEYS.every(key => {
        // Safely check equality for known keys
        const value1 = obj1[key];
        const value2 = obj2[key];
        return value1 === value2;
    });
}