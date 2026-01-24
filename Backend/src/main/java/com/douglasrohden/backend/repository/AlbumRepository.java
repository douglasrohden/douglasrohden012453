package com.douglasrohden.backend.repository;

import com.douglasrohden.backend.model.Album;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AlbumRepository
        extends JpaRepository<Album, Long>, org.springframework.data.jpa.repository.JpaSpecificationExecutor<Album> {
}
