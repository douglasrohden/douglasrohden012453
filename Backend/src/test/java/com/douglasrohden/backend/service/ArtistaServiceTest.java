package com.douglasrohden.backend.service;

import com.douglasrohden.backend.model.Artista;
import com.douglasrohden.backend.repository.ArtistaRepository;
import com.douglasrohden.backend.dto.ArtistaDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.Arrays;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ArtistaServiceTest {

    @Mock
    private ArtistaRepository repository;

    @InjectMocks
    private ArtistaService service;

    private Artista artista;
    private Pageable pageable;

    @BeforeEach
    void setUp() {
        artista = new Artista();
        artista.setId(1L);
        artista.setNome("Test Artist");
        artista.setGenero("Rock");
        pageable = PageRequest.of(0, 10);
    }

    @Test
    void findAll_ShouldReturnPageOfArtistas() {
        Page<Artista> expectedPage = new PageImpl<>(Arrays.asList(artista));
        when(repository.findAll(pageable)).thenReturn(expectedPage);

        Page<Artista> result = service.findAll(pageable);

        assertEquals(expectedPage, result);
        verify(repository).findAll(pageable);
    }

    @Test
    void searchByName_ShouldReturnPageOfArtistas() {
        Page<Artista> expectedPage = new PageImpl<>(Arrays.asList(artista));
        when(repository.findByNomeContainingIgnoreCase("test", pageable)).thenReturn(expectedPage);

        Page<Artista> result = service.searchByName("test", pageable);

        assertEquals(expectedPage, result);
        verify(repository).findByNomeContainingIgnoreCase("test", pageable);
    }

    @Test
    void search_ShouldReturnPageOfArtistaDto() {
        ArtistaDto dto = new ArtistaDto(1L, "Test Artist", "Rock", null, 0L);

        ArtistaRepository.ArtistaComAlbumCount r = mock(ArtistaRepository.ArtistaComAlbumCount.class);
        when(r.getId()).thenReturn(1L);
        when(r.getNome()).thenReturn("Test Artist");
        when(r.getGenero()).thenReturn("Rock");
        when(r.getImageUrl()).thenReturn(null);
        when(r.getAlbumCount()).thenReturn(0L);

        Page<ArtistaRepository.ArtistaComAlbumCount> page = new PageImpl<>(Arrays.asList(r));
        when(repository.searchWithAlbumCount("test", null, pageable)).thenReturn(page);

        Page<ArtistaDto> result = service.search("test", null, pageable);

        assertEquals(1, result.getContent().size());
        assertEquals(dto, result.getContent().get(0));
        verify(repository).searchWithAlbumCount("test", null, pageable);
    }

    @Test
    void findById_ShouldReturnArtista_WhenExists() {
        when(repository.findById(1L)).thenReturn(Optional.of(artista));

        Artista result = service.findById(1L);

        assertEquals(artista, result);
        verify(repository).findById(1L);
    }

    @Test
    void findById_ShouldThrowException_WhenNotExists() {
        when(repository.findById(1L)).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class, () -> service.findById(1L));
        assertEquals("Artista não encontrado", exception.getMessage());
        verify(repository).findById(1L);
    }

    @Test
    void create_ShouldReturnSavedArtista() {
        when(repository.save(artista)).thenReturn(artista);

        Artista result = service.create(artista);

        assertEquals(artista, result);
        verify(repository).save(artista);
    }

    @Test
    void update_ShouldReturnUpdatedArtista_WhenExists() {
        Artista updatedArtista = new Artista();
        updatedArtista.setNome("Updated Artist");
        updatedArtista.setGenero("Pop");

        when(repository.findById(1L)).thenReturn(Optional.of(artista));
        when(repository.save(any(Artista.class))).thenReturn(artista);

        Artista result = service.update(1L, updatedArtista);

        assertEquals("Updated Artist", result.getNome());
        assertEquals("Pop", result.getGenero());
        verify(repository).findById(1L);
        verify(repository).save(artista);
    }

    @Test
    void delete_ShouldCallRepositoryDelete() {
        service.delete(1L);

        verify(repository).deleteById(1L);
    }
}