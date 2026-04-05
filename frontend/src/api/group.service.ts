import axios from 'axios';

// Giả sử API Gateway chạy ở 8080
const API_URL = 'http://localhost:8080/api/groups';

class GroupService {
  // --- Group Endpoints ---

  async createGroup(data: { groupName: string; leaderId?: string; course?: string; semester?: string }) {
    // Để mock theo API hiện tại có (groupName, leaderId)
    const token = localStorage.getItem('accessToken');
    const response = await axios.post(API_URL, {
      groupName: data.groupName,
      leaderId: data.leaderId
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  }

  async getAllGroups() {
    const response = await axios.get(API_URL);
    return response.data;
  }

  async getGroupById(groupId: string) {
    const response = await axios.get(`${API_URL}/${groupId}`);
    return response.data;
  }

  async deleteGroup(groupId: string) {
    const response = await axios.delete(`${API_URL}/${groupId}`);
    return response.data;
  }

  // Cập nhật Leader
  async setGroupLeader(groupId: string, leaderId: string) {
    const response = await axios.put(`${API_URL}/${groupId}/leader`, { leaderId });
    return response.data;
  }

  // --- Member Endpoints ---

  async addMember(groupId: string, userId: string, roleInGroup: string) {
    const response = await axios.post(`${API_URL}/${groupId}/members`, {
      userId,
      roleInGroup
    });
    return response.data;
  }

  async getMembers(groupId: string) {
    const response = await axios.get(`${API_URL}/${groupId}/members`);
    return response.data;
  }

  async updateMemberRole(groupId: string, userId: string, role: string) {
    const response = await axios.put(`${API_URL}/${groupId}/members/${userId}/role`, { roleInGroup: role });
    return response.data;
  }

  async removeMember(groupId: string, userId: string) {
    const response = await axios.delete(`${API_URL}/${groupId}/members/${userId}`);
    return response.data;
  }
}

export default new GroupService();
