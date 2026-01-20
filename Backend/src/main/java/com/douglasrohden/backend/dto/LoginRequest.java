package com.douglasrohden.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(name = "LoginRequest", description = "Requisição de login com username e password")
public class LoginRequest {

    @NotBlank(message = "Username é obrigatório")
    @Schema(name = "username", example = "user1")
    @JsonProperty("username")
    private String username;

    @NotBlank(message = "Password é obrigatório")
    @Schema(name = "password", example = "senha123")
    @JsonProperty("password")
    private String password;

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
