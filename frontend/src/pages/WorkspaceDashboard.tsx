import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Clock, GitBranch } from 'lucide-react';
import axios from 'axios';

const WorkspaceDashboard = () => {
  const { groupId } = useParams();
  const [groupInfo, setGroupInfo] = useState<{ name?: string } | null>(null);
  const [stats, setStats] = useState({ total: 0, done: 0 });

  useEffect(() => {
    // 1. Lấy thông tin Group (8082)
    axios.get(`http://localhost:8080/api/groups/${groupId}`).then(res => setGroupInfo(res.data)).catch(err => console.error("Lỗi lấy thông tin group:", err));
    // 2. Lấy thống kê Task (8083)
    axios.get(`http://localhost:8080/api/tasks/stats?groupId=${groupId}`).then(res => setStats(res.data)).catch(err => {
      console.error("Lỗi lấy thống kê task:", err);
      setStats({ total: 0, done: 0 }); // fallback properties
    });
  }, [groupId]);

  const progress = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar nội bộ của Group */}
      <aside className="w-64 border-r border-slate-100 bg-slate-50/50 p-6 flex flex-col gap-8">
        <div className="font-bold text-blue-600 text-xl px-2 italic">Project Manager</div>
        <nav className="flex flex-col gap-2">
          <Link to={`/workspace/${groupId}`} className="flex items-center gap-3 p-3 bg-blue-600 text-white rounded-xl shadow-md">Dashboard</Link>
          <Link to={`/tasks?groupId=${groupId}`} className="flex items-center gap-3 p-3 text-slate-600 hover:bg-white rounded-xl transition-all">Bảng công việc</Link>
          <Link to={`/members?groupId=${groupId}`} className="flex items-center gap-3 p-3 text-slate-600 hover:bg-white rounded-xl transition-all">Thành viên</Link>
          <Link to={`/settings?groupId=${groupId}`} className="flex items-center gap-3 p-3 text-slate-600 hover:bg-white rounded-xl transition-all">Cấu hình GitHub</Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10">
        <header className="mb-10 flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900">{groupInfo?.name || "Loading..."}</h2>
            <p className="text-slate-400 mt-1">Tổng quan tiến độ và hoạt động của dự án</p>
          </div>
          <div className="flex -space-x-2">
             {/* Hiện avatar thành viên ở đây */}
             {[1,2,3].map(i => <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200" />)}
          </div>
        </header>

        {/* Thanh tiến độ khổng lồ */}
        <section className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white mb-10 shadow-2xl shadow-blue-200">
          <div className="flex justify-between items-center mb-4">
            <span className="text-blue-100 font-medium">Tiến độ tổng thể</span>
            <span className="text-4xl font-black">{progress}%</span>
          </div>
          <div className="w-full bg-blue-900/30 h-4 rounded-full overflow-hidden backdrop-blur-sm">
            <div className="bg-white h-full transition-all duration-1000 ease-out" style={{ width: `${progress}%` }} />
          </div>
        </section>

        {/* Các thẻ thống kê nhanh */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-center gap-4">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-xl"><Clock size={24}/></div>
            <div>
                <p className="text-slate-500 text-sm font-medium">Đang làm</p>
                <h4 className="text-2xl font-bold">{stats.total - stats.done} Tasks</h4>
            </div>
          </div>
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-center gap-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-xl"><CheckCircle2 size={24}/></div>
            <div>
                <p className="text-slate-500 text-sm font-medium">Hoàn thành</p>
                <h4 className="text-2xl font-bold">{stats.done} Tasks</h4>
            </div>
          </div>
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-center gap-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-xl"><GitBranch size={24}/></div>
            <div>
                <p className="text-slate-500 text-sm font-medium">GitHub Status</p>
                <h4 className="text-2xl font-bold text-green-600">Connected</h4>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WorkspaceDashboard;