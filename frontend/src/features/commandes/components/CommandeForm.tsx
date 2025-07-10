// frontend/src/features/commandes/components/CommandeForm.tsx

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectOption } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/DatePicker';

interface Commande {
    id: number;
    numero_document: string;
    annule: string;
    statut_document: string;
    date_enregistrement: string;
    date_echeance: string;
    code_fournisseur: string;
    nom_fournisseur: string;
    numero_article: string;
    description_article: string;
    quantite: number;
    quantite_en_cours: number;
    prix: number;
    devise_prix: string;
    cours_change: number;
    total_lignes: number;
    code_projet: string;
}

interface CommandeFormProps {
    initialData?: Partial<Commande>;
    onSubmit: (data: Partial<Commande>) => void | Promise<void>;
    onCancel: () => void;
}

const STATUS_OPTIONS: SelectOption[] = [
    { value: 'O', label: 'Ouvert' },
    { value: 'C', label: 'Fermé' },
    { value: 'P', label: 'En cours' }
];

const CURRENCY_OPTIONS: SelectOption[] = [
    { value: 'MAD', label: 'MAD' },
    { value: 'EUR', label: 'EUR' },
    { value: 'USD', label: 'USD' }
];

const ANNULE_OPTIONS: SelectOption[] = [
    { value: 'N', label: 'Non' },
    { value: 'O', label: 'Oui' }
];

