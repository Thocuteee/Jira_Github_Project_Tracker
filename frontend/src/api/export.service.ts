import axiosClient from './authClient';

const BASE_PATH = '/api/exports';

export interface ExportRequest {
  groupId: string;
  format: 'PDF' | 'DOCX';
  documentName?: string;
  includeCompletedOnly?: boolean;
  includeTasks?: boolean;
  includeComments?: boolean;
  includeProgress?: boolean;
  requirementIds?: string[];
  requestedBy?: string;
}

/** Khớp với backend `ExportResponse` (UUID serialize thành string trên JSON). */
export interface ExportResponse {
  exportId: string;
  groupId: string;
  version?: string | null;
  fileName?: string | null;
  fileUrl?: string | null;
  fileType: string | null;
  status: string | null;
  generatedBy?: string | null;
  createdAt: string | null;
  completedAt?: string | null;
}

class ExportService {
  async generateSRS(request: ExportRequest): Promise<{ exportId: string; message?: string }> {
    return (await axiosClient.post(`${BASE_PATH}/generate`, {
      groupId: request.groupId,
      fileType: request.format,
      documentName: request.documentName?.trim() || undefined,
      requestedBy: request.requestedBy,
      requirementIds: request.requirementIds ?? [],
      includeCompletedOnly: request.includeCompletedOnly ?? false,
      includeTasks: request.includeTasks ?? true,
      includeComments: request.includeComments ?? false,
      includeProgress: request.includeProgress ?? true,
    })) as { exportId: string; message?: string };
  }

  async getExportHistory(groupId: string): Promise<ExportResponse[]> {
    return (await axiosClient.get(`${BASE_PATH}`, {
      params: { groupId },
    })) as ExportResponse[];
  }

  openDownload(fileUrl: string) {
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
  }
}

export default new ExportService();
