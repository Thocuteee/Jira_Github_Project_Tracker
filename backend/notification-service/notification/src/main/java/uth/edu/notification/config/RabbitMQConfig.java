package uth.edu.notification.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.DefaultJackson2JavaTypeMapper;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import uth.edu.notification.dto.event.GroupMemberEvent;
import uth.edu.notification.dto.event.TaskEvent;
import java.util.HashMap;
import java.util.Map;

@Configuration
public class RabbitMQConfig {
    public static final String TASK_EXCHANGE = "task.exchange";
    public static final String GROUP_EXCHANGE = "group.exchange";
    public static final String NOTIFICATION_QUEUE = "notification.task.queue";
    public static final String NOTIFICATION_GROUP_QUEUE = "notification.group.queue";
    public static final String TASK_ROUTING_PATTERN = "task.event.#";
    public static final String GROUP_ROUTING_PATTERN = "group.member.#";
    public static final String NOTIFICATION_DLX_EXCHANGE = "notification.dlx.exchange";
    public static final String NOTIFICATION_DLQ = "notification.task.dlq";
    public static final String NOTIFICATION_DLQ_ROUTING_KEY = "notification.task.dlq";

    @Bean
    public TopicExchange taskExchange() {
        return new TopicExchange(TASK_EXCHANGE);
    }

    @Bean
    public TopicExchange groupExchange() {
        return new TopicExchange(GROUP_EXCHANGE);
    }

    @Bean
    public Queue notificationTaskQueue() {
        Map<String, Object> args = new HashMap<>();
        args.put("x-dead-letter-exchange", NOTIFICATION_DLX_EXCHANGE);
        args.put("x-dead-letter-routing-key", NOTIFICATION_DLQ_ROUTING_KEY);
        return new Queue(NOTIFICATION_QUEUE, true, false, false, args);
    }

    @Bean
    public Binding notificationTaskBinding(
        @Qualifier("notificationTaskQueue") Queue notificationTaskQueue,
        @Qualifier("taskExchange") TopicExchange taskExchange
    ) {
        return BindingBuilder.bind(notificationTaskQueue)
            .to(taskExchange)
            .with(TASK_ROUTING_PATTERN);
    }

    @Bean
    public Queue notificationGroupQueue() {
        Map<String, Object> args = new HashMap<>();
        args.put("x-dead-letter-exchange", NOTIFICATION_DLX_EXCHANGE);
        args.put("x-dead-letter-routing-key", NOTIFICATION_DLQ_ROUTING_KEY);
        return new Queue(NOTIFICATION_GROUP_QUEUE, true, false, false, args);
    }

    @Bean
    public Binding notificationGroupBinding(
        @Qualifier("notificationGroupQueue") Queue notificationGroupQueue,
        @Qualifier("groupExchange") TopicExchange groupExchange
    ) {
        return BindingBuilder.bind(notificationGroupQueue)
            .to(groupExchange)
            .with(GROUP_ROUTING_PATTERN);
    }

    @Bean
    public TopicExchange notificationDlxExchange() {
        return new TopicExchange(NOTIFICATION_DLX_EXCHANGE);
    }

    @Bean
    public Queue notificationTaskDlq() {
        return new Queue(NOTIFICATION_DLQ, true);
    }

    @Bean
    public Binding notificationTaskDlqBinding(
        @Qualifier("notificationTaskDlq") Queue notificationTaskDlq,
        @Qualifier("notificationDlxExchange") TopicExchange notificationDlxExchange
    ) {
        return BindingBuilder.bind(notificationTaskDlq)
            .to(notificationDlxExchange)
            .with(NOTIFICATION_DLQ_ROUTING_KEY);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        Jackson2JsonMessageConverter converter = new Jackson2JsonMessageConverter();
        DefaultJackson2JavaTypeMapper typeMapper = new DefaultJackson2JavaTypeMapper();

        Map<String, Class<?>> idClassMapping = new HashMap<>();
        idClassMapping.put("uth.edu.task.dto.event.TaskEvent", TaskEvent.class);
        idClassMapping.put(TaskEvent.class.getName(), TaskEvent.class);
        idClassMapping.put("uth.edu.group.dto.event.GroupMemberEvent", GroupMemberEvent.class);
        idClassMapping.put(GroupMemberEvent.class.getName(), GroupMemberEvent.class);

        typeMapper.setIdClassMapping(idClassMapping);
        typeMapper.setTrustedPackages(
            "uth.edu.notification.dto.event",
            "uth.edu.task.dto.event",
            "uth.edu.group.dto.event",
            "java.util",
            "java.time"
        );
        converter.setJavaTypeMapper(typeMapper);
        return converter;
    }
}
