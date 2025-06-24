/* eslint-disable react-hooks/exhaustive-deps */
// frontend/src/hooks/useControle.ts

import { useState, useCallback, useMemo } from 'react';
import { controleApi } from '../api/endpoints/controle';
import type {
    ControleMetrics,
    ControleUpdateInput,
    AggregatedControleMetrics,
    ControleGroupKey,
    FilterParams,
    ProjectType,
    DebugEntry
} from '@/types';

interface ControleEvolutionData {
    controle: Array<{
        date: string;
        depenses_facturees: number;
        //depenses_facturees_reel: number;
        controle: number; // depenses_engagees
        //controle_reel: number; // depenses_engagees_reel
    }>;
    project_type: ProjectType;
    project_name: string;
}

interface SummaryMetrics {
    totalDepensesEngagees: number;
    totalDepensesFacturees: number;
    averageRentabilite: number;
    totalCommandes: number;
}


export const useControle = (options: { 
    onError?: (err: Error) => DebugEntry 
} = {}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [rawData, setRawData] = useState<ControleMetrics[]>([]);
    const [filteredData, setFilteredData] = useState<ControleMetrics[]>([]);
    const [dataVersion, setDataVersion] = useState<number>(1);
    const [evolutionData, setEvolutionData] = useState<ControleEvolutionData | null>(null);

    // Aggregate data with proper type handling
    const aggregatedData = useMemo(() => {
        const aggregationMap: Record<ControleGroupKey, AggregatedControleMetrics> = {};
    
        filteredData.forEach(item => {
            const key = `${item.code_projet}-${item.numero_article}` as ControleGroupKey;
    
            if (!aggregationMap[key]) {
                aggregationMap[key] = {
                    ...item,
                    total_commandes: 1,
                    total_depenses_engagees: Number(item.depenses_engagees) || 0,
                    total_depenses_engagees_reel: Number(item.depenses_engagees_reel) || 0,
                    total_depenses_facturees: Number(item.depenses_facturees) || 0,
                    total_depenses_facturees_reel: Number(item.depenses_facturees_reel) || 0
                };
            } else {
                const current = aggregationMap[key];
                current.total_commandes++;
                current.total_depenses_engagees += Number(item.depenses_engagees) || 0;
                current.total_depenses_engagees_reel += Number(item.depenses_engagees_reel) || 0;
                current.total_depenses_facturees += Number(item.depenses_facturees) || 0;
                current.total_depenses_facturees_reel += Number(item.depenses_facturees_reel) || 0;
            }
        });
    
        return aggregationMap;
    }, [filteredData]);

    const controles = useMemo(() =>
        Object.values(aggregatedData),
        [aggregatedData]
    );

    const fetchControles = useCallback(async (filters?: FilterParams): Promise<ControleMetrics[]> => {
        if (loading) return [];

        setLoading(true);
        setError(null);

        try {
            const data = await controleApi.getMetrics({
                code_projet: filters?.code_projet,
                numero_article: filters?.numero_article,
                type_projet: filters?.type_projet
            });

            const processedData = data.map(item => ({
                ...item,
                prix_vente: item.prix_vente ?? 0,
                prix_vente_base: item.prix_vente_base ?? 0,
                budget_chef_projet: item.budget_chef_projet ?? 0,
                budget_chef_projet_base: item.budget_chef_projet_base ?? 0,
                reste_a_depenser: item.reste_a_depenser ?? 0,
                fiabilite: item.fiabilite || '',
                type_projet: item.type_projet || 'FORFAIT'
            }));

            setRawData(processedData);
            setFilteredData(processedData);

            return processedData;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch controles';
            setError(errorMessage);

            // Call onError if provided
            if (options.onError) {
                options.onError(new Error(errorMessage));
            }

            return [];
        } finally {
            setLoading(false);
        }
    }, [loading, dataVersion, options.onError]);

    const fetchEvolutionData = useCallback(async (codeProjet: string) => {
        
        if (loading) return null;

        setLoading(true);
        setError(null);

        try {
            const data = await controleApi.getEvolutionData(codeProjet);
            
            
            // Sort data by date before setting state
            const sortedData = {
                ...data,
                controle: [...data.controle].sort((a, b) => 
                    new Date(a.date).getTime() - new Date(b.date).getTime()
                )
                
            };

            console.log('Raw Controle sorted Evolution Data:', sortedData);

            setEvolutionData(sortedData);
            return sortedData;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch evolution data';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [loading]);

    const updateControle = useCallback(async (
        numeroArticle: string,
        data: Partial<ControleUpdateInput>
    ): Promise<ControleMetrics> => {
        if (loading) {
            return Promise.reject(new Error('Update in progress'));
        }

        setLoading(true);
        setError(null);

        try {
            const updatePayload: ControleUpdateInput = {
                numero_article: numeroArticle,
                ...(data.code_projet && { code_projet: data.code_projet }),
                ...(data.type_projet && { type_projet: data.type_projet }),
                ...(data.prix_vente !== undefined && { prix_vente: data.prix_vente }),
                ...(data.prix_vente_base !== undefined && { prix_vente_base: data.prix_vente_base }),
                ...(data.budget_chef_projet !== undefined && { budget_chef_projet: data.budget_chef_projet }),
                ...(data.budget_chef_projet_base !== undefined && { budget_chef_projet_base: data.budget_chef_projet_base }),
                ...(data.reste_a_depenser !== undefined && { reste_a_depenser: data.reste_a_depenser }),
                ...(data.fiabilite && { fiabilite: data.fiabilite })
            };

            const updatedControle = await controleApi.updateControl(updatePayload);

            setDataVersion(prev => prev + 1);

            await fetchControles({
                numero_article: numeroArticle,
                code_projet: updatedControle.code_projet
            });

            return updatedControle;
        } catch (err) {
            const errorMessage = err instanceof Error
                ? err.message
                : 'Failed to update controle';

            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchControles, loading]);

    const summaryMetrics: SummaryMetrics = useMemo(() => ({
        totalDepensesEngagees: controles.reduce(
            (sum, item) => sum + Number(item.total_depenses_engagees || 0),
            0
        ),
        totalDepensesEngagees_reel: controles.reduce(
            (sum, item) => sum + Number(item.total_depenses_engagees_reel || 0),
            0
        ),
        totalDepensesFacturees: controles.reduce(
            (sum, item) => sum + Number(item.total_depenses_facturees || 0),
            0
        ),
        totalDepensesFacturees_reel: controles.reduce(
            (sum, item) => sum + Number(item.total_depenses_facturees_reel || 0),
            0
        ),
        averageRentabilite: controles.length
            ? controles.reduce(
                (sum, item) => sum + Number(item.rentabilite || 0),
                0
            ) / controles.length
            : 0,
        averageRentabilite_reel: controles.length
            ? controles.reduce(
                (sum, item) => sum + Number(item.rentabilite_reel || 0),
                0
            ) / controles.length
            : 0,
        totalCommandes: controles.reduce(
            (sum, item) => sum + (item.total_commandes || 0),
            0
        )
    }), [controles]);

    return {
        controles,
        rawData,
        aggregatedData,
        summaryMetrics,
        loading,
        error,
        fetchControles,
        updateControle,
        forceRefresh: useCallback(() => setDataVersion(prev => prev + 1), []),
        evolutionData,
        fetchEvolutionData
    };
};