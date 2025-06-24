import axios from 'axios';
import apiClient from '../client';
import { ENDPOINTS } from '../config';
import type {
    Commande,
    CommandeFilters as OriginalCommandeFilters,
    ClearAllResponse,
    ApiResponse,
    PaginatedResponse
} from '@/types';

type ExtendedCommandeFilters = Omit<OriginalCommandeFilters, 'code_projet'> & {
    project?: string;
};

const createApiLogger = (group: string) => ({
    start() {
        console.group(group);
        console.time('API Request');
    },
    log(message: string, data?: unknown) {
        console.log(message, data);
    },
    end(result?: unknown) {
        console.timeEnd('API Request');
        console.log('Result:', result);
        console.groupEnd();
    },
    error(error: unknown) {
        console.error('API Error:', error);
        console.groupEnd();
    }
});

export const commandesApi = {
    getAll: async (params?: ExtendedCommandeFilters, signal?: AbortSignal): Promise<PaginatedResponse<Commande>> => {
        const logger = createApiLogger('🔍 Commandes API Request');
        
        try {
            logger.start();
            logger.log('Raw Input Params:', params);
    
            const apiParams: Record<string, unknown> = {
                page: params?.page || 1,
                page_size: params?.page_size || 25,
                code_projet: params?.project,
                numero_document: params?.numero_document
            };
    
            Object.keys(apiParams).forEach(key => 
                apiParams[key] === undefined && delete apiParams[key]
            );
    
            logger.log('🔧 Processed API Params:', apiParams);
    
            const response = await apiClient.get<PaginatedResponse<Commande>>(
                ENDPOINTS.COMMANDES.BASE,
                { params: apiParams, signal }
            );
    
            const pageSize = Number(params?.page_size) || 25;
            const totalCount = Number(response.data.count) || 0;
    
            const metadata = {
                count: response.data.count,
                pages: Math.ceil(totalCount / pageSize),
                currentPage: apiParams.page || 1
            };
    
            logger.log('📊 API Response Metadata:', metadata);
            logger.end(response.data);
    
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && (error.name === 'CanceledError' || error.code === 'ERR_CANCELED')) {
                logger.log('Request was canceled');
            } else {
                logger.error(error);
            }
            throw error;
        }
    },

    getAllUniqueProjects: async (): Promise<{ code: string; name: string }[]> => {
        const logger = createApiLogger('🔍 Fetching Unique Projects');

        try {
            logger.start();

            const response = await apiClient.get<{ 
                projects: { code: string; name: string }[]; 
                count: number 
            }>(`${ENDPOINTS.COMMANDES.BASE}unique_projects/`);

            const uniqueProjects = Array.from(
                new Map(response.data.projects.map(p => [p.code, p])).values()
            ).sort((a, b) => a.code.localeCompare(b.code));

            logger.log('Unique Projects:', uniqueProjects);
            logger.end(uniqueProjects);

            return uniqueProjects;
        } catch (error) {
            logger.error(error);
            return [];
        }
    },

    importExcel: async (file: File): Promise<ApiResponse<Commande[]>> => {
        const logger = createApiLogger('Excel Import');

        try {
            logger.start();
            logger.log('File Details:', {
                name: file.name,
                size: file.size,
                type: file.type
            });

            const formData = new FormData();
            formData.append('file', file);

            const response = await apiClient.post<ApiResponse<Commande[]>>(
                ENDPOINTS.COMMANDES.IMPORT,
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    validateStatus: (status) => status >= 200 && status < 500
                }
            );

            if (response.status !== 200 && response.status !== 201) {
                const errorMessage = response.data.error || 'Unknown import error';
                logger.error(errorMessage);
                throw new Error(errorMessage);
            }

            logger.end(response.data);
            return response.data;
        } catch (error) {
            logger.error(error);
            throw error;
        }
    },

    clearAll: async (): Promise<ApiResponse<ClearAllResponse>> => {
        try {
            const response = await apiClient.delete<ApiResponse<ClearAllResponse>>(
                ENDPOINTS.COMMANDES.CLEAR_ALL
            );
            return response.data;
        } catch (error) {
            console.error('Error clearing commandes:', error);
            throw error;
        }
    },

    deleteProjectCommandes: async (projectCode: string): Promise<ApiResponse<ClearAllResponse>> => {
        try {
            const response = await apiClient.delete<ApiResponse<ClearAllResponse>>(
                `${ENDPOINTS.COMMANDES.BASE}delete_project/`,
                {
                    params: { code_projet: projectCode }
                }
            );
            return response.data;
        } catch (error) {
            console.error('Error deleting project commandes:', error);
            throw error;
        }
    },

    exportExcel: async (): Promise<Blob> => {
        try {
            const response = await apiClient.get(ENDPOINTS.COMMANDES.EXPORT, {
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            console.error('Error exporting commandes:', error);
            throw error;
        }
    }
};