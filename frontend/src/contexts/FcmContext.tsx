import { createContext, useContext, useCallback, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useFcm } from '../hooks/useFcm';
import authService from '../api/auth.service';
import notificationService, {
  type NotificationDto,
  type NotificationPreferenceDto,
  type NotificationPreferenceUpdateRequest,
} from '../api/notification.service';

interface FcmToast {
  id: number;
  title: string;
  body: string;
}

interface FcmContextProps {
  token: string | null;
  permissionStatus: NotificationPermission;
  requestPermission: () => Promise<void>;
  toasts: FcmToast[];
  notifications: NotificationDto[];
  loadingNotifications: boolean;
  isNotificationOpen: boolean;
  setIsNotificationOpen: (open: boolean) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  preferences: NotificationPreferenceDto | null;
  loadingPreferences: boolean;
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  markNotificationRead: (notificationId: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refreshPreferences: () => Promise<void>;
  updatePreferences: (payload: NotificationPreferenceUpdateRequest) => Promise<void>;
  resetUnreadCount: () => Promise<void>;
  dismissToast: (id: number) => void;
}

const FcmContext = createContext<FcmContextProps | undefined>(undefined);

let toastIdCounter = 0;
const TEMP_NOTIFICATION_PREFIX = 'temp-';

function getUserId(): string | null {
  try {
    return localStorage.getItem('userId');
  } catch {
    return null;
  }
}

function isAuthedSession(): boolean {
  try {
    return Boolean(localStorage.getItem('userId') || localStorage.getItem('userEmail') || localStorage.getItem('userName'));
  } catch {
    return false;
  }
}

export function FcmProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(getUserId);
  const [toasts, setToasts] = useState<FcmToast[]>([]);
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferenceDto | null>(null);
  const [loadingPreferences, setLoadingPreferences] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const syncFetchTimeoutRef = useRef<number | null>(null);
  const processedEventKeysRef = useRef<Map<string, number>>(new Map());

  const isTempNotificationId = useCallback((notificationId: string) => {
    return notificationId.startsWith(TEMP_NOTIFICATION_PREFIX);
  }, []);

