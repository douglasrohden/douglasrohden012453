package com.douglasrohden.backend.service;

import com.douglasrohden.backend.dto.AlbumRequest;
import com.douglasrohden.backend.model.Album;
import com.douglasrohden.backend.repository.AlbumRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * Testes do Service de Álbuns
 * Valida requisito SEPLAG: Lógica de negócio de álbuns
 */
@SpringBootTest
@DisplayName("AlbumService - Testes de Lógica de Negócio")
class AlbumServiceTest {

    @Autowired
    private AlbumService albumService;

    @MockBean
    private AlbumRepository albumRepository;

    @Test
    @DisplayName("Deve criar álbum com sucesso")
    void deveCriarAlbum() {
        AlbumRequest request = new AlbumRequest("Novo Álbum", 2023, List.of(), false);
        Album album = new Album();
        album.setId(1L);
        album.setTitulo("Novo Álbum");
        album.setAno(2023);

        when(albumRepository.save(any(Album.class))).thenReturn(album);

        Album result = albumService.create(request);

        assertNotNull(result);
        assertEquals("Novo Álbum", result.getTitulo());
        assertEquals(2023, result.getAno());
    }

    @Test
    @DisplayName("Deve buscar álbuns por IDs")
    void deveBuscarAlbunsPorIds() {
        Album album = new Album();
        album.setId(1L);
        album.setTitulo("Álbum Teste");
        album.setAno(2020);
        when(albumRepository.findAllById(any())).thenReturn(List.of(album));

        List<Album> result = albumService.findByIds(List.of(1L));

        assertEquals(1, result.size());
        assertEquals("Álbum Teste", result.get(0).getTitulo());
    }

    @Test
    @DisplayName("Deve atualizar álbum")
    void deveAtualizarAlbum() {
        Album existing = new Album();
        existing.setId(1L);
        existing.setTitulo("Antigo");
        existing.setAno(2020);
        AlbumRequest request = new AlbumRequest("Novo Título", 2024, List.of(), false);
        Album updated = new Album();
        updated.setId(1L);
        updated.setTitulo("Novo Título");
        updated.setAno(2024);

        when(albumRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(albumRepository.save(any(Album.class))).thenReturn(updated);

        Optional<Album> result = albumService.update(1L, request);

        assertTrue(result.isPresent());
        assertEquals("Novo Título", result.get().getTitulo());
        assertEquals(2024, result.get().getAno());
    }
}