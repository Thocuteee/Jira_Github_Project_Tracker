package uth.edu.github.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import uth.edu.github.model.GlobalSetting;
import java.util.UUID;

public interface GlobalSettingRepo extends JpaRepository<GlobalSetting, UUID> {
}
