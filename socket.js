// socket.js
let io;
let isRunning = false;
let activeSession = null;
// let queueSongs = null;

const Perfom = require("./models/Perform.model");
const Song = require("./models/Songs.model");

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

    socket.on("update_session", (data) => {
      // console.log("Socket Session:", data);
    });

    socket.on("toggleIsRunning", (data) => {
      console.log('toggleisRinninug ====>', data.isRunning)
      isRunning = data.isRunning;
      io.emit("toggleIsRunning", data);

    });

    socket.on("getIsRunning", () => {
      io.emit("getIsRunning", { isRunning });
    });

    socket.on("setActiveSession", (data) => {
      activeSession = data.activeSession;
    });
    socket.on("getActiveSession", () => {
      io.emit("getActiveSession", { activeSession });
    });

    socket.on("toggleIsPlaying", (data) => {
      io.emit("toggleIsPlaying", data);
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
