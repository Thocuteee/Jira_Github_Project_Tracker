package uth.edu.github.service;

import java.util.Map;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import uth.edu.github.config.RabbitMQConfig;

@Service
public class GithubMessagePublisher {
    @Autowired
    private RabbitTemplate rabbitTemplate;

    public void sendCommitSync(Map<String, Object> commitData) {
        // Gửi dữ liệu qua Exchange với Routing Key đã định nghĩa
        rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE, RabbitMQConfig.ROUTING_KEY, commitData);
        System.out.println(" [x] Đã gửi dữ liệu commit sang RabbitMQ");
    }
}
