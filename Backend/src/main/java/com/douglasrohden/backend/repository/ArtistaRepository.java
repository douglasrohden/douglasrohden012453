package com.douglasrohden.backend.repository;

import com.douglasrohden.backend.model.Artista;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ArtistaRepository extends JpaRepository<Artista, Long> {

    interface ArtistaComAlbumCount {
        Long getId();

        String getNome();

        String getGenero();

        String getImageUrl();

        long getAlbumCount();
    }

    Page<Artista> findByNomeContainingIgnoreCase(String nome, Pageable pageable);

    @EntityGraph(attributePaths = "albuns")
    Optional<Artista> findById(Long id);

        @Query(
            value = """
                SELECT
                a.id       AS id,
                a.nome     AS nome,
                a.genero   AS genero,
                a.imageUrl AS imageUrl,
                COUNT(al)  AS albumCount
                FROM Artista a
                LEFT JOIN a.albuns al
                WHERE (:q = '' OR LOWER(a.nome) LIKE LOWER(CONCAT('%', :q, '%')))
                GROUP BY a.id, a.nome, a.genero, a.imageUrl
                """,
            countQuery = """
                SELECT COUNT(a)
                FROM Artista a
                WHERE (:q = '' OR LOWER(a.nome) LIKE LOWER(CONCAT('%', :q, '%')))
                """
        )
        Page<ArtistaComAlbumCount> searchWithAlbumCount(@Param("q") String q, Pageable pageable);
}
