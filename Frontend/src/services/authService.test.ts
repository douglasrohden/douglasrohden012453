import { describe, it, expect, vi, beforeEach } from "vitest";
import { authService } from "./authService";
import { rawApi } from "../api/client";

// Mock do axios client
vi.mock("../api/client", () => ({
    rawApi: {
        post: vi.fn(),
    },
}));

describe("authService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should call login api endpoint", async () => {
        const mockResponse = { data: { accessToken: "abc", refreshToken: "def", expiresIn: 300 } };
        (rawApi.post as any).mockResolvedValue(mockResponse);

        const result = await authService.login("user", "pass");

        expect(rawApi.post).toHaveBeenCalledWith("/autenticacao/login", { username: "user", password: "pass" });
        expect(result).toEqual(mockResponse.data);
    });

    it("should call refresh api endpoint", async () => {
        const mockResponse = { data: { accessToken: "new_abc", refreshToken: "new_def", expiresIn: 300 } };
        (rawApi.post as any).mockResolvedValue(mockResponse);

        const result = await authService.refresh("old_token");

        expect(rawApi.post).toHaveBeenCalledWith("/autenticacao/refresh", { refreshToken: "old_token" });
        expect(result).toEqual(mockResponse.data);
    });
});
