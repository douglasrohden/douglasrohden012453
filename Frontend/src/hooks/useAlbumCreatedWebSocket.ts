import { useEffect } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

export type AlbumCreatedMessage = {
  id: number;
  titulo: string;
  ano?: number;
};

function getWebSocketUrl() {
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:3001/v1";
  const root = apiBase.endsWith("/v1") ? apiBase.slice(0, -3) : apiBase;
  return `${root}/ws`;
}

export function useAlbumCreatedWebSocket(onAlbumCreated: (msg: AlbumCreatedMessage) => void) {
  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(getWebSocketUrl()),
      reconnectDelay: 3000,
      onConnect: () => {
        client.subscribe("/topic/albuns/created", (message) => {
          try {
            const data = JSON.parse(message.body) as AlbumCreatedMessage;
            onAlbumCreated(data);
          } catch {
            // ignore invalid payload
          }
        });
      },
    });

    client.activate();

    return () => {
      client.deactivate();
    };
  }, [onAlbumCreated]);
}
