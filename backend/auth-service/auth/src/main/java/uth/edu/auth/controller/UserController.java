package uth.edu.auth.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import uth.edu.auth.dto.UserResponse;
import uth.edu.auth.model.User;
import uth.edu.auth.repository.UserRepository;
import java.util.stream.Collectors;
import java.util.Map;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        String email = userDetails.getUsername();

        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng!"));

        UserResponse response = new UserResponse(
                user.getUserId(),
                user.getName(),
                user.getEmail(),
                user.getRoles().stream()
                    .map(role -> role.getName().name())
                    .collect(Collectors.toSet())
        );

        return ResponseEntity.ok(response);
    }

    @PostMapping("/names")
    public ResponseEntity<Map<UUID, String>> getUserNames(@RequestBody List<UUID> userIds) {
        Map<UUID, String> nameMap = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getUserId, User::getName));
        return ResponseEntity.ok(nameMap);
    }
}