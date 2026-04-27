import { useState, useEffect, useMemo } from 'react';
import MainLayout from '../components/layout/MainLayout';
import type { Task } from '../api/task.service';
import taskService from '../api/task.service';
import groupService from '../api/group.service';
import authService from '../api/auth.service';
import { useGroupContext } from '../contexts/GroupContext';
import TaskDetailModal from '../components/TaskDetailModal';
import CreateTaskModal from '../components/CreateTaskModal';
import { getMemberRole } from '../utils/groupRole';
import { 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal, 
  ChevronUp, 
  ChevronDown, 
  Minus, 
  User as UserIcon,
  CheckCircle2,
  Clock,
  Circle,
  AlertTriangle,
  Calendar,
  Trash2,
  BadgeCheck
} from 'lucide-react';

interface GroupMemberRow {
  userId: string;
  roleInGroup: string;
}

const TaskTable = () => {
  const { selectedGroup, loading: groupLoading } = useGroupContext();
  const groupId = selectedGroup?.groupId;

  const [role, setRole] = useState<'LEADER' | 'MEMBER' | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [myTaskFilter, setMyTaskFilter] = useState<'ALL' | 'MINE'>('ALL');

  // Modal State
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMemberRow[]>([]);
  const [assigningTaskId, setAssigningTaskId] = useState<string | null>(null);
  const [userNameMap, setUserNameMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (groupId) {
      loadRoleAndTasks();
    } else {
      setTasks([]);
      setRole(null);
      setCurrentUserId(null);
      setGroupMembers([]);
    }
  }, [groupId]);

  const loadRoleAndTasks = async () => {
    if (!groupId) return;
    setLoading(true);
    try {
      const userProfile = await authService.getProfile();
      const uid = userProfile?.userId?.toString() ?? null;
      setCurrentUserId(uid);


      const members = await groupService.getMembers(groupId);
      const memberRows: GroupMemberRow[] = Array.isArray(members)
        ? members.map((m: any) => ({
          userId: String(m.userId),
          roleInGroup: String(m.roleInGroup ?? 'MEMBER'),
        }))
        : [];
      setGroupMembers(memberRows);

      let calculatedRole: 'LEADER' | 'MEMBER' = 'MEMBER';
      const myMemberInfo = memberRows.find((m) => m.userId === uid);
      if (myMemberInfo && myMemberInfo.roleInGroup.toUpperCase() === 'LEADER') {
        calculatedRole = 'LEADER';
      }
      setRole(calculatedRole);

      const data = await taskService.getTasksByGroup(groupId, calculatedRole);
      setTasks(data || []);

      // Fetch user names
      const allUserIds = new Set<string>();
      memberRows.forEach(m => allUserIds.add(m.userId));
      data.forEach(t => { if (t.assignedTo) allUserIds.add(t.assignedTo); });
      
      if (allUserIds.size > 0) {
        const names = await authService.getUserNames(Array.from(allUserIds));
        setUserNameMap(prev => ({ ...prev, ...names }));
      }
    } finally {
      setLoading(false);
    }
  };

  const loadTasksOnly = async () => {
    if (!groupId || !role) return;
    try {
      const data = await taskService.getTasksByGroup(groupId, role);
      setTasks(data || []);
    } catch (err: any) {
      console.error(err);
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter;
      const matchesPriority = priorityFilter === 'ALL' || task.priority === priorityFilter;
      const matchesMine = myTaskFilter === 'ALL' || (currentUserId != null && task.assignedTo === currentUserId);
      return matchesSearch && matchesStatus && matchesPriority && matchesMine;
    });
  }, [tasks, searchQuery, statusFilter, priorityFilter, myTaskFilter, currentUserId]);

  const assignableMembers = useMemo(
    () =>
      groupMembers.filter((member) => {
        const normalizedRole = getMemberRole(member);
        return normalizedRole === 'LEADER' || normalizedRole === 'MEMBER';
      }),
    [groupMembers]
  );

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await taskService.updateTaskStatus(taskId, newStatus);
      loadTasksOnly();
    } catch (err) {
      alert('Lỗi cập nhật trạng thái Task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Bạn có chắc muốn xoá Task này?')) return;
    try {
      await taskService.deleteTask(taskId);
      loadTasksOnly();
    } catch (err) {
      alert('Lỗi xoá Task');
    }
  };

  const handleAssignTask = async (taskId: string, assigneeUserId: string) => {
    setAssigningTaskId(taskId);
    try {
      await taskService.assignTask(taskId, assigneeUserId);
      await loadTasksOnly();
    } catch {
      alert('Không giao được task. Chỉ nhóm trưởng được giao việc.');
    } finally {
      setAssigningTaskId(null);
    }
  };

  const handlePriorityChange = async (taskId: string, newPriority: string) => {
    try {
      await taskService.updateTask(taskId, { priority: newPriority });
      loadTasksOnly();
    } catch (err) {
      alert('Lỗi cập nhật mức độ ưu tiên');
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'HIGH': return <ChevronUp className="text-red-500" size={16} strokeWidth={3} />;
      case 'MEDIUM': return <Minus className="text-orange-500" size={16} strokeWidth={3} />;
      case 'LOW': return <ChevronDown className="text-blue-500" size={16} strokeWidth={3} />;
      default: return null;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DONE': return <CheckCircle2 className="text-green-500" size={18} />;
      case 'IN_PROGRESS': return <Clock className="text-blue-500" size={18} />;
      case 'TODO': 
      default: return <Circle className="text-slate-300" size={18} />;
    }
  };

  const getAvatarColor = (userId: string) => {
    const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500'];
    const index = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  return (
    <MainLayout>
      <div className="bg-slate-50 min-h-full p-8">
        <div className="max-w-[1400px] mx-auto space-y-6">
          
          {/* Top Bar / Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Bảng Công Việc
                {groupId && <span className="text-sm font-medium text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-200">#{groupId.slice(0, 8)}</span>}
              </h1>
              <p className="text-slate-500 mt-1 font-medium">Theo dõi và quản lý tiến độ các nhiệm vụ của nhóm bạn.</p>
            </div>

            {role === 'LEADER' && groupId && (
              <button 
                onClick={() => setIsCreateOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-xl shadow-blue-200 active:scale-95"
              >
                <Plus size={20} strokeWidth={3} /> Tạo Task Mới
              </button>
            )}
          </div>

          {!groupId && !groupLoading && (
            <div className="bg-white p-12 rounded-[2.5rem] border-2 border-dashed border-slate-200 text-center space-y-4">
              <div className="mx-auto w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300">
                <Filter size={40} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">Chưa chọn nhóm làm việc</h3>
                <p className="text-slate-500">Vui lòng chọn một Group bên thanh Menu trái để bắt đầu quản lý task.</p>
              </div>
            </div>
          )}

          {groupId && (
            <>
              {/* Filter & Search Bar */}
              <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200 flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[300px] relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                  <input 
                    type="text"
                    placeholder="Tìm kiếm công việc theo tiêu đề..."
                    className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 outline-none transition-all font-medium text-slate-700"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl">
                    <Filter size={16} className="text-slate-400" />
                    <select 
                      className="bg-transparent text-sm font-bold text-slate-600 outline-none cursor-pointer"
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)}
                    >
                      <option value="ALL">Tất cả trạng thái</option>
                      <option value="TODO">Mới (Todo)</option>
                      <option value="IN_PROGRESS">Đang làm</option>
                      <option value="DONE">Hoàn thành</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl">
                    <AlertTriangle size={16} className="text-slate-400" />
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

                  <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1">
                    <button
                      type="button"
                      onClick={() => setMyTaskFilter('ALL')}
                      className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                        myTaskFilter === 'ALL'
                          ? 'bg-white text-slate-800 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Tất cả
                    </button>
                    <button
                      type="button"
                      onClick={() => setMyTaskFilter('MINE')}
                      className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                        myTaskFilter === 'MINE'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Task của tôi
                    </button>
                  </div>
                </div>
              </div>

              {/* Task Table Container */}
              <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 text-slate-400 text-xs font-black uppercase tracking-[0.15em] border-b border-slate-100">
                        <th className="py-6 px-8">Công việc</th>
                        <th className="py-6 px-6">Ưu tiên</th>
                        <th className="py-6 px-6">Người nhận</th>
                        <th className="py-6 px-6">Trạng thái</th>
                        <th className="py-6 px-8 text-right w-32">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {loading ? (
                        <tr><td colSpan={5} className="py-20 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                            <p className="text-slate-500 font-bold">Đang lấy dữ liệu...</p>
                          </div>
                        </td></tr>
                      ) : filteredTasks.length === 0 ? (
                        <tr><td colSpan={5} className="py-20 text-center">
                          <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300">
                              <Search size={32} />
                            </div>
                            <p className="text-slate-500 font-bold">Không tìm thấy công việc nào phù hợp.</p>
                          </div>
                        </td></tr>
                      ) : (
                        filteredTasks.map(task => (
                          <tr
                            key={task.taskId}
                            className={`transition-all group ${
                              task.assignedTo === currentUserId
                                ? 'bg-blue-50/60 hover:bg-blue-100/60 border-l-4 border-l-blue-500'
                                : 'hover:bg-blue-50/30'
                            }`}
                          >
                            <td className="py-5 px-8">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span 
                                    className="font-bold text-slate-800 text-lg cursor-pointer hover:text-blue-600 transition-colors leading-tight"
                                    onClick={() => {
                                      setSelectedTask(task);
                                      setIsDetailOpen(true);
                                    }}
                                  >
                                    {task.title}
                                  </span>
                                  {task.jiraIssueKey && (
                                    <span title={`Jira Key: ${task.jiraIssueKey}`} className="flex items-center justify-center p-1 bg-blue-100 text-blue-600 rounded-md">
                                      <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M11.53 2c0 2.4-1.97 4.38-4.38 4.38h-.77V2h5.15zm-5.15 5.15c2.4 0 4.38 1.97 4.38 4.38v.77h-5.15V7.15zm5.15 5.15c0 2.4-1.97 4.38-4.38 4.38h-.77v-4.38h5.15zM22 17.45c0 2.4-1.97 4.38-4.38 4.38h-.77v-4.38H22v4.38zm-5.15-5.15c2.4 0 4.38 1.97 4.38 4.38v.77h-5.15v-5.15zm5.15-5.15c0 2.4-1.97 4.38-4.38 4.38h-.77V7.15H22v4.38z"/></svg>
                                    </span>
                                  )}
                                  {task.assignedTo === currentUserId && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
                                      <BadgeCheck size={11} />
                                      Của tôi
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-slate-400 mt-1 flex items-center gap-1 font-medium">
                                  <Calendar size={12} /> Hạn: {task.dueDate || 'N/A'}
                                </span>
                              </div>
                            </td>
                            
                            <td className="py-5 px-6">
                              {role === 'LEADER' ? (
                                <select 
                                  value={task.priority}
                                  onChange={(e) => handlePriorityChange(task.taskId, e.target.value)}
                                  className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                                >
                                  <option value="LOW">Thấp</option>
                                  <option value="MEDIUM">Vừa</option>
                                  <option value="HIGH">Cao</option>
                                </select>
                              ) : (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-xl w-fit">
                                  {getPriorityIcon(task.priority)}
                                  <span className="text-xs font-black text-slate-600 uppercase tracking-wider">{task.priority}</span>
                                </div>
                              )}
                            </td>

                            <td className="py-5 px-6">
                              {role === 'LEADER' ? (
                                <select 
                                  disabled={assigningTaskId === task.taskId || assignableMembers.length === 0}
                                  value={task.assignedTo || ''}
                                  onChange={(e) => handleAssignTask(task.taskId, e.target.value)}
                                  className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
                                >
                                  <option value="">Chưa giao</option>
                                  {assignableMembers.map(m => (
                                    <option key={m.userId} value={m.userId}>
                                      {m.userId === currentUserId ? 'Bạn' : (userNameMap[m.userId] || `Member: ${m.userId.slice(0, 8)}...`)}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <div className="flex items-center gap-2">
                                  {task.assignedTo ? (
                                    <>
                                      <div className={`w-8 h-8 rounded-xl ${getAvatarColor(task.assignedTo)} flex items-center justify-center text-white font-bold text-xs ring-2 ring-white shadow-md`}>
                                        {task.assignedTo === currentUserId ? 'YOU' : <UserIcon size={14} />}
                                      </div>
                                      <span className="text-xs font-bold text-slate-600">
                                        {task.assignedTo === currentUserId ? 'Của bạn' : (userNameMap[task.assignedTo] || `User ${task.assignedTo.slice(0, 4)}`)}
                                      </span>
                                    </>
                                  ) : (
                                    <span className="text-xs italic text-slate-400">Chưa ai nhận</span>
                                  )}
                                </div>
                              )}
                            </td>

                            <td className="py-5 px-6">
                              <div className="flex items-center gap-3">
                                {getStatusIcon(task.status)}
                                <select 
                                  value={task.status || 'TODO'}
                                  onChange={(e) => handleStatusChange(task.taskId, e.target.value)}
                                  className="bg-transparent border-none p-0 text-sm font-black text-slate-700 uppercase tracking-widest outline-none cursor-pointer hover:text-blue-600 transition-colors"
                                >
                                  <option value="TODO">Cần làm</option>
                                  <option value="IN_PROGRESS">Đang làm</option>
                                  <option value="DONE">Đã xong</option>
                                </select>
                              </div>
                            </td>

                            <td className="py-5 px-8 text-right">
                              {role === 'LEADER' ? (
                                <button 
                                  onClick={() => handleDeleteTask(task.taskId)}
                                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                  title="Xoá task"
                                >
                                  <Trash2 size={20} />
                                </button>
                              ) : (
                                <MoreHorizontal size={20} className="text-slate-300 inline-block" />
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {selectedTask && (
          <TaskDetailModal
            isOpen={isDetailOpen}
            onClose={() => setIsDetailOpen(false)}
            task={selectedTask}
            role={role || 'MEMBER'}
            groupMembers={groupMembers}
            currentUserId={currentUserId}
            userNameMap={userNameMap}
            onUpdate={loadTasksOnly}
          />
        )}

        <CreateTaskModal 
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          groupId={groupId || ''}
          groupMembers={groupMembers}
          currentUserId={currentUserId}
          userNameMap={userNameMap}
          onCreated={loadTasksOnly}
        />
      </div>
    </MainLayout>
  );
};

export default TaskTable;
