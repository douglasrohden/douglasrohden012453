package com.douglasrohden.backend.controller;

import com.douglasrohden.backend.dto.LoginRequest;
import com.douglasrohden.backend.dto.LoginResponse;
import com.douglasrohden.backend.dto.RefreshTokenRequest;
import com.douglasrohden.backend.service.AuthenticationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthenticationController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("AuthenticationController controller tests")
class AuthenticationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthenticationService authenticationService;

    @Test
    @DisplayName("login returns tokens")
    void loginReturnsTokens() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setUsername("admin");
        request.setPassword("admin");

        when(authenticationService.login(any(LoginRequest.class)))
                .thenReturn(new LoginResponse("access.jwt", "refresh.jwt", 300000L));

        mockMvc.perform(post("/v1/autenticacao/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("access.jwt"))
                .andExpect(jsonPath("$.refreshToken").value("refresh.jwt"))
                .andExpect(jsonPath("$.expiresIn").value(300000));
    }

    @Test
    @DisplayName("refresh returns new tokens")
    void refreshReturnsTokens() throws Exception {
        RefreshTokenRequest request = new RefreshTokenRequest();
        request.setRefreshToken("refresh.jwt");

        when(authenticationService.refresh(any(RefreshTokenRequest.class)))
                .thenReturn(new LoginResponse("new.jwt", "refresh.next", 300000L));

        mockMvc.perform(post("/v1/autenticacao/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("new.jwt"))
                .andExpect(jsonPath("$.refreshToken").value("refresh.next"))
                .andExpect(jsonPath("$.expiresIn").value(300000));
    }

    @Test
    @DisplayName("login validates required fields")
    void loginValidatesRequest() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setUsername("admin");

        mockMvc.perform(post("/v1/autenticacao/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
