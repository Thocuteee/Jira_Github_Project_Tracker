import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { 
    BarChart3, 
    GitBranch,
    Activity,
    Share2,
    Download,
    Filter,
    ListChecks,
    ShieldAlert,
} from 'lucide-react';
import { useGroup } from '../contexts/GroupContext';
import ProjectProgressReport from '../components/reports/ProjectProgressReport';
import TaskExecutionReport from '../components/reports/TaskExecutionReport';
import CommitStatisticsReport from '../components/reports/CommitStatisticsReport';
import JiraIssueListReport from '../components/reports/JiraIssueListReport';
import SRSExportPanel from '../components/reports/SRSExportPanel';
import MainLayout from '../components/layout/MainLayout';

type TabType = 'progress' | 'tasks' | 'jira' | 'github' | 'export';
type ReportsNavState = {
    activeTab?: TabType;
    selectedRequirementIds?: string[];
};

const MANAGEMENT_ROLES = ['ROLE_ADMIN', 'ROLE_LECTURER'];

export default function ReportsDashboard() {
    const { groupId } = useParams<{ groupId: string }>();
    const location = useLocation();
    const { selectedGroup, groups, loading: groupsLoading } = useGroup();
    const [activeTab, setActiveTab] = useState<TabType>('progress');
    const navState = location.state as ReportsNavState | null;
    const selectedRequirementIds = navState?.selectedRequirementIds;

    useEffect(() => {
        if (navState?.activeTab) {
            setActiveTab(navState.activeTab);
        }
    }, [navState?.activeTab]);

    const userRoles = useMemo<string[]>(() => {
        try {
            const raw = localStorage.getItem('userRoles');
            return raw ? JSON.parse(raw).map(String) : [];
        } catch {
            return [];
        }
    }, []);

    const isManagement = userRoles.some((r) => MANAGEMENT_ROLES.includes(r));
    const hasAccessToGroup = useMemo(() => {
        if (!groupId) return false;
        if (isManagement) return true;
        return groups.some((g) => g.groupId === groupId);
    }, [groupId, groups, isManagement]);

    const activeGroupName = useMemo(() => {
        if (selectedGroup && selectedGroup.groupId === groupId) return selectedGroup.groupName;
        const matched = groups.find((g) => g.groupId === groupId);
        return matched?.groupName || selectedGroup?.groupName || 'Nhóm hiện tại';
    }, [groupId, groups, selectedGroup]);

    if (!groupId) {
        return (
            <MainLayout>
                <div className="max-w-[1400px] mx-auto">
                    <div className="flex h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/50">
                        <BarChart3 className="mb-4 h-12 w-12 text-slate-300" />
                        <h2 className="text-xl font-bold text-slate-900">Vui lòng chọn nhóm</h2>
                        <p className="text-slate-500">Bạn cần truy cập từ workspace của một nhóm để xem báo cáo.</p>
                    </div>
                </div>
            </MainLayout>
        );
    }

    if (!groupsLoading && !hasAccessToGroup) {
        return (
            <MainLayout>
                <div className="max-w-[1400px] mx-auto">
                    <div className="flex h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-red-200 bg-red-50/30 text-center px-6">
                        <ShieldAlert className="mb-4 h-12 w-12 text-red-400" />
                        <h2 className="text-xl font-bold text-slate-900">Bạn không có quyền xem báo cáo của nhóm này</h2>
                        <p className="text-slate-500 mt-2">
                            Tài khoản hiện tại không thuộc nhóm được chọn. Vui lòng quay lại danh sách nhóm và chọn nhóm bạn tham gia.
                        </p>
                    </div>
                </div>
            </MainLayout>
        );
    }

    const content = (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Professional Header Section */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Báo cáo & Thống kê</h1>
                    <p className="text-sm font-medium text-slate-500">Phân tích chuyên sâu cho <span className="text-slate-900 font-bold">{activeGroupName}</span></p>
                </div>
                
                <div className="flex items-center gap-2">
                    <button className="inline-flex items-center gap-2 rounded-lg bg-white border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                        <Filter size={14} /> Lọc dữ liệu
                    </button>
                    <button className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 transition-all shadow-md shadow-slate-200">
                        <Download size={14} /> Xuất PDF
                    </button>
                </div>
            </div>

            {/* Sub Navigation Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200">
                <TabLink 
                    active={activeTab === 'progress'} 
                    onClick={() => setActiveTab('progress')}
                    icon={<Activity size={16} />}
                    label="Tiến độ tổng thể"
                />
                <TabLink 
                    active={activeTab === 'tasks'} 
                    onClick={() => setActiveTab('tasks')}
                    icon={<BarChart3 size={16} />}
                    label="Phân bổ công việc"
                />
                <TabLink 
                    active={activeTab === 'jira'} 
                    onClick={() => setActiveTab('jira')}
                    icon={<ListChecks size={16} />}
                    label="Jira Tasks"
                />
                <TabLink 
                    active={activeTab === 'github'} 
                    onClick={() => setActiveTab('github')}
                    icon={<GitBranch size={16} />}
                    label="Hoạt động GitHub"
                />
                <TabLink 
                    active={activeTab === 'export'} 
                    onClick={() => setActiveTab('export')}
                    icon={<Share2 size={16} />}
                    label="Kết xuất SRS"
                />
            </div>

            {/* Dashboard Content */}
            <div className="py-2">
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {activeTab === 'progress' && <ProjectProgressReport groupId={groupId!} />}
                    {activeTab === 'tasks' && <TaskExecutionReport groupId={groupId!} />}
                    {activeTab === 'jira' && <JiraIssueListReport groupId={groupId!} />}
                    {activeTab === 'github' && <CommitStatisticsReport groupId={groupId!} />}
                    {activeTab === 'export' && (
                        <SRSExportPanel groupId={groupId!} initialSelectedRequirementIds={selectedRequirementIds} />
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <MainLayout>
            <div className="max-w-[1400px] mx-auto">
                {content}
            </div>
        </MainLayout>
    );
}

function TabLink({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: ReactNode, label: string }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-all duration-200 ${
                active 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
        >
            <span className={active ? 'text-blue-600' : 'text-slate-400'}>{icon}</span>
            {label}
        </button>
    );
}
