import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
    LayoutDashboard, 
    FileText, 
    Calculator,
    //Users,  // Added Users icon
    LogOut,
    ChevronLeft,
    ChevronRight,
    type LucideIcon
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import LogoImage from '@/assets/logo.png';

interface MainLayoutProps {
    children: React.ReactNode;
}

interface NavigationItem {
    name: string;
    path: string;
    icon: LucideIcon;
}

const navigation: NavigationItem[] = [
    {
        name: 'Dashboard',
        path: '/',
        icon: LayoutDashboard
    },
    {
        name: 'Commandes',
        path: '/commandes',
        icon: FileText
    },
    {
        name: 'Contrôle Dépenses',
        path: '/controle',
        icon: Calculator
    },
    // {
    //     name: 'Utilisateurs',  // Added Users navigation item
    //     path: '/users',
    //     icon: Users
    // }
];

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const { user, logout } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const handleLogout = async () => {
        await logout();
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <div className={`hidden md:fixed md:inset-y-0 md:flex md:flex-col transition-all duration-300 ease-in-out ${
                isCollapsed ? 'md:w-16' : 'md:w-64'
            }`}>
                <div className="flex min-h-0 flex-1 flex-col bg-gray-800">
                    <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
                        <div className="flex flex-col flex-shrink-0 items-center px-4 relative">
                            <div className="flex items-center justify-center w-full mb-4">
                                <img 
                                    src={LogoImage} 
                                    alt="Company Logo" 
                                    className={`transition-all duration-300 ${
                                        isCollapsed ? 'w-8 h-8' : 'w-40 h-auto'
                                    }`}
                                    style={{
                                        maxHeight: '50px', 
                                        objectFit: 'contain'
                                    }}
                                />
                            </div>
                            <div className="relative w-full">
                                <h1 className={`text-xl font-bold text-white text-center transition-opacity duration-300 ${
                                    isCollapsed ? 'opacity-0' : 'opacity-100'
                                }`}>
                                    Financial Dashboard
                                </h1>
                                <button
                                    onClick={() => setIsCollapsed(!isCollapsed)}
                                    className={`absolute text-white hover:text-gray-300 transition-all duration-300 ${
                                        isCollapsed ? 'right-0' : '-right-2'
                                    }`}
                                >
                                    {isCollapsed ? (
                                        <ChevronRight className="h-6 w-6" />
                                    ) : (
                                        <ChevronLeft className="h-6 w-6" />
                                    )}
                                </button>
                            </div>
                        </div>
                        <nav className="mt-5 flex-1 space-y-1 px-2">
                            {navigation.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <NavLink
                                        key={item.name}
                                        to={item.path}
                                        className={({ isActive }) => `
                                            group flex items-center px-2 py-2 text-sm font-medium rounded-md
                                            ${isActive
                                                ? 'bg-gray-900 text-white'
                                                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                            }
                                        `}
                                        title={isCollapsed ? item.name : ''}
                                    >
                                        <Icon 
                                            className={`h-6 w-6 flex-shrink-0 ${
                                                isCollapsed ? '' : 'mr-3'
                                            }`}
                                            aria-hidden="true"
                                        />
                                        <span className={`transition-opacity duration-300 ${
                                            isCollapsed ? 'opacity-0 w-0' : 'opacity-100'
                                        }`}>
                                            {item.name}
                                        </span>
                                    </NavLink>
                                );
                            })}
                        </nav>
                    </div>
                    <div className="flex flex-shrink-0 bg-gray-700 p-4">
                        <div className="flex items-center justify-between w-full">
                            <span className={`text-sm text-gray-300 transition-opacity duration-300 ${
                                isCollapsed ? 'opacity-0 w-0' : 'opacity-100'
                            }`}>
                                {user?.username}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="text-gray-300 hover:text-white"
                                title="Déconnexion"
                            >
                                <LogOut className="h-5 w-5" aria-hidden="true" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className={`md:flex flex-col flex-1 transition-all duration-300 ${
                isCollapsed ? 'md:pl-16' : 'md:pl-64'
            }`}>
                <main className="flex-1">
                    <div className="py-6">
                        <div className="max-w-full mx-auto px-4 sm:px-6 md:px-8">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};