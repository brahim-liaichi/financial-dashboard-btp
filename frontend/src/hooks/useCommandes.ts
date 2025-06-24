import { useState, useCallback, useRef } from 'react';
import { commandesApi } from '@/api/endpoints/commandes';
import type {
    Commande,
    CommandeFilters,
    PaginatedResponse,
    Project
} from '@/types';

// Cache configuration as constants
const CACHE_DURATION = {
    COMMANDES: 5 * 60 * 1000,   // 5 minutes for commandes
    PROJECTS: 15 * 60 * 1000    // 15 minutes for projects
};

// Cache types with improved type safety
type FetchCache = Record<string, {
    data: PaginatedResponse<Commande>;
    timestamp: number;
}>;

type ProjectsCache = {
    data: Project[];
    timestamp: number;
};

const generateCacheKey = (filters?: Partial<CommandeFilters>): string => {
    if (!filters) return 'default';
    
    const entries = Object.entries(filters)
        .filter(([, value]) => value !== undefined && value !== '')
        .map(([key, value]) => `${key}:${value}`);
    
    const pageEntry = `page:${filters.page || 1}`;
    entries.push(pageEntry);
    
    return entries.sort().join('|');
};

export const useCommandes = () => {
    const fetchCacheRef = useRef<FetchCache>({});
    const projectsCacheRef = useRef<ProjectsCache>({
        data: [],
        timestamp: 0
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Centralized error handling
    const handleError = useCallback((error: unknown): string => {
        const message = error instanceof Error 
            ? error.message 
            : 'An unexpected error occurred';
        
        console.error('💥 useCommandes - Error:', message);
        setError(message);
        return message;
    }, []);

    const fetchCommandes = useCallback(async (params: CommandeFilters): Promise<PaginatedResponse<Commande>> => {
        const cacheKey = generateCacheKey(params);
        console.log('🔍 useCommandes - Fetch attempt:', {
            params,
            cacheKey,
            hasCache: !!fetchCacheRef.current[cacheKey]
        });
        
        const now = Date.now();
        const cachedEntry = fetchCacheRef.current[cacheKey];
        
        if (cachedEntry && now - cachedEntry.timestamp < CACHE_DURATION.COMMANDES) {
            console.log('📦 useCommandes - Returning cached data:', cacheKey);
            return cachedEntry.data;
        }
    
        try {
            setLoading(true);
            console.log('🌐 useCommandes - Making API call:', params);
            
            const processedParams = {
                page: params.page,
                page_size: params.page_size,
                code_projet: params.code_projet,
                numero_document: params.numero_document
            };
    
            const response = await commandesApi.getAll(processedParams);
            
            // Enhanced logging for quantite_livree
            console.log('📨 useCommandes - API response:', {
                count: response.count,
                resultsLength: response.results?.length,
                params: processedParams,
                // Add summary of quantite_livree
                deliveryStats: response.results?.reduce((acc, commande) => ({
                    total: acc.total + (commande.quantite_livree || 0),
                    itemsWithDelivery: acc.itemsWithDelivery + (commande.quantite_livree > 0 ? 1 : 0)
                }), { total: 0, itemsWithDelivery: 0 })
            });
    
            fetchCacheRef.current[cacheKey] = {
                data: response,
                timestamp: now
            };
    
            return response;
        } catch (error) {
            handleError(error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [handleError]);

    const getProjects = useCallback(async (): Promise<Project[]> => {
        const now = Date.now();
        const cachedProjects = projectsCacheRef.current;

        // Improved cache check with constant
        if (cachedProjects.data.length > 0 && 
            now - cachedProjects.timestamp < CACHE_DURATION.PROJECTS) {
            return cachedProjects.data;
        }

        try {
            setLoading(true);
            const projects = await commandesApi.getAllUniqueProjects();

            // Efficient unique project list creation
            const uniqueProjectsList = Array.from(
                new Map(projects.map(p => [p.code, p])).values()
            ).sort((a, b) => a.code.localeCompare(b.code));

            // Update projects cache
            projectsCacheRef.current = {
                data: uniqueProjectsList,
                timestamp: now
            };

            return uniqueProjectsList;
        } catch (error) {
            handleError(error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [handleError]);

    // Centralized method for cache-invalidating operations
    const runCacheInvalidatingOperation = useCallback(
        async <T>(
            operation: () => Promise<T>, 
            errorMessage: string
        ): Promise<T> => {
            try {
                setLoading(true);
                const result = await operation();
                invalidateAllCaches();
                return result;
            } catch (error) {
                handleError(error);
                throw new Error(errorMessage);
            } finally {
                setLoading(false);
            }
        }, 
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [handleError]
    );

    // Refactored operations using centralized method
    const importExcel = useCallback(
        (file: File) => runCacheInvalidatingOperation(
            () => commandesApi.importExcel(file),
            'Failed to import excel'
        ),
        [runCacheInvalidatingOperation]
    );

    const clearAllCommandes = useCallback(
        () => runCacheInvalidatingOperation(
            () => commandesApi.clearAll(),
            'Failed to clear commandes'
        ),
        [runCacheInvalidatingOperation]
    );

    const deleteProjectCommandes = useCallback(
        (project: string) => runCacheInvalidatingOperation(
            () => commandesApi.deleteProjectCommandes(project),
            'Failed to delete project commandes'
        ),
        [runCacheInvalidatingOperation]
    );

    const invalidateCache = useCallback((filters?: Partial<CommandeFilters>) => {
        const cacheKey = generateCacheKey(filters);
        delete fetchCacheRef.current[cacheKey];
        console.log('🗑️ useCommandes - Invalidated cache key:', cacheKey);
    }, []);
    
    const invalidateAllCaches = useCallback(() => {
        console.log('🗑️ useCommandes - Invalidating all caches');
        fetchCacheRef.current = {};
        projectsCacheRef.current = { data: [], timestamp: 0 };
    }, []);

    return {
        loading,
        error,
        fetchCommandes,
        getProjects,
        importExcel,
        clearAllCommandes,
        deleteProjectCommandes,
        invalidateCache,
        invalidateAllCaches
    };
};