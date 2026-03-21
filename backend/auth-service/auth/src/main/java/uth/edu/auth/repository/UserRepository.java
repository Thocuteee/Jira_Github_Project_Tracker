package uth.edu.auth.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import uth.edu.auth.model.User;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email); // Tìm user bằng email để login
    
    Boolean existsByEmail(String email);     // Kiểm tra email đã đăng ký chưa
}