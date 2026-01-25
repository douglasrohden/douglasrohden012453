package com.douglasrohden.backend.repository;

import com.douglasrohden.backend.model.Artista;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import com.douglasrohden.backend.model.ArtistaTipo;

import java.util.Optional;

public interface ArtistaRepository extends JpaRepository<Artista, Long> {

    public interface ArtistaComAlbumCount {
        Long getId();

        String getNome();

        long getAlbumCount();

        ArtistaTipo getTipo();
    }

    Page<Artista> findByNomeContainingIgnoreCase(String nome, Pageable pageable);

    @EntityGraph(attributePaths = "albuns")
    Optional<Artista> findById(Long id);

    @Query(value = """
            SELECT
            a.id       AS id,
            a.nome     AS nome,
            a.tipo     AS tipo,
            COUNT(al)  AS albumCount
            FROM Artista a
            LEFT JOIN a.albuns al
            WHERE (:q = '' OR LOWER(a.nome) LIKE LOWER(CONCAT('%', :q, '%')))
            AND (:tipo IS NULL OR a.tipo = :tipo)
            GROUP BY a.id, a.nome, a.tipo
            """, countQuery = """
            SELECT COUNT(a)
            FROM Artista a
            WHERE (:q = '' OR LOWER(a.nome) LIKE LOWER(CONCAT('%', :q, '%')))
            AND (:tipo IS NULL OR a.tipo = :tipo)
            """)
    Page<ArtistaComAlbumCount> searchWithAlbumCount(@Param("q") String q,
            @Param("tipo") ArtistaTipo tipo, Pageable pageable);
}
