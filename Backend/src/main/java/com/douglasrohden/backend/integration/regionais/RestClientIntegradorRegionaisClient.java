package com.douglasrohden.backend.integration.regionais;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Slf4j
@Component
public class RestClientIntegradorRegionaisClient implements IntegradorRegionaisClient {

    private final RestClient restClient;

    public RestClientIntegradorRegionaisClient(
            @Value("${integrador.regionais.url:https://integrador-argus-api.geia.vip}") String baseUrl,
            @Value("${integrador.regionais.timeout.connect:3s}") Duration connectTimeout,
            @Value("${integrador.regionais.timeout.read:5s}") Duration readTimeout
    ) {
        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(connectTimeout)
                .build();

        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(readTimeout);

        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(requestFactory)
                .build();
    }

    @Override
    public List<IntegradorRegionalDto> fetchRegionais() {
        try {
            // Endpoint externo: GET /v1/regionais
            return restClient.get()
                    .uri("/v1/regionais")
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .body(new org.springframework.core.ParameterizedTypeReference<List<IntegradorRegionalDto>>() {
                    });
        } catch (RestClientException e) {
            log.error("Erro ao consultar integrador de regionais", e);
            throw e;
        }
    }
}
