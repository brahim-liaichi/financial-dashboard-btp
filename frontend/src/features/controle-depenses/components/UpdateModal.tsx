import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { ControleMetrics, ControleUpdateInput, ProjectType } from '@/types';
import { logger } from '@/utils/logger';

interface UpdateModalProps {
    isOpen: boolean;
    selectedItem: ControleMetrics | null;
    onClose: () => void;
    onUpdate: (data: ControleUpdateInput) => Promise<ControleMetrics | null | void>;
}

interface FormState extends Required<ControleUpdateInput> {
    numero_article: string;
    code_projet: string;
    type_projet: ProjectType;
    prix_vente: number | null;
    prix_vente_base: number | null;
    budget_chef_projet: number | null;
    budget_chef_projet_base: number | null;
    reste_a_depenser: number | null;
    fiabilite: 'E' | 'C' | 'M' | null;
}

const mapFiabiliteDisplay = (code: string | null): 'E' | 'C' | 'M' | null => {
    switch (code?.toUpperCase()) {
        case 'CHIFFRÉ':
        case 'CHIFFRE':
        case 'C':
            return 'C';
        case 'ESTIMÉ':
        case 'ESTIME':
        case 'E':
            return 'E';
        case 'MARCHÉ':
        case 'MARCHE':
        case 'M':
            return 'M';
        default:
            return null;
    }
};

export const UpdateModal: React.FC<UpdateModalProps> = ({
    isOpen,
    selectedItem,
    onClose,
    onUpdate
}) => {
    const [localFormValues, setLocalFormValues] = useState<FormState>({} as FormState);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (selectedItem) {
            const initialValues: FormState = {
                numero_article: selectedItem.numero_article,
                code_projet: selectedItem.code_projet,
                type_projet: selectedItem.type_projet,
                prix_vente: selectedItem.prix_vente ? Number(selectedItem.prix_vente) : null,
                prix_vente_base: selectedItem.prix_vente_base ? Number(selectedItem.prix_vente_base) : null,
                budget_chef_projet: selectedItem.budget_chef_projet ? Number(selectedItem.budget_chef_projet) : null,
                budget_chef_projet_base: selectedItem.budget_chef_projet_base ? Number(selectedItem.budget_chef_projet_base) : null,
                reste_a_depenser: selectedItem.reste_a_depenser ? Number(selectedItem.reste_a_depenser) : null,
                fiabilite: mapFiabiliteDisplay(selectedItem.fiabilite)
            };
            setLocalFormValues(initialValues);
            logger.info('Initialized form values', { initialValues });
        }
    }, [selectedItem]);

    const handleFormChange = (field: keyof FormState, value: string | number | null) => {
        setLocalFormValues(prev => {
            const newValues = { ...prev };

            switch (field) {
                case 'prix_vente':
                case 'prix_vente_base':
                case 'budget_chef_projet':
                case 'budget_chef_projet_base':
                case 'reste_a_depenser':
                    newValues[field] = value === '' || value === null ? null : Number(value);
                    break;
                case 'fiabilite':
                    newValues.fiabilite = mapFiabiliteDisplay(value as string);
                    break;
                default:
                    newValues[field] = value as never;
            }

            return newValues;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItem || isSubmitting) return;

        setIsSubmitting(true);
        try {
            logger.info('Submitting update', { values: localFormValues });

            const updateData: ControleUpdateInput = {
                numero_article: selectedItem.numero_article,
                code_projet: selectedItem.code_projet,
                type_projet: selectedItem.type_projet,
                prix_vente: localFormValues.prix_vente,
                budget_chef_projet: localFormValues.budget_chef_projet,
                reste_a_depenser: localFormValues.reste_a_depenser,
                fiabilite: localFormValues.fiabilite
            };

            if (selectedItem.type_projet === 'METRE') {
                updateData.prix_vente_base = localFormValues.prix_vente_base;
                updateData.budget_chef_projet_base = localFormValues.budget_chef_projet_base;
            }

            const result = await onUpdate(updateData);
            logger.info('Update successful', { result });
            onClose();
        } catch (error) {
            logger.error('Update failed', { error });
        } finally {
            setIsSubmitting(false);
        }
    };

    const isMetreType = localFormValues.type_projet === 'METRE';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Modifier le Contrôle"
        >
            <form onSubmit={handleSubmit} className="w-full max-w-lg mx-auto">
                <div className="space-y-4">
                    {/* Prix de Vente */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Prix de Vente de Base
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            value={localFormValues.prix_vente ?? ''}
                            onChange={(e) => handleFormChange('prix_vente', e.target.value)}
                        />
                    </div>

                    {/* Prix de Vente Base (Métré only) */}
                    {isMetreType && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Prix de Vente d'Arretissage
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                value={localFormValues.prix_vente_base ?? ''}
                                onChange={(e) => handleFormChange('prix_vente_base', e.target.value)}
                            />
                        </div>
                    )}

                    {/* Budget Chef Projet */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Budget Chef Projet de Base
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            value={localFormValues.budget_chef_projet ?? ''}
                            onChange={(e) => handleFormChange('budget_chef_projet', e.target.value)}
                        />
                    </div>

                    {/* Budget Chef Projet Base (Métré only) */}
                    {isMetreType && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Budget Chef Projet d'Aterrissage
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                value={localFormValues.budget_chef_projet_base ?? ''}
                                onChange={(e) => handleFormChange('budget_chef_projet_base', e.target.value)}
                            />
                        </div>
                    )}
                    {/* Reste à Dépenser */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Reste à Dépenser
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            value={localFormValues.reste_a_depenser ?? ''}
                            onChange={(e) => handleFormChange('reste_a_depenser', e.target.value)}
                        />
                    </div>

                    {/* Fiabilité */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Fiabilité
                        </label>
                        <select
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            value={localFormValues.fiabilite || ''}
                            onChange={(e) => {
                                const value = e.target.value;
                                const fiabiliteValue = value === 'E' || value === 'C' ? value : null;
                                handleFormChange('fiabilite', fiabiliteValue);
                            }}
                        >
                            <option value="">Sélectionner fiabilité</option>
                            <option value="E">Estimé</option>
                            <option value="C">Chiffré</option>
                        </select>
                    </div>

                    {/* Buttons */}
                    <div className="mt-6 flex justify-end space-x-3">
                        <button
                            type="button"
                            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                    </div>
                </div>
            </form>
        </Modal>
    );
};