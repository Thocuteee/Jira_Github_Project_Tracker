import axios from 'axios';

class FileService {
  /**
   * Tải tệp trực tiếp lên R2 sử dụng Pre-signed URL (PUT)
   * Không sử dụng axiosClient vì URL này trỏ thẳng tới Cloudflare (không qua Gateway)
   * và không cần Header Authorization của Hệ thống.
   */
  async uploadToR2(presignedUrl: string, file: File): Promise<void> {
    try {
      await axios.put(presignedUrl, file, {
        headers: {
          'Content-Type': file.type
        }
      });
    } catch (error) {
      console.error('Lỗi upload file lên R2:', error);
      throw error;
    }
  }
}

export default new FileService();
