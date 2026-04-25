/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/11.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.8.1/firebase-messaging-compat.js');

function initFirebase(cfg) {
  const hasRequiredConfig =
    cfg &&
    typeof cfg === 'object' &&
    cfg.apiKey &&
    cfg.projectId &&
    cfg.messagingSenderId &&
    cfg.appId;

  if (!hasRequiredConfig) {
    return;
  }

  if (!firebase.apps.length) {
    firebase.initializeApp(cfg);
    setupMessaging();
  }
}

function setupMessaging() {
  const messaging = firebase.messaging();
  const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('fcm-events') : null;

  messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title || 'New Notification';
    const options = {
      body: payload.notification?.body || '',
      icon: '/icons.svg',
      data: payload.data,
    };

    // Broadcast payload to opened app tabs so React context updates immediately.
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        const hasVisibleClient = clients.some((client) => client.visibilityState === 'visible');

        // Only show native browser notification when no active visible tab.
        // Avoid duplicate browser notifications: when payload already contains
        // `notification`, many browsers/FCM paths can auto-display it.
        // In that case, do not show it manually from SW.
        const shouldShowNative =
          !hasVisibleClient &&
          (!payload.notification || (!payload.notification.title && !payload.notification.body));
        if (shouldShowNative) {
          self.registration.showNotification(title, options);
        }

        clients.forEach((client) => {
          client.postMessage({
            type: 'FCM_FOREGROUND_SYNC',
            payload,
          });
        });
        if (channel) {
          channel.postMessage({
            type: 'FCM_FOREGROUND_SYNC',
            payload,
          });
        }
      })
      .catch(() => {
        // ignore broadcast failures
      });
  });
}

let config = {};
try {
  const url = new URL(self.location.href);
  const raw = url.searchParams.get('config');
  if (raw) {
    config = JSON.parse(decodeURIComponent(raw));
  }
} catch (_) { /* fallback to postMessage */ }

initFirebase(config);

self.addEventListener('message', (event) => {
  if (event.data?.type === 'FIREBASE_CONFIG') {
    initFirebase(event.data.config);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(targetUrl);
    }),
  );
});
