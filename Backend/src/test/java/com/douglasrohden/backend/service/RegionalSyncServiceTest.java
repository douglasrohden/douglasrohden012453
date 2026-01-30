package com.douglasrohden.backend.service;

import com.douglasrohden.backend.integration.regionais.IntegradorRegionalDto;
import com.douglasrohden.backend.integration.regionais.IntegradorRegionaisClient;
import com.douglasrohden.backend.model.Regional;
import com.douglasrohden.backend.repository.RegionalRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestClientException;

import java.util.List;
import java.util.ArrayList;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.*;

// AUTO-GENERATED TEST - you can customize and remove this marker if you keep the test
@ExtendWith(MockitoExtension.class)
@DisplayName("RegionalSyncService service tests")
class RegionalSyncServiceTest {

    @Mock
    private IntegradorRegionaisClient integradorRegionaisClient;

    @Mock
    private RegionalRepository regionalRepository;

    @InjectMocks
    private RegionalSyncService regionalSyncService;

    @Test
    @DisplayName("loads RegionalSyncService via reflection")
    void loadsClass() {
        assertDoesNotThrow(() -> Class.forName("com.douglasrohden.backend.service.RegionalSyncService"));
    }

    @Nested
    @DisplayName("scenarios to implement for service")
    class Scenarios {

        @Test
        @DisplayName("sync should inactivate old and create new when name changed")
        void sync_ShouldInactivateOldAndCreateNew_WhenNameChanged() {
            // Arrange: Simula situação onde nome mudou - agora deve inativar antigo e criar
            // novo
            var remoteDto = new IntegradorRegionalDto(1, "Novo Nome Regional", true);
            when(integradorRegionaisClient.fetchRegionais()).thenReturn(List.of(remoteDto));

            var existingRegional = Regional.builder().id(1L).externalId(1).nome("Nome Antigo").ativo(true).build();
            when(regionalRepository.findAllByAtivoTrue()).thenReturn(List.of(existingRegional));

            // Act
            var result = regionalSyncService.sync();

            // Assert: Agora deve inativar antigo e criar novo
            verify(regionalRepository).saveAll(argThat(regions -> {
                List<Regional> list = new ArrayList<>();
                regions.forEach(list::add);
                assertThat(list).hasSize(2); // 2 operações: inativar + criar

                // Primeiro: inativar antigo
                var inactivated = list.stream().filter(r -> !r.isAtivo()).findFirst().orElse(null);
                assertThat(inactivated).isNotNull();
                assertThat(inactivated.getExternalId()).isEqualTo(1);
                assertThat(inactivated.getNome()).isEqualTo("Nome Antigo");

                // Segundo: criar novo
                var created = list.stream().filter(r -> r.isAtivo()).findFirst().orElse(null);
                assertThat(created).isNotNull();
                assertThat(created.getExternalId()).isEqualTo(1);
                assertThat(created.getNome()).isEqualTo("Novo Nome Regional");
                assertThat(created.getId()).isNull(); // Novo registro, id será gerado

                return true;
            }));

            assertThat(result.inserted()).isEqualTo(0); // 0 porque não inseriu novo do zero
            assertThat(result.inactivated()).isEqualTo(0); // 0 porque não inativou ausente
            assertThat(result.changed()).isEqualTo(1); // 1 porque mudou (inativou + criou)
        }

        @Test
        @DisplayName("sync should fail safe when integrator is unavailable")
        void sync_ShouldFailSafe_WhenIntegratorUnavailable() {
            // Arrange
            when(integradorRegionaisClient.fetchRegionais())
                    .thenThrow(new RestClientException("Connection timeout"));

            // Act & Assert
            assertThatThrownBy(() -> regionalSyncService.sync())
                    .isInstanceOf(org.springframework.web.server.ResponseStatusException.class)
                    .hasMessageContaining("Sistema de regionais da Polícia Civil indisponível");

            // Verify: Não alterou nada no banco
            verify(regionalRepository, never()).saveAll(any());
        }

        @Test
        @DisplayName("sync should insert new when not exists locally")
        void sync_ShouldInsertNew_WhenNotExistsLocally() {
            // Arrange
            var remoteDto = new IntegradorRegionalDto(1, "Regional Nova", true);
            when(integradorRegionaisClient.fetchRegionais()).thenReturn(List.of(remoteDto));
            when(regionalRepository.findAllByAtivoTrue()).thenReturn(List.of()); // Nenhum ativo

            // Act
            var result = regionalSyncService.sync();

            // Assert
            verify(regionalRepository).saveAll(argThat(regions -> {
                List<Regional> list = new ArrayList<>();
                regions.forEach(list::add);
                assertThat(list).hasSize(1);
                var saved = list.get(0);
                assertThat(saved.getExternalId()).isEqualTo(1);
                assertThat(saved.getNome()).isEqualTo("Regional Nova");
                assertThat(saved.isAtivo()).isTrue();
                assertThat(saved.getId()).isNull(); // Novo registro
                return true;
            }));

            assertThat(result.inserted()).isEqualTo(1);
            assertThat(result.inactivated()).isEqualTo(0);
            assertThat(result.changed()).isEqualTo(0);
        }

        @Test
        @DisplayName("sync should inactivate when not in remote")
        void sync_ShouldInactivate_WhenNotInRemote() {
            // Arrange
            when(integradorRegionaisClient.fetchRegionais()).thenReturn(List.of()); // Nenhum remoto

            var localRegional = Regional.builder().id(1L).externalId(1).nome("Regional Local").ativo(true).build();
            when(regionalRepository.findAllByAtivoTrue()).thenReturn(List.of(localRegional));

            // Act
            var result = regionalSyncService.sync();

            // Assert
            verify(regionalRepository).saveAll(argThat(regions -> {
                List<Regional> list = new ArrayList<>();
                regions.forEach(list::add);
                assertThat(list).hasSize(1);
                var saved = list.get(0);
                assertThat(saved.getExternalId()).isEqualTo(1);
                assertThat(saved.getNome()).isEqualTo("Regional Local");
                assertThat(saved.isAtivo()).isFalse();
                return true;
            }));

            assertThat(result.inserted()).isEqualTo(0);
            assertThat(result.inactivated()).isEqualTo(1);
            assertThat(result.changed()).isEqualTo(0);
        }
    }
}
