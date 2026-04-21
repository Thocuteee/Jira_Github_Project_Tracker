import { useState, useMemo, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { 
    GitBranch,
    RefreshCw,
    CheckCircle2,
    Settings,
    Activity,
    Link as LinkIcon,
    PlusCircle,
    XCircle,
    Save,
    ShieldCheck
} from 'lucide-react';
import githubService from '@/api/github.service';
import groupService from '@/api/group.service';
import authService from '@/api/auth.service';
import jiraService from '@/api/jira.service';

export default function Integrations() {
    // 1. Auth & Permissions
    const userRoles = useMemo(() => {
        try {
            const raw = localStorage.getItem('userRoles');
            return raw ? JSON.parse(raw).map(String) : [];
        } catch { return []; }
    }, []);

    const [currentUser, setCurrentUser] = useState<any>(null);
    const isAdmin = userRoles.includes('ROLE_ADMIN');
    const isLeader = userRoles.includes('ROLE_LEADER');
    const hasPermission = isAdmin || isLeader;

    // 2. State Management
    const [loading, setLoading] = useState(true);
    const [isSavingSettings, setIsSavingSettings] = useState(false);
    const [isSavingMapping, setIsSavingMapping] = useState(false);

    const [globalSettings, setGlobalSettings] = useState({
        jiraUrl: '',
        jiraEmail: '',
        jiraToken: '',
        githubPortalToken: ''
    });

    const [groups, setGroups] = useState<any[]>([]);
    const [mappings, setMappings] = useState<any[]>([]);
    const [commits, setCommits] = useState<any[]>([]);
    const [jiraStatus, setJiraStatus] = useState<'connected' | 'error' | 'loading' | 'none'>('loading');

    // State for Mapping Form
    const [showMappingForm, setShowMappingForm] = useState(false);
    const [editingMapping, setEditingMapping] = useState<any>(null);
    const [mappingForm, setMappingForm] = useState({
        groupId: '',
        jiraProjectKey: '',
        githubRepo: ''
    });

    const fetchData = async () => {
        setLoading(true);
        let settingsRes = null;
        try {
            try {
                settingsRes = await githubService.getGlobalSettings();
                if (settingsRes) setGlobalSettings(settingsRes);
            } catch (e) { console.error("Global settings fetch failed", e); }

            try {
                const groupsRes = await groupService.getAllGroups();
                if (groupsRes) setGroups(groupsRes);
            } catch (e) { console.error("Groups fetch failed", e); }

            try {
                const mappingsRes = await githubService.getAllMappings();
                if (mappingsRes) setMappings(mappingsRes);
            } catch (e) { console.error("Mappings fetch failed", e); }

            try {
                const profileRes = await authService.getProfile();
                if (profileRes) setCurrentUser(profileRes);
            } catch (e) { console.error("Profile fetch failed", e); }

            // Fetch Jira Health - Only if URL exists in state or response
            const jiraUrl = settingsRes?.jiraUrl || globalSettings.jiraUrl;
            if (jiraUrl) {
                try {
                    const isOk = await jiraService.testConnection();
                    setJiraStatus(isOk ? 'connected' : 'error');
                } catch (e) { 
                    console.error("Jira health check failed", e);
                    setJiraStatus('error');
                }
            } else {
                setJiraStatus('none');
            }

            // Fetch Recent Activities
            try {
                const activities = await jiraService.getActivities();
                if (activities) setCommits(activities);
            } catch (e) { console.error("Activities fetch failed", e); }

        } catch (error) {
            console.error("Critical error in fetchData:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // 4. Handlers
    const handleSaveJiraSettings = async () => {
        if (!globalSettings.jiraUrl || !globalSettings.jiraEmail || !globalSettings.jiraToken) {
            alert("Vui lòng nhập đầy đủ thông tin Jira!");
            return;
        }
        
        setIsSavingSettings(true);
        try {
            // Step 1: Test Connection FIRST
            // Wait, we need to save it momentarily to test it if it's new, 
            // but we can just test with what's in the state.
            // Since testConnection uses the GLOBAL client, we MUST save it first 
            // OR the backend must support testing with provided credentials.
            await githubService.saveGlobalSettings(globalSettings);
            
            // Double save to Jira service for dynamic connection
            try {
                await jiraService.saveGlobalSettings({
                    jiraUrl: globalSettings.jiraUrl,
                    jiraUsername: globalSettings.jiraEmail, // Mapping Email -> Username
                    jiraApiToken: globalSettings.jiraToken  // Mapping Token -> ApiToken
                });
            } catch (err) {
                console.error("Failed to sync global settings to Jira service", err);
            }
            
            const isOk = await jiraService.testConnection();
            if (isOk) {
                setJiraStatus('connected');
                alert("Đã kết nối và lưu cấu hình Jira thành công!");
            } else {
                setJiraStatus('error');
                alert("Kết nối thất bại! Vui lòng kiểm tra lại URL/Email/Token.");
            }
            fetchData();
        } catch (error) {
            alert("Lỗi khi lưu cấu hình!");
            setJiraStatus('error');
        } finally {
            setIsSavingSettings(false);
        }
    };

    const handleClearJiraSettings = async () => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa cấu hình Jira cũ?")) return;
        
        setIsSavingSettings(true);
        try {
            const clearedSettings = { ...globalSettings, jiraUrl: '', jiraEmail: '', jiraToken: '' };
            await githubService.saveGlobalSettings(clearedSettings);
            setGlobalSettings(clearedSettings);
            setJiraStatus('none');
            alert("Đã xóa cấu hình Jira!");
            fetchData();
        } catch (error) {
            alert("Lỗi khi xóa cấu hình!");
        } finally {
            setIsSavingSettings(false);
        }
    };

    const handleSaveGithubSettings = async () => {
        if (!globalSettings.githubPortalToken) {
            alert("Vui lòng nhập Token GitHub!");
            return;
        }
        setIsSavingSettings(true); 
        try {
            await githubService.saveGlobalSettings(globalSettings);
            alert("Đã lưu cấu hình GitHub Portal thành công!");
            fetchData();
        } catch (error) {
            alert("Lỗi khi lưu cấu hình!");
        } finally {
            setIsSavingSettings(false);
        }
    };

    const handleSaveMapping = async () => {
        if (!mappingForm.groupId || !mappingForm.jiraProjectKey || !mappingForm.githubRepo) {
            alert("Vui lòng điền đầy đủ thông tin mapping!");
            return;
        }
        setIsSavingMapping(true);
        try {
            await githubService.upsertMapping(mappingForm);
            
            // Double save to Jira Service to ensure it has the mapping
            try {
                await jiraService.upsertMapping(mappingForm.groupId, mappingForm.jiraProjectKey);
            } catch (err) {
                console.error("Failed to sync mapping to Jira service", err);
                // We continue because the primary mapping is in github-service
            }

            setShowMappingForm(false);
            fetchData();
            alert('Đã lưu ánh xạ nhóm');
            fetchData(); // Refresh list
        } catch (error) {
            alert("Lỗi khi lưu mapping!");
        } finally {
            setIsSavingMapping(false);
        }
    };

    const openEditMapping = (item: any) => {
        const mapping = item?.mapping ?? null;
        setMappingForm({
            groupId: mapping?.groupId || item?.groupId || '',
            jiraProjectKey: mapping?.jiraProjectKey || item?.jiraProjectKey || '',
            githubRepo: mapping?.githubRepo || item?.githubRepoUrl || ''
        });
        setEditingMapping(mapping);
        setShowMappingForm(true);
    };

    const handleDeleteMapping = async (id: string) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa mapping này?")) return;
        try {
            await githubService.deleteMapping(id);
            fetchData();
        } catch (error) {
            alert("Lỗi khi xóa!");
        }
    };

    // Derived: Merged Group + Mapping data for Table
    const mergedData = useMemo(() => {
        // Filter based on role: Admins see all, Leaders only see their own groups
        const filteredGroups = isAdmin 
            ? groups 
            : (currentUser ? groups.filter(g => g.leaderId === currentUser.userId) : []);

        return filteredGroups.map(group => {
            const mapping = mappings.find(m => m.groupId === group.groupId);
            return { ...group, mapping };
        });
    }, [groups, mappings, isAdmin, currentUser]);

    if (loading && groups.length === 0) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center h-full">
                    <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            {/* Header */}
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <Settings className="w-6 h-6 text-slate-500"/>
                        Trung tâm Tích hợp
                    </h1>
                    <p className="mt-1 text-sm text-slate-600">
                        Quản lý kết nối trung tâm và ánh xạ giữa Nhóm, GitHub và Jira
                    </p>
                </div>
            </div>

            {/* A. Cấu hình Toàn cục (Global Settings) - Chỉ Admin mới thấy */}
            {isAdmin && (
                <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 ${!hasPermission ? 'opacity-60 pointer-events-none' : ''}`}>
                    {/* Jira Config */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                <span className="bg-blue-100 p-1.5 rounded-md text-blue-600"><RefreshCw className="w-4 h-4" /></span>
                                Cấu hình Jira (Admin Only)
                            </h2>
                            {jiraStatus === 'connected' && (
                                <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full border border-emerald-100">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Connected</span>
                                </div>
                            )}
                        </div>
                        
                        <div className="space-y-4 flex-1">
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Môi trường Jira URL</label>
                                <input 
                                    value={globalSettings.jiraUrl} 
                                    onChange={e => setGlobalSettings({...globalSettings, jiraUrl: e.target.value})}
                                    disabled={jiraStatus === 'connected'}
                                    type="text" placeholder="https://team.atlassian.net" 
                                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500" 
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Email Admin</label>
                                    <input 
                                        value={globalSettings.jiraEmail} 
                                        onChange={e => setGlobalSettings({...globalSettings, jiraEmail: e.target.value})}
                                        disabled={jiraStatus === 'connected'}
                                        type="email" placeholder="admin@email.com" 
                                        className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 outline-none disabled:bg-slate-50" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Jira API Token</label>
                                    <input 
                                        value={globalSettings.jiraToken} 
                                        onChange={e => setGlobalSettings({...globalSettings, jiraToken: e.target.value})}
                                        disabled={jiraStatus === 'connected'}
                                        type="password" placeholder={jiraStatus === 'connected' ? "••••••••••••••••" : "Nhập token mới..."} 
                                        className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 outline-none disabled:bg-slate-50" 
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                            {jiraStatus === 'connected' ? (
                                <button 
                                    onClick={() => setJiraStatus('none')}
                                    className="text-xs font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-1.5 transition-colors"
                                >
                                    <Settings className="w-3.5 h-3.5" />
                                    Chỉnh sửa cấu hình
                                </button>
                            ) : (
                                <div />
                            )}
                            
                            <div className="flex gap-2">
                                {jiraStatus === 'connected' && (
                                    <button 
                                        onClick={handleClearJiraSettings}
                                        className="px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                    >
                                        Xóa cấu hình
                                    </button>
                                )}
                                <button 
                                    onClick={handleSaveJiraSettings}
                                    disabled={jiraStatus === 'connected' || isSavingSettings}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-2"
                                >
                                    {isSavingSettings ? <RefreshCw className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                                    Xác thực & Kết nối
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* GitHub Global Config */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex flex-col justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4">
                                <span className="bg-slate-100 p-1.5 rounded-md text-slate-700"><GitBranch className="w-4 h-4" /></span>
                                Cấu hình GitHub Portal
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Personal Access Token (System Account)</label>
                                    <input 
                                        value={globalSettings.githubPortalToken} 
                                        onChange={e => setGlobalSettings({...globalSettings, githubPortalToken: e.target.value})}
                                        type="password" placeholder="ghp_system_key..." 
                                        className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900" 
                                    />
                                    <p className="text-[10px] text-slate-500 mt-2">Dùng để quét commit từ các repo của sinh viên.</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                            <button 
                                onClick={handleSaveGithubSettings}
                                disabled={isSavingSettings}
                                className="px-6 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-2"
                            >
                                {isSavingSettings ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-4 h-4" />}
                                Lưu cấu hình GitHub
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* B. Mapping & Tracking Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Mapping Table */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <h2 className="text-base font-semibold text-slate-800">Bảng ánh xạ Nhóm - Jira - GitHub</h2>
                        {hasPermission && (
                            <button 
                                onClick={() => { setShowMappingForm(true); setMappingForm({groupId: '', jiraProjectKey: '', githubRepo: ''}); setEditingMapping(null); }}
                                className="text-xs font-semibold bg-white border border-slate-200 px-3 py-1.5 rounded-md text-blue-600 hover:bg-blue-50 flex items-center gap-1.5 shadow-sm transition-all"
                            >
                                <PlusCircle className="w-3.5 h-3.5" /> Thêm ánh xạ mới
                            </button>
                        )}
                    </div>

                    {/* Mapping Form (Toggle) */}
                    {showMappingForm && (
                        <div className="p-4 bg-blue-50/30 border-b border-blue-100 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold text-blue-800">{editingMapping ? 'Sửa ánh xạ' : 'Gán mapping cho nhóm'}</h3>
                                <button onClick={() => setShowMappingForm(false)} className="text-slate-400 hover:text-slate-600"><XCircle className="w-5 h-5" /></button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Chọn Nhóm</label>
                                    <select 
                                        value={mappingForm.groupId}
                                        onChange={e => setMappingForm({...mappingForm, groupId: e.target.value})}
                                        className="w-full text-sm border border-slate-300 rounded-lg px-2 py-2 outline-none"
                                    >
                                        <option value="">-- Chọn một nhóm --</option>
                                        {mergedData.map(g => (
                                            <option key={g.groupId} value={g.groupId}>{g.groupName}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Mã Dự án Jira</label>
                                    <input 
                                        value={mappingForm.jiraProjectKey}
                                        onChange={e => setMappingForm({...mappingForm, jiraProjectKey: e.target.value})}
                                        type="text" placeholder="Ví dụ: KAN" 
                                        className="w-full text-sm border border-slate-300 rounded-lg px-2 py-2 outline-none" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Repo GitHub (User/Repo)</label>
                                    <input 
                                        value={mappingForm.githubRepo}
                                        onChange={e => setMappingForm({...mappingForm, githubRepo: e.target.value})}
                                        type="text" placeholder="Ví dụ: thocute/edu-project" 
                                        className="w-full text-sm border border-slate-300 rounded-lg px-2 py-2 outline-none" 
                                    />
                                </div>
                            </div>
                            <button 
                                onClick={handleSaveMapping}
                                disabled={isSavingMapping}
                                className="mt-4 w-full bg-emerald-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                            >
                                {isSavingMapping ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <><CheckCircle2 className="w-3.5 h-3.5" /> Lưu ánh xạ</>}
                            </button>
                        </div>
                    )}

                    <div className="overflow-x-auto overflow-y-auto max-h-[400px]">
                        <table className="w-full text-sm text-left">
                            <thead className="sticky top-0 bg-slate-100 text-slate-500 border-b border-slate-200 z-10">
                                <tr>
                                    <th className="px-4 py-3 font-semibold uppercase text-[10px] tracking-wide">Nhóm học phần</th>
                                    <th className="px-4 py-3 font-semibold uppercase text-[10px] tracking-wide">Jira Key</th>
                                    <th className="px-4 py-3 font-semibold uppercase text-[10px] tracking-wide">GitHub Repository</th>
                                    <th className="px-4 py-3 font-semibold uppercase text-[10px] tracking-wide text-right">Lệnh</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mergedData.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-12 text-center text-slate-400">
                                            <div className="flex flex-col items-center gap-2">
                                                <LinkIcon className="w-8 h-8 opacity-20" />
                                                <p>Chưa có dữ liệu nhóm nào được tạo trong hệ thống.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    mergedData.map((item) => (
                                        <tr key={item.groupId} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors group">
                                            <td className="px-4 py-3 font-medium text-slate-900">{item.groupName}</td>
                                            <td className="px-4 py-3">
                                                {(item.mapping?.jiraProjectKey || item.jiraProjectKey) ? (
                                                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[11px] border border-blue-100 font-bold uppercase tracking-wider">
                                                        {item.mapping?.jiraProjectKey || item.jiraProjectKey}
                                                    </span>
                                                ) : <span className="text-slate-300 text-xs italic">Chưa gán</span>}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 font-mono text-xs">
                                                {item.mapping?.githubRepo || item.githubRepoUrl || <span className="text-slate-300">---</span>}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {hasPermission && (
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={() => openEditMapping(item)}
                                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                                        >
                                                            <Settings className="w-3.5 h-3.5" />
                                                        </button>
                                                        {item.mapping && (
                                                            <button 
                                                                onClick={() => handleDeleteMapping(item.mapping.integrationId)}
                                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                                                            >
                                                                <XCircle className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* C. System Monitor */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                        <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-emerald-500" /> Giám sát đồng bộ
                        </h2>
                    </div>
                    <div className="p-4 flex-1">
                        <div className="space-y-6">
                            {/* Health Indicators */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className={`p-3 rounded-lg border ${
                                    jiraStatus === 'connected' ? 'bg-emerald-50 border-emerald-100' :
                                    jiraStatus === 'error' ? 'bg-red-50 border-red-100' :
                                    'bg-slate-50 border-slate-100'
                                }`}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`text-[10px] font-bold uppercase ${
                                            jiraStatus === 'connected' ? 'text-emerald-700' :
                                            jiraStatus === 'error' ? 'text-red-700' :
                                            'text-slate-700'
                                        }`}>Jira Health</span>
                                        {jiraStatus === 'connected' ? (
                                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                        ) : jiraStatus === 'error' ? (
                                            <XCircle className="w-3 h-3 text-red-500" />
                                        ) : (
                                            <RefreshCw className="w-3 h-3 text-slate-400 animate-spin" />
                                        )}
                                    </div>
                                    <div className={`text-xs font-semibold truncate ${
                                        jiraStatus === 'connected' ? 'text-emerald-800' :
                                        jiraStatus === 'error' ? 'text-red-800' :
                                        'text-slate-800'
                                    }`}>
                                        {jiraStatus === 'connected' ? (globalSettings.jiraUrl || 'Connected') : 
                                         jiraStatus === 'error' ? 'Kết nối thất bại' : 
                                         jiraStatus === 'loading' ? 'Đang kiểm tra...' : 'Chưa cấu hình'}
                                    </div>
                                </div>
                                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-bold text-indigo-700 uppercase">Message Broker</span>
                                        <Activity className="w-3 h-3 text-indigo-500" />
                                    </div>
                                    <div className="text-xs font-semibold text-indigo-800 uppercase">RabbitMQ UP</div>
                                </div>
                            </div>

                            {/* Recent Commits Placeholder */}
                            <div>
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Thông báo gần đây</h3>
                                <div className="space-y-3">
                                    {commits.length === 0 ? (
                                        <div className="text-center py-10">
                                             <div className="bg-slate-50 rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-2">
                                                <RefreshCw className="w-5 h-5 text-slate-300" />
                                             </div>
                                             <p className="text-xs text-slate-400 font-medium">Chưa có hoạt động đồng bộ nào gần đây</p>
                                        </div>
                                    ) : (
                                        commits.map(act => (
                                            <div key={act.id} className="flex gap-3 items-start pb-3 border-b border-slate-50 last:border-0">
                                                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                                                    act.status === 'SUCCESS' ? 'bg-emerald-500' :
                                                    act.status === 'ERROR' ? 'bg-red-500' :
                                                    'bg-blue-500'
                                                }`} />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[11px] font-semibold text-slate-800 leading-tight">{act.message}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase">{act.status}</span>
                                                        <span className="text-[10px] text-slate-300">•</span>
                                                        <span className="text-[9px] text-slate-400">
                                                            {new Date(act.createdAt).toLocaleString('vi-VN', { 
                                                                hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit'
                                                            })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </MainLayout>
    );
}
