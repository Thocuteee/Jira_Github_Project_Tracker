package uth.edu.notification.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {
    public static final String TASK_EXCHANGE = "task.exchange";
    public static final String NOTIFICATION_QUEUE = "notification.task.queue";
    public static final String TASK_ROUTING_PATTERN = "task.event.#";

    @Bean
    public TopicExchange taskExchange() {
        return new TopicExchange(TASK_EXCHANGE);
    }

    @Bean
    public Queue notificationTaskQueue() {
        return new Queue(NOTIFICATION_QUEUE, true);
    }

    @Bean
    public Binding notificationTaskBinding(Queue notificationTaskQueue, TopicExchange taskExchange) {
        return BindingBuilder.bind(notificationTaskQueue)
            .to(taskExchange)
            .with(TASK_ROUTING_PATTERN);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
