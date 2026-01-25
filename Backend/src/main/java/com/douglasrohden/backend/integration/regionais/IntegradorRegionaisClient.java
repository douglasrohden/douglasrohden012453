package com.douglasrohden.backend.integration.regionais;

import java.util.List;

public interface IntegradorRegionaisClient {
    List<IntegradorRegionalDto> fetchRegionais();
}
