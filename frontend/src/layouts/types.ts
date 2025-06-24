// frontend/src/layouts/types.ts

export interface MainLayoutProps {
    children: React.ReactNode;
}

export interface NavigationItem {
    name: string;
    path: string;
    icon: React.ComponentType;
}

export interface UserDropdownProps {
    user: {
        name: string;
        email: string;
        avatar?: string;
    };
}


