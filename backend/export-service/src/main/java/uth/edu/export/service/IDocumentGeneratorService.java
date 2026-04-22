package uth.edu.export.service;

public interface IDocumentGeneratorService {
    byte[] generateDocument(String requirementDataJson, String fileType, String groupName, String authorName);
}