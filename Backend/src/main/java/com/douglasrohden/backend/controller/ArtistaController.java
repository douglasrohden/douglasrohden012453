package com.douglasrohden.backend.controller;

import com.douglasrohden.backend.dto.AlbumRequest;
import com.douglasrohden.backend.dto.ArtistaDto;
import com.douglasrohden.backend.dto.ArtistaRequest;
import com.douglasrohden.backend.model.Artista;
import com.douglasrohden.backend.service.ArtistaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/artistas")
@RequiredArgsConstructor
public class ArtistaController {

    private final ArtistaService service;

    @GetMapping
    public ResponseEntity<Page<ArtistaDto>> list(
            @RequestParam(required = false, name = "q") String q,
            @RequestParam(required = false) String tipo,
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) String dir,
            Pageable pageable) {
        return ResponseEntity.ok(service.search(q, tipo, sort, dir, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Artista> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<Artista> create(@Valid @RequestBody ArtistaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.createWithAlbums(request.toEntity(), request.getAlbumIds()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Artista> update(@PathVariable Long id, @Valid @RequestBody ArtistaRequest request) {
        return ResponseEntity.ok(service.update(id, request.toEntity()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/albuns")
    public ResponseEntity<Artista> addAlbum(@PathVariable Long id, @Valid @RequestBody AlbumRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.addAlbum(id, request));
    }
}
