import React from 'react';

export const LoadingState: React.FC = () => (
    <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 mb-4 mx-auto"></div>
            <p className="text-gray-700">
                Chargement des données... Veuillez patienter.
            </p>
        </div>
    </div>
);