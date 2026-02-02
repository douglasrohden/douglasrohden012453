package com.douglasrohden.backend.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

// AUTO-GENERATED TEST - you can customize and remove this marker if you keep the test
@DisplayName("RefreshTokenCrypto component tests")
class RefreshTokenCryptoTest {

    @Test
    @DisplayName("loads RefreshTokenCrypto via reflection")
    void loadsClass() {
        assertDoesNotThrow(() -> Class.forName("com.douglasrohden.backend.security.RefreshTokenCrypto"));
    }

    @Nested
    @DisplayName("scenarios to implement for component")
    class Scenarios {

        @Test
        void happyPath() {
            RefreshTokenCrypto crypto = new RefreshTokenCrypto("pepper-key-1");

            String token = crypto.generateOpaqueToken();
            assertNotNull(token);
            assertEquals(43, token.length());
            assertTrue(token.matches("^[A-Za-z0-9_-]+$"));

            String hash = crypto.hash(token);
            assertNotNull(hash);
            assertEquals(64, hash.length());
            assertTrue(hash.matches("^[0-9a-f]{64}$"));
        }

        @Test
        void handlesEdgeCases() {
            RefreshTokenCrypto cryptoA = new RefreshTokenCrypto("pepper-key-1");
            RefreshTokenCrypto cryptoB = new RefreshTokenCrypto("pepper-key-2");

            String raw = "refresh-token-sample";
            String hashA1 = cryptoA.hash(raw);
            String hashA2 = cryptoA.hash(raw);
            String hashB = cryptoB.hash(raw);

            assertEquals(hashA1, hashA2);
            assertNotEquals(hashA1, hashB);
        }
    }
}
