package uth.edu.auth.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import uth.edu.auth.model.User;
import uth.edu.auth.model.Role;
import uth.edu.auth.dto.JwtResponse;
import uth.edu.auth.dto.LoginRequest;
import uth.edu.auth.dto.RegisterRequest;
import uth.edu.auth.model.ERole;
import uth.edu.auth.repository.UserRepository;
import uth.edu.auth.security.JwtProvider;
import uth.edu.auth.repository.RoleRepository;
import uth.edu.auth.service.IAuthService;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AuthServiceImpl implements IAuthService {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private JwtProvider jwtProvider;

    @Override
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Override
    public User getUserById(UUID id) {
        return userRepository.findById(id).orElseThrow(()-> new RuntimeException("Không tìm thấy User!"));
    }

    @Override
    public void deleteUser(UUID id) {
        userRepository.deleteById(id);
    }

    @Override
    public User updateUser(UUID id, RegisterRequest request) {
        User user = getUserById(id);
        user.setName(request.getName());
        return userRepository.save(user);
    }

    // Dang Ky tai khoan
    @Override
    public User registerUser(User user, String roleName) {
        // 1. Kiểm tra email tồn tại
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("Lỗi: Email đã được sử dụng!");
        }

        // 2. Thiết lập thời gian tạo
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        // 3. Xử lý gán Role
        Set<Role> roles = new HashSet<>();

        ERole eRole = switch (roleName.toUpperCase()) {
            case "ADMIN" -> ERole.ROLE_ADMIN;
            case "LECTURER" -> ERole.ROLE_LECTURER;
            case "LEADER" -> ERole.ROLE_TEAM_LEADER;
            default -> ERole.ROLE_TEAM_MEMBER;
        };

        Role userRole = roleRepository.findByName(eRole).orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy Role này."));
        roles.add(userRole);
        user.setRoles(roles);

        return userRepository.save(user);
    }

    // Dang nhap
    @Override
    public JwtResponse login(LoginRequest loginRequest) {
        // 1. Kiểm tra User có tồn tại không
        User user = userRepository.findByEmail(loginRequest.getEmail()).orElseThrow(() -> new RuntimeException("Error: Không tìm thấy User!"));

        // 2. Kiểm tra mật khẩu 
        if (!user.getPassword().equals(loginRequest.getPassword())) {
            throw new RuntimeException("Error: Sai mật khẩu!");
        }

        // 3. Tạo Token từ email/username
        String jwt = jwtProvider.generateJwtToken(user.getEmail());

        // 4. Lấy danh sách Role để trả về 
        List<String> roles = user.getRoles().stream().map(role -> role.getName().name()).collect(Collectors.toList());

        return new JwtResponse(jwt, user.getEmail(), roles);
    }
} 
