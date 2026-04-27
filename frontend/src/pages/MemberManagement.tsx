import { useEffect, useMemo, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Plus, Search, Loader2, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';
import authClient from '@/api/authClient';
import authService from '@/api/auth.service';

type AnyUser = {
  userId?: string;
  id?: string;
  name?: string;
  email?: string;
  status?: string;
  roles?: any[];
};

function roleNames(u: AnyUser): string[] {
  const roles = Array.isArray(u.roles) ? u.roles : [];
  return roles.map((r: any) => (typeof r === 'string' ? r : r?.name || r?.name?.name)).filter(Boolean);
}

function isMemberUser(u: AnyUser) {
  const roles = roleNames(u).map(String);
  const isAdmin = roles.includes('ROLE_ADMIN');
  const isLecturer = roles.includes('ROLE_LECTURER');
  return !isAdmin && !isLecturer;
}

export default function MemberManagement() {
  const [users, setUsers] = useState<AnyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showEdit, setShowEdit] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', password: '' });
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await authClient.get('/api/auth/users');
      const all = Array.isArray(res) ? res : (res as any)?.data || (res as any)?.content || [];
      setUsers((Array.isArray(all) ? all : []).filter(isMemberUser));
    } catch (e: any) {
      setUsers([]);
      setError(e?.message || 'Không thể tải danh sách member.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => String(u.name || '').toLowerCase().includes(q) || String(u.email || '').toLowerCase().includes(q));
  }, [query, users]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    setSuccess('');
    try {
      // Default role for member in backend: TEAM_MEMBER (see AuthController assign-role default)
      await authService.register({ name: form.name, email: form.email, password: form.password, roleName: 'TEAM_MEMBER' });
      setSuccess('Tạo Member thành công!');
      setForm({ name: '', email: '', password: '' });
      setShowModal(false);
      await fetchUsers();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Có lỗi khi tạo Member.');
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (u: AnyUser) => {
    const id = String(u.userId || u.id || '');
    if (!id) return;
    setEditId(id);
    setEditForm({ name: u.name || '', email: u.email || '', password: '' });
    setError('');
    setSuccess('');
    setShowEdit(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload: any = { name: editForm.name, email: editForm.email, roleName: 'TEAM_MEMBER' };
      if (editForm.password.trim()) payload.password = editForm.password;
      await authClient.put(`/api/auth/users/${editId}`, payload);
      setSuccess('Cập nhật Member thành công!');
      setShowEdit(false);
      await fetchUsers();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Không thể cập nhật Member.');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (u: AnyUser) => {
    const id = String(u.userId || u.id || '');
    if (!id) return;
    const newStatus = u.status === 'DISABLED' ? 'ACTIVE' : 'DISABLED';
    if (!window.confirm(`Bạn có chắc muốn ${newStatus === 'DISABLED' ? 'khóa' : 'mở khóa'} member này?`)) return;
    setError('');
    setSuccess('');
    try {
      await authService.updateUserStatus(id, newStatus);
      await fetchUsers();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Không thể đổi trạng thái.');
    }
  };

  const deleteUser = async (u: AnyUser) => {
    const id = String(u.userId || u.id || '');
    if (!id) return;
    if (!window.confirm(`Xóa member "${u.name || u.email}"? Hành động này không thể hoàn tác.`)) return;
    setError('');
    setSuccess('');
    try {
      await authClient.delete(`/api/auth/users/${id}`);
      setSuccess('Đã xóa member.');
      await fetchUsers();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Không thể xóa member.');
    }
  };

  return (
    <MainLayout>
      <div className="bg-white min-h-[calc(100vh-100px)] rounded-xl border border-slate-200 shadow-sm p-8 text-slate-600">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Quản lý Member</h1>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm shadow-blue-200"
            type="button"
          >
            <Plus size={18} /> Tạo Member mới
          </button>
        </div>

        {error ? (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-600 rounded-xl flex items-center gap-2.5 text-sm font-medium">
            <AlertCircle size={18} className="shrink-0" /> {error}
          </div>
        ) : null}
        {success ? (
          <div className="mb-5 p-3.5 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center gap-2.5 text-sm font-medium">
            <CheckCircle2 size={18} className="shrink-0" /> {success}
          </div>
        ) : null}

        <div className="flex gap-4 mb-6">
          <div className="flex-1 max-w-md relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc email..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-800 placeholder:text-slate-400 transition-all"
            />
          </div>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200 tracking-wider">
              <tr>
                <th className="px-6 py-4">MEMBER</th>
                <th className="px-6 py-4">EMAIL</th>
                <th className="px-6 py-4 text-center">TRẠNG THÁI</th>
                <th className="px-6 py-4 text-right">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center text-slate-500">
                    <div className="flex justify-center items-center gap-3">
                      <Loader2 className="animate-spin text-blue-500" size={24} />
                      <span className="font-medium">Đang tải dữ liệu...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center text-slate-500 font-medium">
                    Chưa có Member nào.
                  </td>
                </tr>
              ) : (
                filtered.map((u, idx) => {
                  const id = String(u.userId || u.id || idx);
                  return (
                    <tr key={id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{u.name || 'Vô danh'}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{u.email || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              u.status !== 'DISABLED' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {u.status !== 'DISABLED' ? 'Hoạt động' : 'Vô hiệu hóa'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(u)}
                            className="px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition shadow-sm"
                            type="button"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => toggleStatus(u)}
                            className={`px-3 py-1.5 border rounded-lg text-xs font-semibold transition shadow-sm ${
                              u.status !== 'DISABLED'
                                ? 'border-red-200 bg-white text-red-600 hover:bg-red-50'
                                : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                            }`}
                            type="button"
                          >
                            {u.status !== 'DISABLED' ? 'Khóa' : 'Mở khóa'}
                          </button>
                          <button
                            onClick={() => deleteUser(u)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 border border-red-200 bg-white rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition shadow-sm"
                            type="button"
                          >
                            <Trash2 size={14} /> Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {showModal ? (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-[520px] p-7 shadow-2xl border border-slate-100">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Tạo Member mới</h3>
              <form onSubmit={handleCreate} className="space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Họ tên *</label>
                    <input
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Email *</label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Mật khẩu tạm *</label>
                  <input
                    required
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                    disabled={creating}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-200 transition-colors disabled:opacity-50 flex items-center gap-2"
                    disabled={creating}
                  >
                    {creating ? <><Loader2 className="animate-spin" size={16} /> Đang tạo...</> : 'Tạo tài khoản'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {showEdit ? (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-[520px] p-7 shadow-2xl border border-slate-100">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Cập nhật Member</h3>
              <form onSubmit={handleSave} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Họ tên *</label>
                  <input
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Email *</label>
                  <input
                    required
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Mật khẩu mới</label>
                  <input
                    type="password"
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all"
                    placeholder="Để trống nếu không đổi"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowEdit(false)}
                    className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                    disabled={saving}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-200 transition-colors disabled:opacity-50 flex items-center gap-2"
                    disabled={saving}
                  >
                    {saving ? <><Loader2 className="animate-spin" size={16} /> Đang lưu...</> : 'Lưu thay đổi'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </div>
    </MainLayout>
  );
}

