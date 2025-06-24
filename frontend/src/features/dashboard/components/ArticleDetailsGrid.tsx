import React from 'react';
import { ProjectArticleMetricsCard } from './ProjectArticleMetricsCard';
import { ProjectArticleMetrics } from '@/types';

interface ArticleDetailsGridProps {
    filteredArticles: ProjectArticleMetrics[];
}

export const ArticleDetailsGrid: React.FC<ArticleDetailsGridProps> = ({ 
    filteredArticles 
}) => (
    <div className="space-y-4">
        <h2 className="text-xl font-bold">Détails des Articles</h2>
        {filteredArticles.length === 0 ? (
            <div className="text-center text-gray-500 p-4">
                Aucun article trouvé. Veuillez ajuster vos filtres.
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredArticles.map(article => (
                    <ProjectArticleMetricsCard
                        key={`${article.numero_article}-${article.code_projet}`}
                        article={article}
                    />
                ))}
            </div>
        )}
    </div>
);