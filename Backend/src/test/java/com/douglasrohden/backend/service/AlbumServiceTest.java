package com.douglasrohden.backend.service;

import com.douglasrohden.backend.events.AlbumCreatedEvent;
import com.douglasrohden.backend.model.Album;
import com.douglasrohden.backend.repository.AlbumRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AlbumServiceTest {

    @Mock
    private AlbumRepository albumRepository;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private AlbumService albumService;

    @Test
    void shouldCreateAlbumAndPublishEvent() {
        Album album = new Album();
        album.setTitulo("Test Album");
        album.setId(1L);

        when(albumRepository.save(any(Album.class))).thenReturn(album);

        Album created = albumService.create(album);

        assertNotNull(created);
        assertEquals("Test Album", created.getTitulo());

        // Verify that event was published (requirement for WebSocket notification
        // later)
        verify(eventPublisher).publishEvent(any(AlbumCreatedEvent.class));
    }
}
