package com.douglasrohden.backend.websocket;

import com.douglasrohden.backend.dto.AlbumCreatedMessage;
import com.douglasrohden.backend.events.AlbumCreatedEvent;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class AlbumNotificationsListenerTest {

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private AlbumNotificationsListener listener;

    @Test
    void onAlbumCreated_ShouldSendMessageToTopic() {
        AlbumCreatedEvent event = new AlbumCreatedEvent(1L, "The Wall", 1979, "https://example.com/wall.jpg");

        listener.onAlbumCreated(event);

        ArgumentCaptor<AlbumCreatedMessage> captor = ArgumentCaptor.forClass(AlbumCreatedMessage.class);
        verify(messagingTemplate).convertAndSend(
                org.mockito.ArgumentMatchers.eq("/topic/albuns/created"),
                captor.capture()
        );

        AlbumCreatedMessage msg = captor.getValue();
        assertEquals(1L, msg.id());
        assertEquals("The Wall", msg.titulo());
        assertEquals(1979, msg.ano());
        assertEquals("https://example.com/wall.jpg", msg.imageUrl());
    }
}
