import React, { useCallback, useMemo } from 'react';
import { Search } from 'lucide-react';
import { debounce } from 'lodash';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

// Define props interface using our new filter state type
interface CommandeFiltersProps {
    filters: {
        numero_document?: string;
        page?: number;
        page_size?: number;
    };
    onFilterChange: (filters: Partial<{
        numero_document?: string;
    }>) => void;
    onReset: () => void;
}

const CommandeFilters: React.FC<CommandeFiltersProps> = ({
    filters,
    onFilterChange,
    onReset
}) => {
    // Debounced filter change to prevent rapid updates
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedFilterChange = useCallback(
        debounce((key: 'numero_document', value: string | undefined) => {
            onFilterChange({ [key]: value });
        }, 300),
        [onFilterChange]
    );

    // Handler for document number change
    const handleDocumentNumberChange = useCallback((value: string) => {
        debouncedFilterChange('numero_document', value || undefined);
    }, [debouncedFilterChange]);

    // Reset handler
    const handleReset = useCallback(() => {
        onReset();
    }, [onReset]);

    // Memoized active filters check
    const hasActiveFilters = useMemo(() => 
        Boolean(filters.numero_document), 
        [filters.numero_document]
    );

    return (
        <div className="bg-white shadow rounded-lg w-full">
            <div className="p-4 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900">Filtres</h3>
            </div>

            <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 gap-4 items-end">
                    <Input
                        label="N° Document"
                        value={filters.numero_document || ''}
                        onChange={(e) => handleDocumentNumberChange(e.target.value)}
                        icon={Search}
                        placeholder="Rechercher par numéro de document..."
                        className="w-full"
                    />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                    <Button
                        variant="secondary"
                        onClick={handleReset}
                        disabled={!hasActiveFilters}
                    >
                        Réinitialiser
                    </Button>
                </div>
            </div>
        </div>
    );
};

export { CommandeFilters };