import { createContext, useContext, useCallback, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useFcm } from '../hooks/useFcm';
import { isFirebaseConfigured } from '../lib/firebase';

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
  dismissToast: (id: number) => void;
}

const FcmContext = createContext<FcmContextProps | undefined>(undefined);

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

  useEffect(() => {
    const sync = () => setUserId(getUserId());
    window.addEventListener('auth-changed', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('auth-changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const handleNotification = useCallback((notification: { title: string; body: string }) => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, title: notification.title, body: notification.body }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  }, []);

  const { token, permissionStatus, requestPermission } = useFcm({
    userId,
    onNotification: handleNotification,
  });

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  if (!isFirebaseConfigured()) {
    return <>{children}</>;
  }

  return (
    <FcmContext.Provider value={{ token, permissionStatus, requestPermission, toasts, dismissToast }}>
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
