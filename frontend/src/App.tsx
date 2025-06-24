// frontend/src/App.tsx

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { CommandesPage } from '@/pages/CommandesPage';
import { ControlePage } from '@/pages/ControlePage';
import { ControleDetailsPage } from '@/pages/ControleDetailsPage';
import { FacturationPage } from '@/pages/FacturationPage'; // Add this import
import { LoginPage } from '@/pages/LoginPage';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import UserManagementPage from '@/pages/UserManagementPage';

const App: React.FC = () => {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    
                    <Route element={
                        <ProtectedRoute>
                            <MainLayout>
                                <Outlet />
                            </MainLayout>
                        </ProtectedRoute>
                    }>
                        {/* Dashboard route */}
                        <Route path="/" element={<Navigate to="/dashboard" />} />
                        {/* Dashboard page route */}
                        <Route path="/dashboard" element={<DashboardPage />} />
                        {/* Commandes route */}
                        <Route path="/commandes" element={<CommandesPage />} />
                        {/* Facturation route */}
                        <Route path="/controle" element={<ControlePage />} />
                        {/* Controle Details Page route (related commandes) */}
                        <Route 
                            path="/controle-details/:numeroArticle/:codeProjet" 
                            element={<ControleDetailsPage />} 
                        />
                        {/* Facturation route */}
                        <Route 
                            path="/facturation/:projectCode" 
                            element={<FacturationPage />} 
                        />
                        {/* users route */}
                        <Route path="/users" element={<UserManagementPage />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
};

export default App;