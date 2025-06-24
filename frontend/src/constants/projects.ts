// src/constants/projects.ts
import type { Project } from '@/types';

export const PROJECT_NAME_MAP: Record<string, Project> = {
    "PROJ-2024-A": { 
        code: 'PROJ-2024-A', 
        name: 'PROJA', 
        type: 'FORFAIT',
        //description: 'Project SPMP'
    },
    "PROJ-2024-B": { 
        code: 'PROJ-2024-B', 
        name: 'PROJB', 
        type: 'METRE',
        //description: 'Project Société Générale Maroc Banque'
    }
    // Add more project details as needed
};

export const getProjectName = (code: string): string => {
    return PROJECT_NAME_MAP[code]?.name || code;
};

export const getProjectDetails = (code: string): Project => {
    return PROJECT_NAME_MAP[code] || { 
        code, 
        name: code, 
        type: 'FORFAIT', 
        description: 'Unknown Project' 
    };
};

export const getAllProjects = (): Project[] => {
    return Object.values(PROJECT_NAME_MAP);
};

export const getProjectType = (code: string): 'FORFAIT' | 'METRE' => {
    return PROJECT_NAME_MAP[code]?.type || 'FORFAIT';
};