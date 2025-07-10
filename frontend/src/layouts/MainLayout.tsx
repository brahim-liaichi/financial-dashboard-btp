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
    Menu,
    X,
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
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Mobile menu overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={closeMobileMenu}></div>
                    <div className="relative flex-1 flex flex-col max-w-xs w-full bg-gray-800">
                        <div className="absolute top-0 right-0 -mr-12 pt-2">
                            <button
                                type="button"
                                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                                onClick={closeMobileMenu}
                            >
                                <span className="sr-only">Close sidebar</span>
                                <X className="h-6 w-6 text-white" aria-hidden="true" />
                            </button>
                        </div>
                        <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                            <div className="flex-shrink-0 flex items-center px-4">
                                <img 
                                    src={LogoImage} 
                                    alt="Company Logo" 
                                    className="w-32 h-auto"
                                    style={{
                                        maxHeight: '40px', 
                                        objectFit: 'contain'
                                    }}
                                />
                            </div>
                            <div className="px-4 mt-2">
                                <h1 className="text-lg font-bold text-white">
                                    Financial Dashboard
                                </h1>
                            </div>
                            <nav className="mt-5 px-2 space-y-1">
                                {navigation.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <NavLink
                                            key={item.name}
                                            to={item.path}
                                            onClick={closeMobileMenu}
                                            className={({ isActive }) => `
                                                group flex items-center px-2 py-2 text-base font-medium rounded-md
                                                ${isActive
                                                    ? 'bg-gray-900 text-white'
                                                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                                }
                                            `}
                                        >
                                            <Icon 
                                                className="mr-4 h-6 w-6 flex-shrink-0"
                                                aria-hidden="true"
                                            />
                                            {item.name}
                                        </NavLink>
                                    );
                                })}
                            </nav>
                        </div>
                        <div className="flex-shrink-0 flex bg-gray-700 p-4">
                            <div className="flex items-center justify-between w-full">
                                <span className="text-sm text-gray-300">
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
            )}

            {/* Desktop sidebar */}
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

            {/* Mobile header */}
            <div className="md:hidden">
                <div className="flex items-center justify-between px-4 py-2 bg-gray-800">
                    <div className="flex items-center">
                        <button
                            type="button"
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                            aria-controls="mobile-menu"
                            aria-expanded="false"
                            onClick={() => setIsMobileMenuOpen(true)}
                        >
                            <span className="sr-only">Open main menu</span>
                            <Menu className="block h-6 w-6" aria-hidden="true" />
                        </button>
                        <img 
                            src={LogoImage} 
                            alt="Company Logo" 
                            className="ml-4 w-24 h-auto"
                            style={{
                                maxHeight: '30px', 
                                objectFit: 'contain'
                            }}
                        />
                    </div>
                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-300">{user?.username}</span>
                        <button
                            onClick={handleLogout}
                            className="text-gray-300 hover:text-white p-2"
                            title="Déconnexion"
                        >
                            <LogOut className="h-5 w-5" aria-hidden="true" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className={`flex flex-col flex-1 transition-all duration-300 ${
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