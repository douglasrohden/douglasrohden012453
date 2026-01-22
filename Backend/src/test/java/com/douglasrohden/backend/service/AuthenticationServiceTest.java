package com.douglasrohden.backend.service;

import com.douglasrohden.backend.dto.LoginRequest;
import com.douglasrohden.backend.dto.LoginResponse;
import com.douglasrohden.backend.dto.RefreshTokenRequest;
import com.douglasrohden.backend.model.RefreshToken;
import com.douglasrohden.backend.model.Usuario;
import com.douglasrohden.backend.repository.RefreshTokenRepository;
import com.douglasrohden.backend.repository.UsuarioRepository;
import com.douglasrohden.backend.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuthenticationServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private UserDetailsService userDetailsService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthenticationService authenticationService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authenticationService, "jwtExpiration", 300000L);
        ReflectionTestUtils.setField(authenticationService, "refreshExpiration", 604800000L);
    }

    @Test
    void shouldAuthenticateSuccessfully() {
        LoginRequest request = new LoginRequest();
        request.setUsername("admin");
        request.setPassword("admin");
        Usuario usuario = new Usuario();
        usuario.setUsername("admin");
        usuario.setPasswordHash("hashed_password");

        when(usuarioRepository.findByUsername("admin")).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("admin", "hashed_password")).thenReturn(true);
        when(userDetailsService.loadUserByUsername("admin"))
                .thenReturn(new User("admin", "hashed_password", new ArrayList<>()));
        when(jwtUtil.generateToken(any(UserDetails.class))).thenReturn("access_token");
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(i -> {
            RefreshToken t = i.getArgument(0);
            t.setTokenHash("refresh_token_uuid"); // Simulating DB save returning object with ID/Hash
            return t;
        });

        LoginResponse response = authenticationService.login(request);

        assertNotNull(response);
        assertEquals("access_token", response.getAccessToken());
        assertEquals("refresh_token_uuid", response.getRefreshToken());
    }

    @Test
    void shouldThrowExceptionWhenPasswordIsInvalid() {
        LoginRequest request = new LoginRequest();
        request.setUsername("admin");
        request.setPassword("wrong_password");
        Usuario usuario = new Usuario();
        usuario.setUsername("admin");
        usuario.setPasswordHash("hashed_password");

        when(usuarioRepository.findByUsername("admin")).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("wrong_password", "hashed_password")).thenReturn(false);

        assertThrows(ResponseStatusException.class, () -> authenticationService.login(request));
    }

    @Test
    void shouldRefreshTokenSuccessfully() {
        RefreshTokenRequest request = new RefreshTokenRequest();
        request.setRefreshToken("valid_refresh_token");
        Usuario usuario = new Usuario();
        usuario.setUsername("admin");

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setTokenHash("valid_refresh_token");
        refreshToken.setExpiresAt(LocalDateTime.now().plusHours(1));
        refreshToken.setUsuario(usuario);

        when(refreshTokenRepository.findByTokenHash("valid_refresh_token")).thenReturn(Optional.of(refreshToken));
        when(userDetailsService.loadUserByUsername("admin")).thenReturn(new User("admin", "pass", new ArrayList<>()));
        when(jwtUtil.generateToken(any(UserDetails.class))).thenReturn("new_access_token");

        LoginResponse response = authenticationService.refresh(request);

        assertNotNull(response);
        assertEquals("new_access_token", response.getAccessToken());
        assertEquals("valid_refresh_token", response.getRefreshToken());
    }

    @Test
    void shouldThrowExceptionWhenRefreshTokenIsExpired() {
        RefreshTokenRequest request = new RefreshTokenRequest();
        request.setRefreshToken("expired_token");

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setTokenHash("expired_token");
        refreshToken.setExpiresAt(LocalDateTime.now().minusHours(1)); // Expired

        when(refreshTokenRepository.findByTokenHash("expired_token")).thenReturn(Optional.of(refreshToken));

        assertThrows(ResponseStatusException.class, () -> authenticationService.refresh(request));
        verify(refreshTokenRepository).delete(refreshToken);
    }
}