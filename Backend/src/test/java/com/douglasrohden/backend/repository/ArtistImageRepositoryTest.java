package com.douglasrohden.backend.repository;

import com.douglasrohden.backend.model.Artista;
import com.douglasrohden.backend.model.ArtistImage;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import static org.junit.jupiter.api.Assertions.assertEquals;

@DataJpaTest(properties = {
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.flyway.enabled=false"
})
@DisplayName("ArtistImageRepository repository tests")
class ArtistImageRepositoryTest {

    @Autowired
    private ArtistImageRepository repository;

    @Autowired
    private TestEntityManager entityManager;

    @Test
    @DisplayName("findFirstImagesByArtistaIds returns first image per artist")
    void findFirstImagesByArtistaIdsReturnsFirst() {
        Artista artista1 = new Artista();
        artista1.setNome("Artist 1");
        entityManager.persist(artista1);

        Artista artista2 = new Artista();
        artista2.setNome("Artist 2");
        entityManager.persist(artista2);

        ArtistImage img1 = ArtistImage.builder().artista(artista1).objectKey("a1").contentType("image/jpeg").build();
        ArtistImage img2 = ArtistImage.builder().artista(artista1).objectKey("a2").contentType("image/jpeg").build();
        ArtistImage img3 = ArtistImage.builder().artista(artista2).objectKey("b1").contentType("image/jpeg").build();

        entityManager.persist(img1);
        entityManager.persist(img2);
        entityManager.persist(img3);
        entityManager.flush();

        List<ArtistImage> firsts = repository.findFirstImagesByArtistaIds(List.of(artista1.getId(), artista2.getId()));

        assertEquals(2, firsts.size());
    }
}
