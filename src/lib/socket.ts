import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const url = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";
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
  QUEUE_UPDATE: "queue:update",
  APPOINTMENT_UPDATE: "appointment:update",
  NOTIFICATION: "notification",
  JOIN_DOCTOR_ROOM: "join:doctor",
  LEAVE_DOCTOR_ROOM: "leave:doctor",
} as const;

export type SocketEvent = keyof typeof SOCKET_EVENTS;
