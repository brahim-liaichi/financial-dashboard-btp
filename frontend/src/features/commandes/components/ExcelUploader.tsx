// frontend/src/features/commandes/components/ExcelUploader.tsx

import React, { useState } from 'react';
import { Upload, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { commandesApi } from '@/api/endpoints/commandes';

interface ExcelUploaderProps {
    onUploadSuccess: () => void;
    onUploadError?: (error: string) => void;
}

export const ExcelUploader: React.FC<ExcelUploaderProps> = ({ 
    onUploadSuccess, 
    onUploadError 
}) => {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const validateFile = (selectedFile: File): boolean => {
        // Validate file type
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
            'application/vnd.ms-excel',
            'application/excel',
            'application/vnd.ms-office'
        ];
        
        if (!validTypes.includes(selectedFile.type)) {
            setError('Veuillez sélectionner un fichier Excel valide (.xlsx, .xls)');
            return false;
        }

        // Validate file size (limit to 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (selectedFile.size > maxSize) {
            setError('La taille du fichier ne doit pas dépasser 10 Mo');
            return false;
        }

        return true;
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            // Reset previous errors
            setError(null);

            // Validate file
            if (validateFile(selectedFile)) {
                setFile(selectedFile);
            }
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setLoading(true);
        setError(null);

        try {
            // Use API method for better error handling
            await commandesApi.importExcel(file);

            // Reset file input
            setFile(null);

            // Trigger success callback
            onUploadSuccess();
        } catch (err: unknown) {
            // Enhanced error handling
            let errorMessage = 'Échec du téléchargement du fichier. Veuillez réessayer.';

            if (err instanceof Error) {
                // If it's an Error object, use its message
                errorMessage = err.message;
                
                // Log detailed error information
                console.error('Excel Import Error:', {
                    message: err.message,
                    name: err.name,
                    stack: err.stack
                });
            } else if (typeof err === 'string') {
                // If it's a string error
                errorMessage = err;
            }

            // Set error state
            setError(errorMessage);

            // Optional: call error callback if provided
            onUploadError?.(errorMessage);
        } finally {
            // Always stop loading
            setLoading(false);
        }
    };

    const triggerFileInput = () => {
        document.getElementById('file-upload')?.click();
    };

    return (
        <div className="p-4 border border-gray-200 rounded-lg shadow-sm">
            <div className="flex flex-col items-center gap-4">
                <div
                    className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 text-center 
                        cursor-pointer hover:border-blue-400 transition-colors group"
                    onClick={triggerFileInput}
                >
                    <FileSpreadsheet 
                        className="mx-auto h-12 w-12 text-gray-400 
                        group-hover:text-blue-500 transition-colors"
                    />
                    <p className="mt-2 text-sm text-gray-600 group-hover:text-blue-600">
                        Cliquez pour sélectionner ou glissez-déposez
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                        Fichiers Excel uniquement (.xlsx, .xls)
                    </p>
                </div>

                <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                />

                {file && (
                    <div className="flex items-center gap-2 bg-blue-50 p-2 rounded-md">
                        <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                        <span className="text-sm text-gray-700">
                            {file.name} ({Math.round(file.size / 1024)} Ko)
                        </span>
                    </div>
                )}

                {error && (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 p-2 rounded-md">
                        <AlertCircle className="h-5 w-5" />
                        <span className="text-sm">{error}</span>
                    </div>
                )}

                <Button
                    variant="primary"
                    disabled={!file || loading}
                    onClick={handleUpload}
                    loading={loading}
                    icon={Upload}
                >
                    Téléverser le fichier Excel
                </Button>
            </div>
        </div>
    );
};