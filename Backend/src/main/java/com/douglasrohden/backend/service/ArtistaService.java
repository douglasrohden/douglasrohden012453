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

    public Page<Artista> findAll(Pageable pageable) {
        return repository.findAll(pageable);
    }

    public Page<Artista> searchByName(String nome, Pageable pageable) {
        return repository.findByNomeContainingIgnoreCase(nome, pageable);
    }

    public Page<ArtistaDto> search(String q, Pageable pageable) {
        String normalizedQ = (q == null) ? "" : q.trim();

        return repository.searchWithAlbumCount(normalizedQ, pageable)
            .map(row -> new ArtistaDto(
                row[0] instanceof Number ? ((Number) row[0]).longValue() : null,
                (String) row[1],
                (String) row[2],
                (String) row[3],
                row[4] instanceof Number ? ((Number) row[4]).longValue() : 0L
            ));
    }

    @Transactional(readOnly = true)
    public Artista findById(Long id) {
        Artista artista = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Artista não encontrado"));
        // ensure albums are initialized within transaction so JSON serialization can include them
        if (artista.getAlbuns() != null) {
            artista.getAlbuns().size();
        }
        return artista;
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
