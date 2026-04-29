import React, { useState, useEffect, useMemo } from 'react';
import { X, MessageSquare, History as LucideHistory, Info, Save, User, AlertCircle, Calendar, CheckCircle2, Clock, Circle, ArrowRight, Paperclip, Upload, Trash2, Download, Pencil, ExternalLink, GitBranch, Hash } from 'lucide-react';
import type { Task, TaskComment, TaskHistory, Attachment } from '../api/task.service';
import taskService from '../api/task.service';
import githubService from '../api/github.service';
import requirementService from '../api/requirement.service';
import authService from '../api/auth.service';
import { getMemberRole } from '../utils/groupRole';
import { formatUtc7DateTime, formatUtc7Time } from '../utils/datetime';

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

interface AvatarCacheEntry {
  avatarUrl: string;
  cachedAt: number;
}

const COMMENT_AVATAR_CACHE_TTL_MS = 10 * 60 * 1000;
const commentAvatarMemoryCache: Record<string, AvatarCacheEntry> = {};

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
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [commentActionLoadingId, setCommentActionLoadingId] = useState<string | null>(null);
  const [localNames, setLocalNames] = useState<Record<string, string>>({});
  const [commentAvatarMap, setCommentAvatarMap] = useState<Record<string, string>>({});
  const [commentAvatarLoadErrorMap, setCommentAvatarLoadErrorMap] = useState<Record<string, boolean>>({});
  const [jiraUrl, setJiraUrl] = useState('');
  const [globalGithubRepo, setGlobalGithubRepo] = useState('');
  const [globalJiraKey, setGlobalJiraKey] = useState('');

  const assignableMembers = useMemo(
    () =>
      groupMembers.filter((member) => {
        const normalizedRole = getMemberRole(member);
        return normalizedRole === 'LEADER' || normalizedRole === 'MEMBER';
      }),
    [groupMembers]
  );

  useEffect(() => {
    if (isOpen) {
      setEditedTask({
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        assignedTo: task.assignedTo,
        dueDate: task.dueDate,
        jiraIssueKey: task.jiraIssueKey || '',
        jiraTaskKey: task.jiraTaskKey || '',
        githubCommitUrl: task.githubCommitUrl || ''
      });
      loadExtraData();
    }
  }, [isOpen, task.taskId]);

  const loadExtraData = async () => {
    setLoading(true);
    try {
      // Core data for this modal: comments + history + attachments.
      const [commentsResult, historyResult, attachmentsResult] = await Promise.allSettled([
        taskService.getTaskComments(task.taskId),
        taskService.getTaskHistory(task.taskId),
        taskService.getTaskAttachments(task.taskId)
      ]);

      const commentsData =
        commentsResult.status === 'fulfilled' ? (commentsResult.value || []) : [];
      const historyData =
        historyResult.status === 'fulfilled' ? (historyResult.value || []) : [];
      const attachmentsData =
        attachmentsResult.status === 'fulfilled' ? (attachmentsResult.value || []) : [];

      if (commentsResult.status === 'rejected') {
        console.warn('Không tải được comments:', commentsResult.reason);
      }
      if (historyResult.status === 'rejected') {
        console.warn('Không tải được history:', historyResult.reason);
      }
      if (attachmentsResult.status === 'rejected') {
        console.warn('Không tải được attachments:', attachmentsResult.reason);
      }

      setComments(commentsData);
      setHistory(historyData);
      setAttachments(attachmentsData);
      await loadCommentAvatars(commentsData);

      // Fetch user names for comments and history
      const allUserIds = new Set<string>();
      commentsData.forEach((c: TaskComment) => allUserIds.add(c.userId));
      historyData.forEach((h: TaskHistory) => allUserIds.add(h.changedBy));

      if (allUserIds.size > 0) {
        try {
          const names = await authService.getUserNames(Array.from(allUserIds));
          setLocalNames(names);
        } catch (error) {
          console.warn('Không tải được tên người dùng:', error);
        }
      }

      // Non-critical metadata: should never block comments/history rendering.
      const [globalSettingsResult, mappingResult, requirementResult] = await Promise.allSettled([
        githubService.getGlobalSettings(),
        githubService.getMappingByGroup(task.groupId),
        requirementService.getRequirementsByGroup(task.groupId).then((reqs: any) =>
          (reqs as any || []).find((r: any) => r.requirementId === task.requirementId)
        )
      ]);

      const globalSettings = globalSettingsResult.status === 'fulfilled' ? globalSettingsResult.value : null;
      const mappingData = mappingResult.status === 'fulfilled' ? mappingResult.value : null;
      const reqData = requirementResult.status === 'fulfilled' ? requirementResult.value : null;

      if (globalSettings?.jiraUrl) setJiraUrl(globalSettings.jiraUrl);
      if (mappingData?.githubRepo || mappingData?.githubRepoUrl) {
        setGlobalGithubRepo(mappingData.githubRepo || mappingData.githubRepoUrl);
      }

      // Prefer Requirement's own Epic key, otherwise fallback to the integration's project key
      if (reqData?.jiraIssueKey) {
        setGlobalJiraKey(reqData.jiraIssueKey);
      } else if (mappingData?.jiraProjectKey) {
        setGlobalJiraKey(mappingData.jiraProjectKey);
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu bổ sung:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCommentAvatars = async (commentRows: TaskComment[]) => {
    const commentUserIds = Array.from(new Set(commentRows.map((c) => c.userId)));
    if (commentUserIds.length === 0) return;

    const now = Date.now();
    const cachedAvatarMap: Record<string, string> = {};
    const userIdsToFetch: string[] = [];

    commentUserIds.forEach((userId) => {
      const entry = commentAvatarMemoryCache[userId];
      if (entry && now - entry.cachedAt < COMMENT_AVATAR_CACHE_TTL_MS) {
        if (entry.avatarUrl) {
          cachedAvatarMap[userId] = entry.avatarUrl;
        }
        return;
      }
      userIdsToFetch.push(userId);
    });

    if (Object.keys(cachedAvatarMap).length > 0) {
      setCommentAvatarMap((prev) => ({ ...prev, ...cachedAvatarMap }));
    }

    if (userIdsToFetch.length === 0) return;

    const avatarEntries = await Promise.all(
      userIdsToFetch.map(async (userId) => {
        try {
          const user = await authService.getUserById(userId);
          return [userId, user?.avatarUrl || ''] as const;
        } catch {
          return [userId, ''] as const;
        }
      })
    );

    const fetchedAvatarMap: Record<string, string> = {};
    avatarEntries.forEach(([uid, avatarUrl]) => {
      commentAvatarMemoryCache[uid] = {
        avatarUrl,
        cachedAt: now,
      };
      if (avatarUrl) {
        fetchedAvatarMap[uid] = avatarUrl;
      }
    });

    if (Object.keys(fetchedAvatarMap).length > 0) {
      setCommentAvatarMap((prev) => ({ ...prev, ...fetchedAvatarMap }));
    }
  };

  const handleCommentAvatarLoadError = (userId: string) => {
    setCommentAvatarLoadErrorMap((prev) => ({ ...prev, [userId]: true }));
    delete commentAvatarMemoryCache[userId];
  };

  const handleCommentAvatarLoadSuccess = (userId: string) => {
    setCommentAvatarLoadErrorMap((prev) => {
      if (!prev[userId]) return prev;
      const next = { ...prev };
      delete next[userId];
      return next;
    });
  };

  const handleSave = async () => {
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

  const refreshComments = async () => {
    const commentsData = await taskService.getTaskComments(task.taskId);
    setComments(commentsData);
    await loadCommentAvatars(commentsData);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await taskService.addComment(task.taskId, newComment.trim());
      setNewComment('');
      await refreshComments();
    } catch (error) {
      alert('Lỗi khi gửi bình luận.');
    }
  };

  const handleStartEditComment = (comment: TaskComment) => {
    setEditingCommentId(comment.commentId);
    setEditingCommentContent(comment.content);
  };

  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentContent('');
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editingCommentContent.trim()) {
      alert('Nội dung bình luận không được để trống.');
      return;
    }
    setCommentActionLoadingId(commentId);
    try {
      await taskService.updateComment(task.taskId, commentId, editingCommentContent.trim());
      await refreshComments();
      handleCancelEditComment();
    } catch {
      alert('Không thể cập nhật bình luận.');
    } finally {
      setCommentActionLoadingId(null);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa bình luận này?')) return;
    setCommentActionLoadingId(commentId);
    try {
      await taskService.deleteComment(task.taskId, commentId);
      await refreshComments();
      if (editingCommentId === commentId) {
        handleCancelEditComment();
      }
    } catch {
      alert('Bạn không có quyền xóa bình luận này hoặc đã có lỗi xảy ra.');
    } finally {
      setCommentActionLoadingId(null);
    }
  };

  const handleAttachmentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingAttachment(true);
    try {
      await taskService.uploadAttachment(task.taskId, file);
      const attachmentRows = await taskService.getTaskAttachments(task.taskId);
      setAttachments(attachmentRows);
    } catch (error) {
      alert('Lỗi khi tải file đính kèm.');
    } finally {
      setUploadingAttachment(false);
      event.target.value = '';
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa tài liệu này?')) return;
    try {
      await taskService.deleteAttachment(task.taskId, attachmentId);
      setAttachments(prev => prev.filter(item => item.attachmentId !== attachmentId));
    } catch (error) {
      alert('Không thể xóa tài liệu đính kèm.');
    }
  };

  if (!isOpen) return null;

  const isCurrentUserAssignee =
    Boolean(currentUserId && task.assignedTo && currentUserId === task.assignedTo);
  const canEditStatus = role === 'LEADER' || isCurrentUserAssignee;
  const canEditTaskDetails = role === 'LEADER' || isCurrentUserAssignee;
  const canEditJiraIssueKey = role === 'LEADER';

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
            { id: 'history', icon: <LucideHistory size={18} />, label: 'Lịch sử' },
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
                  {canEditTaskDetails ? (
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

                <div className="space-y-4 pt-6 border-t border-slate-100">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Paperclip size={14} /> Tài liệu đính kèm
                    </label>
                    {canEditTaskDetails && (
                      <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold cursor-pointer hover:bg-blue-100 transition-colors">
                        <Upload size={14} />
                        {uploadingAttachment ? 'Đang tải...' : 'Upload File'}
                        <input
                          type="file"
                          className="hidden"
                          onChange={handleAttachmentUpload}
                          disabled={uploadingAttachment}
                        />
                      </label>
                    )}
                  </div>

                  {attachments.length === 0 ? (
                    <div className="text-sm text-slate-400 bg-white p-4 rounded-xl border border-dashed border-slate-200">
                      Chưa có tài liệu đính kèm cho công việc này.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {attachments.map((attachment) => (
                        <div
                          key={attachment.attachmentId}
                          className="flex items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-100 shadow-sm"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate">{attachment.fileName}</p>
                            <p className="text-xs text-slate-400">
                              {attachment.uploadedAt ? formatUtc7DateTime(attachment.uploadedAt) : ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={attachment.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
                            >
                              <Download size={13} />
                              Mở
                            </a>
                            {canEditTaskDetails && (
                              <button
                                type="button"
                                onClick={() => handleDeleteAttachment(attachment.attachmentId)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100"
                              >
                                <Trash2 size={13} />
                                Xóa
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Integrations Section */}
                <div className="space-y-4 pt-6 border-t border-slate-100">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <ExternalLink size={14} /> Tích hợp nguồn ngoài
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Jira Card */}
                          <div className="flex flex-col gap-3 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl group hover:shadow-lg transition-all hover:border-blue-200">
                          <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-600 text-white rounded-lg shadow-md">
                                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M11.53 2c0 2.4-1.97 4.38-4.38 4.38h-.77V2h5.15zm-5.15 5.15c2.4 0 4.38 1.97 4.38 4.38v.77h-5.15V7.15zm5.15 5.15c0 2.4-1.97 4.38-4.38 4.38h-.77v-4.38h5.15zM22 17.45c0 2.4-1.97 4.38-4.38 4.38h-.77v-4.38H22v4.38zm-5.15-5.15c2.4 0 4.38 1.97 4.38 4.38v.77h-5.15v-5.15zm5.15-5.15c0 2.4-1.97 4.38-4.38 4.38h-.77V7.15H22v4.38z"/></svg>
                              </div>
                              <div>
                                  <div className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">Jira Workspace</div>
                                  <div className="text-sm font-black text-slate-800">Quản lý Dự án</div>
                              </div>
                          </div>
                          
                          {editedTask.jiraIssueKey || globalJiraKey ? (
                             <div className="text-sm font-bold text-blue-700 bg-white border border-blue-100 px-3 py-2 rounded-xl">Project: {editedTask.jiraIssueKey || globalJiraKey}</div>
                          ) : (
                             <div className="text-sm font-bold text-slate-400 bg-white border border-slate-100 px-3 py-2 rounded-xl">Chưa liên kết Jira</div>
                          )}

                          {(editedTask.jiraIssueKey || globalJiraKey) && jiraUrl && (
                              <a 
                                  href={`${jiraUrl}/browse/${editedTask.jiraIssueKey || globalJiraKey}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1 uppercase tracking-wider bg-white/50 w-fit px-3 py-1.5 rounded-lg border border-blue-200/50 hover:bg-white transition-colors shadow-sm"
                              >
                                  Mở trên Jira <ExternalLink size={12} />
                              </a>
                          )}
                      </div>

                      {/* GitHub Card */}
                      <div className="flex flex-col gap-3 p-5 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl group hover:shadow-lg transition-all hover:border-slate-500">
                          <div className="flex items-center gap-3">
                              <div className="p-2 bg-white text-slate-900 rounded-lg shadow-md">
                                  <GitBranch size={20} strokeWidth={2.5} />
                              </div>
                              <div>
                                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">GitHub Repository</div>
                                  <div className="text-sm font-black text-white">Nguồn mã (Code)</div>
                              </div>
                          </div>
                          
                          {globalGithubRepo ? (
                             <div className="text-sm font-medium text-slate-300 bg-slate-950 border border-slate-700 px-3 py-2 rounded-xl truncate">{globalGithubRepo}</div>
                          ) : (
                             <div className="text-sm font-medium text-slate-500 bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl">Chưa cấu hình Repo</div>
                          )}

                          {globalGithubRepo && (
                              <a 
                                  href={globalGithubRepo.startsWith('http') ? globalGithubRepo : `https://github.com/${globalGithubRepo}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 mt-1 uppercase tracking-wider bg-slate-950/50 w-fit px-3 py-1.5 rounded-lg border border-slate-700/50 hover:bg-slate-800 transition-colors shadow-sm"
                              >
                                  Đi đến Repo GitHub <ExternalLink size={12} />
                              </a>
                          )}
                      </div>


                  </div>
                </div>
              </div>

              {/* Right Column: Meta Info */}
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</label>
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                      {statusIcons[editedTask.status || task.status]}
                      {canEditStatus ? (
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
                          {assignableMembers.map(m => (
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

                  <div className="space-y-2 pt-4 border-t border-slate-50">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jira Issue Key</label>
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                      <Hash size={14} className="text-slate-400" />
                      {canEditJiraIssueKey ? (
                        <input 
                          type="text"
                          placeholder="VD: KAN-1"
                          className="bg-transparent outline-none border-b border-slate-200 w-full text-blue-600 font-mono"
                          value={editedTask.jiraIssueKey || ''}
                          onChange={e => setEditedTask({...editedTask, jiraIssueKey: e.target.value.toUpperCase()})}
                        />
                      ) : (
                        <span className="font-mono text-blue-600">{task.jiraIssueKey || 'Trống'}</span>
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
                      {commentAvatarMap[c.userId] && !commentAvatarLoadErrorMap[c.userId] ? (
                        <img
                          src={commentAvatarMap[c.userId]}
                          alt={localNames[c.userId] || userNameMap[c.userId] || 'Comment user avatar'}
                          className="h-11 w-11 rounded-2xl object-cover flex-shrink-0 shadow-lg"
                          onLoad={() => handleCommentAvatarLoadSuccess(c.userId)}
                          onError={() => handleCommentAvatarLoadError(c.userId)}
                        />
                      ) : (
                        <div className={`h-11 w-11 rounded-2xl ${getAvatarColor(c.userId)} flex-shrink-0 flex items-center justify-center text-white font-black text-sm shadow-lg`}>
                          {c.userId === currentUserId
                            ? getInitials(localNames[c.userId] || userNameMap[c.userId] || 'Bạn')
                            : (localNames[c.userId] || userNameMap[c.userId]
                              ? getInitials(localNames[c.userId] || userNameMap[c.userId])
                              : <User size={20} />)}
                        </div>
                      )}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-black text-slate-900">{c.userId === currentUserId ? 'Bạn' : (localNames[c.userId] || userNameMap[c.userId] || `User: ${c.userId.slice(0, 8)}`)}</span>
                          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{formatUtc7Time(c.createdAt)}</span>
                          <div className="ml-auto flex items-center gap-2">
                            {c.userId === currentUserId && (
                              <>
                                {editingCommentId === c.commentId ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateComment(c.commentId)}
                                      disabled={commentActionLoadingId === c.commentId}
                                      title="Lưu bình luận"
                                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50"
                                    >
                                      <Save size={14} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleCancelEditComment}
                                      disabled={commentActionLoadingId === c.commentId}
                                      title="Hủy chỉnh sửa"
                                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
                                    >
                                      <X size={14} />
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditComment(c)}
                                    title="Sửa bình luận"
                                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                                  >
                                    <Pencil size={14} />
                                  </button>
                                )}
                              </>
                            )}
                            {(c.userId === currentUserId || role === 'LEADER') && (
                              <button
                                type="button"
                                onClick={() => handleDeleteComment(c.commentId)}
                                disabled={commentActionLoadingId === c.commentId}
                                title="Xóa bình luận"
                                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                        {editingCommentId === c.commentId && c.userId === currentUserId ? (
                          <div className="bg-white px-5 py-4 rounded-[1.5rem] rounded-tl-none border border-slate-100 shadow-sm">
                            <textarea
                              rows={3}
                              className="w-full resize-none bg-transparent outline-none text-slate-700 text-[15px] font-medium leading-relaxed"
                              value={editingCommentContent}
                              onChange={(e) => setEditingCommentContent(e.target.value)}
                            />
                          </div>
                        ) : (
                          <div className="bg-white px-5 py-4 rounded-[1.5rem] rounded-tl-none border border-slate-100 shadow-sm text-slate-600 text-[15px] font-medium leading-relaxed">
                            {c.content}
                          </div>
                        )}
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
                          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{formatUtc7DateTime(h.changedAt)}</span>
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

        {/* Footer for Actions */}
        {activeTab === 'details' && canEditTaskDetails && (
          <div className="px-10 py-7 border-t border-slate-50 flex justify-end bg-white">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-10 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-xs rounded-[1.5rem] transition-all shadow-xl shadow-emerald-200 disabled:opacity-50"
            >
              {saving ? 'Đang lưu...' : <><Save size={16} /> Lưu Thay Đổi</>}
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

const getInitials = (name?: string) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

export default TaskDetailModal;
