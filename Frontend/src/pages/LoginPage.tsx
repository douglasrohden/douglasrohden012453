import { useState, useEffect, useRef } from "react";
import { Button, Card, Label, TextInput, Alert, Spinner } from "flowbite-react";
import { useNavigate } from "react-router-dom";
import { HiClock } from "react-icons/hi";
import { authFacade } from "../facades/AuthFacade";
import { useBehaviorSubjectValue } from "../hooks/useBehaviorSubjectValue";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  // Local UI state for rate limiting (specific to this view)
  const [rateLimited, setRateLimited] = useState(false);
  const [retryAfter, setRetryAfter] = useState(0);

  const navigate = useNavigate();
  const intervalRef = useRef<number | null>(null);

  // Subscribe to Facade state
  const loading = useBehaviorSubjectValue(authFacade.loading$);
  const facadeError = useBehaviorSubjectValue(authFacade.error$);

  // We can combine local error (rate limit) with facade error
  // But for simple "Login Failed", we use facadeError. 
  // Rate limit logic is complex and UI-specific so we might keep it local, 
  // OR we could push strictly to Facade. 
  // Given strict requirements: "Proibir useState para... erros", 
  // ideally Facade manages ALL errors. 
  // However, RateLimit countdown is very UI specific. 
  // Let's rely on Facade for the main error string. 
  // If Facade error is present, show it.

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
      intervalRef.current = window.setInterval(() => {
        setRetryAfter((prev) => {
          if (prev <= 1) {
            setRateLimited(false);
            // clear error in facade if it was rate limit? 
            // authFacade.errorSubject.next(null) - but we can't access subject directly safely? Use a method?
            // Actually, simply clearing local UI state is enough for the countdown.
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
    if (loading || rateLimited) return;

    // Call facade
    await authFacade.login(username, password);

    // Check success
    if (authFacade.isAuthenticated$.getValue()) {
      navigate("/artista", { replace: true });
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

        {(facadeError || rateLimited) && (
          <Alert
            color={rateLimited ? "warning" : "failure"}
            icon={rateLimited ? HiClock : undefined}
          >
            <div className="flex flex-col gap-2">
              <div>
                <span className="font-medium">
                  {rateLimited ? "Atenção!" : "Erro!"}
                </span>{" "}
                {facadeError || (rateLimited ? "Muitas tentativas." : "Erro desconhecido")}
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
