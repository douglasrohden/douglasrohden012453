package com.douglasrohden.backend.service;

import com.douglasrohden.backend.dto.CreateAlbumRequest;
import com.douglasrohden.backend.dto.UpdateAlbumRequest;
import com.douglasrohden.backend.events.AlbumCreatedEvent;
import com.douglasrohden.backend.model.Album;
import com.douglasrohden.backend.model.Artista;
import com.douglasrohden.backend.repository.AlbumRepository;
import com.douglasrohden.backend.repository.ArtistaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AlbumService {

    private final AlbumRepository albumRepository;
    private final ArtistaRepository artistaRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final AlbumImageStorageService albumImageStorageService;

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

    @Transactional(readOnly = true)
    public List<Album> findByIds(List<Long> albumIds) {
        if (albumIds == null || albumIds.isEmpty()) {
            return List.of();
        }
        return albumRepository.findAllById(albumIds);
    }

    @Transactional
    public Optional<Album> update(Long id, UpdateAlbumRequest request) {
        Optional<Album> maybeAlbum = albumRepository.findById(id);
        if (maybeAlbum.isEmpty()) {
            return Optional.empty();
        }

        Album existing = maybeAlbum.get();
        existing.setTitulo(request.titulo());
        existing.setAno(request.ano());

        if (request.artistaIds() != null) {
            Set<Artista> newArtistas = new HashSet<>(artistaRepository.findAllById(request.artistaIds()));
            Set<Artista> oldArtistas = existing.getArtistas() == null ? Set.of() : new HashSet<>(existing.getArtistas());

            // Remove associations that are no longer present
            for (Artista oldArtista : oldArtistas) {
                if (!newArtistas.contains(oldArtista) && oldArtista.getAlbuns() != null) {
                    oldArtista.getAlbuns().remove(existing);
                }
            }

            // Add associations for the new set (Artista is the owning side)
            for (Artista newArtista : newArtistas) {
                if (newArtista.getAlbuns() == null) {
                    newArtista.setAlbuns(new HashSet<>());
                }
                newArtista.getAlbuns().add(existing);
            }

            Set<Artista> toSave = new HashSet<>();
            toSave.addAll(oldArtistas);
            toSave.addAll(newArtistas);
            if (!toSave.isEmpty()) {
                artistaRepository.saveAll(toSave);
            }

            existing.setArtistas(newArtistas);
        }

        return Optional.of(albumRepository.save(existing));
    }

    @Transactional
    public void delete(Long id) {
        Album album = albumRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Álbum não encontrado"));

        albumImageStorageService.deleteAllCovers(album.getId());

        if (album.getArtistas() != null) {
            album.getArtistas().forEach(artista -> {
                if (artista.getAlbuns() != null) {
                    artista.getAlbuns().remove(album);
                }
            });
            album.getArtistas().clear();
        }

        albumRepository.delete(album);
    }
}
