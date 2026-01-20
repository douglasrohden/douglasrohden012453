package com.douglasrohden.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(name = "RefreshTokenRequest", description = "Requisição para renovação de access token usando refresh token")
public class RefreshTokenRequest {

    @NotBlank(message = "Refresh Token é obrigatório")
    @Schema(name = "refreshToken", example = "refresh_...")
    @JsonProperty("refreshToken")
    private String refreshToken;

    public String getRefreshToken() {
        return refreshToken;
    }

    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }
}
