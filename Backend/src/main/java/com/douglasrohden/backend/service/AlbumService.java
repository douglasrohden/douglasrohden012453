package com.douglasrohden.backend.service;

import com.douglasrohden.backend.events.AlbumCreatedEvent;
import com.douglasrohden.backend.model.Album;
import com.douglasrohden.backend.repository.AlbumRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AlbumService {

    private final AlbumRepository albumRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public Album create(Album album) {
        Album saved = albumRepository.save(album);
        eventPublisher.publishEvent(new AlbumCreatedEvent(
                saved.getId(),
                saved.getTitulo(),
                saved.getAno(),
                saved.getImageUrl()
        ));
        return saved;
    }
}
