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

  messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title || 'New Notification';
    const options = {
      body: payload.notification?.body || '',
      icon: '/icons.svg',
      data: payload.data,
    };
    self.registration.showNotification(title, options);
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
