package uth.edu.auth.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import uth.edu.auth.dto.RegisterRequest;
import uth.edu.auth.model.User;
import uth.edu.auth.service.IAuthService;
import java.util.UUID;
@RestController
@RequestMapping("/api/auth") 
public class AuthController {

    @Autowired
    private IAuthService authService;

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
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            // Chuyển từ DTO sang Entity để Service xử lý
            User user = new User();
            user.setName(request.getName());
            user.setEmail(request.getEmail());

            User registeredUser = authService.registerUser(user, request.getRoleName());
            
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
}