import React, { useMemo, useCallback } from 'react';
import { Table } from '@/components/ui/Table';
import { formatDate, formatCurrency } from '@/utils/formatters';
import type { Commande, FilterConfig, TableColumn } from '@/types';

interface ExtendedCommande extends Commande {
  quantite_en_cours: number;
  [key: string]: unknown;
}

interface ControleDetailsTableProps {
  data: Commande[];
  loading: boolean;
  onFilterChange: (filters: FilterConfig) => void;
  filterConfig: FilterConfig;
}

export const ControleDetailsTable: React.FC<ControleDetailsTableProps> = React.memo(({
  data,
  loading,
  onFilterChange,
  filterConfig
}) => {
  const columns = useMemo<TableColumn<ExtendedCommande>[]>(() => [
    {
      key: 'numero_document',
      title: 'N° Document',
      filter: {
        type: 'string',
        value: ''
      }
    },
    {
      key: 'date_enregistrement',
      title: 'Date',
      render: (row) => formatDate(row.date_enregistrement),
      filter: {
        type: 'string',
        value: ''
      }
    },
    {
      key: 'nom_fournisseur',
      title: 'Fournisseur',
      filter: {
        type: 'string',
        value: ''
      }
    },
    {
      key: 'description_article',
      title: 'Description',
      filter: {
        type: 'string',
        value: ''
      }
    },
    {
      key: 'quantite',
      title: 'Quantité',
      render: (row) => {
        const quantity = typeof row.quantite === 'string' ? parseFloat(row.quantite) : row.quantite;
        return Number(quantity).toFixed(2);
      },
      align: 'right',
      filter: {
        type: 'numeric',
        operator: '>=',
        value: null
      }
    },
    {
      key: 'quantite_en_cours',
      title: 'Quantité en cours',
      render: (row) => {
        const quantity = typeof row.quantite_en_cours === 'string' ? 
          parseFloat(row.quantite_en_cours) : row.quantite_en_cours;
        return Number(quantity).toFixed(2);
      },
      align: 'right',
      filter: {
        type: 'numeric',
        operator: '>=',
        value: null
      }
    },
    {
      key: 'prix',
      title: 'Prix',
      render: (row) => formatCurrency(row.prix),
      align: 'right',
      filter: {
        type: 'numeric',
        operator: '>=',
        value: null
      }
    },
    {
      key: 'total_lignes',
      title: 'Total',
      render: (row) => formatCurrency(row.total_lignes),
      align: 'right',
      filter: {
        type: 'numeric',
        operator: '>=',
        value: null
      }
    },
    {
      key: 'statut_document',
      title: 'Statut',
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-sm ${
          row.statut_document === 'O' ? 'bg-red-100 text-red-800' :
          row.statut_document === 'C' ? 'bg-green-100 text-green-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {row.statut_document}
        </span>
      ),
      align: 'center',
      filter: {
        type: 'select',
        value: null,
        options: ['O', 'C']
      }
    }
  ], []);

  const filteredData = useMemo(() => {
    return data.filter(row => {
      return Object.entries(filterConfig).every(([key, filter]) => {
        // If no filter or no value, include the row
        if (!filter || filter.value === null || filter.value === '') return true;

        const rowValue = row[key as keyof Commande];

        // Handle different filter types
        switch (filter.type) {
          case 'string': {
            // Case-insensitive string contains check
            const stringValue = String(rowValue).toLowerCase();
            const filterValue = String(filter.value).toLowerCase();
            return stringValue.includes(filterValue);
          }
          
          case 'numeric': {
            // Numeric comparison logic
            const numRowValue = typeof rowValue === 'string' 
              ? parseFloat(rowValue) 
              : Number(rowValue);
            const numFilterValue = Number(filter.value);

            switch (filter.operator) {
              case '<': return numRowValue < numFilterValue;
              case '<=': return numRowValue <= numFilterValue;
              case '=': return numRowValue === numFilterValue;
              case '>=': return numRowValue >= numFilterValue;
              case '>': return numRowValue > numFilterValue;
              case '!=': return numRowValue !== numFilterValue;
              default: return true;
            }
          }
          
          case 'select': {
            return rowValue === filter.value;
          }
          
          default:
            return true;
        }
      });
    });
  }, [data, filterConfig]);

  const tableData = useMemo(() => 
    filteredData.map(cmd => ({
      ...cmd,
      quantite_en_cours: cmd.quantite_en_cours ?? 0
    })),
    [filteredData]
  );

  const handleFilterChange = useCallback((newFilters: FilterConfig) => {
    if (!loading) {
      onFilterChange(newFilters);
    }
  }, [loading, onFilterChange]);

  return (
    <div className="relative">
      <Table
        data={tableData}
        columns={columns}
        loading={loading}
        filterConfig={filterConfig}
        onFilterChange={handleFilterChange}
        emptyMessage="Aucune commande trouvée"
      />
    </div>
  );
});

ControleDetailsTable.displayName = 'ControleDetailsTable';