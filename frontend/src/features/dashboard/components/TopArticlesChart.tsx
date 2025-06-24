import React from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer 
} from 'recharts';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/utils/formatters';
import { ProjectArticleMetrics } from '@/types';

interface TopArticlesChartProps {
    topFiveArticles: ProjectArticleMetrics[];
    className?: string;
}

export const TopArticlesChart: React.FC<TopArticlesChartProps> = ({ 
    topFiveArticles, 
    className = '' 
}) => (
    <Card className={className}>
        <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
                Top 5 Articles par Budget
            </h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topFiveArticles}>
                    <XAxis dataKey="numero_article" />
                    <YAxis
                        tickFormatter={(value) => formatCurrency(Number(value))}
                    />
                    <Tooltip
                        formatter={(value, name) => [
                            name === 'prix_vente' || name === 'depenses_engagees'
                                ? formatCurrency(Number(value))
                                : value,
                            name
                        ]}
                    />
                    <Bar dataKey="prix_vente" fill="#8884d8" name="Prix de Vente" />
                    <Bar dataKey="depenses_engagees" fill="#82ca9d" name="Dépenses Engagées" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    </Card>
);