import { useState, useEffect, useRef } from "react";
import { Button, Card, Label, TextInput, Alert, Spinner } from "flowbite-react";
import { useNavigate } from "react-router-dom";
import { HiClock } from "react-icons/hi";
import { authFacade } from "../facades/auth.facade";

interface RateLimitError extends Error {
  response?: {
    status: number;
  };
  rateLimitInfo?: {
    retryAfter: number;
    message: string;
    limitPerWindow?: number;
    windowSeconds?: number;
    limitPerMinute?: number;
    remaining?: number;
  };
}

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [retryAfter, setRetryAfter] = useState(0);

  const navigate = useNavigate();
  const intervalRef = useRef<number | null>(null);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Countdown timer for rate limit
  useEffect(() => {
    if (retryAfter > 0) {
      intervalRef.current = setInterval(() => {
        setRetryAfter((prev) => {
          if (prev <= 1) {
            setRateLimited(false);
            setError("");
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [retryAfter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await authFacade.login(username, password);
      navigate("/artista", { replace: true });
    } catch (err) {
      console.error(err);

      const rateLimitErr = err as RateLimitError & {
        code?: string;
        message?: string;
      };

      // Check if it's a rate limit error (429)
      if (rateLimitErr.response?.status === 429) {
        setRateLimited(true);
        const retrySeconds = rateLimitErr.rateLimitInfo?.retryAfter || 60;
        setRetryAfter(retrySeconds);

        const limitInfo = rateLimitErr.rateLimitInfo;
        const suffix = (() => {
          if (
            typeof limitInfo?.limitPerWindow === "number" &&
            typeof limitInfo?.windowSeconds === "number"
          ) {
            return ` (limite: ${limitInfo.limitPerWindow}/${limitInfo.windowSeconds}s)`;
          }
          if (typeof limitInfo?.limitPerMinute === "number") {
            return ` (limite: ${limitInfo.limitPerMinute}/min)`;
          }
          return "";
        })();
        setError(
          (rateLimitErr.rateLimitInfo?.message ||
            "Muitas requisições. Por favor, aguarde antes de tentar novamente.") +
            suffix,
        );
      } else {
        setRateLimited(false);

        const isNetworkError =
          rateLimitErr.code === "ERR_NETWORK" ||
          rateLimitErr.message === "Network Error";

        if (isNetworkError) {
          setError(
            "Falha de rede. Verifique sua conexão ou se o servidor está disponível.",
          );
        } else {
          setError("Falha no login. Verifique suas credenciais.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0
      ? `${mins}:${secs.toString().padStart(2, "0")}`
      : `${secs}s`;
  };

  return (
    <div className="mx-auto flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-8 md:h-screen lg:py-0 dark:bg-gray-900">
      <Card className="w-full sm:max-w-md md:mt-0 xl:p-0">
        <h1 className="text-xl leading-tight font-bold tracking-tight text-gray-900 md:text-2xl dark:text-white">
          Acesse sua conta
        </h1>

        {error && (
          <Alert
            color={rateLimited ? "warning" : "failure"}
            icon={rateLimited ? HiClock : undefined}
          >
            <div className="flex flex-col gap-2">
              <div>
                <span className="font-medium">
                  {rateLimited ? "Atenção!" : "Erro!"}
                </span>{" "}
                {error}
              </div>
              {rateLimited && retryAfter > 0 && (
                <div className="text-sm font-semibold">
                  Tente novamente em:{" "}
                  <span className="font-mono text-lg">
                    {formatTime(retryAfter)}
                  </span>
                </div>
              )}
            </div>
          </Alert>
        )}

        <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
          <div>
            <div className="mb-2 block">
              <Label htmlFor="username">Usuário</Label>
            </div>
            <TextInput
              id="username"
              placeholder="admin"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading || rateLimited}
            />
          </div>
          <div>
            <div className="mb-2 block">
              <Label htmlFor="password">Senha</Label>
            </div>
            <TextInput
              id="password"
              type="password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading || rateLimited}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || rateLimited}
          >
            {loading && (
              <Spinner size="sm" aria-label="Loading" className="me-3" light />
            )}
            {rateLimited && retryAfter > 0
              ? `Aguarde ${formatTime(retryAfter)}`
              : "Entrar"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
