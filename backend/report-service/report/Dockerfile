# BƯỚC 1: Build file JAR bằng Maven (Sử dụng Image có sẵn Maven)
FROM maven:3.9.6-amazoncorretto-17 AS build
WORKDIR /app

# Copy pom.xml và tải dependencies trước (để cache)
COPY pom.xml .
RUN mvn dependency:go-offline

# Copy code và build
COPY src ./src
RUN mvn package -DskipTests

# BƯỚC 2: Tạo Image chạy ứng dụng (Sử dụng JRE nhẹ)
FROM amazoncorretto:17-alpine
WORKDIR /app

# Copy file jar từ bước build sang
COPY --from=build /app/target/*.jar app.jar

# Port này phải khớp với server.port trong application.properties của bạn
EXPOSE 8085

ENTRYPOINT ["java", "-jar", "app.jar"]
