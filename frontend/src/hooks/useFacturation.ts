import { useState, useCallback } from 'react';
import { facturationApi } from '../api/endpoints/facturation';
import { logger } from '../utils/logger';
import { 
  FacturationMetrics, 
  FacturationData, 
  AvancementData,
  FacturationEvolutionData
} from '@/types';

interface UseFacturationOptions {
  onError?: (error: Error) => void;
  onSuccess?: (message: string) => void;
}

interface FacturationState {
  isLoading: boolean;
  error: Error | null;
  metrics: FacturationMetrics | null;
  evolutionData: FacturationEvolutionData | null;
  tables: {
    facturation: FacturationData[];
    avancement: AvancementData[];
  } | null;
}

export const useFacturation = (options: UseFacturationOptions = {}) => {
  const [state, setState] = useState<FacturationState>({
    isLoading: false,
    error: null,
    metrics: null,
    evolutionData: null,
    tables: null
  });

  const uploadExcel = useCallback(async (file: File) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await facturationApi.uploadExcel(file);
      
      logger.info('Excel file processed', {
        facturationCount: result.facturation_count,
        avancementCount: result.avancement_count
      });

      options.onSuccess?.(
        `Excel file processed successfully. Created ${result.facturation_count} facturation and ${result.avancement_count} avancement records.`
      );
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
      
      logger.error('Excel upload failed', { error: errorMessage });
      
      setState(prev => ({ ...prev, error: new Error(errorMessage) }));
      options.onError?.(new Error(errorMessage));
      
      throw error;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [options]);

  const fetchMetrics = useCallback(async (projectCode: string) => {
    if (!projectCode) {
      logger.warn('No project code provided for metrics');
      throw new Error('Project code is required');
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));
  
    try {
      const metricsData = await facturationApi.getMetrics(projectCode);
      
      logger.info('Metrics fetched successfully', {
        projectCode,
        facturationTotal: metricsData.facturation_total,
        avancementTotal: metricsData.avancement_total
      });

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: null,
        metrics: metricsData
      }));
  
      return metricsData;
    } catch (error) {
      const errorToSet = error instanceof Error 
        ? error 
        : new Error('Failed to fetch metrics');
      
      logger.error('Metrics fetch failed', { 
        projectCode, 
        error: errorToSet 
      });

      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorToSet 
      }));
      
      options.onError?.(errorToSet);
      throw errorToSet;
    }
  }, [options]);

  const fetchEvolutionData = useCallback(async (projectCode: string) => {
    if (!projectCode) {
      logger.warn('No project code provided for evolution data');
      throw new Error('Project code is required');
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));
  
    try {
      const evolutionData = await facturationApi.getEvolutionData(projectCode);
      
      logger.info('Evolution data fetched successfully', {
        projectCode,
        facturationPoints: evolutionData.facturation?.length || 0,
        avancementPoints: evolutionData.avancement?.length || 0
      });

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: null,
        evolutionData
      }));
  
      return evolutionData;
    } catch (error) {
      const errorToSet = error instanceof Error 
        ? error 
        : new Error('Failed to fetch evolution data');
      
      logger.error('Evolution data fetch failed', { 
        projectCode, 
        error: errorToSet 
      });

      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorToSet 
      }));
      
      options.onError?.(errorToSet);
      throw errorToSet;
    }
  }, [options]);
  const fetchTables = useCallback(async (projectCode: string) => {
    if (!projectCode?.trim()) {
      logger.warn('No project code provided for tables fetch');
      return null;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));
  
    try {
      const tablesData = await facturationApi.getTables(projectCode);
      
      logger.info('Tables fetched successfully', {
        projectCode,
        facturationCount: tablesData.facturation?.length || 0,
        avancementCount: tablesData.avancement?.length || 0
      });

      const normalizedTables = {
        facturation: tablesData.facturation || [],
        avancement: tablesData.avancement || []
      };

      setState(prev => ({
        ...prev,
        tables: normalizedTables,
        error: null,
        isLoading: false
      }));
  
      return normalizedTables;
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to fetch tables data';

      logger.error('Tables fetch failed', { 
        projectCode, 
        error: errorMessage 
      });

      const emptyTables = {
        facturation: [],
        avancement: []
      };

      setState(prev => ({
        ...prev,
        error: new Error(errorMessage),
        tables: emptyTables,
        isLoading: false
      }));
  
      return emptyTables;
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      metrics: null,
      evolutionData: null,
      tables: null
    });
  }, []);

  return {
    ...state,
    uploadExcel,
    fetchMetrics,
    fetchEvolutionData,
    fetchTables,
    reset
  };
};

export type { AvancementData, FacturationData, FacturationMetrics };
