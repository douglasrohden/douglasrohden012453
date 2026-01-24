package com.douglasrohden.backend.repository;

import com.douglasrohden.backend.model.ArtistImage;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ArtistImageRepository extends JpaRepository<ArtistImage, Long> {
    List<ArtistImage> findByArtistaId(Long artistaId);
    Optional<ArtistImage> findByIdAndArtistaId(Long id, Long artistaId);
    void deleteByIdAndArtistaId(Long id, Long artistaId);
}
