import axios from './authClient'; 

export interface Requirement {
    requirementId: string;
    title: string;
    description: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    status: 'NEW' | 'IN_PROGRESS' | 'DONE' | 'REJECTED';
    jiraIssueKey?: string;
    progress: number;
    groupId: string;
    createdBy: string;
    createdAt?: string;
}

export const requirementService = {
    getByGroup: (groupId: string) => 
        axios.get<Requirement[]>(`/api/requirements/group/${groupId}`),
    getRequirementsByGroup: (groupId: string) =>
        axios.get<Requirement[]>(`/api/requirements/group/${groupId}`),
    
    create: (data: Partial<Requirement>) => 
        axios.post<Requirement>('/api/requirements', data),
        
    update: (id: string, data: Partial<Requirement>) => 
        axios.put<Requirement>(`/api/requirements/${id}`, data),
    
    delete: (id: string) => 
        axios.delete(`/api/requirements/${id}`),
};

export default requirementService;
