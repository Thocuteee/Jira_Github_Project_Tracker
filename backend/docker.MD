# Xóa dữ liệu cũ
docker-compose down -v
# Run docker
docker-compose up --build

docker-compdocker-compose up -d --buildose down && docker-compose up -d --build
docker compose restart



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
