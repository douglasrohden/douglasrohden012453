package com.douglasrohden.backend.service;

import com.douglasrohden.backend.dto.AlbumRequest;
import com.douglasrohden.backend.dto.AlbumWithArtistDTO;
import com.douglasrohden.backend.events.AlbumCreatedEvent;
import com.douglasrohden.backend.model.Album;
import com.douglasrohden.backend.model.Artista;
import com.douglasrohden.backend.model.ArtistaTipo;
import com.douglasrohden.backend.repository.AlbumImageRepository;
import com.douglasrohden.backend.repository.AlbumRepository;
import com.douglasrohden.backend.repository.ArtistaRepository;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

@Service
@RequiredArgsConstructor
public class AlbumService {

    private final AlbumRepository albumRepository;
    private final ArtistaRepository artistaRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final AlbumImageStorageService albumImageStorageService;
    private final AlbumImageRepository albumImageRepository;

    @Transactional(readOnly = true)
    public Page<AlbumWithArtistDTO> search(String titulo, Integer ano, String artistaNome,
                                           ArtistaTipo artistaTipo, ArtistaTipo apenasArtistaTipo, Pageable pageable) {
        Specification<Album> spec = Specification.where(null);

        if (titulo != null && !titulo.isBlank()) {
            spec = spec.and((root, q, cb) -> cb.like(cb.lower(root.get("titulo")), "%" + titulo.toLowerCase() + "%"));
        }
        if (ano != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("ano"), ano));
        }
        if (artistaNome != null && !artistaNome.isBlank()) {
            spec = spec.and((root, q, cb) -> {
                Join<Album, Artista> join = root.join("artistas");
                return cb.like(cb.lower(join.get("nome")), "%" + artistaNome.toLowerCase() + "%");
            });
        }
        if (artistaTipo != null) {
            spec = spec.and((root, q, cb) -> {
                Join<Album, Artista> join = root.join("artistas");
                return cb.equal(join.get("tipo"), artistaTipo);
            });
        }
        if (apenasArtistaTipo != null) {
            spec = spec.and((root, query, cb) -> {
                Subquery<Long> sub = query.subquery(Long.class);
                Root<Artista> a = sub.from(Artista.class);
                Join<Artista, Album> ja = a.join("albuns");
                sub.select(cb.count(a)).where(cb.and(cb.equal(ja.get("id"), root.get("id")), cb.notEqual(a.get("tipo"), apenasArtistaTipo)));

                Subquery<Long> sub2 = query.subquery(Long.class);
                Root<Artista> a2 = sub2.from(Artista.class);
                Join<Artista, Album> ja2 = a2.join("albuns");
                sub2.select(cb.count(a2)).where(cb.equal(ja2.get("id"), root.get("id")));

                return cb.and(cb.equal(sub, 0L), cb.greaterThan(sub2, 0L));
            });
        }

        Page<Album> page = albumRepository.findAll(spec, pageable);
        return new PageImpl<>(toDTOs(page.getContent()), pageable, page.getTotalElements());
    }

    private List<AlbumWithArtistDTO> toDTOs(List<Album> albums) {
        if (albums.isEmpty()) return List.of();

        List<Long> ids = albums.stream().map(Album::getId).toList();
        Map<Long, String> capaMap = new HashMap<>();
        albumImageRepository.findFirstCoversByAlbumIds(ids).forEach(img -> {
            Long aid = img.getAlbum() != null ? img.getAlbum().getId() : null;
            if (aid != null && img.getObjectKey() != null) {
                capaMap.put(aid, albumImageStorageService.generatePresignedUrl(img.getObjectKey()));
            }
        });

        return albums.stream().map(a -> AlbumWithArtistDTO.fromAlbum(a, capaMap.get(a.getId()))).toList();
    }

    @Transactional
    public Album create(AlbumRequest req) {
        Album album = new Album();
        album.setTitulo(req.titulo());
        album.setAno(req.ano());
        return saveWithArtistas(album, req.artistaIds());
    }

    @Transactional
    public List<Album> createBatch(AlbumRequest req) {
        if (req.artistaIds() == null) return List.of();
        return req.artistaIds().stream().map(artistaId -> {
            Album album = new Album();
            album.setTitulo(req.titulo());
            album.setAno(req.ano());
            return saveWithArtistas(album, List.of(artistaId));
        }).toList();
    }

    private Album saveWithArtistas(Album album, List<Long> artistaIds) {
        Album saved = albumRepository.save(album);
        if (artistaIds != null && !artistaIds.isEmpty()) {
            Set<Artista> artistas = new HashSet<>(artistaRepository.findAllById(artistaIds));
            artistas.forEach(a -> {
                if (a.getAlbuns() == null) a.setAlbuns(new HashSet<>());
                a.getAlbuns().add(saved);
            });
            artistaRepository.saveAll(artistas);
            saved.setArtistas(artistas);
        }
        eventPublisher.publishEvent(new AlbumCreatedEvent(saved.getId(), saved.getTitulo(), saved.getAno()));
        return saved;
    }

    @Transactional(readOnly = true)
    public List<Album> findByIds(List<Long> ids) {
        return ids == null || ids.isEmpty() ? List.of() : albumRepository.findAllById(ids);
    }

    @Transactional
    public Optional<Album> update(Long id, AlbumRequest req) {
        return albumRepository.findById(id).map(album -> {
            album.setTitulo(req.titulo());
            album.setAno(req.ano());
            if (req.artistaIds() != null) {
                syncArtistas(album, req.artistaIds());
            }
            return albumRepository.save(album);
        });
    }

    private void syncArtistas(Album album, List<Long> newIds) {
        Set<Artista> newSet = new HashSet<>(artistaRepository.findAllById(newIds));
        Set<Artista> oldSet = album.getArtistas() != null ? new HashSet<>(album.getArtistas()) : Set.of();

        oldSet.stream().filter(a -> !newSet.contains(a) && a.getAlbuns() != null)
              .forEach(a -> a.getAlbuns().remove(album));
        newSet.forEach(a -> {
            if (a.getAlbuns() == null) a.setAlbuns(new HashSet<>());
            a.getAlbuns().add(album);
        });

        Set<Artista> toSave = new HashSet<>();
        toSave.addAll(oldSet);
        toSave.addAll(newSet);
        if (!toSave.isEmpty()) artistaRepository.saveAll(toSave);
        album.setArtistas(newSet);
    }

    @Transactional
    public void delete(Long id) {
        Album album = albumRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Álbum não encontrado"));
        albumImageStorageService.deleteAllCovers(album.getId());
        if (album.getArtistas() != null) {
            album.getArtistas().forEach(a -> { if (a.getAlbuns() != null) a.getAlbuns().remove(album); });
            album.getArtistas().clear();
        }
        albumRepository.delete(album);
    }
}
