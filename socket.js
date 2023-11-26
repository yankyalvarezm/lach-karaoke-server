// socket.js
let io;

const init = (server) => {
  const socketIo = require("socket.io")(server, {
    maxHttpBufferSize: 1e7, 
  });
  io = socketIo(server, {
    cors: {
      origin: "https://cantico.netlify.app",
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
      io.emit("toggleIsRunning", data);
    });
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
