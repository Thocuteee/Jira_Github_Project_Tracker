import axios from 'axios';

const apiGatewayBaseUrl = import.meta.env.VITE_API_GATEWAY_URL || window.location.origin;
const API_URL = `${apiGatewayBaseUrl}/api/groups`;

class GroupService {
  // --- Group Endpoints ---

  async createGroup(data: { groupName: string; leaderId?: string; course?: string; semester?: string }) {
    // Để mock theo API hiện tại có (groupName, leaderId)
    const response = await axios.post(API_URL, {
      groupName: data.groupName,
      leaderId: data.leaderId
    }, {
      withCredentials: true,
    });
    return response.data;
  }

  async getAllGroups() {
    const response = await axios.get(API_URL, { withCredentials: true });
    return response.data;
  }

  async getGroupById(groupId: string) {
    const response = await axios.get(`${API_URL}/${groupId}`, { withCredentials: true });
    return response.data;
  }

  async deleteGroup(groupId: string) {
    const response = await axios.delete(`${API_URL}/${groupId}`, { withCredentials: true });
    return response.data;
  }

  // Cập nhật Leader
  async setGroupLeader(groupId: string, leaderId: string) {
    const response = await axios.put(`${API_URL}/${groupId}/leader`, { leaderId }, { withCredentials: true });
    return response.data;
  }

  // --- Member Endpoints ---

  async addMember(groupId: string, userId: string, roleInGroup: string) {
    const response = await axios.post(`${API_URL}/${groupId}/members`, {
      userId,
      roleInGroup
    }, { withCredentials: true });
    return response.data;
  }

  async getMembers(groupId: string) {
    const response = await axios.get(`${API_URL}/${groupId}/members`, { withCredentials: true });
    return response.data;
  }

  async updateMemberRole(groupId: string, userId: string, role: string) {
    const response = await axios.put(`${API_URL}/${groupId}/members/${userId}/role`, { roleInGroup: role }, { withCredentials: true });
    return response.data;
  }

  async removeMember(groupId: string, userId: string) {
    const response = await axios.delete(`${API_URL}/${groupId}/members/${userId}`, { withCredentials: true });
    return response.data;
  }
}

export default new GroupService();
