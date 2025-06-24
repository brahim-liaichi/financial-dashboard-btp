import React, { useMemo } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select, SelectOption } from '@/components/ui/Select';
import { ProjectArticleMetrics } from '@/types';

interface DashboardFilterProps {
    projectArticles: ProjectArticleMetrics[];
    selectedProject: string;
    articleSearch: string;
    onProjectChange: (project: string) => void;
    onArticleSearch: (search: string) => void;
    onReset: () => void;
}

export const DashboardFilter: React.FC<DashboardFilterProps> = ({
    projectArticles,
    selectedProject,
    articleSearch,
    onProjectChange,
    onArticleSearch,
    onReset
}) => {
    const availableProjects = useMemo(() => {
        const projects = projectArticles
            .map(article => article.code_projet)
            .filter(project => project && project !== 'Unknown' && project !== 'Others');
        return Array.from(new Set(projects)).sort();
    }, [projectArticles]);

    const projectOptions: SelectOption[] = useMemo(() => [
        { value: '', label: 'Tous les Projets' },
        ...availableProjects.map(project => ({
            value: project,
            label: project
        }))
    ], [availableProjects]);

    return (
        <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900">Filtres</h3>
            </div>
            <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                        label="Projet"
                        options={projectOptions}
                        value={selectedProject}
                        onChange={onProjectChange}
                        className="w-full"
                    />
                    <Input
                        label="Numéro d'article"
                        placeholder="Rechercher un article..."
                        value={articleSearch}
                        onChange={(e) => onArticleSearch(e.target.value)}
                        icon={Search}
                    />
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                    <Button
                        variant="secondary"
                        onClick={onReset}
                    >
                        Réinitialiser
                    </Button>
                </div>
            </div>
        </div>
    );
};