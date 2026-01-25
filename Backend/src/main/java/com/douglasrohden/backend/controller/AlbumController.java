package com.douglasrohden.backend.controller;

import com.douglasrohden.backend.dto.AlbumWithArtistDTO;
import com.douglasrohden.backend.dto.CreateAlbumRequest;
import com.douglasrohden.backend.dto.UpdateAlbumRequest;
import com.douglasrohden.backend.model.Album;
import com.douglasrohden.backend.model.ArtistaTipo;
import com.douglasrohden.backend.repository.AlbumRepository;
import com.douglasrohden.backend.repository.AlbumImageRepository;
import com.douglasrohden.backend.service.AlbumService;
import com.douglasrohden.backend.service.AlbumImageStorageService;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controlador REST para gerenciar álbuns.
 * Este controlador recebe requisições HTTP e retorna respostas em formato JSON.
 */
@RestController
@RequestMapping("/v1/albuns") // Define a URL base: /v1/albuns
@RequiredArgsConstructor // Lombok: cria um construtor com os campos final automaticamente
public class AlbumController {
    // Repositório para acessar os dados de álbuns no banco de dados
    private final AlbumRepository albumRepository;
    // Serviço com regras de negócio para álbuns
    private final AlbumService albumService;
    private final AlbumImageStorageService albumImageStorageService;
    private final AlbumImageRepository albumImageRepository;

