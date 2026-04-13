import React, { useEffect, useState } from 'react';
import { X, ExternalLink } from 'lucide-react';

interface JiraKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (key: string) => void;
    initialKey?: string;
    requirementTitle: string;
}

const JiraKeyModal: React.FC<JiraKeyModalProps> = ({ isOpen, onClose, onSubmit, initialKey, requirementTitle }) => {
    const [jiraKey, setJiraKey] = useState('');

    useEffect(() => {
        setJiraKey(initialKey || '');
    }, [initialKey, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(jiraKey);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Gán Jira Issue Key</h3>
                        <p className="text-sm text-gray-500 mt-1 truncate max-w-[300px]">{requirementTitle}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm shrink-0">
                            <ExternalLink size={18} className="text-blue-600" />
                        </div>
                        <p className="text-sm text-blue-700 leading-relaxed">
                            Nhập Issue Key từ dự án Jira của bạn (VD: <span className="font-mono font-bold">PROJ-123</span>) để thực hiện mapping dữ liệu.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Jira Issue Key</label>
                        <input
                            required
                            type="text"
                            value={jiraKey}
                            onChange={(e) => setJiraKey(e.target.value.toUpperCase())}
                            placeholder="VD: XDOOP-42"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl font-mono text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-100 transition-all"
                        >
                            Lưu cấu hình
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default JiraKeyModal;
