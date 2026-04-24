import { createContext, useContext, useCallback, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useFcm } from '../hooks/useFcm';
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
  refreshNotifications: () => Promise<void>;
  markNotificationRead: (notificationId: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  refreshPreferences: () => Promise<void>;
  updatePreferences: (payload: NotificationPreferenceUpdateRequest) => Promise<void>;
  resetUnreadCount: () => Promise<void>;
  dismissToast: (id: number) => void;
}

const FcmContext = createContext<FcmContextProps | undefined>(undefined);
const NOTIFICATION_POLL_INTERVAL_MS = 15000;

let toastIdCounter = 0;

function getUserId(): string | null {
  try {
    return localStorage.getItem('userId');
  } catch {
    return null;
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
  const unreadCount = notifications.filter((item) => !item.isRead).length;

  useEffect(() => {
    const sync = () => setUserId(getUserId());
    window.addEventListener('auth-changed', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('auth-changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const refreshNotifications = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      return;
    }
    setLoadingNotifications(true);
    try {
      const items = await notificationService.getByUserId(userId);
      setNotifications(items);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  }, [userId]);

  const refreshPreferences = useCallback(async () => {
    if (!userId) {
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
    void refreshNotifications();
  }, [refreshNotifications]);

  useEffect(() => {
    if (!userId) return;
    const intervalId = window.setInterval(() => {
      void refreshNotifications();
    }, NOTIFICATION_POLL_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [refreshNotifications, userId]);

  useEffect(() => {
    if (!userId) return;
    const refreshOnFocus = () => {
      if (document.visibilityState === 'visible') {
        void refreshNotifications();
      }
    };
    window.addEventListener('focus', refreshOnFocus);
    document.addEventListener('visibilitychange', refreshOnFocus);
    return () => {
      window.removeEventListener('focus', refreshOnFocus);
      document.removeEventListener('visibilitychange', refreshOnFocus);
    };
  }, [refreshNotifications, userId]);

  const handleNotification = useCallback((notification: { title: string; body: string }) => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, title: notification.title, body: notification.body }]);
    void refreshNotifications();

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  }, [refreshNotifications]);

  const { token, permissionStatus, requestPermission } = useFcm({
    userId,
    onNotification: handleNotification,
  });

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const markNotificationRead = useCallback(async (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((item) => (item.notificationId === notificationId ? { ...item, isRead: true } : item)),
    );
    try {
      await notificationService.markAsRead(notificationId);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      void refreshNotifications();
    }
  }, [refreshNotifications]);

  const markAllNotificationsRead = useCallback(async () => {
    if (!userId) return;
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    try {
      await notificationService.markAllAsRead(userId);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      void refreshNotifications();
    }
  }, [refreshNotifications, userId]);

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
        refreshNotifications,
        markNotificationRead,
        markAllNotificationsRead,
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
