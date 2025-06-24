// src/hooks/useControleCommandes.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { controleApi } from '@/api/endpoints/controle';
import type { Commande, FilterConfig } from '@/types';

interface UseControleCommandesProps {
  numeroArticle: string;
  codeProjet: string;
  filters?: FilterConfig;
  enabled?: boolean;
}

export const useControleCommandes = ({ 
  numeroArticle, 
  codeProjet, 
  filters = {},
  enabled = true 
}: UseControleCommandesProps) => {
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mounted = useRef(true);
  const lastFetchParamsRef = useRef('');
  const fetchingRef = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const fetchCommandes = useCallback(async () => {
    // Create a fetch params key for comparison
    const fetchParamsKey = JSON.stringify({ numeroArticle, codeProjet, filters });

    // Skip if already fetching or same params
    if (
      !enabled || 
      fetchingRef.current || 
      !numeroArticle || 
      !codeProjet ||
      fetchParamsKey === lastFetchParamsRef.current
    ) {
      return;
    }

    try {
      fetchingRef.current = true;
      setIsLoading(true);
      lastFetchParamsRef.current = fetchParamsKey;

      const data = await controleApi.getRelatedCommandes(
        numeroArticle,
        codeProjet,
        filters
      );

      if (mounted.current) {
        setCommandes(data);
      }
    } catch (err) {
      if (mounted.current) {
        console.error('Error fetching commandes:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch commandes');
      }
    } finally {
      if (mounted.current) {
        setIsLoading(false);
        fetchingRef.current = false;
      }
    }
  }, [numeroArticle, codeProjet, enabled, filters]);

  // Fetch data when params change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchCommandes();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [fetchCommandes]);

  return {
    commandes,
    isLoading,
    error,
    refetch: fetchCommandes
  };
};