package com.douglasrohden.backend.repository;

import com.douglasrohden.backend.model.Regional;
import java.util.List;
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
@DisplayName("RegionalRepository repository tests")
class RegionalRepositoryTest {

    @Autowired
    private RegionalRepository repository;

    @Autowired
    private TestEntityManager entityManager;

    @Test
    @DisplayName("findAllByAtivoTrue and findByExternalIdAndAtivoTrue filter correctly")
    void findActiveByExternalId() {
        Regional active = Regional.builder().externalId(1).nome("Ativa").ativo(true).build();
        Regional inactive = Regional.builder().externalId(1).nome("Inativa").ativo(false).build();
        entityManager.persist(active);
        entityManager.persist(inactive);
        entityManager.flush();

        List<Regional> actives = repository.findAllByAtivoTrue();
        assertEquals(1, actives.size());
        assertTrue(actives.get(0).isAtivo());

        assertTrue(repository.findByExternalIdAndAtivoTrue(1).isPresent());
    }
}
