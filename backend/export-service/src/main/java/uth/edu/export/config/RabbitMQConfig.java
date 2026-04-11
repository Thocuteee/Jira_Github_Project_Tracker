package uth.edu.export.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    @Value("${rabbitmq.exchange.name}")
    private String exchange;

    @Value("${rabbitmq.routing.key}")
    private String routingKey;

    // tao tram phat song (exchange) de gui message, khong can tao queue o day, de ben Notification Service tu tao va binding
    @Bean
    public TopicExchange exchange() {
        return new TopicExchange(exchange);
    }

    // cong cu chuyen doi message sang json va nguoc lai, de dam bao message gui di duoc serialize va deserialize dung kieu json
    @Bean
    public MessageConverter converter() {
        return new Jackson2JsonMessageConverter();
    }

}


