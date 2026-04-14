import { useState, useEffect } from 'react';
import { X, Plus, ClipboardList, AlertCircle, Calendar, Hash } from 'lucide-react';
import taskService from '../api/task.service';
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

  useEffect(() => {
    if (isOpen && groupId) {
      loadRequirements();
    }
  }, [isOpen, groupId]);

  const loadRequirements = async () => {
    try {
      const response = await requirementService.getRequirementsByGroup(groupId);
      const data = response?.data || [];
      setRequirements(data);
      if (data.length > 0) {
        setRequirementId(data[0].id);
      }
    } catch (err) {
      console.error('Lỗi tải requirements', err);
    }
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
      await taskService.createTask({
        groupId,
        requirementId,
        title,
        description,
        priority,
        assignedTo: assignedTo || undefined,
        dueDate: dueDate || undefined
      });
      onCreated();
      handleClose();
    } catch (err: any) {
      setError('Lỗi khi tạo Task. Vui lòng thử lại.');
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
                  <option key={req.id} value={req.id}>{req.title}</option>
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

          {/* New Assignee Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              Người nhận việc (Assignee)
            </label>
            <select
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-700 font-medium"
              value={assignedTo}
              onChange={e => setAssignedTo(e.target.value)}
            >
              <option value="">Chưa giao (Unassigned)</option>
              {groupMembers.map(member => (
                <option key={member.userId} value={member.userId}>
                  {member.userId === currentUserId ? 'Bạn (Cá nhân)' : (userNameMap[member.userId] || `Thành viên: ${member.userId.slice(0, 8)}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Calendar size={14} /> Hạn chót (Tùy chọn)
            </label>
            <input
              type="date"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-700"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
            />
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
