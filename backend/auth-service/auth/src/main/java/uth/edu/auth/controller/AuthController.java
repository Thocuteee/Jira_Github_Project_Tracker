package uth.edu.auth.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.util.StringUtils;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import uth.edu.auth.security.JwtProvider;
import uth.edu.auth.dto.JwtResponse;
import uth.edu.auth.dto.LoginRequest;
import uth.edu.auth.dto.RegisterRequest;
import uth.edu.auth.dto.TokenRefreshRequest;
import uth.edu.auth.dto.TokenRefreshResponse;
import uth.edu.auth.model.User;
import uth.edu.auth.model.*;
import uth.edu.auth.service.IAuthService;
import uth.edu.auth.repository.UserRepository;
import uth.edu.auth.repository.RoleRepository;
import uth.edu.auth.service.RefreshTokenService;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth") 
public class AuthController {
    private static final String ACCESS_TOKEN_COOKIE = "accessToken";
    private static final String REFRESH_TOKEN_COOKIE = "refreshToken";

    @Value("${auth.jwt.expiration}")
    private long accessTokenDurationMs;

    @Value("${uth.app.jwtRefreshExpirationMs}")
    private long refreshTokenDurationMs;

    @Autowired
    private IAuthService authService;

    @Autowired 
    private UserRepository userRepository;

    @Autowired 
    private RoleRepository roleRepository;

    @Autowired
    private RefreshTokenService refreshTokenService;

    @Autowired
    private JwtProvider jwtProvider;

    // 1. Lấy danh sách tất cả User
    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        return ResponseEntity.ok(authService.getAllUsers());
    }

    // 2. Lấy chi tiết 1 User bằng UUID
    @GetMapping("/users/{id}")
    public ResponseEntity<?> getUserById(@PathVariable UUID id) {
        return ResponseEntity.ok(authService.getUserById(id));
    }

    //3. Đăng ký user
    @PostMapping("/register-user")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            // Chuyển từ DTO sang Entity để Service xử lý
            User user = new User();
            user.setName(request.getName());
            user.setEmail(request.getEmail());
            user.setPassword(request.getPassword());

            User registeredUser = authService.registerUser(user);
            
            return ResponseEntity.ok("Đăng ký thành công cho user: " + registeredUser.getEmail());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 4. Xóa User
    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable UUID id) {
        authService.deleteUser(id);
        return ResponseEntity.ok("Đã xóa người dùng thành công!");
    }
    
    // 5. Cập nhật User (Ví dụ đổi tên)
    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateUser(@PathVariable UUID id, @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.updateUser(id, request));
    }

    //6. Dang Nhap
    @PostMapping("/login-user")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest, HttpServletResponse response) {
        try {
            JwtResponse jwtResponse = authService.login(loginRequest);
            response.addHeader("Set-Cookie", buildTokenCookie(ACCESS_TOKEN_COOKIE, jwtResponse.getToken(), accessTokenDurationMs).toString());
            response.addHeader("Set-Cookie", buildTokenCookie(REFRESH_TOKEN_COOKIE, jwtResponse.getRefreshToken(), refreshTokenDurationMs).toString());
            return ResponseEntity.ok(new JwtResponse(null, null, jwtResponse.getEmail(), jwtResponse.getRoles()));
            
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/logout-user")
    public ResponseEntity<?> logoutUser(
            @RequestParam(required = false) String refreshToken,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        if (!StringUtils.hasText(refreshToken)) {
            refreshToken = readCookieValue(request, REFRESH_TOKEN_COOKIE);
        }
        if (StringUtils.hasText(refreshToken)) {
            refreshTokenService.revokeRefreshToken(refreshToken);
        }
        response.addHeader("Set-Cookie", clearCookie(ACCESS_TOKEN_COOKIE).toString());
        response.addHeader("Set-Cookie", clearCookie(REFRESH_TOKEN_COOKIE).toString());
        return ResponseEntity.ok("Đăng xuất thành công!");
    }

    @PutMapping("/admin/assign-role/{userId}")
    @PreAuthorize("hasRole('ADMIN')") // Chỉ Token có Role ADMIN mới gọi được
    public ResponseEntity<?> assignRole(@PathVariable UUID userId, @RequestParam String roleName) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        
        ERole eRole = switch (roleName.toUpperCase()) {
            case "LECTURER" -> ERole.ROLE_LECTURER;
            case "ADMIN" -> ERole.ROLE_ADMIN;
            default -> ERole.ROLE_TEAM_MEMBER;
        };

        Role newRole = roleRepository.findByName(eRole).get();
        user.getRoles().add(newRole); // Thêm quyền mới
        userRepository.save(user);
        
        return ResponseEntity.ok("Nâng cấp thành công lên " + roleName);
    }

    @PostMapping("/refreshtoken")
    public ResponseEntity<?> refreshToken(@RequestBody(required = false) TokenRefreshRequest request, HttpServletRequest httpRequest, HttpServletResponse response) {
        String requestRefreshToken = request != null ? request.getRefreshToken() : null;
        if (!StringUtils.hasText(requestRefreshToken)) {
            requestRefreshToken = readCookieValue(httpRequest, REFRESH_TOKEN_COOKIE);
        }
        if (!StringUtils.hasText(requestRefreshToken)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Thiếu refresh token!");
        }

        var verified = refreshTokenService.findByToken(requestRefreshToken)
                .map(refreshTokenService::verifyExpiration);
        if (verified.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Refresh token không lưu trong database!");
        }
        var user = verified.get().getUser();
        String token = jwtProvider.generateJwtToken(user.getEmail());
        response.addHeader("Set-Cookie", buildTokenCookie(ACCESS_TOKEN_COOKIE, token, accessTokenDurationMs).toString());
        return ResponseEntity.ok(new TokenRefreshResponse(token, requestRefreshToken));
    }

    private ResponseCookie buildTokenCookie(String name, String value, long maxAgeMs) {
        return ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(false)
                .sameSite("Lax")
                .path("/")
                .maxAge(maxAgeMs / 1000)
                .build();
    }

    private ResponseCookie clearCookie(String name) {
        return ResponseCookie.from(name, "")
                .httpOnly(true)
                .secure(false)
                .sameSite("Lax")
                .path("/")
                .maxAge(0)
                .build();
    }

    private String readCookieValue(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) return null;
        for (Cookie cookie : cookies) {
            if (name.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }
    
}