export const CommandeForm: React.FC<CommandeFormProps> = ({
    initialData,
    onSubmit,
    onCancel
}) => {
    const {
        register,
        handleSubmit,
        formState: { errors },
        control,
        setValue,
        watch
    } = useForm<Commande>({
        defaultValues: initialData ? {
            numero_document: String(initialData.numero_document || ''),
            annule: initialData.annule || 'N',
            statut_document: initialData.statut_document || 'O',
            date_enregistrement: initialData.date_enregistrement
                ? (() => {
                    try {
                        // Ensure we're using the date part only
                        const date = new Date(initialData.date_enregistrement);
                        const formattedDate = date.toISOString().split('T')[0];
                        return formattedDate;
                    } catch (error) {
                        console.error('Error formatting date_enregistrement:', error);
                        return '';
                    }
                })()
                : '',
            date_echeance: initialData.date_echeance
                ? (() => {
                    try {
                        // Ensure we're using the date part only
                        const date = new Date(initialData.date_echeance);
                        const formattedDate = date.toISOString().split('T')[0];
                        return formattedDate;
                    } catch (error) {
                        console.error('Error formatting date_echeance:', error);
                        return '';
                    }
                })()
                : '',
            code_fournisseur: initialData.code_fournisseur || '',
            nom_fournisseur: initialData.nom_fournisseur || '',
            numero_article: initialData.numero_article || '',
            description_article: initialData.description_article || '',
            quantite: Number(initialData.quantite) || 0,
            quantite_en_cours: Number(initialData.quantite_en_cours) || 0,
            prix: Number(initialData.prix) || 0,
            devise_prix: initialData.devise_prix || 'MAD',
            cours_change: Number(initialData.cours_change) || 1,
            total_lignes: Number(initialData.total_lignes) || 0,
            code_projet: initialData.code_projet || ''
        } : {
            numero_document: '',
            annule: 'N',
            statut_document: 'O',
            date_enregistrement: '',
            date_echeance: '',
            code_fournisseur: '',
            nom_fournisseur: '',
            numero_article: '',
            description_article: '',
            quantite: 0,
            quantite_en_cours: 0,
            prix: 0,
            devise_prix: 'MAD',
            cours_change: 1,
            total_lignes: 0,
            code_projet: ''
        }
    });

    // Update form when initialData changes
    React.useEffect(() => {
        if (initialData) {
            Object.entries(initialData).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    // Special handling for dates
                    if (key === 'date_enregistrement' || key === 'date_echeance') {
                        const formattedDate = value
                            ? new Date(value).toISOString().split('T')[0]
                            : '';
                        setValue(key as keyof Commande, formattedDate);
                    } else {
                        setValue(key as keyof Commande, value);
                    }
                }
            });
        }
    }, [initialData, setValue]);

    // Watch values for calculations
    const quantite = watch('quantite');
    const prix = watch('prix');

    // Update total when quantity or price changes
    React.useEffect(() => {
        if (quantite && prix) {
            setValue('total_lignes', quantite * prix);
        }
    }, [quantite, prix, setValue]);

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Document Info */}
                <Input
                    label="Numéro de document"
                    type="text"
                    {...register('numero_document', {
                        required: 'Ce champ est requis'
                    })}
                    error={errors.numero_document?.message}
                />

                <Controller
                    name="annule"
                    control={control}
                    rules={{ required: 'Ce champ est requis' }}
                    render={({ field }) => (
                        <Select
                            label="Annulé"
                            options={ANNULE_OPTIONS}
                            value={field.value}
                            onChange={(value) => field.onChange(value)}
                            error={errors.annule?.message}
                        />
                    )}
                />

                <Controller
                    name="statut_document"
                    control={control}
                    rules={{ required: 'Ce champ est requis' }}
                    render={({ field }) => (
                        <Select
                            label="Statut"
                            options={STATUS_OPTIONS}
                            value={field.value}
                            onChange={(value) => field.onChange(value)}
                            error={errors.statut_document?.message}
                        />
                    )}
                />

                <Controller
                    name="date_enregistrement"
                    control={control}
                    rules={{ required: 'Ce champ est requis' }}
                    render={({ field }) => (
                        <DatePicker
                            label="Date d'enregistrement"
                            value={field.value}
                            onChange={(date) => field.onChange(date)}
                            error={errors.date_enregistrement?.message}
                        />
                    )}
                />

                <Controller
                    name="date_echeance"
                    control={control}
                    rules={{
                        required: 'Ce champ est requis',
                        validate: (value) => {
                            const startDate = watch('date_enregistrement');
                            return new Date(value) >= new Date(startDate) ||
                                'La date d\'échéance doit être après la date d\'enregistrement';
                        }
                    }}
                    render={({ field }) => (
                        <DatePicker
                            label="Date d'échéance"
                            value={field.value}
                            onChange={(date) => field.onChange(date)}
                            error={errors.date_echeance?.message}
                            min={watch('date_enregistrement')}
                        />
                    )}
                />

                {/* Supplier Info */}
                <Input
                    label="Code fournisseur"
                    {...register('code_fournisseur', {
                        required: 'Ce champ est requis'
                    })}
                    error={errors.code_fournisseur?.message}
                />

                <Input
                    label="Nom fournisseur"
                    {...register('nom_fournisseur', {
                        required: 'Ce champ est requis'
                    })}
                    error={errors.nom_fournisseur?.message}
                />

                {/* Article Info */}
                <Input
                    label="Numéro d'article"
                    {...register('numero_article', {
                        required: 'Ce champ est requis'
                    })}
                    error={errors.numero_article?.message}
                />

                <Input
                    label="Description article/service"
                    {...register('description_article', {
                        required: 'Ce champ est requis'
                    })}
                    error={errors.description_article?.message}
                />

                {/* Quantities and Prices */}
                <Input
                    label="Quantité"
                    type="number"
                    step="0.01"
                    {...register('quantite', {
                        required: 'Ce champ est requis',
                        valueAsNumber: true,
                        min: { value: 0, message: 'La quantité doit être positive' }
                    })}
                    error={errors.quantite?.message}
                />

                <Input
                    label="Quantité en cours"
                    type="number"
                    step="0.01"
                    {...register('quantite_en_cours', {
                        required: 'Ce champ est requis',
                        valueAsNumber: true,
                        min: { value: 0, message: 'La quantité doit être positive' },
                        validate: (value) =>
                            value <= watch('quantite') ||
                            'Ne peut pas dépasser la quantité totale'
                    })}
                    error={errors.quantite_en_cours?.message}
                />

                <Input
                    label="Prix"
                    type="number"
                    step="0.01"
                    {...register('prix', {
                        required: 'Ce champ est requis',
                        valueAsNumber: true,
                        min: { value: 0, message: 'Le prix doit être positif' }
                    })}
                    error={errors.prix?.message}
                />

                <Controller
                    name="devise_prix"
                    control={control}
                    rules={{ required: 'Ce champ est requis' }}
                    render={({ field }) => (
                        <Select
                            label="Devise"
                            options={CURRENCY_OPTIONS}
                            value={field.value}
                            onChange={(value) => field.onChange(value)}
                            error={errors.devise_prix?.message}
                        />
                    )}
                />

                <Input
                    label="Cours de change"
                    type="number"
                    step="0.0001"
                    {...register('cours_change', {
                        required: 'Ce champ est requis',
                        valueAsNumber: true,
                        min: { value: 0, message: 'Le cours de change doit être positif' }
                    })}
                    error={errors.cours_change?.message}
                />

                <Input
                    label="Total des lignes"
                    type="number"
                    step="0.01"
                    {...register('total_lignes')}
                    disabled
                />

                <Input
                    label="Code projet"
                    {...register('code_projet', {
                        required: 'Ce champ est requis'
                    })}
                    error={errors.code_projet?.message}
                />
            </div>

            <div className="flex justify-end space-x-4 pt-4">
                <Button
                    variant="secondary"
                    onClick={onCancel}
                    type="button"
                >
                    Annuler
                </Button>
                <Button
                    variant="primary"
                    type="submit"
                >
                    {initialData ? 'Modifier' : 'Créer'} la commande
                </Button>
            </div>
        </form>
    );
};