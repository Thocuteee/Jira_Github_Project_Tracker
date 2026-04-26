package uth.edu.export.context;

import java.util.UUID;

/**
 * Ngữ cảnh cho Feign khi xử lý export async: JWT (ưu tiên cho file-service) hoặc X-User-Id.
 */
public final class ExportFeignContext {

    private static final ThreadLocal<UUID> REQUESTING_USER = new ThreadLocal<>();
    private static final ThreadLocal<String> BEARER_TOKEN = new ThreadLocal<>();

    private ExportFeignContext() {}

    public static void setRequestingUserId(UUID userId) {
        REQUESTING_USER.set(userId);
    }

    public static UUID getRequestingUserId() {
        return REQUESTING_USER.get();
    }

    /** Giá trị header Authorization đầy đủ (vd. "Bearer ...") hoặc chỉ token. */
    public static void setBearerToken(String authorizationHeader) {
        BEARER_TOKEN.set(authorizationHeader);
    }

    public static String getBearerToken() {
        return BEARER_TOKEN.get();
    }

    public static void clear() {
        REQUESTING_USER.remove();
        BEARER_TOKEN.remove();
    }
}
