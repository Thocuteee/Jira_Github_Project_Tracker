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

  const initFcm = useCallback(async (requirePrompt: boolean) => {
    if (!isFirebaseConfigured()) {
      console.warn('[FCM_FLOW] Firebase is not configured. Skipping FCM init.');
      return;
    }
    if (!userId) {
      console.debug('[FCM_FLOW] Skipping token registration because userId is missing.');
      return;
    }

    if (!('Notification' in window)) {
      setPermissionStatus('denied');
      return;
    }

    let permission = Notification.permission;
    if (permission === 'default' && requirePrompt) {
      permission = await requestNotificationPermission();
    }
    console.debug('[FCM_FLOW] Notification permission status:', permission, 'requirePrompt:', requirePrompt);
    setPermissionStatus(permission);
    if (permission !== 'granted') return;

    const registration = await registerFirebaseServiceWorker();
    const fcmToken = await getFcmToken(registration ?? undefined);
    if (!fcmToken) {
      console.warn('[FCM_FLOW] Could not acquire FCM token.');
      return;
    }
    setToken(fcmToken);

    if (registeredTokenRef.current !== fcmToken) {
      try {
        console.debug('[FCM_FLOW] registerFcmToken called', { userId });
        await notificationService.registerFcmToken(userId, fcmToken);
        registeredTokenRef.current = fcmToken;
        console.info('[FCM_FLOW] registerFcmToken success');
      } catch (err) {
        console.error('[FCM_FLOW] registerFcmToken failed:', err);
      }
    }
  }, [userId]);

  useEffect(() => {
    // Avoid browser anti-spam behavior: only auto-init when permission is already granted.
    void initFcm(false);
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

  const requestPermission = useCallback(async () => {
    await initFcm(true);
  }, [initFcm]);

  return { token, permissionStatus, requestPermission };
}
