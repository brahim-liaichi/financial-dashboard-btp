import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useControle } from './useControle';
import {
    safeNumber,
    parseProjectArticle,
    ProjectArticleMetrics,
    PageState,
    ControleMetrics
} from '@/types';

// Utility function to check network connectivity
const isNetworkAvailable = (): boolean => {
    return navigator.onLine;
};

// Utility function for array validation
const isValidArray = <T>(arr: T[] | undefined): arr is T[] => 
    Array.isArray(arr) && arr.length > 0;

// Separate utility for data processing
const processArticlesData = (data: ControleMetrics[]): ProjectArticleMetrics[] => 
    data.map((ctrl) => parseProjectArticle({
        numero_article: ctrl.numero_article || 'Article sans nom',
        code_projet: ctrl.code_projet || 'Unknown',
        depenses_engagees: safeNumber(ctrl.depenses_engagees),
        depenses_facturees: safeNumber(ctrl.depenses_facturees),
        reste_a_depenser: safeNumber(ctrl.reste_a_depenser),
        prix_vente: safeNumber(ctrl.prix_vente),
        fin_chantier: ctrl.fin_chantier ? String(ctrl.fin_chantier) : null,
        budget_total:
            safeNumber(ctrl.depenses_engagees) + safeNumber(ctrl.reste_a_depenser),
        budget_percentage:
            safeNumber(ctrl.depenses_engagees) +
            safeNumber(ctrl.reste_a_depenser) > 0
                ? (safeNumber(ctrl.depenses_engagees) /
                      (safeNumber(ctrl.depenses_engagees) +
                          safeNumber(ctrl.reste_a_depenser))) *
                  100
                : 0,
    }));

// Top 5 articles calculation utility
// Top 5 articles calculation utility
const calculateTopFiveArticles = (articles: ProjectArticleMetrics[]): ProjectArticleMetrics[] => {
    if (!articles.length) return [];

    // Sort articles by depenses_engagees in descending order
    const sortedArticles = [...articles].sort((a, b) => {
        const valueA = Number(a.depenses_engagees) || 0;
        const valueB = Number(b.depenses_engagees) || 0;
        return valueB - valueA;
    });

    // Extract the top five articles
    const topFive = sortedArticles.slice(0, 5);

    // Calculate the combined depenses_engagees of the remaining articles
    const otherSum = sortedArticles.slice(5).reduce(
        (sum, article) => sum + (Number(article.depenses_engagees) || 0),
        0
    );

    // Add "Others" as a summary of remaining articles with all required properties
    return [
        ...topFive,
        {
            numero_article: 'Autres',
            prix_vente: 0,
            prix_vente_base: 0,
            budget_chef_projet: 0,
            budget_chef_projet_base: 0,
            code_projet: 'Autres',
            depenses_engagees: otherSum,
            depenses_facturees: 0,
            reste_a_depenser: 0,
            fin_chantier: 0,
            budget_percentage: 0,
            type_projet: 'FORFAIT',
            // Add the missing required properties
            depenses_engagees_reel: 0,
            depenses_facturees_reel: 0,
            fin_chantier_reel: 0,
            rentabilite_reel: 0,
            rentabilite: 0
        },
    ];
};

// Filter articles utility
const filterArticles = (
    articles: ProjectArticleMetrics[], 
    selectedProject: string, 
    articleSearch: string
): ProjectArticleMetrics[] => 
    articles.filter(article =>
        (!selectedProject || article.code_projet === selectedProject) &&
        (!articleSearch || article.numero_article.toLowerCase().includes(articleSearch.toLowerCase()))
    );

