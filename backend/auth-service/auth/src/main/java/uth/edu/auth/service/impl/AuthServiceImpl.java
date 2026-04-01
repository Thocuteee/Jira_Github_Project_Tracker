package uth.edu.auth.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
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
import uth.edu.auth.service.RefreshTokenService;

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

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private RefreshTokenService refreshTokenService;

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
    public User registerUser(User user) { // Bỏ roleName ở đây để an toàn
        String normalizedEmail = user.getEmail() == null ? "" : user.getEmail().trim().toLowerCase();
        user.setEmail(normalizedEmail);

        // 1. Kiểm tra email tồn tại
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new RuntimeException("Lỗi: Email đã được sử dụng!");
        }

        // Hash Password
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        // 2. Thiết lập thời gian
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        // 3. ÉP BUỘC ROLE LÀ MEMBER
        Role memberRole = roleRepository.findByName(ERole.ROLE_TEAM_MEMBER)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy Role mặc định trong hệ thống."));
        
        Set<Role> roles = new HashSet<>();
        roles.add(memberRole);
        user.setRoles(roles);

        return userRepository.save(user);
    }

    // Dang nhap
    @Override
    public JwtResponse login(LoginRequest loginRequest) {
        String normalizedEmail = loginRequest.getEmail() == null ? "" : loginRequest.getEmail().trim().toLowerCase();
        String rawPassword = loginRequest.getPassword() == null ? "" : loginRequest.getPassword();
        if (normalizedEmail.isEmpty() || rawPassword.isEmpty()) {
            throw new RuntimeException("Email hoặc mật khẩu không được để trống!");
        }

        // 1. Kiểm tra User có tồn tại không
        User user = userRepository.findByEmail(normalizedEmail).orElseThrow(() -> new RuntimeException("Error: Không tìm thấy User!"));

        // 2. Kiểm tra mật khẩu 
        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            throw new RuntimeException("Error: Sai mật khẩu!");
        }

        // 3. Tạo Token từ email/username
        String jwt = jwtProvider.generateJwtToken(user.getEmail());
        String refreshToken = refreshTokenService.createRefreshToken(user.getUserId()).getToken();

        // 4. Lấy danh sách Role để trả về 
        List<String> roles = user.getRoles().stream().map(role -> role.getName().name()).collect(Collectors.toList());

        return new JwtResponse(jwt, refreshToken, user.getEmail(), roles);
    }
} 
