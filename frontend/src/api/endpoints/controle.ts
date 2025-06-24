/* eslint-disable @typescript-eslint/no-explicit-any */
import apiClient from '../client';
import { ENDPOINTS } from '../config';
import type { 
  ControleDepense, 
  ControleMetrics, 
  ControleUpdateInput, 
  ProjectType, 
  PaginatedResponse,
  Commande
} from '../../types';
import axios from 'axios';
import { validateAndNormalizeDate, safeNumberConvert } from '../../utils/dateUtils';
import { logger } from '../../utils/logger';

interface EvolutionDataPoint {
    date: string;
    depenses_facturees: number;
    //depenses_facturees_reel: number;
    controle: number; // depenses_engagees
    //controle_reel: number; // depenses_engagees_reel
}

interface EvolutionResponse {
    controle: EvolutionDataPoint[];
    project_type: ProjectType;
    project_name: string;
}
// Centralized type mapping with stronger typing
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const FIABILITE_MAP = {
    'Estimé': 'E',
    'Chiffré': 'C',
    'Marché': 'M'
} as const;

export const controleApi = {
    // Enhanced data validation and normalization for all entries
    getAll: async (params: Record<string, any> = {}) => {
        try {
            const response = await apiClient.get<PaginatedResponse<ControleDepense>>(
                ENDPOINTS.CONTROLE.BASE,
                {
                    params: Object.fromEntries(
                        Object.entries(params).filter(([, v]) => v != null)
                    ),
                    timeout: 10000,
                    validateStatus: (status) => status < 500
                }
            );

            return {
                data: response.data.results.map(item => ({
                    ...item,
                    date_enregistrement: validateAndNormalizeDate(item.date_enregistrement)
                })),
                pagination: {
                    total: response.data.count,
                    hasNext: !!response.data.next,
                    hasPrevious: !!response.data.previous
                }
            };
        } catch (error) {
            logger.error('Failed to fetch control data', { error, params });
            throw new Error(
                axios.isAxiosError(error) 
                    ? error.response?.data?.detail || 'Failed to fetch control data'
                    : 'Network error occurred'
            );
        }
    },

    // More robust metrics fetching with type safety
    getMetrics: async (params?: {
        numero_article?: string;
        code_projet?: string;
        type_projet?: ProjectType | '';
    }) => {
        try {
            const response = await apiClient.get<ControleMetrics[]>(
                ENDPOINTS.CONTROLE.GET_METRICS,
                {
                    params: {
                        ...params,
                        type_projet: params?.type_projet || undefined
                    },
                    timeout: 10000,
                    validateStatus: (status) => status < 500
                }
            );

            return response.data?.map(metric => ({
                ...metric,
                date: metric.date ? validateAndNormalizeDate(metric.date) : undefined
            })) || [];

        } catch (error) {
            logger.error('Failed to fetch metrics', { error, params });
            
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 404) return [];
                throw new Error(
                    error.response?.data?.detail || 
                    'Failed to retrieve metrics data'
                );
            }
            throw error;
        }
    },

    // Enhanced evolution data fetching with strict type checking
    getEvolutionData: async (codeProjet: string) => {
        if (!codeProjet) {
            throw new Error('Project code is required');
        }
    
        try {
            const response = await apiClient.get<EvolutionResponse>(
                ENDPOINTS.CONTROLE.GET_EVOLUTION,
                {
                    params: { code_projet: codeProjet },
                    timeout: 10000,
                    validateStatus: (status) => status < 500
                }
            );
    
            // Enhanced data processing with accumulation validation
            const processedData = {
                ...response.data,
                controle: response.data.controle
                    .map(item => ({
                        ...item,
                        date: validateAndNormalizeDate(item.date),
                        depenses_facturees: safeNumberConvert(item.depenses_facturees),
                        //depenses_facturees_reel: safeNumberConvert(item.depenses_facturees_reel),
                        controle: safeNumberConvert(item.controle),
                        //controle_reel: safeNumberConvert(item.controle_reel)
                    }))
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) // Ensure chronological order
            };
    
            // Validate accumulation
            let previousFacturees = 0;
            //let previousFactureesReel = 0;
            let previousControle = 0;
            //let previousControleReel = 0;
    
            processedData.controle = processedData.controle.map(point => {
                // Ensure values are never less than previous month
                const newPoint = {
                    ...point,
                    depenses_facturees: Math.max(point.depenses_facturees, previousFacturees),
                    //depenses_facturees_reel: Math.max(point.depenses_facturees_reel, previousFactureesReel),
                    controle: Math.max(point.controle, previousControle),
                    //controle_reel: Math.max(point.controle_reel, previousControleReel)
                };
    
                // Update previous values
                previousFacturees = newPoint.depenses_facturees;
                //previousFactureesReel = newPoint.depenses_facturees_reel;
                previousControle = newPoint.controle;
                //previousControleReel = newPoint.controle_reel;
    
                return newPoint;
            });
    
            logger.info('Evolution data fetched and processed', { 
                projectCode: codeProjet, 
                dataPoints: processedData.controle.length,
                dateRange: {
                    start: processedData.controle[0]?.date,
                    end: processedData.controle[processedData.controle.length - 1]?.date
                }
            });
    
            return processedData;
    
        } catch (error) {
            logger.error('Evolution data fetch failed', { 
                error, 
                projectCode: codeProjet 
            });
            
            throw new Error(
                axios.isAxiosError(error) 
                    ? error.response?.data?.detail || 'Failed to fetch evolution data'
                    : 'Network error occurred'
            );
        }
    },
    // Update control data with enhanced validation
    updateControl: async (data: ControleUpdateInput) => {
        try {
            // Validate input data
            if (!data.numero_article) {
                throw new Error('Article number is required');
            }

            const requestData = {
                numero_article: data.numero_article,
                code_projet: data.code_projet,
                type_projet: data.type_projet,
                prix_vente: data.prix_vente === null ? null : safeNumberConvert(data.prix_vente),
                budget_chef_projet: data.budget_chef_projet === null ? null : safeNumberConvert(data.budget_chef_projet),
                reste_a_depenser: data.reste_a_depenser === null ? null : safeNumberConvert(data.reste_a_depenser),
                fiabilite: data.fiabilite,
                // Include base fields for Métré projects
                ...(data.type_projet === 'METRE' && {
                    prix_vente_base: data.prix_vente_base === null ? null : safeNumberConvert(data.prix_vente_base),
                    budget_chef_projet_base: data.budget_chef_projet_base === null ? null : safeNumberConvert(data.budget_chef_projet_base)
                })
            };

            logger.info('Updating control data', { 
                articleNumber: data.numero_article, 
                projectType: data.type_projet 
            });

            const response = await apiClient.post<ControleMetrics>(
                ENDPOINTS.CONTROLE.UPDATE_CONTROL,
                requestData
            );

            return response.data;
        } catch (error) {
            logger.error('Failed to update control data', { error, data });
            throw error;
        }
    },
    // Get a single control entry with improved error handling
    getById: async (numeroArticle: string, codeProjet?: string) => {
        try {
            const url = codeProjet
                ? `${ENDPOINTS.CONTROLE.BASE}?numero_article=${numeroArticle}&code_projet=${codeProjet}`
                : `${ENDPOINTS.CONTROLE.BASE}${numeroArticle}/`;

            const response = await apiClient.get<ControleDepense | PaginatedResponse<ControleDepense>>(url);

            const result = 'results' in response.data
                ? response.data.results[0]
                : response.data;

            return {
                ...result,
                date_enregistrement: result.date_enregistrement 
                    ? validateAndNormalizeDate(result.date_enregistrement) 
                    : undefined
            };
        } catch (error) {
            logger.error('Error fetching controle entry', { 
                error, 
                articleNumber: numeroArticle, 
                projectCode: codeProjet 
            });
            throw error;
        }
    },

    // Get related commandes with comprehensive error handling
    getRelatedCommandes: async (
        numeroArticle: string, 
        codeProjet: string,
        filters: Record<string, unknown> = {}
    ): Promise<Commande[]> => {
        try {
            const response = await apiClient.get<Commande[]>(
                `${ENDPOINTS.CONTROLE.BASE}get_related_commandes/`,
                {
                    params: {
                        numero_article: numeroArticle,
                        code_projet: codeProjet,
                        ...filters
                    },
                    timeout: 10000,
                    validateStatus: (status) => status < 500
                }
            );

            // Validate and normalize data
            if (!Array.isArray(response.data)) {
                logger.warn('Unexpected response format', { 
                    data: response.data,
                    articleNumber: numeroArticle,
                    projectCode: codeProjet 
                });
                return [];
            }

            return response.data.map(commande => ({
                ...commande,
                date_enregistrement: validateAndNormalizeDate(commande.date_enregistrement)
            }));
        } catch (error) {
            logger.error('Failed to fetch related commandes', { 
                error, 
                articleNumber: numeroArticle, 
                projectCode: codeProjet 
            });
            
            throw new Error(
                axios.isAxiosError(error) 
                    ? error.response?.data?.detail || 'Failed to fetch related commandes'
                    : 'Network error occurred'
            );
        }
    }
};