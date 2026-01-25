package com.douglasrohden.backend.security;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class RefreshTokenCrypto {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final SecretKeySpec secretKeySpec;

    public RefreshTokenCrypto(
            @Value("${refresh.token.pepper:${jwt.secret}}") String pepper) {
        byte[] keyBytes = pepper.getBytes(StandardCharsets.UTF_8);
        this.secretKeySpec = new SecretKeySpec(keyBytes, "HmacSHA256");
    }

    /**
     * Gera um refresh token opaco para o client (não é armazenado em plaintext).
     */
    public String generateOpaqueToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    /**
     * Deriva o hash persistível do refresh token (HMAC-SHA256), retornando hex
     * minúsculo.
     */
    public String hash(String rawRefreshToken) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(secretKeySpec);
            byte[] digest = mac.doFinal(rawRefreshToken.getBytes(StandardCharsets.UTF_8));
            return toHex(digest);
        } catch (Exception e) {
            throw new IllegalStateException("Unable to hash refresh token", e);
        }
    }

    private static String toHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(Character.forDigit((b >> 4) & 0xF, 16));
            sb.append(Character.forDigit(b & 0xF, 16));
        }
        return sb.toString();
    }
}
