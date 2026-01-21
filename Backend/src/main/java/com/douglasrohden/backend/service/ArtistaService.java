package com.douglasrohden.backend.service;

import com.douglasrohden.backend.model.Artista;
import com.douglasrohden.backend.repository.ArtistaRepository;
import com.douglasrohden.backend.repository.AlbumRepository;
import com.douglasrohden.backend.dto.ArtistaDto;
import com.douglasrohden.backend.dto.CreateAlbumRequest;
import com.douglasrohden.backend.model.Album;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.douglasrohden.backend.model.ArtistaTipo;

@Service
@RequiredArgsConstructor
public class ArtistaService {

    private final ArtistaRepository repository;
    private final AlbumRepository albumRepository;

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

        return repository.searchWithAlbumCount(query, artistaTipo, pageable)
                .map(r -> new ArtistaDto(
                        r.getId(),
                        r.getNome(),
                        r.getGenero(),
                        r.getImageUrl(),
                        r.getAlbumCount()));
    }

    @Transactional(readOnly = true)
    public Artista findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Artista não encontrado"));
    }

    public Artista create(Artista artista) {
        if (artista.getTipo() == null) {
            artista.setTipo(ArtistaTipo.CANTOR);
        }
        return repository.save(artista);
    }

    public Artista update(Long id, Artista artista) {
        Artista existing = findById(id);
        existing.setNome(artista.getNome());
        existing.setGenero(artista.getGenero());
        existing.setImageUrl(artista.getImageUrl());
        if (artista.getTipo() != null) {
            existing.setTipo(artista.getTipo());
        }
        return repository.save(existing);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    @Transactional
    public Artista addAlbum(Long id, CreateAlbumRequest request) {
        Artista artista = findById(id);
        Album album = new Album();
        album.setTitulo(request.titulo());
        album.setAno(request.ano());
        album.setImageUrl(request.imageUrl());

        album = albumRepository.save(album);
        artista.getAlbuns().add(album);
        return repository.save(artista);
    }
}
