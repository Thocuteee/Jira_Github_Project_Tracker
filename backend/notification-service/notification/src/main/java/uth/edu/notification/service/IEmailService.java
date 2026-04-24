package uth.edu.notification.service;

public interface IEmailService {
    void sendEmailAsync(String to, String subject, String body);
}
