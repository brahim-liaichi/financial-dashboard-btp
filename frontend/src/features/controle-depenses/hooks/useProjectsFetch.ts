// Path: src/features/controle-depenses/hooks/useProjectsFetch.ts
import { ControleMetrics, DebugEntry } from '@/types';
import { useState, useCallback, useEffect, useRef } from 'react';

export const useProjectsFetch = (
// eslint-disable-next-line @typescript-eslint/no-unused-vars
fetchControles: (filters?: { code_projet?: string; }) => Promise<ControleMetrics[]>, _p0: { onError: (err: Error) => DebugEntry; }) => {
    const [projects, setProjects] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const isInitialFetchDone = useRef(false);
    const lastFetchedProjects = useRef<string[]>([]);

    const fetchProjectsData = useCallback(async (forceRefresh = false): Promise<void> => {
        // Allow forced refresh or first-time fetch
        if (!forceRefresh && isInitialFetchDone.current) return;

        try {
            setIsLoading(true);
            setError(null);

            // Pass an empty filter to get all projects
            const data = await fetchControles({});

            const uniqueProjects = Array.from(
                new Set(
                    data
                        .map(item => item.code_projet)
                        .filter(Boolean)
                )
            );

            // More robust comparison of project lists
            const projectsChanged = 
                uniqueProjects.length !== lastFetchedProjects.current.length ||
                !uniqueProjects.every((proj, index) => proj === lastFetchedProjects.current[index]);

            if (projectsChanged) {
                setProjects(uniqueProjects);
                lastFetchedProjects.current = uniqueProjects;
            }

            isInitialFetchDone.current = true;
        } catch (err) {
            const processedError = err instanceof Error 
                ? err 
                : new Error('Failed to fetch projects');

            console.error('Projects Fetch Error:', processedError);
            setError(processedError);
        } finally {
            setIsLoading(false);
        }
    }, [fetchControles]);

    useEffect(() => {
        // Only fetch if not already done
        if (!isInitialFetchDone.current) {
            fetchProjectsData();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty dependency array ensures it runs only once on mount

    return {
        projects,
        isLoading,
        error,
        refetchProjects: () => fetchProjectsData(true)
    };
};