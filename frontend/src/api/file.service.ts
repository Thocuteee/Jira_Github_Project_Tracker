import axios from 'axios';
import axiosClient from './authClient';

const BASE_PATH = '/api/files';

export interface PresignedUploadResponse {
  uploadUrl: string;
  fileKey: string;
  publicUrl: string;
}

export interface FileRecord {
  fileId: string;
  fileName: string;
  fileKey: string;
  fileUrl: string;
  fileSize?: number;
  contentType?: string;
  referenceId: string;
  scope: string;
  uploadedBy: string;
  uploadedAt: string;
}

class FileService {
  async getPresignedUploadUrl(params: {
    fileName: string;
    contentType: string;
    referenceId: string;
    scope: string;
  }): Promise<PresignedUploadResponse> {
    return (await axiosClient.post(`${BASE_PATH}/presigned-upload`, params)) as PresignedUploadResponse;
  }

  // Phương thức upload mới: Proxy qua Backend để tránh lỗi CORS
  async uploadFile(file: File, referenceId: string, scope: string): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('referenceId', referenceId);
    formData.append('scope', scope);

    return await axiosClient.post(`${BASE_PATH}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  async uploadToR2(uploadUrl: string, file: File): Promise<void> {
    await axios.put(uploadUrl, file, {
      headers: {
        'Content-Type': file.type,
      },
    });
  }

  async getPresignedDownloadUrl(fileKey: string): Promise<string> {
    return (await axiosClient.get(`${BASE_PATH}/presigned-download?fileKey=${encodeURIComponent(fileKey)}`)) as string;
  }

  async deleteFile(fileKey: string): Promise<void> {
    await axiosClient.delete(`${BASE_PATH}?fileKey=${encodeURIComponent(fileKey)}`);
  }

  async getFiles(referenceId: string, scope: string): Promise<FileRecord[]> {
    return (await axiosClient.get(`${BASE_PATH}/reference/${referenceId}?scope=${scope}`)) as FileRecord[];
  }
}

export default new FileService();
