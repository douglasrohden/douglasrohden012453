import axios from "axios";
import { describe, it, expect, beforeEach, vi } from "vitest";

describe("httpClient", () => {
  beforeEach(() => {
    // reset modules to ensure httpClient picks up the custom adapter
    vi.resetModules();
  });

  it("deve tentar refresh e reprocessar requisição após 401", async () => {
    let calls = 0;
    const adapter = async (config: any) => {
      calls += 1;
      if (calls === 1) {
        return {
          status: 401,
          statusText: "Unauthorized",
          data: {},
          headers: {},
          config,
        };
      }
      return {
        status: 200,
        statusText: "OK",
        data: { ok: true },
        headers: {},
        config,
      };
    };

    axios.defaults.adapter = adapter;
    const { attachAuthAdapter } = await import("../authAdapter");
    const { default: http } = await import("../httpClient");

    attachAuthAdapter({
      getAccessToken: () => "old-token",
      getRefreshToken: () => null,
      refreshTokens: async () => ({ accessToken: "new-token" }),
      onTokensUpdated: () => {},
    });

    const response = await http.get("/artistas");

    expect(response.status).toBe(200);
    expect(response.data.ok).toBe(true);
  });
});
