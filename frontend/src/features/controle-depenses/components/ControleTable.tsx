// src/features/controle-depenses/components/ControleTable.tsx (Part 1)
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table } from '@/components/ui/Table';
import { formatCurrency } from '@/utils/formatters';
import {
    ControleMetrics,
    FilterConfig,
    SortConfig,
    TableColumn
} from '@/types';
import { Eye, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ColumnVisibilityPanel } from '@/components/ui/ColumnVisibilityPanel';

interface ControleTableProps {
    data: ControleMetrics[];
    loading: boolean;
    selectedItem?: ControleMetrics | null;
    onEdit?: (controle: ControleMetrics) => void;
    selectedProject?: string;
    selectedProjectType?: 'FORFAIT' | 'METRE' | '';
    showSingleRow?: boolean;
    onResetView?: () => void;
}

export const ControleTable: React.FC<ControleTableProps> = ({
    data,
    loading,
    selectedItem,
    onEdit,
    selectedProject,
    selectedProjectType,
}): JSX.Element => {
    const [showingUpdated, setShowingUpdated] = useState(false);
    const navigate = useNavigate();

    const [sortConfig, setSortConfig] = useState<SortConfig>({
        key: 'prix_vente',
        direction: 'desc'
    });

    const [filterConfig, setFilterConfig] = useState<FilterConfig>({});

    // Add column visibility state
    const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set());

    // Add column visibility handler
const handleColumnToggle = (columnKey: string) => {
    setVisibleColumns(prev => {
        const newSet = new Set(prev);
        if (newSet.has(columnKey)) {
            newSet.delete(columnKey);
        } else {
            newSet.add(columnKey);
        }
        return newSet;
    });
};

