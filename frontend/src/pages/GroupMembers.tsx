import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, Crown, Mail, Plus, Search, Shield } from 'lucide-react';
import groupService from '../api/group.service';
import MainLayout from '../components/layout/MainLayout';
import authClient from '../api/authClient';

type GroupMember = {
    userId: string;
    roleInGroup: string;
};

type UserLookup = {
    userId: string;
    name?: string;
    email?: string;
};

const GroupMembers = () => {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const [members, setMembers] = useState<GroupMember[]>([]);
    const [allUsers, setAllUsers] = useState<UserLookup[]>([]);
    const [searchEmail, setSearchEmail] = useState('');
    const [selectedUser, setSelectedUser] = useState<UserLookup | null>(null);
    const [role, setRole] = useState('LECTURER');
    const [loading, setLoading] = useState(false);
    const [loadingMembers, setLoadingMembers] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLeaderOfGroup, setIsLeaderOfGroup] = useState(false);

    useEffect(() => {
        if (!groupId) return;
        void loadMembers();
        void loadUsers();
        void loadPermission();
    }, [groupId]);

    const isAdmin = useMemo(() => {
        try {
            const roles = JSON.parse(localStorage.getItem('userRoles') || '[]');
            return Array.isArray(roles) && roles.includes('ROLE_ADMIN');
        } catch {
            return false;
        }
    }, []);
    const canManageMembers = isAdmin || isLeaderOfGroup;

    const usersById = useMemo(
        () =>
            allUsers.reduce<Record<string, UserLookup>>((acc, user) => {
                if (user.userId) acc[user.userId] = user;
                return acc;
            }, {}),
        [allUsers]
    );

    const loadMembers = async () => {
        if (!groupId) return;
        try {
            setLoadingMembers(true);
            const data = await groupService.getMembers(groupId);
            setMembers(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to load members', err);
            setMembers([]);
        } finally {
            setLoadingMembers(false);
        }
    };

    const loadUsers = async () => {
        try {
            const response = await authClient.get('/api/auth/users');
            let users: any[] = [];
            if (Array.isArray(response)) {
                users = response;
            } else if (response && typeof response === 'object' && Array.isArray((response as any).data)) {
                users = (response as any).data;
            } else if (response && typeof response === 'object' && Array.isArray((response as any).content)) {
                users = (response as any).content;
            }

            const normalized = users.map((u) => ({
                userId: String(u.userId || u.id),
                name: u.name,
                email: u.email
            }));
            setAllUsers(normalized.filter((u) => u.userId));
        } catch (err) {
            console.error('Failed to load users', err);
            setAllUsers([]);
        }
    };

    const loadPermission = async () => {
        if (!groupId || isAdmin) {
            setIsLeaderOfGroup(false);
            return;
        }
        try {
            const isLeader = await groupService.checkLeader(groupId);
            setIsLeaderOfGroup(Boolean(isLeader));
        } catch {
            setIsLeaderOfGroup(false);
        }
    };

    const handleFindByEmail = () => {
        setError('');
        setSuccess('');

        const keyword = searchEmail.trim().toLowerCase();
        if (!keyword) {
            setSelectedUser(null);
            return;
        }

        const found = allUsers.find((u) => (u.email || '').toLowerCase() === keyword);
        if (!found) {
            setSelectedUser(null);
            setError('Không tìm thấy người dùng với email này.');
            return;
        }

        setSelectedUser(found);
    };

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!groupId || !selectedUser) return;
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            await groupService.addMember(groupId, selectedUser.userId, role);
            setSuccess('Đã thêm thành viên thành công.');
            setSearchEmail('');
            setSelectedUser(null);
            setRole('LECTURER');
            await loadMembers();
        } catch (err: any) {
            setError(err?.response?.data?.message || err.message || 'Lỗi thêm thành viên');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (memberId: string) => {
        if (!groupId) return;
        if (!confirm('Bạn có chắc muốn xoá thành viên này?')) return;
        try {
            await groupService.removeMember(groupId, memberId);
            await loadMembers();
        } catch (err) {
            alert('Lỗi xoá thành viên hoặc không đủ quyền');
        }
    };

    if (!groupId) {
        return (
            <MainLayout>
                <div className="max-w-4xl mx-auto">
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-600">
                        Không tìm thấy group. Vui lòng chọn workspace trước.
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="max-w-5xl mx-auto p-6">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Thành viên Workspace</h1>
                        <p className="text-sm text-slate-500 mt-1">Quản lý thành viên theo email và phân quyền trong nhóm</p>
                    </div>
                    {!canManageMembers && (
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="text-sm px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                        >
                            Quay lại Dashboard
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                            <div className="flex items-center gap-2 text-slate-800 font-semibold mb-4">
                                <Shield size={18} />
                                Thêm thành viên
                            </div>
                            {!canManageMembers ? (
                                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                                    Chỉ tài khoản Admin hoặc Leader của nhóm mới được thêm/xóa thành viên.
                                </div>
                            ) : (
                                <form onSubmit={handleAddMember} className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-slate-700">Email người dùng</label>
                                        <div className="mt-1 flex gap-2">
                                            <input
                                                value={searchEmail}
                                                onChange={(e) => setSearchEmail(e.target.value)}
                                                type="email"
                                                placeholder="name@uth.edu.vn"
                                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleFindByEmail}
                                                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
                                            >
                                                <Search size={14} />
                                                Tìm
                                            </button>
                                        </div>
                                    </div>

                                    {selectedUser && (
                                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                                            <div className="font-semibold text-slate-900">{selectedUser.name || 'Không có tên'}</div>
                                            <div className="text-slate-600 inline-flex items-center gap-1 mt-1">
                                                <Mail size={14} />
                                                {selectedUser.email || '-'}
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label className="text-sm font-medium text-slate-700">Quyền trong nhóm</label>
                                        <select
                                            value={role}
                                            onChange={(e) => setRole(e.target.value)}
                                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                                        >
                                            <option value="LECTURER">Lecturer</option>
                                            <option value="MEMBER">Member</option>
                                            <option value="LEADER">Leader</option>
                                        </select>
                                        <p className="mt-1 text-xs text-slate-500">
                                            Chọn `Leader` để gán quyền leader cho lecturer này.
                                        </p>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading || !selectedUser}
                                        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                                    >
                                        <Plus size={16} />
                                        {loading ? 'Đang thêm...' : 'Thêm vào nhóm'}
                                    </button>
                                </form>
                            )}
                            {error && (
                                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 inline-flex items-start gap-2">
                                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                    {error}
                                </div>
                            )}
                            {success && (
                                <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                                    {success}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                            <h2 className="text-base font-semibold text-slate-900 mb-4">Danh sách thành viên</h2>
                            {loadingMembers ? (
                                <div className="text-sm text-slate-500 py-6">Đang tải danh sách thành viên...</div>
                            ) : members.length === 0 ? (
                                <div className="text-sm text-slate-500 py-6">Chưa có thành viên trong nhóm.</div>
                            ) : (
                                <div className="space-y-3">
                                    {members.map((member) => {
                                        const info = usersById[member.userId];
                                        const normalizedRole = (member.roleInGroup || '').toUpperCase();
                                        const isLeader = normalizedRole === 'LEADER';
                                        const isLecturer = normalizedRole === 'LECTURER';
                                        return (
                                            <div
                                                key={member.userId}
                                                className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3"
                                            >
                                                <div>
                                                    <div className="font-medium text-slate-900">{info?.name || member.userId}</div>
                                                    <div className="text-sm text-slate-500">{info?.email || 'Không có email'}</div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span
                                                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                            isLeader
                                                                ? 'bg-amber-100 text-amber-800'
                                                                : isLecturer
                                                                    ? 'bg-blue-100 text-blue-800'
                                                                    : 'bg-slate-100 text-slate-700'
                                                        }`}
                                                    >
                                                        {isLeader && <Crown size={12} />}
                                                        {isLeader ? 'Leader' : isLecturer ? 'Lecturer' : 'Member'}
                                                    </span>
                                                    {canManageMembers && !isLeader && (
                                                        <button
                                                            onClick={() => handleDelete(member.userId)}
                                                            className="text-sm px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                                                        >
                                                            Xóa
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default GroupMembers;
