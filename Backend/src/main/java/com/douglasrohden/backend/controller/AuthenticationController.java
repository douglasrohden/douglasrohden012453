package com.douglasrohden.backend.controller;

import com.douglasrohden.backend.dto.LoginRequest;
import com.douglasrohden.backend.dto.LoginResponse;
import com.douglasrohden.backend.dto.RefreshTokenRequest;
import com.douglasrohden.backend.service.AuthenticationService;
import com.douglasrohden.backend.service.RateLimitService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/autenticacao")
@RequiredArgsConstructor
public class AuthenticationController {

    private final AuthenticationService authenticationService;
    private final RateLimitService rateLimitService;

    @io.swagger.v3.oas.annotations.Operation(summary = "Login", description = "Autenticação - retorna access e refresh tokens", security = {})
    @io.swagger.v3.oas.annotations.responses.ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Autenticado"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Requisição inválida"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Credenciais inválidas"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "429", description = "Muitas requisições"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Erro interno")
    })
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody @Valid LoginRequest request, jakarta.servlet.http.HttpServletRequest httpRequest) {
        String username = request.getUsername() == null
                ? "unknown"
                : request.getUsername().trim().toLowerCase();
        String key = "login:" + username + ":" + RateLimitService.clientIp(httpRequest);

        RateLimitService.Probe probe = rateLimitService.tryConsume(key);
        long limit = rateLimitService.defaultLimitPerMinute();

        if (!probe.consumed()) {
                long retryAfterSeconds = RateLimitService.retryAfterSeconds(probe.nanosToWaitForRefill());
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .header("Retry-After", String.valueOf(retryAfterSeconds))
                    .header("X-Rate-Limit-Limit", String.valueOf(limit))
                    .header("X-Rate-Limit-Remaining", String.valueOf(probe.remainingTokens()))
                    .body(rateLimitService.buildErrorBody(retryAfterSeconds));
        }

        return ResponseEntity.ok()
                .header("X-Rate-Limit-Limit", String.valueOf(limit))
                .header("X-Rate-Limit-Remaining", String.valueOf(probe.remainingTokens()))
                .body(authenticationService.login(request));
    }

    @io.swagger.v3.oas.annotations.Operation(summary = "Refresh token", description = "Renova access token usando refresh token", security = {})
    @io.swagger.v3.oas.annotations.responses.ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Token renovado"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Requisição inválida"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Refresh token inválido"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "429", description = "Muitas requisições"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Erro interno")
    })
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@RequestBody @Valid RefreshTokenRequest request,
                                     jakarta.servlet.http.HttpServletRequest httpRequest) {
        String key = "refresh:" + RateLimitService.clientIp(httpRequest);
        RateLimitService.Probe probe = rateLimitService.tryConsume(key);
        long limit = rateLimitService.defaultLimitPerMinute();

        if (!probe.consumed()) {
            long retryAfterSeconds = RateLimitService.retryAfterSeconds(probe.nanosToWaitForRefill());
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .header("Retry-After", String.valueOf(retryAfterSeconds))
                    .header("X-Rate-Limit-Limit", String.valueOf(limit))
                    .header("X-Rate-Limit-Remaining", String.valueOf(probe.remainingTokens()))
                    .body(rateLimitService.buildErrorBody(retryAfterSeconds));
        }

        return ResponseEntity.ok()
                .header("X-Rate-Limit-Limit", String.valueOf(limit))
                .header("X-Rate-Limit-Remaining", String.valueOf(probe.remainingTokens()))
                .body(authenticationService.refresh(request));
    }
}
