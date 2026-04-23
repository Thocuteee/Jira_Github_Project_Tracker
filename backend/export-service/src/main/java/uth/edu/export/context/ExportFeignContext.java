package uth.edu.export.context;

import java.util.UUID;

/**
 * Truyền ngữ cảnh người dùng vào Feign (X-User-Id) cho các lời gọi nội bộ khi xử lý async export.
 */
public final class ExportFeignContext {

    private static final ThreadLocal<UUID> REQUESTING_USER = new ThreadLocal<>();

    private ExportFeignContext() {}

    public static void setRequestingUserId(UUID userId) {
        REQUESTING_USER.set(userId);
    }

    public static UUID getRequestingUserId() {
        return REQUESTING_USER.get();
    }

    public static void clear() {
        REQUESTING_USER.remove();
    }
}
