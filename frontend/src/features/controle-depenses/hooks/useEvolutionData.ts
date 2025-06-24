import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useControle } from '@/hooks/useControle';
import { useFacturation } from '@/hooks/useFacturation';
import { format, parseISO, isValid } from 'date-fns';

interface MonthlyData {
    facturation: number;
    avancement: number;
    controle: number;
    depenses_facturees: number;
}

const DEFAULT_MONTHLY_DATA: MonthlyData = {
    facturation: 0,
    avancement: 0,
    controle: 0,
    depenses_facturees: 0
};

interface EvolutionDataOptions {
    onError?: (err: Error) => void;
}

export const useEvolutionData = (
    selectedProject: string, 
    options: EvolutionDataOptions = {}
) => {
    const { fetchEvolutionData: fetchControleEvolution } = useControle();
    const { fetchEvolutionData: fetchFacturationEvolution } = useFacturation();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    
    const [localEvolutionData, setLocalEvolutionData] = useState<{
        controle: Array<{
            date: string;
            controle: number;
            depenses_facturees: number;
        }> | null;
        facturation: Array<{
            date: string;
            total_after_discount: number;
        }> | null;
        avancement: Array<{
            date: string;
            total_payment: number;
        }> | null;
    } | null>(null);

    const normalizeDate = useCallback((dateStr: string): string => {
        try {
            const date = parseISO(dateStr);
            return isValid(date) ? format(date, 'yyyy-MM') : '';
        } catch {
            return '';
        }
    }, []);

    const fetchEvolutionData = useCallback(async () => {
        if (!selectedProject || isLoading) return;

        setIsLoading(true);
        setError(null);

        try {
            const [controleData, facturationData] = await Promise.all([
                fetchControleEvolution(selectedProject),
                fetchFacturationEvolution(selectedProject)
            ]);

            setLocalEvolutionData({
                controle: controleData?.controle || null,
                facturation: facturationData?.facturation || null,
                avancement: facturationData?.avancement || null
            });
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to fetch evolution data');
            setError(error);
            options.onError?.(error);
        } finally {
            setIsLoading(false);
        }
    }, [selectedProject, isLoading, fetchControleEvolution, fetchFacturationEvolution, options]);

    const processedMonthlyData = useMemo(() => {
        if (!localEvolutionData) return new Map<string, MonthlyData>();
    
        const monthlyData = new Map<string, MonthlyData>();
    
        // Create a set of all unique months
        const allMonths = new Set<string>();
        
        localEvolutionData.controle?.forEach(item => {
            allMonths.add(normalizeDate(item.date));
        });
        localEvolutionData.facturation?.forEach(item => {
            allMonths.add(normalizeDate(item.date));
        });
        localEvolutionData.avancement?.forEach(item => {
            allMonths.add(normalizeDate(item.date));
        });

        // Initialize all months with default values
        Array.from(allMonths).sort().forEach(month => {
            monthlyData.set(month, { ...DEFAULT_MONTHLY_DATA });
        });

        // Process controle data (already cumulative from backend)
        localEvolutionData.controle?.forEach(item => {
            const monthKey = normalizeDate(item.date);
            if (!monthKey) return;
            
            const currentData = monthlyData.get(monthKey) || { ...DEFAULT_MONTHLY_DATA };
            monthlyData.set(monthKey, {
                ...currentData,
                controle: item.controle,
                depenses_facturees: item.depenses_facturees
            });
        });

        // Process facturation data
        localEvolutionData.facturation?.forEach(item => {
            const monthKey = normalizeDate(item.date);
            if (!monthKey) return;
            
            const currentData = monthlyData.get(monthKey) || { ...DEFAULT_MONTHLY_DATA };
            monthlyData.set(monthKey, {
                ...currentData,
                facturation: item.total_after_discount
            });
        });

        // Process avancement data
        localEvolutionData.avancement?.forEach(item => {
            const monthKey = normalizeDate(item.date);
            if (!monthKey) return;
            
            const currentData = monthlyData.get(monthKey) || { ...DEFAULT_MONTHLY_DATA };
            monthlyData.set(monthKey, {
                ...currentData,
                avancement: item.total_payment
            });
        });
    
        return monthlyData;
    }, [localEvolutionData, normalizeDate]);

    const processedData = useMemo(() => {
        return Array.from(processedMonthlyData.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, data]) => ({
                date: `${month}-01`,
                facturation: data.facturation,
                avancement: data.avancement,
                controle: data.controle,
                depenses_facturees: data.depenses_facturees
            }));
    }, [processedMonthlyData]);

    const lastProjectRef = useRef<string | null>(null);

    useEffect(() => {
        if (selectedProject && selectedProject !== lastProjectRef.current) {
            fetchEvolutionData();
            lastProjectRef.current = selectedProject;
        }
    }, [selectedProject, fetchEvolutionData]);

    return {
        controleEvolutionData: {
            controle: processedData.map(({ date, controle, depenses_facturees }) => ({
                date,
                controle,
                depenses_facturees
            }))
        },
        facturationEvolutionData: {
            facturation: processedData.map(({ date, facturation }) => ({
                date,
                total_after_discount: facturation
            })),
            avancement: processedData.map(({ date, avancement }) => ({
                date,
                total_payment: avancement
            }))
        },
        isLoading,
        error,
        refetch: fetchEvolutionData
    };
};