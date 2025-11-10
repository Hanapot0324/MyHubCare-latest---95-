// backend/server.js
import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import authRoutes from "./routes/auth.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

app.use(cors());
app.use(express.json());
app.use("/api", authRoutes);

// 🔌 SOCKET.IO REALTIME CONNECTION
io.on("connection", (socket) => {
  console.log("📱 Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });

  socket.on("sendNotification", (data) => {
    console.log("📢 Notification:", data);
    // Broadcast to all clients (web + mobile)
    io.emit("newNotification", data);
  });
});

server.listen(5000, () =>
  console.log("🚀 Server + Socket.IO running on http://localhost:5000")
);
