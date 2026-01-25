package com.douglasrohden.backend.service;

import com.douglasrohden.backend.integration.regionais.IntegradorRegionalDto;
import com.douglasrohden.backend.integration.regionais.IntegradorRegionaisClient;
import com.douglasrohden.backend.model.Regional;
import com.douglasrohden.backend.repository.RegionalRepository;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.client.RestClientException;

@Slf4j
@Service
@RequiredArgsConstructor
public class RegionalSyncService {

    public record SyncResult(int inserted, int inactivated, int changed) {
    }

    private final IntegradorRegionaisClient integradorRegionaisClient;
    private final RegionalRepository regionalRepository;

    @Transactional
    public SyncResult sync() {
        final List<IntegradorRegionalDto> remote;
        try {
            remote = integradorRegionaisClient.fetchRegionais();
        } catch (RestClientException e) {
            // Fail-safe: não altera nada local se integrador estiver indisponível.
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Integrador de regionais indisponível", e);
        }

        Map<String, IntegradorRegionalDto> remoteByExternalId = new HashMap<>();
        for (IntegradorRegionalDto dto : remote) {
            String externalId = normalizeExternalId(dto);
            String nome = normalizeNome(dto.nome());
            if (externalId == null || nome == null) {
                continue;
            }
            remoteByExternalId.put(externalId, new IntegradorRegionalDto(externalId, dto.id(), nome, dto.ativo()));
        }

        List<Regional> localActive = regionalRepository.findAllActive();
        Map<String, Regional> localActiveByExternalId = localActive.stream()
                .filter(r -> r.getExternalId() != null)
                .collect(Collectors.toMap(
                        Regional::getExternalId,
                        r -> r,
                        (a, b) -> a
                ));

        LocalDateTime now = LocalDateTime.now();

        int inserted = 0;
        int changed = 0;
        int inactivated = 0;

        List<Regional> toInsert = new ArrayList<>();
        List<Regional> toUpdate = new ArrayList<>();

        // c) Para cada externalId remoto:
        for (Map.Entry<String, IntegradorRegionalDto> entry : remoteByExternalId.entrySet()) {
            String externalId = entry.getKey();
            IntegradorRegionalDto remoteRegional = entry.getValue();

            Regional local = localActiveByExternalId.get(externalId);
            if (local == null) {
                toInsert.add(newActiveRegional(externalId, remoteRegional.nome(), now));
                inserted++;
                continue;
            }

            if (hasRelevantChange(local, remoteRegional)) {
                // inativar atual
                local.setAtivo(false);
                local.setInactivatedAt(now);
                toUpdate.add(local);

                // inserir novo ativo
                toInsert.add(newActiveRegional(externalId, remoteRegional.nome(), now));
                changed++;
            }
        }

        // d) Para cada local ativo cujo externalId NÃO está no remoto:
        Set<String> remoteExternalIds = remoteByExternalId.keySet();
        for (Regional local : localActive) {
            String externalId = local.getExternalId();
            if (externalId == null) {
                continue;
            }
            if (!remoteExternalIds.contains(externalId)) {
                local.setAtivo(false);
                local.setInactivatedAt(now);
                toUpdate.add(local);
                inactivated++;
            }
        }

        if (!toUpdate.isEmpty()) {
            regionalRepository.saveAll(toUpdate);
        }
        if (!toInsert.isEmpty()) {
            regionalRepository.saveAll(toInsert);
        }

        log.info("Regionais sync concluído: inserted={}, inactivated={}, changed={}", inserted, inactivated, changed);
        return new SyncResult(inserted, inactivated, changed);
    }

    private static String normalizeExternalId(IntegradorRegionalDto dto) {
        String externalId = dto.resolvedExternalId();
        if (externalId == null) {
            return null;
        }
        String trimmed = externalId.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static String normalizeNome(String nome) {
        if (nome == null) {
            return null;
        }
        String trimmed = nome.trim();
        if (trimmed.isEmpty()) {
            return null;
        }
        return trimmed.length() > 200 ? trimmed.substring(0, 200) : trimmed;
    }

    private static boolean hasRelevantChange(Regional local, IntegradorRegionalDto remote) {
        // Campos relevantes para regra (3): nome (e outros, se existirem no futuro)
        return !Objects.equals(local.getNome(), remote.nome());
    }

    private static Regional newActiveRegional(String externalId, String nome, LocalDateTime now) {
        return Regional.builder()
                .externalId(externalId)
                .nome(nome)
                .ativo(true)
                .createdAt(now)
                .build();
    }
}
