package com.douglasrohden.backend.service;

import com.douglasrohden.backend.model.Artista;
import com.douglasrohden.backend.repository.ArtistaRepository;
import com.douglasrohden.backend.dto.ArtistaDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ArtistaService {

    private final ArtistaRepository repository;

    @Transactional(readOnly = true)
    public Page<Artista> findAll(Pageable pageable) {
        return repository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public Page<Artista> searchByName(String nome, Pageable pageable) {
        return repository.findByNomeContainingIgnoreCase(nome, pageable);
    }

    @Transactional(readOnly = true)
    public Page<ArtistaDto> search(String q, Pageable pageable) {
        String query = (q == null) ? "" : q.trim();

        return repository.searchWithAlbumCount(query, pageable)
                .map(r -> new ArtistaDto(
                        r.getId(),
                        r.getNome(),
                        r.getGenero(),
                        r.getImageUrl(),
                        r.getAlbumCount()
                ));
    }

    @Transactional(readOnly = true)
    public Artista findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Artista não encontrado"));
    }

    public Artista create(Artista artista) {
        return repository.save(artista);
    }

    public Artista update(Long id, Artista artista) {
        Artista existing = findById(id);
        existing.setNome(artista.getNome());
        existing.setGenero(artista.getGenero());
        existing.setImageUrl(artista.getImageUrl());
        return repository.save(existing);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}
