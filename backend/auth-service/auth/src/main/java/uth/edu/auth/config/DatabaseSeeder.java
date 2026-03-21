package uth.edu.auth.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import uth.edu.auth.model.ERole;
import uth.edu.auth.model.Role;
import uth.edu.auth.repository.RoleRepository;

@Component
public class DatabaseSeeder implements CommandLineRunner{
    @Autowired
    private RoleRepository roleRepository;

    @Override
    public void run(String... args) throws Exception {
        // Chỉ nạp nếu bảng Roles đang trống
        if (roleRepository.count() == 0) {
            roleRepository.save(new Role(null, ERole.ROLE_ADMIN));
            roleRepository.save(new Role(null, ERole.ROLE_LECTURER));
            roleRepository.save(new Role(null, ERole.ROLE_TEAM_LEADER));
            roleRepository.save(new Role(null, ERole.ROLE_TEAM_MEMBER));
            
            System.out.println("Đã nạp dữ liệu mẫu cho bảng Role!");
        }
    }
}
