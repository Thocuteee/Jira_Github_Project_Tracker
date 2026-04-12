package uth.edu.jira.service;

import java.util.Map;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

import uth.edu.jira.config.RabbitMQConfig;

@Service
public class JiraMessageListener {
    @RabbitListener(queues = RabbitMQConfig.QUEUE)
    public void receiveCommitEvent(Map<String, Object> message) {
        System.out.println("======= JIRA SERVICE NHẬN TIN NHẮN =======");
        System.out.println("Mã Jira Task: " + message.get("jiraKey"));
        System.out.println("Nội dung commit: " + message.get("message"));
        System.out.println("Link GitHub: " + message.get("url"));
        System.out.println("==========================================");

    }
}

