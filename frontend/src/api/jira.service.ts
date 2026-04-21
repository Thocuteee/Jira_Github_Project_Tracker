import axios from 'axios';

const apiGatewayBaseUrl = import.meta.env.VITE_API_GATEWAY_URL || window.location.origin;
const API_URL = `${apiGatewayBaseUrl}/api/jira`;

class JiraService {
  async syncProject(projectKey: string, groupId: string) {
    const response = await axios.post(`${API_URL}/issues/sync`, null, {
      params: { projectKey, groupId },
      withCredentials: true
    });
    return response.data;
  }

  async getActivities() {
    const response = await axios.get(`${API_URL}/issues/activities`, { withCredentials: true });
    return response.data;
  }

  async testConnection(jiraId?: string) {
    const response = await axios.get(`${API_URL}/issues/test-connection`, { 
      params: { jiraId },
      withCredentials: true 
    });
    return response.data;
  }

  async upsertMapping(groupId: string, projectKey: string) {
    const response = await axios.post(`${API_URL}/issues/mapping`, null, {
      params: { groupId, projectKey },
      withCredentials: true
    });
    return response.data;
  }

  async saveGlobalSettings(settings: { jiraUrl: string, jiraUsername: string, jiraApiToken: string }) {
    const response = await axios.post(`${API_URL}/issues/settings`, settings, {
      withCredentials: true
    });
    return response.data;
  }
}

export default new JiraService();
