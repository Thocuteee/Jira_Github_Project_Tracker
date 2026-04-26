package uth.edu.notification.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import uth.edu.notification.dto.FcmTokenRequest;
import uth.edu.notification.service.IFcmTokenService;

@RestController
@RequestMapping("/api/notifications/fcm-tokens")
@RequiredArgsConstructor
@Slf4j
public class FcmTokenController {
    private final IFcmTokenService fcmTokenService;

    @PostMapping
    public ResponseEntity<Void> registerToken(@Valid @RequestBody FcmTokenRequest request) {
        log.info("Register FCM token: userId={}", request.getUserId());
        fcmTokenService.registerToken(request.getUserId(), request.getToken());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> unregisterToken(@Valid @RequestBody FcmTokenRequest request) {
        log.info("Unregister FCM token: userId={}", request.getUserId());
        fcmTokenService.unregisterToken(request.getUserId(), request.getToken());
        return ResponseEntity.ok().build();
    }
}
