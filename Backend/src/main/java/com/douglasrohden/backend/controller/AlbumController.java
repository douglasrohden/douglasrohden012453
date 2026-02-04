package com.douglasrohden.backend.controller;

import com.douglasrohden.backend.dto.AlbumRequest;
import com.douglasrohden.backend.dto.AlbumWithArtistDTO;
import com.douglasrohden.backend.model.Album;
import com.douglasrohden.backend.model.ArtistaTipo;
import com.douglasrohden.backend.service.AlbumService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/v1/albuns")
@RequiredArgsConstructor
public class AlbumController {

    private final AlbumService albumService;

    @GetMapping
    public ResponseEntity<Page<AlbumWithArtistDTO>> list(
            @RequestParam(required = false) String titulo,
            @RequestParam(required = false) Integer ano,
            @RequestParam(required = false) String artistaNome,
            @RequestParam(required = false) ArtistaTipo artistaTipo,
            @RequestParam(required = false) ArtistaTipo apenasArtistaTipo,
            Pageable pageable) {
        if (pageable == null || !pageable.isPaged()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(albumService.search(titulo, ano, artistaNome, artistaTipo, apenasArtistaTipo, pageable));
    }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody AlbumRequest request) {
        if (Boolean.TRUE.equals(request.individual())) {
            List<Album> albums = albumService.createBatch(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(albums);
        }
        Album saved = albumService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Album> update(@PathVariable Long id, @Valid @RequestBody AlbumRequest request) {
        return albumService.update(id, request)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        albumService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
