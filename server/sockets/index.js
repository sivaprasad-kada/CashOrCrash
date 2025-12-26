import { Server } from "socket.io";

export function initSocket(server) {
  const io = new Server(server, {
    cors: { origin: "*" }
  });

  io.on("connection", socket => {
    console.log("Client connected");

    socket.on("bid-confirmed", payload => {
      io.emit("flip-all", payload);
    });

    socket.on("reveal-question", payload => {
      io.emit("reveal-question", payload);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });
  });
}
