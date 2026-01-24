package com.douglasrohden.backend.repository;

import com.douglasrohden.backend.model.ArtistImage;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ArtistImageRepository extends JpaRepository<ArtistImage, Long> {
    List<ArtistImage> findByArtistaId(Long artistaId);

    @Query("""
            select ai from ArtistImage ai
            where ai.id in (
                select min(ai2.id) from ArtistImage ai2
                where ai2.artista.id in :artistaIds
                group by ai2.artista.id
            )
            """)
    List<ArtistImage> findFirstImagesByArtistaIds(@Param("artistaIds") Collection<Long> artistaIds);

    Optional<ArtistImage> findByIdAndArtistaId(Long id, Long artistaId);

    void deleteByIdAndArtistaId(Long id, Long artistaId);
}
