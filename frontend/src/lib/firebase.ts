import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getMessaging,
  getToken,
  onMessage,
  type Messaging,
  type MessagePayload,
} from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.messagingSenderId);
}

function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured()) return null;
  if (!app) {
    app = initializeApp(firebaseConfig);
  }
  return app;
}

function getFirebaseMessaging(): Messaging | null {
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return null;
  if (!messaging) {
    messaging = getMessaging(firebaseApp);
  }
  return messaging;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support push notifications.');
    return 'denied';
  }

  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    console.info('Notification permission denied by user.');
  }
  return permission;
}

export async function getFcmToken(
  registration?: ServiceWorkerRegistration,
): Promise<string | null> {
  const msg = getFirebaseMessaging();
  if (!msg) {
    console.warn('Firebase Messaging is not configured.');
    return null;
  }

  try {
    const token = await getToken(msg, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
    return token || null;
  } catch (err) {
    console.error('Failed to get FCM token:', err);
    return null;
  }
}

export function onForegroundMessage(callback: (payload: MessagePayload) => void): (() => void) | null {
  const msg = getFirebaseMessaging();
  if (!msg) return null;
  return onMessage(msg, callback);
}

export { isFirebaseConfigured };
