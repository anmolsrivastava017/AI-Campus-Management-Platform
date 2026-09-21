const { createServer } = require("http");
const next = require("next");
const { Server } = require("socket.io");
const { setSocketIO } = require("./lib/socket-server.ts");
const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;

const app = next({
  dev,
  hostname,
  port,
});

const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req: any, res: any) => {
    handle(req, res);
  });

  const io = new Server(httpServer);

  setSocketIO(io);

  io.on("connection", (socket: any) => {
    console.log("🔌 Client connected:", socket.id);

    socket.on("join:user", (userId: number) => {
      socket.join(`user:${userId}`);

      console.log(`👤 User ${userId} joined their room`);
    });

    socket.on("disconnect", () => {
      console.log("❌ Client disconnected:", socket.id);
    });
  });

  httpServer.listen(port, () => {
    console.log(`🚀 Server running at http://${hostname}:${port}`);
  });
});