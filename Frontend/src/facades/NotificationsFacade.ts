import { BehaviorSubject } from "rxjs";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { albumsFacade } from "./AlbumsFacade";
import { artistsFacade } from "./ArtistsFacade";

export type AlbumCreatedMessage = {
  id: number;
  titulo: string;
  ano?: number;
};

export type NotificationItem =
  | {
    type: "album.created";
    createdAt: number;
    payload: AlbumCreatedMessage;
    read: boolean;
  };

function getWebSocketUrl(): string {
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8080";
  const root = apiBase.endsWith("/v1") ? apiBase.slice(0, -3) : apiBase;
  return `${root}/ws`;
}

class NotificationsFacade {
  readonly notifications$ = new BehaviorSubject<NotificationItem[]>([]);
  readonly unreadCount$ = new BehaviorSubject<number>(0);
  readonly connected$ = new BehaviorSubject<boolean>(false);
  readonly error$ = new BehaviorSubject<string | null>(null);

  // Last event (useful for lightweight UI reactions)
  readonly lastAlbumCreated$ = new BehaviorSubject<AlbumCreatedMessage | null>(
    null,
  );

  private client: Client | null = null;
  private started = false;

  connect(): void {
    if (this.started) return;
    this.started = true;

    const client = new Client({
      webSocketFactory: () => new SockJS(getWebSocketUrl()),
      reconnectDelay: 3000,
      onConnect: () => {
        this.connected$.next(true);
        this.error$.next(null);

        client.subscribe("/topic/albuns/created", (message) => {
          try {
            const data = JSON.parse(message.body) as AlbumCreatedMessage;
            if (!data || typeof data.id !== "number") return;

            this.lastAlbumCreated$.next(data);

            const next: NotificationItem = {
              type: "album.created",
              createdAt: Date.now(),
              payload: data,
              read: false,
            };

            const current = this.notifications$.getValue();
            const updated = [next, ...current].slice(0, 50);
            this.notifications$.next(updated);
            this.unreadCount$.next(updated.filter((n) => !n.read).length);

            // refletir na UI automaticamente
            albumsFacade.refresh();
            artistsFacade.refresh();
          } catch {
            // ignore invalid payload
          }
        });
      },
      onDisconnect: () => {
        this.connected$.next(false);
      },
      onStompError: () => {
        this.error$.next("Falha ao conectar notificações");
      },
      onWebSocketError: () => {
        this.error$.next("Falha ao conectar WebSocket");
      },
    });

    this.client = client;
    client.activate();
  }

  disconnect(): void {
    this.started = false;
    const client = this.client;
    this.client = null;
    this.connected$.next(false);
    if (client) {
      void client.deactivate();
    }
  }

  markAllRead(): void {
    const updated = this.notifications$.getValue().map((n) => ({
      ...n,
      read: true,
    }));
    this.notifications$.next(updated);
    this.unreadCount$.next(0);
  }

  clear(): void {
    this.notifications$.next([]);
    this.unreadCount$.next(0);
    this.lastAlbumCreated$.next(null);
  }
}

export const notificationsFacade = new NotificationsFacade();
