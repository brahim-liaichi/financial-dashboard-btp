import React, { useMemo } from 'react';
import { Table } from '@/components/ui/Table';
import { TableColumn } from '@/types';
import { Card } from '@/components/ui/Card';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { FacturationData, AvancementData } from '@/hooks/useFacturation';

interface ExtendedFacturationData extends Record<string, unknown> {
    paymentStatus?: { color: string; title: string };
    id: number;
    document_number: string;
    registration_date: string;
    document_status: string;
    client_name: string;
    description: string;
    quantity: number;
    price: number;
    total_after_discount: number;
}

interface ExtendedAvancementData extends Record<string, unknown> {
    id: number;
    doc_type: string;
    doc_num: string;
    accounting_date: string;
    payment_ht: number;
    payment_ttc: number;
    payment_method: string;
    canceled: string;
}

interface FacturationTablesProps {
    facturationData: FacturationData[];
    avancementData: AvancementData[];
    isLoading?: boolean;
}

export const FacturationTables: React.FC<FacturationTablesProps> = ({
    facturationData,
    avancementData,
    isLoading = false
}) => {
    // Compute payment status
    const facturationWithStatus = useMemo(() => {
        return facturationData.map(facturation => {
            // Calculate days since registration
            const registrationDate = new Date(facturation.registration_date);
            const currentDate = new Date();
            const daysSinceRegistration = Math.floor(
                (currentDate.getTime() - registrationDate.getTime()) / (1000 * 3600 * 24)
            );

            // Find matching avancement entry
            const matchingAvancement = avancementData.find(
                avancement => Number(avancement.payment_ht) === Number(facturation.total_after_discount)
            );

            // Determine status color
            let statusColor = '';
            let statusTitle = '';

            if (!matchingAvancement) {
                // Not in Avancement table
                statusColor = daysSinceRegistration <= 60 ? 'bg-orange-500' : 'bg-red-500';
                statusTitle = daysSinceRegistration <= 60 
                    ? 'En attente de paiement (< 60 jours)' 
                    : 'Paiement en retard (> 60 jours)';
            } else {
                // In Avancement table
                const avancementDate = new Date(matchingAvancement.accounting_date);
                const daysBetweenRegistrationAndPayment = Math.floor(
                    (avancementDate.getTime() - registrationDate.getTime()) / (1000 * 3600 * 24)
                );

                if (daysBetweenRegistrationAndPayment <= 60) {
                    // Paid within 60 days
                    statusColor = 'bg-green-600';
                    statusTitle = 'Payé dans les délais';
                } else {
                    // Paid after 60 days
                    statusColor = 'bg-green-300';
                    statusTitle = 'Payé avec retard';
                }
            }

            return {
                ...facturation,
                paymentStatus: { color: statusColor, title: statusTitle }
            } as ExtendedFacturationData;
        });
    }, [facturationData, avancementData]);

    // Map avancement data to ExtendedAvancementData
    const extendedAvancementData = useMemo(() => {
        return avancementData.map(item => ({
            ...item,
            id: item.id,
            doc_type: item.doc_type,
            doc_num: item.doc_num,
            accounting_date: item.accounting_date,
            payment_ht: item.payment_ht,
            payment_ttc: item.payment_ttc,
            payment_method: item.payment_method,
            canceled: item.canceled
        } as ExtendedAvancementData));
    }, [avancementData]);

    const facturationColumns: TableColumn<ExtendedFacturationData>[] = [
        {
            key: 'paymentStatus',
            title: 'Statut',
            width: '80px',
            render: (item) => {
                const statusInfo = item.paymentStatus;
                return statusInfo ? (
                    <span 
                        className={`inline-block w-4 h-4 rounded-full ${statusInfo.color}`}
                        title={statusInfo.title}
                    />
                ) : null;
            }
        },
        {
            key: 'document_number',
            title: 'N° Document',
            width: '120px'
        },
        {
            key: 'registration_date',
            title: 'Date',
            render: (item) => formatDate(item.registration_date),
            width: '100px'
        },
        {
            key: 'document_status',
            title: 'Status',
            width: '80px'
        },
        {
            key: 'client_name',
            title: 'Client',
            width: '200px'
        },
        {
            key: 'description',
            title: 'Description',
        },
        {
            key: 'quantity',
            title: 'Quantité',
            align: 'right',
            width: '100px'
        },
        {
            key: 'price',
            title: 'Prix',
            render: (item) => formatCurrency(item.price),
            align: 'right',
            width: '120px'
        },
        {
            key: 'total_after_discount',
            title: 'Total',
            render: (item) => formatCurrency(item.total_after_discount),
            align: 'right',
            width: '120px'
        }
    ];

    const avancementColumns: TableColumn<ExtendedAvancementData>[] = [
        {
            key: 'doc_type',
            title: 'Type',
            width: '100px'
        },
        {
            key: 'doc_num',
            title: 'N° Document',
            width: '120px'
        },
        {
            key: 'accounting_date',
            title: 'Date Comptable',
            render: (item) => formatDate(item.accounting_date),
            width: '120px'
        },
        {
            key: 'payment_ht',
            title: 'Montant HT',
            render: (item) => formatCurrency(item.payment_ht),
            align: 'right',
            width: '120px'
        },
        {
            key: 'payment_ttc',
            title: 'Montant TTC',
            render: (item) => formatCurrency(item.payment_ttc),
            align: 'right',
            width: '120px'
        },
        {
            key: 'payment_method',
            title: 'Méthode',
            width: '100px'
        },
        {
            key: 'canceled',
            title: 'État',
            render: (item) => item.canceled === 'N' ? 'Actif' : 'Annulé',
            width: '80px'
        }
    ];

    return (
        <div className="space-y-6">
            {/* Facturation Table */}
            <Card>
                <div className="p-6">
                    <h2 className="text-lg font-semibold mb-4">Facturation</h2>
                    <div className="w-full overflow-x-auto">
                        <Table
                            data={facturationWithStatus}
                            columns={facturationColumns}
                            loading={isLoading}
                            emptyMessage="Aucune facturation trouvée"
                        />
                    </div>
                </div>
            </Card>

            {/* Avancement Table */}
            <Card>
                <div className="p-6">
                    <h2 className="text-lg font-semibold mb-4">Règlement</h2>
                    <div className="w-full overflow-x-auto">
                        <Table
                            data={extendedAvancementData}
                            columns={avancementColumns}
                            loading={isLoading}
                            emptyMessage="Aucun avancement trouvé"
                        />
                    </div>
                </div>
            </Card>

            {/* Légende des Statuts de Paiement */}
            <Card>
                <div className="p-4">
                    <h3 className="text-md font-semibold mb-3">Légende des Statuts de Paiement</h3>
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <span className="inline-block w-4 h-4 rounded-full bg-orange-500"></span>
                            <span>En attente de paiement (moins de 60 jours)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="inline-block w-4 h-4 rounded-full bg-red-500"></span>
                            <span>Paiement en retard (plus de 60 jours)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="inline-block w-4 h-4 rounded-full bg-green-600"></span>
                            <span>Payé dans les délais (moins de 60 jours)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="inline-block w-4 h-4 rounded-full bg-green-300"></span>
                            <span>Payé avec retard (plus de 60 jours)</span>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};