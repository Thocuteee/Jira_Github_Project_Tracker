## Local (khuyên dùng)
- Copy env:
  - copy `backend/.env.local.example` -> `backend/.env.local` (không commit)
- Run:

```bash
cd backend
docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env.local up -d --build

docker compose --env-file .env.local -f docker-compose.yml -f docker-compose.dev.yml up --build -d frontend

```

## Firebase Cloud Messaging (FCM) Setup
- Vào [Firebase Console](https://console.firebase.google.com/) tạo project (hoặc dùng project hiện có).
- Bật **Cloud Messaging** trong Project Settings > Cloud Messaging.
- Tạo Web App, copy các giá trị config vào biến `VITE_FIREBASE_*` trong `.env.local` / `.env`.
- Vào Project Settings > Cloud Messaging > Web Push certificates, tạo VAPID key, copy vào `VITE_FIREBASE_VAPID_KEY`.
- Tạo Service Account JSON (Project Settings > Service accounts > Generate new private key). **Khuyến nghị:** mã hóa Base64 toàn bộ nội dung file và đặt vào biến môi trường (không commit file JSON vào repo).
- Trong `.env.local` / `.env` thêm (một trong hai cách):

  **Cách 1 — Base64 (khuyến nghị cho Docker / VPS):**
  ```bash
  # Linux/macOS: tạo chuỗi một dòng
  base64 -w0 path/to/serviceAccount.json
  ```
  Sau đó trong `.env` / `.env.local`:
  ```
  FIREBASE_CREDENTIALS_BASE64=<chuỗi_base64>
  ```

  Với `docker-compose.dev.yml`, `notification-service` dùng `env_file: .env.local`: thêm biến ở trên vào `.env.local` là đủ (không cần mount thêm nếu chỉ dùng Base64).

  **Cách 2 — File trong container (fallback):**
  ```
  FIREBASE_CREDENTIALS_PATH=/app/firebase-credentials.json
  ```
  (Kèm volume mount file JSON vào đường dẫn đó nếu dùng cách này.)

## VPS/Production
- Tạo `backend/.env` trên VPS (không commit), rồi:

```bash
cd backend
docker compose --env-file .env up -d --build
```

- Sau khi deploy production, chỉ mở public `80/443` cho reverse proxy.
- Không mở public các cổng service nội bộ (`8080..8090`) để tránh request đi tắt bypass gateway/nginx và tránh TLS handshake sai cổng HTTP (Tomcat log `Invalid character found in method name [0x16 0x03 ...]`).

docker-compose up --build -d
docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v
docker compose restart
docker exec -it postgres psql -U postgres -c "CREATE DATABASE ...;"
# ...Create DB

# 1. Truy cập vào giao diện lệnh của Redis
docker exec -it redis redis-cli

# 2. Xem danh sách các key đang lưu trong hệ thống
keys *

# 3. Kiểm tra thông tin một Refresh Token cụ thể
# (Bạn sẽ thấy userId tương ứng)
get auth:refresh:<token_cua_ban>

# 4. Kiểm tra các token đã bị Log out (Blacklist)
keys auth:blacklist:*

# 5. Kiểm tra thời gian còn lại của token (giây)
ttl auth:refresh:<token_cua_ban>
