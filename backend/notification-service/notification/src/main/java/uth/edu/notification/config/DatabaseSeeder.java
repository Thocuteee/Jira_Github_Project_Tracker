package uth.edu.notification.config;

import java.time.LocalDateTime;
import java.util.UUID;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import uth.edu.notification.model.Notification;
import uth.edu.notification.repository.NotificationRepository;

@Component
public class DatabaseSeeder implements CommandLineRunner {
    private final NotificationRepository notificationRepository;

    public DatabaseSeeder(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Override
    public void run(String... args) {
        if (notificationRepository.count() > 0) {
            return;
        }

        Notification sample = new Notification();
        sample.setUserId(UUID.fromString("1"));
        sample.setTitle("Welcome");
        sample.setMessage("Notification service is ready.");
        sample.setIsRead(false);
        sample.setCreatedAt(LocalDateTime.now());

        notificationRepository.save(sample);
        System.out.println("Seeded sample data for notifications table.");
    }
}
