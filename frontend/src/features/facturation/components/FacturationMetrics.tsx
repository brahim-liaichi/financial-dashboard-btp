// Path: frontend/src/features/controle-depenses/components/FacturationMetrics.tsx

import React, { useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/utils/formatters';
import { FileBarChart } from 'lucide-react';
import { FacturationMetrics as FacturationMetricsType } from '@/hooks/useFacturation';

interface FacturationMetricsProps {
    data: FacturationMetricsType | null;
    onViewDetailsClick?: () => void;
    isLoading?: boolean;
    error?: string | null;
}

type MetricConfig = {
    title: string;
    value: string;
    tooltip: string;
    category: 'billing' | 'payment';
    action?: React.ReactNode;
};

export const FacturationMetrics: React.FC<FacturationMetricsProps> = ({
    data,
    onViewDetailsClick,
    isLoading,
    error
}): JSX.Element => {
    const summaryMetrics = useMemo(() => {
        if (!data) return null;

        try {
            const facturationTotal = Number(data.facturation_total) || 0;
            const avancementTotal = Number(data.avancement_total) || 0;

            return {
                facturationTotal,
                avancementTotal,
                // Calculate percentage if needed
                paymentPercentage: facturationTotal ? 
                    (avancementTotal / facturationTotal) * 100 : 0
            };
        } catch (conversionError) {
            console.error('Metrics conversion error:', conversionError);
            return null;
        }
    }, [data]);

    // Define metrics configuration
    const metrics: readonly MetricConfig[] = [
        {
            title: 'Total Facturation',
            value: summaryMetrics ? 
                formatCurrency(summaryMetrics.facturationTotal) : '0,00 €',
            tooltip: 'Montant total des facturations',
            category: 'billing'
        },
        {
            title: 'Total Règlement',
            value: summaryMetrics ? 
                formatCurrency(summaryMetrics.avancementTotal) : '0,00 €',
            tooltip: 'Montant total des avancements',
            category: 'payment',
            action: onViewDetailsClick ? (
                <button 
                    onClick={onViewDetailsClick}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Voir les détails"
                >
                    <FileBarChart className="h-5 w-5" />
                </button>
            ) : undefined
        }
    ] as const;


    // Render states
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(2)].map((_, index) => (
                    <Card key={index} className="animate-pulse">
                        <div className="p-4">
                            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                        </div>
                    </Card>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <div className="p-4 text-red-600">
                        Erreur de chargement : {error}
                    </div>
                </Card>
            </div>
        );
    }

    // Main metrics display
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metrics.map((metric, index) => (
                <Card key={index}>
                    <div className="p-4 relative">
                        <h3 
                            className="text-sm font-medium text-gray-500 mb-1"
                            title={metric.tooltip}
                        >
                            {metric.title}
                        </h3>
                        <div className="truncate">
                            <p className="text-2xl font-semibold text-gray-900">
                                {metric.value}
                            </p>
                            {/* Optional: Add percentage display */}
                            {metric.category === 'payment' && summaryMetrics?.paymentPercentage && (
                                <p className="text-sm text-gray-500">
                                    {summaryMetrics.paymentPercentage.toFixed(1)}% du total facturé
                                </p>
                            )}
                        </div>
                        {metric.action}
                    </div>
                </Card>
            ))}
        </div>
    );
};