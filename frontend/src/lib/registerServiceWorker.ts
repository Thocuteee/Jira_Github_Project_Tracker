export async function registerFirebaseServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers are not supported in this browser.');
    return null;
  }

  try {
    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };

    const serialized = encodeURIComponent(JSON.stringify(firebaseConfig));
    const swUrl = `/firebase-messaging-sw.js?config=${serialized}`;

    const registration = await navigator.serviceWorker.register(swUrl, { scope: '/' });

    if (registration.active) {
      registration.active.postMessage({ type: 'FIREBASE_CONFIG', config: firebaseConfig });
    }
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      newWorker?.addEventListener('statechange', () => {
        if (newWorker.state === 'activated') {
          newWorker.postMessage({ type: 'FIREBASE_CONFIG', config: firebaseConfig });
        }
      });
    });

    return registration;
  } catch (err) {
    console.error('Failed to register Firebase service worker:', err);
    return null;
  }
}
