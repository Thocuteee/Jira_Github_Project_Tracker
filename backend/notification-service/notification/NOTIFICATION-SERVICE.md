# Notification Service (notification-service)

## 1) Purpose
`notification-service` lưu và quản lý thông báo của người dùng (theo `userId`) và trạng thái đọc (`isRead`).

Ở giai đoạn hiện tại, service hỗ trợ push notification bằng Firebase Cloud Messaging (FCM) theo kiểu best-effort:
- Client có thể gửi `fcmToken` khi tạo notification.
- Nếu chưa cấu hình Firebase credentials thì vẫn tạo notification trong DB bình thường (FCM bị tắt).

## 2) Data Ownership (theo `database-design-memory.mdc`)
- Microservice owner:
  - `notification-service`: `Notification`
- Thực thể hiện có trong service:
  - `Notification`
    - `notificationId` (UUID, PK)
    - `userId` (UUID) - logical foreign key tới `auth-service.User`
    - `title` (String)
    - `message` (String)
    - `isRead` (Boolean)
    - `createdAt` (LocalDateTime)

## 3) Folder Structure (giải thích từng folder)

### `src/main/java/uth/edu/notification/controller`
- Chứa các endpoint REST.
- Tách lớp controller khỏi service để business logic không nằm trong HTTP layer.
- Controller hiện định nghĩa base path: `/api/notifications`.

### `src/main/java/uth/edu/notification/dto`
- Chứa request objects để validate đầu vào.
- Hiện có:
  - `CreateNotificationRequest`:
    - `userId` (`@NotNull`, UUID)
    - `title` (`@NotBlank`, String)
    - `message` (`@NotBlank`, String)
    - `fcmToken` (optional, String)
  - `UpdateReadStatusRequest`:
    - `isRead` (`@NotNull`, Boolean)

### `src/main/java/uth/edu/notification/model`
- Chứa entity JPA.
- `Notification` là `@Entity` mapped tới bảng `notifications`.
- Có index:
  - `idx_notifications_user_id` trên `user_id`
  - `idx_notifications_created_at` trên `created_at`

### `src/main/java/uth/edu/notification/repository`
- Repository dùng Spring Data JPA để thao tác DB.
- `NotificationRepository` hiện có query:
  - `findByUserIdOrderByCreatedAtDesc(UUID userId)`

### `src/main/java/uth/edu/notification/service`
- Chứa business logic.
- `INotificationService`: interface.
- `service/impl/NotificationServiceImpl`: hiện triển khai:
  - tạo notification (và best-effort gửi FCM nếu có token)
  - lấy notification theo userId
  - cập nhật `isRead`
  - xóa notification

### `src/main/java/uth/edu/notification/fcm`
- Các thành phần liên quan đến Firebase Cloud Messaging.
- `FcmSender` (interface) + `NoOpFcmSender` (fallback nếu chưa cấu hình Firebase).
- `FirebaseAdminFcmSender` gửi push qua Firebase Admin SDK.
- `FcmSenderConfig` tự quyết định bật/tắt FCM dựa vào biến môi trường:
  - `FIREBASE_CREDENTIALS_PATH`
    - Nếu không set (trống) => FCM disabled => dùng `NoOpFcmSender`

### `src/main/java/uth/edu/notification/NotificationApplication`
- Entry point của Spring Boot.

### `src/main/resources/application.properties`
- Cấu hình server và JPA:
  - `server.port=8082`
  - `spring.jpa.hibernate.ddl-auto=update`

## 4) API Script (kịch bản CRUD end-to-end)

Base URL (mặc định khi chạy service):
- `http://localhost:8082/api/notifications`

Lưu ý quan trọng về `userId`/`notificationId`:
- Backend đang dùng kiểu `UUID`, vì vậy các giá trị phải ở format UUID hợp lệ như:
  - `00000000-0000-0000-0000-000000000001`
- Không thể dùng `"1"` hoặc `'2'` vì không parse được sang `UUID`.

### 4.1 Create Notification
`POST /api/notifications`

Request body (JSON):
```json
{
  "userId": "00000000-0000-0000-0000-000000000001",
  "title": "Welcome",
  "message": "Notification service is ready.",
  "fcmToken": "OPTIONAL_FCM_TOKEN"
}
```

Hành vi:
- Luôn lưu vào DB.
- Nếu `fcmToken` có giá trị và Firebase credentials đã cấu hình đúng (`FIREBASE_CREDENTIALS_PATH` set) thì service sẽ cố gửi FCM (best-effort).
- Lỗi FCM không làm request tạo notification thất bại.

### 4.2 Get Notifications by User
`GET /api/notifications/users/{userId}`

Ví dụ:
- `GET /api/notifications/users/00000000-0000-0000-0000-000000000001`

Trả về:
- Danh sách `Notification` (sort `createdAt` giảm dần).

### 4.3 Update Read Status
`PUT /api/notifications/{notificationId}/read`

Request body (JSON):
```json
{
  "isRead": true
}
```

Trả về:
- Notification sau khi update.

Nếu `notificationId` không tồn tại:
- Controller trả `400 Bad Request` kèm message lỗi (do service throw `RuntimeException` và controller catch).

### 4.4 Delete Notification
`DELETE /api/notifications/{notificationId}`

Trả về:
- `200 OK` với message `"Deleted notification successfully"` nếu xóa thành công.

Nếu `notificationId` không tồn tại:
- Controller trả `400 Bad Request` kèm message lỗi.

## 5) JPA Design Notes (vì sao không dùng `@OneToMany/@ManyToOne`?)

### 5.1 Vì sao không có `@ManyToOne/@OneToMany` giữa `Notification` và `User`?
- Trong project này, `User` thuộc microservice `auth-service` (không thuộc `notification-service`).
- `notification-service` không có entity `User`, do đó không thể map quan hệ JPA trực tiếp.
- Việc tạo quan hệ JPA sang service khác thường dẫn tới:
  - yêu cầu cùng DB/schema và cùng lifetime giữa các microservice (không phù hợp microservice),
  - phức tạp trong migration/cấu hình,
  - khó kiểm soát ownership và performance (join cross-service).

Vì vậy, `userId` được lưu dưới dạng:
- `UUID` trong bảng `notifications`
- chỉ đóng vai trò `logical foreign key` (tham chiếu tới `auth-service.User`)
- không tạo quan hệ entity JPA trong Hibernate.

### 5.2 Vì sao `userId` FK chưa nối tới PK bằng quan hệ entity?
- Vì `PK` của `User` nằm ở DB của `auth-service`.
- `notification-service` không sở hữu bảng `User`, nên không thể/không nên tạo FK constraint kiểu DB-level hay JPA relationship kiểu entity-level trong schema của mình.

Nếu về sau cần “join dữ liệu”, cách đúng theo kiến trúc microservice thường là:
- notification-service giữ `userId`
- client hoặc một orchestration layer gọi thêm `auth-service` để lấy thông tin `User` tương ứng.

## 6) Testing checklist (CRUD)
- Khởi chạy service `notification-service` trên port `8082`.
- Test tuần tự 4 endpoint:
  1. `POST /api/notifications`
  2. `GET /api/notifications/users/{userId}`
  3. `PUT /api/notifications/{notificationId}/read`
  4. `DELETE /api/notifications/{notificationId}`
- Khi test `POST`, đảm bảo `userId` là UUID hợp lệ.
- Có thể để `fcmToken` trống để chỉ test CRUD DB (FCM disabled mặc định nếu chưa set `FIREBASE_CREDENTIALS_PATH`).

