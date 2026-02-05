import { describe, it, expect, vi, beforeEach } from "vitest";
import { authFacade } from "../AuthFacade";
import { authService } from "../../services/authService";

vi.mock("../../services/authService", () => ({
  authService: {
    login: vi.fn(),
    refresh: vi.fn(),
  },
}));

describe("AuthFacade", () => {
  beforeEach(() => {
    localStorage.clear();
    authFacade.logout();
    authFacade.initialized$.next(false);
  });

  it("deve autenticar e manter access token em memória", async () => {
    (authService.login as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      accessToken: "access.token",
      expiresIn: 300,
    });

    const ok = await authFacade.login("admin", "admin");

    expect(ok).toBe(true);
    expect(authFacade.isAuthenticated$.getValue()).toBe(true);
    expect(authFacade.accessToken$.getValue()).toBe("access.token");
    expect(localStorage.getItem("accessToken")).toBeNull();
  });

  it("deve restaurar sessão via refresh cookie", async () => {
    localStorage.setItem("user", "admin");
    (authService.refresh as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      accessToken: "access.from.refresh",
      expiresIn: 300,
    });

    await authFacade.init();

    expect(authFacade.isAuthenticated$.getValue()).toBe(true);
    expect(authFacade.accessToken$.getValue()).toBe("access.from.refresh");
  });
});
