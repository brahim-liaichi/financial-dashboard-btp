import React, { useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/utils/formatters';
import { FileBarChart, ExternalLink } from 'lucide-react';
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
            tooltip: 'Montant total des avancements - Cliquez pour voir les détails',
            category: 'payment',
            action: onViewDetailsClick ? (
                <div className="absolute top-3 right-3">
                    {/* Interactive button with clear styling */}
                    <button 
                        onClick={onViewDetailsClick}
                        className="group relative flex items-center space-x-1 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-all duration-200 border border-blue-200 hover:border-blue-300"
                        title="Cliquez pour voir le détail des facturations"
                    >
                        <FileBarChart className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Détails</span>
                        <ExternalLink className="h-3 w-3 opacity-60" />
                        
                        {/* Tooltip for extra clarity */}
                        <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block">
                            <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                                Voir la page facturation
                                <div className="absolute top-full right-4 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                            </div>
                        </div>
                    </button>
                </div>
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
                <Card key={index} className={metric.action ? "relative hover:shadow-md transition-shadow" : ""}>
                    <div className="p-4 relative">
                        <h3 
                            className="text-sm font-medium text-gray-500 mb-1"
                            title={metric.tooltip}
                        >
                            {metric.title}
                            {/* Add visual indicator when interactive */}
                            {metric.action && (
                                <span className="ml-1 text-blue-500 text-xs">
                                    (cliquable)
                                </span>
                            )}
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
                            {/* Add call-to-action for interactive cards */}
                            {metric.action && (
                                <p className="text-xs text-blue-600 mt-1 opacity-75">
                                    💡 Cliquez sur "Détails" pour voir la facturation
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