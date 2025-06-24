// frontend/src/api/config.ts

// Types for API responses
export interface PaginatedResponse<T> {
    length: number;
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

const cleanPath = (path: string): string => {
    // Remove multiple consecutive slashes and trim leading slashes
    const cleaned = path.replace(/\/+/g, '/').replace(/^\/+/, '');
    // Ensure trailing slash for non-empty paths
    return cleaned ? (cleaned.endsWith('/') ? cleaned : `${cleaned}/`) : '';
};

// API configuration
export const API_CONFIG = {
    BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/',
    TIMEOUT: 30000,
    HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
} as const;

// Facturation responses
export interface FacturationUploadResponse {
    facturation_count: number;
    avancement_count: number;
}

export interface FacturationMetricsResponse {
    facturation_total: number;
    avancement_total: number;
}

// API endpoints
export const ENDPOINTS = {
    COMMANDES: {
        BASE: cleanPath('commandes'),
        IMPORT: cleanPath('commandes/import_excel'),
        EXPORT: cleanPath('commandes/export_excel'),
        CLEAR_ALL: cleanPath('commandes/clear_all'),
        DELETE_PROJECT: cleanPath('commandes/delete_project'),
    },
    CONTROLE: {
        BASE: cleanPath('controle-depenses'),
        GET_METRICS: cleanPath('controle-depenses/get_metrics'),
        UPDATE_CONTROL: cleanPath('controle-depenses/update_control'),
        GET_EVOLUTION: cleanPath('controle-depenses/get_evolution_data'),
    },
    FACTURATION: {
        BASE: cleanPath('facturation'),
        UPLOAD_EXCEL: cleanPath('facturation/upload-excel'),
        METRICS: (projectCode: string) =>
            `${cleanPath('facturation/metrics')}${encodeURIComponent(projectCode)}`,
        EVOLUTION: (projectCode: string) =>
            `${cleanPath('facturation/evolution')}${encodeURIComponent(projectCode)}`,
        TABLES: (projectCode: string) =>
            `${cleanPath('facturation/tables')}${encodeURIComponent(projectCode)}`,
        DELETE_PROJECT: (projectCode: string) =>
            `${cleanPath('facturation/delete')}/${encodeURIComponent(projectCode)}/`
    },
    DASHBOARD: {
        METRICS: cleanPath('dashboard/metrics'),
        PROJECT_SUMMARY: cleanPath('dashboard/project_summary'),
    },
    AUTH: {
        ME: cleanPath('auth/me'),
        LOGIN: cleanPath('auth/login'),
        LOGOUT: cleanPath('auth/logout'),
    },
    USER_MANAGEMENT: {
        BASE: cleanPath('user-management'),
        USERS: cleanPath('user-management/user-projects'),
        PROJECTS: cleanPath('user-management/projects'),
        PROJECT_METRICS: (userId: number) =>
            `${cleanPath('user-management/user-projects')}/${userId}/project_metrics/`,
        PROJECT_MEMBERS: (projectCode: string) =>
            `${cleanPath('user-management/projects')}/${encodeURIComponent(projectCode)}/members/`
    },
} as const;