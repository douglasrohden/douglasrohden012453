package com.douglasrohden.backend.repository;

import com.douglasrohden.backend.model.Regional;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RegionalRepository extends JpaRepository<Regional, Integer> {

    List<Regional> findAllByAtivoTrue();
}
