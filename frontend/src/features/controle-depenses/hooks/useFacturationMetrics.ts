// Path: src/features/controle-depenses/hooks/useFacturationMetrics.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { useFacturation } from '@/hooks/useFacturation';
import type { FacturationMetrics } from '@/types';

// Helper function to ensure numeric values
const normalizeMetrics = (metrics: FacturationMetrics | null): FacturationMetrics | null => {
    if (!metrics) return null;
    
    return {
        facturation_total: Number(metrics.facturation_total) || 0,
        avancement_total: Number(metrics.avancement_total) || 0
    };
};


export const useFacturationMetrics = (selectedProject: string) => {
    const { metrics: cachedFacturationMetrics, fetchMetrics } = useFacturation();

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [localMetrics, setLocalMetrics] = useState<FacturationMetrics | null>(null);
    const lastProjectRef = useRef<string | null>(null);

    const fetchProjectMetrics = useCallback(async () => {
        if (!selectedProject) {
            setLocalMetrics(null);
            return;
        }

        if (isLoading) return;

        setIsLoading(true);
        setError(null);

        try {
            const metrics = await fetchMetrics(selectedProject);
            
            // Normalize and validate metrics before setting state
            const normalizedMetrics = normalizeMetrics(metrics);

            setLocalMetrics((prev: FacturationMetrics | null) => 
                JSON.stringify(prev) !== JSON.stringify(normalizedMetrics) 
                    ? normalizedMetrics 
                    : prev
            );
        } catch (err) {
            const processedError = err instanceof Error 
                ? err 
                : new Error('Failed to fetch facturation metrics');

            setError(processedError);
        } finally {
            setIsLoading(false);
        }
    }, [selectedProject, fetchMetrics, isLoading]);

    useEffect(() => {
        if (selectedProject && selectedProject !== lastProjectRef.current) {
            fetchProjectMetrics();
            lastProjectRef.current = selectedProject;
        }
    }, [selectedProject, fetchProjectMetrics]);

    return {
        facturationMetrics: normalizeMetrics(localMetrics ?? cachedFacturationMetrics),
        isLoading,
        error,
        refetch: fetchProjectMetrics
    };
};