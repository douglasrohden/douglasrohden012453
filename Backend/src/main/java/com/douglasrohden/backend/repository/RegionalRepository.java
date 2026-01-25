package com.douglasrohden.backend.repository;

import com.douglasrohden.backend.model.Regional;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface RegionalRepository extends JpaRepository<Regional, Long> {

    Optional<Regional> findFirstByExternalIdAndAtivoTrue(String externalId);

    @Query("select r from Regional r where r.ativo = true")
    List<Regional> findAllActive();
}
