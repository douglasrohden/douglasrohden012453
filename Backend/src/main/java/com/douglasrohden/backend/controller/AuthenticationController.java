package com.douglasrohden.backend.controller;

import com.douglasrohden.backend.dto.LoginRequest;
import com.douglasrohden.backend.dto.LoginResponse;
import com.douglasrohden.backend.dto.RefreshTokenRequest;
import com.douglasrohden.backend.service.AuthenticationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.ResponseCookie;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@RestController
@RequestMapping("/v1/autenticacao")
@RequiredArgsConstructor
public class AuthenticationController {

    private final AuthenticationService authenticationService;

    @Value("${jwt.refresh.expiration}")
    private long refreshExpirationMs;

    @Value("${security.refresh-cookie.name:refreshToken}")
    private String refreshCookieName;

    @Value("${security.refresh-cookie.secure:false}")
    private boolean refreshCookieSecure;

    @Value("${security.refresh-cookie.same-site:Lax}")
    private String refreshCookieSameSite;

    @io.swagger.v3.oas.annotations.Operation(summary = "Login", description = "Autenticação - retorna access e refresh tokens", security = {})
    @io.swagger.v3.oas.annotations.responses.ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Autenticado"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Requisição inválida"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Credenciais inválidas"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "429", description = "Muitas requisições"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Erro interno")
    })
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody @Valid LoginRequest request, HttpServletResponse response) {
        var result = authenticationService.login(request);
        setRefreshCookie(response, result.getRefreshToken());
        result.setRefreshToken(null);
        return ResponseEntity.ok(result);
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
    public ResponseEntity<?> refresh(@RequestBody(required = false) RefreshTokenRequest request,
                                     HttpServletRequest httpRequest,
                                     HttpServletResponse response) {
        String rawRefreshToken = resolveRefreshToken(request, httpRequest);
        var result = authenticationService.refresh(rawRefreshToken);
        setRefreshCookie(response, result.getRefreshToken());
        result.setRefreshToken(null);
        return ResponseEntity.ok(result);
    }

    private String resolveRefreshToken(RefreshTokenRequest request, HttpServletRequest httpRequest) {
        if (request != null && StringUtils.hasText(request.getRefreshToken())) {
            return request.getRefreshToken();
        }
        if (httpRequest == null || httpRequest.getCookies() == null) {
            return null;
        }
        for (Cookie cookie : httpRequest.getCookies()) {
            if (cookie != null && refreshCookieName.equals(cookie.getName()) && StringUtils.hasText(cookie.getValue())) {
                return cookie.getValue();
            }
        }
        return null;
    }

    private void setRefreshCookie(HttpServletResponse response, String refreshToken) {
        if (response == null || !StringUtils.hasText(refreshToken)) {
            return;
        }
        long maxAgeSeconds = Math.max(1, refreshExpirationMs / 1000);
        ResponseCookie cookie = ResponseCookie.from(refreshCookieName, refreshToken)
                .httpOnly(true)
                .secure(refreshCookieSecure)
                .sameSite(refreshCookieSameSite)
                .path("/v1/autenticacao/refresh")
                .maxAge(maxAgeSeconds)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
}
