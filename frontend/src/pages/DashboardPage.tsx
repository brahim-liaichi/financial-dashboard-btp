import React, { useCallback } from 'react';
import { useDashboard } from '@/hooks/useDashboard';
import { DashboardFilter } from '@/features/dashboard/components/DashboardFilter';
import { TopArticlesChart } from '@/features/dashboard/components/TopArticlesChart';
import { ArticleDetailsGrid } from '@/features/dashboard/components/ArticleDetailsGrid';
import { LoadingState } from '@/features/dashboard/components/LoadingState';
import { ErrorState } from '@/features/dashboard/components/ErrorState';

export const DashboardPage: React.FC = () => {
    const {
        projectArticles,
        filteredArticles,
        state,
        fetchDashboardData,
        topFiveArticles,
        setSelectedProject,
        setArticleSearch,
        selectedProject,
        articleSearch
    } = useDashboard();

    // Handlers with useCallback for performance
    const handleProjectChange = useCallback((project: string) => {
        console.log('Handling project change:', project);
        setSelectedProject(project);
    }, [setSelectedProject]);

    const handleArticleSearch = useCallback((search: string) => {
        console.log('Handling article search:', search);
        setArticleSearch(search);
    }, [setArticleSearch]);

    const handleResetFilters = useCallback(() => {
        console.log('Resetting filters');
        setSelectedProject('');
        setArticleSearch('');
    }, [setSelectedProject, setArticleSearch]);

    // Render based on state
    if (state.loading) return <LoadingState />;
    if (state.error) return <ErrorState error={state.error} onRetry={fetchDashboardData} />;

    // Main dashboard render
    return (
        <div className="space-y-6 p-4">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">
                    Tableau de Bord Financier
                </h1>
            </div>

            <DashboardFilter
                projectArticles={projectArticles}
                selectedProject={selectedProject}
                articleSearch={articleSearch}
                onProjectChange={handleProjectChange}
                onArticleSearch={handleArticleSearch}
                onReset={handleResetFilters}
            />

            <div className="space-y-6">
                {topFiveArticles && topFiveArticles.length > 0 && (
                    <TopArticlesChart 
                        topFiveArticles={topFiveArticles} 
                        className="w-full" 
                    />
                )}

                <ArticleDetailsGrid 
                    filteredArticles={filteredArticles} 
                />
            </div>
        </div>
    );
};