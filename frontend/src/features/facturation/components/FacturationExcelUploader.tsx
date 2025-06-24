// Path: frontend/src/features/controle-depenses/components/FacturationExcelUploader.tsx

import { useState, useRef } from 'react';
import { Upload, FileUp, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useFacturation } from '@/hooks/useFacturation';

interface FacturationExcelUploaderProps {
    onUploadSuccess?: (result: {
        facturation_count: number;
        avancement_count: number;
    }) => void;
    onUploadError?: (error: Error) => void;
}

interface UploadState {
    status: 'idle' | 'uploading' | 'success' | 'error';
    message?: string;
}

export const FacturationExcelUploader = ({
    onUploadSuccess,
    onUploadError
}: FacturationExcelUploaderProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadState, setUploadState] = useState<UploadState>({
        status: 'idle'
    });

    const { uploadExcel, isLoading } = useFacturation({
        onError: (error) => {
            setUploadState({
                status: 'error',
                message: error.message
            });
            onUploadError?.(error);
        },
        onSuccess: (message) => {
            setUploadState({
                status: 'success',
                message
            });
        }
    });

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
            setUploadState({
                status: 'error',
                message: 'Please upload an Excel file (.xlsx or .xls)'
            });
            return;
        }

        try {
            setUploadState({
                status: 'uploading',
                message: 'Uploading file...'
            });

            const result = await uploadExcel(file);
            
            onUploadSuccess?.(result);

        } catch (error) {
            console.error('Upload failed:', error);
        } finally {
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="w-full space-y-4">
            {/* Hidden file input */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".xlsx,.xls"
                className="hidden"
            />

            {/* Upload button */}
            <Button 
                onClick={handleClick}
                className="w-full"
                disabled={isLoading}
                variant={uploadState.status === 'success' ? 'secondary' : 'primary'}
            >
                {isLoading ? (
                    <Upload className="mr-2 h-4 w-4 animate-spin" />
                ) : uploadState.status === 'success' ? (
                    <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                ) : (
                    <FileUp className="mr-2 h-4 w-4" />
                )}
                {isLoading 
                    ? 'Uploading...' 
                    : uploadState.status === 'success'
                    ? 'Upload Another File'
                    : 'Upload Facturation Excel'
                }
            </Button>

            {/* Status messages */}
            {(uploadState.status === 'error' || uploadState.status === 'success') && 
             uploadState.message && (
                <div className={`p-4 rounded-lg ${
                    uploadState.status === 'error' 
                        ? 'bg-red-50 text-red-700 border border-red-200' 
                        : 'bg-green-50 text-green-700 border border-green-200'
                }`}>
                    <p>{uploadState.message}</p>
                </div>
            )}

            {/* Instructions */}
            <div className="text-sm text-gray-500">
                <p>Please ensure your Excel file contains:</p>
                <ul className="list-disc list-inside">
                    <li>A "Facturation" sheet</li>
                    <li>An "Avancement" sheet</li>
                    <li>All required fields in each sheet</li>
                </ul>
            </div>
        </div>
    );
};