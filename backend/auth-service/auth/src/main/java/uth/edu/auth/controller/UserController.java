package uth.edu.auth.controller;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import uth.edu.auth.dto.ChangePasswordRequest;
import uth.edu.auth.dto.ProfileResponse;
import uth.edu.auth.dto.UpdateProfileRequest;
import uth.edu.auth.model.User;
import uth.edu.auth.repository.UserRepository;
import uth.edu.auth.security.oauth2.OAuth2AuthenticationSuccessHandler;

import java.time.LocalDateTime;
import java.util.stream.Collectors;
import java.util.Map;
import java.util.List;
import java.util.UUID;
import java.net.URI;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        String email = userDetails.getUsername();

        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng!"));

        ProfileResponse response = new ProfileResponse(
                user.getUserId(),
                user.getName(),
                user.getName(),
                user.getEmail(),
                user.getRoles().stream()
                    .map(role -> role.getName().name())
                    .collect(Collectors.toSet()),
                user.getAvatarUrl(),
                user.getCreatedAt(),
                isGoogleAccount(user)
        );

        return ResponseEntity.ok(response);
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateCurrentUser(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateProfileRequest request) {
        String email = userDetails.getUsername();
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng!"));

        String avatarUrl = request.getAvatarUrl();
        if (avatarUrl != null && avatarUrl.length() > 1024) {
            return ResponseEntity.badRequest().body(Map.of("message", "Avatar URL quá dài"));
        }
        if (!isAllowedAvatarUrl(avatarUrl)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Avatar URL không hợp lệ, chỉ cho phép http/https"));
        }
        user.setAvatarUrl((avatarUrl == null || avatarUrl.trim().isEmpty()) ? null : avatarUrl.trim());
        user.setUpdatedAt(LocalDateTime.now());

        User savedUser = userRepository.save(user);
        ProfileResponse response = new ProfileResponse(
                savedUser.getUserId(),
                savedUser.getName(),
                savedUser.getName(),
                savedUser.getEmail(),
                savedUser.getRoles().stream().map(role -> role.getName().name()).collect(Collectors.toSet()),
                savedUser.getAvatarUrl(),
                savedUser.getCreatedAt(),
                isGoogleAccount(savedUser)
        );
        return ResponseEntity.ok(response);
    }

    @PutMapping("/me/password")
    public ResponseEntity<?> changePassword(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ChangePasswordRequest request) {
        String email = userDetails.getUsername();
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng!"));

        if (isGoogleAccount(user)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Tài khoản Google không thể đổi mật khẩu tại đây"));
        }
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Mật khẩu mới và xác nhận mật khẩu không khớp"));
        }
        if (request.getCurrentPassword().equals(request.getNewPassword())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Mật khẩu mới phải khác mật khẩu hiện tại"));
        }
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Mật khẩu hiện tại không chính xác"));
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Đổi mật khẩu thành công"));
    }

    @PostMapping("/names")
    public ResponseEntity<Map<UUID, String>> getUserNames(@RequestBody List<UUID> userIds) {
        Map<UUID, String> nameMap = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getUserId, User::getName));
        return ResponseEntity.ok(nameMap);
    }

    private boolean isGoogleAccount(User user) {
        String passwordHash = user.getPassword();
        if (passwordHash == null || passwordHash.isBlank()) {
            return false;
        }
        return passwordEncoder.matches(OAuth2AuthenticationSuccessHandler.GOOGLE_MARKER_PASSWORD, passwordHash)
                || passwordEncoder.matches("oauth2-user", passwordHash);
    }

    private boolean isAllowedAvatarUrl(String avatarUrl) {
        if (avatarUrl == null || avatarUrl.trim().isEmpty()) {
            return true;
        }
        try {
            URI uri = URI.create(avatarUrl.trim());
            String scheme = uri.getScheme();
            return "http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme);
        } catch (Exception e) {
            return false;
        }
    }
}