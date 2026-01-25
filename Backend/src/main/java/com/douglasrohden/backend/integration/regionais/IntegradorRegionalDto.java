package com.douglasrohden.backend.integration.regionais;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record IntegradorRegionalDto(
        @JsonProperty("externalId") String externalId,
        @JsonProperty("id") Object id,
        @JsonProperty("nome") String nome,
        @JsonProperty("ativo") Boolean ativo
) {

    public String resolvedExternalId() {
        if (externalId != null && !externalId.isBlank()) {
            return externalId;
        }
        if (id == null) {
            return null;
        }
        String asString = String.valueOf(id);
        return asString.isBlank() ? null : asString;
    }
}
