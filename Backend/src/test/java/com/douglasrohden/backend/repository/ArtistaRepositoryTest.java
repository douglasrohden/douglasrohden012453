package com.douglasrohden.backend.repository;

import com.douglasrohden.backend.model.Album;
import com.douglasrohden.backend.model.Artista;
import com.douglasrohden.backend.model.ArtistaTipo;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@DataJpaTest(properties = {
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.flyway.enabled=false"
})
@DisplayName("ArtistaRepository component tests")
class ArtistaRepositoryTest {

    @Autowired
    private ArtistaRepository repository;

    @Autowired
    private TestEntityManager entityManager;

    @Test
    @DisplayName("searchWithAlbumCount returns correct counts and filters")
    void searchWithAlbumCountReturnsCounts() {
        Album album1 = new Album();
        album1.setTitulo("Album 1");
        entityManager.persist(album1);

        Album album2 = new Album();
        album2.setTitulo("Album 2");
        entityManager.persist(album2);

        Artista cantor = new Artista();
        cantor.setNome("Serj Tankian");
        cantor.setTipo(ArtistaTipo.CANTOR);
        cantor.setAlbuns(new HashSet<>(List.of(album1, album2)));
        entityManager.persist(cantor);

        Artista banda = new Artista();
        banda.setNome("Guns N Roses");
        banda.setTipo(ArtistaTipo.BANDA);
        banda.setAlbuns(Set.of());
        entityManager.persist(banda);

        entityManager.flush();

        Page<ArtistaRepository.ArtistaComAlbumCount> page =
            repository.searchWithAlbumCount("", null, PageRequest.of(0, 10));

        ArtistaRepository.ArtistaComAlbumCount serj =
            page.getContent().stream().filter(a -> a.getNome().equals("Serj Tankian")).findFirst().orElseThrow();

        assertEquals(2, serj.getAlbumCount());

        Page<ArtistaRepository.ArtistaComAlbumCount> onlyBands =
            repository.searchWithAlbumCount("", ArtistaTipo.BANDA, PageRequest.of(0, 10));

        assertEquals(1, onlyBands.getTotalElements());
        assertTrue(onlyBands.getContent().get(0).getNome().contains("Guns"));
    }
}
