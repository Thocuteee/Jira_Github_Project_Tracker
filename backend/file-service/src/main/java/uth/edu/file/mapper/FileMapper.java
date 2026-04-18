package uth.edu.file.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import uth.edu.file.dto.FileUploadResult;
import uth.edu.file.dto.PresignedUrlDto;
import uth.edu.file.dto.request.PresignedUploadRequest;
import uth.edu.file.dto.response.PresignedUrlResponse;
import uth.edu.file.model.EFileScope;
import uth.edu.file.model.FileMetadata;

import java.util.UUID;

@Mapper(componentModel = "spring")
public interface FileMapper {

    @Mapping(source = "presignedUrl.url", target = "uploadUrl")
    @Mapping(source = "presignedUrl.headers", target = "headers")
    @Mapping(source = "fileKey", target = "fileKey")
    @Mapping(source = "publicUrl", target = "publicUrl")
    PresignedUrlResponse toPresignedUrlResponse(FileUploadResult result);

    @Mapping(source = "dto.url", target = "uploadUrl")
    @Mapping(source = "dto.headers", target = "headers")
    @Mapping(source = "fileKey", target = "fileKey")
    @Mapping(source = "publicUrl", target = "publicUrl")
    PresignedUrlResponse toPresignedUrlResponse(PresignedUrlDto dto, String fileKey, String publicUrl);

    @Mapping(source = "request.fileName", target = "originalName")
    @Mapping(source = "request.referenceId", target = "referenceId")
    @Mapping(source = "fileKey", target = "fileKey")
    @Mapping(source = "scope", target = "scope")
    @Mapping(source = "uploadedBy", target = "uploadedBy")
    @Mapping(target = "fileSize", constant = "0L")
    @Mapping(target = "createdAt", ignore = true)
    FileMetadata toFileMetadata(PresignedUploadRequest request, String fileKey, UUID uploadedBy, EFileScope scope);
    @Mapping(source = "originalName", target = "fileName")
    @Mapping(source = "createdAt", target = "uploadedAt")
    @Mapping(target = "fileUrl", ignore = true) // Will be set in controller/service if needed, or via helper
    uth.edu.file.dto.response.FileRecordResponse toFileRecordResponse(FileMetadata metadata);

    java.util.List<uth.edu.file.dto.response.FileRecordResponse> toFileRecordResponseList(java.util.List<FileMetadata> metadataList);
}
