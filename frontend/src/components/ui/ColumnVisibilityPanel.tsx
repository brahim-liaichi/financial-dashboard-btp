// src/components/ui/ColumnVisibilityPanel.tsx
import { TableColumn } from '@/types';

interface ColumnVisibilityPanelProps<T extends Record<string, unknown>> {
    columns: TableColumn<T>[];
    visibleColumns: Set<string>;
    onColumnToggle: (columnKey: string) => void;
    onDeselectAll?: () => void; // Optional prop for complete deselection
}

export const ColumnVisibilityPanel = <T extends Record<string, unknown>>({
    columns,
    visibleColumns,
    onColumnToggle,
    onDeselectAll // Added optional deselect all handler
}: ColumnVisibilityPanelProps<T>): JSX.Element => {
    // Default implementation if no custom onDeselectAll is provided
    const handleDeselectAll = onDeselectAll || (() => {
        columns.forEach(column => {
            const columnKey = String(column.key);
            if (visibleColumns.has(columnKey)) {
                onColumnToggle(columnKey);
            }
        });
    });

    return (
        <div className="p-4 bg-white shadow rounded-lg">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Colonnes Visibles</h3>
                <button 
                    onClick={handleDeselectAll}
                    className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                    Deselectionner tous
                </button>
            </div>
            <div className="flex flex-wrap items-center gap-4">
                {columns.map(column => {
                    const columnKey = String(column.key);
                    return (
                        <div 
                            key={`visibility-${columnKey}`} 
                            className="flex items-center space-x-2"
                        >
                            <input
                                type="checkbox"
                                id={`column-${columnKey}`}
                                checked={visibleColumns.has(columnKey)}
                                onChange={() => onColumnToggle(columnKey)}
                                className="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            <label 
                                htmlFor={`column-${columnKey}`}
                                className="text-sm text-gray-700 cursor-pointer"
                                title={column.tooltip}
                            >
                                {column.title}
                            </label>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};