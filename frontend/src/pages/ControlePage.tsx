// frontend/src/pages/ControlePage.tsx

import React, { Suspense } from 'react';
import { ControleDashboard } from '@/features/controle-depenses/components/ControleDashboard';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export const ControlePage: React.FC = () => {
    const fallbackRender = (error: Error) => (
        <div className="text-red-600 p-4">
            Something went wrong loading the dashboard: {error.message}
        </div>
    );

    return (
        <ErrorBoundary fallback={fallbackRender}>
            <Suspense fallback={<div>Loading...</div>}>
                <ControleDashboard />
            </Suspense>
        </ErrorBoundary>
    );
};