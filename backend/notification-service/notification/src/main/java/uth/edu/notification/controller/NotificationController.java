package uth.edu.notification.controller;

import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import uth.edu.notification.dto.CreateNotificationRequest;
import uth.edu.notification.dto.UpdateReadStatusRequest;
import uth.edu.notification.service.INotificationService;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    private final INotificationService notificationService;

    public NotificationController(INotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @PostMapping
    public ResponseEntity<?> createNotification(@Valid @RequestBody CreateNotificationRequest request) {
        try {
            return ResponseEntity.ok(notificationService.createNotification(request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{notificationId}")
    public ResponseEntity<?> getNotificationById(@PathVariable UUID notificationId) {
        try {
            return ResponseEntity.ok(notificationService.getNotificationById(notificationId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<?> getNotificationsByUserId(@PathVariable UUID userId) {
        return ResponseEntity.ok(notificationService.getNotificationsByUserId(userId));
    }

    @PutMapping("/{notificationId}/read")
    public ResponseEntity<?> updateReadStatus(
        @PathVariable UUID notificationId,
        @Valid @RequestBody UpdateReadStatusRequest request
    ) {
        try {
            return ResponseEntity.ok(notificationService.updateReadStatus(notificationId, request.getIsRead()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{notificationId}/read")
    public ResponseEntity<?> markReadByPost(@PathVariable UUID notificationId) {
        try {
            return ResponseEntity.ok(notificationService.updateReadStatus(notificationId, true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/users/{userId}/read-all")
    public ResponseEntity<?> markAllAsRead(@PathVariable UUID userId) {
        try {
            int updatedCount = notificationService.markAllAsReadByUserId(userId);
            return ResponseEntity.ok(updatedCount);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/users/{userId}/read-all")
    public ResponseEntity<?> markAllAsReadByPost(@PathVariable UUID userId) {
        try {
            int updatedCount = notificationService.markAllAsReadByUserId(userId);
            return ResponseEntity.ok(updatedCount);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{notificationId}")
    public ResponseEntity<?> deleteNotification(@PathVariable UUID notificationId) {
        try {
            notificationService.deleteNotification(notificationId);
            return ResponseEntity.ok("Deleted notification successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
