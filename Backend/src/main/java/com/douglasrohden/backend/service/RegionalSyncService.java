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
import java.util.*;
import java.util.stream.Collectors;

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
        // 1. Buscar dados do sistema externo (endpoint da Polícia Civil)
        List<IntegradorRegionalDto> dadosRemotos = buscarDadosDoSistemaExterno();

        // 2. Filtrar e organizar dados remotos válidos
        Map<Integer, String> mapaRegionaisRemotas = criarMapaDeRegionaisRemotas(dadosRemotos);

        // 3. Carregar regionais ativas do banco local
        Map<Integer, Regional> mapaRegionaisLocaisAtivas = carregarRegionaisLocaisAtivas();

        // 4. Preparar contadores e lista de alterações
        ContadoresSincronizacao contadores = new ContadoresSincronizacao();
        List<Regional> registrosParaSalvar = new ArrayList<>();

        // 5. Processar regionais remotas (regras 1 e 3)
        processarRegionaisRemotas(mapaRegionaisRemotas, mapaRegionaisLocaisAtivas, contadores, registrosParaSalvar);

        // 6. Processar regionais locais ausentes no remoto (regra 2)
        processarRegionaisLocaisAusentes(mapaRegionaisRemotas, mapaRegionaisLocaisAtivas, contadores, registrosParaSalvar);

        // 7. Salvar todas as alterações no banco
        salvarAlteracoesNoBanco(registrosParaSalvar);

        // 8. Log e retorno do resultado
        return registrarResultado(contadores);
    }

    /**
     * Busca os dados das regionais do sistema externo.
     * Se falhar, lança erro 503 (serviço indisponível) - comportamento fail-safe.
     */
    private List<IntegradorRegionalDto> buscarDadosDoSistemaExterno() {
        try {
            return integradorRegionaisClient.fetchRegionais();
        } catch (RestClientException erro) {
            log.error("Erro ao conectar com sistema de regionais da Polícia Civil", erro);
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                "Sistema de regionais da Polícia Civil indisponível", erro);
        }
    }

    /**
     * Cria um mapa das regionais remotas válidas.
     * Filtra apenas regionais ativas com ID e nome válidos.
     */
    private Map<Integer, String> criarMapaDeRegionaisRemotas(List<IntegradorRegionalDto> dadosRemotos) {
        return dadosRemotos.stream()
            .filter(regional -> !Boolean.FALSE.equals(regional.ativo())) // Apenas ativas
            .filter(regional -> regional.resolvedId() != null)          // Com ID válido
            .filter(regional -> norm(regional.nome()) != null)          // Com nome válido
            .collect(Collectors.toMap(
                IntegradorRegionalDto::resolvedId,    // Chave: ID externo
                regional -> norm(regional.nome()),    // Valor: nome normalizado
                (nome1, nome2) -> nome1               // Em caso de duplicata, mantém primeiro
            ));
    }

    /**
     * Carrega todas as regionais ativas do banco local em um mapa.
     */
    private Map<Integer, Regional> carregarRegionaisLocaisAtivas() {
        return regionalRepository.findAllByAtivoTrue().stream()
            .collect(Collectors.toMap(
                Regional::getExternalId,  // Chave: ID externo
                regional -> regional,     // Valor: objeto Regional
                (r1, r2) -> r1            // Em caso de duplicata, mantém primeiro
            ));
    }

    /**
     * Processa cada regional remota aplicando as regras 1 e 3.
     */
    private void processarRegionaisRemotas(
            Map<Integer, String> remotas,
            Map<Integer, Regional> locaisAtivas,
            ContadoresSincronizacao contadores,
            List<Regional> paraSalvar) {

        for (var entrada : remotas.entrySet()) {
            Integer idExterno = entrada.getKey();
            String nomeRemoto = entrada.getValue();
            Regional regionalLocal = locaisAtivas.get(idExterno);

            if (regionalLocal == null) {
                // Regra 1: Novo no endpoint → inserir
                Regional novaRegional = new Regional(null, idExterno, nomeRemoto, true);
                paraSalvar.add(novaRegional);
                contadores.inseridos++;
            } else if (!Objects.equals(regionalLocal.getNome(), nomeRemoto)) {
                // Regra 3: Nome mudou → inativar antigo + criar novo
                regionalLocal.setAtivo(false);
                paraSalvar.add(regionalLocal);

                Regional novaVersao = new Regional(null, idExterno, nomeRemoto, true);
                paraSalvar.add(novaVersao);
                contadores.alterados++;
            }
        }
    }

    /**
     * Processa regionais locais ativas que não existem mais no remoto (regra 2).
     */
    private void processarRegionaisLocaisAusentes(
            Map<Integer, String> remotas,
            Map<Integer, Regional> locaisAtivas,
            ContadoresSincronizacao contadores,
            List<Regional> paraSalvar) {

        for (Regional regionalLocal : locaisAtivas.values()) {
            if (!remotas.containsKey(regionalLocal.getExternalId())) {
                // Regra 2: Não disponível no endpoint → inativar
                regionalLocal.setAtivo(false);
                paraSalvar.add(regionalLocal);
                contadores.inativados++;
            }
        }
    }

    /**
     * Salva todas as alterações no banco de dados em uma única operação.
     */
    private void salvarAlteracoesNoBanco(List<Regional> registrosParaSalvar) {
        if (!registrosParaSalvar.isEmpty()) {
            regionalRepository.saveAll(registrosParaSalvar);
        }
    }

    /**
     * Registra o resultado da sincronização no log e retorna o objeto de resultado.
     */
    private SyncResult registrarResultado(ContadoresSincronizacao contadores) {
        log.info("Sincronização de regionais concluída: inseridos={}, inativados={}, alterados={}",
            contadores.inseridos, contadores.inativados, contadores.alterados);

        return new SyncResult(contadores.inseridos, contadores.inativados, contadores.alterados);
    }

    /**
     * Classe auxiliar para organizar os contadores da sincronização.
     */
    private static class ContadoresSincronizacao {
        int inseridos = 0;
        int inativados = 0;
        int alterados = 0;
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

