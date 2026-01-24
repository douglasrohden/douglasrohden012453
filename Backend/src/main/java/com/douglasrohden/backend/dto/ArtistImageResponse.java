package com.douglasrohden.backend.dto;

import com.douglasrohden.backend.model.ArtistImage;
import java.time.Instant;

public record ArtistImageResponse(
        Long id,
        String objectKey,
        String url,
        Instant expiresAt,
        String contentType,
        Long sizeBytes) {

    public static ArtistImageResponse from(ArtistImage image, String url, Instant expiresAt) {
        return new ArtistImageResponse(
                image.getId(),
                image.getObjectKey(),
                url,
                expiresAt,
                image.getContentType(),
                image.getSizeBytes());
    }
}
