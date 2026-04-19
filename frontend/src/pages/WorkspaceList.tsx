import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Plus, Users, ArrowRight } from 'lucide-react';
import axios from 'axios';

interface Workspace {
  id: string;
  name: string;
  groupPrefix: string;
  memberCount?: number;
  status?: string;
  maxMembers?: number;
}

const WorkspaceList = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const navigate = useNavigate();
  const apiGatewayBaseUrl = import.meta.env.VITE_API_GATEWAY_URL || window.location.origin;

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const rolesStr = localStorage.getItem('userRoles') || '[]';
        const roles = JSON.parse(rolesStr);
        const isAdmin = roles.includes('ROLE_ADMIN');
        
        // Admin see all, others see their own
        const endpoint = isAdmin 
          ? `${apiGatewayBaseUrl}/api/groups` 
          : `${apiGatewayBaseUrl}/api/groups/my-groups`;
          
        const response = await axios.get(endpoint, { withCredentials: true });
        
        // Map backend fields to frontend interface
        const mapped = (response.data || []).map((item: any) => ({
          id: item.groupId,
          name: item.groupName,
          groupPrefix: item.jiraProjectKey || 'N/A',
          memberCount: 0, // Will be updated later
          status: item.status,
          maxMembers: item.maxMembers
        }));
        
        setWorkspaces(mapped);
      } catch (error) {
        console.error("Lỗi lấy danh sách nhóm:", error);
      }
    };
    fetchWorkspaces();
  }, [apiGatewayBaseUrl]);

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Không gian làm việc</h1>
            <p className="text-slate-500">
              {localStorage.getItem('userSubtitle') === 'Admin' 
                ? 'Tổng hợp danh sách các Workspace trong hệ thống' 
                : 'Chọn một dự án để bắt đầu quản lý'}
            </p>
          </div>
          <button onClick={() => navigate('/admin/workspace')} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">
            <Plus size={20} /> Tạo Workspace mới
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces.map((ws) => (
            <div 
              key={ws.id}
              onClick={() => navigate(`/workspace/${ws.id}`)}
              className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-xl transition-all cursor-pointer relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="text-blue-500" size={20} />
              </div>
              <div className="bg-blue-50 w-12 h-12 rounded-xl flex items-center justify-center text-blue-600 mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Layout size={24} />
              </div>
              <h3 className="font-bold text-xl text-slate-800 mb-1">{ws.name}</h3>
              <p className="text-slate-400 text-sm mb-6">Mã định danh: <span className="font-mono text-blue-500">{ws.groupPrefix}</span></p>
              
              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Users size={16} />
                <span>{ws.memberCount || 0}/{ws.maxMembers || 8} thành viên</span>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-lg ${ws.status === 'LOCKED' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                  {ws.status || 'ACTIVE'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WorkspaceList;