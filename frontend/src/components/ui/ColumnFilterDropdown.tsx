// src/components/ui/ColumnFilterDropdown.tsx

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import type { ColumnFilter, ComparisonOperator, StringFilter, NumericFilter, SelectFilter } from '@/types';

interface ColumnFilterDropdownProps {
    filter: ColumnFilter;
    onFilterChange: (filter: ColumnFilter) => void;
    onClose: () => void;
}

export const ColumnFilterDropdown: React.FC<ColumnFilterDropdownProps> = ({
    filter,
    onFilterChange,
    onClose
}) => {
    console.log('Initial Filter:', filter);

    // Local state to handle input value
    const [localValue, setLocalValue] = useState(
        filter.type === 'string' ? filter.value : 
        filter.type === 'select' ? filter.value ?? '' :
        filter.value?.toString() ?? ''
    );

    // Local state for operator to track changes independently
    const [localOperator, setLocalOperator] = useState<ComparisonOperator>(
        filter.type === 'numeric' ? (filter as NumericFilter).operator : '>='
    );

    // Track the current filter to avoid unnecessary resets
    const [currentFilter, setCurrentFilter] = useState(filter);

    // Track the original filter to use when cancelling
    const [originalFilter, setOriginalFilter] = useState(filter);

    // Reset local states when filter changes
    useEffect(() => {
        console.log('Current Filter:', filter);
        console.log('Current Filter Type:', filter.type);

        // Only update if the filter is materially different
        if (
            filter.type !== currentFilter.type || 
            (filter.type === 'numeric' && 
                ((filter as NumericFilter).value !== (currentFilter as NumericFilter)?.value)
            )
        ) {
            const newLocalValue = filter.type === 'string' ? filter.value : 
                filter.type === 'select' ? filter.value ?? '' :
                filter.value?.toString() ?? '';

            console.log('Updating Local Value:', {
                newLocalValue,
                filterValue: filter.value,
                filterType: filter.type
            });

            setLocalValue(newLocalValue);

            if (filter.type === 'numeric') {
                const numericFilter = filter as NumericFilter;
                console.log('Updating Numeric Operator:', numericFilter.operator);
                setLocalOperator(numericFilter.operator);
            }

            // Update the current filter
            setCurrentFilter(filter);
        }

        // Always update original filter
        setOriginalFilter(filter);
    }, [currentFilter, filter]);

    const renderNumericFilter = (filter: NumericFilter) => {
        const operators: ComparisonOperator[] = ['<', '<=', '=', '>=', '>', '!='];
        
        return (
            <div className="space-y-2">
                <Select
                    value={localOperator}
                    onChange={(value) => {
                        const newOperator = value as ComparisonOperator;
                        console.log('Operator Changed:', {
                            oldOperator: localOperator,
                            newOperator,
                            currentFilter: filter
                        });
                        setLocalOperator(newOperator);
                        onFilterChange({
                            ...filter,
                            operator: newOperator,
                            value: localValue ? Number(localValue) : null
                        });
                    }}
                    options={operators.map(op => ({ value: op, label: op }))}
                />
                <Input
                    type="number"
                    value={localValue}
                    onChange={(e) => {
                        const newValue = e.target.value;
                        console.log('Numeric Input Changed:', {
                            oldValue: localValue,
                            newValue,
                            parsedValue: newValue ? Number(newValue) : null,
                            currentFilter: filter
                        });
                        setLocalValue(newValue);
                        onFilterChange({
                            ...filter,
                            value: newValue ? Number(newValue) : null,
                            operator: localOperator
                        });
                    }}
                    placeholder="Enter value"
                />
            </div>
        );
    };

    const renderStringFilter = (filter: StringFilter) => {
        return (
            <Input
                type="text"
                value={localValue}
                onChange={(e) => {
                    const newValue = e.target.value;
                    console.log('String Input Changed:', {
                        oldValue: localValue,
                        newValue,
                        currentFilter: filter
                    });
                    setLocalValue(newValue);
                    onFilterChange({
                        ...filter,
                        value: newValue
                    });
                }}
                placeholder="Search..."
                className="w-full"
            />
        );
    };

    const renderSelectFilter = (filter: SelectFilter) => {
        const allOptions = [{ value: '', label: 'Tous' }, ...filter.options.map(opt => ({ 
            value: opt, 
            label: opt 
        }))];

        return (
            <Select
                value={localValue}
                onChange={(value) => {
                    console.log('Select Changed:', {
                        oldValue: localValue,
                        newValue: value,
                        currentFilter: filter
                    });
                    setLocalValue(value);
                    onFilterChange({
                        ...filter,
                        value: value || null
                    });
                }}
                options={allOptions}
            />
        );
    };

    const handleCancel = () => {
        // Revert to the original filter when cancelling
        console.log('Cancelling with original filter:', originalFilter);
        onFilterChange(originalFilter);
        onClose();
    };

    return (
        <div className="absolute top-full right-0 mt-1 bg-white rounded-md shadow-lg p-3 z-50 min-w-[200px]">
            <div className="space-y-3">
                {filter.type === 'numeric' && renderNumericFilter(filter as NumericFilter)}
                {filter.type === 'string' && renderStringFilter(filter as StringFilter)}
                {filter.type === 'select' && renderSelectFilter(filter as SelectFilter)}
                
                <div className="flex justify-end space-x-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleCancel}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                            console.log('Clear Filter Clicked:', filter);
                            setLocalValue('');
                            const clearFilter = {
                                ...filter,
                                value: filter.type === 'numeric' ? null : 
                                       filter.type === 'select' ? null : '',
                                ...(filter.type === 'numeric' ? { operator: '>=' } : {})
                            } as ColumnFilter;
                            onFilterChange(clearFilter);
                            onClose();
                        }}
                    >
                        Clear
                    </Button>
                </div>
            </div>
        </div>
    );
};