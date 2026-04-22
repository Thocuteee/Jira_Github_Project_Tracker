import { useState, useEffect, useMemo, useCallback, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import {
    AlertCircle,
    CheckCircle2,
    Clock3,
    Cpu,
    Download,
    FileDown,
    FileText,
    Layout,
    Layers,
    ListChecks,
    ListTodo,
    Loader2,
    MessageSquare,
    SlidersHorizontal,
    Square,
    CheckSquare,
    TrendingUp,
    Zap,
} from 'lucide-react';
import exportService from '@/api/export.service';
import type { ExportRequest, ExportResponse } from '@/api/export.service';
import requirementService from '@/api/requirement.service';
import type { Requirement } from '@/api/requirement.service';
import authService from '@/api/auth.service';

interface SRSExportPanelProps {
    groupId: string;
    initialSelectedRequirementIds?: string[];
}

type ExportMode = 'ALL' | 'COMPLETED_ONLY' | 'CUSTOM';

function CustomToggleRow({
    checked,
    onToggle,
    icon,
    label,
    desc,
}: {
    checked: boolean;
    onToggle: () => void;
    icon: ReactNode;
    label: string;
    desc: string;
}) {
    return (
        <button
            type="button"
            onClick={onToggle}
            className={`flex w-full items-start gap-3 rounded-xl border-2 p-3 text-left transition-all ${
                checked ? 'border-indigo-300 bg-indigo-50/70' : 'border-slate-100 bg-white hover:border-slate-200'
            }`}
        >
            <span className={`mt-0.5 shrink-0 ${checked ? 'text-indigo-600' : 'text-slate-300'}`}>
                {checked ? <CheckSquare size={18} /> : <Square size={18} />}
            </span>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm ring-1 ring-slate-100">
                {icon}
            </span>
            <span className="min-w-0">
                <span className={`block text-sm font-bold ${checked ? 'text-indigo-900' : 'text-slate-700'}`}>{label}</span>
                <span className="mt-0.5 block text-xs font-medium text-slate-500 leading-snug">{desc}</span>
            </span>
        </button>
    );
}

function formatDateTime(iso: string | null | undefined): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function SRSExportPanel({ groupId, initialSelectedRequirementIds }: SRSExportPanelProps) {
    const location = useLocation();
    const [exportMode, setExportMode] = useState<ExportMode>('ALL');
    const [exportConfig, setExportConfig] = useState<Partial<ExportRequest>>({
        format: 'PDF',
        includeCompletedOnly: false,
        includeTasks: true,
        includeComments: true,
        includeProgress: true,
    });
    const [requirements, setRequirements] = useState<Requirement[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isLoadingReqs, setIsLoadingReqs] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [historyError, setHistoryError] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);
    const [documentName, setDocumentName] = useState('');
    const [history, setHistory] = useState<ExportResponse[]>([]);
    const [lastExport, setLastExport] = useState<string | null>(null);
    const selectedFromRoute = (location.state as { selectedRequirementIds?: string[] } | null)?.selectedRequirementIds;

    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const profile = await authService.getProfile();
                setCurrentUserId(profile.userId);
            } catch (error) {
                console.error('Lỗi khi lấy thông tin người dùng hiện tại:', error);
            }
        };
        fetchCurrentUser();
    }, []);

    useEffect(() => {
        const fetchRequirements = async () => {
            if (!groupId) return;
            setIsLoadingReqs(true);
            try {
                const response = await requirementService.getByGroup(groupId);
                const data = Array.isArray(response) ? response : (response as { data?: Requirement[] }).data ?? [];
                setRequirements(data);
                const preferredSelection =
                    selectedFromRoute && selectedFromRoute.length > 0
                        ? selectedFromRoute
                        : initialSelectedRequirementIds && initialSelectedRequirementIds.length > 0
                          ? initialSelectedRequirementIds
                          : [];
                if (preferredSelection.length > 0) {
                    const validIds = data
                        .map((r) => r.requirementId)
                        .filter((id) => preferredSelection.includes(id));
                    setSelectedIds(validIds.length > 0 ? validIds : data.map((r) => r.requirementId));
                } else {
                    setSelectedIds(data.map((r) => r.requirementId));
                }
            } catch (error) {
                console.error('Lỗi khi tải danh sách yêu cầu:', error);
            } finally {
                setIsLoadingReqs(false);
            }
        };
        fetchRequirements();
    }, [groupId, initialSelectedRequirementIds, selectedFromRoute]);

    const loadHistory = useCallback(async (showSpinner: boolean) => {
        if (!groupId) return;
        if (showSpinner) setIsLoadingHistory(true);
        setHistoryError(null);
        try {
            const rows = await exportService.getExportHistory(groupId);
            setHistory(rows);
        } catch (error) {
            console.error('Lỗi khi tải lịch sử xuất file:', error);
            setHistoryError('Không tải được lịch sử xuất file. Vui lòng thử lại sau.');
        } finally {
            if (showSpinner) setIsLoadingHistory(false);
        }
    }, [groupId]);

    useEffect(() => {
        if (!groupId) return;
        void loadHistory(true);
        const intervalId = window.setInterval(() => void loadHistory(false), 5000);
        return () => window.clearInterval(intervalId);
    }, [groupId, loadHistory]);

    const handleToggleRequirement = (id: string) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
    };

    const handleSelectAll = () => {
        if (selectedIds.length === requirements.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(requirements.map((r) => r.requirementId));
        }
    };

    const applyExportModeAll = () => {
        setExportMode('ALL');
        setExportConfig((prev) => ({
            ...prev,
            includeCompletedOnly: false,
            includeTasks: true,
            includeComments: true,
            includeProgress: true,
        }));
    };

    const applyExportModeCompletedOnly = () => {
        setExportMode('COMPLETED_ONLY');
        setExportConfig((prev) => ({
            ...prev,
            includeCompletedOnly: true,
            includeTasks: true,
            includeComments: false,
            includeProgress: true,
        }));
    };

    const applyExportModeCustom = () => {
        setExportMode('CUSTOM');
        setExportConfig((prev) => ({
            ...prev,
            includeCompletedOnly: false,
        }));
    };

    const modeCardClass = (mode: ExportMode) =>
        `w-full rounded-xl border-2 p-4 text-left transition-all ${
            exportMode === mode
                ? 'border-blue-500 bg-blue-50/90 shadow-sm ring-1 ring-blue-100'
                : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/80'
        }`;

    const handleExport = async () => {
        setIsExporting(true);
        try {
            await exportService.generateSRS({
                groupId,
                format: exportConfig.format as 'PDF' | 'DOCX',
                requirementIds: selectedIds,
                requestedBy: currentUserId,
                includeCompletedOnly: exportConfig.includeCompletedOnly ?? false,
                includeTasks: exportConfig.includeTasks ?? true,
                includeComments: exportConfig.includeComments ?? false,
                includeProgress: exportConfig.includeProgress ?? true,
                documentName: documentName.trim() || undefined,
            } as ExportRequest);
            await loadHistory(true);
            setLastExport(new Date().toLocaleTimeString('vi-VN'));
        } catch (error) {
            console.error('Error exporting SRS:', error);
            alert('Có lỗi xảy ra khi xuất tài liệu. Vui lòng thử lại sau.');
        } finally {
            setIsExporting(false);
        }
    };

    const sortedHistory = useMemo(() => {
        return [...history].sort((a, b) => {
            const ta = new Date(a.createdAt ?? 0).getTime();
            const tb = new Date(b.createdAt ?? 0).getTime();
            return tb - ta;
        });
    }, [history]);

    const isCompleted = (status: string | null | undefined) =>
        status === 'COMPLETED' || status === 'DONE';

    const getStatusBadgeClass = (status: string | null | undefined) => {
        if (!status) return 'bg-slate-50 text-slate-600 border-slate-200';
        if (isCompleted(status)) return 'bg-emerald-50 text-emerald-800 border-emerald-200';
        if (status === 'FAILED') return 'bg-red-50 text-red-700 border-red-200';
        if (status === 'PROCESSING') return 'bg-sky-50 text-sky-800 border-sky-200';
        if (status === 'PENDING') return 'bg-amber-50 text-amber-800 border-amber-200';
        return 'bg-slate-50 text-slate-600 border-slate-200';
    };

    const getStatusIcon = (status: string | null | undefined) => {
        if (isCompleted(status)) return <CheckCircle2 size={14} className="shrink-0" />;
        if (status === 'FAILED') return <AlertCircle size={14} className="shrink-0" />;
        return <Loader2 size={14} className="shrink-0 animate-spin" />;
    };

    const canDownload = (item: ExportResponse) =>
        isCompleted(item.status ?? undefined) && Boolean(item.fileUrl);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                    {/* Khu vực 1: Định dạng */}
                    <div className="lg:col-span-3 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                                <Layout size={18} />
                            </div>
                            <h3 className="font-bold text-slate-900">Định dạng</h3>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-600">Tên tài liệu</label>
                            <input
                                type="text"
                                value={documentName}
                                onChange={(e) => setDocumentName(e.target.value)}
                                placeholder="Ví dụ: Bao_cao_Sprint_1"
                                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <div className="grid gap-3">
                            {(['PDF', 'DOCX'] as const).map((fmt) => (
                                <button
                                    key={fmt}
                                    type="button"
                                    onClick={() => setExportConfig({ ...exportConfig, format: fmt })}
                                    className={`flex items-center justify-between px-4 py-4 rounded-xl border-2 transition-all ${
                                        exportConfig.format === fmt
                                            ? 'border-blue-600 bg-blue-50/50 text-blue-700 shadow-sm'
                                            : 'border-slate-100 hover:border-slate-200 text-slate-500'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`p-2 rounded-lg ${
                                                exportConfig.format === fmt ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
                                            }`}
                                        >
                                            <FileText size={16} />
                                        </div>
                                        <span className="font-bold text-sm">
                                            {fmt === 'PDF' ? 'Portable Document (PDF)' : 'Microsoft Word (DOCX)'}
                                        </span>
                                    </div>
                                    {exportConfig.format === fmt && (
                                        <div className="h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center">
                                            <CheckCircle2 size={12} className="text-white" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="flex items-center gap-3 text-slate-400">
                                <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                                    <Cpu size={16} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Export Engine</p>
                                    <p className="text-xs font-semibold text-slate-600">Async + lưu trữ</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Khu vực 2: Tùy chọn nội dung */}
                    <div className="lg:col-span-4 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 rounded-lg bg-violet-50 text-violet-600">
                                <Layers size={18} />
                            </div>
                            <h3 className="font-bold text-slate-900">Tùy chọn nội dung</h3>
                        </div>

                        <div className="space-y-3">
                            <button type="button" onClick={applyExportModeAll} className={modeCardClass('ALL')}>
                                <div className="flex items-start gap-3">
                                    <div
                                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                                            exportMode === 'ALL' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                                        }`}
                                    >
                                        <ListTodo size={18} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-slate-900">Tất cả Requirement (bao gồm Task & Comment)</p>
                                        <p className="mt-1 text-xs font-medium text-slate-500 leading-snug">
                                            Xuất đầy đủ yêu cầu đã chọn, kèm chi tiết Task, Comment và báo cáo tiến độ.
                                        </p>
                                    </div>
                                </div>
                            </button>

                            <button type="button" onClick={applyExportModeCompletedOnly} className={modeCardClass('COMPLETED_ONLY')}>
                                <div className="flex items-start gap-3">
                                    <div
                                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                                            exportMode === 'COMPLETED_ONLY' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                                        }`}
                                    >
                                        <CheckCircle2 size={18} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-slate-900">Chỉ Requirement đã hoàn thành</p>
                                        <p className="mt-1 text-xs font-medium text-slate-500 leading-snug">
                                            Lọc các yêu cầu trạng thái DONE trong phạm vi đã tick bên dưới.
                                        </p>
                                    </div>
                                </div>
                            </button>

                            <button type="button" onClick={applyExportModeCustom} className={modeCardClass('CUSTOM')}>
                                <div className="flex items-start gap-3">
                                    <div
                                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                                            exportMode === 'CUSTOM' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                                        }`}
                                    >
                                        <SlidersHorizontal size={18} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-slate-900">Tuỳ chỉnh</p>
                                        <p className="mt-1 text-xs font-medium text-slate-500 leading-snug">
                                            Bật/tắt từng loại nội dung xuất hiện trong tài liệu.
                                        </p>
                                    </div>
                                </div>
                            </button>
                        </div>

                        {exportMode === 'CUSTOM' && (
                            <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">Chi tiết tuỳ chỉnh</p>
                                <CustomToggleRow
                                    checked={Boolean(exportConfig.includeTasks)}
                                    onToggle={() => {
                                        setExportMode('CUSTOM');
                                        setExportConfig((c) => ({
                                            ...c,
                                            includeTasks: !c.includeTasks,
                                        }));
                                    }}
                                    icon={<ListTodo size={18} />}
                                    label="Bao gồm chi tiết Task"
                                    desc="Liệt kê công việc liên quan từng yêu cầu (khi backend hỗ trợ đầy đủ)."
                                />
                                <CustomToggleRow
                                    checked={Boolean(exportConfig.includeComments)}
                                    onToggle={() => {
                                        setExportMode('CUSTOM');
                                        setExportConfig((c) => ({
                                            ...c,
                                            includeComments: !c.includeComments,
                                        }));
                                    }}
                                    icon={<MessageSquare size={18} />}
                                    label="Bao gồm Comment & Trao đổi"
                                    desc="Ghi nhận trao đổi / bình luận trên yêu cầu."
                                />
                                <CustomToggleRow
                                    checked={Boolean(exportConfig.includeProgress)}
                                    onToggle={() => {
                                        setExportMode('CUSTOM');
                                        setExportConfig((c) => ({
                                            ...c,
                                            includeProgress: !c.includeProgress,
                                        }));
                                    }}
                                    icon={<TrendingUp size={18} />}
                                    label="Báo cáo tiến độ"
                                    desc="Thống kê % hoàn thành và tiến độ tổng quan."
                                />
                            </div>
                        )}
                    </div>

                    {/* Khu vực 3: Chọn Requirement */}
                    <div className="lg:col-span-5 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                                    <ListChecks size={18} />
                                </div>
                                <h3 className="font-bold text-slate-900">Chọn Requirement</h3>
                                <span className="ml-1 px-2 py-0.5 rounded-full bg-slate-100 text-xs font-bold text-slate-500">
                                    {selectedIds.length}/{requirements.length}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={handleSelectAll}
                                className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors shrink-0"
                            >
                                {selectedIds.length === requirements.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                            </button>
                        </div>

                        <p className="text-xs font-medium text-slate-500 leading-relaxed border-l-2 border-blue-200 pl-3 py-0.5">
                            Nếu chọn cấu hình ở trên, hệ thống sẽ áp dụng trong phạm vi các yêu cầu được tick chọn tại đây (ví dụ: chỉ DONE trong số các mục đã chọn).
                        </p>

                        <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                            <div className="max-h-[280px] overflow-y-auto custom-scrollbar">
                                {isLoadingReqs ? (
                                    <div className="py-16 flex flex-col items-center gap-3 text-slate-400">
                                        <div className="h-8 w-8 border-3 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                                        <span className="text-sm font-medium">Đang tải danh sách...</span>
                                    </div>
                                ) : requirements.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-px bg-slate-200">
                                        {requirements.map((req) => (
                                            <button
                                                type="button"
                                                key={req.requirementId}
                                                onClick={() => handleToggleRequirement(req.requirementId)}
                                                className="flex items-start gap-4 p-4 bg-white hover:bg-slate-50 transition-colors text-left group"
                                            >
                                                <div
                                                    className={`mt-0.5 transition-colors ${
                                                        selectedIds.includes(req.requirementId)
                                                            ? 'text-blue-600'
                                                            : 'text-slate-300 group-hover:text-slate-400'
                                                    }`}
                                                >
                                                    {selectedIds.includes(req.requirementId) ? (
                                                        <CheckSquare size={20} />
                                                    ) : (
                                                        <Square size={20} />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p
                                                        className={`text-sm font-bold truncate ${
                                                            selectedIds.includes(req.requirementId) ? 'text-blue-900' : 'text-slate-700'
                                                        }`}
                                                    >
                                                        {req.title}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase">
                                                            {req.requirementId.split('-')[0]}
                                                        </span>
                                                        <span
                                                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                                                req.priority === 'CRITICAL'
                                                                    ? 'bg-red-100 text-red-600'
                                                                    : req.priority === 'HIGH'
                                                                      ? 'bg-orange-100 text-orange-600'
                                                                      : 'bg-blue-100 text-blue-600'
                                                            }`}
                                                        >
                                                            {req.priority}
                                                        </span>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-16 flex flex-col items-center gap-3 text-slate-400">
                                        <Zap size={32} strokeWidth={1.5} className="opacity-20" />
                                        <span className="text-sm font-medium">Không tìm thấy yêu cầu nào</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-10 pt-6 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {lastExport && (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 animate-in slide-in-from-left duration-300">
                                <CheckCircle2 size={14} />
                                <span className="text-xs font-bold">Xuất file gần nhất: {lastExport}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handleExport}
                            disabled={isExporting || selectedIds.length === 0}
                            className={`flex items-center gap-3 rounded-xl px-8 py-3.5 font-bold text-white transition-all shadow-lg active:scale-95 ${
                                isExporting || selectedIds.length === 0
                                    ? 'bg-slate-300 cursor-not-allowed shadow-none'
                                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 hover:shadow-blue-300'
                            }`}
                        >
                            {isExporting ? (
                                <div className="h-5 w-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <FileDown size={20} />
                            )}
                            <span>{isExporting ? 'Đang tạo yêu cầu xuất...' : 'Xuất tài liệu SRS'}</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                        <Clock3 size={18} className="text-slate-600" />
                        <h3 className="font-bold text-slate-900">Lịch sử xuất báo cáo</h3>
                    </div>
                    <button
                        type="button"
                        onClick={() => void loadHistory(true)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        Làm mới
                    </button>
                </div>

                {historyError && (
                    <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                        <AlertCircle size={16} className="shrink-0" />
                        {historyError}
                    </div>
                )}

                {isLoadingHistory ? (
                    <div className="py-10 flex items-center justify-center gap-2 text-slate-500">
                        <Loader2 size={16} className="animate-spin" />
                        <span className="text-sm">Đang tải lịch sử...</span>
                    </div>
                ) : sortedHistory.length === 0 ? (
                    <div className="py-10 text-center text-sm text-slate-500">
                        Chưa có lịch sử xuất tài liệu cho nhóm này.
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-100">
                        <table className="w-full min-w-[760px] text-sm">
                            <thead>
                                <tr className="bg-slate-50 text-left text-slate-500 border-b border-slate-200">
                                    <th className="py-3 px-4 font-semibold">Thời gian tạo</th>
                                    <th className="py-3 px-4 font-semibold">Tên tài liệu</th>
                                    <th className="py-3 px-4 font-semibold">Định dạng</th>
                                    <th className="py-3 px-4 font-semibold">Trạng thái</th>
                                    <th className="py-3 px-4 font-semibold text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedHistory.map((item) => (
                                    <tr key={item.exportId} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80">
                                        <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                                            {formatDateTime(item.createdAt)}
                                        </td>
                                        <td className="py-3 px-4 text-slate-700">{item.fileName ?? '—'}</td>
                                        <td className="py-3 px-4 font-semibold text-slate-800">{item.fileType ?? '—'}</td>
                                        <td className="py-3 px-4">
                                            <span
                                                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${getStatusBadgeClass(item.status)}`}
                                            >
                                                {getStatusIcon(item.status)}
                                                {item.status ?? 'UNKNOWN'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            {canDownload(item) ? (
                                                <button
                                                    type="button"
                                                    onClick={() => item.fileUrl && exportService.openDownload(item.fileUrl)}
                                                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors"
                                                >
                                                    <Download size={13} />
                                                    Tải xuống
                                                </button>
                                            ) : (
                                                <span className="text-xs font-semibold text-slate-400">Đang xử lý...</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>
        </div>
    );
}
