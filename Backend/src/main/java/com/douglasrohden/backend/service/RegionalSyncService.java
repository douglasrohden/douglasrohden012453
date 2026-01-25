package com.douglasrohden.backend.service;

import com.douglasrohden.backend.integration.regionais.IntegradorRegionalDto;
import com.douglasrohden.backend.integration.regionais.IntegradorRegionaisClient;
import com.douglasrohden.backend.model.Regional;
import com.douglasrohden.backend.repository.RegionalRepository;
import java.util.ArrayList;
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
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

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
            // Fail-safe: nao altera nada local se integrador estiver indisponivel.
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Integrador de regionais indisponivel", e);
        }

        Map<Integer, String> remoteById = remote.stream()
                .filter(dto -> !Boolean.FALSE.equals(dto.ativo()))
                .map(dto -> Map.entry(dto.resolvedId(), normNome(dto.nome())))
                .filter(e -> e.getKey() != null && e.getValue() != null)
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (a, b) -> a));

        Set<Integer> remoteIds = remoteById.keySet();

        List<Regional> localActive = regionalRepository.findAllByAtivoTrue();
        Map<Integer, Regional> localActiveById = localActive.stream()
                .filter(r -> r.getId() != null)
                .collect(Collectors.toMap(Regional::getId, r -> r, (a, b) -> a));

        // Carrega existentes (ativos/inativos) para evitar INSERT com PK ja existente
        Map<Integer, Regional> existingById = regionalRepository.findAllById(remoteIds).stream()
                .filter(r -> r.getId() != null)
                .collect(Collectors.toMap(Regional::getId, r -> r, (a, b) -> a));

        int inserted = 0;
        int changed = 0;
        int inactivated = 0;

        List<Regional> toPersist = new ArrayList<>();

        // 1) Novo no endpoint e 3) Mudou atributo
        for (Map.Entry<Integer, String> entry : remoteById.entrySet()) {
            Integer id = entry.getKey();
            String remoteNome = entry.getValue();

            Regional existing = existingById.get(id);
            if (existing == null) {
                toPersist.add(new Regional(id, remoteNome, true));
                inserted++;
                continue;
            }

            boolean modified = false;

            if (!existing.isAtivo()) {
                existing.setAtivo(true);
                modified = true;
            }

            if (!Objects.equals(existing.getNome(), remoteNome)) {
                existing.setNome(remoteNome);
                modified = true;
                changed++;
            }

            if (modified) {
                toPersist.add(existing);
            }
        }

        // 2) Nao disponivel no endpoint -> inativar
        for (Regional local : localActiveById.values()) {
            if (!remoteIds.contains(local.getId())) {
                local.setAtivo(false);
                toPersist.add(local);
                inactivated++;
            }
        }

        if (!toPersist.isEmpty()) {
            regionalRepository.saveAll(toPersist);
        }

        log.info("Regionais sync concluido: inserted={}, inactivated={}, changed={}", inserted, inactivated, changed);
        return new SyncResult(inserted, inactivated, changed);
    }

    private static String normNome(String nome) {
        if (nome == null) {
            return null;
        }
        String trimmed = nome.trim();
        if (trimmed.isEmpty()) {
            return null;
        }
        return trimmed.length() > 200 ? trimmed.substring(0, 200) : trimmed;
    }
}

