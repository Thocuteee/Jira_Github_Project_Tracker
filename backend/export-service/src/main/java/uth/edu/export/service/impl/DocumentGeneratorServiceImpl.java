package uth.edu.export.service.impl;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.itextpdf.html2pdf.HtmlConverter;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import uth.edu.export.service.IDocumentGeneratorService;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentGeneratorServiceImpl implements IDocumentGeneratorService {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATE_TIME_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

    private final SpringTemplateEngine templateEngine;
    private final ObjectMapper objectMapper;

    @Override
    public byte[] generateDocument(String requirementDataJson, String fileType, String groupName, String authorName) {
        log.info("Bat dau tao file {}", fileType);

        try {
            List<Map<String, Object>> rawRequirements = objectMapper.readValue(
                    requirementDataJson,
                    new TypeReference<List<Map<String, Object>>>() {
                    });
            List<Map<String, String>> requirements = rawRequirements.stream()
                    .map(this::normalizeRequirement)
                    .toList();

            LocalDateTime now = LocalDateTime.now();
            String safeProjectName = defaultIfBlank(groupName, "Software Project");
            String safeAuthor = defaultIfBlank(authorName, "System");
            String exportDate = now.format(DATE_FORMAT);
            String exportDateTime = now.format(DATE_TIME_FORMAT);

            if (fileType.equalsIgnoreCase("PDF")) {
                Context context = new Context();
                context.setVariable("projectName", safeProjectName);
                context.setVariable("author", safeAuthor);
                context.setVariable("exportDate", exportDate);
                context.setVariable("exportDateTime", exportDateTime);
                context.setVariable("requirements", requirements);
                String htmlContent = templateEngine.process("srs-document", context);

                ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
                HtmlConverter.convertToPdf(htmlContent, outputStream);
                return outputStream.toByteArray();
            }

            if (fileType.equalsIgnoreCase("DOCX")) {
                return generateDocx(requirements, safeProjectName, safeAuthor, exportDate, exportDateTime);
            }

            throw new IllegalArgumentException("He thong chi ho tro PDF va DOCX!");
        } catch (Exception e) {
            log.error("Loi khi generate document: ", e);
            throw new RuntimeException("Khong the tao file document", e);
        }
    }

    private Map<String, String> normalizeRequirement(Map<String, Object> req) {
        return Map.of(
                "id", getString(req, "requirementId", "reqId", "id", "N/A"),
                "title", getString(req, "title", "name", "N/A"),
                "priority", getString(req, "priority", "N/A"),
                "status", getString(req, "status", "N/A"),
                "description", getString(req, "description", "N/A"));
    }

    private String getString(Map<String, Object> source, String key, String fallback) {
        Object value = source.get(key);
        if (value == null) {
            return fallback;
        }
        String text = String.valueOf(value).trim();
        return text.isBlank() ? fallback : text;
    }

    private String getString(Map<String, Object> source, String key1, String key2, String key3, String fallback) {
        String candidate1 = getString(source, key1, "");
        if (!candidate1.isBlank()) {
            return candidate1;
        }
        String candidate2 = getString(source, key2, "");
        if (!candidate2.isBlank()) {
            return candidate2;
        }
        String candidate3 = getString(source, key3, "");
        if (!candidate3.isBlank()) {
            return candidate3;
        }
        return fallback;
    }

    private String getString(Map<String, Object> source, String key1, String key2, String fallback) {
        String candidate1 = getString(source, key1, "");
        if (!candidate1.isBlank()) {
            return candidate1;
        }
        String candidate2 = getString(source, key2, "");
        if (!candidate2.isBlank()) {
            return candidate2;
        }
        return fallback;
    }

    private String defaultIfBlank(String value, String fallback) {
        if (value == null || value.trim().isBlank()) {
            return fallback;
        }
        return value.trim();
    }

    private byte[] generateDocx(
            List<Map<String, String>> requirements,
            String projectName,
            String author,
            String exportDate,
            String exportDateTime) throws IOException {
        try (org.apache.poi.xwpf.usermodel.XWPFDocument document = new org.apache.poi.xwpf.usermodel.XWPFDocument()) {
            addCoverPage(document, projectName, author, exportDate);
            addIntroduction(document, projectName, exportDateTime);
            addSpecificRequirements(document, requirements);

            ByteArrayOutputStream output = new ByteArrayOutputStream();
            document.write(output);
            return output.toByteArray();
        }
    }

    private void addCoverPage(org.apache.poi.xwpf.usermodel.XWPFDocument document, String projectName, String author, String exportDate) {
        org.apache.poi.xwpf.usermodel.XWPFParagraph title = document.createParagraph();
        title.setAlignment(org.apache.poi.xwpf.usermodel.ParagraphAlignment.CENTER);
        title.setSpacingBefore(3200);
        org.apache.poi.xwpf.usermodel.XWPFRun titleRun = title.createRun();
        titleRun.setBold(true);
        titleRun.setFontSize(22);
        titleRun.setText("SOFTWARE REQUIREMENTS SPECIFICATION");

        org.apache.poi.xwpf.usermodel.XWPFParagraph project = document.createParagraph();
        project.setAlignment(org.apache.poi.xwpf.usermodel.ParagraphAlignment.CENTER);
        project.setSpacingBefore(600);
        org.apache.poi.xwpf.usermodel.XWPFRun projectRun = project.createRun();
        projectRun.setBold(true);
        projectRun.setFontSize(16);
        projectRun.setText(projectName);

        org.apache.poi.xwpf.usermodel.XWPFParagraph meta = document.createParagraph();
        meta.setAlignment(org.apache.poi.xwpf.usermodel.ParagraphAlignment.CENTER);
        meta.setSpacingBefore(600);
        org.apache.poi.xwpf.usermodel.XWPFRun metaRun = meta.createRun();
        metaRun.setFontSize(12);
        metaRun.setText("Ngày xuất: " + exportDate);
        metaRun.addBreak();
        metaRun.setText("Người xuất: " + author);

        org.apache.poi.xwpf.usermodel.XWPFParagraph pageBreak = document.createParagraph();
        pageBreak.setPageBreak(true);
    }

    private void addIntroduction(org.apache.poi.xwpf.usermodel.XWPFDocument document, String projectName, String exportDateTime) {
        org.apache.poi.xwpf.usermodel.XWPFParagraph heading = document.createParagraph();
        heading.setStyle("Heading1");
        org.apache.poi.xwpf.usermodel.XWPFRun headingRun = heading.createRun();
        headingRun.setBold(true);
        headingRun.setFontSize(16);
        headingRun.setText("1. Introduction");

        org.apache.poi.xwpf.usermodel.XWPFParagraph paragraph = document.createParagraph();
        paragraph.setSpacingAfter(300);
        org.apache.poi.xwpf.usermodel.XWPFRun run = paragraph.createRun();
        run.setFontSize(11);
        run.setText("Tài liệu này tổng hợp các yêu cầu phần mềm cho dự án " + projectName
                + ", được kết xuất tự động từ hệ thống quản lý yêu cầu vào lúc " + exportDateTime + ".");
    }

    private void addSpecificRequirements(
            org.apache.poi.xwpf.usermodel.XWPFDocument document,
            List<Map<String, String>> requirements) {
        org.apache.poi.xwpf.usermodel.XWPFParagraph heading = document.createParagraph();
        heading.setStyle("Heading1");
        org.apache.poi.xwpf.usermodel.XWPFRun headingRun = heading.createRun();
        headingRun.setBold(true);
        headingRun.setFontSize(16);
        headingRun.setText("2. Specific Requirements");

        org.apache.poi.xwpf.usermodel.XWPFTable table = document.createTable();
        table.setWidth("100%");
        org.apache.poi.xwpf.usermodel.XWPFTableRow header = table.getRow(0);
        header.getCell(0).setText("ID");
        header.addNewTableCell().setText("Title");
        header.addNewTableCell().setText("Priority");
        header.addNewTableCell().setText("Status");
        header.addNewTableCell().setText("Description");

        for (Map<String, String> req : requirements) {
            org.apache.poi.xwpf.usermodel.XWPFTableRow row = table.createRow();
            row.getCell(0).setText(req.get("id"));
            row.getCell(1).setText(req.get("title"));
            row.getCell(2).setText(req.get("priority"));
            row.getCell(3).setText(req.get("status"));
            row.getCell(4).setText(req.get("description"));
        }
    }
}
