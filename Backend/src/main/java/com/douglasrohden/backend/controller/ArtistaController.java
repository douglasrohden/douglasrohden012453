package com.douglasrohden.backend.controller;

import com.douglasrohden.backend.model.Artista;
import com.douglasrohden.backend.dto.ArtistaDto;
import com.douglasrohden.backend.dto.ArtistaRequest;
import com.douglasrohden.backend.dto.CreateAlbumRequest;
import com.douglasrohden.backend.service.ArtistaService;
import com.douglasrohden.backend.model.ArtistaTipo;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/v1/artistas")
@RequiredArgsConstructor
public class ArtistaController {

    private final ArtistaService service;

    @GetMapping
    public ResponseEntity<Page<ArtistaDto>> list(
            @RequestParam(required = false, name = "q") String q,
            @RequestParam(required = false, name = "tipo") String tipo,
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) String dir,
            Pageable pageable) {
        if (sort != null && dir != null) {
            Sort s = Sort.by("asc".equalsIgnoreCase(dir) ? Sort.Direction.ASC : Sort.Direction.DESC, sort);
            pageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), s);
        }
        return ResponseEntity.ok(service.search(q, tipo, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Artista> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<Artista> create(@Valid @RequestBody ArtistaRequest request) {
        Artista artista = new Artista();
        artista.setNome(request.getNome());
        artista.setGenero(request.getGenero());
        artista.setImageUrl(request.getImageUrl());
        if (request.getTipo() != null) {
            try {
                artista.setTipo(ArtistaTipo.valueOf(request.getTipo()));
            } catch (IllegalArgumentException e) {
                // Ignore invalid type, service defaults to CANTOR if null
            }
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(artista));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Artista> update(@PathVariable Long id, @Valid @RequestBody ArtistaRequest request) {
        Artista artista = new Artista();
        artista.setNome(request.getNome());
        artista.setGenero(request.getGenero());
        artista.setImageUrl(request.getImageUrl());
        if (request.getTipo() != null) {
            try {
                artista.setTipo(ArtistaTipo.valueOf(request.getTipo()));
            } catch (IllegalArgumentException e) {
                // Ignore invalid type
            }
        }
        return ResponseEntity.ok(service.update(id, artista));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/albuns")
    public ResponseEntity<Artista> addAlbum(@PathVariable Long id, @Valid @RequestBody CreateAlbumRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.addAlbum(id, request));
    }
}
