import React, { useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FacturationTables } from '../features/facturation/components/FacturationTables';
import { useFacturation } from '@/hooks/useFacturation';
import type { FacturationData, AvancementData } from '@/hooks/useFacturation';


// Add index signature to types with proper type safety
interface ExtendedFacturationData extends FacturationData, Record<string, unknown> {
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

interface ExtendedAvancementData extends AvancementData, Record<string, unknown> {
    id: number;
    doc_type: string;
    doc_num: string;
    accounting_date: string;
    payment_ht: number;
    payment_ttc: number;
    payment_method: string;
    canceled: string;
}
export const FacturationPage: React.FC = () => {
    const { projectCode } = useParams<{ projectCode: string }>();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const { 
        tables, 
        isLoading, 
        error, 
        fetchTables,
        uploadExcel 
    } = useFacturation({
        onError: (err) => {
            console.error('Excel upload error:', err.message);
        },
        onSuccess: (message) => {
            console.log('Excel upload success:', message);
            if (projectCode) {
                fetchTables(projectCode);
            }
        }
    });

    const loadTables = useCallback(() => {
        if (projectCode) {
            fetchTables(projectCode).catch(err => {
                console.error('Failed to fetch tables:', err);
            });
        }
    }, [projectCode, fetchTables]);

    useEffect(() => {
        loadTables();
    }, [loadTables]);

    const handleBack = () => {
        navigate(-1);
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (tables?.facturation.length) {
                if (!window.confirm(
                    'Des données existent déjà pour ce projet. Veuillez les supprimer avant d\'importer de nouvelles données.'
                )) {
                    if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                    }
                    return;
                }
            }
    
            try {
                await uploadExcel(file);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            } catch (err) {
                console.error('Excel upload failed:', err);
            }
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    // Type-safe data mapping with proper null checks
    const facturationData: ExtendedFacturationData[] = tables?.facturation?.map(item => ({
        ...item,
        id: item.id,
        document_number: item.document_number,
        registration_date: item.registration_date,
        document_status: item.document_status,
        client_name: item.client_name,
        description: item.description,
        quantity: item.quantity,
        price: item.price,
        total_after_discount: item.total_after_discount,
    })) || [];

    const avancementData: ExtendedAvancementData[] = tables?.avancement?.map(item => ({
        ...item,
        id: item.id,
        doc_type: item.doc_type,
        doc_num: item.doc_num,
        accounting_date: item.accounting_date,
        payment_ht: item.payment_ht,
        payment_ttc: item.payment_ttc,
        payment_method: item.payment_method,
        canceled: item.canceled,
    })) || [];

    return (
        <div className="container mx-auto py-6 space-y-6">
            <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".xlsx, .xls"
                className="hidden"
            />

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button 
                        variant="secondary" 
                        onClick={handleBack}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Retour
                    </Button>
                    <h1 className="text-2xl font-bold">
                        Détails Facturation
                    </h1>
                </div>
                
                <Button 
                    variant="secondary" 
                    onClick={triggerFileInput}
                    disabled={isLoading}
                >
                    <Upload className="h-4 w-4 mr-2" />
                    Importer Excel
                </Button>
            </div>

            

            {error && (
                <Card className="bg-red-50 border-red-200">
                    <div className="p-4 text-red-700">
                        {error.message}
                    </div>
                </Card>
            )}

            <FacturationTables
                facturationData={facturationData}
                avancementData={avancementData}
                isLoading={isLoading}
            />
        </div>
    );
};