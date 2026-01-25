package com.douglasrohden.backend.controller;

import com.douglasrohden.backend.model.Regional;
import com.douglasrohden.backend.repository.RegionalRepository;
import com.douglasrohden.backend.service.RegionalSyncService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/v1/regionais")
@RequiredArgsConstructor
public class RegionalController {

    private final RegionalSyncService regionalSyncService;
    private final RegionalRepository regionalRepository;

    @Operation(summary = "Sincronizar regionais com endpoint externo")
    @PostMapping("/sync")
    public RegionalSyncService.SyncResult sync() { return regionalSyncService.sync(); }

    @Operation(summary = "Listar todas as regionais")
    @GetMapping
    public List<Regional> findAll() { return regionalRepository.findAll(); }
}
