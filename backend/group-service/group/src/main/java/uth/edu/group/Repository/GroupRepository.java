package uth.edu.group.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import uth.edu.group.model.Group;
import java.util.UUID;

public interface GroupRepository extends JpaRepository<Group, UUID> { 
    
}