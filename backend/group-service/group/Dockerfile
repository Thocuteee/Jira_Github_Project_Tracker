# BƯỚC 1: Build file JAR bằng Maven
FROM maven:3.9.6-amazoncorretto-17 AS build
WORKDIR /app

# Copy pom.xml và tải dependencies trước (để cache)
COPY pom.xml .
RUN mvn dependency:go-offline

# Copy code và build
COPY src ./src
RUN mvn package -DskipTests

# BƯỚC 2: Tạo Image chạy ứng dụng
FROM amazoncorretto:17-alpine
WORKDIR /app

# Copy file jar từ bước build sang
COPY --from=build /app/target/*.jar app.jar

# Port group-service
EXPOSE 8082

ENTRYPOINT ["java", "-jar", "app.jar"]
