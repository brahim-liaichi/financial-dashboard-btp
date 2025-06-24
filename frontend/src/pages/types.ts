// frontend/src/pages/types.ts

export interface PageHeaderProps {
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
}


export interface DashboardMetrics {
    totalCommandes: number;
    totalAmount: number;
    depensesEngagees: number;
    depensesFacturees: number;
    rentabiliteMoyenne: number;
}

export interface PageState {
    loading: boolean;
    error: string | null;
}