// NEW: Add deselect all handler right after handleColumnToggle
const handleDeselectAllColumns = () => {
    setVisibleColumns(new Set()); // Clear all columns
};

    useEffect(() => {
        if (selectedProject || selectedProjectType) {
            setShowingUpdated(false);
        }
    }, [selectedProject, selectedProjectType]);

    useEffect(() => {
        if (!selectedItem) {
            setShowingUpdated(false);
        }
    }, [selectedItem]);

    const columns = useMemo(() => {
        // Base columns that are always present
        const baseColumns: TableColumn<ControleMetrics>[] = [
            {
                key: 'code_projet',
                title: 'Projet',
                width: '7%'
            },
            {
                key: 'numero_article',
                title: 'Article',
                width: '15%',
                filter: {
                    type: 'string',
                    value: ''
                }
            },
            {
                key: 'type_projet',
                title: 'Type',
                width: '7%',
                render: (row: ControleMetrics): JSX.Element => {
                    const typeMap: Record<string, { color: string; label: string }> = {
                        'FORFAIT': { color: 'bg-blue-600 text-white', label: 'Forfait' },
                        'METRE': { color: 'bg-green-600 text-white', label: 'Métré' }
                    };

                    const { color, label } = typeMap[row.type_projet] || { color: 'bg-gray-600 text-white', label: 'N/A' };

                    return (
                        <span
                            className={`px-1 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${color}`}
                            title={`Type de projet: ${label}`}
                        >
                            {label}
                        </span>
                    );
                },
                filter: {
                    type: 'select',
                    value: null,
                    options: ['FORFAIT', 'METRE']
                }
            },
            {
                key: 'prix_vente',
                title: 'Prix de Vente Base',
                width: '10%',
                render: (row: ControleMetrics): string =>
                    formatCurrency(row.prix_vente ?? 0),
                tooltip: 'Prix de vente de base défini pour l\'article',
                sortable: true,
                filter: {
                    type: 'numeric',
                    operator: '>=',
                    value: null
                }
            }
        ];

        // Check if there are any METRE projects
        const hasMETREProjects = data.some(item => item.type_projet === 'METRE');

        // Conditionally add base price column if METRE projects exist
        if (hasMETREProjects) {
            baseColumns.push(
                {
                    key: 'prix_vente_base',
                    title: 'Prix de Vente Atterissage',
                    width: '10%',
                    render: (row: ControleMetrics): string =>
                        row.type_projet === 'METRE'
                            ? formatCurrency(row.prix_vente_base ?? 0)
                            : '-',
                    tooltip: 'Prix de vente d\'atterissage pour les projets Maître',
                    sortable: true,
                    filter: {
                        type: 'numeric',
                        operator: '>=',
                        value: null
                    }
                },
                {
                    key: 'rapport_atterrissage',
                    title: 'Rapport Atterrissage',
                    width: '8%',
                    render: (row: ControleMetrics): JSX.Element | string => {
                        // Only show for METRE projects
                        if (row.type_projet !== 'METRE') return '-';

                        const value = Number(row.rapport_atterrissage ?? 0);
                        return (
                            <span
                                className={`
                            px-1 py-0.5 rounded-full text-xs font-medium whitespace-nowrap
                            ${value >= 1
                                        ? 'bg-red-600 text-white'
                                        : value >= 0.8
                                            ? 'bg-orange-600 text-white'
                                            : 'bg-green-600 text-white'
                                    }
                        `}
                                title="Rapport Atterrissage (Budget / Prix de Vente)"
                            >
                                {Number.isFinite(value) ? value.toFixed(2) : '0.00'}
                            </span>
                        );
                    },
                    tooltip: 'Rapport Budget/Prix de Vente pour projets Maître',
                    sortable: true,
                    filter: {
                        type: 'numeric',
                        operator: '>=',
                        value: null
                    }
                }
            );
        }

        // Continue adding remaining columns
        baseColumns.push(
            {
                key: 'rapport',
                title: 'Rapport',
                width: '8%',
                render: (row: ControleMetrics): JSX.Element => {
                    const value = Number(row.rapport ?? 0);
                    return (
                        <span
                            className={`
                            px-1 py-0.5 rounded-full text-xs font-medium whitespace-nowrap
                            ${value >= 1
                                    ? 'bg-red-600 text-white'
                                    : value >= 0.8
                                        ? 'bg-orange-600 text-white'
                                        : 'bg-green-600 text-white'
                                }
                        `}
                            title="Rapport (Budget Chef Projet / Prix de Vente)"
                        >
                            {Number.isFinite(value) ? value.toFixed(2) : '0.00'}
                        </span>
                    );
                },
                tooltip: 'Rapport entre Budget Chef Projet et Prix de Vente',
                sortable: true,
                filter: {
                    type: 'numeric',
                    operator: '>=',
                    value: null
                }
            },

            {
                key: 'budget_chef_projet',
                title: 'Budget Chef de Projet Base',
                width: '10%',
                render: (row: ControleMetrics): string =>
                    formatCurrency(row.budget_chef_projet ?? 0),
                tooltip: 'Budget alloué par le chef de projet',
                sortable: true,
                filter: {
                    type: 'numeric',
                    operator: '>=',
                    value: null
                }
            }
        );

        // Conditionally add base budget column if METRE projects exist
        if (hasMETREProjects) {
            baseColumns.push(
                {
                    key: 'budget_chef_projet_base',
                    title: 'Budget Chef de Projet Atterrissage',
                    width: '10%',
                    render: (row: ControleMetrics): string =>
                        row.type_projet === 'METRE'
                            ? formatCurrency(row.budget_chef_projet_base ?? 0)
                            : '-',
                    tooltip: 'Budget de base pour les projets Maître',
                    sortable: true,
                    filter: {
                        type: 'numeric',
                        operator: '>=',
                        value: null
                    }
                });
        }

        // Add the rest of the columns
        baseColumns.push(
            {
                key: 'depenses_engagees',
                title: 'D.Engagées',
                width: '10%',
                render: (row: ControleMetrics): string =>
                    formatCurrency(row.depenses_engagees ?? 0),
                tooltip: 'Total des dépenses engagées',
                sortable: true,
                filter: {
                    type: 'numeric',
                    operator: '>=',
                    value: null
                }
            },
            {
                key: 'depenses_facturees',
                title: 'D.Facturées',
                width: '10%',
                render: (row: ControleMetrics): string =>
                    formatCurrency(row.depenses_facturees ?? 0),
                tooltip: 'Total des dépenses facturées',
                sortable: true,
                filter: {
                    type: 'numeric',
                    operator: '>=',
                    value: null
                }
            },
            {
                key: 'reste_a_depenser',
                title: 'Reste',
                width: '8%',
                render: (row: ControleMetrics): string =>
                    formatCurrency(row.reste_a_depenser ?? 0),
                tooltip: 'Reste à dépenser',
                sortable: true,
                filter: {
                    type: 'numeric',
                    operator: '>=',
                    value: null
                }
            },
            {
                key: 'fin_chantier',
                title: 'Fin Chant.',
                width: '10%',
                render: (row: ControleMetrics): string =>
                    formatCurrency(row.fin_chantier ?? 0),
                tooltip: 'Total prévisionnel à la fin du chantier',
                sortable: true,
                filter: {
                    type: 'numeric',
                    operator: '>=',
                    value: null
                }
            },
            {
                key: 'rentabilite',
                title: 'Marge Brute',
                width: '8%',
                render: (row: ControleMetrics): JSX.Element => {
                    // For METRE projects, calculate using fin_chantier and prix_vente_base
                    const value = row.type_projet === 'METRE' 
                        ? Number(row.fin_chantier ?? 0) / Number(row.prix_vente_base ?? 1)
                        : Number(row.rentabilite ?? 0);
            
                    return (
                        <span
                            className={`
                                px-1 py-0.5 rounded-full text-xs font-medium whitespace-nowrap
                                ${value <= 0.65
                                    ? 'bg-green-600 text-white'
                                    : value <= 0.80
                                        ? 'bg-green-300 text-green-800'
                                        : value <= 0.90
                                            ? 'bg-red-200 text-red-800'
                                            : 'bg-red-600 text-white'
                                }
                            `}
                            title={row.type_projet === 'METRE' 
                                ? "Rentabilité (Fin de chantier / Prix de vente atterrissage)" 
                                : "Rentabilité (Fin de chantier / Prix de vente)"}
                        >
                            {Number.isFinite(value) ? value.toFixed(2) : '0.00'}
                        </span>
                    );
                },
                sortable: true,
                filter: {
                    type: 'numeric',
                    operator: '>=',
                    value: null
                }
            },
            {
                key: 'fiabilite',
                title: 'Fiab.',
                width: '7%',
                render: (row: ControleMetrics): JSX.Element => {
                    const fiabiliteMap: Record<string, { color: string; label: string }> = {
                        'Chiffré': { color: 'bg-green-600 text-white', label: 'Chiffré' },
                        'Marché': { color: 'bg-orange-600 text-white', label: 'Marché' },
                        'Estimé': { color: 'bg-red-600 text-white', label: 'Estimé' },
                        '': { color: 'bg-gray-600 text-white', label: 'Non renseigné' }
                    };

                    const { color, label } = fiabiliteMap[row.fiabilite || ''] || fiabiliteMap[''];

                    return (
                        <span
                            className={`px-1 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${color}`}
                            title={row.fiabilite || 'Non renseigné'}
                        >
                            {label}
                        </span>
                    );
                },
                filter: {
                    type: 'select',
                    value: null,
                    options: ['Chiffré', 'Marché', 'Estimé']
                }
            },
            {
                key: 'actions',
                title: 'Details',
                width: '5%',
                render: (row: ControleMetrics): JSX.Element => (
                    <Button
                        variant="secondary"
                        size="sm"
                        className="p-0.5"
                        onClick={(e) => {
                            e.stopPropagation();
                            const encodedArticle = encodeURIComponent(row.numero_article);
                            const encodedProjet = encodeURIComponent(row.code_projet);
                            navigate(`/controle-details/${encodedArticle}/${encodedProjet}`);
                        }}
                        title="Voir les commandes"
                    >
                        <Eye className="h-3 w-3 text-gray-500 hover:text-gray-700" />
                    </Button>
                )
            }
        );

        return baseColumns;
    }, [data, navigate]);

    useEffect(() => {
        setVisibleColumns(new Set(columns.map(col => String(col.key))));
    }, [columns]);

    const processedData = useMemo(() => {

        // If showing updated row, return only that row
        if (showingUpdated && selectedItem) {
            return data.filter(
                item => item.numero_article === selectedItem.numero_article &&
                    item.code_projet === selectedItem.code_projet
            );
        }

        // Apply both external and internal filters
        let filteredData = data;

        // Apply external filters first
        if (selectedProject) {
            filteredData = filteredData.filter(item => item.code_projet === selectedProject);
        }
        if (selectedProjectType) {
            filteredData = filteredData.filter(item => item.type_projet === selectedProjectType);
        }

        // Apply table column filters
        filteredData = filteredData.filter(item => {
            if (Object.keys(filterConfig).length === 0) return true;

            return Object.entries(filterConfig).every(([key, filter]) => {
                const value = item[key as keyof ControleMetrics];

                switch (filter.type) {
                    case 'numeric': {
                        const numValue = Number(value);
                        const filterValue = filter.value;
                        if (filterValue === null) return true;

                        switch (filter.operator) {
                            case '<': return numValue < filterValue;
                            case '<=': return numValue <= filterValue;
                            case '=': return numValue === filterValue;
                            case '>=': return numValue >= filterValue;
                            case '>': return numValue > filterValue;
                            case '!=': return numValue !== filterValue;
                            default: return true;
                        }
                    }
                    case 'string': {
                        if (!filter.value) return true;
                        return String(value)
                            .toLowerCase()
                            .includes(filter.value.toLowerCase());
                    }
                    case 'select': {
                        if (!filter.value) return true;
                        return String(value) === filter.value;
                    }
                    default:
                        return true;
                }
            });
        });

        // Apply sorting
        return filteredData.sort((a, b) => {
            const valueA = Number(a[sortConfig.key as keyof ControleMetrics] ?? 0);
            const valueB = Number(b[sortConfig.key as keyof ControleMetrics] ?? 0);
            return sortConfig.direction === 'desc' ? valueB - valueA : valueA - valueB;
        });
    }, [data, filterConfig, sortConfig, showingUpdated, selectedItem, selectedProject, selectedProjectType]);

    // Add back button column when showing updated row
    const updatedColumns = useMemo(() => {
        if (!showingUpdated) return columns;

        return [
            {
                key: 'back',
                title: '',
                width: '3%',
                render: () => (
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowingUpdated(false)}
                        title="Retour à la liste complète"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                )
            },
            ...columns
        ];
    }, [columns, showingUpdated]);

    const handleRowClick = (row: ControleMetrics) => {
        onEdit?.(row);
        setShowingUpdated(true);
    };

    const handleFilterChange = (newFilterConfig: FilterConfig) => {
        setShowingUpdated(false);
        setFilterConfig(newFilterConfig);
    };

    const handleSort = (key: string) => {
        setShowingUpdated(false);
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    if (loading) {
        return (
            <div className="animate-pulse">
                <Table<ControleMetrics>
                    columns={updatedColumns.filter(col => visibleColumns.has(String(col.key)))}
                    data={[]}
                    loading={true}
                    sortConfig={sortConfig}
                    onSort={handleSort}
                    filterConfig={filterConfig}
                    onFilterChange={setFilterConfig}
                />
            </div>
        );
    }

    if (!processedData || processedData.length === 0) {
        return (
            <div className="p-4 text-gray-500 flex items-center gap-2">
                <span>Aucune donnée à afficher</span>
                {showingUpdated && (
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowingUpdated(false)}
                    >
                        Retour à la liste complète
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Column Visibility Panel */}
            <div className="mb-4 flex justify-end">
                <ColumnVisibilityPanel
                    columns={columns}
                    visibleColumns={visibleColumns}
                    onColumnToggle={handleColumnToggle}
                    onDeselectAll={handleDeselectAllColumns}
                />
            </div>

            {/* Back button when showing updated row */}
            {showingUpdated && (
                <div className="mb-4">
                    <Button
                        variant="secondary"
                        onClick={() => setShowingUpdated(false)}
                        className="flex items-center space-x-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Retour à la liste complète</span>
                    </Button>
                </div>
            )}

            <div className="overflow-x-auto">
                <Table<ControleMetrics>
                    columns={updatedColumns.filter(col => 
                        visibleColumns.has(String(col.key))
                    )}
                    data={processedData}
                    loading={loading}
                    onRowClick={handleRowClick}
                    sortConfig={sortConfig}
                    onSort={handleSort}
                    filterConfig={filterConfig}
                    onFilterChange={handleFilterChange}
                />
            </div>
        </div>
    );
};