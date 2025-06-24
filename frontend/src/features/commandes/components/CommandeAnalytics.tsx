// frontend/src/features/commandes/components/CommandeAnalytics.tsx

import React from 'react';
import { Card } from '@/components/ui/Card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency, formatNumber } from '@/utils/formatters';

interface CommandeAnalyticsProps {
    data: {
        depensesEngagees: number;
        depensesFacturees: number;
        totalCommandes: number;
        monthlyData: Array<{
            month: string;
            total: number;
        }>;
    };
}

export const CommandeAnalytics: React.FC<CommandeAnalyticsProps> = ({ data }) => {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <div className="p-6">
                        <h3 className="text-sm font-medium text-gray-500">
                            Dépenses Engagées
                        </h3>
                        <p className="mt-2 text-3xl font-semibold text-gray-900">
                            {formatCurrency(data.depensesEngagees)}
                        </p>
                    </div>
                </Card>
                
                <Card>
                    <div className="p-6">
                        <h3 className="text-sm font-medium text-gray-500">
                            Dépenses Facturées
                        </h3>
                        <p className="mt-2 text-3xl font-semibold text-gray-900">
                            {formatCurrency(data.depensesFacturees)}
                        </p>
                    </div>
                </Card>
                
                <Card>
                    <div className="p-6">
                        <h3 className="text-sm font-medium text-gray-500">
                            Total Commandes
                        </h3>
                        <p className="mt-2 text-3xl font-semibold text-gray-900">
                            {formatNumber(data.totalCommandes)}
                        </p>
                    </div>
                </Card>
            </div>

            <Card>
                <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Évolution mensuelle
                    </h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip 
                                    formatter={(value: number) => formatCurrency(value)}
                                />
                                <Legend />
                                <Line 
                                    type="monotone" 
                                    dataKey="total" 
                                    stroke="#2563eb" 
                                    strokeWidth={2}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </Card>
        </div>
    );
};