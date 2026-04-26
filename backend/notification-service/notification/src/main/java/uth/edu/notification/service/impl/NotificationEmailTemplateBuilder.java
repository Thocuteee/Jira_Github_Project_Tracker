package uth.edu.notification.service.impl;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class NotificationEmailTemplateBuilder {
    @Value("${app.workspace-url:https://swp391.uth.today/workspaces}")
    private String workspaceUrl;

    public String buildTaskAssignedEmail(String recipientName, String taskName) {
        String safeRecipient = safe(recipientName);
        String safeTask = safe(taskName);
        return "<div style=\"font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;padding:24px;"
            + "background:#f8fafc;color:#1e293b;line-height:1.6;\">"
            + "<div style=\"background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:24px;\">"
            + "<h2 style=\"margin:0 0 16px 0;color:#0f172a;\">Bạn có một công việc mới!</h2>"
            + "<p style=\"margin:0 0 12px 0;\">Xin chào " + safeRecipient + ",</p>"
            + "<p style=\"margin:0 0 12px 0;\">Bạn vừa được trưởng nhóm phân công thực hiện một công việc mới trên hệ thống Quản lý Dự án.</p>"
            + "<div style=\"margin:16px 0;padding:12px 14px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;\">"
            + "<b>Tên công việc:</b> " + safeTask
            + "</div>"
            + "<p style=\"margin:0;\">Vui lòng đăng nhập vào hệ thống để xem chi tiết yêu cầu, tải tài liệu đính kèm (nếu có) và bắt đầu thực hiện nhé. Chúc bạn làm việc hiệu quả!</p>"
            + "</div>"
            + "</div>";
    }

    public String buildTaskCompletedEmail(String recipientName, String taskName) {
        String safeRecipient = safe(recipientName);
        String safeTask = safe(taskName);
        return "<div style=\"font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;padding:24px;"
            + "background:#f8fafc;color:#1e293b;line-height:1.6;\">"
            + "<div style=\"background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:24px;\">"
            + "<h2 style=\"margin:0 0 16px 0;color:#0f172a;\">Công việc đã hoàn thành</h2>"
            + "<p style=\"margin:0 0 12px 0;\">Xin chào " + safeRecipient + ",</p>"
            + "<p style=\"margin:0 0 12px 0;\">Công việc <b>" + safeTask + "</b> bởi thành viên được giao nhiệm vụ.</p>"
            + "<p style=\"margin:0;\">Vui lòng vào hệ thống để kiểm tra và nghiệm thu kết quả.</p>"
            + "</div>"
            + "</div>";
    }

    public String buildMemberAddedEmail(String recipientName, String groupName, String role, String adderName) {
        String safeRecipient = safe(recipientName);
        String safeGroupName = safe(groupName);
        String safeRole = safe(role);
        String safeAdderName = safe(adderName);
        String safeWorkspaceUrl = safeUrl(workspaceUrl);
        return "<div style=\"font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;padding:24px;"
            + "background:#f8fafc;color:#1e293b;line-height:1.6;\">"
            + "<div style=\"background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:24px;\">"
            + "<h2 style=\"margin:0 0 16px 0;color:#0f172a;\">Chào mừng bạn gia nhập dự án mới!</h2>"
            + "<p style=\"margin:0 0 12px 0;\">Xin chào " + safeRecipient + ",</p>"
            + "<p style=\"margin:0 0 12px 0;\">Bạn vừa được thêm vào một nhóm dự án mới trên hệ thống Quản lý Dự án.</p>"
            + "<div style=\"margin:16px 0;padding:14px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;\">"
            + "<p style=\"margin:0 0 8px 0;\"><b>Tên nhóm:</b> " + safeGroupName + "</p>"
            + "<p style=\"margin:0 0 8px 0;\"><b>Vai trò:</b> " + safeRole + "</p>"
            + "<p style=\"margin:0;\"><b>Người thêm:</b> " + safeAdderName + "</p>"
            + "</div>"
            + "<a href=\"" + safeWorkspaceUrl + "\" style=\"display:inline-block;margin-top:8px;padding:10px 16px;"
            + "background:#2563eb;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;\">"
            + "Truy cập không gian làm việc</a>"
            + "</div>"
            + "</div>";
    }

    private String safe(String value) {
        if (value == null || value.isBlank()) {
            return "bạn";
        }
        return value
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;");
    }

    private String safeUrl(String value) {
        if (value == null || value.isBlank()) {
            return "https://swp391.uth.today/workspaces";
        }
        return value
            .replace("\"", "%22")
            .replace("<", "")
            .replace(">", "");
    }
}
