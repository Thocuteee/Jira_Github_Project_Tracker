package uth.edu.auth.service;

import uth.edu.auth.model.User;
import uth.edu.auth.dto.JwtResponse;
import uth.edu.auth.dto.LoginRequest;
import uth.edu.auth.dto.RegisterRequest;
import java.util.List;
import java.util.UUID;

public interface IAuthService {
    List<User> getAllUsers();
    User getUserById(UUID id);
    void deleteUser(UUID id);
    User updateUser(UUID id, RegisterRequest request);
    User registerUser(User user, String roleName);
    JwtResponse login(LoginRequest loginRequest);
}