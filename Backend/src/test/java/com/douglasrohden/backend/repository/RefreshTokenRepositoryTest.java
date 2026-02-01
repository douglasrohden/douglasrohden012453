package com.douglasrohden.backend.repository;

import com.douglasrohden.backend.model.RefreshToken;
import com.douglasrohden.backend.model.Usuario;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@DataJpaTest(properties = {
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.flyway.enabled=false"
})
@DisplayName("RefreshTokenRepository repository tests")
class RefreshTokenRepositoryTest {

    @Autowired
    private RefreshTokenRepository repository;

    @Autowired
    private TestEntityManager entityManager;

    @Test
    @DisplayName("findByTokenHash returns persisted token and deleteByUsuario removes it")
    void findByTokenHashAndDeleteByUsuario() {
        Usuario user = new Usuario();
        user.setUsername("admin");
        user.setPasswordHash("hash");
        entityManager.persist(user);

        RefreshToken token = new RefreshToken();
        token.setUsuario(user);
        token.setTokenHash("token-hash");
        token.setExpiresAt(OffsetDateTime.now(ZoneOffset.UTC).plusDays(1));
        entityManager.persist(token);
        entityManager.flush();

        assertTrue(repository.findByTokenHash("token-hash").isPresent());

        int deleted = repository.deleteByUsuario(user);
        assertEquals(1, deleted);
    }
}
