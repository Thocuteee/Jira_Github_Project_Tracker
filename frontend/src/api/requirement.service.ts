import axiosClient from './authClient';

const BASE_PATH = '/api/requirements';

export interface Requirement {
  requirementId: string;
  groupId: string;
  title: string;
  description: string;
  createdAt?: string;
}

class RequirementService {
  async getRequirementsByGroup(groupId: string): Promise<Requirement[]> {
    return (await axiosClient.get(`${BASE_PATH}/group/${groupId}`)) as Requirement[];
  }
}

export default new RequirementService();
