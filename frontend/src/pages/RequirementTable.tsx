import { useEffect, useState, useMemo } from 'react';
import { requirementService, type Requirement } from '../api/requirement.service';
import { Edit3, Trash2, Link as LinkIcon, PlusCircle, Layout, Filter, Search, ChevronDown, ChevronRight, CheckCircle2, Clock, Circle } from 'lucide-react';
import groupService from '../api/group.service';
import authService from '../api/auth.service';
import MainLayout from '@/components/layout/MainLayout';
import { useGroupContext } from '@/contexts/GroupContext';
import RequirementModal from '../components/requirements/RequirementModal';
import JiraKeyModal from '../components/requirements/JiraKeyModal';
import CreateTaskModal from '../components/CreateTaskModal';
import taskService, { type Task } from '../api/task.service';

const RequirementTable = () => {
    const { selectedGroup, loading: groupLoading } = useGroupContext();
    const groupId = selectedGroup?.groupId;

    const [requirements, setRequirements] = useState<Requirement[]>([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<'Leader' | 'Member' | 'Lecturer' | 'Admin' | 'NoRole'>('NoRole');
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    
    // Modal states
    const [isReqModalOpen, setIsReqModalOpen] = useState(false);
    const [isJiraModalOpen, setIsJiraModalOpen] = useState(false);
    const [selectedReq, setSelectedReq] = useState<Requirement | null>(null);

    // Search & Filter
    const [searchQuery, setSearchQuery] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');

    // Task Integration
    const [expandedReqId, setExpandedReqId] = useState<string | null>(null);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [taskTargetReqId, setTaskTargetReqId] = useState<string | null>(null);

    useEffect(() => {
        if (groupId) {
            init(groupId);
        } else {
            setRequirements([]);
            setUserRole('NoRole');
            setLoading(false);
        }
    }, [groupId]);

    const init = async (gid: string) => {
        setLoading(true);
        try {
            await Promise.all([
                fetchRequirements(gid),
                checkUserRole(gid)
            ]);
        } catch (err) {
            console.error("Lỗi khởi tạo trang yêu cầu:", err);
        } finally {
            setLoading(false);
        }
    };

    const checkUserRole = async (gid: string) => {
        try {
            const profile = await authService.getProfile();
            const currUid = String(profile.userId || '');
            setCurrentUserId(currUid);

            const systemRoles = (profile.roles || []).map((r: string) => r.toUpperCase());
            
            if (systemRoles.includes('ROLE_ADMIN')) {
                setUserRole('Admin');
                return;
            }
            if (systemRoles.includes('ROLE_LECTURER')) {
                setUserRole('Lecturer');
                return;
            }

            const members = await groupService.getMembers(gid);
            const member = members.find((m: any) => 
                String(m.userId) === currUid
            );
            
            if (member) {
                const roleUpper = String(member.roleInGroup || member.role).toUpperCase();
                if (roleUpper === 'LEADER') {
                    setUserRole('Leader');
                } else {
                    setUserRole('Member');
                }
            } else {
                setUserRole('NoRole');
            }
        } catch (error) {
            console.error("Lỗi kiểm tra quyền hạn:", error);
            setUserRole('NoRole'); 
        }
    };

    const fetchRequirements = async (gid: string) => {
        try {
            const res = await requirementService.getByGroup(gid);
            setRequirements((res as any) || []);
        } catch (error) {
            console.error("Lỗi lấy danh sách yêu cầu:", error);
        }
    };

    const handleCreateOrUpdate = async (data: Partial<Requirement>) => {
        if (!groupId) return;
        try {
            if (selectedReq) {
                await requirementService.update(selectedReq.requirementId, data);
            } else {
                await requirementService.create({ 
                    ...data, 
                    groupId,
                    createdBy: currentUserId || '' 
                });
            }
            setIsReqModalOpen(false);
            setSelectedReq(null);
            fetchRequirements(groupId);
        } catch (err) {
            alert("Lỗi khi lưu yêu cầu.");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Bạn có chắc muốn xóa yêu cầu này?")) return;
        try {
            await requirementService.delete(id);
            if (groupId) fetchRequirements(groupId);
        } catch (err) {
            alert("Không thể xóa yêu cầu.");
        }
    };

    const handleAssignJira = async (jiraKey: string) => {
        if (!selectedReq || !groupId) return;
        try {
            await requirementService.update(selectedReq.requirementId, { jiraIssueKey: jiraKey });
            setIsJiraModalOpen(false);
            setSelectedReq(null);
            fetchRequirements(groupId);
        } catch (err) {
            alert("Lỗi khi gán Jira Key.");
        }
    };

    const filteredRequirements = useMemo(() => {
        return requirements.filter(req => {
            const query = searchQuery.toLowerCase();
            const matchesSearch = 
                req.title.toLowerCase().includes(query) || 
                (req.description && req.description.toLowerCase().includes(query));
            
            const matchesPriority = priorityFilter === 'ALL' || req.priority === priorityFilter;
            const matchesStatus = statusFilter === 'ALL' || req.status === statusFilter;
            
            return matchesSearch && matchesPriority && matchesStatus;
        });
    }, [requirements, searchQuery, priorityFilter, statusFilter]);

    const getPriorityColor = (p: string) => {
        const priority = String(p).toUpperCase();
        if (priority === 'HIGH') return 'bg-red-100 text-red-700 border-red-200';
        if (priority === 'MEDIUM') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        return 'bg-blue-100 text-blue-700 border-blue-200';
    };

    const canManageSRS = userRole === 'Leader' || userRole === 'Admin';

    const toggleExpand = (id: string) => {
        setExpandedReqId(expandedReqId === id ? null : id);
    };

    const handleOpenTaskModal = (reqId: string) => {
        setTaskTargetReqId(reqId);
        setIsTaskModalOpen(true);
    };

    return (
        <MainLayout>
            <div className="bg-slate-50 min-h-screen p-8 font-sans">
                <div className="max-w-[1440px] mx-auto space-y-8">
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                Software Requirements Specification
                                {groupId && (
                                    <span className="text-sm font-bold text-slate-400 bg-white px-4 py-1.5 rounded-2xl border border-slate-200 shadow-sm uppercase tracking-widest">
                                        Group: {selectedGroup?.groupName}
                                    </span>
                                )}
                            </h1>
                            <p className="text-slate-500 mt-2 font-medium max-w-2xl leading-relaxed">
                                Quản lý và theo dõi cấu trúc yêu cầu (SRS) đồng bộ với Jira Epic cho dự án phần mềm.
                            </p>
                        </div>

                        {canManageSRS && (
                            <button 
                                onClick={() => { setSelectedReq(null); setIsReqModalOpen(true); }}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-[1.5rem] font-bold transition-all flex items-center gap-2 shadow-2xl shadow-indigo-200 hover:-translate-y-1 active:scale-95 text-lg"
                            >
                                <PlusCircle size={22} strokeWidth={2.5} />
                                Thêm Yêu Cầu
                            </button>
                        )}
                    </div>

                    {!groupId && !groupLoading && (
                        <div className="bg-white p-16 rounded-[2.5rem] border-2 border-dashed border-slate-200 text-center space-y-6">
                            <div className="mx-auto w-24 h-24 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-400">
                                <Layout size={48} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-slate-800">Chưa chọn nhóm làm việc</h3>
                                <p className="text-slate-500 text-lg max-w-sm mx-auto">Vui lòng chọn một Group bên thanh Menu trái để xem cấu trúc SRS của dự án.</p>
                            </div>
                        </div>
                    )}

                    {groupId && (
                        <>
                            <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-200 flex flex-wrap items-center gap-4">
                                <div className="flex-1 min-w-[300px] relative group">
                                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                    <input 
                                        type="text"
                                        placeholder="Tìm kiếm yêu cầu..."
                                        className="w-full pl-14 pr-6 py-3 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 outline-none transition-all font-semibold text-slate-700"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                    />
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl group focus-within:bg-white focus-within:border-indigo-500 transition-all">
                                        <Filter size={18} className="text-slate-400" />
                                        <select 
                                            className="bg-transparent text-sm font-bold text-slate-600 outline-none cursor-pointer"
                                            value={priorityFilter}
                                            onChange={e => setPriorityFilter(e.target.value)}
                                        >
                                            <option value="ALL">Tất cả ưu tiên</option>
                                            <option value="LOW">LOW</option>
                                            <option value="MEDIUM">MEDIUM</option>
                                            <option value="HIGH">HIGH</option>
                                            <option value="CRITICAL">CRITICAL</option>
                                        </select>
                                    </div>

                                    <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl group focus-within:bg-white focus-within:border-indigo-500 transition-all">
                                        <Filter size={18} className="text-slate-400" />
                                        <select 
                                            className="bg-transparent text-sm font-bold text-slate-600 outline-none cursor-pointer"
                                            value={statusFilter}
                                            onChange={e => setStatusFilter(e.target.value)}
                                        >
                                            <option value="ALL">Tất cả trạng thái</option>
                                            <option value="NEW">NEW (Mới)</option>
                                            <option value="IN_PROGRESS">IN_PROGRESS</option>
                                            <option value="DONE">DONE</option>
                                            <option value="REJECTED">REJECTED</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50 text-slate-400 uppercase text-[10px] font-black tracking-[0.2em] border-b border-slate-100">
                                                <th className="px-10 py-6">Nội dung Yêu cầu</th>
                                                <th className="px-10 py-6 text-center">Ưu tiên</th>
                                                <th className="px-10 py-6 text-center text-nowrap">Tiến độ</th>
                                                <th className="px-10 py-6">Sync Jira</th>
                                                <th className="px-10 py-6 text-right">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {loading ? (
                                                <tr>
                                                    <td colSpan={5} className="py-24 text-center">
                                                        <div className="flex flex-col items-center gap-4">
                                                            <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                                                            <p className="text-indigo-600 font-black tracking-widest text-xs uppercase">Đang tải dữ liệu...</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : filteredRequirements.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="py-24 text-center">
                                                        <div className="flex flex-col items-center gap-6">
                                                            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-300">
                                                                <Search size={40} />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="text-slate-800 font-bold text-lg">Không tìm thấy yêu cầu nào</p>
                                                                <p className="text-slate-400 font-medium">Bạn có thể thử tìm kiếm khác hoặc thêm mới.</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredRequirements.map((req) => (
                                                        <>
                                                            <tr key={req.requirementId} className={`group transition-all ${expandedReqId === req.requirementId ? 'bg-indigo-50/30' : 'hover:bg-indigo-50/20'}`}>
                                                                <td className="px-10 py-8">
                                                                    <div className="flex items-start gap-4">
                                                                        <button 
                                                                            onClick={() => toggleExpand(req.requirementId)}
                                                                            className="mt-1.5 p-1 hover:bg-white rounded-lg transition-all text-slate-400 hover:text-indigo-600"
                                                                        >
                                                                            {expandedReqId === req.requirementId ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                                                        </button>
                                                                        <div>
                                                                            <div className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors text-xl mb-2">{req.title}</div>
                                                                            <div className="text-sm text-slate-500 font-medium leading-relaxed max-w-lg line-clamp-2">{req.description || "Không có nội dung mô tả."}</div>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-10 py-8 text-center">
                                                                    <span className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${getPriorityColor(req.priority)}`}>
                                                                        {req.priority}
                                                                    </span>
                                                                </td>
                                                                <td className="px-10 py-8 min-w-[240px]">
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/30 p-0.5 shadow-inner">
                                                                            <div 
                                                                                className={`h-full transition-all duration-1000 ease-out shadow-sm rounded-full ${req.progress === 100 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 'bg-gradient-to-r from-indigo-500 to-blue-600'}`} 
                                                                                style={{ width: `${req.progress}%` }}
                                                                            ></div>
                                                                        </div>
                                                                        <span className="text-sm font-black text-slate-900 tabular-nums">{req.progress}%</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-10 py-8">
                                                                    {req.jiraIssueKey ? (
                                                                        <div className="flex flex-col gap-2">
                                                                            <div className="inline-flex items-center gap-2.5 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-2xl border border-indigo-100 font-mono text-xs font-black shadow-sm group-hover:bg-white transition-all w-fit">
                                                                                <LinkIcon size={14} className="opacity-70" />
                                                                                {req.jiraIssueKey}
                                                                            </div>
                                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Auto-Sync Enabled</span>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex items-center gap-2.5 text-slate-300 italic text-xs font-semibold">
                                                                            <div className="w-1.5 h-1.5 bg-slate-200 rounded-full"></div>
                                                                            Chưa đồng bộ Jira
                                                                        </div>
                                                                    )}
                                                                </td>
                                                                <td className="px-10 py-8">
                                                                    <div className="flex justify-end items-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-0">
                                                                        {canManageSRS && (
                                                                            <button 
                                                                                onClick={() => handleOpenTaskModal(req.requirementId)}
                                                                                className="p-3 text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-all"
                                                                                title="Tạo Task nhanh"
                                                                            >
                                                                                <PlusCircle size={20} />
                                                                            </button>
                                                                        )}
                                                                        <button 
                                                                            onClick={() => { setSelectedReq(req); setIsReqModalOpen(true); }}
                                                                            className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-2xl transition-all hover:shadow-lg active:scale-90"
                                                                            title="Sửa yêu cầu"
                                                                        >
                                                                            <Edit3 size={20} />
                                                                        </button>
                                                                        {canManageSRS && (
                                                                            <button 
                                                                                onClick={() => { setSelectedReq(req); setIsJiraModalOpen(true); }}
                                                                                className="p-3 text-slate-400 hover:text-blue-600 hover:bg-white rounded-2xl transition-all hover:shadow-lg active:scale-90"
                                                                                title="Gán Jira Key"
                                                                            >
                                                                                <LinkIcon size={20} />
                                                                            </button>
                                                                        )}
                                                                        {canManageSRS && (
                                                                            <button 
                                                                                onClick={() => handleDelete(req.requirementId)}
                                                                                className="p-3 text-slate-400 hover:text-red-600 hover:bg-white rounded-2xl transition-all hover:shadow-lg active:scale-90"
                                                                                title="Xóa yêu cầu"
                                                                            >
                                                                                <Trash2 size={20} />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                            {expandedReqId === req.requirementId && (
                                                                <tr>
                                                                    <td colSpan={5} className="bg-slate-50/50 px-10 py-8">
                                                                        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-top-4 duration-300">
                                                                            <div className="px-8 py-5 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                                                                                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Danh sách công việc (Tasks)</h4>
                                                                                <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full italic">Liên kết trực tiếp với {req.jiraIssueKey || 'No Jira'}</span>
                                                                            </div>
                                                                            <RequirementTaskList requirementId={req.requirementId} />
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </>
                                                )
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Modals */}
                <RequirementModal 
                    isOpen={isReqModalOpen}
                    onClose={() => { setIsReqModalOpen(false); setSelectedReq(null); }}
                    onSubmit={handleCreateOrUpdate}
                    initialData={selectedReq}
                />
                <JiraKeyModal 
                    isOpen={isJiraModalOpen}
                    onClose={() => { setIsJiraModalOpen(false); setSelectedReq(null); }}
                    onSubmit={handleAssignJira}
                    initialKey={selectedReq?.jiraIssueKey}
                    requirementTitle={selectedReq?.title || ''}
                />
                {groupId && (
                    <CreateTaskModal 
                        isOpen={isTaskModalOpen}
                        onClose={() => { setIsTaskModalOpen(false); setTaskTargetReqId(null); }}
                        groupId={groupId}
                        initialRequirementId={taskTargetReqId || ''}
                        onCreated={() => {
                            if (taskTargetReqId) {
                                // Refresh tasks for this requirement
                                setExpandedReqId(null);
                                setTimeout(() => setExpandedReqId(taskTargetReqId), 100);
                            }
                            fetchRequirements(groupId);
                        }}
                    />
                )}
            </div>
        </MainLayout>
    );
};

const RequirementTaskList = ({ requirementId }: { requirementId: string }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await taskService.getTasksByRequirementId(requirementId);
                setTasks((res as any) || []);
            } catch (err) {
                console.error("Lỗi tải task", err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [requirementId]);

    if (loading) return <div className="p-10 text-center text-xs font-black text-slate-300 uppercase animate-pulse tracking-widest">Đang tải công việc...</div>;

    if (tasks.length === 0) return (
        <div className="p-10 text-center">
            <p className="text-sm font-bold text-slate-400 italic">Chưa có công việc nào được gán cho yêu cầu này.</p>
        </div>
    );

    const statusIcons: Record<string, any> = {
        DONE: <CheckCircle2 className="text-emerald-500" size={16} />,
        IN_PROGRESS: <Clock className="text-blue-500" size={16} />,
        TODO: <Circle className="text-slate-300" size={16} />,
    };

    return (
        <div className="divide-y divide-slate-100">
            {tasks.map(task => (
                <div key={task.taskId} className="px-8 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors group/item">
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                            {statusIcons[task.status] || <Circle size={16} />}
                        </div>
                        <div>
                            <div className="text-sm font-black text-slate-800">{task.title}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                Assigned to: <span className="text-slate-600">{task.assignedTo ? `User ${task.assignedTo.slice(0, 4)}` : 'Unassigned'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter border ${
                            task.priority === 'HIGH' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                        }`}>
                            {task.priority}
                        </div>
                        <div className="text-[10px] font-black text-slate-300 group-hover/item:text-indigo-400 transition-colors">
                            #{task.taskId.slice(0, 6)}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default RequirementTable;