  useEffect(() => {
    const sync = () => setUserId(getUserId());
    window.addEventListener('auth-changed', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('auth-changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  useEffect(() => {
    if (userId || !isAuthedSession()) return;
    let cancelled = false;
    authService
      .getProfile()
      .then((profile) => {
        if (cancelled || !profile?.userId) return;
        localStorage.setItem('userId', profile.userId);
        setUserId(profile.userId);
        window.dispatchEvent(new Event('auth-changed'));
      })
      .catch((error) => {
        console.warn('Could not hydrate userId for FCM registration:', error);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    setUnreadCount(notifications.filter((item) => !item.isRead).length);
  }, [notifications]);

  const fetchNotifications = useCallback(async () => {
    if (!userId || !isAuthedSession()) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    setLoadingNotifications(true);
    try {
      const items = await notificationService.getByUserId(userId);
      setNotifications(items);
      setUnreadCount(items.filter((item) => !item.isRead).length);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  }, [userId]);

  const scheduleNotificationSync = useCallback(() => {
    void fetchNotifications();
    if (syncFetchTimeoutRef.current) {
      window.clearTimeout(syncFetchTimeoutRef.current);
    }
    syncFetchTimeoutRef.current = window.setTimeout(() => {
      void fetchNotifications();
    }, 900);
  }, [fetchNotifications]);

  const hasProcessedMessageRecently = useCallback((key: string) => {
    const now = Date.now();
    const map = processedEventKeysRef.current;
    for (const [k, ts] of map.entries()) {
      if (now - ts > 60_000) {
        map.delete(k);
      }
    }
    return map.has(key);
  }, []);

  const markMessageProcessed = useCallback((key: string) => {
    processedEventKeysRef.current.set(key, Date.now());
  }, []);

  const refreshPreferences = useCallback(async () => {
    if (!userId || !isAuthedSession()) {
      setPreferences(null);
      return;
    }
    setLoadingPreferences(true);
    try {
      const data = await notificationService.getPreferences(userId);
      setPreferences(data);
    } catch (error) {
      console.error('Failed to fetch notification settings:', error);
    } finally {
      setLoadingPreferences(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId || !isAuthedSession()) {
      setNotifications([]);
      setUnreadCount(0);
      setPreferences(null);
      setLoadingNotifications(false);
      setLoadingPreferences(false);
      return;
    }
    void fetchNotifications();
  }, [fetchNotifications, userId]);

  const handleNotification = useCallback(
    (notification: { title: string; body: string; data?: Record<string, string> }) => {
      const id = ++toastIdCounter;
      setToasts((prev) => [...prev, { id, title: notification.title, body: notification.body }]);

      const d = notification.data;
      const messageKey =
        d?.notificationId || `${notification.title || ''}::${notification.body || ''}::${d?.createdAt || ''}`;
      if (messageKey && hasProcessedMessageRecently(messageKey)) {
        return;
      }
      if (messageKey) {
        markMessageProcessed(messageKey);
      }

      setUnreadCount((prev) => prev + 1);
      if (d?.notificationId) {
        const dto: NotificationDto = {
          notificationId: d.notificationId,
          userId: d.userId || userId || '',
          title: (d.title && d.title.length > 0 ? d.title : notification.title) || 'Thông báo',
          message: (d.message && d.message.length > 0 ? d.message : notification.body) || '',
          isRead: d.isRead === 'true',
          createdAt: d.createdAt || new Date().toISOString(),
        };
        setNotifications((prev) => {
          if (prev.some((x) => x.notificationId === dto.notificationId)) return prev;
          return [dto, ...prev];
        });
        if (!dto.isRead) {
          // Already incremented optimistically at message arrival.
        }
      } else if (userId) {
        const tempNotification: NotificationDto = {
          notificationId: `${TEMP_NOTIFICATION_PREFIX}${Date.now()}-${id}`,
          userId,
          title: notification.title || 'Thông báo',
          message: notification.body || '',
          isRead: false,
          createdAt: new Date().toISOString(),
        };
        setNotifications((prev) => [tempNotification, ...prev]);

        // Fallback: payload thiếu data định danh, lấy lại danh sách để đồng bộ realtime UI.
        scheduleNotificationSync();
      }

      if (userId) {
        scheduleNotificationSync();
      }

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 6000);
    },
    [hasProcessedMessageRecently, markMessageProcessed, scheduleNotificationSync, userId],
  );

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const onServiceWorkerMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || data.type !== 'FCM_FOREGROUND_SYNC') return;
      const payload = data.payload;
      if (!payload) return;
      handleNotification({
        title: payload.notification?.title || 'New Notification',
        body: payload.notification?.body || '',
        data: payload.data,
      });
    };
    navigator.serviceWorker.addEventListener('message', onServiceWorkerMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', onServiceWorkerMessage);
    };
  }, [handleNotification]);

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const channel = new BroadcastChannel('fcm-events');
    const onChannelMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || data.type !== 'FCM_FOREGROUND_SYNC') return;
      const payload = data.payload;
      if (!payload) return;
      handleNotification({
        title: payload.notification?.title || 'New Notification',
        body: payload.notification?.body || '',
        data: payload.data,
      });
    };
    channel.addEventListener('message', onChannelMessage);
    return () => {
      channel.removeEventListener('message', onChannelMessage);
      channel.close();
    };
  }, [handleNotification]);

  useEffect(() => {
    return () => {
      if (syncFetchTimeoutRef.current) {
        window.clearTimeout(syncFetchTimeoutRef.current);
      }
    };
  }, []);

  const { token, permissionStatus, requestPermission } = useFcm({
    userId,
    // Realtime ingest is handled via service worker bridge to avoid duplicate events.
    onNotification: undefined,
  });

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const markNotificationRead = useCallback(async (notificationId: string) => {
    let unreadDelta = 0;
    setNotifications((prev) =>
      prev.map((item) => {
        if (item.notificationId !== notificationId) return item;
        if (!item.isRead) unreadDelta = 1;
        return { ...item, isRead: true };
      }),
    );
    if (unreadDelta > 0) {
      setUnreadCount((prev) => Math.max(0, prev - unreadDelta));
    }
    if (isTempNotificationId(notificationId)) {
      void fetchNotifications();
      return;
    }
    try {
      await notificationService.markAsRead(notificationId);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      void fetchNotifications();
    }
  }, [fetchNotifications, isTempNotificationId]);

  const markAllNotificationsRead = useCallback(async () => {
    if (!userId) return;
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    setUnreadCount(0);
    try {
      await notificationService.markAllAsRead(userId);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      void fetchNotifications();
    }
  }, [fetchNotifications, userId]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    let previous: NotificationDto[] = [];
    let removedWasUnread = false;
    setNotifications((prev) => {
      previous = prev;
      removedWasUnread = prev.some((n) => n.notificationId === notificationId && !n.isRead);
      return prev.filter((n) => n.notificationId !== notificationId);
    });
    if (removedWasUnread) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    if (isTempNotificationId(notificationId)) {
      void fetchNotifications();
      return;
    }
    try {
      await notificationService.deleteNotification(notificationId);
    } catch (error) {
      console.error('Failed to delete notification:', error);
      setNotifications(previous);
      throw error;
    }
  }, [fetchNotifications, isTempNotificationId]);

  const updatePreferences = useCallback(async (payload: NotificationPreferenceUpdateRequest) => {
    if (!userId) return;
    try {
      const updated = await notificationService.updatePreferences(userId, payload);
      setPreferences(updated);
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      throw error;
    }
  }, [userId]);

  const resetUnreadCount = useCallback(async () => {
    await markAllNotificationsRead();
  }, [markAllNotificationsRead]);

  return (
    <FcmContext.Provider
      value={{
        token,
        permissionStatus,
        requestPermission,
        toasts,
        notifications,
        loadingNotifications,
        isNotificationOpen,
        setIsNotificationOpen,
        isSettingsOpen,
        setIsSettingsOpen,
        preferences,
        loadingPreferences,
        unreadCount,
        fetchNotifications,
        refreshNotifications: fetchNotifications,
        markNotificationRead,
        markAllNotificationsRead,
        deleteNotification,
        refreshPreferences,
        updatePreferences,
        resetUnreadCount,
        dismissToast,
      }}
    >
      {children}
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 animate-in slide-in-from-right"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{toast.title}</p>
                  <p className="text-gray-600 text-sm mt-0.5 line-clamp-2">{toast.body}</p>
                </div>
                <button
                  onClick={() => dismissToast(toast.id)}
                  className="shrink-0 text-gray-400 hover:text-gray-600 text-lg leading-none"
                  aria-label="Dismiss notification"
                >
                  &times;
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </FcmContext.Provider>
  );
}

export function useFcmContext() {
  const context = useContext(FcmContext);
  if (!context) {
    throw new Error('useFcmContext must be used within an FcmProvider');
  }
  return context;
}
