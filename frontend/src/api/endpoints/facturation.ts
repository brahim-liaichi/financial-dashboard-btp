// src/api/endpoints/facturation.ts
import apiClient from '../client';
import { ENDPOINTS } from '../config';
import axios from 'axios';
import { validateAndNormalizeDate, safeNumberConvert } from '../../utils/dateUtils';
import { logger } from '../../utils/logger';

// Enhanced type definitions
export interface FacturationData {
    id: number;
    document_number: string;
    registration_date: string;
    document_status: string;
    client_code: string;
    client_name: string;
    item_code: string;
    description: string;
    quantity: number;
    price: number;
    line_total: number;
    total_after_discount: number;
    project_code: string;
}

export interface AvancementData {
    id: number;
    doc_type: string;
    doc_num: string;
    accounting_date: string;
    payment_ht: number;
    payment_ttc: number;
    payment_method: string;
    project_code: string;
    num_total: string;
    dat: string;
    canceled: string;
    accompte_flag: string;
}

export interface FacturationMetrics {
    facturation_total: number;
    avancement_total: number;
    error?: string;
}

export interface EvolutionResponse {
    facturation: Array<{
        date: string;
        total_after_discount: number;
    }>;
    avancement: Array<{
        date: string;
        total_payment: number;
    }>;
}

export const facturationApi = {
    // Upload Excel file with improved error handling
    uploadExcel: async (file: File) => {
        try {
            // Validate file
            if (!file) {
                throw new Error('No file provided');
            }

            const formData = new FormData();
            formData.append('file', file);

            const response = await apiClient.post(
                ENDPOINTS.FACTURATION.UPLOAD_EXCEL,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    timeout: 30000,
                    validateStatus: (status) => status < 500
                }
            );

            // Comprehensive error checking
            if (response.status !== 201) {
                const errorMessage = response.data?.error 
                    || response.data?.details 
                    || 'Failed to upload Excel file';
                
                logger.error('Excel upload failed', { 
                    status: response.status, 
                    errorMessage 
                });
                
                throw new Error(errorMessage);
            }

            logger.info('Excel file uploaded successfully', {
                fileName: file.name,
                fileSize: file.size,
                facturationCount: response.data?.facturation_count,
                avancementCount: response.data?.avancement_count
            });

            return response.data;
        } catch (error) {
            logger.error('Excel upload error', { error });
            
            if (axios.isAxiosError(error)) {
                throw new Error(
                    error.response?.data?.error || 
                    error.response?.data?.details || 
                    error.message || 
                    'Failed to upload Excel file'
                );
            }
            
            throw error;
        }
    },
    
    // Get metrics with improved type safety and error handling
    getMetrics: async (projectCode: string): Promise<FacturationMetrics> => {
        try {
            if (!projectCode) {
                throw new Error('Project code is required');
            }

            const response = await apiClient.get<FacturationMetrics>(
                `${ENDPOINTS.FACTURATION.METRICS(projectCode)}/`,
                {
                    validateStatus: (status) => status < 500,
                    timeout: 10000
                }
            );

            // Validate and transform metrics
            const metrics: FacturationMetrics = {
                facturation_total: safeNumberConvert(response.data.facturation_total),
                avancement_total: safeNumberConvert(response.data.avancement_total)
            };

            logger.info('Metrics retrieved successfully', { 
                projectCode, 
                ...metrics 
            });

            return metrics;
        } catch (error) {
            logger.error('Failed to retrieve metrics', { 
                projectCode, 
                error 
            });
            
            if (axios.isAxiosError(error)) {
                throw new Error(
                    error.response?.data?.error || 
                    'Failed to retrieve facturation metrics'
                );
            }
            
            throw error;
        }
    },

    // Get evolution data with date normalization
    getEvolutionData: async (projectCode: string) => {
        try {
            if (!projectCode) {
                throw new Error('Project code is required');
            }

            const response = await apiClient.get<EvolutionResponse>(
                ENDPOINTS.FACTURATION.EVOLUTION(projectCode),
                {
                    validateStatus: (status) => status < 500,
                    timeout: 10000
                }
            );

            // Process and normalize data
            const processedData = {
                facturation: (response.data.facturation || []).map(item => ({
                    date: validateAndNormalizeDate(item.date),
                    total_after_discount: safeNumberConvert(item.total_after_discount)
                })),
                avancement: (response.data.avancement || []).map(item => ({
                    date: validateAndNormalizeDate(item.date),
                    total_payment: safeNumberConvert(item.total_payment)
                }))
            };

            logger.info('Evolution data retrieved', { 
                projectCode, 
                facturationPoints: processedData.facturation.length,
                avancementPoints: processedData.avancement.length
            });

            return processedData;
        } catch (error) {
            logger.error('Failed to retrieve evolution data', { 
                projectCode, 
                error 
            });
            
            if (axios.isAxiosError(error)) {
                throw new Error(
                    error.response?.data?.error || 
                    'Failed to fetch evolution data'
                );
            }
            
            throw error;
        }
    },
    
    // Get tables with improved error handling and type safety
    getTables: async (projectCode: string) => {
        try {
            if (!projectCode) {
                throw new Error('Project code is required');
            }

            const response = await apiClient.get(
                ENDPOINTS.FACTURATION.TABLES(projectCode),
                {
                    validateStatus: (status) => status < 500,
                    timeout: 10000
                }
            );

            // Validate response
            if (response.status !== 200) {
                throw new Error(
                    response.data?.error || 
                    'Failed to retrieve tables'
                );
            }

            // Normalize dates in returned data
            const normalizedData = {
                facturation: (response.data.facturation || []).map((item: FacturationData) => ({
                    ...item,
                    registration_date: validateAndNormalizeDate(item.registration_date)
                })),
                avancement: (response.data.avancement || []).map((item: AvancementData) => ({
                    ...item,
                    accounting_date: validateAndNormalizeDate(item.accounting_date)
                }))
            };

            logger.info('Tables retrieved successfully', { 
                projectCode, 
                facturationCount: normalizedData.facturation.length,
                avancementCount: normalizedData.avancement.length
            });

            return normalizedData;
        } catch (error) {
            logger.error('Failed to retrieve tables', { 
                projectCode, 
                error 
            });
            
            if (axios.isAxiosError(error)) {
                throw new Error(
                    error.response?.data?.error || 
                    'Failed to fetch tables'
                );
            }
            
            throw error;
        }
    },

    // Delete project data with error handling
    deleteProjectData: async (projectCode: string) => {
        try {
            if (!projectCode) {
                throw new Error('Project code is required');
            }

            const response = await apiClient.delete(
                ENDPOINTS.FACTURATION.DELETE_PROJECT(projectCode),
                {
                    validateStatus: (status) => status < 500,
                    timeout: 10000
                }
            );

            if (response.status !== 200) {
                throw new Error(
                    response.data?.error || 
                    'Failed to delete project data'
                );
            }

            logger.info('Project data deleted successfully', { projectCode });
            return response.data;
        } catch (error) {
            logger.error('Failed to delete project data', { 
                projectCode, 
                error 
            });
            
            if (axios.isAxiosError(error)) {
                throw new Error(
                    error.response?.data?.error || 
                    'Failed to delete project data'
                );
            }
            
            throw error;
        }
    }
};