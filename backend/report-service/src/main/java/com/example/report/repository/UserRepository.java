package com.example.report.repository;

import com.example.report.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
}