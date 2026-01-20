package com.douglasrohden.backend.repository;

import com.douglasrohden.backend.model.Artista;
import com.douglasrohden.backend.dto.ArtistaDto;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ArtistaRepository extends JpaRepository<Artista, Long> {
    Page<Artista> findByNomeContainingIgnoreCase(String nome, Pageable pageable);

    @Query(value = "SELECT new com.douglasrohden.backend.dto.ArtistaDto(a.id, a.nome, a.genero, a.imageUrl, COUNT(al)) " +
            "FROM Artista a LEFT JOIN a.albuns al " +
            "WHERE (:q IS NULL OR lower(a.nome) LIKE lower(concat('%', :q, '%'))) " +
            "GROUP BY a.id",
            countQuery = "SELECT COUNT(a) FROM Artista a WHERE (:q IS NULL OR lower(a.nome) LIKE lower(concat('%', :q, '%')))"
    )
    Page<ArtistaDto> searchWithAlbumCount(@Param("q") String q, Pageable pageable);
}
