package uth.edu.export.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import uth.edu.export.model.ExportSRS;

@Repository
public interface ExportSRSRepository extends JpaRepository<ExportSRS, UUID> {

    List<ExportSRS> findByGroupIdOrderByCreatedAtDesc(UUID groupId);
}






