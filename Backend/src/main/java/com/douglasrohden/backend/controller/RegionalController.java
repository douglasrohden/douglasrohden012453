package com.douglasrohden.backend.controller;

import com.douglasrohden.backend.service.RegionalSyncService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/regionais")
@RequiredArgsConstructor
public class RegionalController {

    private final RegionalSyncService regionalSyncService;

    @Operation(
            summary = "Sincronizar regionais",
            description = "Sincroniza a tabela local `regional` via GET https://integrador-argus-api.geia.vip/v1/regionais."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Sincronizacao executada"),
            @ApiResponse(responseCode = "401", description = "Nao autenticado"),
            @ApiResponse(responseCode = "503", description = "Integrador indisponivel")
    })
    @PostMapping("/sync")
    public ResponseEntity<RegionalSyncService.SyncResult> sync() {
        return ResponseEntity.ok(regionalSyncService.sync());
    }
}

