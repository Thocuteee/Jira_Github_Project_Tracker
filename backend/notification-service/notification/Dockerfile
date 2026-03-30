# BƯỚC 1: Build file JAR bằng Maven (Sử dụng Image có sẵn Maven)
FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /app

# Copy pom.xml và tải dependencies trước (để cache)
COPY pom.xml .
RUN mvn dependency:go-offline

# Copy code và build
COPY src ./src
RUN mvn package -DskipTests

# BƯỚC 2: Tạo Image chạy ứng dụng (Sử dụng JRE nhẹ)
FROM gcr.io/distroless/java17-debian12:nonroot
WORKDIR /app

# Copy file jar từ bước build sang
COPY --from=build /app/target/*.jar /app/app.jar

# Port này phải khớp với SERVER_PORT trong docker-compose.yml
EXPOSE 8086

ENTRYPOINT ["java", "-jar", "/app/app.jar"]

