package com.douglasrohden.backend.repository;

import com.douglasrohden.backend.model.Usuario;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import static org.junit.jupiter.api.Assertions.assertTrue;

@DataJpaTest(properties = {
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.flyway.enabled=false"
})
@DisplayName("UsuarioRepository repository tests")
class UsuarioRepositoryTest {

    @Autowired
    private UsuarioRepository repository;

    @Autowired
    private TestEntityManager entityManager;

    @Test
    @DisplayName("existsByUsername and findByUsername work")
    void existsAndFindByUsername() {
        Usuario user = new Usuario();
        user.setUsername("admin");
        user.setPasswordHash("hash");
        entityManager.persist(user);
        entityManager.flush();

        assertTrue(repository.existsByUsername("admin"));
        assertTrue(repository.findByUsername("admin").isPresent());
    }
}
