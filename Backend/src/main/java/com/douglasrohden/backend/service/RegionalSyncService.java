package com.douglasrohden.backend.service;

import com.douglasrohden.backend.integration.regionais.IntegradorRegionalDto;
import com.douglasrohden.backend.integration.regionais.IntegradorRegionaisClient;
import com.douglasrohden.backend.model.Regional;
import com.douglasrohden.backend.repository.RegionalRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Slf4j
@Service
@RequiredArgsConstructor
public class RegionalSyncService {

    // Resultado da sincronização: quantos registros foram inseridos, inativados ou alterados
    public record SyncResult(int inserted, int inactivated, int changed) {}

    private final IntegradorRegionaisClient integradorRegionaisClient;
    private final RegionalRepository regionalRepository;

    /**
     * Sincroniza os dados das regionais entre o sistema externo e o banco local.
     * Regras do edital:
     * 1) Novo no endpoint → inserir na tabela local
     * 2) Não disponível no endpoint → inativar na tabela local
     * 3) Qualquer atributo alterado → inativar registro anterior e criar novo
     *
     * Complexidade: O(n+m) onde n=regionais remotas, m=regionais locais ativas
     */
    @Transactional
    public SyncResult sync() {
        // 1) Buscar do endpoint externo
        final List<IntegradorRegionalDto> remotas;
        try {
            remotas = integradorRegionaisClient.fetchRegionais();
        } catch (RestClientException erro) {
            log.error("Erro ao conectar com sistema de regionais", erro);
            throw new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "Sistema de regionais indisponível",
                erro
            );
        }

        // 2) Montar um mapa (externalId -> nome) com dados remotos válidos
        //    Observação: se o payload tiver "ativo=false", tratamos como indisponível (não entra no mapa).
        final Map<Integer, String> remotasMap = new HashMap<>();
        for (IntegradorRegionalDto dto : remotas) {
            if (Boolean.FALSE.equals(dto.ativo())) {
                continue;
            }
            Integer externalId = dto.resolvedId();
            String nome = norm(dto.nome());
            if (externalId == null || nome == null) {
                continue;
            }
            remotasMap.putIfAbsent(externalId, nome);
        }

        // 3) Carregar as regionais ativas locais (externalId -> Regional)
        final List<Regional> locaisAtivas = regionalRepository.findAllByAtivoTrue();
        final Map<Integer, Regional> locaisAtivasMap = new HashMap<>();
        for (Regional r : locaisAtivas) {
            if (r.getExternalId() != null) {
                locaisAtivasMap.putIfAbsent(r.getExternalId(), r);
            }
        }

        // 4) Aplicar regras do edital com O(n+m)
        int inserted = 0;
        int inactivated = 0;
        int changed = 0;
        final List<Regional> toSave = new ArrayList<>();

        // Regra 1 e 3: processar itens do remoto
        for (var entry : remotasMap.entrySet()) {
            Integer externalId = entry.getKey();
            String nomeRemoto = entry.getValue();
            Regional local = locaisAtivasMap.get(externalId);

            if (local == null) {
                toSave.add(new Regional(null, externalId, nomeRemoto, true));
                inserted++;
                continue;
            }

            if (!Objects.equals(local.getNome(), nomeRemoto)) {
                local.setAtivo(false);
                toSave.add(local);
                toSave.add(new Regional(null, externalId, nomeRemoto, true));
                changed++;
            }
        }

        // Regra 2: se está ativo localmente mas não existe no remoto, inativar
        for (Regional local : locaisAtivas) {
            Integer externalId = local.getExternalId();
            if (externalId != null && !remotasMap.containsKey(externalId)) {
                local.setAtivo(false);
                toSave.add(local);
                inactivated++;
            }
        }

        if (!toSave.isEmpty()) {
            regionalRepository.saveAll(toSave);
        }

        log.info(
            "Sincronização de regionais concluída: inseridos={}, inativados={}, alterados={}",
            inserted,
            inactivated,
            changed
        );
        return new SyncResult(inserted, inactivated, changed);
    }

    /**
     * Normaliza o nome: remove espaços extras e limita a 200 caracteres.
     */
    private static String norm(String nome) {
        if (nome == null) {
            return null;
        }
        String nomeSemEspacos = nome.trim();
        if (nomeSemEspacos.isEmpty()) {
            return null;
        }
        // Limita a 200 caracteres conforme especificação da tabela
        return nomeSemEspacos.length() > 200 ? nomeSemEspacos.substring(0, 200) : nomeSemEspacos;
    }
}

