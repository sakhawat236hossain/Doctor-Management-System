import { createServer } from "http";
import next from "next";
import { Server } from "socket.io";
import { parse } from "url";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();
const port = parseInt(process.env.PORT || "3000", 10);

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
    pingInterval: 25000,
    pingTimeout: 10000,
  });

  // Store io globally for API routes to emit events
  (globalThis as Record<string, unknown>).io = io;

  io.on("connection", (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // Join user-specific room for targeted notifications
    socket.on("join:user", (userId: string) => {
      socket.join(`user:${userId}`);
      console.log(`[Socket.io] ${socket.id} joined user:${userId}`);
    });

    // Join doctor room for queue updates
    socket.on("join:doctor", (doctorId: string) => {
      socket.join(`doctor:${doctorId}`);
      console.log(`[Socket.io] ${socket.id} joined doctor:${doctorId}`);
    });

    socket.on("leave:doctor", (doctorId: string) => {
      socket.leave(`doctor:${doctorId}`);
    });

    // Queue update events (receptionist → patients)
    socket.on("queue:updated", (data) => {
      if (data.doctorId) {
        io.to(`doctor:${data.doctorId}`).emit("queue:updated", data);
      }
    });

    // Doctor status change (doctor → receptionists)
    socket.on("doctor:status", (data) => {
      io.emit("doctor:status", data);
    });

    socket.on("disconnect", (reason) => {
      console.log(`[Socket.io] Client disconnected: ${socket.id} (${reason})`);
    });
  });

  server.listen(port, () => {
    console.log(`> MediFlow ready on http://localhost:${port}`);
    console.log(`> Socket.io server active`);
    console.log(`> Environment: ${dev ? "development" : "production"}`);
  });
});
