package com.douglasrohden.backend.controller;

import com.douglasrohden.backend.model.Artista;
import com.douglasrohden.backend.service.ArtistaService;
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
    public ResponseEntity<Page<Artista>> list(
            @RequestParam(required = false) String search,
            Pageable pageable) {
        if (search != null && !search.isBlank()) {
            return ResponseEntity.ok(service.searchByName(search, pageable));
        }
        return ResponseEntity.ok(service.findAll(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Artista> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<Artista> create(@RequestBody Artista artista) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(artista));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Artista> update(@PathVariable Long id, @RequestBody Artista artista) {
        return ResponseEntity.ok(service.update(id, artista));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
