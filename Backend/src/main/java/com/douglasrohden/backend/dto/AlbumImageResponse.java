package com.douglasrohden.backend.dto;

import com.douglasrohden.backend.model.AlbumImage;
import java.time.Instant;

public record AlbumImageResponse(
        Long id,
        String objectKey,
        String url,
        Instant expiresAt,
        String contentType,
        Long sizeBytes) {

    public static AlbumImageResponse from(AlbumImage image, String url, Instant expiresAt) {
        return new AlbumImageResponse(
                image.getId(),
                image.getObjectKey(),
                url,
                expiresAt,
                image.getContentType(),
                image.getSizeBytes());
    }
}
