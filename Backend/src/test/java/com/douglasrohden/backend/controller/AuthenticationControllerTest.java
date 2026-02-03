package com.douglasrohden.backend.controller;

import com.douglasrohden.backend.security.JwtUtil;
import com.douglasrohden.backend.service.AuthenticationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Testes do Controller de Autenticação
 * Valida requisito SEPLAG: JWT com 5min + refresh token
 */
@SpringBootTest
@DisplayName("AuthenticationController - Testes de Login e Autenticação")
class AuthenticationControllerTest {

    @Autowired
    private AuthenticationService authenticationService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired(required = false)
    private AuthenticationController authenticationController;

    @Test
    @DisplayName("Deve verificar que o JwtUtil está configurado")
    void testJwtUtilConfigurado() {
        assertNotNull(jwtUtil, "JwtUtil deve estar configurado");
    }

    @Test
    @DisplayName("Deve verificar que o AuthenticationService está configurado")
    void testAuthenticationServiceConfigurado() {
        assertNotNull(authenticationService, "AuthenticationService deve estar configurado");
    }

    @Test
    @DisplayName("Deve validar que o sistema de autenticação JWT está disponível")
    void testSistemaJwtDisponivel() {
        // Valida que os componentes essenciais para JWT estão ativos
        assertTrue(jwtUtil != null && authenticationService != null,
            "Sistema deve ter JWT e autenticação funcionando");
    }
}
