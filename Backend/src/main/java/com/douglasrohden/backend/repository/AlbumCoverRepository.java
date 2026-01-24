package com.douglasrohden.backend.repository;

import com.douglasrohden.backend.model.AlbumCover;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AlbumCoverRepository extends JpaRepository<AlbumCover, Long> {
    List<AlbumCover> findByAlbumId(Long albumId);
    Optional<AlbumCover> findByIdAndAlbumId(Long id, Long albumId);
    void deleteByIdAndAlbumId(Long id, Long albumId);
}
