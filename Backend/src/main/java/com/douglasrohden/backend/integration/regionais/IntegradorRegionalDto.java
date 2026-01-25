package com.douglasrohden.backend.integration.regionais;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record IntegradorRegionalDto(
        @JsonProperty("id") Object id,
        @JsonProperty("nome") String nome,
        @JsonProperty("ativo") Boolean ativo
) {

    public Integer resolvedId() {
        if (id == null) {
            return null;
        }

        String asString = String.valueOf(id).trim();
        if (asString.isEmpty()) {
            return null;
        }

        try {
            return Integer.valueOf(asString);
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
