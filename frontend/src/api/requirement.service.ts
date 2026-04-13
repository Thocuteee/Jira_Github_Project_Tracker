import axios from './authClient'; 

export interface Requirement {
    id: string;
    title: string;
    description: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    status: 'ANALYSIS' | 'DESIGN' | 'CODING' | 'DONE';
    jiraIssueKey?: string;
    progress: number; // Phần trăm hoàn thành
    groupId: string;
}

export const requirementService = {
    getByGroup: (groupId: string) => 
        axios.get<Requirement[]>(`/api/requirements/group/${groupId}`),
    
    create: (data: Partial<Requirement>) => 
        axios.post<Requirement>('/api/requirements', data),
        
    update: (id: string, data: Partial<Requirement>) => 
        axios.put<Requirement>(`/api/requirements/${id}`, data),
    
    delete: (id: string) => 
        axios.delete(`/api/requirements/${id}`),
};