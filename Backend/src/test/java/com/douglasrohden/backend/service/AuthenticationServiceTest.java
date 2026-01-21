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
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthenticationServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private UserDetailsService userDetailsService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthenticationService service;

    private Usuario usuario;
    private LoginRequest loginRequest;
    private UserDetails userDetails;

    @BeforeEach
    void setUp() {
        usuario = new Usuario();
        usuario.setId(1L);
        usuario.setUsername("testuser");
        usuario.setPasswordHash("hashedpassword");

        loginRequest = new LoginRequest();
        loginRequest.setUsername("testuser");
        loginRequest.setPassword("password");

        userDetails = mock(UserDetails.class);

        ReflectionTestUtils.setField(service, "jwtExpiration", 3600000L);
        ReflectionTestUtils.setField(service, "refreshExpiration", 86400000L);
    }

    @Test
    void login_ShouldReturnLoginResponse_WhenCredentialsValid() {
        when(usuarioRepository.findByUsername("testuser")).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("password", "hashedpassword")).thenReturn(true);
        when(userDetailsService.loadUserByUsername("testuser")).thenReturn(userDetails);
        when(jwtUtil.generateToken(userDetails)).thenReturn("accessToken");
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenReturn(new RefreshToken());

        LoginResponse result = service.login(loginRequest);

        assertNotNull(result);
        assertEquals("accessToken", result.getAccessToken());
        verify(usuarioRepository).findByUsername("testuser");
        verify(passwordEncoder).matches("password", "hashedpassword");
        verify(jwtUtil).generateToken(userDetails);
        verify(refreshTokenRepository).save(any(RefreshToken.class));
    }

    @Test
    void login_ShouldThrowException_WhenUserNotFound() {
        when(usuarioRepository.findByUsername("testuser")).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> service.login(loginRequest));
        verify(usuarioRepository).findByUsername("testuser");
    }

    @Test
    void login_ShouldThrowException_WhenPasswordInvalid() {
        when(usuarioRepository.findByUsername("testuser")).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("password", "hashedpassword")).thenReturn(false);

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> service.login(loginRequest));
        assertEquals(401, exception.getStatusCode().value());
        verify(passwordEncoder).matches("password", "hashedpassword");
    }

    @Test
    void refresh_ShouldReturnLoginResponse_WhenTokenValid() {
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setTokenHash("refreshToken");
        refreshToken.setExpiresAt(LocalDateTime.now().plusDays(1));
        refreshToken.setUsuario(usuario);

        RefreshTokenRequest request = new RefreshTokenRequest();
        request.setRefreshToken("refreshToken");

        when(refreshTokenRepository.findByTokenHash("refreshToken")).thenReturn(Optional.of(refreshToken));
        when(userDetailsService.loadUserByUsername("testuser")).thenReturn(userDetails);
        when(jwtUtil.generateToken(userDetails)).thenReturn("newAccessToken");

        LoginResponse result = service.refresh(request);

        assertNotNull(result);
        assertEquals("newAccessToken", result.getAccessToken());
        verify(refreshTokenRepository).findByTokenHash("refreshToken");
        verify(jwtUtil).generateToken(userDetails);
    }

    @Test
    void refresh_ShouldThrowException_WhenTokenNotFound() {
        RefreshTokenRequest request = new RefreshTokenRequest();
        request.setRefreshToken("invalidToken");

        when(refreshTokenRepository.findByTokenHash("invalidToken")).thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> service.refresh(request));
        assertEquals(401, exception.getStatusCode().value());
    }

    @Test
    void refresh_ShouldThrowException_WhenTokenExpired() {
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setTokenHash("refreshToken");
        refreshToken.setExpiresAt(LocalDateTime.now().minusDays(1));
        refreshToken.setUsuario(usuario);

        RefreshTokenRequest request = new RefreshTokenRequest();
        request.setRefreshToken("refreshToken");

        when(refreshTokenRepository.findByTokenHash("refreshToken")).thenReturn(Optional.of(refreshToken));

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> service.refresh(request));
        assertEquals(401, exception.getStatusCode().value());
        verify(refreshTokenRepository).delete(refreshToken);
    }
}