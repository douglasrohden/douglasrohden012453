import { useEffect, useRef } from "react";
import { useToast } from "../contexts/ToastContext";
import { notificationsFacade } from "../facades/NotificationsFacade";
import { useBehaviorSubjectValue } from "../hooks/useBehaviorSubjectValue";

export function WebSocketToasts() {
  const { addToast } = useToast();
  const lastAlbumCreated = useBehaviorSubjectValue(
    notificationsFacade.lastAlbumCreated$,
  );
  const error = useBehaviorSubjectValue(notificationsFacade.error$);
  const connected = useBehaviorSubjectValue(notificationsFacade.connected$);

  const lastAlbumIdRef = useRef<number | null>(null);
  const lastErrorRef = useRef<string | null>(null);
  const hadConnectionRef = useRef(false);
  const lastConnectionRef = useRef<boolean | null>(null);

  useEffect(() => {
    if (!lastAlbumCreated) return;
    if (lastAlbumIdRef.current === lastAlbumCreated.id) return;
    lastAlbumIdRef.current = lastAlbumCreated.id;

    const yearText = Number.isFinite(lastAlbumCreated.ano)
      ? ` (${lastAlbumCreated.ano})`
      : "";
    addToast(
      `Novo album cadastrado: ${lastAlbumCreated.titulo}${yearText}.`,
      "success",
    );
  }, [addToast, lastAlbumCreated]);

  useEffect(() => {
    if (!error) return;
    if (lastErrorRef.current === error) return;
    lastErrorRef.current = error;
    addToast(error, "error");
  }, [addToast, error]);

  useEffect(() => {
    if (lastConnectionRef.current === connected) return;
    lastConnectionRef.current = connected;

    if (connected) {
      addToast(
        hadConnectionRef.current
          ? "Notificacoes em tempo real reconectadas."
          : "Notificacoes em tempo real ativas.",
        "success",
        2000,
      );
      hadConnectionRef.current = true;
      return;
    }

    if (hadConnectionRef.current) {
      addToast(
        "Conexao de notificacoes perdida. Tentando reconectar...",
        "warning",
      );
    }
  }, [addToast, connected]);

  return null;
}
