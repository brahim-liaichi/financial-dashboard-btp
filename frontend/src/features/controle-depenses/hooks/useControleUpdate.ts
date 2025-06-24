import { useState, useCallback, useRef } from 'react';
import type { ControleMetrics, ControleUpdateInput } from '@/types';
import { logger } from '@/utils/logger';

// Helper function to convert fiabilite display to code
const mapFiabiliteToCode = (value: string | null): 'E' | 'C' | 'M' | null => {
    if (!value) return null;
    
    // Normalize the input by removing spaces and accents
    const normalizedValue = value.trim().toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    switch (normalizedValue) {
        case 'chiffre':
        case 'c':
            return 'C';
        case 'estime':
        case 'e':
            return 'E';
        case 'marche':
        case 'm':
            return 'M';
        default:
            return null;
    }
};

export const useControleUpdate = (
    updateControle: (numeroArticle: string, data: Partial<ControleUpdateInput>) => Promise<ControleMetrics>,
    fetchProjectsData: () => Promise<void>,
    onUpdateSuccess?: () => void
) => {
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateError, setUpdateError] = useState<Error | null>(null);
    const currentUpdatePromise = useRef<Promise<ControleMetrics | null> | null>(null);

    const handleUpdate = useCallback(async (
        selectedItem: ControleMetrics | null,
        data: Partial<ControleUpdateInput>
    ): Promise<ControleMetrics | null> => {
        if (!selectedItem?.numero_article) {
            logger.warn('No item selected for update');
            return null;
        }

        if (isUpdating) {
            logger.warn('Update already in progress');
            return null;
        }

        logger.info('Starting update process', {
            selectedItem,
            updateData: data
        });

        const updatePromise = (async () => {
            try {
                setIsUpdating(true);
                setUpdateError(null);

                // Prepare base update data with explicit type handling
                const updateData: ControleUpdateInput = {
                    numero_article: selectedItem.numero_article,
                    code_projet: selectedItem.code_projet,
                    type_projet: data.type_projet || selectedItem.type_projet,
                    prix_vente: typeof data.prix_vente === 'number' ? data.prix_vente : selectedItem.prix_vente,
                    budget_chef_projet: typeof data.budget_chef_projet === 'number' ? data.budget_chef_projet : selectedItem.budget_chef_projet,
                    reste_a_depenser: typeof data.reste_a_depenser === 'number' ? data.reste_a_depenser : selectedItem.reste_a_depenser,
                    fiabilite: data.fiabilite !== undefined 
                        ? mapFiabiliteToCode(data.fiabilite)
                        : mapFiabiliteToCode(selectedItem.fiabilite)
                };

                logger.info('Prepared update data', { updateData });

                // Handle Métré project specific fields
                if (updateData.type_projet === 'METRE') {
                    updateData.prix_vente_base = typeof data.prix_vente_base === 'number' 
                        ? data.prix_vente_base 
                        : selectedItem.prix_vente_base;
                    updateData.budget_chef_projet_base = typeof data.budget_chef_projet_base === 'number'
                        ? data.budget_chef_projet_base
                        : selectedItem.budget_chef_projet_base;
                }

                const updatedControle = await updateControle(selectedItem.numero_article, updateData);
                logger.info('Update successful', { updatedControle });

                // Ensure data refresh
                await fetchProjectsData();
                
                // Notify success
                onUpdateSuccess?.();

                return updatedControle;
            } catch (error) {
                const processedError = error instanceof Error
                    ? error
                    : new Error('Update failed');

                logger.error('Update failed', { error: processedError });
                setUpdateError(processedError);
                throw processedError;
            } finally {
                setIsUpdating(false);
            }
        })();

        currentUpdatePromise.current = updatePromise;
        return updatePromise;
    }, [updateControle, fetchProjectsData, isUpdating, onUpdateSuccess]);

    const reset = useCallback(() => {
        setUpdateError(null);
        setIsUpdating(false);
    }, []);

    return {
        handleUpdate,
        isUpdating,
        updateError,
        reset
    };
};