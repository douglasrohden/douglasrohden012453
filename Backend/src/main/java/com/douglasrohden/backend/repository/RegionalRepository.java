package com.douglasrohden.backend.repository;

import com.douglasrohden.backend.model.Regional;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RegionalRepository extends JpaRepository<Regional, Long> {

    List<Regional> findAllByAtivoTrue();

    Optional<Regional> findByExternalIdAndAtivoTrue(Integer externalId);

    List<Regional> findAllByExternalId(Integer externalId);
}
