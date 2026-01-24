package com.douglasrohden.backend.service;

import com.douglasrohden.backend.dto.CreateAlbumRequest;
import com.douglasrohden.backend.events.AlbumCreatedEvent;
import com.douglasrohden.backend.model.Album;
import com.douglasrohden.backend.model.Artista;
import com.douglasrohden.backend.repository.AlbumRepository;
import com.douglasrohden.backend.repository.ArtistaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AlbumService {

    private final AlbumRepository albumRepository;
    private final ArtistaRepository artistaRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public Album create(Album album) {
        return createWithArtistas(album, null);
    }

    @Transactional
    public Album createWithArtistas(Album album, List<Long> artistaIds) {
        Album saved = albumRepository.save(album);

        if (artistaIds != null && !artistaIds.isEmpty()) {
            List<Artista> artistas = artistaRepository.findAllById(artistaIds);
            Set<Artista> artistasSet = new HashSet<>(artistas);

            for (Artista artista : artistasSet) {
                if (artista.getAlbuns() == null) {
                    artista.setAlbuns(new HashSet<>());
                }
                artista.getAlbuns().add(saved);
            }
            artistaRepository.saveAll(artistasSet);
            saved.setArtistas(artistasSet);
        }

        eventPublisher.publishEvent(new AlbumCreatedEvent(
                saved.getId(),
                saved.getTitulo(),
                saved.getAno()));
        return saved;
    }

    @Transactional
    public List<Album> createBatchIndividual(CreateAlbumRequest request) {
        List<Album> createdAlbums = new ArrayList<>();
        if (request.artistaIds() != null) {
            // Itera sobre cada artista para criar um álbum individual
            for (Long artistaId : request.artistaIds()) {
                Album album = new Album();
                album.setTitulo(request.titulo());
                album.setAno(request.ano());
                // Reutiliza o método createWithArtistas para cada um
                createdAlbums.add(createWithArtistas(album, List.of(artistaId)));
            }
        }
        return createdAlbums;
    }
}
