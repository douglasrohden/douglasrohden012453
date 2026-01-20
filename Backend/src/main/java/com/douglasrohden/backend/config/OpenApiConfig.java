package com.douglasrohden.backend.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.responses.ApiResponse;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI openAPI() {
        Components components = new Components()
                .addSecuritySchemes("bearerAuth",
                        new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT"))
                .addSecuritySchemes("refreshToken",
                        new SecurityScheme()
                                .type(SecurityScheme.Type.APIKEY)
                                .in(SecurityScheme.In.HEADER)
                                .name("X-Refresh-Token"));

        components.addSchemas("ErrorResponse", new io.swagger.v3.oas.models.media.Schema<>()
                .type("object")
                .addProperties("timestamp", new io.swagger.v3.oas.models.media.StringSchema().example("2026-01-20T00:00:00Z"))
                .addProperties("status", new io.swagger.v3.oas.models.media.IntegerSchema().example(400))
                .addProperties("error", new io.swagger.v3.oas.models.media.StringSchema().example("Bad Request"))
                .addProperties("message", new io.swagger.v3.oas.models.media.StringSchema().example("Campo 'name' é obrigatório"))
        );

        return new OpenAPI()
                .components(components)
                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
                .info(new Info()
                        .title("Backend API")
                        .version("v1")
                        .description("API contract (source of truth). JWT + refresh token security. Use /v1 endpoints.\nDefault pagination: query params 'page' (0-based), 'size', 'sort' (e.g. 'name,asc')."));
    }

    // Global responses customizer removed due to compatibility with current springdoc starter.
    // For now we add ApiResponses per-controller/method where needed.

    private ApiResponse createResponse(String message) {
        return new ApiResponse().description(message);
    }
}
