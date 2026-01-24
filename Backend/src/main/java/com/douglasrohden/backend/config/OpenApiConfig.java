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

                // Define global headers
                components.addHeaders("X-Rate-Limit-Limit", new io.swagger.v3.oas.models.headers.Header()
                                .description("The number of allowed requests in the current period")
                                .schema(new io.swagger.v3.oas.models.media.IntegerSchema()));

                components.addHeaders("X-Rate-Limit-Remaining", new io.swagger.v3.oas.models.headers.Header()
                                .description("The number of remaining requests in the current period")
                                .schema(new io.swagger.v3.oas.models.media.IntegerSchema()));

                components.addHeaders("X-Rate-Limit-Window-Seconds", new io.swagger.v3.oas.models.headers.Header()
                                .description("The time window in seconds for the rate limit")
                                .schema(new io.swagger.v3.oas.models.media.IntegerSchema()));

                components.addHeaders("Retry-After", new io.swagger.v3.oas.models.headers.Header()
                                .description("The number of seconds to wait before making a new request")
                                .schema(new io.swagger.v3.oas.models.media.IntegerSchema()));

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

                                                                ## Rate Link
                                                                Todos os endpoints possuem limite de requisições.
                                                                Headers de resposta indicam o estado atual:
                                                                - `X-Rate-Limit-Limit`
                                                                - `X-Rate-Limit-Remaining`
                                                                - `X-Rate-Limit-Window-Seconds`

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

        @Bean
        public org.springdoc.core.customizers.GlobalOpenApiCustomizer customerGlobalHeaderOpenApiCustomizer() {
                return openApi -> openApi.getPaths().values()
                                .forEach(pathItem -> pathItem.readOperations().forEach(operation -> {
                                        io.swagger.v3.oas.models.responses.ApiResponses apiResponses = operation
                                                        .getResponses();

                                        // 401 Unauthorized
                                        apiResponses.addApiResponse("401",
                                                        createResponse("Unauthorized - Falha na autenticação"));

                                        // 403 Forbidden
                                        apiResponses.addApiResponse("403", createResponse(
                                                        "Forbidden - Sem permissão para acessar este recurso"));

                                        // 429 Too Many Requests
                                        ApiResponse tooManyRequests = createResponse(
                                                        "Too Many Requests - Limite de requisições excedido");
                                        tooManyRequests.addHeaderObject("Retry-After",
                                                        new io.swagger.v3.oas.models.headers.Header()
                                                                        .$ref("#/components/headers/Retry-After"));
                                        apiResponses.addApiResponse("429", tooManyRequests);

                                        // Add Rate Limit headers to successful responses (200)
                                        ApiResponse okResponse = apiResponses.get("200");
                                        if (okResponse != null) {
                                                okResponse.addHeaderObject("X-Rate-Limit-Limit",
                                                                new io.swagger.v3.oas.models.headers.Header().$ref(
                                                                                "#/components/headers/X-Rate-Limit-Limit"));
                                                okResponse.addHeaderObject("X-Rate-Limit-Remaining",
                                                                new io.swagger.v3.oas.models.headers.Header().$ref(
                                                                                "#/components/headers/X-Rate-Limit-Remaining"));
                                                okResponse.addHeaderObject("X-Rate-Limit-Window-Seconds",
                                                                new io.swagger.v3.oas.models.headers.Header().$ref(
                                                                                "#/components/headers/X-Rate-Limit-Window-Seconds"));
                                        }
                                }));
        }

        private ApiResponse createResponse(String message) {
                return new ApiResponse().description(message)
                                .content(new io.swagger.v3.oas.models.media.Content().addMediaType("application/json",
                                                new io.swagger.v3.oas.models.media.MediaType().schema(
                                                                new io.swagger.v3.oas.models.media.Schema<>().$ref(
                                                                                "#/components/schemas/ErrorResponse"))));
        }
}
