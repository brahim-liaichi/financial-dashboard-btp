import client from '../client';

import { 
  DashboardPreference, 
  DashboardMetrics, 
  ProjectSummary,
  //SummaryMetrics
} from '../../types';



export const dashboardApi = {
  /**
   * Fetch dashboard metrics
   */
  getMetrics: async () => {
    const response = await client.get<DashboardMetrics>('/dashboard/metrics/');
    return response.data;
  },

  /**
   * Fetch project summary
   * @param codeProjet Project code to fetch summary for
   */
  getProjectSummary: async (codeProjet: string) => {
    const response = await client.get<ProjectSummary>('/dashboard/project_summary/', {
      params: { code_projet: codeProjet }
    });
    return response.data;
  },

  /**
   * Fetch user's dashboard preferences
   */
  getDashboardPreferences: async () => {
    const response = await client.get<DashboardPreference[]>('/dashboard/');
    return response.data;
  },

  /**
   * Create or update dashboard preferences
   * @param preferences Dashboard preferences to save
   */
  saveDashboardPreferences: async (preferences: DashboardPreference) => {
    if (preferences.id) {
      // Update existing preferences
      const response = await client.put<DashboardPreference>(`/dashboard/${preferences.id}/`, preferences);
      return response.data;
    } else {
      // Create new preferences
      const response = await client.post<DashboardPreference>('/dashboard/', preferences);
      return response.data;
    }
  },

  /**
   * Delete dashboard preferences
   * @param id Preferences ID to delete
   */
  deleteDashboardPreferences: async (id: number) => {
    await client.delete(`/dashboard/${id}/`);
  }
};