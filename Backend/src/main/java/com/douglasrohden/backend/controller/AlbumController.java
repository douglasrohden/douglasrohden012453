package com.douglasrohden.backend.controller;

import com.douglasrohden.backend.model.Album;
import com.douglasrohden.backend.repository.AlbumRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/albuns")
public class AlbumController {
    @Autowired
    private AlbumRepository albumRepository;

    @io.swagger.v3.oas.annotations.Operation(summary = "Listar álbuns (paginated)", description = "Retorna página de álbuns. Paginação obrigatória.")
    @io.swagger.v3.oas.annotations.responses.ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Página retornada"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Parâmetros de paginação obrigatórios"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Não autorizado"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Erro interno")
    })
    @GetMapping
    public ResponseEntity<Page<Album>> getAllAlbuns(Pageable pageable) {
        if (pageable == null || !pageable.isPaged()) {
            return ResponseEntity.badRequest().build();
        }
        Page<Album> page = albumRepository.findAll(pageable);
        return ResponseEntity.ok(page);
    }
}
