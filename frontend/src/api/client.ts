// src/api/client.ts
import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG } from './config';

// Helper function to get CSRF token
function getCsrfToken(): string {
    const name = 'csrftoken';
    let cookieValue = null;

    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue || '';
}

const apiClient = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: {
        ...API_CONFIG.HEADERS,
        'X-Requested-With': 'XMLHttpRequest',
    },
    withCredentials: true,
});

// Add a request interceptor
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Add CSRF token
        const csrfToken = getCsrfToken();
        if (csrfToken) {
            config.headers['X-CSRFToken'] = csrfToken;
        }

        // Add auth token if it exists
        const authToken = localStorage.getItem('token');

        if (authToken) {
            config.headers['Authorization'] = `Bearer ${authToken}`;
        }

        return config;
    }, 
    (error) => {
        return Promise.reject(error);
    }
);

apiClient.interceptors.response.use(
    (response: AxiosResponse) => {
        return response;
    },
    (error) => {
        if (axios.isCancel(error)) {
            return Promise.reject(error);
        }

        if (axios.isAxiosError(error)) {
            console.error('Axios error:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                headers: error.response?.headers,
                config: error.config
            });
            
            if (error.response?.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/login';
            }
        } else {
            console.error('Non-Axios error:', error);
        }
        
        return Promise.reject(error);
    }
);

export default apiClient;