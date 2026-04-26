# MVP Local Core Runbook

## Scope
- Build and run the local stack consistently for all members.
- Validate core integrations: auth, Jira/GitHub ingest, notification, file/export.
- Keep secrets outside git-tracked files.

## Required Environment Variables
- **Auth/OAuth**: `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`.
- **Jira**: `JIRA_API_URL`, `JIRA_USERNAME`, `JIRA_API_TOKEN`.
- **Notification**: `FIREBASE_CREDENTIALS_BASE64` (preferred) or `FIREBASE_CREDENTIALS_PATH` + `FIREBASE_CREDENTIALS_HOST_PATH`; `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_NAME`, `RESEND_ENABLED`.
- **Storage**: `CLOUDFLARE_R2_ENDPOINT`, `CLOUDFLARE_R2_PUBLIC_DOMAIN`, `CLOUDFLARE_R2_ACCESS_KEY`, `CLOUDFLARE_R2_SECRET_KEY`, `CLOUDFLARE_R2_BUCKET_NAME`.

## Standard Startup
Run from `backend`:

```powershell
docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env.local up -d --build
```

## Standard Health Checks
Run from repo root:

```powershell
powershell -ExecutionPolicy Bypass -File .\backend\scripts\smoke-local.ps1
```

Pass criteria:
- Frontend returns 200 on `http://localhost/`.
- RabbitMQ management returns 200 on `http://localhost:15672`.
- API routes return `200/401/403` (reachable) and never `502/connection refused`.
- `notification-service` logs do not contain FCM credential path errors.

## Known Core Route Contract
- Export route must use `/api/exports` (plural) end-to-end.
- API Gateway remains internal in dev compose (no host mapping for `8080`).

## Security Baseline for Local MVP
- Replace `JWT_SECRET=dev-secret-change-me`.
- Use non-default `LOCAL_DB_PASS`.
- Do not commit `.env.local`, Firebase key files, or API tokens.
