package com.douglasrohden.backend.config;

import java.util.ArrayList;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;

@Component
@ConfigurationProperties(prefix = "minio")
public class MinioProperties {

    private String endpoint;
    private String accessKey;
    private String secretKey;
    private String bucket = "album-covers";
    private String region;
    private String externalEndpoint; // URL externa visível para o usuário (ex: http://localhost:9000)
    private Integer presignExpirationMinutes = 30;

    public void setExternalEndpoint(String externalEndpoint) {
        this.externalEndpoint = externalEndpoint;
    }

    public String getExternalEndpoint() {
        return externalEndpoint;
    }

    private Long maxFileSizeBytes = 5_242_880L; // default 5 MB
    private List<String> allowedContentTypes = new ArrayList<>();

    public String getEndpoint() {
        return endpoint;
    }

    public void setEndpoint(String endpoint) {
        this.endpoint = endpoint;
    }

    public String getAccessKey() {
        return accessKey;
    }

    public void setAccessKey(String accessKey) {
        this.accessKey = accessKey;
    }

    public String getSecretKey() {
        return secretKey;
    }

    public void setSecretKey(String secretKey) {
        this.secretKey = secretKey;
    }

    public String getBucket() {
        return bucket;
    }

    public void setBucket(String bucket) {
        this.bucket = bucket;
    }

    public String getRegion() {
        return region;
    }

    public void setRegion(String region) {
        this.region = region;
    }

    public Integer getPresignExpirationMinutes() {
        return presignExpirationMinutes;
    }

    public void setPresignExpirationMinutes(Integer presignExpirationMinutes) {
        this.presignExpirationMinutes = presignExpirationMinutes;
    }

    public Long getMaxFileSizeBytes() {
        return maxFileSizeBytes;
    }

    public void setMaxFileSizeBytes(Long maxFileSizeBytes) {
        this.maxFileSizeBytes = maxFileSizeBytes;
    }

    public List<String> getAllowedContentTypes() {
        if (CollectionUtils.isEmpty(allowedContentTypes)) {
            return List.of("image/jpeg", "image/png", "image/webp", "image/gif");
        }
        return allowedContentTypes;
    }

    public void setAllowedContentTypes(List<String> allowedContentTypes) {
        this.allowedContentTypes = allowedContentTypes;
    }
}
