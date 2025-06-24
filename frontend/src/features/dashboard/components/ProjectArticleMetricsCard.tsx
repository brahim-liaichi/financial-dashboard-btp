import React from 'react';
import { Card } from '@/components/ui/Card';
import { 
    formatCurrency, 
    formatPercentage
} from '@/utils/formatters';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { ProjectArticleMetrics } from '@/types';

interface ProjectArticleMetricsCardProps {
    article: ProjectArticleMetrics;
}

export const ProjectArticleMetricsCard: React.FC<ProjectArticleMetricsCardProps> = ({ 
    article 
}) => {
    // Calculate payment progress percentage
    const calculatePaymentProgress = () => {
        if (!article.depenses_engagees || article.depenses_engagees === 0) return 0;
        const progress = (article.depenses_facturees / article.depenses_engagees) * 100;
        return Math.min(Math.max(progress, 0), 100); // Ensure value is between 0 and 100
    };

    const paymentProgress = calculatePaymentProgress();

    return (
        <Card>
            <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">
                        Article: {article.numero_article}
                    </h3>
                    <span className="text-sm text-gray-500">
                        Progression des Paiements
                    </span>
                </div>
                
                <ProgressBar 
                    value={paymentProgress} 
                    label={formatPercentage(paymentProgress)}
                />
                
                <div className="grid grid-cols-2 gap-4">
                    <MetricItem 
                        label="Dépenses Engagées" 
                        value={formatCurrency(article.depenses_engagees)} 
                    />
                    <MetricItem 
                        label="Dépenses Facturées" 
                        value={formatCurrency(article.depenses_facturees)} 
                    />
                    <MetricItem 
                        label="Reste à Dépenser" 
                        value={formatCurrency(article.reste_a_depenser)} 
                    />
                    <MetricItem 
                        label="Prix de Vente" 
                        value={formatCurrency(article.prix_vente)} 
                    />
                    <MetricItem 
                        label="Fin de Chantier" 
                        value={formatCurrency(article.fin_chantier)} 
                    />
                </div>
            </div>
        </Card>
    );
};

const MetricItem: React.FC<{ label: string; value: string }> = ({ 
    label, 
    value 
}) => (
    <div>
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        <p className="text-sm font-medium">{value}</p>
    </div>
);