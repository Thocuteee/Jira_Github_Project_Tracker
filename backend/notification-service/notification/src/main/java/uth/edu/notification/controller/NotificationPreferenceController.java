package uth.edu.notification.controller;

import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import uth.edu.notification.dto.NotificationPreferenceRequest;
import uth.edu.notification.service.INotificationPreferenceService;

@RestController
@RequestMapping("/api/notifications/settings")
@RequiredArgsConstructor
public class NotificationPreferenceController {
    private final INotificationPreferenceService notificationPreferenceService;

    @GetMapping("/{userId}")
    public ResponseEntity<?> getPreference(@PathVariable UUID userId) {
        try {
            return ResponseEntity.ok(notificationPreferenceService.getPreference(userId));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @PutMapping("/{userId}")
    public ResponseEntity<?> updatePreference(
        @PathVariable UUID userId,
        @Valid @RequestBody NotificationPreferenceRequest request
    ) {
        try {
            return ResponseEntity.ok(notificationPreferenceService.updatePreference(userId, request));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }
}
