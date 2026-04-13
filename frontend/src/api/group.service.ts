import axiosClient from './authClient';

const BASE_PATH = '/api/groups';

class GroupService {
  // --- Group Endpoints ---

  async createGroup(data: { groupName: string; leaderId?: string; course?: string; semester?: string }): Promise<any> {
    // Để mock theo API hiện tại có (groupName, leaderId)
    return (await axiosClient.post(BASE_PATH, {
      groupName: data.groupName,
      leaderId: data.leaderId
    })) as any;
  }

  /** Chỉ ROLE_ADMIN (BE trả 403 nếu không phải admin). */
  async getAllGroups(): Promise<any> {
    return (await axiosClient.get(BASE_PATH)) as any;
  }

  /** Nhóm mà user đang đăng nhập tham gia (JWT qua gateway). */
  async getMyGroups(): Promise<any> {
    return (await axiosClient.get(`${BASE_PATH}/my-groups`)) as any;
  }

  async getGroupById(groupId: string): Promise<any> {
    return (await axiosClient.get(`${BASE_PATH}/${groupId}`)) as any;
  }

  async deleteGroup(groupId: string): Promise<any> {
    return (await axiosClient.delete(`${BASE_PATH}/${groupId}`)) as any;
  }

  // Cập nhật Leader
  async setGroupLeader(groupId: string, leaderId: string): Promise<any> {
    return (await axiosClient.put(`${BASE_PATH}/${groupId}/leader`, { leaderId })) as any;
  }

  // --- Member Endpoints ---

  async addMember(groupId: string, userId: string, roleInGroup: string): Promise<any> {
    return (await axiosClient.post(`${BASE_PATH}/${groupId}/members`, {
      userId,
      roleInGroup
    })) as any;
  }

  async getMembers(groupId: string): Promise<any> {
    return (await axiosClient.get(`${BASE_PATH}/${groupId}/members`)) as any;
  }

  async updateMemberRole(groupId: string, userId: string, role: string): Promise<any> {
    return (await axiosClient.put(`${BASE_PATH}/${groupId}/members/${userId}/role`, { roleInGroup: role })) as any;
  }

  async removeMember(groupId: string, userId: string): Promise<any> {
    return (await axiosClient.delete(`${BASE_PATH}/${groupId}/members/${userId}`)) as any;
  }
}

export default new GroupService();