    /**
     * Endpoint GET para listar todos os álbuns com paginação.
     * URL: GET /v1/albuns?page=0&size=10
     * Retorna álbuns com informações do artista associado.
     */
    @io.swagger.v3.oas.annotations.Operation(summary = "Listar álbuns (paginated)", description = "Retorna página de álbuns. Paginação obrigatória.")
    @io.swagger.v3.oas.annotations.responses.ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Página retornada"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Parâmetros de paginação obrigatórios"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Não autorizado"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Erro interno")
    })
    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<Page<AlbumWithArtistDTO>> getAllAlbuns(
            @RequestParam(required = false) String titulo,
            @RequestParam(required = false) Integer ano,
            @RequestParam(required = false) String artistaNome,
            @RequestParam(required = false) ArtistaTipo artistaTipo,
            @RequestParam(required = false) ArtistaTipo apenasArtistaTipo,
            Pageable pageable) {

        // Valida se os parâmetros de paginação foram fornecidos corretamente
        if (pageable == null || !pageable.isPaged()) {
            return ResponseEntity.badRequest().build(); // Retorna erro 400 se inválido
        }

        org.springframework.data.jpa.domain.Specification<Album> spec = org.springframework.data.jpa.domain.Specification
                .where(null);

        if (titulo != null && !titulo.trim().isEmpty()) {
            spec = spec
                    .and((root, query, cb) -> cb.like(cb.lower(root.get("titulo")), "%" + titulo.toLowerCase() + "%"));
        }

        if (ano != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("ano"), ano));
        }

        if (artistaNome != null && !artistaNome.trim().isEmpty()) {
            spec = spec.and((root, query, cb) -> {
                jakarta.persistence.criteria.Join<Album, com.douglasrohden.backend.model.Artista> artistas = root
                        .join("artistas");
                return cb.like(cb.lower(artistas.get("nome")), "%" + artistaNome.toLowerCase() + "%");
            });
        }

        if (artistaTipo != null) {
            spec = spec.and((root, query, cb) -> {
                jakarta.persistence.criteria.Join<Album, com.douglasrohden.backend.model.Artista> artistas = root
                        .join("artistas");
                return cb.equal(artistas.get("tipo"), artistaTipo);
            });
        }

        if (apenasArtistaTipo != null) {
            spec = spec.and((root, query, cb) -> {
                // subquery que conta artistas do álbum cujo tipo é diferente do desejado
                jakarta.persistence.criteria.Subquery<Long> sub = query.subquery(Long.class);
                jakarta.persistence.criteria.Root<com.douglasrohden.backend.model.Artista> a = sub
                        .from(com.douglasrohden.backend.model.Artista.class);
                jakarta.persistence.criteria.Join<com.douglasrohden.backend.model.Artista, Album> ja = a.join("albuns");
                sub.select(cb.count(a));
                sub.where(cb.and(cb.equal(ja.get("id"), root.get("id")), cb.notEqual(a.get("tipo"), apenasArtistaTipo)));

                // subquery que conta artistas do álbum (garante que exista ao menos um artista)
                jakarta.persistence.criteria.Subquery<Long> sub2 = query.subquery(Long.class);
                jakarta.persistence.criteria.Root<com.douglasrohden.backend.model.Artista> a2 = sub2
                        .from(com.douglasrohden.backend.model.Artista.class);
                jakarta.persistence.criteria.Join<com.douglasrohden.backend.model.Artista, Album> ja2 = a2.join("albuns");
                sub2.select(cb.count(a2));
                sub2.where(cb.equal(ja2.get("id"), root.get("id")));

                return cb.and(cb.equal(sub, 0L), cb.greaterThan(sub2, 0L));
            });
        }

        // Passo 1: Busca os álbuns do banco de dados com paginação e filtros
        Page<Album> albumsPage = albumRepository.findAll(spec, pageable);

        // Passo 2: Converte cada álbum (entidade) em um DTO com informações do artista
        // e demais detalhes
        List<AlbumWithArtistDTO> dtos = converterParaDTOs(albumsPage.getContent());

        // Passo 3: Cria a página de DTOs com os mesmos dados de paginação
        Page<AlbumWithArtistDTO> dtoPage = new PageImpl<>(dtos, pageable, albumsPage.getTotalElements());

        // Retorna a página de DTOs com status 200 (OK)
        return ResponseEntity.ok(dtoPage);
    }

    /**
     * Converte uma lista de álbuns em uma lista de DTOs.
     * Este método percorre cada álbum e cria um DTO com informações do artista.
     */
    private List<AlbumWithArtistDTO> converterParaDTOs(List<Album> albums) {
        List<Long> albumIds = albums.stream().map(Album::getId).toList();
        Map<Long, String> capaUrlByAlbumId = new HashMap<>();

        if (!albumIds.isEmpty()) {
            albumImageRepository.findFirstCoversByAlbumIds(albumIds).forEach(img -> {
                Long albumId = img.getAlbum() != null ? img.getAlbum().getId() : null;
                if (albumId != null && img.getObjectKey() != null) {
                    capaUrlByAlbumId.put(albumId, albumImageStorageService.generatePresignedUrl(img.getObjectKey()));
                }
            });
        }

        List<AlbumWithArtistDTO> dtos = new ArrayList<>(albums.size());
        for (Album album : albums) {
            dtos.add(AlbumWithArtistDTO.fromAlbum(album, capaUrlByAlbumId.get(album.getId())));
        }
        return dtos;
    }

    /**
     * Endpoint POST para criar um novo álbum.
     * URL: POST /v1/albuns
     * Body: JSON com título, ano e URL da imagem
     */
    @io.swagger.v3.oas.annotations.Operation(summary = "Cadastrar álbum", description = "Cria um novo álbum.")
    @io.swagger.v3.oas.annotations.responses.ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Álbum criado"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Não autorizado"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Erro interno")
    })
    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody CreateAlbumRequest request) {
        // Verifica se é para criar álbuns individuais para cada artista (Batch)
        if (Boolean.TRUE.equals(request.individual())) {
            List<Album> albums = albumService.createBatchIndividual(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(albums);
        }

        // Cria uma nova instância de álbum
        Album album = new Album();

        // Define os atributos do álbum com os dados recebidos na requisição
        album.setTitulo(request.titulo());
        album.setAno(request.ano());

        // Chama o serviço para salvar o álbum e fazer as associações de forma
        // transacional
        Album savedAlbum = albumService.createWithArtistas(album, request.artistaIds());

        // Retorna o álbum criado com status 201 (CREATED)
        return ResponseEntity.status(HttpStatus.CREATED).body(savedAlbum);
    }

    @io.swagger.v3.oas.annotations.Operation(summary = "Atualizar álbum", description = "Atualiza informações de um álbum existente.")
    @io.swagger.v3.oas.annotations.responses.ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Álbum atualizado"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Não autorizado"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Álbum não encontrado"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Erro interno")
    })
    @PutMapping("/{id}")
    public ResponseEntity<Album> update(@PathVariable Long id, @Valid @RequestBody UpdateAlbumRequest request) {
        return albumService.update(id, request)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
