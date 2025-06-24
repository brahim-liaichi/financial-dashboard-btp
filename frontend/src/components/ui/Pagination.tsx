import React from 'react';

interface PaginationProps {
    currentPage: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
    pageSizeOptions?: number[]; // Add this line
}

export const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalItems,
    itemsPerPage,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = [10, 25, 50, 100] // Default page size options
}) => {
    // Calculate total pages
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // Calculate current range of items
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    // Prevent pagination if only one page
    if (totalPages <= 1 && !onPageSizeChange) {
        return null;
    }

    return (
        <div className="flex items-center justify-between">
            {/* Page Size Selector */}
            {onPageSizeChange && (
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-700">Afficher</span>
                    <select
                        value={itemsPerPage}
                        onChange={(e) => onPageSizeChange(Number(e.target.value))}
                        className="form-select border rounded px-2 py-1 text-sm"
                    >
                        {pageSizeOptions.map((size) => (
                            <option key={size} value={size}>
                                {size} par page
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Pagination Controls */}
            <div className="flex items-center space-x-2">
                {/* Previous button */}
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border rounded 
                        disabled:opacity-50 disabled:cursor-not-allowed 
                        hover:bg-gray-100 transition-colors"
                >
                    Précédent
                </button>

                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(page => (
                    <button
                        key={page}
                        onClick={() => onPageChange(page)}
                        className={`
                            px-3 py-1 border rounded 
                            ${currentPage === page 
                                ? 'bg-blue-500 text-white' 
                                : 'hover:bg-gray-100'}
                        `}
                    >
                        {page}
                    </button>
                ))}

                {/* Next button */}
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border rounded 
                        disabled:opacity-50 disabled:cursor-not-allowed 
                        hover:bg-gray-100 transition-colors"
                >
                    Suivant
                </button>
            </div>

            {/* Items Range */}
            <div className="text-sm text-gray-700">
                {`${startItem}-${endItem} sur ${totalItems}`}
            </div>
        </div>
    );
};