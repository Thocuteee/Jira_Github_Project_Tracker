# Dùng Maven và Java 17 để build code
FROM maven:3.9.4-eclipse-temurin-17 AS build
WORKDIR /app

# Copy file cấu hình pom.xml và toàn bộ source code vào trong container
COPY pom.xml .
COPY src ./src

# Build ra file .jar (thêm -DskipTests để bỏ qua chạy test cho nhanh)
RUN mvn clean package -DskipTests

# Dùng môi trường Java 17 để chạy app
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copy file .jar vừa build từ stage build sang stage runtime
COPY --from=build /app/target/*-SNAPSHOT.jar app.jar

# Mở cổng 8087 cho app 
EXPOSE 8087

# Lệnh khởi động Spring Boot khi container chạy
ENTRYPOINT ["java", "-jar", "app.jar"]