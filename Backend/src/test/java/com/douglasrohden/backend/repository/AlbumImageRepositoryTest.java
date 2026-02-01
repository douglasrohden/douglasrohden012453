package com.douglasrohden.backend.repository;

import com.douglasrohden.backend.model.Album;
import com.douglasrohden.backend.model.AlbumImage;
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
@DisplayName("AlbumImageRepository repository tests")
class AlbumImageRepositoryTest {

    @Autowired
    private AlbumImageRepository repository;

    @Autowired
    private TestEntityManager entityManager;

    @Test
    @DisplayName("findFirstCoversByAlbumIds returns first image per album")
    void findFirstCoversByAlbumIdsReturnsFirst() {
        Album album1 = new Album();
        album1.setTitulo("Album 1");
        entityManager.persist(album1);

        Album album2 = new Album();
        album2.setTitulo("Album 2");
        entityManager.persist(album2);

        AlbumImage img1 = AlbumImage.builder().album(album1).objectKey("a1").contentType("image/jpeg").build();
        AlbumImage img2 = AlbumImage.builder().album(album1).objectKey("a2").contentType("image/jpeg").build();
        AlbumImage img3 = AlbumImage.builder().album(album2).objectKey("b1").contentType("image/jpeg").build();

        entityManager.persist(img1);
        entityManager.persist(img2);
        entityManager.persist(img3);
        entityManager.flush();

        List<AlbumImage> firsts = repository.findFirstCoversByAlbumIds(List.of(album1.getId(), album2.getId()));

        assertEquals(2, firsts.size());
    }
}
