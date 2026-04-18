package uth.edu.export.service.impl;

import java.io.ByteArrayOutputStream;
import java.io.FileOutputStream;
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

    private final SpringTemplateEngine templateEngine;
    private final ObjectMapper objectMapper; // Dùng để đọc cục JSON

    @Override
    public byte[] generateDocument(String requirementDataJson, String fileType) {
        log.info("Bat dau tao file {}", fileType);
        
        try {
            List<Map<String, Object>> requirementList = objectMapper.readValue(
                requirementDataJson, 
                new TypeReference<List<Map<String, Object>>>() {}
            );

            if (fileType.equalsIgnoreCase("PDF")) {
                Context context = new Context();
                context.setVariable("exportDate", LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")));
                context.setVariable("requirements", requirementList);
                String htmlContent = templateEngine.process("srs-document", context);
                
                ByteArrayOutputStream outputStream = new ByteArrayOutputStream(); 
                HtmlConverter.convertToPdf(htmlContent, outputStream); 
                return outputStream.toByteArray();
            } else if (fileType.equalsIgnoreCase("DOCX")) {
                return generateDocx(requirementList);
            } else {
                throw new IllegalArgumentException("He thong chi ho tro PDF va DOCX!");
            }

        } catch (Exception e) {
            log.error("Loi khi generate document: ", e); 
            throw new RuntimeException("Khong the tao file document", e);
        }
    }

    private byte[] generateDocx(List<Map<String, Object>> requirements) throws IOException {
        try (org.apache.poi.xwpf.usermodel.XWPFDocument document = new org.apache.poi.xwpf.usermodel.XWPFDocument()) {
            org.apache.poi.xwpf.usermodel.XWPFParagraph title = document.createParagraph();
            title.setAlignment(org.apache.poi.xwpf.usermodel.ParagraphAlignment.CENTER);
            org.apache.poi.xwpf.usermodel.XWPFRun titleRun = title.createRun();
            titleRun.setText("TÀI LIỆU ĐẶC TẢ YÊU CẦU (SRS)");
            titleRun.setBold(true);
            titleRun.setFontSize(20);

            org.apache.poi.xwpf.usermodel.XWPFParagraph date = document.createParagraph();
            org.apache.poi.xwpf.usermodel.XWPFRun dateRun = date.createRun();
            dateRun.setText("Ngày xuất file: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")));

            org.apache.poi.xwpf.usermodel.XWPFTable table = document.createTable();
            org.apache.poi.xwpf.usermodel.XWPFTableRow header = table.getRow(0);
            header.getCell(0).setText("Mã Yêu Cầu (ID)");
            header.addNewTableCell().setText("Tên Chức Năng");

            for (Map<String, Object> req : requirements) {
                org.apache.poi.xwpf.usermodel.XWPFTableRow row = table.createRow();
                String reqId = String.valueOf(req.getOrDefault("requirementId", req.getOrDefault("reqId", "N/A")));
                String titleText = String.valueOf(req.getOrDefault("title", "N/A"));
                
                row.getCell(0).setText(reqId);
                row.getCell(1).setText(titleText);
            }

            ByteArrayOutputStream b = new ByteArrayOutputStream();
            document.write(b);
            return b.toByteArray();
        }
    }
}