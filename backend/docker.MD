## Local (khuyên dùng)
- Copy env:
  - copy `backend/.env.local.example` -> `backend/.env.local` (không commit)
- Run:

```bash
cd backend
docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env.local up -d --build

docker compose --env-file .env.local -f docker-compose.yml -f docker-compose.dev.yml up --build -d frontend

```

## VPS/Production
- Tạo `backend/.env` trên VPS (không commit), rồi:

```bash
cd backend
docker compose --env-file .env up -d --build

docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v
docker compose restart
docker-compose logs -f
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
