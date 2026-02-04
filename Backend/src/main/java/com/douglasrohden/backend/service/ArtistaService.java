package com.douglasrohden.backend.service;

import com.douglasrohden.backend.dto.AlbumRequest;
import com.douglasrohden.backend.dto.ArtistaDto;
import com.douglasrohden.backend.model.Album;
import com.douglasrohden.backend.model.Artista;
import com.douglasrohden.backend.model.ArtistaTipo;
import com.douglasrohden.backend.model.ArtistImage;
import com.douglasrohden.backend.repository.ArtistImageRepository;
import com.douglasrohden.backend.repository.ArtistaRepository;
import com.douglasrohden.backend.repository.ArtistaRepository.ArtistaComAlbumCount;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ArtistaService {

    private final ArtistaRepository repository;
    private final AlbumService albumService;
    private final ArtistImageRepository artistImageRepository;
    private final ArtistImageStorageService imageStorageService;

    private static ArtistaTipo parseTipo(String tipo) {
        if (tipo == null || tipo.isBlank()) return null;
        try {
            return ArtistaTipo.valueOf(tipo.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    @Transactional(readOnly = true)
    public Page<ArtistaDto> search(String q, String tipo, String sort, String dir, Pageable pageable) {
        if (sort != null && dir != null) {
            Sort s = Sort.by("asc".equalsIgnoreCase(dir) ? Sort.Direction.ASC : Sort.Direction.DESC, sort);
            pageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), s);
        }

        String query = q == null ? "" : q.trim();
        Page<ArtistaComAlbumCount> page = repository.searchWithAlbumCount(query, parseTipo(tipo), pageable);

        List<Long> ids = page.getContent().stream().map(ArtistaComAlbumCount::getId).toList();
        Map<Long, String> imageMap = ids.isEmpty() ? Map.of() :
                artistImageRepository.findFirstImagesByArtistaIds(ids).stream()
                        .collect(Collectors.toMap(
                                img -> img.getArtista().getId(),
                                img -> imageStorageService.generatePresignedUrl(img.getObjectKey()),
                                (a, b) -> a));

        return page.map(r -> new ArtistaDto(r.getId(), r.getNome(), r.getAlbumCount(),
                r.getTipo() != null ? r.getTipo().name() : null, imageMap.get(r.getId())));
    }

    @Transactional(readOnly = true)
    public Artista findById(Long id) {
        return repository.findById(id).orElseThrow(() -> new RuntimeException("Artista não encontrado"));
    }

    @Transactional
    public Artista createWithAlbums(Artista artista, List<Long> albumIds) {
        if (artista.getTipo() == null) artista.setTipo(ArtistaTipo.CANTOR);
        Artista saved = repository.save(artista);

        if (albumIds != null && !albumIds.isEmpty()) {
            Set<Album> albums = new HashSet<>(albumService.findByIds(albumIds));
            albums.forEach(a -> {
                if (a.getArtistas() == null) a.setArtistas(new HashSet<>());
                a.getArtistas().add(saved);
            });
            if (saved.getAlbuns() == null) saved.setAlbuns(new HashSet<>());
            saved.getAlbuns().addAll(albums);
        }
        return saved;
    }

    @Transactional
    public Artista update(Long id, Artista artista) {
        Artista existing = findById(id);
        existing.setNome(artista.getNome());
        if (artista.getTipo() != null) existing.setTipo(artista.getTipo());
        return repository.save(existing);
    }

    @Transactional
    public void delete(Long id) {
        Artista artista = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Artista não encontrado"));
        imageStorageService.deleteAllImages(artista.getId());
        if (artista.getAlbuns() != null) {
            artista.getAlbuns().forEach(a -> { if (a.getArtistas() != null) a.getArtistas().remove(artista); });
            artista.getAlbuns().clear();
        }
        repository.delete(artista);
    }

    @Transactional
    public Artista addAlbum(Long id, AlbumRequest request) {
        Artista artista = findById(id);
        Album album = albumService.create(request);
        artista.getAlbuns().add(album);
        return repository.save(artista);
    }
}
