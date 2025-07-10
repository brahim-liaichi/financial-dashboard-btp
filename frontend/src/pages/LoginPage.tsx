import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Info, Eye, Database, Globe, Briefcase } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export const LoginPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        
        try {
            await login(username, password);
            navigate('/dashboard');
        } catch (error) {
            console.error('Full Login Error:', error);
            setError('Invalid username or password');
        }
    };

    const handleDemoLogin = () => {
        setUsername('admin');
        setPassword('admin123');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col justify-center py-8 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-lg">
                
                {/* Header Section */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-3 shadow-lg">
                            <Database className="h-8 w-8 text-white" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        <span className="text-blue-600">Financial</span> Dashboard
                    </h1>
                    <p className="text-lg text-gray-600 mb-4">
                        Expense Control & Project Management Solution
                    </p>
                    
                    {/* Technology Stack Badge */}
                    <div className="inline-flex items-center space-x-4 text-sm text-gray-500 bg-gray-100 rounded-full px-4 py-2 mb-6">
                        <span className="flex items-center space-x-1">
                            <Globe className="h-4 w-4" />
                            <span>React + Django</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center space-x-1">
                            <Database className="h-4 w-4" />
                            <span>PostgreSQL</span>
                        </span>
                    </div>
                </div>

                {/* Recruiter Welcome Card */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 mb-6 text-white shadow-xl">
                    <div className="flex items-start mb-4">
                        <Briefcase className="h-6 w-6 mr-3 mt-1 flex-shrink-0" />
                        <div>
                            <h3 className="font-bold text-lg mb-2">Welcome, Recruiters! 👋</h3>
                            <p className="text-blue-100 text-sm leading-relaxed">
                                This is a full-stack financial management system built to showcase modern web development skills. 
                                Explore the complete application with real-time data visualization, responsive design, and robust backend integration.
                            </p>
                        </div>
                    </div>
                    
                    {/* Demo Credentials */}
                    <div className="bg-white/15 backdrop-blur rounded-lg p-4 mb-4">
                        <div className="flex items-center mb-2">
                            <Info className="h-4 w-4 mr-2" />
                            <span className="font-medium text-sm">Demo Credentials</span>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center">
                                <span className="text-blue-100">Username:</span>
                                <code className="bg-white/20 px-2 py-1 rounded font-mono">admin</code>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-blue-100">Password:</span>
                                <code className="bg-white/20 px-2 py-1 rounded font-mono">admin123</code>
                            </div>
                        </div>
                    </div>
                    
                    <button
                        onClick={handleDemoLogin}
                        className="w-full bg-white/20 hover:bg-white/30 backdrop-blur rounded-lg py-2.5 px-4 text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 border border-white/20"
                    >
                        <Eye className="h-4 w-4" />
                        <span>Auto-fill Demo Credentials</span>
                    </button>
                </div>

                {/* Login Form */}
                <div className="bg-white py-8 px-6 shadow-2xl rounded-xl border border-gray-100">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                                Username
                            </label>
                            <div className="relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    required
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    placeholder="Enter your username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <div className="relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
                                <span className="block sm:inline">{error}</span>
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-[1.02]"
                            >
                                Sign In to Dashboard
                            </button>
                        </div>
                    </form>
                </div>

                {/* Features Preview */}
                <div className="mt-8 bg-gray-50 rounded-xl p-6">
                    <h4 className="text-center text-sm font-medium text-gray-700 mb-4">
                        🚀 Application Features
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                        <div className="flex items-center space-x-2">
                            <span className="text-lg">📊</span>
                            <span>Financial Analytics & Reports</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="text-lg">📱</span>
                            <span>Mobile-First Design</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="text-lg">🔐</span>
                            <span>JWT Authentication</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="text-lg">⚡</span>
                            <span>Real-time Data Updates</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="text-lg">🗄️</span>
                            <span>PostgreSQL Database</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="text-lg">🎨</span>
                            <span>Modern UI/UX</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-500">
                        Built with React, TypeScript, Django REST & PostgreSQL
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        Deployed on Render (Backend) & Vercel (Frontend)
                    </p>
                </div>
            </div>
        </div>
    );
};