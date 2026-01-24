package com.douglasrohden.backend.repository;

import com.douglasrohden.backend.model.AlbumImage;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AlbumImageRepository extends JpaRepository<AlbumImage, Long> {
    List<AlbumImage> findByAlbumId(Long albumId);

    Optional<AlbumImage> findByIdAndAlbumId(Long id, Long albumId);

    void deleteByIdAndAlbumId(Long id, Long albumId);
}
