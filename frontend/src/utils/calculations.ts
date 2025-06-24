// frontend/src/utils/calculations.ts

import { Commande } from '../types';

export const processEvolutionData = (data: Array<{
    date: string;
    depenses_facturees: number;
    controle: number;
}>) => {
    // Sort by date
    const sortedData = [...data].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let cumulativeFacturees = 0;
    let cumulativeControle = 0;

    return sortedData.map(point => {
        // Calculate cumulative values
        cumulativeFacturees += point.depenses_facturees;
        cumulativeControle += point.controle;

        return {
            date: point.date,
            depenses_facturees: cumulativeFacturees,
            controle: cumulativeControle
        };
    }).filter(point => 
        // Filter out points where both values are 0
        point.depenses_facturees > 0 || point.controle > 0
    );
};

export const calculateEvolutionMetrics = (data: Array<{
    date: string;
    depenses_facturees: number;
    controle: number;
}>) => {
    if (!data.length) return null;

    const latest = data[data.length - 1];
    
    return {
        total_depenses_facturees: latest.depenses_facturees,
        total_controle: latest.controle,
        monthly_average_facturees: latest.depenses_facturees / data.length,
        monthly_average_controle: latest.controle / data.length,
        date_range: {
            start: data[0].date,
            end: latest.date
        }
    };
};

export const getMonthlyChange = (
    currentValue: number,
    previousValue: number
): number => {
    if (previousValue === 0) return 0;
    return ((currentValue - previousValue) / previousValue) * 100;
};

export const calculateDepensesEngagees = (commandes: Commande[]): Record<string, number> => {
    return commandes.reduce((acc, commande) => {
        const { numero_article, total_lignes } = commande;
        acc[numero_article] = (acc[numero_article] || 0) + total_lignes;
        return acc;
    }, {} as Record<string, number>);
};

export const calculateDepensesFacturees = (commandes: Commande[]): Record<string, number> => {
    return commandes.reduce((acc, commande) => {
        const { numero_article, prix, quantite_en_cours } = commande;
        acc[numero_article] = (acc[numero_article] || 0) + (prix * quantite_en_cours);
        return acc;
    }, {} as Record<string, number>);
};

export const calculateFinChantier = (
    depensesEngagees: number,
    resteADepenser: number
): number => {
    return depensesEngagees + resteADepenser;
};

export const calculateRentabilite = (
    prixVente: number | null, 
    finChantier: number,
    projectType: 'FORFAIT' | 'MAITRE' = 'FORFAIT'
): number => {
    // For MAITRE projects, use base selling price if available
    const effectivePrixVente = prixVente || 0;

    if (finChantier === 0) return 0;
    
    // Rentability calculation might differ based on project type
    switch(projectType) {
        case 'FORFAIT':
            return effectivePrixVente > 0 
                ? (effectivePrixVente / finChantier) 
                : 0;
        case 'MAITRE':
            // Potentially different calculation logic for MAITRE projects
            return effectivePrixVente > 0 
                ? (effectivePrixVente / finChantier) 
                : 0;
        default:
            return 0;
    }
};

export const calculateRapport = (
    budgetChefProjet: number | null, 
    prixVente: number | null,
    projectType: 'FORFAIT' | 'MAITRE' = 'FORFAIT'
): number => {
    // For MAITRE projects, use base budget if available
    const effectiveBudget = budgetChefProjet || 0;
    const effectivePrixVente = prixVente || 0;

    if (effectivePrixVente === 0) return 0;
    
    switch(projectType) {
        case 'FORFAIT':
            return effectiveBudget / effectivePrixVente;
        case 'MAITRE':
            // Potentially different calculation logic for MAITRE projects
            return effectiveBudget / effectivePrixVente;
        default:
            return 0;
    }
};

export const aggregateProjectMetrics = (commandes: Commande[]) => {
    return commandes.reduce((acc, commande) => {
        acc.totalAmount = (acc.totalAmount || 0) + commande.total_lignes;
        acc.totalOrders = (acc.totalOrders || 0) + 1;
        return acc;
    }, {} as { totalAmount: number; totalOrders: number });
};

export const determineProjectStatus = (rentabilite: number): 'Profitable' | 'Break-even' | 'Loss' | 'Undefined' => {
    if (rentabilite > 1) return 'Profitable';
    if (rentabilite === 1) return 'Break-even';
    if (rentabilite > 0) return 'Loss';
    return 'Undefined';
};