import MainLayout from '../components/layout/MainLayout';

const GroupMembers = () => {
    return (
        <MainLayout>
            <div className="flex bg-slate-50 min-h-full items-center justify-center p-10">
                <div className="text-center">
                    <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-200 cursor-default">
                        <div className="text-5xl mb-4">👥</div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Thành viên nhóm</h2>
                        <p className="text-slate-500">Tính năng quản lý thành viên đang trong quá trình phát triển.</p>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default GroupMembers;
