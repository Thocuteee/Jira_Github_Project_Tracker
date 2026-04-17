import { useState } from 'react';
import { 
    FileDown, 
    FileText, 
    CheckCircle2, 
    Settings2,
    Layout,
    Target,
    MessageSquare,
    Zap,
    Cpu
} from 'lucide-react';
import exportService from '@/api/export.service';
import type { ExportRequest } from '@/api/export.service';

interface SRSExportPanelProps {
    groupId: string;
}

export default function SRSExportPanel({ groupId }: SRSExportPanelProps) {
    const [exportConfig, setExportConfig] = useState<Partial<ExportRequest>>({
        format: 'PDF',
        includeTasks: true,
        includeProgress: true,
        includeCompletedOnly: false,
        includeComments: false
    });
    const [isExporting, setIsExporting] = useState(false);
    const [lastExport, setLastExport] = useState<string | null>(null);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const blob = await exportService.exportSRS({
                groupId,
                format: exportConfig.format as 'PDF' | 'DOCX' | 'HTML',
                ...exportConfig
            } as ExportRequest);
            
            const filename = `SRS_Report_${new Date().toISOString().split('T')[0]}.${exportConfig.format?.toLowerCase()}`;
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
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Format Selection */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Layout className="text-blue-600" size={18} />
                            <h3 className="font-bold text-slate-900">Định dạng</h3>
                        </div>
                        
                        <div className="grid gap-2">
                            {(['PDF', 'DOCX', 'HTML'] as const).map((fmt) => (
                                <button
                                    key={fmt}
                                    onClick={() => setExportConfig({ ...exportConfig, format: fmt })}
                                    className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                                        exportConfig.format === fmt 
                                            ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm' 
                                            : 'border-slate-100 hover:border-slate-200 text-slate-500'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <FileText size={16} className={exportConfig.format === fmt ? 'text-blue-600' : 'text-slate-400'} />
                                        <span className="font-semibold text-sm">{fmt}</span>
                                    </div>
                                    {exportConfig.format === fmt && <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content Options */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Settings2 className="text-slate-600" size={18} />
                            <h3 className="font-bold text-slate-900">Cấu hình nội dung</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <ToggleOption 
                                label="Chỉ bao gồm Task đã xong" 
                                checked={!!exportConfig.includeCompletedOnly} 
                                icon={<CheckCircle2 size={16} />}
                                onChange={(v) => setExportConfig({ ...exportConfig, includeCompletedOnly: v })}
                            />
                            <ToggleOption 
                                label="Bao gồm các Task chi tiết" 
                                checked={!!exportConfig.includeTasks} 
                                icon={<Target size={16} />}
                                onChange={(v) => setExportConfig({ ...exportConfig, includeTasks: v })}
                            />
                            <ToggleOption 
                                label="Bao gồm bình luận" 
                                checked={!!exportConfig.includeComments} 
                                icon={<MessageSquare size={16} />}
                                onChange={(v) => setExportConfig({ ...exportConfig, includeComments: v })}
                            />
                            <ToggleOption 
                                label="Chỉ số tiến độ tổng quan" 
                                checked={!!exportConfig.includeProgress} 
                                icon={<Zap size={16} />}
                                onChange={(v) => setExportConfig({ ...exportConfig, includeProgress: v })}
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-slate-400">
                         <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center">
                             <Cpu size={18} />
                         </div>
                         <div className="hidden sm:block">
                             <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Export Engine</p>
                             <p className="text-xs font-semibold text-slate-600">Standard v2.4.0</p>
                         </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        {lastExport && <span className="text-xs text-slate-400 font-medium">Lần cuối: {lastExport}</span>}
                        <button
                            onClick={handleExport}
                            disabled={isExporting}
                            className={`flex items-center gap-2 rounded-xl px-6 py-2.5 font-bold text-white transition-all ${
                                isExporting 
                                    ? 'bg-slate-300 cursor-not-allowed' 
                                    : 'bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-100'
                            }`}
                        >
                            {isExporting ? (
                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <FileDown size={18} />
                            )}
                            <span>Xuất tài liệu SRS</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ToggleOption({ 
    label, 
    checked, 
    onChange, 
    icon 
}: { 
    label: string, 
    checked: boolean, 
    onChange: (v: boolean) => void, 
    icon: React.ReactNode 
}) {
    return (
        <button
            onClick={() => onChange(!checked)}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                checked 
                    ? 'border-blue-600 bg-blue-50/20' 
                    : 'border-slate-50 hover:border-slate-100 bg-slate-50/50'
            }`}
        >
            <div className={`p-1.5 rounded-lg transition-colors ${checked ? 'bg-blue-600 text-white' : 'bg-white text-slate-400 border border-slate-100'}`}>
                {icon}
            </div>
            <span className={`text-sm font-semibold flex-1 ${checked ? 'text-blue-900' : 'text-slate-700'}`}>{label}</span>
            <div className={`h-4 w-4 rounded-full border transition-all ${
                checked ? 'border-blue-600 bg-blue-600 shadow-sm' : 'border-slate-300'
            }`}>
                {checked && <div className="h-full w-full border-2 border-white rounded-full" />}
            </div>
        </button>
    );
}
