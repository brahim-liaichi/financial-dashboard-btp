import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useControle } from '../../hooks/useControle';
import { controleApi } from '../../api/endpoints/controle';
import type { ProjectType } from '@/types';

// Create a type that exactly matches ControleMetrics
type TestMetrics = {
  date: string | undefined;
  numero_article: string;
  code_projet: string;
  type_projet: ProjectType;
  prix_vente: number | null;
  prix_vente_base: number | null;
  budget_chef_projet: number | null;
  budget_chef_projet_base: number | null;
  depenses_engagees: number;
  depenses_facturees: number;
  reste_a_depenser: number | null;
  fiabilite: string | null;
  fin_chantier: number | null;
  rentabilite: number;
  rapport: number;
  status: 'Profitable' | 'Break-even' | 'Loss' | 'Undefined';
  // Add the missing required properties
  depenses_engagees_reel: number;
  depenses_facturees_reel: number;
  rapport_aterrissage: number;
  total_commandes?: number;
  total_depenses_engagees?: number;
  total_depenses_facturees?: number;
};

describe('useControle Hook', () => {
  const mockMetrics: TestMetrics[] = [
    {
      date: new Date().toISOString(),
      numero_article: 'TEST001',
      code_projet: 'PROJ001',
      type_projet: 'FORFAIT',
      depenses_engagees: 1000,
      depenses_facturees: 1500,
      reste_a_depenser: 500,
      prix_vente: 2000,
      prix_vente_base: null,
      budget_chef_projet: 1800,
      budget_chef_projet_base: null,
      fiabilite: 'E',
      fin_chantier: 1200,
      rentabilite: 0.5,
      rapport: 0.9,
      status: 'Profitable',
      // Add the missing properties with default values
      depenses_engagees_reel: 950,
      depenses_facturees_reel: 1450,
      rapport_aterrissage: 0.85,
      total_commandes: 1,
      total_depenses_engagees: 1000,
      total_depenses_facturees: 1500
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch controles successfully', async () => {
    // Directly mock the API with the specific type
    vi.mocked(controleApi.getMetrics).mockResolvedValue(mockMetrics);

    const { result } = renderHook(() => useControle());

    await act(async () => {
      await result.current.fetchControles();
    });

    expect(result.current.controles.length).toBe(1);
    expect(result.current.loading).toBeFalsy();
    expect(result.current.error).toBeNull();
  });

  it('handles error when fetching controles fails', async () => {
    vi.mocked(controleApi.getMetrics).mockRejectedValue(new Error('Fetch failed'));

    const { result } = renderHook(() => useControle());

    await act(async () => {
      await result.current.fetchControles();
    });

    expect(result.current.controles.length).toBe(0);
    expect(result.current.error).toBe('Failed to fetch controles');
    expect(result.current.loading).toBeFalsy();
  });
});