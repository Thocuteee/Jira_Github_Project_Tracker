import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import groupService from '../api/group.service';
import MainLayout from '../components/layout/MainLayout';
// Mock hàm lấy User ID từ Email (Vì BE yêu cầu UUID, nhưng UI yêu cầu email)
// Thực tế hàm này sẽ gọi Auth/User service.
const getUserIdByEmailMock = async (email: string) => {
    // Trả về một mã UUID ảo để làm mẫu
    console.log(`Mock looking up user by email: ${email}`);
    await new Promise(r => setTimeout(r, 500));
    return '123e4567-e89b-12d3-a456-42661417400' + Math.floor(Math.random() * 9);
};

const GroupMembers = () => {
    // Nếu không có param, dùng 'static' để test
    const { groupId = 'test-group-id' } = useParams();
    const [members, setMembers] = useState<any[]>([]);

    // Form thêm
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('Team Member');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadMembers();
    }, [groupId]);

    const loadMembers = async () => {
        try {
            setMembers([
                { id: '1', name: 'Trần Minh Khoa', role: 'Team Leader', initial: 'TL' },
                { id: '2', name: 'Lê Thị Hoa', role: 'Team Member', initial: 'TM' },
                { id: '3', name: 'Nguyễn Văn An', role: 'Team Member', initial: 'TM' },
            ]);
        } catch (err) {
            console.error('Failed to load members', err);
        }
    };

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            // Lấy ID từ Email
            const userId = await getUserIdByEmailMock(email);

            // Gọi api thêm thành viên
            await groupService.addMember(groupId, userId, role);

            // Cập nhật State tạm
            const newMember = {
                id: userId,
                name: email.split('@')[0],
                role: role,
                initial: role === 'Team Leader' ? 'TL' : 'TM'
            };
            setMembers(prev => [...prev, newMember]);
            setEmail('');
        } catch (err: any) {
            setError(err.message || 'Lỗi thêm thành viên');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (memberId: string) => {
        if (!confirm('Bạn có chắc muốn xoá thành viên này?')) return;
        try {
            await groupService.removeMember(groupId, memberId);
            setMembers(members.filter(m => m.id !== memberId));
        } catch (err) {
            alert('Lỗi xoá thành viên');
        }
    };

    return (
        <MainLayout>
            <div className="max-w-2xl mx-auto p-6">

                {/* Dark Card matching the user's mockup */}
                <div className="bg-[#242424] rounded-xl border border-[#333] shadow-xl overflow-hidden text-slate-200 font-sans">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-[#333] bg-[#2a2a2a]">
                        <h2 className="text-lg font-bold text-slate-100">UI add Member (Team Leader)</h2>
                    </div>

                    <div className="p-6">
                        <p className="text-sm text-slate-300 font-semibold mb-6">Trang: Thành viên nhóm → Thêm thành viên</p>

                        {error && <div className="text-red-400 text-sm mb-4">{error}</div>}

                        {/* Form */}
                        <form onSubmit={handleAddMember} className="space-y-4 mb-8">
                            <div>
                                <label className="block text-sm text-slate-400 font-medium mb-1">
                                    Tìm theo email hoặc tên
                                </label>
                                <input
                                    required
                                    type="email" // Bắt buộc email như yêu cầu
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="vd: nguyen@fpt.edu.vn"
                                    className="w-full px-4 py-2 bg-[#1b1b1b] border border-[#444] rounded-md text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 font-medium mb-1">
                                    Role trong nhóm
                                </label>
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="w-full px-4 py-2 bg-[#1b1b1b] border border-[#2a6fd8] rounded-md text-slate-200 appearance-none focus:outline-none focus:ring-1 focus:ring-[#2a6fd8]"
                                >
                                    <option value="Team Leader">Team Leader</option>
                                    <option value="Team Member">Team Member</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-2.5 bg-[#2a2a2a] hover:bg-[#333] border border-[#444] rounded-md text-slate-200 font-medium transition-colors mt-2"
                            >
                                {loading ? 'Đang thêm...' : '+ Thêm vào nhóm'}
                            </button>
                        </form>

                        {/* Member List */}
                        <div>
                            <h3 className="text-sm text-slate-400 font-medium mb-4">Danh sách hiện tại</h3>
                            <div className="space-y-4">
                                {members.map((member) => (
                                    <div key={member.id} className="flex justify-between items-center border-b border-[#333] pb-4 last:border-0 last:pb-0">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-[#fde68a] text-amber-800 flex items-center justify-center font-bold text-sm shrink-0">
                                                {member.initial || 'U'}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-100">{member.name}</div>
                                                <div className="text-xs font-semibold bg-[#fde68a] text-amber-900 inline-block px-2 py-0.5 rounded-full mt-1">
                                                    {member.role}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Hiển thị nút Xóa đối với Team Member */}
                                        {member.role !== 'Team Leader' && (
                                            <button
                                                onClick={() => handleDelete(member.id)}
                                                className="px-4 py-1.5 border border-[#555] rounded-md text-slate-300 text-sm hover:bg-slate-800 transition-colors"
                                            >
                                                Xoá
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default GroupMembers;
