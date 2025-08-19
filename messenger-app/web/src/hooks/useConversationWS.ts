import { useEffect, useRef } from "react";

function buildWsUrl(path: string) {
  const base = (import.meta.env.VITE_WS_URL as string) || "/ws";
  const origin = window.location.origin.replace(/^http/, "ws");
  return (base.startsWith("ws") ? base : origin + base) + path;
}

export function useConversationWS(
  conversationId: string,
  token: string | null,
  onEvent?: (data: any) => void
) {
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef(0);
  const stoppedRef = useRef(false);

  useEffect(() => {
    if (!conversationId || !token) return;
    stoppedRef.current = false;

    const connect = () => {
      const query = `?token=${encodeURIComponent(token)}&conversation_id=${encodeURIComponent(conversationId)}`;
      const url = buildWsUrl(query);
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        retryRef.current = 0;
      };

      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);
          if (data?.type === "ping") {
            ws.send(JSON.stringify({ type: "pong" }));
            return;
          }
          onEvent?.(data);
        } catch {
          /* ignore */
        }
      };

      const scheduleReconnect = () => {
        if (stoppedRef.current) return;
        const delay = Math.min(30000, 1000 * Math.pow(2, retryRef.current++));
        setTimeout(connect, delay);
      };

      ws.onerror = scheduleReconnect;
      ws.onclose = scheduleReconnect;
    };

    connect();

    return () => {
      stoppedRef.current = true;
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [conversationId, token, onEvent]);

  return wsRef.current;
}
