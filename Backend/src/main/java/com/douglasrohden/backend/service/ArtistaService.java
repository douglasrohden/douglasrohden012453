package com.douglasrohden.backend.service;

import com.douglasrohden.backend.model.Artista;
import com.douglasrohden.backend.repository.ArtistaRepository;
import com.douglasrohden.backend.repository.ArtistaRepository.ArtistaComAlbumCount;
import com.douglasrohden.backend.dto.ArtistaDto;
import com.douglasrohden.backend.dto.CreateAlbumRequest;
import com.douglasrohden.backend.model.Album;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.douglasrohden.backend.model.ArtistaTipo;
import com.douglasrohden.backend.repository.ArtistImageRepository;
import com.douglasrohden.backend.model.ArtistImage;
import java.util.List;
import java.util.Map;
import java.util.Collections;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ArtistaService {

    private final ArtistaRepository repository;
    private final AlbumService albumService;
    private final ArtistImageRepository artistImageRepository;
    private final ArtistImageStorageService imageStorageService;

    private static ArtistaTipo parseTipo(String tipo) {
        if (tipo == null || tipo.isBlank())
            return null;
        try {
            return ArtistaTipo.valueOf(tipo.toUpperCase());
        } catch (IllegalArgumentException ignored) {
            return null;
        }
    }

    @Transactional(readOnly = true)
    public Page<Artista> findAll(Pageable pageable) {
        return repository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public Page<Artista> searchByName(String nome, Pageable pageable) {
        return repository.findByNomeContainingIgnoreCase(nome, pageable);
    }

    @Transactional(readOnly = true)
    public Page<ArtistaDto> search(String q, String tipo, Pageable pageable) {
        String query = (q == null) ? "" : q.trim();
        ArtistaTipo artistaTipo = parseTipo(tipo);

        Page<ArtistaComAlbumCount> resultados = repository.searchWithAlbumCount(query, artistaTipo, pageable);

        List<Long> ids = resultados.getContent().stream().map(ArtistaComAlbumCount::getId).toList();
        Map<Long, String> imageMap;
        if (ids.isEmpty()) {
            imageMap = Collections.emptyMap();
        } else {
            List<ArtistImage> images = artistImageRepository.findFirstImagesByArtistaIds(ids);
            imageMap = images.stream().collect(Collectors.toMap(
                    img -> img.getArtista().getId(),
                    img -> imageStorageService.generatePresignedUrl(img.getObjectKey()),
                    (existing, replacement) -> existing));
        }

        return resultados.map(res -> converterParaDto(res, imageMap.get(res.getId())));
    }

    /**
     * Converte um resultado de projeção em um DTO de artista.
     * Este método facilita a leitura ao dar um nome claro para a conversão.
     */
    private ArtistaDto converterParaDto(ArtistaComAlbumCount resultado, String imageUrl) {
        return new ArtistaDto(
                resultado.getId(),
                resultado.getNome(),
                resultado.getAlbumCount(),
                resultado.getTipo() != null ? resultado.getTipo().name() : null,
                imageUrl);
    }

    @Transactional(readOnly = true)
    public Artista findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Artista não encontrado"));
    }

    public Artista create(Artista artista) {
        return createWithAlbums(artista, null);
    }

    @Transactional
    public Artista createWithAlbums(Artista artista, List<Long> albumIds) {
        if (artista.getTipo() == null) {
            artista.setTipo(ArtistaTipo.CANTOR);
        }

        Artista saved = repository.save(artista);

        if (albumIds != null && !albumIds.isEmpty()) {
            List<Album> albums = albumService.findByIds(albumIds);
            java.util.Set<Album> albumsSet = new java.util.HashSet<>(albums);

            for (Album album : albumsSet) {
                if (album.getArtistas() == null) {
                    album.setArtistas(new java.util.HashSet<>());
                }
                album.getArtistas().add(saved);
            }

            if (saved.getAlbuns() == null) {
                saved.setAlbuns(new java.util.HashSet<>());
            }
            saved.getAlbuns().addAll(albumsSet);
        }

        return saved;
    }

    public Artista update(Long id, Artista artista) {
        Artista existing = findById(id);
        existing.setNome(artista.getNome());
        // imageUrl removed
        if (artista.getTipo() != null) {
            existing.setTipo(artista.getTipo());
        }
        return repository.save(existing);
    }

    @Transactional
    public void delete(Long id) {
        Artista artista = repository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Artista não encontrado"));

        imageStorageService.deleteAllImages(artista.getId());

        if (artista.getAlbuns() != null) {
            artista.getAlbuns().forEach(album -> {
                if (album.getArtistas() != null) {
                    album.getArtistas().remove(artista);
                }
            });
            artista.getAlbuns().clear();
        }

        repository.delete(artista);
    }

    @Transactional
    public Artista addAlbum(Long id, CreateAlbumRequest request) {
        Artista artista = findById(id);
        Album album = new Album();
        album.setTitulo(request.titulo());
        album.setAno(request.ano());

        album = albumService.create(album);
        artista.getAlbuns().add(album);
        return repository.save(artista);
    }
}
