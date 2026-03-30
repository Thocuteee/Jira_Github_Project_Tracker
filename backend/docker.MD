# Xóa dữ liệu cũ
docker-compose down -v
# Run docker
docker-compose up --build
docker-compose up -d --build
docker-compose down && docker-compose up -d --build