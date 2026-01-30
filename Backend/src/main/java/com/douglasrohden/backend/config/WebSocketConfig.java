package com.douglasrohden.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.util.StringUtils;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Value("${cors.allowed-origins:}")
    private String corsAllowedOrigins;

    private final Environment environment;

    public WebSocketConfig(Environment environment) {
        this.environment = environment;
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        List<String> configuredOrigins = parseAllowedOrigins(corsAllowedOrigins);

        boolean isProd = Arrays.asList(environment.getActiveProfiles()).contains("prod");
        if (isProd && configuredOrigins.isEmpty()) {
            throw new IllegalStateException("cors.allowed-origins must be configured when SPRING_PROFILES_ACTIVE=prod");
        }

        if (configuredOrigins.isEmpty()) {
            registry.addEndpoint("/ws")
                    .setAllowedOriginPatterns("http://localhost:*", "http://127.0.0.1:*")
                    .withSockJS();
            return;
        }

        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(configuredOrigins.toArray(String[]::new))
                .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");
        registry.setApplicationDestinationPrefixes("/app");
    }

    private static List<String> parseAllowedOrigins(String value) {
        if (!StringUtils.hasText(value)) {
            return List.of();
        }
        return Arrays.stream(value.split(","))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .toList();
    }
}
