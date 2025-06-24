// frontend/src/components/ui/Card.tsx

import React from 'react';

interface CardProps {
    title?: string;
    children: React.ReactNode;
    className?: string;
}

export const Card: React.FC<CardProps> = ({ title, children, className }) => {
    return (
        <div className={`bg-white rounded-lg shadow overflow-hidden ${className || ''}`}>
            {title && (
                <div className="px-4 py-3 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                </div>
            )}
            <div className="overflow-hidden">{children}</div>
        </div>
    );
};