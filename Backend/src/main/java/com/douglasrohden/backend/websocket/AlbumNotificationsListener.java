package com.douglasrohden.backend.websocket;

import com.douglasrohden.backend.dto.AlbumCreatedMessage;
import com.douglasrohden.backend.events.AlbumCreatedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AlbumNotificationsListener {

    private final SimpMessagingTemplate messagingTemplate;

    @EventListener
    public void onAlbumCreated(AlbumCreatedEvent event) {
        messagingTemplate.convertAndSend(
                "/topic/albuns/created",
                new AlbumCreatedMessage(event.id(), event.titulo(), event.ano(), event.imageUrl())
        );
    }
}
