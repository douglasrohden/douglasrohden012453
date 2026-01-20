import { useState } from "react";
import { Button, Card, Label, TextInput, Alert, Spinner } from "flowbite-react";
import { useAuth } from "../contexts/AuthContext";
import { authService } from "../services/authService";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const data = await authService.login(username, password);
            // Pass the token, refreshToken, and username to context login
            login(data.accessToken, data.refreshToken, username);
            navigate("/");
        } catch (err) {
            console.error(err);
            setError("Falha no login. Verifique suas credenciais.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0 bg-gray-50 dark:bg-gray-900">
            <Card className="w-full md:mt-0 sm:max-w-md xl:p-0">
                <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
                    Acesse sua conta
                </h1>

                {error && (
                    <Alert color="failure">
                        <span className="font-medium">Erro!</span> {error}
                    </Alert>
                )}

                <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <div className="mb-2 block">
                            <Label htmlFor="username" value="Usuário" />
                        </div>
                        <TextInput
                            id="username"
                            placeholder="admin"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                    <div>
                        <div className="mb-2 block">
                            <Label htmlFor="password" value="Senha" />
                        </div>
                        <TextInput
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading && <Spinner size="sm" aria-label="Loading" className="me-3" light />}
                        Entrar
                    </Button>
                </form>
            </Card>
        </div>
    );
}
