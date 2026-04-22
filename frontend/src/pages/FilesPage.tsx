import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { useGroupContext } from '@/contexts/GroupContext';
import fileService from '@/api/file.service';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import {
  FolderOpen, Upload, FileText, FileImage, File, Trash2,
  Download, Loader2, AlertCircle, FolderX, FileDown, CheckSquare, Square
} from 'lucide-react';

interface UploadedFile {
  fileKey: string;
  fileName: string;
  publicUrl: string;
  uploadedAt: string;
  size: number;
  type: string;
}

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return <FileImage size={20} className="text-blue-500" />;
  if (type === 'application/pdf') return <FileText size={20} className="text-red-500" />;
  if (type.includes('word') || type.includes('document')) return <FileText size={20} className="text-blue-700" />;
  return <File size={20} className="text-slate-400" />;
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function FilesPage() {
  const navigate = useNavigate();
  const { selectedGroup } = useGroupContext();
  const groupId = selectedGroup?.groupId;

  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (groupId) {
      fetchFiles(groupId);
    } else {
      setFiles([]);
    }
    setSelectedKeys(new Set());
  }, [groupId]);

  const fetchFiles = async (gid: string) => {
    try {
      const res = await fileService.getFiles(gid, 'GROUP');
      setFiles(res.map(f => ({
        fileKey: f.fileKey,
        fileName: f.fileName,
        publicUrl: f.fileUrl,
        uploadedAt: f.uploadedAt,
        size: f.fileSize || 0,
        type: f.contentType || 'application/octet-stream',
      })));
    } catch (err) {
      console.error("Lỗi lấy danh sách file:", err);
    }
  };

  const handleToggleSelect = (key: string) => {
    const next = new Set(selectedKeys);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelectedKeys(next);
  };

  const handleToggleAll = () => {
    if (selectedKeys.size === files.length) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(files.map(f => f.fileKey)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedKeys.size === 0) return;
    if (!confirm(`Xóa ${selectedKeys.size} file đã chọn?`)) return;

    setBulkActionLoading(true);
    try {
      await Promise.all(Array.from(selectedKeys).map(key => fileService.deleteFile(key)));
      setFiles(prev => prev.filter(f => !selectedKeys.has(f.fileKey)));
      setSelectedKeys(new Set());
    } catch (err) {
      alert("Có lỗi xảy ra khi xóa một số file.");
      fetchFiles(groupId!);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDownload = async () => {
    if (selectedKeys.size === 0) return;
    setBulkActionLoading(true);

    try {
      const zip = new JSZip();
      const selectedFiles = files.filter(f => selectedKeys.has(f.fileKey));

      await Promise.all(selectedFiles.map(async (file) => {
        try {
          const downloadUrl = await fileService.getPresignedDownloadUrl(file.fileKey);
          const response = await fetch(downloadUrl);
          const blob = await response.blob();
          zip.file(file.fileName, blob);
        } catch (err) {
          console.error(`Không thể tải file ${file.fileName} để nén:`, err);
        }
      }));

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `files_${selectedGroup?.groupName || 'download'}.zip`);
    } catch (err) {
      alert("Lỗi khi tạo file nén.");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList || !groupId) return;
    setUploading(true);
    setUploadError('');

    const filesToUpload = Array.from(fileList);
    
    try {
      const results = await Promise.all(
        filesToUpload.map(async (file) => {
          try {
            const result = await fileService.uploadFile(file, groupId, 'GROUP');
            return {
              fileKey: result.fileKey,
              fileName: result.fileName || file.name,
              publicUrl: result.fileUrl,
              uploadedAt: result.uploadedAt || new Date().toISOString(),
              size: result.fileSize || file.size,
              type: result.contentType || file.type,
            };
          } catch (err: any) {
            console.error(`Lỗi upload file ${file.name}:`, err);
            throw new Error(`Lỗi upload "${file.name}": ${err?.response?.data?.message || err?.message || 'Thử lại sau.'}`);
          }
        })
      );

      setFiles(prev => [...results, ...prev]);
    } catch (err: any) {
      setUploadError(err.message || 'Một hoặc nhiều file upload thất bại.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileKey: string) => {
    if (!confirm('Xóa file này?')) return;
    try {
      await fileService.deleteFile(fileKey);
      setFiles(prev => prev.filter(f => f.fileKey !== fileKey));
    } catch {
      alert('Không thể xóa file.');
    }
  };

  const handleDownload = async (fileKey: string, fileName: string) => {
    try {
      const url = await fileService.getPresignedDownloadUrl(fileKey);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
    } catch {
      alert('Không thể tải file.');
    }
  };

  const handleGoToExportReport = () => {
    if (!groupId) return;
    navigate(`/workspace/${groupId}/reports`, {
      state: {
        activeTab: 'export',
      },
    });
  };

  return (
    <MainLayout>
      <div className="bg-slate-50 min-h-screen p-8 font-sans">
        <div className="max-w-5xl mx-auto space-y-8">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                <FolderOpen size={32} className="text-indigo-500" />
                Tài liệu nhóm
                {selectedGroup && (
                  <span className="text-sm font-bold text-slate-400 bg-white px-4 py-1.5 rounded-2xl border border-slate-200 shadow-sm uppercase tracking-widest">
                    {selectedGroup.groupName}
                  </span>
                )}
              </h1>
              <p className="text-slate-500 mt-1 font-medium">
                Upload và quản lý tài liệu dự án — SRS, báo cáo, ảnh chụp màn hình...
              </p>
            </div>

            <div className="flex items-center gap-3">
              {selectedKeys.size > 0 ? (
                <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 p-2 rounded-2xl animate-in fade-in slide-in-from-right-4">
                  <span className="text-xs font-black text-indigo-600 px-3">
                    Đã chọn {selectedKeys.size} tệp
                  </span>
                  <button
                    onClick={handleBulkDownload}
                    disabled={bulkActionLoading}
                    className="bg-white hover:bg-slate-50 text-indigo-600 px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 text-xs shadow-sm disabled:opacity-50"
                  >
                    {bulkActionLoading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                    Tải về ZIP
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    disabled={bulkActionLoading}
                    className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 text-xs disabled:opacity-50"
                  >
                    {bulkActionLoading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    Xóa đã chọn
                  </button>
                </div>
              ) : (
                groupId && (
                  <button
                    onClick={handleGoToExportReport}
                    className="bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-200 hover:border-indigo-300 px-6 py-3.5 rounded-2xl font-bold transition-all flex items-center gap-2 hover:-translate-y-1 active:scale-95 text-sm shadow-sm"
                  >
                    <FileDown size={18} strokeWidth={2.5} className="text-indigo-600" />
                    Xuất báo cáo SRS (DOC/PDF)
                  </button>
                )
              )}
            </div>
          </div>

          {!groupId ? (
            <div className="bg-white p-16 rounded-[2.5rem] border-2 border-dashed border-slate-200 text-center space-y-4">
              <FolderX size={48} className="mx-auto text-slate-300" />
              <p className="text-slate-500 font-semibold">Chọn một Group để xem tài liệu.</p>
            </div>
          ) : (
            <>
              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files); }}
                onClick={() => inputRef.current?.click()}
                className={`cursor-pointer border-2 border-dashed rounded-[2rem] p-12 text-center transition-all ${
                  dragOver ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/30'
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={e => handleUpload(e.target.files)}
                />
                {uploading ? (
                  <div className="flex flex-col items-center gap-3 text-indigo-600">
                    <Loader2 size={36} className="animate-spin" />
                    <p className="font-bold">Đang tải lên...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 text-slate-400">
                    <Upload size={36} />
                    <p className="font-bold text-slate-600">Kéo thả file vào đây hoặc click để chọn</p>
                    <p className="text-sm">PDF, Word, ảnh, và các định dạng khác</p>
                  </div>
                )}
              </div>

              {uploadError && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl text-sm font-semibold">
                  <AlertCircle size={18} />
                  {uploadError}
                </div>
              )}

              {/* File list */}
              {files.length > 0 && (
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleToggleAll}
                        className="text-slate-400 hover:text-indigo-600 transition-colors"
                      >
                        {selectedKeys.size === files.length && files.length > 0
                          ? <CheckSquare size={18} className="text-indigo-600" />
                          : <Square size={18} />}
                      </button>
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                        {files.length} tài liệu đã tải lên
                      </h3>
                    </div>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {files.map(f => (
                      <div key={f.fileKey} className={`flex items-center gap-4 px-8 py-4 hover:bg-slate-50 transition-colors group ${selectedKeys.has(f.fileKey) ? 'bg-indigo-50/30' : ''}`}>
                        <button
                          onClick={() => handleToggleSelect(f.fileKey)}
                          className={`transition-colors ${selectedKeys.has(f.fileKey) ? 'text-indigo-600' : 'text-slate-300 hover:text-indigo-400'}`}
                        >
                          {selectedKeys.has(f.fileKey) ? <CheckSquare size={18} /> : <Square size={18} />}
                        </button>
                        
                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center shrink-0">
                          {getFileIcon(f.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold truncate ${selectedKeys.has(f.fileKey) ? 'text-indigo-700' : 'text-slate-800'}`}>{f.fileName}</p>
                          <p className="text-xs text-slate-400 font-medium">
                            {formatSize(f.size)} · {new Date(f.uploadedAt).toLocaleString('vi-VN')}
                          </p>
                        </div>
                        <div className={`flex items-center gap-2 transition-all ${selectedKeys.size > 0 ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}>
                          <button
                            onClick={() => handleDownload(f.fileKey, f.fileName)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                            title="Tải xuống"
                          >
                            <Download size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(f.fileKey)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                            title="Xóa"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {files.length === 0 && !uploading && (
                <p className="text-center text-slate-400 font-medium py-4">Chưa có tài liệu nào. Upload file đầu tiên!</p>
              )}
            </>
          )}
        </div>
      </div>

    </MainLayout>
  );
}
