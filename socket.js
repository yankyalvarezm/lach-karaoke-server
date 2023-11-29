// socket.js
let io;
let isRunning = false;
let activeSession = null;
let queueSongs = null;

const Perfom = require('./models/Perform.model')
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
    // console.log(`Socket user Connected:, ${socket.id}`);

    socket.on("update_session", (data) => {
      // console.log("Socket Session:", data);
    });

    // socket.on("setQueue", (data) => {
    //   console.log("Updating queue", data);
    //   queueSongs = data.queueSongs;
    // });
    // socket.on("getQueue", () => {
    //   io.emit("getQueue",{queueSongs})
    // })

    socket.on("toggleIsRunning", (data) => {
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

    // socket.on("requestQueueSongs", async () => {
    //   try {
    //     // Suponiendo que 'Perfom' es tu modelo y que 'activeSession' tiene la ID de la sesión actual
    //     let performs = await Perfom.find({
    //       session: activeSession && activeSession._id,
    //       isQueue: true,
    //       isPlayed: false,
    //     });

    //     performs = await Promise.all(performs.map(async (perfom) => {
    //       if (perfom.user) {
    //         await perfom.populate("user");
    //       } else if (perfom.tempUser) {
    //         await perfom.populate("tempUser");
    //       }
    //       return perfom;
    //     }));

    //     // Aquí, deberías realizar cualquier lógica adicional necesaria,
    //     // como 'populate', si es necesario.

    //     io.emit("update_queue", performs); // Emite los datos actualizados
    //   } catch (error) {
    //     console.error("Error al obtener queueSongs:", error);
    //   }
    // });

    // socket.on("update_queue", () => {
    //   io.emit("update_queue", { queueSongs });
    // });

    // socket.on("requestQueueSongs", () => {
    //   // Aquí emitirías el estado actual de queueSongs
    //   io.emit("update_queue", queueSongs);
    // });
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
