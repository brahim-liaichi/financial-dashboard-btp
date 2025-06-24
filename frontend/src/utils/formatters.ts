// frontend/src/utils/formatters.ts

export const formatCurrency = (
    amount: number | null | undefined,
    currency: string = 'MAD',
    locale: string = 'fr-FR'
): string => {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(amount));
};

export const formatDate = (
    date: string | Date | null | undefined,
    locale: string = 'fr-FR'
): string => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

export const formatPercentage = (
    value: number | string | null | undefined,
    minimumFractionDigits: number = 1
): string => {
    const numValue = Number(value);
    if (isNaN(numValue)) return '0.00%';
    return `${numValue.toFixed(minimumFractionDigits)}%`;
};

export const formatNumber = (
    value: number | null | undefined,
    locale: string = 'fr-FR'
): string => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat(locale).format(Number(value));
};

export const formatStatus = (status: string | null | undefined): string => {
    if (!status) return '-';
    const statusMap: Record<string, string> = {
        'O': 'Ouvert',
        'C': 'Fermé',
        'P': 'En cours',
    };
    return statusMap[status] || status;
};

// Chart-specific formatters
export const formatChartDate = (
    date: string | Date,
    locale: string = 'fr-FR'
): string => {
    const d = new Date(date);
    return d.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'short'
    });
};

export const formatChartTooltipDate = (
    date: string | Date,
    locale: string = 'fr-FR'
): string => {
    const d = new Date(date);
    return d.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long'
    });
};

export const formatChartValue = (
    value: number,
    locale: string = 'fr-FR',
    currency: string = 'MAD'
): string => {
    const absValue = Math.abs(value);
    
    if (absValue >= 1000000) {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency,
            notation: 'compact',
            maximumFractionDigits: 1
        }).format(value);
    }
    
    return formatCurrency(value, currency, locale);
};