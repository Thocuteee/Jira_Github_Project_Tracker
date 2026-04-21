package uth.edu.jira.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import uth.edu.jira.model.GlobalJiraSetting;
import java.util.UUID;

public interface GlobalJiraSettingRepository extends JpaRepository<GlobalJiraSetting, UUID> {
}
