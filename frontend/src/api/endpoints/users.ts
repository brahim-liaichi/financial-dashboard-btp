// src/api/endpoints/users.ts
import apiClient from '../client';
import { ENDPOINTS } from '@/api/config';
import axios from 'axios';

// User and Project related interfaces
export interface User {
    id: number;
    username: string;
    email: string;
    is_staff: boolean;
    profile: {
        total_projects_created: number;
        total_project_value: number;
        last_login_at: string | null;
    };
}

export interface Project {
    id: number;
    code: string;
    name: string;
    type: string;
    description?: string;
    total_budget: number;
    is_active: boolean;
}

export interface ProjectMembership {
    id: number;
    user: {
        id: number;
        username: string;
    };
    project: Project;
    role: string;
}

export interface UserProjectMetrics {
    total_projects: number;
    roles_breakdown: Record<string, number>;
    project_types: Record<string, number>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const logApiCall = async (name: string, call: () => Promise<any>) => {
    console.log(`Calling API: ${name}`);
    try {
        const response = await call();
        console.log(`API call successful: ${name}`, response.data);
        return response;
    } catch (error) {
        console.error(`API call failed: ${name}`, error);
        if (axios.isAxiosError(error)) {
            console.error('Response data:', error.response?.data);
            console.error('Response status:', error.response?.status);
        }
        throw error;
    }
};

export const userApi = {
    getUsers: () => logApiCall('getUsers', () =>
        apiClient.get<User[]>(ENDPOINTS.USER_MANAGEMENT.USERS)),

    getUserDetails: (userId: number) => logApiCall(`getUserDetails: ${userId}`, () =>
        apiClient.get<User>(`${ENDPOINTS.USER_MANAGEMENT.USERS}${userId}/`)),

    getUserProjectMetrics: (userId: number) => logApiCall(`getUserProjectMetrics: ${userId}`, () =>
        apiClient.get<UserProjectMetrics>(ENDPOINTS.USER_MANAGEMENT.PROJECT_METRICS(userId))),

    createProject: (projectData: Partial<Project>) => logApiCall('createProject', () =>
        apiClient.post<Project>(ENDPOINTS.USER_MANAGEMENT.PROJECTS, projectData)),

    updateProject: (projectCode: string, projectData: Partial<Project>) => logApiCall(`updateProject: ${projectCode}`, () =>
        apiClient.patch<Project>(`${ENDPOINTS.USER_MANAGEMENT.PROJECTS}${projectCode}/`, projectData)),

    addProjectMember: (projectCode: string, memberData: { user_id: number; role?: string }) => logApiCall(`addProjectMember: ${projectCode}`, () =>
        apiClient.post<ProjectMembership>(`${ENDPOINTS.USER_MANAGEMENT.PROJECTS}${projectCode}/add_member/`, memberData)),

    getProjectMembers: (projectCode: string) => logApiCall(`getProjectMembers: ${projectCode}`, () =>
        apiClient.get<ProjectMembership[]>(`user-management/projects/${projectCode}/members/`)),

    // Add to the existing userApi object
    getUserProjects: (userId: number) => logApiCall(`getUserProjects: ${userId}`, () =>
        apiClient.get<ProjectMembership[]>(`${ENDPOINTS.USER_MANAGEMENT.USERS}${userId}/project_memberships/`)),
};