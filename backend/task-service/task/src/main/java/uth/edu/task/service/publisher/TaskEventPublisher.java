package uth.edu.task.service.publisher;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import uth.edu.task.config.RabbitMQConfig;
import uth.edu.task.dto.event.TaskEvent;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaskEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    public void publishTaskEvent(TaskEvent event) {
        // Định nghĩa Routing Key
        String routingKey = "task.event." + event.getEventType().toLowerCase();

        rabbitTemplate.convertAndSend(RabbitMQConfig.TASK_EXCHANGE, routingKey, event);

        log.info("Đã bắn sự kiện lên RabbitMQ: RoutingKey={}, TaskId={}", routingKey, event.getTaskId());
    }

}
