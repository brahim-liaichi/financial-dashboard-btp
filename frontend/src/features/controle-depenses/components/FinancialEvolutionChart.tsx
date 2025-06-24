import React, { useMemo, useState } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { Card } from '@/components/ui/Card';
import { format, parseISO, eachMonthOfInterval, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatChartValue } from '@/utils/formatters';

interface ChartDataPoint {
    date: string;
    facturation: number;
    avancement: number;
    depenses_facturees: number;
    controle: number;
}

interface FinancialEvolutionChartProps {
    controleEvolutionData?: {
        controle?: Array<{
            date: string;
            controle: number;
            depenses_facturees: number;
        }> | null;
    } | null;
    facturationEvolutionData?: {
        facturation?: Array<{ date: string; total_after_discount: number; }> | null;
        avancement?: Array<{ date: string; total_payment: number; }> | null;
    } | null;
    isLoading?: boolean;
}

const FinancialEvolutionChart: React.FC<FinancialEvolutionChartProps> = ({
    controleEvolutionData,
    facturationEvolutionData,
    isLoading = false
}) => {
    const [chartOptions, setChartOptions] = useState({
        facturation: true,
        avancement: true,
        controle: true,
        depenses_facturees: true
    });

    const processedData = useMemo(() => {
        if (!controleEvolutionData?.controle && !facturationEvolutionData?.facturation) {
            return [];
        }
    
        // Initialize monthly data map
        const monthlyDataMap = new Map<string, ChartDataPoint>();
    
        // Get all dates from all data sources
        const allDates = [
            ...(controleEvolutionData?.controle || []).map(d => parseISO(d.date)),
            ...(facturationEvolutionData?.facturation || []).map(d => parseISO(d.date)),
            ...(facturationEvolutionData?.avancement || []).map(d => parseISO(d.date))
        ];
    
        if (allDates.length === 0) return [];
    
        // Determine date range
        const minDate = startOfMonth(new Date(Math.min(...allDates.map(d => d.getTime()))));
        const maxDate = endOfMonth(new Date(Math.max(...allDates.map(d => d.getTime()))));
    
        // Generate all months in range
        const allMonths = eachMonthOfInterval({ start: minDate, end: maxDate });
    
        // Initialize all months with zero values
        allMonths.forEach(date => {
            const monthKey = format(date, 'yyyy-MM-dd');
            monthlyDataMap.set(monthKey, {
                date: monthKey,
                facturation: 0,
                avancement: 0,
                depenses_facturees: 0,
                controle: 0
            });
        });
    
        // Process controle data (already cumulative from backend)
        const lastKnownValues: ChartDataPoint = {
            date: '',
            depenses_facturees: 0,
            controle: 0,
            facturation: 0,
            avancement: 0
        };

        if (controleEvolutionData?.controle) {
            const sortedControleData = controleEvolutionData.controle
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            
            sortedControleData.forEach(item => {
                const monthKey = format(parseISO(item.date), 'yyyy-MM-dd');
                const existingData = monthlyDataMap.get(monthKey);
                if (existingData) {
                    lastKnownValues.depenses_facturees = item.depenses_facturees;
                    lastKnownValues.controle = item.controle;
                    monthlyDataMap.set(monthKey, {
                        ...existingData,
                        depenses_facturees: lastKnownValues.depenses_facturees,
                        controle: lastKnownValues.controle
                    });
                }
            });
        }
    
        // Process facturation data
        if (facturationEvolutionData?.facturation) {
            const sortedFacturationData = facturationEvolutionData.facturation
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            
            sortedFacturationData.forEach(item => {
                const monthKey = format(parseISO(item.date), 'yyyy-MM-dd');
                const existingData = monthlyDataMap.get(monthKey);
                if (existingData) {
                    lastKnownValues.facturation = item.total_after_discount;
                    monthlyDataMap.set(monthKey, {
                        ...existingData,
                        facturation: lastKnownValues.facturation
                    });
                }
            });
        }
    
        // Process avancement data
        if (facturationEvolutionData?.avancement) {
            const sortedAvancementData = facturationEvolutionData.avancement
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            
            sortedAvancementData.forEach(item => {
                const monthKey = format(parseISO(item.date), 'yyyy-MM-dd');
                const existingData = monthlyDataMap.get(monthKey);
                if (existingData) {
                    lastKnownValues.avancement = item.total_payment;
                    monthlyDataMap.set(monthKey, {
                        ...existingData,
                        avancement: lastKnownValues.avancement
                    });
                }
            });
        }
    
        // Propagate last known values for all keys
        const processedEntries = Array.from(monthlyDataMap.entries())
            .sort(([a], [b]) => a.localeCompare(b));
    
        for (let i = 0; i < processedEntries.length; i++) {
            const [, value] = processedEntries[i];
    
            // Propagate last known values for each key
            const keys: (keyof Omit<ChartDataPoint, 'date'>)[] = [
                'facturation', 
                'avancement', 
                'depenses_facturees', 
                'controle'
            ];
            
            keys.forEach(key => {
                if (value[key] === 0 && i > 0) {
                    const [, prevValue] = processedEntries[i - 1];
                    value[key] = prevValue[key];
                }
            });
        }
    
        return processedEntries.map(([, value]) => value);
    }, [controleEvolutionData, facturationEvolutionData]);

    if (isLoading) {
        return (
            <Card>
                <div className="p-6 h-96 flex items-center justify-center">
                    <p>Chargement des données...</p>
                </div>
            </Card>
        );
    }

    if (!processedData.length) {
        return (
            <Card>
                <div className="p-6 h-96 flex items-center justify-center text-gray-500">
                    Aucune donnée disponible
                </div>
            </Card>
        );
    }

    return (
        <Card>
            <div className="p-6">
                <h3 className="text-lg font-medium mb-4">Évolution Financière du Projet</h3>
                <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={processedData}
                            margin={{ top: 10, right: 30, left: 60, bottom: 50 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(date) => format(parseISO(date), 'MMM yyyy', { locale: fr })}
                                angle={-45}
                                textAnchor="end"
                                height={70}
                                interval="preserveStartEnd"
                                tickMargin={5}
                            />
                            <YAxis
                                tickFormatter={(value) => formatChartValue(value)}
                                domain={['dataMin', 'dataMax']}
                                tickCount={5}
                            />
                            <Tooltip
                                formatter={(value: number) => formatChartValue(value)}
                                labelFormatter={(label) => format(parseISO(label as string), 'MMMM yyyy', { locale: fr })}
                            />
                            <Legend
                                verticalAlign="top"
                                height={36}
                                onClick={(e) => {
                                    const dataKey = e.dataKey as keyof typeof chartOptions;
                                    setChartOptions(prev => ({
                                        ...prev,
                                        [dataKey]: !prev[dataKey]
                                    }));
                                }}
                            />
                            {chartOptions.facturation && (
                                <Line
                                    type="monotone"
                                    dataKey="facturation"
                                    name="Facturation"
                                    stroke="#4CAF50"
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{ r: 6 }}
                                    connectNulls
                                />
                            )}
                            {chartOptions.avancement && (
                                <Line
                                    type="monotone"
                                    dataKey="avancement"
                                    name="Réglement"
                                    stroke="#2196F3"
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{ r: 6 }}
                                    connectNulls
                                />
                            )}
                            {chartOptions.depenses_facturees && (
                                <Line
                                    type="monotone"
                                    dataKey="depenses_facturees"
                                    name="Dépenses Réceptionnées"
                                    stroke="#FF9800"
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{ r: 6 }}
                                    connectNulls
                                />
                            )}
                            {chartOptions.controle && (
                                <Line
                                    type="monotone"
                                    dataKey="controle"
                                    name="Dépenses Engagées"
                                    stroke="#f44336"
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{ r: 6 }}
                                    connectNulls
                                />
                            )}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </Card>
    );
};

export default FinancialEvolutionChart;