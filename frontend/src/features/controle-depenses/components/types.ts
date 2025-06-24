// frontend/src/features/controle-depenses/components/types.ts

export interface ControleFilterValues {
    articleSearch: string;
    selectedProject: string;
}

export interface ControleFiltersProps {
    values: Partial<ControleFilterValues>;
    projects?: string[];
    onChange: (values: Partial<ControleFilterValues>) => void;
    onReset: () => void;
}