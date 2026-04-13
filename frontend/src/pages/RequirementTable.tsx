import { useEffect, useState } from 'react';
import { requirementService, type Requirement } from '../api/requirement.service';
import { Edit3, Trash2, Link as LinkIcon, PlusCircle, Layout } from 'lucide-react';
import groupService from '../api/group.service';
import authService from '../api/auth.service';
import RequirementModal from '../components/requirements/RequirementModal';
import JiraKeyModal from '../components/requirements/JiraKeyModal';

const RequirementTable = ({ groupId }: { groupId: string }) => {
    const [requirements, setRequirements] = useState<Requirement[]>([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<'Leader' | 'Member' | 'Lecturer' | 'NoRole'>('NoRole');
    
    // Modal states
    const [isReqModalOpen, setIsReqModalOpen] = useState(false);
    const [isJiraModalOpen, setIsJiraModalOpen] = useState(false);
    const [selectedReq, setSelectedReq] = useState<Requirement | null>(null);

    useEffect(() => {
        if (groupId) {
            localStorage.setItem('lastVisitedGroupId', groupId);
        }
        const init = async () => {
            setLoading(true);
            try {
                // Fetch basic requirements first
                await fetchRequirements();
                // Then determine roles
                await checkUserRole();
            } catch (err) {
                console.error("Lỗi khởi tạo trang yêu cầu:", err);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [groupId]);

    const checkUserRole = async () => {
        try {
            // Get current user info from profile service instead of just localStorage
            const profile = await authService.getProfile();
            const currentUserId = profile.userId;
            const systemRoles = profile.roles || [];
            
            // 1. Check System Role (ADMIN / LECTURER)
            if (systemRoles.includes('ROLE_LECTURER') || systemRoles.includes('LECTURER')) {
                setUserRole('Lecturer');
                return;
            }

            // 2. Check Group Role from backend
            const members = await groupService.getMembers(groupId);
            
            // Backend assumed to return member objects with userId and roleInGroup
            const member = members.find((m: any) => 
                String(m.userId) === String(currentUserId) || 
                m.email === profile.email
            );
            
            if (member) {
                const roleLower = String(member.roleInGroup || member.role).toUpperCase();
                if (roleLower.includes('LEADER') || roleLower.includes('ADMIN')) {
                    setUserRole('Leader');
                } else {
                    setUserRole('Member');
                }
            } else {
                setUserRole('NoRole');
            }
        } catch (error) {
            console.error("Lỗi kiểm tra quyền hạn:", error);
            // Fallback to Member if within a group, or NoRole
            setUserRole('Member'); 
        }
    };

    const fetchRequirements = async () => {
        try {
            const res = await requirementService.getByGroup(groupId);
            setRequirements(res.data || []);
        } catch (error) {
            console.error("Lỗi lấy danh sách yêu cầu:", error);
        }
    };

    const handleCreateOrUpdate = async (data: Partial<Requirement>) => {
        try {
            if (selectedReq) {
                await requirementService.update(selectedReq.id, data);
            } else {
                await requirementService.create({ ...data, groupId });
            }
            setIsReqModalOpen(false);
            setSelectedReq(null);
            fetchRequirements();
        } catch (err) {
            alert("Lỗi khi lưu yêu cầu. Vui lòng kiểm tra lại thông tin.");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Bạn có chắc muốn xóa yêu cầu này? Thao tác này không thể hoàn tác.")) return;
        try {
            await requirementService.delete(id);
            fetchRequirements();
        } catch (err) {
            console.error("Lỗi xóa yêu cầu:", err);
            alert("Không thể xóa yêu cầu. Có thể nó đang được liên kết với các task khác.");
        }
    };

    const handleAssignJira = async (jiraKey: string) => {
        if (!selectedReq) return;
        try {
            await requirementService.update(selectedReq.id, { jiraIssueKey: jiraKey });
            setIsJiraModalOpen(false);
            setSelectedReq(null);
            fetchRequirements();
        } catch (err) {
            alert("Lỗi khi gán Jira Key. Hãy đảm bảo format Key hợp lệ (VD: ABC-123).");
        }
    };

    const getPriorityColor = (p: string) => {
        const priority = String(p).toUpperCase();
        if (priority === 'HIGH') return 'bg-red-100 text-red-700 border-red-200';
        if (priority === 'MEDIUM') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        return 'bg-blue-100 text-blue-700 border-blue-200';
    };

    const isLeader = userRole === 'Leader';

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 animate-pulse">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-indigo-600 font-bold tracking-wide">Đang tải cấu trúc yêu cầu...</p>
        </div>
    );

    return (
        <div className="bg-white rounded-2xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden font-sans">
            {/* Header section */}
            <div className="bg-gradient-to-r from-slate-50 to-white p-8 border-b border-slate-100 flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100">
                        <Layout size={28} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Software Requirements</h2>
                        <p className="text-sm text-slate-500 font-medium">Quản lý và đồng bộ yêu cầu phần mềm với Jira Epic</p>
                    </div>
                </div>
                
                {isLeader && (
                    <button 
                        onClick={() => { setSelectedReq(null); setIsReqModalOpen(true); }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 shadow-xl shadow-indigo-100 hover:-translate-y-0.5 active:translate-y-0"
                    >
                        <PlusCircle size={20} />
                        Thêm Yêu Cầu
                    </button>
                )}
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 text-slate-400 uppercase text-[10px] font-black tracking-[0.2em]">
                            <th className="px-8 py-5 border-b border-slate-100">Chi tiết yêu cầu</th>
                            <th className="px-8 py-5 border-b border-slate-100 text-center">Ưu tiên</th>
                            <th className="px-8 py-5 border-b border-slate-100 text-center">Trạng thái</th>
                            <th className="px-8 py-5 border-b border-slate-100">Tiến độ phân tích</th>
                            <th className="px-8 py-5 border-b border-slate-100">Jira Key</th>
                            {isLeader && <th className="px-8 py-5 border-b border-slate-100 text-right">Thao tác</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {requirements.map((req) => (
                            <tr key={req.id} className="hover:bg-slate-50/30 transition-all group">
                                <td className="px-8 py-6">
                                    <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-lg mb-1">{req.title}</div>
                                    <div className="text-sm text-slate-500 font-medium leading-relaxed max-w-md line-clamp-2">{req.description || "Không có nội dung mô tả bổ sung."}</div>
                                </td>
                                <td className="px-8 py-6 text-center">
                                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${getPriorityColor(req.priority)}`}>
                                        {req.priority}
                                    </span>
                                </td>
                                <td className="px-8 py-6 text-center">
                                    <span className="text-xs font-bold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm">
                                        {req.status}
                                    </span>
                                </td>
                                <td className="px-8 py-6 min-w-[200px]">
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/20 p-0.5">
                                            <div 
                                                className={`h-full transition-all duration-1000 ease-out shadow-sm rounded-full ${req.progress === 100 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 'bg-gradient-to-r from-indigo-500 to-blue-600'}`} 
                                                style={{ width: `${req.progress}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-xs font-black text-slate-900 tabular-nums">{req.progress}%</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    {req.jiraIssueKey ? (
                                        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl border border-indigo-100 font-mono text-xs font-bold shadow-sm">
                                            <LinkIcon size={14} className="opacity-70" />
                                            {req.jiraIssueKey}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-slate-300 italic text-xs">
                                            <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                                            Chưa đồng bộ
                                        </div>
                                    )}
                                </td>
                                {isLeader && (
                                    <td className="px-8 py-6">
                                        <div className="flex justify-end items-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-4 group-hover:translate-x-0">
                                            <button 
                                                onClick={() => { setSelectedReq(req); setIsReqModalOpen(true); }}
                                                className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all"
                                                title="Sửa yêu cầu"
                                            >
                                                <Edit3 size={18} />
                                            </button>
                                            <button 
                                                onClick={() => { setSelectedReq(req); setIsJiraModalOpen(true); }}
                                                className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"
                                                title="Gán Jira Key"
                                            >
                                                <LinkIcon size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(req.id)}
                                                className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all"
                                                title="Xóa yêu cầu"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
                {requirements.length === 0 && (
                    <div className="py-24 text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-50 rounded-3xl mb-6 shadow-inner border border-slate-100">
                            <PlusCircle size={36} className="text-slate-300" />
                        </div>
                        <h3 className="text-slate-800 font-bold text-lg">Hệ thống yêu cầu đang trống</h3>
                        <p className="text-slate-400 font-medium max-w-xs mx-auto mt-2">Dự án của bạn chưa có requirement nào được tạo.</p>
                        {isLeader && (
                            <button 
                                onClick={() => { setSelectedReq(null); setIsReqModalOpen(true); }}
                                className="mt-6 text-indigo-600 font-bold hover:underline"
                            >
                                Thêm yêu cầu đầu tiên ngay &rarr;
                            </button>
                        )}
                    </div>
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
    );
};

export default RequirementTable;