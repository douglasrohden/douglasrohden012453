package com.douglasrohden.backend.service;

import com.douglasrohden.backend.dto.UpdateAlbumRequest;
import com.douglasrohden.backend.events.AlbumCreatedEvent;
import com.douglasrohden.backend.model.Album;
import com.douglasrohden.backend.model.Artista;
import com.douglasrohden.backend.repository.AlbumRepository;
import com.douglasrohden.backend.repository.ArtistaRepository;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("AlbumService service tests")
class AlbumServiceTest {

    @Mock
    private AlbumRepository albumRepository;

    @Mock
    private ArtistaRepository artistaRepository;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private AlbumService albumService;

    @Test
    @DisplayName("createWithArtistas associates artists and publishes event")
    void createWithArtistasAssociatesAndPublishesEvent() {
        Album album = new Album();
        album.setTitulo("Teste");
        album.setAno(2020);

        Album saved = new Album();
        saved.setId(10L);
        saved.setTitulo(album.getTitulo());
        saved.setAno(album.getAno());

        Artista a1 = new Artista();
        a1.setId(1L);
        Artista a2 = new Artista();
        a2.setId(2L);

        when(albumRepository.save(any(Album.class))).thenReturn(saved);
        when(artistaRepository.findAllById(List.of(1L, 2L))).thenReturn(List.of(a1, a2));
        doAnswer(invocation -> invocation.getArgument(0)).when(artistaRepository).saveAll(any());

        Album result = albumService.createWithArtistas(album, List.of(1L, 2L));

        assertEquals(2, result.getArtistas().size());
        assertTrue(a1.getAlbuns().contains(result));
        assertTrue(a2.getAlbuns().contains(result));

        ArgumentCaptor<AlbumCreatedEvent> eventCaptor = ArgumentCaptor.forClass(AlbumCreatedEvent.class);
        verify(eventPublisher).publishEvent(eventCaptor.capture());
        AlbumCreatedEvent event = eventCaptor.getValue();
        assertEquals(10L, event.id());
        assertEquals("Teste", event.titulo());
        assertEquals(2020, event.ano());
    }

    @Test
    @DisplayName("update replaces artists associations")
    void updateReplacesAssociations() {
        Album existing = new Album();
        existing.setId(5L);
        existing.setTitulo("Old");
        existing.setAno(2010);

        Artista oldArtist = new Artista();
        oldArtist.setId(1L);
        oldArtist.setAlbuns(Set.of(existing));
        existing.setArtistas(Set.of(oldArtist));

        Artista newArtist = new Artista();
        newArtist.setId(2L);

        when(albumRepository.findById(5L)).thenReturn(Optional.of(existing));
        when(artistaRepository.findAllById(List.of(2L))).thenReturn(List.of(newArtist));
        when(albumRepository.save(existing)).thenReturn(existing);

        UpdateAlbumRequest request = new UpdateAlbumRequest("New", 2024, List.of(2L));
        Optional<Album> updated = albumService.update(5L, request);

        assertTrue(updated.isPresent());
        assertEquals("New", updated.get().getTitulo());
        assertEquals(2024, updated.get().getAno());
        assertEquals(1, updated.get().getArtistas().size());
        assertTrue(updated.get().getArtistas().contains(newArtist));
    }
}
