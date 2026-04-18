import { useState, useEffect } from 'react';
import { 
    FileDown, 
    FileText, 
    CheckCircle2, 
    Layout,
    Zap,
    Cpu,
    ListChecks,
    CheckSquare,
    Square
} from 'lucide-react';
import exportService from '@/api/export.service';
import type { ExportRequest } from '@/api/export.service';
import requirementService from '@/api/requirement.service';
import type { Requirement } from '@/api/requirement.service';

interface SRSExportPanelProps {
    groupId: string;
}

export default function SRSExportPanel({ groupId }: SRSExportPanelProps) {
    const [exportConfig, setExportConfig] = useState<Partial<ExportRequest>>({
        format: 'PDF',
    });
    const [requirements, setRequirements] = useState<Requirement[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isLoadingReqs, setIsLoadingReqs] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [lastExport, setLastExport] = useState<string | null>(null);

    useEffect(() => {
        const fetchRequirements = async () => {
            if (!groupId) return;
            setIsLoadingReqs(true);
            try {
                const response = await requirementService.getByGroup(groupId);
                const data = response.data;
                setRequirements(data);
                setSelectedIds(data.map(r => r.requirementId));
            } catch (error) {
                console.error("Lỗi khi tải danh sách yêu cầu:", error);
            } finally {
                setIsLoadingReqs(false);
            }
        };
        fetchRequirements();
    }, [groupId]);

    const handleToggleRequirement = (id: string) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedIds.length === requirements.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(requirements.map(r => r.requirementId));
        }
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const blob = await exportService.exportSRS({
                groupId,
                format: exportConfig.format as 'PDF' | 'DOCX',
                requirementIds: selectedIds,
                ...exportConfig
            } as ExportRequest);
            
            const extension = exportConfig.format === 'PDF' ? 'pdf' : 'docx';
            const filename = `SRS_Report_${new Date().toISOString().split('T')[0]}.${extension}`;
            await exportService.downloadFile(blob, filename);
            setLastExport(new Date().toLocaleTimeString());
        } catch (error) {
            console.error("Error exporting SRS:", error);
            alert("Có lỗi xảy ra khi xuất tài liệu. Vui lòng thử lại sau.");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Main Config Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Format Selection (3 cols) */}
                    <div className="lg:col-span-3 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                                <Layout size={18} />
                            </div>
                            <h3 className="font-bold text-slate-900">Định dạng</h3>
                        </div>
                        
                        <div className="grid gap-3">
                            {(['PDF', 'DOCX'] as const).map((fmt) => (
                                <button
                                    key={fmt}
                                    onClick={() => setExportConfig({ ...exportConfig, format: fmt })}
                                    className={`flex items-center justify-between px-4 py-4 rounded-xl border-2 transition-all ${
                                        exportConfig.format === fmt 
                                            ? 'border-blue-600 bg-blue-50/50 text-blue-700 shadow-sm' 
                                            : 'border-slate-100 hover:border-slate-200 text-slate-500'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${exportConfig.format === fmt ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                            <FileText size={16} />
                                        </div>
                                        <span className="font-bold text-sm">{fmt === 'PDF' ? 'Portable Document (PDF)' : 'Microsoft Word (DOCX)'}</span>
                                    </div>
                                    {exportConfig.format === fmt && (
                                        <div className="h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center">
                                            <CheckCircle2 size={12} className="text-white" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                        
                        <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-100">
                             <div className="flex items-center gap-3 text-slate-400">
                                 <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                                     <Cpu size={16} />
                                 </div>
                                 <div>
                                     <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Export Engine</p>
                                     <p className="text-xs font-semibold text-slate-600">Enterprise v3.0</p>
                                 </div>
                            </div>
                        </div>
                    </div>

                    {/* Requirement Selection (9 cols) */}
                    <div className="lg:col-span-9 space-y-4">
                        <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                                    <ListChecks size={18} />
                                </div>
                                <h3 className="font-bold text-slate-900">Chọn nội dung yêu cầu</h3>
                                <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-100 text-xs font-bold text-slate-500">
                                    {selectedIds.length}/{requirements.length}
                                </span>
                            </div>

                            <button 
                                onClick={handleSelectAll}
                                className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                            >
                                {selectedIds.length === requirements.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                            </button>
                        </div>

                        <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                {isLoadingReqs ? (
                                    <div className="py-20 flex flex-col items-center gap-3 text-slate-400">
                                        <div className="h-8 w-8 border-3 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                                        <span className="text-sm font-medium">Đang tải danh sách...</span>
                                    </div>
                                ) : requirements.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-200">
                                        {requirements.map((req) => (
                                            <button
                                                key={req.requirementId}
                                                onClick={() => handleToggleRequirement(req.requirementId)}
                                                className={`flex items-start gap-4 p-4 bg-white hover:bg-slate-50 transition-colors text-left group`}
                                            >
                                                <div className={`mt-0.5 transition-colors ${selectedIds.includes(req.requirementId) ? 'text-blue-600' : 'text-slate-300 group-hover:text-slate-400'}`}>
                                                    {selectedIds.includes(req.requirementId) ? <CheckSquare size={20} /> : <Square size={20} />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-bold truncate ${selectedIds.includes(req.requirementId) ? 'text-blue-900' : 'text-slate-700'}`}>
                                                        {req.title}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase">
                                                            {req.requirementId.split('-')[0]}
                                                        </span>
                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                                            req.priority === 'CRITICAL' ? 'bg-red-100 text-red-600' :
                                                            req.priority === 'HIGH' ? 'bg-orange-100 text-orange-600' :
                                                            'bg-blue-100 text-blue-600'
                                                        }`}>
                                                            {req.priority}
                                                        </span>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-20 flex flex-col items-center gap-3 text-slate-400">
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
                            <span>{isExporting ? 'Đang tạo tài liệu...' : 'Xuất tài liệu SRS'}</span>
                        </button>
                    </div>
                </div>
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
