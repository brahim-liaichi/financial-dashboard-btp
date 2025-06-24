import React from 'react';
import { Button } from '@/components/ui/Button';

interface ErrorStateProps {
    error: string | null;
    onRetry: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ 
    error, 
    onRetry 
}) => (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-red-50">
        <div className="max-w-md w-full bg-white shadow-md rounded-lg p-6 text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
                Erreur de Chargement
            </h2>
            <p className="text-gray-700 mb-6">
                {error || 'Une erreur inattendue s\'est produite.'}
            </p>
            <div className="flex justify-center space-x-4">
                <Button 
                    variant="secondary" 
                    onClick={() => window.location.reload()}
                >
                    Recharger la Page
                </Button>
                <Button 
                    variant="primary" 
                    onClick={onRetry}
                >
                    Réessayer
                </Button>
            </div>
        </div>
    </div>
);