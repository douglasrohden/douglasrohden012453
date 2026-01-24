package com.douglasrohden.backend.service;

import com.douglasrohden.backend.dto.ArtistaDto;
import com.douglasrohden.backend.dto.CreateAlbumRequest;
import com.douglasrohden.backend.model.Album;
import com.douglasrohden.backend.model.Artista;
import com.douglasrohden.backend.model.ArtistaTipo;
import com.douglasrohden.backend.repository.AlbumRepository;
import com.douglasrohden.backend.repository.ArtistaRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ArtistaServiceTest {

    @Mock
    private ArtistaRepository artistaRepository;

    @Mock
    private AlbumRepository albumRepository;

    @Mock
    private AlbumService albumService;

    @InjectMocks
    private ArtistaService artistaService;

    @Test
    void shouldCreateArtistaSuccessfully() {
        Artista artista = new Artista();
        artista.setNome("Novo Artista");

        when(artistaRepository.save(any(Artista.class))).thenReturn(artista);

        Artista created = artistaService.create(artista);

        assertNotNull(created);
        assertEquals("Novo Artista", created.getNome());
        // Default type should be set
        assertEquals(ArtistaTipo.CANTOR, artista.getTipo());
    }

    @Test
    void shouldSearchArtistas() {
        Pageable pageable = Pageable.unpaged();
        ArtistaRepository.ArtistaComAlbumCount projection = mock(ArtistaRepository.ArtistaComAlbumCount.class);
        when(projection.getId()).thenReturn(1L);
        when(projection.getNome()).thenReturn("Artista Teste");

        List<ArtistaRepository.ArtistaComAlbumCount> list = List.of(projection);
        Page<ArtistaRepository.ArtistaComAlbumCount> page = new PageImpl<>(list);

        when(artistaRepository.searchWithAlbumCount(anyString(), any(), any(Pageable.class))).thenReturn(page);

        Page<ArtistaDto> result = artistaService.search("Teste", null, pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("Artista Teste", result.getContent().get(0).getNome());
    }

    @Test
    void shouldAddAlbumToArtista() {
        Long artistaId = 1L;
        CreateAlbumRequest request = new CreateAlbumRequest("Novo Album", 2023, List.of(), null);

        Artista artista = new Artista();
        artista.setId(artistaId);
        artista.setAlbuns(new HashSet<>()); // Inicializa Set

        Album savedAlbum = new Album();
        savedAlbum.setTitulo("Novo Album");

        when(artistaRepository.findById(artistaId)).thenReturn(Optional.of(artista));
        when(albumService.create(any(Album.class))).thenReturn(savedAlbum);
        when(artistaRepository.save(any(Artista.class))).thenReturn(artista);

        Artista updatedArtista = artistaService.addAlbum(artistaId, request);

        assertNotNull(updatedArtista);
        assertEquals(1, updatedArtista.getAlbuns().size());
        assertTrue(updatedArtista.getAlbuns().stream().anyMatch(a -> "Novo Album".equals(a.getTitulo())));
    }
}