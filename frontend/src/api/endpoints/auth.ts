import  client  from '@/api/client';

interface LoginResponse {
    token: string;
    user: {
        id: number;
        username: string;
        is_staff: boolean;
        permissions: string[];
    };
}

export const authApi = {
    login: (username: string, password: string) => {
       
        return client.post<LoginResponse>('/auth/login/', { username, password })
            .then(response => {
               
                return response;
            })
            .catch(error => {
                console.error('Login Error:', error.response || error);
                throw error;
            });
    },
    
    logout: () => 
        client.post('/auth/logout/'),
    
    getCurrentUser: () => 
        client.get('/auth/me/'),
}; 