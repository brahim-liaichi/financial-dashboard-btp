import React from 'react';
import { Card } from '@/components/ui/Card';
import type { DebugEntry } from '@/types';

interface DebugDataViewerProps {
    controleEvolutionDebug?: DebugEntry;
    facturationEvolutionDebug?: DebugEntry;
    apiResponses?: {
        controleEndpoint?: unknown;
        facturationEndpoint?: unknown;
    };
}

const DebugDataViewer: React.FC<DebugDataViewerProps> = ({
    controleEvolutionDebug,
    facturationEvolutionDebug,
    apiResponses
}) => {
    return (
        <Card className="p-4 mt-4 bg-gray-50">
            <div className="space-y-4">
                {/* API Responses Section */}
                <div>
                    <h3 className="font-semibold text-lg mb-2">API Responses</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h4 className="font-medium">Controle Endpoint</h4>
                            <pre className="bg-white p-2 rounded overflow-auto max-h-60 text-xs">
                                {JSON.stringify(apiResponses?.controleEndpoint, null, 2)}
                            </pre>
                        </div>
                        <div>
                            <h4 className="font-medium">Facturation Endpoint</h4>
                            <pre className="bg-white p-2 rounded overflow-auto max-h-60 text-xs">
                                {JSON.stringify(apiResponses?.facturationEndpoint, null, 2)}
                            </pre>
                        </div>
                    </div>
                </div>

                {/* Evolution Data Processing Section */}
                <div>
                    <h3 className="font-semibold text-lg mb-2">Evolution Data Processing</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {/* Controle Evolution */}
                        <div>
                            <h4 className="font-medium">Controle Evolution</h4>
                            <div className="space-y-2">
                                <div>
                                    <span className="font-medium">Timestamp: </span>
                                    {controleEvolutionDebug?.timestamp}
                                </div>
                                <div>
                                    <span className="font-medium">Input Data: </span>
                                    <pre className="bg-white p-2 rounded overflow-auto max-h-40 text-xs">
                                        {JSON.stringify(controleEvolutionDebug?.inputData, null, 2)}
                                    </pre>
                                </div>
                                {controleEvolutionDebug?.transformations && (
                                    <div>
                                        <span className="font-medium">Transformations: </span>
                                        <pre className="bg-white p-2 rounded overflow-auto max-h-40 text-xs">
                                            {JSON.stringify(controleEvolutionDebug.transformations, null, 2)}
                                        </pre>
                                    </div>
                                )}
                                <div>
                                    <span className="font-medium">Output Data: </span>
                                    <pre className="bg-white p-2 rounded overflow-auto max-h-40 text-xs">
                                        {JSON.stringify(controleEvolutionDebug?.outputData, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        </div>

                        {/* Facturation Evolution */}
                        <div>
                            <h4 className="font-medium">Facturation Evolution</h4>
                            <div className="space-y-2">
                                <div>
                                    <span className="font-medium">Timestamp: </span>
                                    {facturationEvolutionDebug?.timestamp}
                                </div>
                                <div>
                                    <span className="font-medium">Input Data: </span>
                                    <pre className="bg-white p-2 rounded overflow-auto max-h-40 text-xs">
                                        {JSON.stringify(facturationEvolutionDebug?.inputData, null, 2)}
                                    </pre>
                                </div>
                                {facturationEvolutionDebug?.transformations && (
                                    <div>
                                        <span className="font-medium">Transformations: </span>
                                        <pre className="bg-white p-2 rounded overflow-auto max-h-40 text-xs">
                                            {JSON.stringify(facturationEvolutionDebug.transformations, null, 2)}
                                        </pre>
                                    </div>
                                )}
                                <div>
                                    <span className="font-medium">Output Data: </span>
                                    <pre className="bg-white p-2 rounded overflow-auto max-h-40 text-xs">
                                        {JSON.stringify(facturationEvolutionDebug?.outputData, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Warnings and Errors Section */}
                {Boolean(
                    (controleEvolutionDebug?.warnings?.length ?? 0) > 0 ||
                    (controleEvolutionDebug?.errors?.length ?? 0) > 0 ||
                    (facturationEvolutionDebug?.warnings?.length ?? 0) > 0 ||
                    (facturationEvolutionDebug?.errors?.length ?? 0) > 0
                ) && (
                        <div>
                            <h3 className="font-semibold text-lg mb-2">Warnings & Errors</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {/* Controle Warnings & Errors */}
                                <div>
                                    {(controleEvolutionDebug?.warnings?.length ?? 0) > 0 && (
                                        <div className="text-yellow-600">
                                            <h4 className="font-medium">Controle Warnings:</h4>
                                            <ul className="list-disc pl-4">
                                                {controleEvolutionDebug?.warnings?.map((warning, idx) => (
                                                    <li key={idx}>{warning}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {(controleEvolutionDebug?.errors?.length ?? 0) > 0 && (
                                        <div className="text-red-600">
                                            <h4 className="font-medium">Controle Errors:</h4>
                                            <ul className="list-disc pl-4">
                                                {controleEvolutionDebug?.errors?.map((error, idx) => (
                                                    <li key={idx}>{error}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                {/* Facturation Warnings & Errors */}
                                <div>
                                    {(facturationEvolutionDebug?.warnings?.length ?? 0) > 0 && (
                                        <div className="text-yellow-600">
                                            <h4 className="font-medium">Facturation Warnings:</h4>
                                            <ul className="list-disc pl-4">
                                                {facturationEvolutionDebug?.warnings?.map((warning, idx) => (
                                                    <li key={idx}>{warning}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {(facturationEvolutionDebug?.errors?.length ?? 0) > 0 && (
                                        <div className="text-red-600">
                                            <h4 className="font-medium">Facturation Errors:</h4>
                                            <ul className="list-disc pl-4">
                                                {facturationEvolutionDebug?.errors?.map((error, idx) => (
                                                    <li key={idx}>{error}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
            </div>
        </Card>
    );
};

export default DebugDataViewer;