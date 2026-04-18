package uth.edu.file.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import uth.edu.file.model.FileMetadata;
import uth.edu.file.model.EFileScope;

import java.util.List;
import org.springframework.data.jpa.repository.Query;

@Repository
public interface FileMetadataRepository extends JpaRepository<FileMetadata, String> {

    List<FileMetadata> findAllByReferenceIdAndScope(String referenceId, EFileScope scope);

    void deleteAllByReferenceIdAndScope(String referenceId, EFileScope scope);

    @Query("SELECT SUM(f.fileSize) FROM FileMetadata f")
    Long sumTotalFileSize();

    @Query("SELECT f.scope, SUM(f.fileSize) FROM FileMetadata f GROUP BY f.scope")
    List<Object[]> sumFileSizeGroupByScope();
}
