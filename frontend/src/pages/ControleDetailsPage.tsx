// src/pages/ControleDetailsPage.tsx

import { useParams } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { useControle } from '@/hooks/useControle';
import { useControleCommandes } from '@/hooks/useControleCommandes';
import { formatCurrency } from '@/utils/formatters';
import type { FilterConfig } from '@/types';
import { useEffect, useState, useMemo, useRef } from 'react';
import { ControleDetailsTable } from '@/features/controle-depenses/components/ControleDetailsTable';

export const ControleDetailsPage = () => {
  const { numeroArticle, codeProjet } = useParams<{ numeroArticle: string; codeProjet: string }>();
  const [filterConfig, setFilterConfig] = useState<FilterConfig>({});
  const initialFetchDoneRef = useRef(false);
  
  const { controles, fetchControles } = useControle();

  // Initial data fetch - only once
  useEffect(() => {
    if (!initialFetchDoneRef.current && numeroArticle && codeProjet) {
      initialFetchDoneRef.current = true;
      fetchControles({
        numero_article: numeroArticle,
        code_projet: codeProjet
      });
    }
  }, [numeroArticle, codeProjet, fetchControles]); // Intentionally omit fetchControles

  // Stable params for commandes hook
  const commandesParams = useMemo(() => ({
    numeroArticle: numeroArticle ?? '',
    codeProjet: codeProjet ?? '',
    filters: filterConfig,
    enabled: Boolean(numeroArticle && codeProjet)
  }), [numeroArticle, codeProjet, filterConfig]);

  // Get commandes with memoized params
  const { commandes, isLoading } = useControleCommandes(commandesParams);

  // Find current controle - memoized
  const controle = useMemo(() => 
    controles.find(c => 
      c.numero_article === numeroArticle && c.code_projet === codeProjet
    ), [controles, numeroArticle, codeProjet]);

  // Memoize metrics to prevent recalculation
  const summaryMetrics = useMemo(() => {
    if (!controle) return [];
    
    return [
      { label: 'Prix de Vente', value: controle.prix_vente },
      { label: 'Budget Chef Projet', value: controle.budget_chef_projet },
      { label: 'Dépenses Engagées', value: controle.depenses_engagees },
      { label: 'Dépenses Facturées', value: controle.depenses_facturees },
      { label: 'Reste à Dépenser', value: controle.reste_a_depenser }
    ];
  }, [controle]);

  // Early returns
  if (!numeroArticle || !codeProjet) {
    return <div className="p-4">Missing parameters</div>;
  }

  if (!controle) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading controle data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <Card className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">
            Détails du contrôle: {numeroArticle}
          </h1>
          <p className="text-gray-500">Projet: {codeProjet}</p>
        </div>

        <div className="grid grid-cols-5 gap-6">
          {summaryMetrics.map((metric, index) => (
            <div key={index}>
              <p className="text-sm text-gray-500">{metric.label}</p>
              <p className="text-lg font-medium">
                {formatCurrency(metric.value)}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Commandes Associées</h2>
        <ControleDetailsTable
          data={commandes ?? []}
          loading={isLoading}
          filterConfig={filterConfig}
          onFilterChange={setFilterConfig}
        />
      </Card>
    </div>
  );
};