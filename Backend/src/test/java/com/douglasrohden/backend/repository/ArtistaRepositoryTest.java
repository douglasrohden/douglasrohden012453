package com.douglasrohden.backend.repository;

import com.douglasrohden.backend.model.Artista;
import com.douglasrohden.backend.dto.ArtistaDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
class ArtistaRepositoryTest {

    @Autowired
    private ArtistaRepository repository;

    private Artista artista1;
    private Artista artista2;

    @BeforeEach
    void setUp() {
        artista1 = new Artista();
        artista1.setNome("Test Artist 1");
        artista1.setGenero("Rock");

        artista2 = new Artista();
        artista2.setNome("Another Artist");
        artista2.setGenero("Pop");

        repository.save(artista1);
        repository.save(artista2);
    }

    @Test
    void findByNomeContainingIgnoreCase_ShouldReturnFilteredPage() {
        Pageable pageable = PageRequest.of(0, 10);

        Page<Artista> result = repository.findByNomeContainingIgnoreCase("test", pageable);

        assertEquals(1, result.getTotalElements());
        assertEquals("Test Artist 1", result.getContent().get(0).getNome());
    }

    @Test
    void searchWithAlbumCount_ShouldReturnPageWithAlbumCount() {
        Pageable pageable = PageRequest.of(0, 10);

        Page<Object[]> raw = repository.searchWithAlbumCount("test", pageable);
        assertEquals(1, raw.getTotalElements());
        Object[] row = raw.getContent().get(0);
        ArtistaDto dto = new ArtistaDto(((Number) row[0]).longValue(), (String) row[1], (String) row[2], (String) row[3], ((Number) row[4]).longValue());
        assertEquals("Test Artist 1", dto.getNome());
        assertEquals(0L, dto.getAlbumCount()); // Assuming no albums
    }

    @Test
    void searchWithAlbumCount_ShouldHandleNullQuery() {
        Pageable pageable = PageRequest.of(0, 10);

        Page<Object[]> raw = repository.searchWithAlbumCount("", pageable);
        assertEquals(2, raw.getTotalElements());
    }

    @Test
    void findAll_ShouldSupportPagination() {
        Pageable pageable = PageRequest.of(0, 1);

        Page<Artista> result = repository.findAll(pageable);

        assertEquals(2, result.getTotalElements());
        assertEquals(1, result.getContent().size());
        assertTrue(result.hasNext());
    }
}