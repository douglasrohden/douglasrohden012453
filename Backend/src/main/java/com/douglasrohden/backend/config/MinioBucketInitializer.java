package com.douglasrohden.backend.config;

import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class MinioBucketInitializer {

    private final MinioClient minioClient;
    private final MinioProperties properties;

    @Bean
    ApplicationRunner ensureBucketOnStartup() {
        return args -> {
            try {
                boolean exists = minioClient.bucketExists(BucketExistsArgs.builder()
                        .bucket(properties.getBucket())
                        .build());
                if (!exists) {
                    minioClient.makeBucket(MakeBucketArgs.builder()
                            .bucket(properties.getBucket())
                            .build());
                    log.info("MinIO bucket created: {}", properties.getBucket());
                } else {
                    log.info("MinIO bucket already exists: {}", properties.getBucket());
                }
            } catch (Exception e) {
                log.error("Failed to ensure MinIO bucket {}", properties.getBucket(), e);
                // Let the app start but surface the issue; uploads will fail until fixed.
            }
        };
    }
}
