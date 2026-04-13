import { useEffect, useRef, useCallback, useState } from 'react';
import { requestNotificationPermission, onForegroundMessage, isFirebaseConfigured } from '../lib/firebase';
import { registerFirebaseServiceWorker } from '../lib/registerServiceWorker';
import notificationService from '../api/notification.service';

interface FcmNotification {
  title: string;
  body: string;
  data?: Record<string, string>;
}

interface UseFcmOptions {
  userId: string | null;
  onNotification?: (notification: FcmNotification) => void;
}

export function useFcm({ userId, onNotification }: UseFcmOptions) {
  const [token, setToken] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'default',
  );
  const unsubRef = useRef<(() => void) | null>(null);
  const registeredTokenRef = useRef<string | null>(null);

  const initFcm = useCallback(async () => {
    if (!isFirebaseConfigured() || !userId) return;

    await registerFirebaseServiceWorker();

    const fcmToken = await requestNotificationPermission();
    setPermissionStatus('Notification' in window ? Notification.permission : 'default');

    if (!fcmToken) return;
    setToken(fcmToken);

    if (registeredTokenRef.current !== fcmToken) {
      try {
        await notificationService.registerFcmToken(userId, fcmToken);
        registeredTokenRef.current = fcmToken;
      } catch (err) {
        console.error('Failed to register FCM token with backend:', err);
      }
    }
  }, [userId]);

  useEffect(() => {
    void initFcm();
  }, [initFcm]);

  useEffect(() => {
    if (!isFirebaseConfigured()) return;

    const unsub = onForegroundMessage((payload: unknown) => {
      const p = payload as { notification?: { title?: string; body?: string }; data?: Record<string, string> };
      const notification: FcmNotification = {
        title: p.notification?.title || 'New Notification',
        body: p.notification?.body || '',
        data: p.data,
      };

      onNotification?.(notification);
    });

    unsubRef.current = unsub;
    return () => {
      unsub?.();
      unsubRef.current = null;
    };
  }, [onNotification]);

  useEffect(() => {
    return () => {
      if (registeredTokenRef.current && userId) {
        notificationService.unregisterFcmToken(userId, registeredTokenRef.current).catch(() => {});
      }
    };
  }, [userId]);

  return { token, permissionStatus, requestPermission: initFcm };
}
