/* eslint-disable react-hooks/exhaustive-deps */
// src/components/ui/Table.tsx
// src/components/ui/Table.tsx
import React, { 
    useState, 
    useMemo, 
    useCallback, 
    memo 
  } from 'react';
  import { ChevronUp, ChevronDown, Filter } from 'lucide-react';
  import { ColumnFilterDropdown } from './ColumnFilterDropdown';
  import type { 
    ColumnFilter, 
    FilterConfig, 
    SortConfig, 
    TableColumn 
  } from '@/types';
  
  interface TableProps<T extends Record<string, unknown>> {
      columns: TableColumn<T>[];
      data: T[];
      loading?: boolean;
      emptyMessage?: string;
      onRowClick?: (item: T) => void;
      sortConfig?: SortConfig;
      onSort?: (key: string) => void;
      filterConfig?: FilterConfig;
      onFilterChange?: (filters: FilterConfig) => void;
  }
  
  function TableComponent<T extends Record<string, unknown>>({
      columns,
      data,
      loading = false,
      emptyMessage = 'No data available',
      onRowClick,
      //sortConfig,
      onSort,
      filterConfig = {},
      onFilterChange,
    }: TableProps<T>): JSX.Element {
      // Memoize state to prevent unnecessary re-renders
      const [activeFilter, setActiveFilter] = useState<string | null>(null);
  
      // Memoize handlers to maintain stable references
      const handleFilterClick = useCallback((columnKey: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveFilter(prev => prev === columnKey ? null : columnKey);
      }, []);
  
      const handleFilterChange = useCallback((columnKey: string, filter: ColumnFilter) => {
        if (onFilterChange) {
          const newFilterConfig = {
            ...filterConfig,
            [columnKey]: filter
          };
          onFilterChange(newFilterConfig);
        }
      }, [onFilterChange, filterConfig]);
  
      const handleHeaderClick = useCallback((column: TableColumn<T>) => {
        if (column.sortable && onSort) {
          onSort(column.key.toString());
        }
      }, [onSort]);
  
      // Memoize render functions to optimize performance
      const renderSortIcon = useCallback((column: TableColumn<T>, sortConfig?: SortConfig) => {
        if (!column.sortable) return null;
        
        const isSorted = sortConfig?.key === column.key;
        
        return (
      <span className="ml-2 inline-flex text-gray-400">
        {isSorted && sortConfig ? (
          sortConfig.direction === 'asc' ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )
        ) : (
          <div className="h-4 w-4 relative">
            <ChevronUp className="h-3 w-3 absolute top-0 opacity-30" />
            <ChevronDown className="h-3 w-3 absolute bottom-0 opacity-30" />
          </div>
        )}
      </span>
    );
}, []); // [sortConfig]);
  
      const isFilterActive = useCallback((column: TableColumn<T>): boolean => {
        const columnFilter = filterConfig[column.key.toString()];
        return columnFilter?.value !== null && 
               columnFilter?.value !== undefined && 
               columnFilter.value !== '';
      }, [filterConfig]);
  
      const renderColumnHeader = useCallback((column: TableColumn<T>) => {
        const hasActiveFilter = isFilterActive(column);
        
        return (
          <div className="flex items-center justify-between group">
            <span 
              className={`flex-1 cursor-${column.sortable ? 'pointer' : 'default'}`}
              onClick={() => column.sortable && handleHeaderClick(column)}
            >
              {column.title}
            </span>
            <div className="flex items-center space-x-1">
              {column.filter && (
                <div className="relative">
                  <button
                    onClick={(e) => handleFilterClick(column.key.toString(), e)}
                    className={`
                      p-1 rounded hover:bg-gray-200 
                      ${hasActiveFilter ? 'text-blue-600' : 'text-gray-400'}
                      transition-colors duration-150 ease-in-out
                    `}
                    title={hasActiveFilter ? "Filter active" : "Filter"}
                  >
                    <Filter className="h-4 w-4" />
                  </button>
                  {activeFilter === column.key.toString() && (
                    <ColumnFilterDropdown
                      filter={column.filter}
                      onFilterChange={(newFilter) => 
                        handleFilterChange(column.key.toString(), newFilter)
                      }
                      onClose={() => setActiveFilter(null)}
                    />
                  )}
                </div>
              )}
              {renderSortIcon(column)}
            </div>
          </div>
        );
      }, [
        handleFilterClick, 
        handleFilterChange, 
        renderSortIcon, 
        isFilterActive, 
        activeFilter
      ]);
  
      // Memoize data rendering to prevent unnecessary re-renders
      const renderedData = useMemo(() => {
        if (loading) return null;
        if (data.length === 0) return null;
  
        return data.map((item, index) => (
          <tr
            key={index}
            onClick={() => onRowClick?.(item)}
            className={`
              ${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
              transition-colors duration-150 ease-in-out
            `}
          >
            {columns.map((column) => (
              <td
                key={column.key.toString()}
                className={`
                  px-6 py-4 text-sm text-gray-900
                  ${column.align ? `text-${column.align}` : ''}
                  whitespace-nowrap
                `}
              >
                {column.render 
                  ? column.render(item)
                  : item[column.key as keyof T]?.toString() || ''
                }
              </td>
            ))}
          </tr>
        ));
      }, [data, columns, onRowClick]);
  
      return (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key.toString()}
                    scope="col"
                    className={`
                      px-6 py-3 
                      text-${column.align || 'left'}
                      text-xs font-medium text-gray-500 uppercase tracking-wider
                      ${column.width ? `w-[${column.width}]` : ''}
                      relative
                      ${column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''}
                      select-none
                    `}
                  >
                    {renderColumnHeader(column)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    Loading...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                renderedData
              )}
            </tbody>
          </table>
        </div>
      );
  }
  
  // Use memo to prevent re-renders when props haven't changed
  export const Table = memo(TableComponent) as typeof TableComponent;
  
  export type { TableColumn };