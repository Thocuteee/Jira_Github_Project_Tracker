import React, { useState } from 'react';
import { Building2, BookOpen, GraduationCap, CheckCircle2, AlertCircle } from 'lucide-react';
import groupService from '../api/group.service';
import MainLayout from '../components/layout/MainLayout';

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
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        groupName: '',
        course: '',
        lecturerEmail: '',
        leaderEmail: '',
        githubRepo: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const payload = {
                groupName: formData.groupName,
            };
            await groupService.createGroup(payload);
            setSuccess('Đã tạo Group thành công! Team Leader có thể bắt đầu thêm thành viên.');
            setStep(5);
        } catch (err: any) {
            setError(err.message || 'Có lỗi xảy ra khi tạo group');
        } finally {
            setLoading(false);
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
                                    <div className="flex items-center justify-center w-7 h-7 rounded-full border-4 border-slate-800 bg-blue-500 text-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow">
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
                                        <h4 className="font-semibold text-sm">Gán Lecturer</h4>
                                    </div>
                                </div>

                                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                                    <div className={`flex items-center justify-center w-7 h-7 rounded-full border-4 border-slate-800 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow ${step >= 3 ? 'bg-blue-500 text-white' : 'bg-slate-600 text-slate-400'}`}>
                                        3
                                    </div>
                                    <div className={`w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-3 rounded-lg ${step >= 3 ? 'bg-slate-700 text-white' : 'opacity-50'}`}>
                                        <h4 className="font-semibold text-sm">Chọn Team Leader</h4>
                                    </div>
                                </div>

                                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                                    <div className={`flex items-center justify-center w-7 h-7 rounded-full border-4 border-slate-800 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow ${step >= 4 ? 'bg-blue-500 text-white' : 'bg-slate-600 text-slate-400'}`}>
                                        4
                                    </div>
                                    <div className={`w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-3 rounded-lg ${step >= 4 ? 'bg-slate-700 text-white' : 'opacity-50'}`}>
                                        <h4 className="font-semibold text-sm">Kết nối GitHub</h4>
                                    </div>
                                </div>

                                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                                    <div className={`flex items-center justify-center w-7 h-7 rounded-full border-4 border-slate-800 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow ${step >= 5 ? 'bg-green-500 text-white' : 'bg-slate-600 text-slate-400'}`}>
                                        5
                                    </div>
                                    <div className={`w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-3 rounded-lg ${step >= 5 ? 'bg-slate-700 text-white' : 'opacity-50'}`}>
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
                                            placeholder="Nhập tên group..."
                                            value={formData.groupName}
                                            onChange={(e) => { handleChange(e); setStep(Math.max(step, 1)); }}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1 text-slate-500 flex items-center gap-1">
                                            <BookOpen size={14} /> Semester / Course
                                        </label>
                                        <select
                                            name="course"
                                            value={formData.course}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-600"
                                        >
                                            <option value="">-- Chọn khóa học --</option>
                                            <option value="SP24-SE102">SP24 - Kỹ nghệ phần mềm</option>
                                            <option value="FA24-PRJ301">FA24 - PRJ301</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Step 2 Data */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                                        <GraduationCap size={16} /> Gán Lecturer (Email)
                                    </label>
                                    <input
                                        type="email"
                                        name="lecturerEmail"
                                        placeholder="lecturer@fpt.edu.vn"
                                        value={formData.lecturerEmail}
                                        onChange={(e) => { handleChange(e); setStep(Math.max(step, 2)); }}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Hệ thống sẽ lookup user ID dựa vào email</p>
                                </div>

                                {/* Step 3 Data */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                                        Chọn Team Leader (Email)
                                    </label>
                                    <input
                                        type="email"
                                        name="leaderEmail"
                                        placeholder="leader@fpt.edu.vn"
                                        value={formData.leaderEmail}
                                        onChange={(e) => { handleChange(e); setStep(Math.max(step, 3)); }}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>

                                {/* Step 4 Data */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                                        <Github size={16} /> Kết nối GitHub Repo URL
                                    </label>
                                    <input
                                        type="url"
                                        name="githubRepo"
                                        placeholder="https://github.com/org/repo"
                                        value={formData.githubRepo}
                                        onChange={(e) => { handleChange(e); setStep(Math.max(step, 4)); }}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <hr className="my-6" />

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={loading || !formData.groupName}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow transition-colors disabled:opacity-50"
                                >
                                    {loading ? 'Đang tạo...' : 'Tạo Group Mới'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default AdminWorkspace;
