import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { Search, ChevronDown, Plus, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import authService from '../api/auth.service';
import authClient from '../api/authClient'; 

export default function LecturerManagement() {
    const [lecturers, setLecturers] = useState<any[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [lecturerForm, setLecturerForm] = useState({
        name: '', email: '', password: '', provider: 'LOCAL', avatar: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchLecturers = async () => {
        setIsLoadingData(true);
        try {
            // Sửa đường dẫn đúng theo Controller Backend: /api/auth/users
            const response = await authClient.get('/api/auth/users'); 
            console.log("Dữ liệu API trả về:", response); // response đã là data rồi nhé

            let allUsers = [];
            if (Array.isArray(response)) {
                allUsers = response;
            } else if (response && typeof response === 'object' && Array.isArray((response as any).data)) {
                allUsers = (response as any).data;
            } else if (response && typeof response === 'object' && Array.isArray((response as any).content)) {
                allUsers = (response as any).content;
            }

            // LỌC CHỈ LẤY GIẢNG VIÊN (ROLE_LECTURER)
            const lecturerList = allUsers.filter((u: any) => 
                u.roles && u.roles.some((r: any) => r.name === 'ROLE_LECTURER')
            );
            
            setLecturers(lecturerList); 
        } catch (err: any) {
            console.error("Lỗi khi tải danh sách Lecturer:", err);
            setLecturers([]);
        } finally {
            setIsLoadingData(false);
        }
    };

    useEffect(() => {
        fetchLecturers();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setLecturerForm({ ...lecturerForm, [e.target.name]: e.target.value });
    };

    const handleCreateLecturer = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); setError(''); setSuccess('');

        try {
            await authService.createLecturer({
                name: lecturerForm.name,
                email: lecturerForm.email,
                password: lecturerForm.password
            });
            
            setSuccess('Tạo tài khoản Lecturer thành công!');
            
            setTimeout(() => {
                setShowModal(false);
                setSuccess('');
                setLecturerForm({ name: '', email: '', password: '', provider: 'LOCAL', avatar: '' });
                fetchLecturers();
            }, 1500);

        } catch (err: any) {
            setError(err.message || 'Có lỗi xảy ra khi tạo tài khoản');
        } finally {
            setLoading(false);
        }
    };

    const getInitials = (name: string) => {
        if (!name) return 'U';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    // Đảm bảo an toàn khi đếm số lượng
    const totalLecturers = Array.isArray(lecturers) ? lecturers.length : 0;
    const activeLecturers = Array.isArray(lecturers) ? lecturers.filter(l => l?.status !== 'DISABLED').length : 0;

    return (
        <MainLayout>
            <div className="bg-white min-h-[calc(100vh-100px)] rounded-xl border border-slate-200 shadow-sm p-8 font-sans text-slate-600">
                
                {/* Header Section */}
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Quản lý Lecturer</h1>
                    <button 
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm shadow-blue-200"
                    >
                        <Plus size={18} /> Tạo Lecturer mới
                    </button>
                </div>

                {/* Stats Row */}
                <div className="flex gap-16 mb-8 text-sm border-b border-slate-100 pb-8">
                    <div>
                        <div className="text-slate-500 font-medium mb-1 tracking-wide text-xs uppercase">Tổng Lecturer</div>
                        <div className="text-slate-900 text-3xl font-bold">
                            {isLoadingData ? '-' : totalLecturers}
                        </div>
                    </div>
                    <div>
                        <div className="text-slate-500 font-medium mb-1 tracking-wide text-xs uppercase">Đang hoạt động</div>
                        <div className="text-green-600 text-3xl font-bold">
                            {isLoadingData ? '-' : activeLecturers}
                        </div>
                    </div>
                </div>

                {/* Filter and Search */}
                <div className="flex gap-4 mb-6">
                    <div className="flex-1 max-w-md relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Tìm theo tên hoặc email..." 
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-800 placeholder:text-slate-400 transition-all"
                        />
                    </div>
                    <div className="w-48 relative">
                        <select className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 appearance-none text-slate-700 font-medium cursor-pointer transition-all">
                            <option>Tất cả trạng thái</option>
                            <option>Hoạt động</option>
                            <option>Vô hiệu hóa</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                {/* Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200 tracking-wider">
                            <tr>
                                <th className="px-6 py-4">LECTURER</th>
                                <th className="px-6 py-4">EMAIL</th>
                                <th className="px-6 py-4">GROUPS ĐANG DẠY</th>
                                <th className="px-6 py-4 text-center">TRẠNG THÁI</th>
                                <th className="px-6 py-4">THAO TÁC</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {isLoadingData ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center text-slate-500">
                                        <div className="flex justify-center items-center gap-3">
                                            <Loader2 className="animate-spin text-blue-500" size={24} /> 
                                            <span className="font-medium">Đang tải dữ liệu...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (!Array.isArray(lecturers) || lecturers.length === 0) ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center text-slate-500 font-medium">
                                        Chưa có Lecturer nào trong hệ thống hoặc lỗi nạp dữ liệu.
                                    </td>
                                </tr>
                            ) : (
                                lecturers.map((lecturer: any, index: number) => (
                                    // Dùng fallback index nếu lecturer.id bị undefined
                                    <tr key={lecturer?.id || index} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4 w-[250px]">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0">
                                                    {getInitials(lecturer?.name)}
                                                </div>
                                                <span className="font-semibold text-slate-900">{lecturer?.name || 'Vô danh'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">{lecturer?.email || 'N/A'}</td>
                                        <td className="px-6 py-4 text-slate-900 font-medium">0 groups</td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center justify-center ${lecturer?.status !== 'DISABLED' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                                    {lecturer?.status !== 'DISABLED' ? 'Hoạt động' : 'Vô hiệu hóa'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition shadow-sm">Sửa</button>
                                                <button className="px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition shadow-sm">Xem groups</button>
                                                {lecturer?.status !== 'DISABLED' ? (
                                                    <button className="px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 hover:border-red-200 transition shadow-sm">Khóa</button>
                                                ) : (
                                                    <button className="px-3 py-1.5 border border-green-200 bg-green-50 text-green-600 rounded-lg text-xs font-semibold hover:bg-green-100 transition shadow-sm">Mở khóa</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Floating Modal for Creation (Light Theme) */}
                {showModal && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-2xl w-full max-w-[500px] p-7 shadow-2xl border border-slate-100">
                            <h3 className="text-xl font-bold text-slate-900 mb-6">Tạo Lecturer mới</h3>
                            
                            {error && (
                                <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-600 rounded-xl flex items-center gap-2.5 text-sm font-medium">
                                    <AlertCircle size={18} className="shrink-0" /> {error}
                                </div>
                            )}
                            
                            {success && (
                                <div className="mb-5 p-3.5 bg-green-50 border border-green-200 text-green-600 rounded-xl flex items-center gap-2.5 text-sm font-medium">
                                    <CheckCircle2 size={18} className="shrink-0" /> {success}
                                </div>
                            )}
                            
                            <form onSubmit={handleCreateLecturer} className="space-y-5">
                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Họ tên <span className="text-red-500">*</span></label>
                                        <input required type="text" name="name" value={lecturerForm.name} onChange={handleChange} placeholder="Nguyễn Văn A" 
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Email <span className="text-red-500">*</span></label>
                                        <input required type="email" name="email" value={lecturerForm.email} onChange={handleChange} placeholder="name@uth.edu.vn" 
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Mật khẩu tạm <span className="text-red-500">*</span></label>
                                        <input required type="password" name="password" value={lecturerForm.password} onChange={handleChange} placeholder="••••••••" 
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm text-slate-900 tracking-[0.2em] focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Provider</label>
                                        <div className="relative">
                                            <select name="provider" value={lecturerForm.provider} onChange={handleChange} 
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white appearance-none font-semibold cursor-pointer transition-all">
                                                <option value="LOCAL">LOCAL</option>
                                                <option value="GOOGLE">GOOGLE</option>
                                            </select>
                                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="pt-2">
                                     <p className="text-[11px] text-slate-500 flex items-center gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                        <AlertCircle size={12}/> Lecturer sẽ tự động được yêu cầu đổi mật khẩu sau lần đăng nhập đầu tiên.
                                    </p>
                                </div>

                                <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
                                    <button type="button" onClick={() => setShowModal(false)} disabled={loading} 
                                        className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors disabled:opacity-50 shadow-sm">
                                        Hủy
                                    </button>
                                    <button type="submit" disabled={loading} 
                                        className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-200 transition-colors disabled:opacity-50 flex items-center gap-2">
                                        {loading ? <><Loader2 className="animate-spin" size={16}/> Đang tạo...</> : 'Tạo tài khoản'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}