import React, { useState, useEffect } from 'react';
import { X, MessageSquare, History, Info, Save, User, AlertCircle, Calendar, CheckCircle2, Clock, Circle, ArrowRight } from 'lucide-react';
import type { Task, TaskComment, TaskHistory } from '../api/task.service';
import taskService from '../api/task.service';
import authService from '../api/auth.service';

interface TaskDetailModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  role: 'LEADER' | 'MEMBER';
  groupMembers: { userId: string; roleInGroup: string }[];
  currentUserId: string | null;
  userNameMap: Record<string, string>;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  onUpdate,
  role,
  groupMembers,
  currentUserId,
  userNameMap
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'history'>('details');
  const [editedTask, setEditedTask] = useState<Partial<Task>>({});
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [history, setHistory] = useState<TaskHistory[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localNames, setLocalNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setEditedTask({
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        assignedTo: task.assignedTo,
        dueDate: task.dueDate
      });
      loadExtraData();
    }
  }, [isOpen, task]);

  const loadExtraData = async () => {
    setLoading(true);
    try {
      const [commentsData, historyData] = await Promise.all([
        taskService.getTaskComments(task.taskId),
        taskService.getTaskHistory(task.taskId)
      ]);
      setComments(commentsData || []);
      setHistory(historyData || []);

      // Fetch user names for comments and history
      const allUserIds = new Set<string>();
      if (commentsData) commentsData.forEach((c: TaskComment) => allUserIds.add(c.userId));
      if (historyData) historyData.forEach((h: TaskHistory) => allUserIds.add(h.changedBy));
      
      if (allUserIds.size > 0) {
        const names = await authService.getUserNames(Array.from(allUserIds));
        setLocalNames(names);
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu bổ sung:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (role !== 'LEADER') return;
    if (!window.confirm('Xác nhận lưu mọi thay đổi cho công việc này?')) return;

    setSaving(true);
    try {
      await taskService.updateTask(task.taskId, editedTask);
      if (editedTask.status !== task.status) {
        await taskService.updateTaskStatus(task.taskId, editedTask.status!);
      }
      if (editedTask.assignedTo !== task.assignedTo) {
        await taskService.assignTask(task.taskId, editedTask.assignedTo || '');
      }
      onUpdate();
      onClose();
    } catch (error) {
      alert('Lỗi khi lưu thay đổi.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await taskService.addComment(task.taskId, newComment);
      setNewComment('');
      const commentsData = await taskService.getTaskComments(task.taskId);
      setComments(commentsData);
    } catch (error) {
      alert('Lỗi khi gửi bình luận.');
    }
  };

  if (!isOpen) return null;

  const statusIcons: Record<string, any> = {
    DONE: <CheckCircle2 className="text-green-500" size={16} />,
    IN_PROGRESS: <Clock className="text-blue-500" size={16} />,
    TODO: <Circle className="text-slate-300" size={16} />,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] border border-slate-200">
        {/* Header */}
        <div className="px-10 py-8 border-b border-slate-100 flex items-start justify-between bg-white">
          <div className="flex gap-5">
            <div className={`mt-1 p-3 rounded-2xl ${task.priority === 'HIGH' ? 'bg-red-50 text-red-600' : task.priority === 'MEDIUM' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
              <AlertCircle size={28} strokeWidth={2.5} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 bg-slate-50 px-2 py-0.5 rounded">Task Detail</span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 bg-blue-50 px-2 py-0.5 rounded italic">#{task.taskId.slice(0, 8)}</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 leading-tight">
                {task.title}
              </h2>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-2xl transition-all text-slate-300 hover:text-slate-600">
            <X size={24} strokeWidth={3} />
          </button>
        </div>

        {/* Custom Tab Navigation */}
        <div className="flex px-10 border-b border-slate-100 gap-8">
          {[
            { id: 'details', icon: <Info size={18} />, label: 'Chi tiết' },
            { id: 'comments', icon: <MessageSquare size={18} />, label: `Thảo luận (${comments.length})` },
            { id: 'history', icon: <History size={18} />, label: 'Lịch sử' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-5 text-sm font-black uppercase tracking-widest transition-all border-b-2 -mb-[1px] ${
                activeTab === tab.id 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-10 bg-slate-50/20">
          {activeTab === 'details' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* Left Column: Editor/Info */}
              <div className="lg:col-span-2 space-y-8">
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Info size={14} /> Mô tả công việc
                  </label>
                  {role === 'LEADER' ? (
                    <textarea
                      rows={8}
                      className="w-full px-6 py-5 bg-white border border-slate-200 rounded-[1.5rem] focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all resize-none shadow-sm text-slate-700 font-medium leading-relaxed"
                      value={editedTask.description || ''}
                      onChange={e => setEditedTask({ ...editedTask, description: e.target.value })}
                      placeholder="Không có mô tả chi tiết..."
                    />
                  ) : (
                    <div className="text-slate-700 bg-white p-7 rounded-[1.5rem] border border-slate-100 shadow-sm min-h-[200px] leading-relaxed font-medium">
                      {task.description || 'Chưa có mô tả nào được thêm vào cho công việc này.'}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Meta Info */}
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</label>
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                      {statusIcons[editedTask.status || task.status]}
                      {role === 'LEADER' ? (
                        <select 
                          value={editedTask.status} 
                          onChange={e => setEditedTask({...editedTask, status: e.target.value as any})}
                          className="bg-transparent border-none p-0 outline-none cursor-pointer text-blue-600"
                        >
                          <option value="TODO">Cần làm (Todo)</option>
                          <option value="IN_PROGRESS">Đang làm</option>
                          <option value="DONE">Đã xong</option>
                        </select>
                      ) : (
                        <span>{task.status}</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Người được giao</label>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                        <User size={18} />
                      </div>
                      {role === 'LEADER' ? (
                        <select
                          className="flex-1 text-sm font-bold text-slate-700 bg-transparent outline-none cursor-pointer"
                          value={editedTask.assignedTo || ''}
                          onChange={e => setEditedTask({ ...editedTask, assignedTo: e.target.value })}
                        >
                          <option value="">Chưa giao</option>
                          {groupMembers.map(m => (
                            <option key={m.userId} value={m.userId}>
                              {m.userId === currentUserId ? 'Bạn' : (localNames[m.userId] || userNameMap[m.userId] || `User: ${m.userId.slice(0, 8)}...`)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-sm font-bold text-slate-700">{task.assignedTo ? (localNames[task.assignedTo] || userNameMap[task.assignedTo] || `User: ${task.assignedTo.slice(0, 8)}`) : 'Chưa giao'}</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mức độ ưu tiên</label>
                    <div className="text-sm font-bold">
                       {role === 'LEADER' ? (
                         <select
                           value={editedTask.priority}
                           onChange={e => setEditedTask({...editedTask, priority: e.target.value as any})}
                           className={`bg-transparent border-none p-0 outline-none cursor-pointer ${editedTask.priority === 'HIGH' ? 'text-red-500' : 'text-slate-600'}`}
                         >
                           <option value="LOW">Thấp (Low)</option>
                           <option value="MEDIUM">Vừa (Medium)</option>
                           <option value="HIGH">Cao (High)</option>
                         </select>
                       ) : (
                         <span className={task.priority === 'HIGH' ? 'text-red-500' : 'text-slate-600'}>{task.priority}</span>
                       )}
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-slate-50">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ngày hết hạn</label>
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                      <Calendar size={14} className="text-slate-400" />
                      {role === 'LEADER' ? (
                        <input 
                          type="date"
                          className="bg-transparent outline-none"
                          value={editedTask.dueDate || ''}
                          onChange={e => setEditedTask({...editedTask, dueDate: e.target.value})}
                        />
                      ) : (
                        <span>{task.dueDate || 'Chưa định ngày'}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="max-w-2xl mx-auto space-y-10">
              <form onSubmit={handleAddComment} className="relative group">
                <input
                  type="text"
                  className="w-full pl-6 pr-16 py-4 bg-white border border-slate-200 rounded-[1.5rem] shadow-sm focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all font-medium"
                  placeholder="Gửi bình luận hoặc câu hỏi..."
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-md group-focus-within:scale-105"
                >
                  <ArrowRight size={20} strokeWidth={3} />
                </button>
              </form>

              <div className="space-y-8">
                {loading ? (
                  <div className="flex flex-col items-center py-10 gap-3">
                    <div className="w-8 h-8 border-4 border-slate-100 border-t-blue-500 rounded-full animate-spin"></div>
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-14 bg-white rounded-[2rem] border border-dashed border-slate-200 text-slate-400 font-bold">
                    Cuộc thảo luận chưa bắt đầu. Hãy là người đầu tiên!
                  </div>
                ) : (
                  comments.map((c: TaskComment) => (
                    <div key={c.commentId} className="flex gap-4 group">
                      <div className={`h-11 w-11 rounded-2xl ${getAvatarColor(c.userId)} flex-shrink-0 flex items-center justify-center text-white font-black text-sm shadow-lg`}>
                        {c.userId === currentUserId ? 'ME' : <User size={20} />}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-black text-slate-900">{c.userId === currentUserId ? 'Bạn' : (localNames[c.userId] || userNameMap[c.userId] || `User: ${c.userId.slice(0, 8)}`)}</span>
                          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="bg-white px-5 py-4 rounded-[1.5rem] rounded-tl-none border border-slate-100 shadow-sm text-slate-600 text-[15px] font-medium leading-relaxed">
                          {c.content}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="max-w-xl mx-auto py-4">
              {loading ? (
                <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-100 border-t-blue-500 rounded-full animate-spin"></div></div>
              ) : history.length === 0 ? (
                <div className="text-center py-14 text-slate-300 font-bold uppercase tracking-widest text-sm">No activity recorded</div>
              ) : (
                <div className="space-y-10 relative before:absolute before:left-5 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                  {history.map((h: TaskHistory) => (
                    <div key={h.historyId} className="relative pl-12">
                      <div className="absolute left-[13px] top-1.5 h-3.5 w-3.5 rounded-full bg-blue-600 border-[3px] border-white ring-4 ring-blue-50"></div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-black text-slate-900">{h.changedBy === currentUserId ? 'Bạn' : (localNames[h.changedBy] || userNameMap[h.changedBy] || `User: ${h.changedBy.slice(0, 8)}`)}</span>
                          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{new Date(h.changedAt).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-slate-500 font-medium">
                          Đã cập nhật <span className="text-slate-900 font-black">{h.fieldChanged}</span> 
                          <span className="mx-2 text-slate-200">→</span>
                          <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg text-xs font-bold">{h.newValue || '(Trống)'}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer for Leader */}
        {role === 'LEADER' && activeTab === 'details' && (
          <div className="px-10 py-7 border-t border-slate-50 flex justify-end bg-white">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-10 py-4 bg-slate-900 hover:bg-black text-white font-black uppercase tracking-widest text-xs rounded-[1.5rem] transition-all shadow-xl shadow-slate-200 disabled:opacity-50"
            >
              {saving ? 'Saving...' : <><Save size={16} /> Save Changes</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const getAvatarColor = (userId: string) => {
  const colors = ['bg-rose-500', 'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-sky-500', 'bg-violet-500', 'bg-cyan-500'];
  const index = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[index % colors.length];
};

export default TaskDetailModal;
