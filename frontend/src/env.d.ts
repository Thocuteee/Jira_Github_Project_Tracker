/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_GATEWAY_URL: string;
  readonly VITE_AUTH_SERVICE_URL: string;
  readonly VITE_GROUP_SERVICE_URL: string;
  readonly VITE_REQUIREMENT_SERVICE_URL: string;
  readonly VITE_TASK_SERVICE_URL: string;
  readonly VITE_REPORT_SERVICE_URL: string;
  readonly VITE_NOTIFICATION_SERVICE_URL: string;
  readonly VITE_GITHUB_SERVICE_URL: string;
  readonly VITE_JIRA_SERVICE_URL: string;
  readonly VITE_EXPORT_SERVICE_URL: string;
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  readonly VITE_FIREBASE_VAPID_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
