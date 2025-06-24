import { Card } from "@/components/ui/Card";
import { getProjectType } from "@/constants/projects";
import { ControleMetrics } from "@/types";
import { formatCurrency } from "@/utils/formatters";
import { useMemo } from "react";

const safeNumber = (value: unknown): number => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
};

const FIELD_MAPPINGS = {
    sellingPrice: {
        standard: {
            backendField: 'prix_vente',
            forfaitLabel: 'Prix de Vente',
            metreLabel: 'Prix de Vente Base'
        },
        landing: {
            backendField: 'prix_vente_base',
            label: 'Prix de Vente Atterrissage'
        }
    },
    budget: {
        standard: {
            backendField: 'budget_chef_projet',
            forfaitLabel: 'Budget Chef de Projet',
            metreLabel: 'Budget Chef Projet Base'
        },
        landing: {
            backendField: 'budget_chef_projet_base',
            label: 'Budget Atterrissage'
        }
    }
};

interface ControleSummaryProps {
    data: ControleMetrics[];
    selectedProject?: string;
}

export const ControleSummary: React.FC<ControleSummaryProps> = ({
    data,
    selectedProject
}): JSX.Element => {
    const summaryMetrics = useMemo(() => {
        if (!data?.length) return null;

        const filteredData = selectedProject 
            ? data.filter(item => item.code_projet === selectedProject)
            : data;

        const selectedProjectType = selectedProject 
            ? getProjectType(selectedProject) 
            : null;

        const globalMetrics = {
            totalDepensesEngagees: 0,
            totalDepensesFacturees: 0,
            totalFinChantierReel: 0,
            totalPrixVente: 0,
            totalPrixVenteAtterrissage: 0,
            totalBudgetChefProjet: 0,
            totalBudgetChefProjetAtterrissage: 0,
            totalResteADepenser: 0,
            averageRentabiliteReel: 0,
            selectedProjectType,
            projectCount: 0
        };

        filteredData.forEach((item) => {
            globalMetrics.totalDepensesEngagees += safeNumber(item.depenses_engagees_reel);
            globalMetrics.totalDepensesFacturees += safeNumber(item.depenses_facturees_reel);
            globalMetrics.totalFinChantierReel += safeNumber(item.fin_chantier_reel);
            globalMetrics.totalPrixVente += safeNumber(item[FIELD_MAPPINGS.sellingPrice.standard.backendField]);
            globalMetrics.totalPrixVenteAtterrissage += safeNumber(item[FIELD_MAPPINGS.sellingPrice.landing.backendField]);
            globalMetrics.totalBudgetChefProjet += safeNumber(item[FIELD_MAPPINGS.budget.standard.backendField]);
            globalMetrics.totalBudgetChefProjetAtterrissage += safeNumber(item[FIELD_MAPPINGS.budget.landing.backendField]);
            globalMetrics.totalResteADepenser += safeNumber(item.reste_a_depenser);
            globalMetrics.averageRentabiliteReel += safeNumber(item.rentabilite_reel);
            globalMetrics.projectCount++;
        });

        globalMetrics.averageRentabiliteReel = globalMetrics.projectCount > 0 
            ? globalMetrics.averageRentabiliteReel / globalMetrics.projectCount 
            : 0;

        return { global: globalMetrics };
    }, [data, selectedProject]);

    // Base metrics (Prix de Vente, Budget, and Standard Margin)
    const baseMetrics = [
        {
            title: "Métriques de Base",
            metrics: [
                {
                    title: summaryMetrics?.global.selectedProjectType === 'METRE' ?
                        FIELD_MAPPINGS.sellingPrice.standard.metreLabel :
                        FIELD_MAPPINGS.sellingPrice.standard.forfaitLabel,
                    value: formatCurrency(summaryMetrics?.global.totalPrixVente || 0),
                    tooltip: summaryMetrics?.global.selectedProjectType === 'METRE' ?
                        'Prix de vente base pour projets au mètre' :
                        'Prix de vente pour projets forfaitaires'
                },
                {
                    title: summaryMetrics?.global.selectedProjectType === 'METRE' ? 
                        FIELD_MAPPINGS.budget.standard.metreLabel : 
                        FIELD_MAPPINGS.budget.standard.forfaitLabel,
                    value: formatCurrency(summaryMetrics?.global.totalBudgetChefProjet || 0),
                    tooltip: summaryMetrics?.global.selectedProjectType === 'METRE' ? 
                        'Budget de base pour projets au mètre' : 
                        'Budget de base projet pour projets forfaitaires'
                },
                // Standard Margin (Based on prix_vente)
                {
                    title: 'Marge Brute Prévisionnelle',
                    value: `${((summaryMetrics?.global?.totalFinChantierReel ?? 0) / 
                            (summaryMetrics?.global?.totalPrixVente ?? 1)).toFixed(2)}`,
                    tooltip: 'Rentabilité calculée sur fin de chantier réel et prix de vente standard'
                }
            ]
        }
    ];

    // Dépenses metrics
    const depensesMetrics = [
        {
            title: "Dépenses",
            metrics: [
                {
                    title: 'Dépenses Engagées',
                    value: formatCurrency(summaryMetrics?.global.totalDepensesEngagees || 0),
                    tooltip: 'Total des dépenses engagées basé sur les quantités livrées'
                },
                {
                    title: 'Dépenses Réceptionnées',
                    value: formatCurrency(summaryMetrics?.global.totalDepensesFacturees || 0),
                    tooltip: 'Total des dépenses facturées basé sur les quantités livrées'
                }
            ]
        }
    ];

    // Atterrissage metrics (only for METRE)
    const atterrissageMetrics = summaryMetrics?.global.selectedProjectType === 'METRE' ? [
        {
            title: "Métriques d'Atterrissage",
            metrics: [
                {
                    title: FIELD_MAPPINGS.sellingPrice.landing.label,
                    value: formatCurrency(summaryMetrics.global.totalPrixVenteAtterrissage),
                    tooltip: 'Prix de vente d\'atterrissage pour les projets au mètre'
                },
                {
                    title: FIELD_MAPPINGS.budget.landing.label,
                    value: formatCurrency(summaryMetrics.global.totalBudgetChefProjetAtterrissage),
                    tooltip: 'Budget d\'atterrissage pour les projets au mètre'
                },
                // Landing Margin (Based on prix_vente_base) - Only for METRE projects
                {
                    title: 'Marge Brute Prévisionnelle Atterrissage',
                    value: `${((summaryMetrics.global.totalFinChantierReel ?? 0) / 
                            (summaryMetrics.global.totalPrixVenteAtterrissage ?? 1)).toFixed(2)}`,
                    tooltip: 'Rentabilité calculée sur fin de chantier réel et prix de vente d\'atterrissage'
                }
            ]
        }
    ] : [];

    return (
        <div className="space-y-6">
            {/* Base Metrics Row */}
            {baseMetrics.map((group, groupIndex) => (
                <div key={groupIndex} className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-700">{group.title}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {group.metrics.map((metric, index) => (
                            <Card key={index}>
                                <div className="p-4">
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
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            ))}

            {/* Dépenses Row */}
            {depensesMetrics.map((group, groupIndex) => (
                <div key={groupIndex} className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-700">{group.title}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {group.metrics.map((metric, index) => (
                            <Card key={index}>
                                <div className="p-4">
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
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            ))}

            {/* Atterrissage Row (METRE only) */}
            {atterrissageMetrics.map((group, groupIndex) => (
                <div key={groupIndex} className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-700">{group.title}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {group.metrics.map((metric, index) => (
                            <Card key={index}>
                                <div className="p-4">
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
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};