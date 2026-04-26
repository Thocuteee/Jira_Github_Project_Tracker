package uth.edu.export;

import java.util.TimeZone;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync // cho phep su dung @Async trong cac service
@EnableFeignClients(defaultConfiguration = uth.edu.export.config.ExportFeignConfig.class) // Feign + forward X-User-Id khi export async
public class ExportServiceApplication {
	public static void main(String[] args) {
		TimeZone.setDefault(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
		SpringApplication.run(ExportServiceApplication.class, args);
	}
}