import React from 'react';
import { Calendar } from 'lucide-react';

interface DatePickerProps {
    label?: string;
    value: string;
    onChange: (date: string) => void;
    error?: string;
    min?: string;
    max?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
    label,
    value,
    onChange,
    error,
    min,
    max
}) => {
    // Add logging to help diagnose the issue
    React.useEffect(() => {
        console.log('DatePicker Props:', { 
            value, 
            min, 
            max,
            valueType: typeof value,
            valueIsValidDate: /^\d{4}-\d{2}-\d{2}$/.test(value)
        });
    }, [value, min, max]);

    return (
        <div>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                </label>
            )}
            <div className="relative">
                <input
                    type="date"
                    value={value}
                    onChange={(e) => {
                        console.log('DatePicker onChange:', {
                            inputValue: e.target.value
                        });
                        onChange(e.target.value);
                    }}
                    min={min}
                    max={max}
                    className={`
                        block w-full pl-10 rounded-md shadow-sm
                        ${error
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                        }
                    `}
                />
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Calendar className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
            </div>
            {error && (
                <p className="mt-2 text-sm text-red-500">{error}</p>
            )}
        </div>
    );
};