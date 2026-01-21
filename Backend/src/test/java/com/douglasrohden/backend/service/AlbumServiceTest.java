package com.douglasrohden.backend.service;

import com.douglasrohden.backend.events.AlbumCreatedEvent;
import com.douglasrohden.backend.model.Album;
import com.douglasrohden.backend.repository.AlbumRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AlbumServiceTest {

    @Mock
    private AlbumRepository albumRepository;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private AlbumService albumService;

    @Test
    void create_ShouldSaveAlbum_AndPublishAlbumCreatedEvent() {
        Album input = new Album();
        input.setTitulo("OK Computer");
        input.setAno(1997);
        input.setImageUrl("https://example.com/ok.jpg");

        Album saved = new Album();
        saved.setId(10L);
        saved.setTitulo("OK Computer");
        saved.setAno(1997);
        saved.setImageUrl("https://example.com/ok.jpg");

        when(albumRepository.save(any(Album.class))).thenReturn(saved);

        Album result = albumService.create(input);

        assertEquals(10L, result.getId());
        verify(albumRepository).save(input);

        ArgumentCaptor<AlbumCreatedEvent> captor = ArgumentCaptor.forClass(AlbumCreatedEvent.class);
        verify(eventPublisher).publishEvent(captor.capture());

        AlbumCreatedEvent event = captor.getValue();
        assertEquals(10L, event.id());
        assertEquals("OK Computer", event.titulo());
        assertEquals(1997, event.ano());
        assertEquals("https://example.com/ok.jpg", event.imageUrl());
    }
}
