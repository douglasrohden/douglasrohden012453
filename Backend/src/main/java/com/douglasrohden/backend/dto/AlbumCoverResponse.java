package com.douglasrohden.backend.dto;

import com.douglasrohden.backend.model.AlbumCover;
import java.time.Instant;

public record AlbumCoverResponse(
        Long id,
        String objectKey,
        String url,
        Instant expiresAt,
        String contentType,
        Long sizeBytes) {

    public static AlbumCoverResponse from(AlbumCover cover, String url, Instant expiresAt) {
        return new AlbumCoverResponse(
                cover.getId(),
                cover.getObjectKey(),
                url,
                expiresAt,
                cover.getContentType(),
                cover.getSizeBytes());
    }
}
