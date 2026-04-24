import { useEffect, useRef, useCallback, useState } from 'react';
import type { MessagePayload } from 'firebase/messaging';
import {
  requestNotificationPermission,
  getFcmToken,
  onForegroundMessage,
  isFirebaseConfigured,
} from '../lib/firebase';
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
    if (!isFirebaseConfigured()) return;
    if (!userId) {
      console.debug('Skipping FCM token registration because userId is missing.');
      return;
    }

    if (!('Notification' in window)) {
      setPermissionStatus('denied');
      return;
    }

    const permission = await requestNotificationPermission();
    setPermissionStatus(permission);
    if (permission !== 'granted') return;

    const registration = await registerFirebaseServiceWorker();
    const fcmToken = await getFcmToken(registration ?? undefined);
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

    const unsub = onForegroundMessage((payload: MessagePayload) => {
      const notification: FcmNotification = {
        title: payload.notification?.title || 'New Notification',
        body: payload.notification?.body || '',
        data: payload.data,
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
