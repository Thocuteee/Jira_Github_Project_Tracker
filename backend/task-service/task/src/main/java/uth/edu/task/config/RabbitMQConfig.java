package uth.edu.task.config;

import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {
    // 1. Khai báo Tên của Trạm trung chuyển (Exchange)
    public static final String TASK_EXCHANGE = "task.exchange";

    @Bean
    public TopicExchange taskExchange() {
        return new TopicExchange(TASK_EXCHANGE);
    }

    // 2. Cấu hình Converter để tự động biến Object Java thành JSON khi gửi đi
    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
