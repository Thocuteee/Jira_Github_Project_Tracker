package uth.edu.group.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import uth.edu.group.model.GroupMember;
import java.util.UUID;
import java.util.List;

public interface GroupMemberRepository extends JpaRepository<GroupMember, UUID> {
    List<GroupMember> findByGroupGroupId(UUID groupId);
    List<GroupMember> findByUserId(UUID userId);
    void deleteByGroupGroupIdAndUserId(UUID groupId, UUID userId);
}