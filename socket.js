// socket.js
let io;
let isRunning = false;
const init = (server) => {
  const socketIo = require("socket.io");
  io = socketIo(server, {
    cors: {
      origin: process.env.REACT_APP_URI,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`Socket user Connected:, ${socket.id}`);

    socket.on("update_session", (data) => {
      console.log("Socket Session:", data);
    });

    socket.on("toggleIsRunning", (data) => {
      isRunning=data.isRunning
      io.emit("toggleIsRunning", data);
    });

    socket.on("getIsRunning", () => {
      io.emit("getIsRunning", {isRunning})
    })
  });

  return io;
};

const getIo = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

module.exports = { init, getIo };
