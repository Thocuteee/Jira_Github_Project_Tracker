import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, BookOpen, CheckCircle2, AlertCircle, Briefcase, Trash2 } from 'lucide-react';
import groupService from '../api/group.service';
import MainLayout from '../components/layout/MainLayout';
import { useGroup } from '@/contexts/GroupContext';

const Github = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
        <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
);

const AdminWorkspace = () => {
    const navigate = useNavigate();
    const { refreshGroups, setSelectedGroup, selectedGroup } = useGroup();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<{
        groupName: string;
        workspaceId: string;
        description: string;
        githubRepo: string;
        maxMembers: number;
        status: 'ACTIVE' | 'LOCKED';
    }>({
        groupName: '',
        workspaceId: '',
        description: '',
        githubRepo: '',
        maxMembers: 8,
        status: 'ACTIVE'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [createdGroupId, setCreatedGroupId] = useState<string | null>(null);
    const [allWorkspaces, setAllWorkspaces] = useState<any[]>([]);
    const [fetchingWorkspaces, setFetchingWorkspaces] = useState(false);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const roles = JSON.parse(localStorage.getItem('userRoles') || '[]');
                if (!roles.includes('ROLE_ADMIN')) return;
                setFetchingWorkspaces(true);
                const data = await groupService.getAllGroups();
                setAllWorkspaces(data || []);
            } catch (err) {
                console.error('Failed to fetch workspaces:', err);
            } finally {
                setFetchingWorkspaces(false);
            }
        };
        fetchAll();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'maxMembers' ? Number(value) : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const payload = {
                groupName: formData.groupName,
                githubRepoUrl: formData.githubRepo,
                description: formData.description,
                workspaceId: formData.workspaceId,
                maxMembers: formData.maxMembers,
                status: formData.status
            };
            const response = await groupService.createGroup(payload);
            const newGroupId = response.groupId || response.id;
            setSuccess('Đã tạo Group thành công! Bạn có thể thêm thành viên ngay tại trang Thành viên.');
            setCreatedGroupId(newGroupId);
            await refreshGroups();
            if (newGroupId) {
                setSelectedGroup({
                    groupId: newGroupId,
                    groupName: response.groupName || formData.groupName
                });
            }
            setStep(4);
        } catch (err: any) {
            setError(err.message || 'Có lỗi xảy ra khi tạo group');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteGroup = async (workspace: any) => {
        const groupId = workspace.groupId;
        if (!groupId) return;

        const confirmed = window.confirm(
            `Bạn có chắc muốn xóa workspace "${workspace.groupName}"?\nHành động này không thể hoàn tác.`
        );
        if (!confirmed) return;

        setError('');
        setSuccess('');
        try {
            await groupService.deleteGroup(groupId);
            setAllWorkspaces((prev) => prev.filter((ws) => ws.groupId !== groupId));
            if (selectedGroup?.groupId === groupId) {
                setSelectedGroup(null);
            }
            await refreshGroups();
            setSuccess('Đã xóa workspace thành công.');
        } catch (err: any) {
            setError(err?.response?.data?.message || err.message || 'Không thể xóa workspace');
        }
    };

    return (
        <MainLayout>
            <div className="max-w-4xl mx-auto p-6">
                <h1 className="text-2xl font-bold text-slate-800 mb-6">Quản lý Workspace (Admin)</h1>

                <div className="flex gap-8">
                    {/* Left: Progress Panel */}
                    <div className="w-1/3">
                        <div className="bg-slate-800 text-slate-300 rounded-xl p-6 shadow-lg shadow-slate-200">
                            <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
                                <Building2 size={18} />
                                Tiến trình thiết lập Group
                            </h3>

                            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[13px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-600 before:to-transparent">

                                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    <div className={`flex items-center justify-center w-7 h-7 rounded-full border-4 border-slate-800 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow ${step >= 1 ? 'bg-blue-500 text-white' : 'bg-slate-600 text-slate-400'}`}>
                                        1
                                    </div>
                                    <div className={`w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-3 rounded-lg ${step >= 1 ? 'bg-slate-700 text-white' : 'opacity-50'}`}>
                                        <h4 className="font-semibold text-sm">Tạo Group mới</h4>
                                        <p className="text-xs text-slate-400 mt-1">Tên group, course</p>
                                    </div>
                                </div>

                                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                                    <div className={`flex items-center justify-center w-7 h-7 rounded-full border-4 border-slate-800 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow ${step >= 2 ? 'bg-blue-500 text-white' : 'bg-slate-600 text-slate-400'}`}>
                                        2
                                    </div>
                                    <div className={`w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-3 rounded-lg ${step >= 2 ? 'bg-slate-700 text-white' : 'opacity-50'}`}>
                                        <h4 className="font-semibold text-sm">Thêm thành viên sau khi tạo</h4>
                                    </div>
                                </div>

                                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                                    <div className={`flex items-center justify-center w-7 h-7 rounded-full border-4 border-slate-800 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow ${step >= 3 ? 'bg-blue-500 text-white' : 'bg-slate-600 text-slate-400'}`}>
                                        3
                                    </div>
                                    <div className={`w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-3 rounded-lg ${step >= 3 ? 'bg-slate-700 text-white' : 'opacity-50'}`}>
                                        <h4 className="font-semibold text-sm">Kết nối GitHub</h4>
                                    </div>
                                </div>

                                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                                    <div className={`flex items-center justify-center w-7 h-7 rounded-full border-4 border-slate-800 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow ${step >= 4 ? 'bg-green-500 text-white' : 'bg-slate-600 text-slate-400'}`}>
                                        4
                                    </div>
                                    <div className={`w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-3 rounded-lg ${step >= 4 ? 'bg-slate-700 text-white' : 'opacity-50'}`}>
                                        <h4 className="font-semibold text-sm">Group Sẵn Sàng</h4>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>

                    {/* Right: Form Panel */}
                    <div className="w-2/3">
                        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-6 border-b pb-4">Tạo cấu hình Group (Admin)</h2>

                            {error && (
                                <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 text-sm">
                                    <AlertCircle size={18} /> {error}
                                </div>
                            )}

                            {success && (
                                <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg flex items-center gap-2 text-sm">
                                    <CheckCircle2 size={18} /> {success}
                                </div>
                            )}

                            <div className="space-y-5">
                                {/* Step 1 Data */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Tên Group *</label>
                                        <input
                                            required
                                            type="text"
                                            name="groupName"
                                            placeholder="vd: SE1801 - Nhóm 5"
                                            value={formData.groupName}
                                            onChange={(e) => { handleChange(e); setStep(Math.max(step, 1)); }}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                                            <BookOpen size={14} /> Workspace ID *
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            name="workspaceId"
                                            placeholder="vd: SWP391-SP25"
                                            value={formData.workspaceId}
                                            onChange={(e) => { handleChange(e); setStep(Math.max(step, 1)); }}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        />
                                        <p className="text-xs text-slate-500 mt-1">Định danh học kỳ/môn học để tích hợp service khác.</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả nhóm</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows={3}
                                        placeholder="Mô tả ngắn về nhóm hoặc mục tiêu project"
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Số thành viên tối đa</label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={20}
                                            name="maxMembers"
                                            value={formData.maxMembers}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Trạng thái</label>
                                        <select
                                            name="status"
                                            value={formData.status}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        >
                                            <option value="ACTIVE">ACTIVE</option>
                                            <option value="LOCKED">LOCKED</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Step 3 Data */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                                        <Github size={16} /> Kết nối GitHub Repo URL
                                    </label>
                                    <input
                                        type="url"
                                        name="githubRepo"
                                        placeholder="https://github.com/org/repo"
                                        value={formData.githubRepo}
                                        onChange={(e) => { handleChange(e); setStep(Math.max(step, 3)); }}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <hr className="my-6" />

                            <div className="flex justify-end gap-3">
                                {createdGroupId && (
                                    <button
                                        type="button"
                                        onClick={() => navigate(`/workspace/${createdGroupId}`)}
                                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow transition-colors"
                                    >
                                        Đi tới Workspace
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    disabled={loading || !formData.groupName || !formData.workspaceId}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow transition-colors disabled:opacity-50"
                                >
                                    {loading ? 'Đang tạo...' : 'Tạo Group Mới'}
                                </button>
                            </div>
                        </form>

                        {/* Global List for Admin */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mt-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <Briefcase size={20} className="text-blue-600" />
                                Danh sách tất cả Workspace
                            </h2>
                            {fetchingWorkspaces ? (
                                <div className="text-center py-10 text-slate-400">Đang tải danh sách...</div>
                            ) : allWorkspaces.length === 0 ? (
                                <div className="text-center py-10 text-slate-400 border border-dashed border-slate-200 rounded-lg">
                                    Chưa có workspace nào được tạo.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="text-slate-500 text-sm border-b border-slate-100">
                                                <th className="pb-3 font-semibold">Tên Workspace</th>
                                                <th className="pb-3 font-semibold">Mã (Key)</th>
                                                <th className="pb-3 font-semibold text-right">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {allWorkspaces.map((ws) => (
                                                <tr key={ws.groupId} className="hover:bg-slate-50 transition-colors">
                                                    <td className="py-4 font-medium text-slate-900">{ws.groupName}</td>
                                                    <td className="py-4 text-slate-500 text-sm font-mono">{ws.jiraProjectKey || 'N/A'}</td>
                                                    <td className="py-4 text-right">
                                                        <div className="inline-flex items-center gap-2">
                                                            <button
                                                                onClick={() => navigate(`/workspace/${ws.groupId}`)}
                                                                className="text-blue-600 hover:text-blue-800 font-medium text-sm transition px-3 py-1.5 rounded-md hover:bg-blue-50"
                                                            >
                                                                Chi tiết
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteGroup(ws)}
                                                                className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 font-medium text-sm transition px-3 py-1.5 rounded-md hover:bg-red-50 border border-red-200"
                                                            >
                                                                <Trash2 size={14} />
                                                                Xóa
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default AdminWorkspace;
