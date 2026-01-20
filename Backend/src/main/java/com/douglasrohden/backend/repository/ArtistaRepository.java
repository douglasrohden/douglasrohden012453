package com.douglasrohden.backend.repository;

import com.douglasrohden.backend.model.Artista;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ArtistaRepository extends JpaRepository<Artista, Long> {
    Page<Artista> findByNomeContainingIgnoreCase(String nome, Pageable pageable);
}
