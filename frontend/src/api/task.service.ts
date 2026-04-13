import axiosClient from './authClient';

const BASE_PATH = '/api/tasks';

export interface Task {
  taskId: string;
  requirementId: string;
  groupId: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  assignedTo?: string | null;
  dueDate: string;
  createdAt?: string;
  createdBy?: string;
}

export interface TaskComment {
  commentId: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
}

export interface TaskHistory {
  historyId: string;
  taskId: string;
  changedBy: string;
  fieldChanged: string;
  oldValue: string;
  newValue: string;
  changedAt: string;
}

class TaskService {
  async getTasksByGroup(groupId: string, role: string): Promise<Task[]> {
    return (await axiosClient.get(`${BASE_PATH}/group/${groupId}?role=${role}`)) as Task[];
  }

  async createTask(data: { requirementId: string; groupId: string; title: string; description?: string; priority: string; assignedTo?: string; dueDate?: string }): Promise<Task> {
    return (await axiosClient.post(BASE_PATH, data)) as Task;
  }

  async updateTaskStatus(taskId: string, status: string): Promise<Task> {
    return (await axiosClient.patch(`${BASE_PATH}/${taskId}/status`, { status })) as Task;
  }

  async assignTask(taskId: string, assignedTo: string): Promise<Task> {
    return (await axiosClient.patch(`${BASE_PATH}/${taskId}/assign`, { assignedTo })) as Task;
  }

  async updateTask(taskId: string, data: { title?: string; description?: string; priority?: string; dueDate?: string }): Promise<Task> {
    return (await axiosClient.patch(`${BASE_PATH}/${taskId}`, data)) as Task;
  }

  async deleteTask(taskId: string): Promise<void> {
    await axiosClient.delete(`${BASE_PATH}/${taskId}`);
  }

  async getTaskComments(taskId: string): Promise<TaskComment[]> {
    return (await axiosClient.get(`${BASE_PATH}/${taskId}/comments`)) as TaskComment[];
  }

  async addComment(taskId: string, content: string): Promise<TaskComment> {
    return (await axiosClient.post(`${BASE_PATH}/${taskId}/comments`, { content })) as TaskComment;
  }

  async getTaskHistory(taskId: string): Promise<TaskHistory[]> {
    return (await axiosClient.get(`${BASE_PATH}/${taskId}/history`)) as TaskHistory[];
  }
}

export default new TaskService();
