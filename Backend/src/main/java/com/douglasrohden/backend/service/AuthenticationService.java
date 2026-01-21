package com.douglasrohden.backend.service;

import com.douglasrohden.backend.dto.LoginRequest;
import com.douglasrohden.backend.dto.LoginResponse;
import com.douglasrohden.backend.dto.RefreshTokenRequest;
import com.douglasrohden.backend.model.RefreshToken;
import com.douglasrohden.backend.model.Usuario;
import com.douglasrohden.backend.repository.RefreshTokenRepository;
import com.douglasrohden.backend.repository.UsuarioRepository;
import com.douglasrohden.backend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final UsuarioRepository usuarioRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;
    private final PasswordEncoder passwordEncoder;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    @Value("${jwt.refresh.expiration}")
    private long refreshExpiration;

    public LoginResponse login(LoginRequest request) {
        Usuario usuario = usuarioRepository.findByUsername(request.getUsername())
            .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado"));

        if (!passwordEncoder.matches(request.getPassword(), usuario.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciais inválidas");
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(request.getUsername());
        String accessToken = jwtUtil.generateToken(userDetails);

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUsuario(usuario);
        refreshToken.setTokenHash(UUID.randomUUID().toString());
        refreshToken.setExpiresAt(LocalDateTime.now().plus(refreshExpiration, ChronoUnit.MILLIS));
        refreshToken = refreshTokenRepository.save(refreshToken);

        return new LoginResponse(accessToken, refreshToken.getTokenHash(), jwtExpiration / 1000);
    }

    @Transactional
    public LoginResponse refresh(RefreshTokenRequest request) {
        RefreshToken refreshToken = refreshTokenRepository.findByTokenHash(request.getRefreshToken())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token inválido"));

        if (refreshToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            refreshTokenRepository.delete(refreshToken);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token expirado");
        }

        Usuario usuario = refreshToken.getUsuario();
        UserDetails userDetails = userDetailsService.loadUserByUsername(usuario.getUsername());
        String accessToken = jwtUtil.generateToken(userDetails);

        return new LoginResponse(accessToken, refreshToken.getTokenHash(), jwtExpiration / 1000);
    }
}
