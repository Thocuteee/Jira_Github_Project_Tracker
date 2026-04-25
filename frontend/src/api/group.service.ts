import authClient from './authClient';

const API_URL = '/api/groups';

class GroupService {
  // --- Group Endpoints ---

  async createGroup(data: {
    groupName: string;
    leaderId?: string;
    githubRepoUrl?: string;
    description?: string;
    workspaceId: string;
    status?: 'ACTIVE' | 'LOCKED';
    maxMembers?: number;
  }) {
    return await authClient.post(API_URL, data) as any;
  }

  async getAllGroups() {
    return await authClient.get(API_URL) as any;
  }

  async getGroupById(groupId: string) {
    return await authClient.get(`${API_URL}/${groupId}`) as any;
  }

  async deleteGroup(groupId: string) {
    return await authClient.delete(`${API_URL}/${groupId}`) as any;
  }

  // Cập nhật Leader
  async setGroupLeader(groupId: string, leaderId: string) {
    return await authClient.put(`${API_URL}/${groupId}/leader`, { userId: leaderId }) as any;
  }

  // --- Member Endpoints ---

  async addMember(groupId: string, userId: string, roleInGroup: string) {
    return await authClient.post(`${API_URL}/${groupId}/members`, {
      userId,
      roleInGroup
    }) as any;
  }

  async getMembers(groupId: string) {
    return await authClient.get(`${API_URL}/${groupId}/members`) as any;
  }

  async getMemberIds(groupId: string) {
    return await authClient.get(`${API_URL}/${groupId}/members/ids`) as any;
  }

  async updateMemberRole(groupId: string, userId: string, role: string) {
    return await authClient.put(`${API_URL}/${groupId}/members/${userId}/role`, { roleInGroup: role }) as any;
  }

  async removeMember(groupId: string, userId: string) {
    return await authClient.delete(`${API_URL}/${groupId}/members/${userId}`) as any;
  }

  async getMyGroups() {
    return await authClient.get(`${API_URL}/my-groups`) as any;
  }

  async checkLeader(groupId: string) {
    return await authClient.get(`${API_URL}/${groupId}/checkLeader`) as any;
  }
}

export default new GroupService();
