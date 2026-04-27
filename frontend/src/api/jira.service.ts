import authClient from './authClient';

const API_URL = '/api/jira';

export interface JiraConfig {
  jiraId: string;
  userId: string;
  jiraUrl: string;
  projectKey: string;
  groupId: string;
  createdAt?: string;
}

export interface JiraIssue {
  jiraIssueId: string;
  jiraId: string;
  jiraIssueKey: string;
  taskId?: string | null;
  summary?: string;
  status?: string;
  issueType?: string;
  assigneeEmail?: string;
  priority?: string;
  description?: string;
  syncedAt?: string;
}

class JiraService {
  async getConfigsByGroup(groupId: string): Promise<JiraConfig[]> {
    const res = (await authClient.get(`${API_URL}/configs/group/${groupId}`)) as JiraConfig[] | null;
    return Array.isArray(res) ? res : [];
  }

  async getIssuesByJiraId(jiraId: string): Promise<JiraIssue[]> {
    const res = (await authClient.get(`${API_URL}/issues/jira/${jiraId}`)) as JiraIssue[] | null;
    return Array.isArray(res) ? res : [];
  }

  async getIssuesByJiraIdAndStatus(jiraId: string, status: string): Promise<JiraIssue[]> {
    const res = (await authClient.get(`${API_URL}/issues/jira/${jiraId}/status/${encodeURIComponent(status)}`)) as JiraIssue[] | null;
    return Array.isArray(res) ? res : [];
  }

  async syncIssues(jiraId: string): Promise<JiraIssue[]> {
    const res = (await authClient.post(`${API_URL}/issues/sync/${jiraId}`)) as JiraIssue[] | null;
    return Array.isArray(res) ? res : [];
  }

  async getIssuesByGroup(groupId: string): Promise<JiraIssue[]> {
    const configs = await this.getConfigsByGroup(groupId);
    if (configs.length === 0) return [];

    const issuesPerConfig = await Promise.all(
      configs.map(async (cfg) => {
        try {
          return await this.getIssuesByJiraId(cfg.jiraId);
        } catch (err) {
          console.warn(`Cannot fetch Jira issues for jiraId=${cfg.jiraId}`, err);
          return [];
        }
      }),
    );
    return issuesPerConfig.flat();
  }

  async syncIssuesByGroup(groupId: string): Promise<JiraIssue[]> {
    const configs = await this.getConfigsByGroup(groupId);
    if (configs.length === 0) return [];

    const synced = await Promise.all(
      configs.map(async (cfg) => {
        try {
          return await this.syncIssues(cfg.jiraId);
        } catch (err) {
          console.warn(`Cannot sync Jira for jiraId=${cfg.jiraId}`, err);
          return [];
        }
      }),
    );
    return synced.flat();
  }
}

export default new JiraService();
