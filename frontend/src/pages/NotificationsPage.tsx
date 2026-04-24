import MainLayout from '@/components/layout/MainLayout';
import { useFcmContext } from '@/contexts/FcmContext';
import { Bell, CheckCheck, Filter, Settings } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

type NotificationFilter = 'all' | 'unread' | 'read';

const PAGE_SIZE = 10;

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    notifications,
    loadingNotifications,
    preferences,
    loadingPreferences,
    refreshNotifications,
    refreshPreferences,
    markNotificationRead,
    markAllNotificationsRead,
    updatePreferences,
    requestPermission,
    permissionStatus,
  } = useFcmContext();
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [page, setPage] = useState(1);
  const [highlightedNotificationId, setHighlightedNotificationId] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Notifications | Project Tracker';
    void refreshNotifications();
    void refreshPreferences();
  }, [refreshNotifications, refreshPreferences]);

  const filtered = useMemo(() => {
    if (filter === 'read') return notifications.filter((item) => item.isRead);
    if (filter === 'unread') return notifications.filter((item) => !item.isRead);
    return notifications;
  }, [filter, notifications]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedNotifications = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  useEffect(() => {
    if (searchParams.get('tab') === 'settings') {
      const settingsSection = document.getElementById('notification-settings');
      settingsSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [searchParams]);

  useEffect(() => {
    const targetNotificationId = searchParams.get('notificationId');
    if (!targetNotificationId) return;

    const targetIndex = notifications.findIndex((item) => item.notificationId === targetNotificationId);
    if (targetIndex < 0) return;

    setFilter('all');
    const targetPage = Math.floor(targetIndex / PAGE_SIZE) + 1;
    setPage(targetPage);
    setHighlightedNotificationId(targetNotificationId);

    const timer = setTimeout(() => setHighlightedNotificationId(null), 2500);
    const params = new URLSearchParams(searchParams);
    params.delete('notificationId');
    navigate({ pathname: '/notifications', search: params.toString() }, { replace: true });
    return () => clearTimeout(timer);
  }, [navigate, notifications, searchParams]);

  const togglePush = async () => {
    const current = preferences ?? { pushEnabled: true, emailEnabled: true };
    const nextPushEnabled = !current.pushEnabled;
    if (nextPushEnabled && permissionStatus !== 'granted') {
      await requestPermission();
    }
    await updatePreferences({
      pushEnabled: nextPushEnabled,
      emailEnabled: current.emailEnabled,
    });
  };

  const toggleEmail = async () => {
    const current = preferences ?? { pushEnabled: true, emailEnabled: true };
    await updatePreferences({
      pushEnabled: current.pushEnabled,
      emailEnabled: !current.emailEnabled,
    });
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Notifications Center</h1>
            <p className="mt-1 text-sm text-slate-500">
              Theo dõi thông báo, đánh dấu đã đọc và quản lý cấu hình thông báo theo thời gian thực.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-slate-500" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as NotificationFilter)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-blue-400"
                >
                  <option value="all">Tất cả</option>
                  <option value="unread">Chưa đọc</option>
                  <option value="read">Đã đọc</option>
                </select>
              </div>
              <button
                type="button"
                onClick={() => void markAllNotificationsRead()}
                className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100"
              >
                <CheckCheck size={15} />
                Đánh dấu tất cả đã đọc
              </button>
            </div>

            <div className="space-y-2">
              {loadingNotifications ? (
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-500">Dang tai thong bao...</div>
              ) : pagedNotifications.length === 0 ? (
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  Không có thông báo nào theo bộ lọc hiện tại.
                </div>
              ) : (
                pagedNotifications.map((item) => (
                  <button
                    key={item.notificationId}
                    type="button"
                    onClick={() => void markNotificationRead(item.notificationId)}
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      highlightedNotificationId === item.notificationId
                        ? 'ring-2 ring-blue-400 ring-offset-2'
                        : ''
                    } ${
                      item.isRead
                        ? 'border-slate-200 bg-white hover:bg-slate-50'
                        : 'border-blue-100 bg-blue-50 hover:bg-blue-100/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className={`text-sm ${item.isRead ? 'font-medium text-slate-800' : 'font-semibold text-slate-900'}`}>
                          {item.title}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">{item.message}</p>
                      </div>
                      {!item.isRead && <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-semibold text-white">New</span>}
                    </div>
                    <p className="mt-3 text-xs text-slate-500">{new Date(item.createdAt).toLocaleString('vi-VN')}</p>
                  </button>
                ))
              )}
            </div>

            <div className="mt-5 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Hiển thị {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, filtered.length)} / {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 disabled:opacity-50"
                >
                  Trước
                </button>
                <span className="text-sm text-slate-600">
                  {currentPage}/{totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
            </div>
          </section>

          <section id="notification-settings" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Settings size={17} className="text-slate-600" />
              <h2 className="text-lg font-semibold text-slate-900">Cấu hình thông báo</h2>
            </div>
            {loadingPreferences ? (
              <p className="text-sm text-slate-500">Đang tải cấu hình...</p>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <Bell size={15} className="text-blue-600" />
                    <p className="text-sm font-medium text-slate-900">Nhận thông báo đẩy</p>
                  </div>
                  <p className="mb-3 text-xs text-slate-500">Thông báo trình duyệt khi có sự kiện mới.</p>
                  <button
                    type="button"
                    onClick={() => void togglePush()}
                    className={`h-6 w-11 rounded-full p-1 transition ${preferences?.pushEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}
                  >
                    <span className={`block h-4 w-4 rounded-full bg-white transition ${preferences?.pushEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className="rounded-xl border border-slate-200 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <Bell size={15} className="text-emerald-600" />
                    <p className="text-sm font-medium text-slate-900">Nhận thông báo email</p>
                  </div>
                  <p className="mb-3 text-xs text-slate-500">Gửi thêm bản sao thông báo qua email.</p>
                  <button
                    type="button"
                    onClick={() => void toggleEmail()}
                    className={`h-6 w-11 rounded-full p-1 transition ${preferences?.emailEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}
                  >
                    <span className={`block h-4 w-4 rounded-full bg-white transition ${preferences?.emailEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </MainLayout>
  );
}

