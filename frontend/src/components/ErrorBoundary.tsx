import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { logger } from '@/utils/logger'; // Import the logger we created earlier

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: (error: Error) => ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { 
            hasError: true,
            error 
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log the error using our centralized logger
        logger.error('Uncaught error in component', { 
            error: error.message, 
            componentStack: errorInfo.componentStack 
        });

        // Optional: Call custom error handler if provided
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }

        // Optionally send error to external error tracking service
        // errorTrackingService.captureException(error, { extra: errorInfo });
    }

    handleReset = () => {
        this.setState({ hasError: false, error: undefined });
    }

    render() {
        if (this.state.hasError) {
            // Use custom fallback if provided, otherwise use default
            if (this.props.fallback) {
                return this.props.fallback(this.state.error!);
            }

            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 p-4">
                    <div className="bg-white shadow-md rounded-lg p-8 max-w-md w-full">
                        <h2 className="text-2xl font-bold text-red-600 mb-4">
                            Erreur inattendue
                        </h2>
                        <p className="text-gray-700 mb-6">
                            Une erreur s'est produite dans l'application. 
                            Veuillez réessayer ou contacter le support technique.
                        </p>

                        {this.state.error && (
                            <details className="mb-6 bg-gray-100 p-4 rounded-md overflow-auto max-h-40">
                                <summary className="cursor-pointer text-gray-700 font-medium">
                                    Détails de l'erreur
                                </summary>
                                <pre className="text-xs text-gray-600 mt-2">
                                    {this.state.error.toString()}
                                </pre>
                            </details>
                        )}

                        <div className="flex justify-center space-x-4">
                            <Button 
                                variant="secondary" 
                                onClick={() => window.location.reload()}
                            >
                                Recharger la page
                            </Button>
                            <Button 
                                variant="primary" 
                                onClick={this.handleReset}
                            >
                                Réinitialiser
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

// Example of how to use the ErrorBoundary with a custom error handler
export const withErrorBoundary = <P extends object>(
    WrappedComponent: React.ComponentType<P>, 
    customErrorHandler?: (error: Error, errorInfo: ErrorInfo) => void
) => {
    return (props: P) => (
        <ErrorBoundary 
            onError={customErrorHandler}
            fallback={(error) => (
                <div>
                    <h1>Custom Error Handling</h1>
                    <p>{error.message}</p>
                </div>
            )}
        >
            <WrappedComponent {...props} />
        </ErrorBoundary>
    );
};