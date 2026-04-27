package uth.edu.group.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import uth.edu.group.model.GroupMember;
import java.util.UUID;
import java.util.List;
import java.util.Optional;

public interface GroupMemberRepository extends JpaRepository<GroupMember, UUID> {

    List<GroupMember> findByGroupGroupId(UUID groupId);

    List<GroupMember> findByUserId(UUID userId);

    List<GroupMember> findByUserIdAndRoleInGroupIgnoreCase(UUID userId, String roleInGroup);

    void deleteByGroupGroupId(UUID groupId);
    void deleteByGroupGroupIdAndUserId(UUID groupId, UUID userId);

    boolean existsByGroupGroupIdAndUserId(UUID groupId, UUID userId);
    Optional<GroupMember> findByGroupGroupIdAndUserId(UUID groupId, UUID userId);

    long countByGroupGroupId(UUID groupId);
}