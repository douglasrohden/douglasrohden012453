package com.douglasrohden.backend.websocket;

import com.douglasrohden.backend.dto.AlbumCreatedMessage;
import com.douglasrohden.backend.events.AlbumCreatedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
public class AlbumNotificationsListener {

    private final SimpMessagingTemplate messagingTemplate;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onAlbumCreated(AlbumCreatedEvent event) {
        messagingTemplate.convertAndSend(
                "/topic/albuns/created",
                new AlbumCreatedMessage(event.id(), event.titulo(), event.ano(), event.imageUrl())
        );
    }
}
