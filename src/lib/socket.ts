import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const url = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
    socket = io(url, {
      autoConnect: false,
      transports: ["websocket", "polling"],
    });
  }
  return socket;
}

export function connectSocket(): Socket {
  const client = getSocket();
  if (!client.connected) {
    client.connect();
  }
  return client;
}

export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
}

export const SOCKET_EVENTS = {
  QUEUE_UPDATED: "queue:updated",
  DOCTOR_STATUS: "doctor:status",
  QUEUE_UPDATE: "queue:update",
  APPOINTMENT_UPDATE: "appointment:update",
  NOTIFICATION: "notification",
  JOIN_DOCTOR_ROOM: "join:doctor",
  LEAVE_DOCTOR_ROOM: "leave:doctor",
} as const;

export type SocketEvent = keyof typeof SOCKET_EVENTS;

/**
 * Server-side socket emitter for API routes.
 * Connects to the socket.io server as an admin client to broadcast events.
 *
 * For production (Railway/Vercel), run a separate socket.io server
 * and set SOCKET_SERVER_URL env var. Use this custom server.ts:
 *
 * ```ts
 * // server.ts (run with: tsx server.ts)
 * import { createServer } from "http";
 * import next from "next";
 * import { Server } from "socket.io";
 *
 * const dev = process.env.NODE_ENV !== "production";
 * const app = next({ dev });
 * const handle = app.getRequestHandler();
 * const port = parseInt(process.env.PORT || "3000", 10);
 *
 * app.prepare().then(() => {
 *   const server = createServer((req, res) => handle(req, res));
 *   const io = new Server(server, { cors: { origin: "*" } });
 *
 *   io.on("connection", (socket) => {
 *     console.log("Client connected:", socket.id);
 *     socket.on("disconnect", () => console.log("Client disconnected:", socket.id));
 *   });
 *
 *   // Expose io globally for API routes
 *   (global as any).io = io;
 *
 *   server.listen(port, () => console.log(`> Ready on http://localhost:${port}`));
 * });
 * ```
 */
export function emitServerEvent(event: string, data: unknown): void {
  // In a custom server setup, use (globalThis as any).io?.emit(event, data)
  // For API routes without custom server, this is a no-op
  const io = (globalThis as Record<string, unknown>).io as { emit?: (event: string, data: unknown) => void } | undefined;
  if (io?.emit) {
    io.emit(event, data);
  }
}
