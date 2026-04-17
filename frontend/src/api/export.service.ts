import axiosClient from './authClient';

const BASE_PATH = '/api/exports';

export interface ExportRequest {
  groupId: string;
  format: 'PDF' | 'DOCX' | 'HTML';
  includeCompletedOnly?: boolean;
  includeTasks?: boolean;
  includeComments?: boolean;
  includeProgress?: boolean;
  requirementIds?: string[];
}

class ExportService {
  async exportSRS(request: ExportRequest): Promise<Blob> {
    const response = await axiosClient.post(`${BASE_PATH}/srs`, request, {
      responseType: 'blob',
    });
    return response as unknown as Blob;
  }

  async downloadFile(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

export default new ExportService();
