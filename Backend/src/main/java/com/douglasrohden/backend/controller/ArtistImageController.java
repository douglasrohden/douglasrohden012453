package com.douglasrohden.backend.controller;

import com.douglasrohden.backend.dto.ArtistImageResponse;
import com.douglasrohden.backend.service.ArtistImageStorageService;
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
@RequestMapping("/v1/artistas/{artistaId}/imagens")
@RequiredArgsConstructor
@Tag(name = "Imagens de Artista")
@SecurityRequirement(name = "bearerAuth")
public class ArtistImageController {

    private final ArtistImageStorageService storageService;

    @Operation(summary = "Upload de imagens do artista", description = "Recebe um ou mais arquivos de imagem e salva no MinIO.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Imagens salvas", content = @Content(array = @ArraySchema(schema = @Schema(implementation = ArtistImageResponse.class)))),
            @ApiResponse(responseCode = "400", description = "Requisição inválida", content = @Content),
            @ApiResponse(responseCode = "401", description = "Não autorizado", content = @Content),
            @ApiResponse(responseCode = "403", description = "Acesso negado", content = @Content),
            @ApiResponse(responseCode = "404", description = "Artista não encontrado", content = @Content),
            @ApiResponse(responseCode = "429", description = "Rate limit excedido", content = @Content),
            @ApiResponse(responseCode = "500", description = "Erro interno", content = @Content)
    })
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public List<ArtistImageResponse> upload(
            @PathVariable Long artistaId,
            @RequestPart("files") MultipartFile[] files) {
        return storageService.uploadImages(artistaId, files);
    }

    @Operation(summary = "Listar imagens do artista", description = "Retorna metadados e URLs pré-assinadas com expiração configurável (30min).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lista de imagens", content = @Content(array = @ArraySchema(schema = @Schema(implementation = ArtistImageResponse.class)))),
            @ApiResponse(responseCode = "401", description = "Não autorizado", content = @Content),
            @ApiResponse(responseCode = "403", description = "Acesso negado", content = @Content),
            @ApiResponse(responseCode = "404", description = "Artista não encontrado", content = @Content),
            @ApiResponse(responseCode = "429", description = "Rate limit excedido", content = @Content),
            @ApiResponse(responseCode = "500", description = "Erro interno", content = @Content)
    })
    @GetMapping
    public List<ArtistImageResponse> list(@PathVariable Long artistaId) {
        return storageService.listImages(artistaId);
    }

    @Operation(summary = "Remover imagem", description = "Remove metadados e objeto do MinIO.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Imagem removida", content = @Content),
            @ApiResponse(responseCode = "401", description = "Não autorizado", content = @Content),
            @ApiResponse(responseCode = "403", description = "Acesso negado", content = @Content),
            @ApiResponse(responseCode = "404", description = "Imagem não encontrada", content = @Content),
            @ApiResponse(responseCode = "429", description = "Rate limit excedido", content = @Content),
            @ApiResponse(responseCode = "500", description = "Erro interno", content = @Content)
    })
    @DeleteMapping("/{imageId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long artistaId, @PathVariable Long imageId) {
        storageService.deleteImage(artistaId, imageId);
    }
}
