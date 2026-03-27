package uth.edu.auth.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import uth.edu.auth.dto.JwtResponse;
import uth.edu.auth.dto.LoginRequest;
import uth.edu.auth.dto.RegisterRequest;
import uth.edu.auth.model.User;
import uth.edu.auth.model.*;
import uth.edu.auth.service.IAuthService;
import uth.edu.auth.repository.UserRepository;
import uth.edu.auth.repository.RoleRepository;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth") 
public class AuthController {

    @Autowired
    private IAuthService authService;

    @Autowired 
    private UserRepository userRepository;

    @Autowired 
    private RoleRepository roleRepository;

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
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
        try {
            JwtResponse jwtResponse = authService.login(loginRequest);
            return ResponseEntity.ok(jwtResponse);
            
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
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
    
}