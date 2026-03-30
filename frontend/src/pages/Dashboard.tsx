import MainLayout from '@/components/layout/MainLayout';
import { ArrowRight, Clock3 } from 'lucide-react';

// Mock data cho tiến độ của các nhóm (Dữ liệu này sau này sẽ lấy từ port 8082 và 8083)
const mockGroupProgress = [
    { id: 1, name: 'Nhóm 1 - Module Auth', progress: 85, recentTask: 'Tick xong Refresh Token' },
    { id: 2, name: 'Nhóm 2 - Module Group', progress: 60, recentTask: 'Đang làm API Get Members' },
    { id: 3, name: 'Nhóm 3 - Module Task', progress: 30, recentTask: 'Mới xong Entity Task' },
];

export default function Dashboard() {
    return (
        <MainLayout>
        <div className="mb-8">
            <h1 className="text-2xl font-bold">Welcome back!</h1>
            <p className="text-slate-600">Here's your teams' progress overview.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {mockGroupProgress.map((group) => (
            <div key={group.id} className="p-5 bg-slate-50 border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-950">{group.name}</h3>
                <span className="text-xs font-medium px-2 py-0.5 bg-green-100 text-green-800 rounded-full">Active</span>
                </div>
                
                {/* Thanh Progress Bar */}
                <div className="w-full bg-slate-200 rounded-full h-2.5 mb-1.5">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${group.progress}%` }}></div>
                </div>
                <div className="text-sm text-right font-medium text-slate-700 mb-4">{group.progress}% Completed</div>

                <div className="flex items-center gap-2 text-xs text-slate-500 border-t border-slate-200 pt-3">
                <Clock3 className="w-3.5 h-3.5" />
                Recent: <span className="font-medium text-slate-700">{group.recentTask}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-auto text-slate-400" />
                </div>
            </div>
            ))}
        </div>
        </MainLayout>
    );
}