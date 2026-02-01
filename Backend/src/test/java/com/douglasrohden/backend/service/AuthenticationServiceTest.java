package com.douglasrohden.backend.service;

import com.douglasrohden.backend.dto.LoginRequest;
import com.douglasrohden.backend.dto.LoginResponse;
import com.douglasrohden.backend.dto.RefreshTokenRequest;
import com.douglasrohden.backend.model.RefreshToken;
import com.douglasrohden.backend.model.Usuario;
import com.douglasrohden.backend.repository.RefreshTokenRepository;
import com.douglasrohden.backend.repository.UsuarioRepository;
import com.douglasrohden.backend.security.JwtUtil;
import com.douglasrohden.backend.security.RefreshTokenCrypto;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthenticationService service tests")
class AuthenticationServiceTest {

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

    @Mock
    private RefreshTokenCrypto refreshTokenCrypto;

    @InjectMocks
    private AuthenticationService authenticationService;

    @Test
    @DisplayName("login returns access + refresh tokens and persists refresh token")
    void loginHappyPath() {
        ReflectionTestUtils.setField(authenticationService, "jwtExpiration", 300000L);
        ReflectionTestUtils.setField(authenticationService, "refreshExpiration", 604800000L);

        Usuario usuario = new Usuario();
        usuario.setUsername("admin");
        usuario.setPasswordHash("$2a$10$hashed");

        when(usuarioRepository.findByUsername("admin")).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches(eq("admin"), eq(usuario.getPasswordHash()))).thenReturn(true);
        when(userDetailsService.loadUserByUsername("admin"))
            .thenReturn(new User("admin", "x", java.util.List.of()));
        when(jwtUtil.generateToken(any())).thenReturn("access.jwt");
        when(refreshTokenCrypto.generateOpaqueToken()).thenReturn("refresh-raw");
        when(refreshTokenCrypto.hash("refresh-raw")).thenReturn("refresh-hash");
        doAnswer(invocation -> invocation.getArgument(0))
            .when(refreshTokenRepository).save(any(RefreshToken.class));

        LoginRequest request = new LoginRequest();
        request.setUsername("admin");
        request.setPassword("admin");
        LoginResponse response = authenticationService.login(request);

        assertEquals("access.jwt", response.getAccessToken());
        assertEquals("refresh-raw", response.getRefreshToken());
        assertEquals(300L, response.getExpiresIn());

        ArgumentCaptor<RefreshToken> tokenCaptor = ArgumentCaptor.forClass(RefreshToken.class);
        verify(refreshTokenRepository).save(tokenCaptor.capture());
        assertEquals("refresh-hash", tokenCaptor.getValue().getTokenHash());
    }

    @Test
    @DisplayName("login rejects invalid credentials")
    void loginRejectsInvalidPassword() {
        Usuario usuario = new Usuario();
        usuario.setUsername("admin");
        usuario.setPasswordHash("$2a$10$hashed");

        when(usuarioRepository.findByUsername("admin")).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches(eq("wrong"), eq(usuario.getPasswordHash()))).thenReturn(false);

        LoginRequest request = new LoginRequest();
        request.setUsername("admin");
        request.setPassword("wrong");
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
            () -> authenticationService.login(request));
        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
    }

    @Test
    @DisplayName("refresh rotates refresh token and returns new access token")
    void refreshRotatesToken() {
        ReflectionTestUtils.setField(authenticationService, "jwtExpiration", 300000L);
        ReflectionTestUtils.setField(authenticationService, "refreshExpiration", 604800000L);

        Usuario usuario = new Usuario();
        usuario.setUsername("admin");
        RefreshToken existing = new RefreshToken();
        existing.setUsuario(usuario);
        existing.setTokenHash("refresh-hash");
        existing.setExpiresAt(OffsetDateTime.now(ZoneOffset.UTC).plusDays(1));

        when(refreshTokenCrypto.hash("refresh-raw")).thenReturn("refresh-hash");
        when(refreshTokenRepository.findByTokenHash("refresh-hash")).thenReturn(Optional.of(existing));
        when(userDetailsService.loadUserByUsername("admin"))
            .thenReturn(new User("admin", "x", java.util.List.of()));
        when(jwtUtil.generateToken(any())).thenReturn("new-access.jwt");
        when(refreshTokenCrypto.generateOpaqueToken()).thenReturn("refresh-next");
        when(refreshTokenCrypto.hash("refresh-next")).thenReturn("refresh-next-hash");
        doAnswer(invocation -> invocation.getArgument(0))
            .when(refreshTokenRepository).save(any(RefreshToken.class));

        RefreshTokenRequest refreshRequest = new RefreshTokenRequest();
        refreshRequest.setRefreshToken("refresh-raw");
        LoginResponse response = authenticationService.refresh(refreshRequest);

        assertEquals("new-access.jwt", response.getAccessToken());
        assertEquals("refresh-next", response.getRefreshToken());
        assertEquals(300L, response.getExpiresIn());
        assertNotNull(existing.getRevokedAt());
        assertEquals("refresh-next-hash", existing.getReplacedByTokenHash());
    }

    @Test
    @DisplayName("refresh rejects expired token and revokes it")
    void refreshRejectsExpiredToken() {
        Usuario usuario = new Usuario();
        usuario.setUsername("admin");
        RefreshToken existing = new RefreshToken();
        existing.setUsuario(usuario);
        existing.setTokenHash("refresh-hash");
        existing.setExpiresAt(OffsetDateTime.now(ZoneOffset.UTC).minusMinutes(1));

        when(refreshTokenCrypto.hash("refresh-raw")).thenReturn("refresh-hash");
        when(refreshTokenRepository.findByTokenHash("refresh-hash")).thenReturn(Optional.of(existing));

        RefreshTokenRequest refreshRequest = new RefreshTokenRequest();
        refreshRequest.setRefreshToken("refresh-raw");
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
            () -> authenticationService.refresh(refreshRequest));
        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());

        verify(refreshTokenRepository).save(existing);
        assertNotNull(existing.getRevokedAt());
    }
}
