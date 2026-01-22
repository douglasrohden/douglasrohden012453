package com.douglasrohden.backend.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.License;
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
                                .addProperties("timestamp",
                                                new io.swagger.v3.oas.models.media.StringSchema()
                                                                .example("2026-01-20T00:00:00Z"))
                                .addProperties("status",
                                                new io.swagger.v3.oas.models.media.IntegerSchema().example(400))
                                .addProperties("error",
                                                new io.swagger.v3.oas.models.media.StringSchema()
                                                                .example("Bad Request"))
                                .addProperties("message", new io.swagger.v3.oas.models.media.StringSchema()
                                                .example("Campo 'name' é obrigatório")));

                return new OpenAPI()
                                .components(components)
                                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
                                .info(new Info()
                                                .title("Artists & Albums API")
                                                .version("1.0.0")
                                                .description("""
                                                                API REST para gerenciamento de artistas e álbuns musicais.

                                                                ## Autenticação
                                                                Esta API utiliza **JWT (Bearer Token)** para autenticação.
                                                                - Obtenha seu token através do endpoint `/v1/autenticacao/login`
                                                                - Token expira em **5 minutos**
                                                                - Use o endpoint `/v1/autenticacao/refresh` para renovar

                                                                ## Paginação
                                                                Endpoints de listagem suportam paginação através dos parâmetros:
                                                                - `page`: Número da página (base 0)
                                                                - `size`: Itens por página
                                                                - `sort`: Campo e direção (ex: `nome,asc`)

                                                                ## Tecnologias
                                                                - Spring Boot 3.2.0
                                                                - PostgreSQL
                                                                - MinIO (S3-compatible storage)
                                                                - JWT Authentication
                                                                """)
                                                .contact(new Contact()
                                                                .name("Douglas Rohden")
                                                                .email("rohdendouglas@gmail.com"))
                                                .license(new License()
                                                                .name("MIT License")
                                                                .url("https://opensource.org/licenses/MIT")));
        }

        // Global responses customizer removed due to compatibility with current
        // springdoc starter.
        // For now we add ApiResponses per-controller/method where needed.

        private ApiResponse createResponse(String message) {
                return new ApiResponse().description(message);
        }
}
