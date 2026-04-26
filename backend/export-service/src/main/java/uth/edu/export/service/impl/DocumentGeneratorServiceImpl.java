package uth.edu.export.service.impl;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
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

    private static final String DEFAULT_CUSTOM_INTRODUCTION =
            "This Software Requirements Specification (SRS) document is generated automatically from the project "
                    + "requirement management system. It consolidates all selected requirements, including their priority, "
                    + "status, and short description, to support implementation planning, review, and quality assurance activities.";

    private static final String DEFAULT_PROGRESS_INTRODUCTION =
            "This project progress report summarizes requirement completion, task workload, and recent task-level discussion. "
                    + "It is generated automatically from the integrated requirement and task management system.";

    private final SpringTemplateEngine templateEngine;
    private final ObjectMapper objectMapper;

    @Override
    public byte[] generateDocument(
            String requirementDataJson,
            String fileType,
            String groupName,
            String authorName,
            String customIntroduction,
            String reportType) {
        log.info("Bat dau tao file {}", fileType);

        try {
            ParsedPayload parsed = parsePayload(requirementDataJson, reportType);
            LocalDateTime now = LocalDateTime.now();
            String safeProjectName = defaultIfBlank(groupName, "Software Project");
            String safeAuthor = defaultIfBlank(authorName, "System");
            String exportDate = now.format(DATE_FORMAT);
            String exportDateTime = now.format(DATE_TIME_FORMAT);
            String resolvedIntroduction = resolveCustomIntroduction(customIntroduction, parsed.progressReport());
            String documentTypeLabel = resolveDocumentTypeLabel(reportType);

            if (fileType.equalsIgnoreCase("PDF")) {
                Context context = new Context();
                context.setVariable("projectName", safeProjectName);
                context.setVariable("author", safeAuthor);
                context.setVariable("exportDate", exportDate);
                context.setVariable("exportDateTime", exportDateTime);
                context.setVariable("requirements", parsed.requirements());
                context.setVariable("customIntroduction", resolvedIntroduction);
                context.setVariable("documentTypeLabel", documentTypeLabel);
                context.setVariable("progressReport", parsed.progressReport());
                context.setVariable("progressSummary", parsed.summary());
                String htmlContent = templateEngine.process("srs-document", context);

                ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
                HtmlConverter.convertToPdf(htmlContent, outputStream);
                return outputStream.toByteArray();
            }

            if (fileType.equalsIgnoreCase("DOCX")) {
                return generateDocx(
                        parsed,
                        safeProjectName,
                        safeAuthor,
                        exportDate,
                        exportDateTime,
                        resolvedIntroduction);
            }

            throw new IllegalArgumentException("He thong chi ho tro PDF va DOCX!");
        } catch (Exception e) {
            log.error("Loi khi generate document: ", e);
            throw new RuntimeException("Khong the tao file document", e);
        }
    }

    private ParsedPayload parsePayload(String requirementDataJson, String reportType) throws Exception {
        JsonNode root = objectMapper.readTree(requirementDataJson);
        boolean progressType = reportType != null && "PROGRESS".equalsIgnoreCase(reportType.trim());
        if (root.isObject() && root.has("summary") && root.has("requirements") && progressType) {
            Map<String, Object> summary =
                    objectMapper.convertValue(root.get("summary"), new TypeReference<Map<String, Object>>() {});
            List<Map<String, Object>> rawReqs =
                    objectMapper.convertValue(root.get("requirements"), new TypeReference<List<Map<String, Object>>>() {});
            List<Map<String, Object>> views = new ArrayList<>();
            for (Map<String, Object> rr : rawReqs) {
                views.add(toProgressRequirementView(rr));
            }
            return new ParsedPayload(true, summary, views);
        }
        List<Map<String, Object>> rawRequirements =
                objectMapper.readValue(requirementDataJson, new TypeReference<List<Map<String, Object>>>() {});
        if (progressType) {
            Map<String, Object> fallbackSummary = new LinkedHashMap<>();
            fallbackSummary.put("totalRequirements", rawRequirements.size());
            long done = rawRequirements.stream()
                    .map(r -> String.valueOf(r.getOrDefault("status", "")))
                    .filter(this::isCompletedRequirementStatus)
                    .count();
            fallbackSummary.put("completedRequirements", (int) done);
            int pct = rawRequirements.isEmpty() ? 0 : (int) Math.round((done * 100.0) / rawRequirements.size());
            fallbackSummary.put("completionPercent", pct);
            fallbackSummary.put("totalTasks", 0);
            fallbackSummary.put("includeTaskDetails", false);
            fallbackSummary.put("includeCommentDetails", false);
            List<Map<String, Object>> views =
                    rawRequirements.stream().map(this::toProgressRequirementView).toList();
            return new ParsedPayload(true, fallbackSummary, views);
        }
        List<Map<String, Object>> srsViews = rawRequirements.stream().map(this::toSrsRequirementView).toList();
        return new ParsedPayload(false, Collections.emptyMap(), srsViews);
    }

    private boolean isCompletedRequirementStatus(String status) {
        if (status == null) {
            return false;
        }
        String s = status.trim();
        return "DONE".equalsIgnoreCase(s) || "COMPLETED".equalsIgnoreCase(s);
    }

    private Map<String, Object> toSrsRequirementView(Map<String, Object> req) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", getString(req, "requirementId", "reqId", "id", "N/A"));
        m.put("title", getString(req, "title", "name", "N/A"));
        m.put("priority", getString(req, "priority", "N/A"));
        m.put("status", getString(req, "status", "N/A"));
        m.put("description", getString(req, "description", "N/A"));
        m.put("tasks", Collections.emptyList());
        return m;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> toProgressRequirementView(Map<String, Object> rr) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", getString(rr, "requirementId", "reqId", "id", "N/A"));
        m.put("title", getString(rr, "title", "name", "N/A"));
        m.put("priority", getString(rr, "priority", "N/A"));
        m.put("status", getString(rr, "status", "N/A"));
        m.put("description", getString(rr, "description", "N/A"));
        Object t = rr.get("tasks");
        if (t instanceof List<?> list) {
            List<Map<String, Object>> safe = new ArrayList<>();
            for (Object o : list) {
                if (o instanceof Map<?, ?> mm) {
                    Map<String, Object> typed = new LinkedHashMap<>();
                    mm.forEach((k, v) -> typed.put(String.valueOf(k), v));
                    safe.add(typed);
                }
            }
            m.put("tasks", safe);
        } else {
            m.put("tasks", Collections.emptyList());
        }
        return m;
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

    private String resolveCustomIntroduction(String customIntroduction, boolean progressReport) {
        if (customIntroduction == null || customIntroduction.trim().isEmpty()) {
            return progressReport ? DEFAULT_PROGRESS_INTRODUCTION : DEFAULT_CUSTOM_INTRODUCTION;
        }
        return customIntroduction.trim();
    }

    private String resolveDocumentTypeLabel(String reportType) {
        if (reportType != null && "PROGRESS".equalsIgnoreCase(reportType.trim())) {
            return "Progress Report";
        }
        return "SRS Report";
    }

    private byte[] generateDocx(
            ParsedPayload parsed,
            String projectName,
            String author,
            String exportDate,
            String exportDateTime,
            String introductionText)
            throws IOException {
        try (org.apache.poi.xwpf.usermodel.XWPFDocument document = new org.apache.poi.xwpf.usermodel.XWPFDocument()) {
            addCoverPage(document, projectName, author, exportDate, parsed.progressReport());
            if (parsed.progressReport()) {
                addProgressSummaryDocx(document, parsed.summary());
            }
            addIntroduction(document, introductionText);
            if (parsed.progressReport()) {
                addProgressRequirementsDocx(document, parsed.requirements(), parsed.summary());
            } else {
                addSpecificRequirementsDocx(document, parsed.requirements());
            }

            org.apache.poi.xwpf.usermodel.XWPFParagraph footer = document.createParagraph();
            org.apache.poi.xwpf.usermodel.XWPFRun footerRun = footer.createRun();
            footerRun.setItalic(true);
            footerRun.setFontSize(9);
            footerRun.setText("Generated at " + exportDateTime);

            ByteArrayOutputStream output = new ByteArrayOutputStream();
            document.write(output);
            return output.toByteArray();
        }
    }

    private void addCoverPage(
            org.apache.poi.xwpf.usermodel.XWPFDocument document,
            String projectName,
            String author,
            String exportDate,
            boolean progressReport) {
        org.apache.poi.xwpf.usermodel.XWPFParagraph title = document.createParagraph();
        title.setAlignment(org.apache.poi.xwpf.usermodel.ParagraphAlignment.CENTER);
        title.setSpacingBefore(3200);
        org.apache.poi.xwpf.usermodel.XWPFRun titleRun = title.createRun();
        titleRun.setBold(true);
        titleRun.setFontSize(22);
        titleRun.setText(progressReport ? "PROJECT PROGRESS REPORT" : "SOFTWARE REQUIREMENTS SPECIFICATION");

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

    private void addProgressSummaryDocx(org.apache.poi.xwpf.usermodel.XWPFDocument document, Map<String, Object> summary) {
        org.apache.poi.xwpf.usermodel.XWPFParagraph heading = document.createParagraph();
        heading.setStyle("Heading1");
        org.apache.poi.xwpf.usermodel.XWPFRun headingRun = heading.createRun();
        headingRun.setBold(true);
        headingRun.setFontSize(16);
        headingRun.setText("Tổng quan tiến độ");

        org.apache.poi.xwpf.usermodel.XWPFTable table = document.createTable();
        table.setWidth("80%");
        org.apache.poi.xwpf.usermodel.XWPFTableRow h = table.getRow(0);
        h.getCell(0).setText("Chỉ số");
        h.addNewTableCell().setText("Giá trị");

        addSummaryRow(table, "Tổng số Requirement", String.valueOf(summary.getOrDefault("totalRequirements", "0")));
        addSummaryRow(
                table,
                "Số Requirement đã hoàn thành",
                String.valueOf(summary.getOrDefault("completedRequirements", "0")));
        addSummaryRow(table, "Tỷ lệ hoàn thành (%)", String.valueOf(summary.getOrDefault("completionPercent", "0")));
        addSummaryRow(table, "Tổng số Task", String.valueOf(summary.getOrDefault("totalTasks", "0")));

        org.apache.poi.xwpf.usermodel.XWPFParagraph pb = document.createParagraph();
        pb.setPageBreak(true);
    }

    private void addSummaryRow(org.apache.poi.xwpf.usermodel.XWPFTable table, String label, String value) {
        org.apache.poi.xwpf.usermodel.XWPFTableRow row = table.createRow();
        row.getCell(0).setText(label);
        row.getCell(1).setText(value);
    }

    private void addIntroduction(org.apache.poi.xwpf.usermodel.XWPFDocument document, String introductionText) {
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
        run.setText(introductionText);
    }

    private void addSpecificRequirementsDocx(
            org.apache.poi.xwpf.usermodel.XWPFDocument document, List<Map<String, Object>> requirements) {
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

        for (Map<String, Object> req : requirements) {
            org.apache.poi.xwpf.usermodel.XWPFTableRow row = table.createRow();
            row.getCell(0).setText(str(req.get("id")));
            row.getCell(1).setText(str(req.get("title")));
            row.getCell(2).setText(str(req.get("priority")));
            row.getCell(3).setText(str(req.get("status")));
            row.getCell(4).setText(str(req.get("description")));
        }
    }

    private void addProgressRequirementsDocx(
            org.apache.poi.xwpf.usermodel.XWPFDocument document,
            List<Map<String, Object>> requirements,
            Map<String, Object> summary) {
        org.apache.poi.xwpf.usermodel.XWPFParagraph heading = document.createParagraph();
        heading.setStyle("Heading1");
        org.apache.poi.xwpf.usermodel.XWPFRun headingRun = heading.createRun();
        headingRun.setBold(true);
        headingRun.setFontSize(16);
        headingRun.setText("2. Chi tiết Requirement & Task");

        boolean includeTaskDetails = Boolean.TRUE.equals(summary.get("includeTaskDetails"));

        for (Map<String, Object> req : requirements) {
            org.apache.poi.xwpf.usermodel.XWPFParagraph reqTitle = document.createParagraph();
            reqTitle.setSpacingBefore(200);
            org.apache.poi.xwpf.usermodel.XWPFRun reqTitleRun = reqTitle.createRun();
            reqTitleRun.setBold(true);
            reqTitleRun.setFontSize(12);
            reqTitleRun.setText(str(req.get("id")) + " — " + str(req.get("title")));

            org.apache.poi.xwpf.usermodel.XWPFTable reqTable = document.createTable();
            reqTable.setWidth("100%");
            org.apache.poi.xwpf.usermodel.XWPFTableRow rh = reqTable.getRow(0);
            rh.getCell(0).setText("Priority");
            rh.addNewTableCell().setText("Status");
            rh.addNewTableCell().setText("Mô tả");
            org.apache.poi.xwpf.usermodel.XWPFTableRow r1 = reqTable.createRow();
            r1.getCell(0).setText(str(req.get("priority")));
            r1.getCell(1).setText(str(req.get("status")));
            r1.getCell(2).setText(str(req.get("description")));

            if (!includeTaskDetails) {
                org.apache.poi.xwpf.usermodel.XWPFParagraph skip = document.createParagraph();
                org.apache.poi.xwpf.usermodel.XWPFRun sk = skip.createRun();
                sk.setItalic(true);
                sk.setFontSize(9);
                sk.setColor("64748B");
                sk.setText("(Người dùng không chọn xuất chi tiết Task.)");
                continue;
            }

            org.apache.poi.xwpf.usermodel.XWPFParagraph taskLabel = document.createParagraph();
            taskLabel.setIndentationLeft(360);
            org.apache.poi.xwpf.usermodel.XWPFRun taskLabelRun = taskLabel.createRun();
            taskLabelRun.setFontSize(10);
            taskLabelRun.setBold(true);
            taskLabelRun.setText("Danh sách Task");

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> tasks = (List<Map<String, Object>>) req.getOrDefault("tasks", List.of());

            if (tasks.isEmpty()) {
                org.apache.poi.xwpf.usermodel.XWPFParagraph empty = document.createParagraph();
                empty.setIndentationLeft(480);
                org.apache.poi.xwpf.usermodel.XWPFRun er = empty.createRun();
                er.setItalic(true);
                er.setFontSize(10);
                er.setText("Chưa có công việc nào được tạo.");
                continue;
            }

            org.apache.poi.xwpf.usermodel.XWPFTable taskTable = document.createTable();
            taskTable.setWidth("92%");
            org.apache.poi.xwpf.usermodel.XWPFTableRow th = taskTable.getRow(0);
            th.getCell(0).setText("Tên Task");
            th.addNewTableCell().setText("Người thực hiện");
            th.addNewTableCell().setText("Hạn");
            th.addNewTableCell().setText("Trạng thái");

            for (Map<String, Object> task : tasks) {
                org.apache.poi.xwpf.usermodel.XWPFTableRow tr = taskTable.createRow();
                tr.getCell(0).setText(str(task.get("title")));
                tr.getCell(1).setText(str(task.get("assignee")));
                tr.getCell(2).setText(str(task.get("dueDate")));
                tr.getCell(3).setText(str(task.get("status")));

                @SuppressWarnings("unchecked")
                List<Map<String, Object>> comments =
                        (List<Map<String, Object>>) task.getOrDefault("comments", List.of());
                if (!comments.isEmpty()) {
                    org.apache.poi.xwpf.usermodel.XWPFParagraph cHead = document.createParagraph();
                    cHead.setIndentationLeft(720);
                    org.apache.poi.xwpf.usermodel.XWPFRun cr = cHead.createRun();
                    cr.setFontSize(9);
                    cr.setBold(true);
                    cr.setText("Comment:");
                    for (Map<String, Object> c : comments) {
                        org.apache.poi.xwpf.usermodel.XWPFParagraph cp = document.createParagraph();
                        cp.setIndentationLeft(840);
                        org.apache.poi.xwpf.usermodel.XWPFRun cpr = cp.createRun();
                        cpr.setFontSize(9);
                        cpr.setText("• " + str(c.get("author")) + " (" + str(c.get("createdAt")) + "): " + str(c.get("content")));
                    }
                }
            }
        }
    }

    private static String str(Object o) {
        return o == null ? "" : String.valueOf(o);
    }

    private record ParsedPayload(boolean progressReport, Map<String, Object> summary, List<Map<String, Object>> requirements) {}
}
