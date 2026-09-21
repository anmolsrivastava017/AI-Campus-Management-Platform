import type { Server as SocketIOServer } from "socket.io";

declare global {
  var socketIO: SocketIOServer | undefined;
}

export function setSocketIO(io: SocketIOServer) {
  globalThis.socketIO = io;
}

export function getSocketIO() {
  return globalThis.socketIO;
}