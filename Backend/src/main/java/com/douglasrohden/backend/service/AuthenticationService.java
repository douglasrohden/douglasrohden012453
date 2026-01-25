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

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final UsuarioRepository usuarioRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenCrypto refreshTokenCrypto;

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

        String rawRefreshToken = refreshTokenCrypto.generateOpaqueToken();
        String refreshTokenHash = refreshTokenCrypto.hash(rawRefreshToken);

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUsuario(usuario);
        refreshToken.setTokenHash(refreshTokenHash);
        refreshToken.setExpiresAt(OffsetDateTime.now(ZoneOffset.UTC).plus(refreshExpiration, ChronoUnit.MILLIS));
        refreshToken = refreshTokenRepository.save(refreshToken);

        return new LoginResponse(accessToken, rawRefreshToken, jwtExpiration / 1000);
    }

    @Transactional
    public LoginResponse refresh(RefreshTokenRequest request) {
        String rawRefreshToken = request.getRefreshToken();
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token inválido");
        }

        String incomingHash = refreshTokenCrypto.hash(rawRefreshToken);
        RefreshToken refreshToken = refreshTokenRepository.findByTokenHash(incomingHash)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token inválido"));

        if (refreshToken.getRevokedAt() != null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token inválido");
        }

        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        if (refreshToken.getExpiresAt().isBefore(now)) {
            refreshToken.setRevokedAt(now);
            refreshTokenRepository.save(refreshToken);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token expirado");
        }

        Usuario usuario = refreshToken.getUsuario();
        UserDetails userDetails = userDetailsService.loadUserByUsername(usuario.getUsername());
        String accessToken = jwtUtil.generateToken(userDetails);

        // Refresh token rotation: invalida o token atual e emite um novo.
        String newRawRefreshToken = refreshTokenCrypto.generateOpaqueToken();
        String newHash = refreshTokenCrypto.hash(newRawRefreshToken);

        refreshToken.setRevokedAt(now);
        refreshToken.setReplacedByTokenHash(newHash);
        refreshTokenRepository.save(refreshToken);

        RefreshToken next = new RefreshToken();
        next.setUsuario(usuario);
        next.setTokenHash(newHash);
        next.setExpiresAt(now.plus(refreshExpiration, ChronoUnit.MILLIS));
        refreshTokenRepository.save(next);

        return new LoginResponse(accessToken, newRawRefreshToken, jwtExpiration / 1000);
    }
}
