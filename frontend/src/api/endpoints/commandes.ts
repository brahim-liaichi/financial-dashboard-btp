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

export const commandesApi = {
    getAll: async (params?: ExtendedCommandeFilters, signal?: AbortSignal): Promise<PaginatedResponse<Commande>> => {
        try {
            const apiParams: Record<string, unknown> = {
                page: params?.page || 1,
                page_size: params?.page_size || 25,
                code_projet: params?.project,
                numero_document: params?.numero_document
            };
    
            Object.keys(apiParams).forEach(key => 
                apiParams[key] === undefined && delete apiParams[key]
            );
    
            const response = await apiClient.get<PaginatedResponse<Commande>>(
                ENDPOINTS.COMMANDES.BASE,
                { params: apiParams, signal }
            );
    
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && (error.name === 'CanceledError' || error.code === 'ERR_CANCELED')) {
                // Request was canceled
            }
            throw error;
        }
    },

    getAllUniqueProjects: async (): Promise<{ code: string; name: string }[]> => {
        try {
            const response = await apiClient.get<{ 
                projects: { code: string; name: string }[]; 
                count: number 
            }>(`${ENDPOINTS.COMMANDES.BASE}unique_projects/`);

            const uniqueProjects = Array.from(
                new Map(response.data.projects.map(p => [p.code, p])).values()
            ).sort((a, b) => a.code.localeCompare(b.code));

            return uniqueProjects;
        } catch {
            return [];
        }
    },

    importExcel: async (file: File): Promise<ApiResponse<Commande[]>> => {
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
            throw new Error(errorMessage);
        }

        return response.data;
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