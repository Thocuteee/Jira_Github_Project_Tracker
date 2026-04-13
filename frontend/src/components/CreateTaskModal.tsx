import { useState, useEffect } from 'react';
import { X, Plus, ClipboardList, AlertCircle, Calendar, Hash, Paperclip, Trash2, FileText } from 'lucide-react';
import taskService from '../api/task.service';
import fileService from '../api/file.service';
import type { Requirement } from '../api/requirement.service';
import requirementService from '../api/requirement.service';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  groupMembers: { userId: string; roleInGroup: string }[];
  currentUserId: string | null;
  userNameMap: Record<string, string>;
  onCreated: () => void;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  groupId,
  groupMembers,
  currentUserId,
  userNameMap,
  onCreated
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [requirementId, setRequirementId] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  useEffect(() => {
    if (isOpen && groupId) {
      loadRequirements();
    }
  }, [isOpen, groupId]);

  const loadRequirements = async () => {
    try {
      const data = await requirementService.getRequirementsByGroup(groupId);
      setRequirements(data || []);
      if (data && data.length > 0) {
        setRequirementId(data[0].requirementId);
      }
    } catch (err) {
      console.error('Lỗi tải requirements', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles((prev: File[]) => [...prev, ...filesArray]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev: File[]) => prev.filter((_, i: number) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !requirementId) {
      setError('Vui lòng nhập tiêu đề và chọn Requirement.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const newTask = await taskService.createTask({
        groupId,
        requirementId,
        title,
        description,
        priority,
        assignedTo: assignedTo || undefined,
        dueDate: dueDate || undefined
      });

      // Nếu có file đính kèm, thực hiện upload
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          try {
            // 1. Lấy Pre-signed URL từ Task Service (thông qua file-service)
            const { presignedUrl, fileKey, fileUrl } = await taskService.generateAttachmentPresignedUrl(
              newTask.taskId,
              file.name,
              file.type
            );

            // 2. Upload trực tiếp lên R2
            await fileService.uploadToR2(presignedUrl, file);

            // 3. Lưu metadata vào task-service
            await taskService.saveAttachment(newTask.taskId, {
              fileKey,
              fileName: file.name,
              fileUrl
            });
          } catch (uploadErr) {
            console.error(`Lỗi upload file ${file.name}:`, uploadErr);
            // Có thể thông báo cho người dùng nhưng không chặn việc tạo hoàn tất Task
          }
        }
      }

      onCreated();
      handleClose();
    } catch (err: any) {
      console.error('Task creation error:', err);
      const msg = err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Lỗi khi tạo Task. Vui lòng thử lại.';
      setError(typeof msg === 'object' ? JSON.stringify(msg) : msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setPriority('MEDIUM');
    setAssignedTo('');
    setDueDate('');
    setSelectedFiles([]);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm shadow-inner" onClick={handleClose}></div>
      
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative overflow-hidden flex flex-col transition-all transform scale-100 border border-slate-200">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200">
              <Plus size={20} strokeWidth={3} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Tạo công việc mới</h2>
              <p className="text-xs text-slate-500 font-medium">Bắt đầu một nhiệm vụ mới trong nhóm</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 animate-pulse">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <ClipboardList size={14} /> Tiêu đề công việc
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-700 placeholder:text-slate-400"
              placeholder="Ví dụ: Cấu hình RabbitMQ cho Notification..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Hash size={14} /> Requirement
              </label>
              <select
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-700"
                value={requirementId}
                onChange={e => setRequirementId(e.target.value)}
                required
              >
                <option value="" disabled>Chọn Requirement</option>
                {requirements.map((req: Requirement) => (
                  <option key={req.requirementId} value={req.requirementId}>{req.title}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Calendar size={14} /> Mức độ ưu tiên
              </label>
              <select
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-700 font-semibold"
                value={priority}
                onChange={e => setPriority(e.target.value)}
              >
                <option value="LOW">Thấp (Low)</option>
                <option value="MEDIUM">Trung bình (Medium)</option>
                <option value="HIGH">Cao (High)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Calendar size={14} /> Hạn chót (Tùy chọn)
              </label>
              <input
                type="date"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-700 font-medium"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Plus size={14} className="text-blue-500" /> Giao việc cho
              </label>
              <select
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-700 font-bold"
                value={assignedTo}
                onChange={e => setAssignedTo(e.target.value)}
              >
                <option value="">Chưa giao (Trống)</option>
                {groupMembers.map(m => (
                  <option key={m.userId} value={m.userId}>
                    {m.userId === currentUserId ? 'Giao cho Bạn' : (userNameMap[m.userId] || `Thành viên: ${m.userId.slice(0, 8)}...`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              Mô tả chi tiết
            </label>
            <textarea
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-700 resize-none min-h-[100px]"
              placeholder="Nhập mô tả thêm về công việc này..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
              <span className="flex items-center gap-1.5"><Paperclip size={14} /> Tệp đính kèm</span>
              <span className="text-[10px] lowercase font-medium bg-slate-100 px-2 py-0.5 rounded-full">{selectedFiles.length} file</span>
            </label>
            
            <div className="flex flex-wrap gap-2">
              {selectedFiles.map((file: File, idx: number) => (
                <div key={idx} className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-100 text-sm font-medium pr-1">
                  <FileText size={14} />
                  <span className="max-w-[120px] truncate">{file.name}</span>
                  <button 
                    type="button" 
                    onClick={() => removeFile(idx)}
                    className="p-1 hover:bg-blue-100 rounded-full text-blue-400 hover:text-blue-600 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              
              <label className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-500 px-3 py-1.5 rounded-lg border border-dashed border-slate-300 text-sm font-medium cursor-pointer transition-colors">
                <Plus size={14} />
                <span>Thêm tệp</span>
                <input 
                  type="file" 
                  multiple 
                  className="hidden" 
                  onChange={handleFileChange} 
                />
              </label>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-3 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
            >
              {loading ? 'Đang khởi tạo...' : 'Tạo công việc'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTaskModal;
