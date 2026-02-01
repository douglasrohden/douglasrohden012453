package com.douglasrohden.backend.repository;

import com.douglasrohden.backend.model.Album;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@DataJpaTest(properties = {
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.flyway.enabled=false"
})
@DisplayName("AlbumRepository repository tests")
class AlbumRepositoryTest {

    @Autowired
    private AlbumRepository repository;

    @Test
    @DisplayName("persists and retrieves album")
    void persistsAndRetrievesAlbum() {
        Album album = new Album();
        album.setTitulo("Harakiri");
        album.setAno(2012);

        Album saved = repository.save(album);

        assertTrue(repository.findById(saved.getId()).isPresent());
        assertEquals("Harakiri", repository.findById(saved.getId()).get().getTitulo());
    }
}
