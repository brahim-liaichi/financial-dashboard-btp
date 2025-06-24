import React, { createContext, useState, useEffect } from 'react';
import { authApi } from '@/api/endpoints/auth';
import type { AuthContextType, User } from '@/contexts/AuthContext.types';

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        if (!isInitialized) {
            checkAuth();
            setIsInitialized(true);
        }
    }, [isInitialized]);

    const checkAuth = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setUser(null);
            setIsLoading(false);
            return;
        }

        try {
            const response = await authApi.getCurrentUser();
            setUser(response.data);
        } catch {
            localStorage.removeItem('token');
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (username: string, password: string) => {
        try {
            const response = await authApi.login(username, password);
            localStorage.setItem('token', response.data.token);
            setUser(response.data.user);
        } catch (error) {
            // Log the error
            console.error('Login Error:', error);
            
            // Remove any existing token
            localStorage.removeItem('token');
            
            // Rethrow the error to allow caller to handle it
            throw error;
        }
    };

    const logout = async () => {
        try {
            await authApi.logout();
        } finally {
            localStorage.removeItem('token');
            setUser(null);
        }
    };

    const hasPermission = (permission: string) => {
        return user?.permissions?.includes(permission) || false;
    };

    const contextValue = {
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        hasPermission,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};