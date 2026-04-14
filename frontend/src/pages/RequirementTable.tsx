import { useEffect, useState, useMemo } from 'react';
import { requirementService, type Requirement } from '../api/requirement.service';
import { Edit3, Trash2, Link as LinkIcon, PlusCircle, Layout, Filter, Search } from 'lucide-react';
import groupService from '../api/group.service';
import authService from '../api/auth.service';
import MainLayout from '@/components/layout/MainLayout';
import { useGroupContext } from '@/contexts/GroupContext';
import RequirementModal from '../components/requirements/RequirementModal';
import JiraKeyModal from '../components/requirements/JiraKeyModal';

const RequirementTable = () => {
    const { selectedGroup, loading: groupLoading } = useGroupContext();
    const groupId = selectedGroup?.groupId;

    const [requirements, setRequirements] = useState<Requirement[]>([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<'Leader' | 'Member' | 'Lecturer' | 'Admin' | 'NoRole'>('NoRole');
    
    // Modal states
    const [isReqModalOpen, setIsReqModalOpen] = useState(false);
    const [isJiraModalOpen, setIsJiraModalOpen] = useState(false);
    const [selectedReq, setSelectedReq] = useState<Requirement | null>(null);

    // Search & Filter
    const [searchQuery, setSearchQuery] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('ALL');

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
            const currentUserId = profile.userId;
            const systemRoles = (profile.roles || []).map((r: string) => r.toUpperCase());
            
            // 1. Check System Roles first (ADMIN / LECTURER)
            if (systemRoles.includes('ROLE_ADMIN')) {
                setUserRole('Admin');
                return;
            }
            if (systemRoles.includes('ROLE_LECTURER')) {
                setUserRole('Lecturer');
                return;
            }

            // 2. Check Group Role from backend
            const members = await groupService.getMembers(gid);
            const member = members.find((m: any) => 
                String(m.userId) === String(currentUserId)
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
            setRequirements(res.data || []);
        } catch (error) {
            console.error("Lỗi lấy danh sách yêu cầu:", error);
        }
    };

    const handleCreateOrUpdate = async (data: Partial<Requirement>) => {
        if (!groupId) return;
        try {
            if (selectedReq) {
                await requirementService.update(selectedReq.id, data);
            } else {
                await requirementService.create({ ...data, groupId });
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
            await requirementService.update(selectedReq.id, { jiraIssueKey: jiraKey });
            setIsJiraModalOpen(false);
            setSelectedReq(null);
            fetchRequirements(groupId);
        } catch (err) {
            alert("Lỗi khi gán Jira Key.");
        }
    };

    const filteredRequirements = useMemo(() => {
        return requirements.filter(req => {
            const matchesSearch = req.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesPriority = priorityFilter === 'ALL' || req.priority === priorityFilter;
            return matchesSearch && matchesPriority;
        });
    }, [requirements, searchQuery, priorityFilter]);

    const getPriorityColor = (p: string) => {
        const priority = String(p).toUpperCase();
        if (priority === 'HIGH') return 'bg-red-100 text-red-700 border-red-200';
        if (priority === 'MEDIUM') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        return 'bg-blue-100 text-blue-700 border-blue-200';
    };

    // Permission Check: Only Leader can manage SRS
    const canManageSRS = userRole === 'Leader';

    return (
        <MainLayout>
            <div className="bg-slate-50 min-h-screen p-8 font-sans">
                <div className="max-w-[1440px] mx-auto space-y-8">
                    
                    {/* Header bar */}
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
                            {/* Filter bar */}
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
                                            <option value="HIGH">Ưu tiên Cao</option>
                                            <option value="MEDIUM">Ưu tiên Vừa</option>
                                            <option value="LOW">Ưu tiên Thấp</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Table container */}
                            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50 text-slate-400 uppercase text-[10px] font-black tracking-[0.2em] border-b border-slate-100">
                                                <th className="px-10 py-6">Nội dung Yêu cầu</th>
                                                <th className="px-10 py-6 text-center">Ưu tiên</th>
                                                <th className="px-10 py-6 text-center text-nowrap">Tiến độ</th>
                                                <th className="px-10 py-6">Sync Jira</th>
                                                {canManageSRS && <th className="px-10 py-6 text-right">Thao tác</th>}
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
                                                    <tr key={req.id} className="hover:bg-indigo-50/20 transition-all group">
                                                        <td className="px-10 py-8">
                                                            <div className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors text-xl mb-2">{req.title}</div>
                                                            <div className="text-sm text-slate-500 font-medium leading-relaxed max-w-lg line-clamp-2">{req.description || "Không có nội dung mô tả."}</div>
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
                                                                <div className="inline-flex items-center gap-2.5 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-2xl border border-indigo-100 font-mono text-xs font-black shadow-sm group-hover:bg-white group-hover:shadow-md transition-all">
                                                                    <LinkIcon size={14} className="opacity-70" />
                                                                    {req.jiraIssueKey}
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-2.5 text-slate-300 italic text-xs font-semibold">
                                                                    <div className="w-1.5 h-1.5 bg-slate-200 rounded-full"></div>
                                                                    Chưa đồng bộ Jira
                                                                </div>
                                                            )}
                                                        </td>
                                                        {canManageSRS && (
                                                            <td className="px-10 py-8">
                                                                <div className="flex justify-end items-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                                                                    <button 
                                                                        onClick={() => { setSelectedReq(req); setIsReqModalOpen(true); }}
                                                                        className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-2xl transition-all hover:shadow-lg active:scale-90"
                                                                        title="Sửa yêu cầu"
                                                                    >
                                                                        <Edit3 size={20} />
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => { setSelectedReq(req); setIsJiraModalOpen(true); }}
                                                                        className="p-3 text-slate-400 hover:text-blue-600 hover:bg-white rounded-2xl transition-all hover:shadow-lg active:scale-90"
                                                                        title="Gán Jira Key"
                                                                    >
                                                                        <LinkIcon size={20} />
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => handleDelete(req.id)}
                                                                        className="p-3 text-slate-400 hover:text-red-600 hover:bg-white rounded-2xl transition-all hover:shadow-lg active:scale-90"
                                                                        title="Xóa yêu cầu"
                                                                    >
                                                                        <Trash2 size={20} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        )}
                                                    </tr>
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
            </div>
        </MainLayout>
    );
};export default RequirementTable;