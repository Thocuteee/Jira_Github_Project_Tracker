import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Clock, CheckCircle2, GitBranch, Circle, Activity } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import type { Task } from '@/api/task.service';
import taskService from '@/api/task.service';

const WorkspaceDashboard = () => {
  const { groupId } = useParams();
  const [groupInfo, setGroupInfo] = useState<{ name?: string; groupName?: string } | null>(null);
  const [stats, setStats] = useState({ total: 0, done: 0 });
  const [tasks, setTasks] = useState<Task[]>([]);
  const apiGatewayBaseUrl = import.meta.env.VITE_API_GATEWAY_URL || window.location.origin;

  useEffect(() => {
    if (!groupId) return;

    axios
      .get(`${apiGatewayBaseUrl}/api/groups/${groupId}`)
      .then((res) => setGroupInfo(res.data))
      .catch((err) => console.error('Lỗi lấy thông tin group:', err));

    axios
      .get(`${apiGatewayBaseUrl}/api/tasks/stats?groupId=${groupId}`)
      .then((res) => setStats(res.data))
      .catch((err) => {
        console.error('Lỗi lấy thống kê task:', err);
        setStats({ total: 0, done: 0 });
      });

    taskService
      .getTasksByGroup(groupId, 'MEMBER')
      .then((res) => setTasks(Array.isArray(res) ? res : []))
      .catch(() => setTasks([]));
  }, [apiGatewayBaseUrl, groupId]);

  const progress = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
  const groupName = groupInfo?.groupName || groupInfo?.name || 'Loading...';
  const todoCount = useMemo(() => tasks.filter((t) => t.status === 'TODO').length, [tasks]);
  const inProgressCount = useMemo(() => tasks.filter((t) => t.status === 'IN_PROGRESS').length, [tasks]);
  const doneCount = useMemo(() => tasks.filter((t) => t.status === 'DONE').length, [tasks]);
  const recentTasks = useMemo(() => tasks.slice(0, 5), [tasks]);

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900">{groupName}</h2>
            <p className="text-slate-400 mt-1">Tổng quan tiến độ và hoạt động của dự án này</p>
          </div>
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200" />
            ))}
          </div>
        </header>

        <section className="bg-white border border-slate-200 rounded-3xl p-8 text-slate-800 mb-10 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <span className="text-slate-500 font-medium">Tiến độ tổng thể dự án</span>
            <span className="text-4xl font-black text-slate-800">{progress}%</span>
          </div>
          <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden">
            <div
              className="bg-slate-500 h-full transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center gap-4 shadow-sm">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-slate-500 text-sm font-medium">Công việc đang làm</p>
              <h4 className="text-2xl font-bold text-slate-900">{Math.max(stats.total - stats.done, 0)} Tasks</h4>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center gap-4 shadow-sm">
            <div className="p-3 bg-green-100 text-green-600 rounded-xl">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-slate-500 text-sm font-medium">Đã hoàn thành</p>
              <h4 className="text-2xl font-bold text-slate-900">{stats.done} Tasks</h4>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center gap-4 shadow-sm">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
              <GitBranch size={24} />
            </div>
            <div>
              <p className="text-slate-500 text-sm font-medium">GitHub Sync</p>
              <h4 className="text-2xl font-bold text-emerald-600">Connected</h4>
            </div>
          </div>
        </div>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-slate-800 font-semibold mb-4">
              <Circle size={16} className="text-slate-400" />
              To Do
            </div>
            <div className="text-3xl font-bold text-slate-900">{todoCount}</div>
            <p className="text-sm text-slate-500 mt-1">Công việc chưa bắt đầu</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-slate-800 font-semibold mb-4">
              <Activity size={16} className="text-blue-500" />
              In Progress
            </div>
            <div className="text-3xl font-bold text-slate-900">{inProgressCount}</div>
            <p className="text-sm text-slate-500 mt-1">Đang được xử lý</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-slate-800 font-semibold mb-4">
              <CheckCircle2 size={16} className="text-green-500" />
              Done
            </div>
            <div className="text-3xl font-bold text-slate-900">{doneCount}</div>
            <p className="text-sm text-slate-500 mt-1">Đã hoàn tất</p>
          </div>
        </section>

        <section className="mt-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent issues</h3>
          {recentTasks.length === 0 ? (
            <p className="text-sm text-slate-500">Chưa có task nào trong nhóm.</p>
          ) : (
            <div className="space-y-3">
              {recentTasks.map((task) => (
                <div key={task.taskId} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3">
                  <div>
                    <p className="font-medium text-slate-900">{task.title}</p>
                    <p className="text-xs text-slate-500">Priority: {task.priority}</p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                    {task.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </MainLayout>
  );
};

export default WorkspaceDashboard;