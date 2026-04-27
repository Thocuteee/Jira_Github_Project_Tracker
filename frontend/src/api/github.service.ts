import authClient from './authClient';

const API_URL = '/api/github';

class GithubService {
  async getGlobalSettings() {
    return await authClient.get(`${API_URL}/settings`) as any;
  }

  async saveGlobalSettings(data: { jiraUrl: string; jiraEmail: string; jiraToken: string; githubPortalToken: string }) {
    return await authClient.post(`${API_URL}/settings`, data) as any;
  }

  async getAllMappings() {
    return await authClient.get(`${API_URL}/integrations/all`) as any;
  }

  async getMappingByGroup(groupId: string) {
    return await authClient.get(`${API_URL}/integrations/group/${groupId}`) as any;
  }

  async upsertMapping(data: { groupId: string; jiraProjectKey: string; githubRepo: string; githubToken?: string }) {
    try {
      const existing = await authClient.get(`${API_URL}/integrations/group/${data.groupId}`) as any;
      if (existing && (existing as any).integrationId) {
        return await authClient.put(`${API_URL}/integrations/${(existing as any).integrationId}`, data) as any;
      } else {
        // Returned null or empty data, create new
        return await authClient.post(`${API_URL}/integrations`, data) as any;
      }
    } catch (e) {
      // Not found (404) or server error (500), create new
      return await authClient.post(`${API_URL}/integrations`, data) as any;
    }
  }

  async deleteMapping(id: string) {
    return await authClient.delete(`${API_URL}/integrations/${id}`) as any;
  }

  async getCommitsByGroup(groupId: string) {
    return await authClient.get(`${API_URL}/commits/group/${groupId}`) as any;
  }

  async getCommitsByUser(userId: string) {
    return await authClient.get(`${API_URL}/commits/user/${userId}`) as any;
  }

  async getRepositoriesByGroup(groupId: string) {
    return await authClient.get(`${API_URL}/repositories/group/${groupId}`) as any;
  }
}

export default new GithubService();
