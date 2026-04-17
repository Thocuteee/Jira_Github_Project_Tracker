import axios from 'axios';

const apiGatewayBaseUrl = import.meta.env.VITE_API_GATEWAY_URL || window.location.origin;
const API_URL = `${apiGatewayBaseUrl}/api/github`;

class GithubService {
  async getGlobalSettings() {
    const response = await axios.get(`${API_URL}/settings`, { withCredentials: true });
    return response.data;
  }

  async saveGlobalSettings(data: { jiraUrl: string; jiraEmail: string; jiraToken: string; githubPortalToken: string }) {
    const response = await axios.post(`${API_URL}/settings`, data, { withCredentials: true });
    return response.data;
  }

  async getAllMappings() {
    const response = await axios.get(`${API_URL}/integrations/all`, { withCredentials: true });
    return response.data;
  }

  async upsertMapping(data: { groupId: string; jiraProjectKey: string; githubRepo: string; githubToken?: string }) {
    try {
      const existing = await axios.get(`${API_URL}/integrations/group/${data.groupId}`, { withCredentials: true });
      if (existing.data && (existing.data as any).integrationId) {
        return await axios.put(`${API_URL}/integrations/${(existing.data as any).integrationId}`, data, { withCredentials: true });
      } else {
        // Returned null or empty data, create new
        return await axios.post(`${API_URL}/integrations`, data, { withCredentials: true });
      }
    } catch (e) {
      // Not found (404) or server error (500), create new
      return await axios.post(`${API_URL}/integrations`, data, { withCredentials: true });
    }
  }

  async deleteMapping(id: string) {
    return await axios.delete(`${API_URL}/integrations/${id}`, { withCredentials: true });
  }

  async getCommitsByGroup(groupId: string) {
    const response = await axios.get(`${API_URL}/commits/group/${groupId}`, { withCredentials: true });
    return response.data;
  }
}

export default new GithubService();
