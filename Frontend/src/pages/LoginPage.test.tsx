import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import LoginPage from "./LoginPage";
import { BrowserRouter } from "react-router-dom";
import { authFacade } from "../facades/auth.facade";

vi.mock("../facades/auth.facade", () => {
    return {
        authFacade: {
            login: vi.fn(),
        },
    };
});

describe("LoginPage", () => {
    it("renders login form correctly", () => {
        vi.spyOn(authFacade, "login").mockResolvedValue({} as never);

        render(
            <BrowserRouter>
                <LoginPage />
            </BrowserRouter>
        );

        expect(screen.getByLabelText(/usuário/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /entrar/i })).toBeInTheDocument();
    });

    it("calls login function on form submission", async () => {
        const loginMock = vi.fn().mockResolvedValue(true);
        vi.spyOn(authFacade, "login").mockImplementation(loginMock);

        render(
            <BrowserRouter>
                <LoginPage />
            </BrowserRouter>
        );

        fireEvent.change(screen.getByLabelText(/usuário/i), { target: { value: "admin" } });
        fireEvent.change(screen.getByLabelText(/senha/i), { target: { value: "password" } });
        fireEvent.click(screen.getByRole("button", { name: /entrar/i }));

        await waitFor(() => {
            expect(loginMock).toHaveBeenCalledWith("admin", "password");
        });
    });

    it("displays error message on login failure", async () => {
        const loginMock = vi.fn().mockRejectedValue(new Error("Login failed"));
        vi.spyOn(authFacade, "login").mockImplementation(loginMock);

        render(
            <BrowserRouter>
                <LoginPage />
            </BrowserRouter>
        );

        fireEvent.change(screen.getByLabelText(/usuário/i), { target: { value: "admin" } });
        fireEvent.change(screen.getByLabelText(/senha/i), { target: { value: "wrong" } });
        fireEvent.click(screen.getByRole("button", { name: /entrar/i }));

        await waitFor(() => {
            expect(screen.getByText(/falha no login/i)).toBeInTheDocument();
        });
    });
});
