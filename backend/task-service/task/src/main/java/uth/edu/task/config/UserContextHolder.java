package uth.edu.task.config;

public class UserContextHolder {
    private static final ThreadLocal<String> currentUserId = new ThreadLocal<>();
    private static final ThreadLocal<String> currentUserRole = new ThreadLocal<>();

    public static void setUserId(String userId) {
        currentUserId.set(userId);
    }

    public static String getUserId() {
        return currentUserId.get();
    }

    public static void setUserRole(String role) {
        currentUserRole.set(role);
    }

    public static String getUserRole() {
        return currentUserRole.get();
    }

    public static void clear() {
        currentUserId.remove();
        currentUserRole.remove();
    }
}