export const useDashboard = () => {
    const [projectArticles, setProjectArticles] = useState<ProjectArticleMetrics[]>([]);
    const [filteredArticles, setFilteredArticles] = useState<ProjectArticleMetrics[]>([]);
    const [state, setState] = useState<PageState>({ loading: false, error: null });
    
    const { 
        fetchControles, 
        controles,
        loading,
        error 
    } = useControle();

    const [selectedProject, setSelectedProject] = useState<string>('');
    const [articleSearch, setArticleSearch] = useState<string>('');

    // Ref to track if a fetch is in progress
    const isFetchInProgress = useRef(false);
    
    // Ref to track last successful fetch time
    const lastSuccessfulFetchTime = useRef<number | null>(null);

    // Comprehensive fetch dashboard data method
    const fetchDashboardData = useCallback(async () => {
        // Prevent multiple simultaneous fetches
        if (isFetchInProgress.current) {
            console.log('Fetch already in progress');
            return;
        }

        // Check network availability
        if (!isNetworkAvailable()) {
            setState(prev => ({
                ...prev,
                loading: false,
                error: 'Pas de connexion internet. Veuillez vérifier votre connexion.'
            }));
            return;
        }

        // Set fetch in progress flag
        isFetchInProgress.current = true;

        // Update state to loading
        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            // Add timeout to prevent indefinite loading
            const fetchPromise = fetchControles({});
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Délai de chargement dépassé')), 10000)
            );

            // Race between fetch and timeout
            const fetchedData = await Promise.race([fetchPromise, timeoutPromise]) as ControleMetrics[];

            // Validate fetched data
            const dataToProcess = isValidArray(fetchedData) 
                ? fetchedData 
                : (isValidArray(controles) ? controles : []);

            if (dataToProcess.length === 0) {
                throw new Error('Aucune donnée n\'a été reçue');
            }

            // Process articles
            const processedArticles = processArticlesData(dataToProcess);

            // Update state
            setProjectArticles(processedArticles);
            setFilteredArticles(processedArticles);

            // Update last successful fetch time
            lastSuccessfulFetchTime.current = Date.now();

            // Reset state
            setState(prev => ({ ...prev, loading: false, error: null }));

            console.log('Données du tableau de bord chargées avec succès');
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);

            // Detailed error handling
            const errorMessage = error instanceof Error 
                ? error.message 
                : 'Erreur de chargement des données';

            setState(prev => ({
                ...prev,
                loading: false,
                error: `${errorMessage}. Veuillez réessayer.`
            }));
        } finally {
            // Reset fetch in progress flag
            isFetchInProgress.current = false;
        }
    }, [fetchControles, controles]);

    // Handle control hook's loading and error states
    useEffect(() => {
        if (loading) {
            setState(prev => ({ ...prev, loading: true }));
        }
        
        if (error) {
            setState(prev => ({ 
                ...prev, 
                loading: false, 
                error: error 
            }));
        }
    }, [loading, error]);

    // Memoized top 5 articles
    const topFiveArticles = useMemo(() => 
        calculateTopFiveArticles(filteredArticles), 
        [filteredArticles]
    );

    // Periodic data refresh effect
    useEffect(() => {
        const checkAndRefreshData = async () => {
            const currentTime = Date.now();
            const fifteenMinutes = 15 * 60 * 1000; // 15 minutes

            // Only refresh if:
            // 1. No fetch in progress
            // 2. No recent successful fetch
            // 3. Network is available
            if (
                !isFetchInProgress.current && 
                (!lastSuccessfulFetchTime.current || 
                 currentTime - lastSuccessfulFetchTime.current > fifteenMinutes) &&
                isNetworkAvailable()
            ) {
                console.log('Vérification et actualisation des données');
                await fetchDashboardData();
            }
        };

        // Initial check
        checkAndRefreshData();

        // Set up periodic check
        const intervalId = setInterval(checkAndRefreshData, 15 * 60 * 1000);

        // Cleanup
        return () => clearInterval(intervalId);
    }, [fetchDashboardData]);

    // Network status change listeners
    useEffect(() => {
        const handleOnline = () => {
            console.log('Connectivité réseau rétablie');
            fetchDashboardData();
        };

        const handleOffline = () => {
            console.log('Connectivité réseau perdue');
            setState(prev => ({
                ...prev,
                loading: false,
                error: 'Pas de connexion internet. Veuillez vérifier votre connexion.'
            }));
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [fetchDashboardData]);

    // Filter articles effect
    useEffect(() => {
        const filtered = filterArticles(projectArticles, selectedProject, articleSearch);
        setFilteredArticles(filtered);
    }, [projectArticles, selectedProject, articleSearch]);

    return {
        projectArticles,
        filteredArticles,
        state,
        fetchDashboardData,
        topFiveArticles,
        setSelectedProject,
        setArticleSearch,
        selectedProject,
        articleSearch,
    };
};