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
            // Chuyển Json string thành List<Map<String, Object>> để truyền vào Thymeleaf
            List<Map<String, Object>> requirementList = objectMapper.readValue(
                requirementDataJson, 
                new TypeReference<List<Map<String, Object>>>() {}
            );

            // Nhét data vào Thymeleaf context [cite: 61]
            Context context = new Context();
            context.setVariable("exportDate", LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")));
            context.setVariable("requirements", requirementList);

            // Render Thymeleaf template thành HTML string 
            String htmlContent = templateEngine.process("srs-document", context);

            // Nếu fileType là PDF thì chuyển HTML thành PDF và trả về mảng byte 
            if (fileType.equalsIgnoreCase("PDF")) {
                ByteArrayOutputStream outputStream = new ByteArrayOutputStream(); 
                HtmlConverter.convertToPdf(htmlContent, outputStream); 
                log.info("Da tao file PDF!"); 

                // luu file PDF tam thoi de kiem tra
                try (FileOutputStream fos = new FileOutputStream("TEST_SRS_PROFESSIONAL.pdf")) {
                    fos.write(outputStream.toByteArray());
                    log.info("Da luu file PDF tam thoi de kiem tra: TEST_SRS_PROFESSIONAL.pdf");
                } catch (IOException e) {
                    log.error("Loi khi ghi file PDF ra o cung", e);
                }

                return outputStream.toByteArray();
            } else {
                throw new IllegalArgumentException("He thong chi ho tro in file PDF!");
            }

        } catch (Exception e) {
            log.error("Loi khi generate document: ", e); 
            throw new RuntimeException("Khong the tao file document", e);
        }
    }
}