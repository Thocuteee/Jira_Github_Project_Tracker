import { useState, useEffect } from 'react';
import { X, FileText, FileDown, Code2, CheckSquare, Square, Loader2, Download } from 'lucide-react';
import exportService, { type ExportRequest } from '@/api/export.service';
import requirementService, { type Requirement } from '@/api/requirement.service';

interface ExportSRSModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  groupName?: string;
}

type Format = 'PDF' | 'DOCX' | 'HTML';

const FORMAT_OPTIONS: { value: Format; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: 'PDF', label: 'PDF', icon: <FileText size={20} />, desc: 'Phù hợp để in ấn & chia sẻ' },
  { value: 'DOCX', label: 'Word', icon: <FileDown size={20} />, desc: 'Chỉnh sửa được trong Word' },
  { value: 'HTML', label: 'HTML', icon: <Code2 size={20} />, desc: 'Xem trực tiếp trên trình duyệt' },
];

const ExportSRSModal = ({ isOpen, onClose, groupId, groupName }: ExportSRSModalProps) => {
  const [format, setFormat] = useState<Format>('PDF');
  const [includeCompletedOnly, setIncludeCompletedOnly] = useState(false);
  const [includeTasks, setIncludeTasks] = useState(true);
  const [includeComments, setIncludeComments] = useState(false);
  const [includeProgress, setIncludeProgress] = useState(true);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // New state for requirement selection
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loadingReqs, setLoadingReqs] = useState(false);

  useEffect(() => {
    if (isOpen && groupId) {
      loadRequirements();
    }
  }, [isOpen, groupId]);

  const loadRequirements = async () => {
    setLoadingReqs(true);
    try {
      const res = await requirementService.getByGroup(groupId);
      // axiosClient's response interceptor returns response.data directly
      setRequirements(res as unknown as Requirement[]);
      // Select all by default
      setSelectedIds(new Set((res as unknown as Requirement[]).map(r => r.requirementId)));
    } catch (err) {
      console.error("Lỗi lấy danh sách requirement:", err);
    } finally {
      setLoadingReqs(false);
    }
  };

  if (!isOpen) return null;

  const handleToggleId = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleToggleAll = () => {
    if (selectedIds.size === requirements.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(requirements.map(r => r.requirementId)));
  };

  const handleExport = async () => {
    if (selectedIds.size === 0) {
      setErrorMsg('Vui lòng chọn ít nhất một Requirement để xuất.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMsg('');
    try {
      const request: ExportRequest = {
        groupId,
        format,
        includeCompletedOnly,
        includeTasks,
        includeComments,
        includeProgress,
        requirementIds: Array.from(selectedIds),
      };
      const blob = await exportService.exportSRS(request);
      const ext = format.toLowerCase();
      const filename = `SRS_${groupName || groupId}_${new Date().toISOString().slice(0, 10)}.${ext}`;
      await exportService.downloadFile(blob, filename);
      setStatus('success');
      setTimeout(() => { setStatus('idle'); onClose(); }, 1500);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Xuất báo cáo thất bại. Vui lòng thử lại.');
      setStatus('error');
    }
  };

  const CheckboxRow = ({
    checked, onChange, label, desc,
  }: { checked: boolean; onChange: () => void; label: string; desc: string }) => (
    <button
      type="button"
      onClick={onChange}
      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
        checked ? 'border-indigo-300 bg-indigo-50/60' : 'border-slate-100 bg-slate-50 hover:border-slate-200'
      }`}
    >
      {checked
        ? <CheckSquare size={20} className="text-indigo-600 shrink-0" />
        : <Square size={20} className="text-slate-300 shrink-0" />}
      <div>
        <div className={`text-sm font-bold ${checked ? 'text-indigo-700' : 'text-slate-600'}`}>{label}</div>
        <div className="text-xs text-slate-400 font-medium">{desc}</div>
      </div>
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
              <Download size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Xuất báo cáo SRS</h3>
              {groupName && <p className="text-xs text-slate-400 font-semibold">{groupName}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="px-8 py-6 space-y-6">
          {/* Format */}
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Định dạng xuất</p>
            <div className="grid grid-cols-3 gap-3">
              {FORMAT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFormat(opt.value)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                    format === opt.value
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'
                  }`}
                >
                  {opt.icon}
                  <span className="text-sm font-black">{opt.label}</span>
                  <span className="text-[10px] text-center leading-tight opacity-70">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Scope */}
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Phạm vi dữ liệu</p>
            <CheckboxRow
              checked={includeCompletedOnly}
              onChange={() => setIncludeCompletedOnly(v => !v)}
              label="Chỉ xuất Requirement đã hoàn thành"
              desc="Lọc những yêu cầu có trạng thái DONE"
            />
          </div>

          {/* Content options */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Chọn nội dung chi tiết</p>
              <button 
                onClick={handleToggleAll}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md"
              >
                {selectedIds.size === requirements.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </button>
            </div>
            
            <div className="max-h-40 overflow-y-auto pr-2 space-y-2 border-b border-slate-50 pb-4 mb-4 custom-scrollbar">
              {loadingReqs ? (
                <div className="flex items-center justify-center py-4 text-slate-400 gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-xs font-semibold">Đang tải danh sách...</span>
                </div>
              ) : requirements.length > 0 ? (
                requirements.map(req => (
                  <button
                    key={req.requirementId}
                    onClick={() => handleToggleId(req.requirementId)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all text-left ${
                      selectedIds.has(req.requirementId) ? 'border-indigo-200 bg-indigo-50/40' : 'border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    {selectedIds.has(req.requirementId) ? <CheckSquare size={16} className="text-indigo-600" /> : <Square size={16} className="text-slate-300" />}
                    <span className={`text-xs font-bold truncate ${selectedIds.has(req.requirementId) ? 'text-indigo-700' : 'text-slate-600'}`}>
                      {req.title}
                    </span>
                  </button>
                ))
              ) : (
                <p className="text-[10px] text-center text-slate-400 py-4 font-medium italic">Không có dữ liệu yêu cầu.</p>
              )}
            </div>

            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Tùy chọn hiển thị</p>
            <div className="space-y-2">
              <CheckboxRow
                checked={includeTasks}
                onChange={() => setIncludeTasks(v => !v)}
                label="Kèm danh sách Task chi tiết"
                desc="Hiển thị các công việc thuộc từng yêu cầu"
              />
              <CheckboxRow
                checked={includeProgress}
                onChange={() => setIncludeProgress(v => !v)}
                label="Kèm biểu đồ tiến độ"
                desc="Thêm thống kê % hoàn thành của từng yêu cầu"
              />
              <CheckboxRow
                checked={includeComments}
                onChange={() => setIncludeComments(v => !v)}
                label="Kèm bình luận"
                desc="Bao gồm các comment trên từng yêu cầu"
              />
            </div>
          </div>

          {/* Error */}
          {status === 'error' && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-semibold px-4 py-3 rounded-2xl">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-slate-100 flex items-center justify-between gap-4">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-2xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleExport}
            disabled={status === 'loading' || status === 'success'}
            className={`flex items-center gap-2.5 px-8 py-3 rounded-2xl text-sm font-black transition-all shadow-lg ${
              status === 'success'
                ? 'bg-emerald-500 text-white shadow-emerald-200'
                : status === 'loading'
                ? 'bg-indigo-400 text-white cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 hover:-translate-y-0.5 active:scale-95'
            }`}
          >
            {status === 'loading' ? (
              <><Loader2 size={16} className="animate-spin" /> Đang khởi tạo file...</>
            ) : status === 'success' ? (
              <><Download size={16} /> Đã tải xuống!</>
            ) : (
              <><Download size={16} /> Xuất báo cáo</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportSRSModal;
