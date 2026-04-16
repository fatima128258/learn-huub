import { Server } from "socket.io";

let io;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join", (userId) => {
      console.log("User joined room:", userId);
      socket.join(userId);
    });

    socket.on("sendMessage", (data) => {
      console.log("Sending message:", data);
     
      io.to(data.receiverId).emit("newMessage", data);
      io.to(data.senderId).emit("newMessage", data);
    });

    socket.on("deleteMessage", (data) => {
      io.to(data.receiverId).emit("messageDeleted", data);
      if (data.senderId) {
        io.to(data.senderId).emit("messageDeleted", data);
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};
