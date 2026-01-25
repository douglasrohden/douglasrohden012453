import { BehaviorSubject } from "rxjs";
import { authService, LoginResponse } from "../services/authService";
import api from "../api/client";

interface User {
    username: string;
    // Add other user properties if available/needed (e.g., roles)
}

class AuthFacade {
    private userSubject = new BehaviorSubject<User | null>(null);
    private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
    private loadingSubject = new BehaviorSubject<boolean>(false);
    private errorSubject = new BehaviorSubject<string | null>(null);

    // Expose Observables as BehaviorSubjects so hooks can read current value synchronously
    // Components should NOT call .next() on these directly; use Facade methods instead.
    get user$() { return this.userSubject; }
    get isAuthenticated$() { return this.isAuthenticatedSubject; }
    get loading$() { return this.loadingSubject; }
    get error$() { return this.errorSubject; }

    constructor() {
        this.init();
    }

    init() {
        // Restore session from localStorage on app start
        const token = localStorage.getItem("accessToken");
        const userStr = localStorage.getItem("user");

        if (token) {
            if (userStr) {
                try {
                    // If user string is just a username, treat it as { username: ... }
                    // or parse if it's JSON. The previous service just stored "user".
                    // Let's assume it might be a JSON object or a string.
                    // For safety, let's treat it as username for now if it's a simple string.
                    // Adjust based on how backend actually returns user info if distinct from login.
                    // The LoginResponse doesn't explicitly return User object, just tokens.
                    // We'll rely on what was stored.
                    this.userSubject.next({ username: userStr });
                } catch (e) {
                    console.error("Failed to parse user", e);
                }
            }
            this.isAuthenticatedSubject.next(true);
            // Ensure axios has the token (redundant if using interceptor, but good for safety)
            api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        }
    }

    async login(username: string, password: string) {
        this.loadingSubject.next(true);
        this.errorSubject.next(null);

        try {
            const data: LoginResponse = await authService.login(username, password);

            this.handleSession(data, username);
        } catch (err: any) {
            console.error("Login failed", err);
            this.errorSubject.next(err.response?.data?.message || "Login failed");
            this.isAuthenticatedSubject.next(false);
        } finally {
            this.loadingSubject.next(false);
        }
    }

    logout() {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");

        delete api.defaults.headers.common["Authorization"];

        this.userSubject.next(null);
        this.isAuthenticatedSubject.next(false);
        this.errorSubject.next(null);
    }

    private handleSession(data: LoginResponse, username: string) {
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        localStorage.setItem("user", username); // Storing username as "user" for now

        api.defaults.headers.common["Authorization"] = `Bearer ${data.accessToken}`;

        this.userSubject.next({ username });
        this.isAuthenticatedSubject.next(true);
    }

    // Optional: wrapper to update token manually if needed
    updateToken(token: string) {
        localStorage.setItem("accessToken", token);
        this.isAuthenticatedSubject.next(true);
    }
}

export const authFacade = new AuthFacade();
