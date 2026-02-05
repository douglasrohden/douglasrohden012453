package com.douglasrohden.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "LoginResponse", description = "Resposta de autenticação com access e refresh tokens")
@JsonInclude(JsonInclude.Include.NON_NULL)
public class LoginResponse {

    @Schema(name = "accessToken", description = "JWT de acesso", example = "eyJhbGci...")
    @JsonProperty("accessToken")
    private String accessToken;

    @Schema(name = "refreshToken", description = "Token de refresh", example = "refresh_..")
    @JsonProperty("refreshToken")
    private String refreshToken;

    @Schema(name = "expiresIn", description = "Expiração do access token em ms", example = "300000")
    @JsonProperty("expiresIn")
    private long expiresIn;

    public LoginResponse(String accessToken, String refreshToken, long expiresIn) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.expiresIn = expiresIn;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }

    public long getExpiresIn() {
        return expiresIn;
    }

    public void setExpiresIn(long expiresIn) {
        this.expiresIn = expiresIn;
    }
}
