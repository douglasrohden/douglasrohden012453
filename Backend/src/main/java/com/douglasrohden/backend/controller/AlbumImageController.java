package com.douglasrohden.backend.controller;

import com.douglasrohden.backend.dto.AlbumImageResponse;
import com.douglasrohden.backend.service.AlbumImageStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/v1/albuns/{albumId}/capas")
@RequiredArgsConstructor
@Tag(name = "Capas de Álbum")
@SecurityRequirement(name = "bearerAuth")
public class AlbumImageController {

    private final AlbumImageStorageService storageService;

    @Operation(summary = "Upload de capas do álbum", description = "Recebe um ou mais arquivos de imagem e salva no MinIO.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Capas salvas", content = @Content(array = @ArraySchema(schema = @Schema(implementation = AlbumImageResponse.class)))),
            @ApiResponse(responseCode = "400", description = "Requisição inválida", content = @Content),
            @ApiResponse(responseCode = "401", description = "Não autorizado", content = @Content),
            @ApiResponse(responseCode = "403", description = "Acesso negado", content = @Content),
            @ApiResponse(responseCode = "404", description = "Álbum não encontrado", content = @Content),
            @ApiResponse(responseCode = "429", description = "Rate limit excedido", content = @Content),
            @ApiResponse(responseCode = "500", description = "Erro interno", content = @Content)
    })
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public List<AlbumImageResponse> upload(
            @PathVariable Long albumId,
            @RequestPart("files") MultipartFile[] files) {
        return storageService.uploadCovers(albumId, files);
    }

    @Operation(summary = "Listar capas do álbum", description = "Retorna metadados e URLs pré-assinadas com expiração configurável (30min).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lista de capas", content = @Content(array = @ArraySchema(schema = @Schema(implementation = AlbumImageResponse.class)))),
            @ApiResponse(responseCode = "401", description = "Não autorizado", content = @Content),
            @ApiResponse(responseCode = "403", description = "Acesso negado", content = @Content),
            @ApiResponse(responseCode = "404", description = "Álbum não encontrado", content = @Content),
            @ApiResponse(responseCode = "429", description = "Rate limit excedido", content = @Content),
            @ApiResponse(responseCode = "500", description = "Erro interno", content = @Content)
    })
    @GetMapping
    public List<AlbumImageResponse> list(@PathVariable Long albumId) {
        return storageService.listCovers(albumId);
    }

    @Operation(summary = "Remover capa", description = "Remove metadados e objeto do MinIO.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Capa removida", content = @Content),
            @ApiResponse(responseCode = "401", description = "Não autorizado", content = @Content),
            @ApiResponse(responseCode = "403", description = "Acesso negado", content = @Content),
            @ApiResponse(responseCode = "404", description = "Capa não encontrada", content = @Content),
            @ApiResponse(responseCode = "429", description = "Rate limit excedido", content = @Content),
            @ApiResponse(responseCode = "500", description = "Erro interno", content = @Content)
    })
    @DeleteMapping("/{coverId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long albumId, @PathVariable Long coverId) {
        storageService.deleteCover(albumId, coverId);
    }
}
