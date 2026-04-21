package uth.edu.jira.config;



import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {
    public static final String EXCHANGE = "github_jira_exchange";
    public static final String QUEUE = "jira_sync_queue";
    public static final String ROUTING_KEY = "github.event.commit";

    public static final String TASK_EXCHANGE = "task.exchange";
    public static final String TASK_QUEUE = "task_jira_sync_queue";
    public static final String TASK_ROUTING_KEY = "task.#";

    public static final String SYNC_EXCHANGE = "jira.sync.exchange";
    public static final String APP_SYNC_QUEUE = "app_sync_queue";
    public static final String JIRA_IMPORT_QUEUE = "jira_import_queue";

    @Bean
    public TopicExchange exchange() {
        return new TopicExchange(EXCHANGE);
    }

    @Bean
    public Queue queue() {
        return new Queue(QUEUE);
    }

    @Bean
    public Binding binding(Queue queue, TopicExchange exchange) {
        return BindingBuilder.bind(queue).to(exchange).with(ROUTING_KEY);
    }

    @Bean
    public TopicExchange syncExchange() {
        return new TopicExchange(SYNC_EXCHANGE);
    }

    @Bean
    public Queue appSyncQueue() {
        return new Queue(APP_SYNC_QUEUE);
    }

    @Bean
    public Queue jiraImportQueue() {
        return new Queue(JIRA_IMPORT_QUEUE);
    }

    @Bean
    public Binding appSyncBinding(Queue appSyncQueue, TopicExchange syncExchange) {
        return BindingBuilder.bind(appSyncQueue).to(syncExchange).with("app.#");
    }

    @Bean
    public Binding jiraImportBinding(Queue jiraImportQueue, TopicExchange syncExchange) {
        return BindingBuilder.bind(jiraImportQueue).to(syncExchange).with("jira.#");
    }

    @Bean
    public TopicExchange taskExchange() {
        return new TopicExchange(TASK_EXCHANGE);
    }

    @Bean
    public Queue taskQueue() {
        return new Queue(TASK_QUEUE);
    }

    @Bean
    public Binding taskBinding(Queue taskQueue, TopicExchange taskExchange) {
        return BindingBuilder.bind(taskQueue).to(taskExchange).with(TASK_ROUTING_KEY);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
