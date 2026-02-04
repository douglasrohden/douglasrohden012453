package com.douglasrohden.backend.repository;

import com.douglasrohden.backend.model.AlbumImage;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface AlbumImageRepository extends JpaRepository<AlbumImage, Long> {
    List<AlbumImage> findByAlbumId(Long albumId);

    @Query("""
            select ai from AlbumImage ai
            where ai.id in (
                select max(ai2.id) from AlbumImage ai2
                where ai2.album.id in :albumIds
                group by ai2.album.id
            )
            """)
    List<AlbumImage> findFirstCoversByAlbumIds(@Param("albumIds") Collection<Long> albumIds);

    Optional<AlbumImage> findByIdAndAlbumId(Long id, Long albumId);

    void deleteByIdAndAlbumId(Long id, Long albumId);
}
