import { useState, useCallback, useRef, useEffect } from 'react';
import { isEqual } from 'lodash';
import { useCommandes } from '@/hooks/useCommandes';
import type { Commande, Project } from '@/types';

// Define table-specific types
type TableFilters = {
    code_projet?: string;
    numero_document?: string;
    page?: number;
    page_size?: number;
};

type PaginationState = {
    total: number;
    current_page: number;
    page_size: number;
};

interface UseCommandeTableProps {
    projects: Project[];
}

export const useCommandeTable = ({ projects }: UseCommandeTableProps) => {
    const { 
        fetchCommandes,
        loading: isLoadingCommandes, 
        error 
    } = useCommandes();

    const [commandes, setCommandes] = useState<Commande[]>([]);
    const [pagination, setPagination] = useState<PaginationState>({
        total: 0,
        current_page: 1,
        page_size: 10
    });

    // Ref to track the last used filters with proper typing
    const lastFiltersRef = useRef<TableFilters>({});
    const abortControllerRef = useRef<AbortController | null>(null);

    const loadCommandes = useCallback(async (filters: TableFilters) => {
        // Cancel any ongoing request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Create new abort controller
        abortControllerRef.current = new AbortController();
       
        //const signal = abortControllerRef.current.signal;

        // Removed debug log
        
        // Prevent redundant fetches
        if (isLoadingCommandes && isEqual(filters, lastFiltersRef.current)) {
            // Removed debug log
            return;
        }
    
        try {
            // Prepare safe filters with proper defaults
            const safeFilters: TableFilters = {
                ...filters,
                page: filters.page || pagination.current_page,
                page_size: filters.page_size || pagination.page_size,
                code_projet: filters.code_projet,
                numero_document: filters.numero_document
            };
            
            // Clean up undefined values
            Object.keys(safeFilters).forEach(key => {
                if (safeFilters[key as keyof TableFilters] === undefined) {
                    delete safeFilters[key as keyof TableFilters];
                }
            });
            
            // Removed debug log
            lastFiltersRef.current = safeFilters;
    
            const response = await fetchCommandes(safeFilters);
            // Removed debug log
    
            if (response.results) {
                setCommandes(response.results);
                setPagination(prev => {
                    const newPagination = {
                        total: response.count || 0,
                        current_page: safeFilters.page || prev.current_page,
                        page_size: safeFilters.page_size || prev.page_size
                    };
                    console.log('📊 useCommandeTable - Pagination update:', {
                        old: prev,
                        new: newPagination
                    });
                    return newPagination;
                });
            }
        } catch (error) {
            console.error('❌ useCommandeTable - Error loading commandes:', error);
            setCommandes([]);
            setPagination(prev => ({
                ...prev,
                total: 0
            }));
        } finally {
            // Clear abort controller
            abortControllerRef.current = null;
        }
    }, [fetchCommandes, isLoadingCommandes, pagination.current_page, pagination.page_size]);

    // Page change handler with validation
    const changePage = useCallback((page: number) => {
        if (page < 1) page = 1;
        console.log('📄 useCommandeTable - Changing page:', {
            from: pagination.current_page,
            to: page
        });
        
        setPagination(prev => ({
            ...prev,
            current_page: page
        }));
    }, [pagination.current_page]);

    // Change page size handler with validation
    const changePageSize = useCallback((newSize: number) => {
        if (newSize < 1) newSize = 10;
        console.log('📏 useCommandeTable - Changing page size:', {
            from: pagination.page_size,
            to: newSize
        });

        setPagination(prev => ({
            ...prev,
            page_size: newSize,
            current_page: 1 // Reset to first page
        }));
    }, [pagination.page_size]);

    // Effect to trigger load when pagination changes
    useEffect(() => {
        loadCommandes({
            page: pagination.current_page,
            page_size: pagination.page_size
        });
    }, [pagination.current_page, pagination.page_size, loadCommandes]);

    return {
        commandes,
        projects,
        pagination,
        loading: isLoadingCommandes,
        error,
        loadCommandes,
        changePage,
        changePageSize
    };
};
