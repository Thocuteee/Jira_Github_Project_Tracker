package uth.edu.jira.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import uth.edu.jira.model.JiraSyncActivity;
import java.util.List;
import java.util.UUID;

@Repository
public interface JiraSyncActivityRepository extends JpaRepository<JiraSyncActivity, UUID> {
    
    @Query("SELECT a FROM JiraSyncActivity a ORDER BY a.createdAt DESC")
    List<JiraSyncActivity> findRecentActivities();

    List<JiraSyncActivity> findByGroupIdOrderByCreatedAtDesc(UUID groupId);
}
